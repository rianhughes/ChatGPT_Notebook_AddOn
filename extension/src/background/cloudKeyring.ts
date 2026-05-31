import browser from "../browser/extensionApi";
import {
  CLOUD_ENCRYPTION_VERSION,
  CLOUD_PASSPHRASE_KDF_ITERATIONS,
  CLOUD_RECOVERY_KDF_ITERATIONS,
  base64ToBytes,
  bytesToBase64,
  createMasterKeyBytes,
  deriveAesKwKeyFromSecret,
  unwrapRawKeyBytes,
  wrapRawKeyBytes,
  randomBytes,
} from "../core/cryptoCloud";
import { assertValidRecoveryPhrase, generateRecoveryPhrase, normalizeRecoveryPhrase } from "../core/recoveryPhrase";
import {
  clearCloudLastDecryptError,
  markCloudEncryptionConfigured,
  markCloudEncryptionLocked,
  markCloudLastDecryptError,
} from "../core/repository";
import { getSupabaseClient, getSupabaseCloudConfig, getSupabaseSession } from "./cloudSupabase";

const CLOUD_MASTER_KEY_SESSION_KEY = "chatgpt-notebook-cloud-master-key";
const SALT_LENGTH_BYTES = 16;

type CloudKeyringRow = {
  user_id: string;
  key_version: number;
  wrap_alg: "A256KW";
  passphrase_kdf: "PBKDF2-SHA256";
  passphrase_salt_b64: string;
  passphrase_iterations: number;
  passphrase_wrapped_mk_b64: string;
  recovery_kdf: "PBKDF2-SHA256";
  recovery_salt_b64: string;
  recovery_iterations: number;
  recovery_wrapped_mk_b64: string;
  recovery_phrase_format: "words24-v1";
  created_at?: string;
  updated_at?: string;
};

type CloudMasterKeySessionValue = {
  userId: string;
  keyVersion: number;
  masterKeyB64: string;
  unlockedAt: string;
};

const memorySessionCache = new Map<string, unknown>();

export async function setupEncryptedCloudSync(passphrase: string): Promise<{ recoveryPhrase: string; keyVersion: number }> {
  const normalizedPassphrase = normalizePassphrase(passphrase);
  const sessionContext = await requireCloudSession();
  const existing = await getCloudKeyringRowForUser(sessionContext.userId);

  if (existing) {
    throw new Error("Encrypted cloud sync is already configured for this account.");
  }

  const recoveryPhrase = generateRecoveryPhrase();
  const normalizedRecoveryPhrase = normalizeRecoveryPhrase(recoveryPhrase);
  const masterKey = createMasterKeyBytes();
  const passphraseSalt = randomBytes(SALT_LENGTH_BYTES);
  const recoverySalt = randomBytes(SALT_LENGTH_BYTES);
  const passphraseWrappingKey = await deriveAesKwKeyFromSecret({
    secret: normalizedPassphrase,
    salt: passphraseSalt,
    iterations: CLOUD_PASSPHRASE_KDF_ITERATIONS,
  });
  const recoveryWrappingKey = await deriveAesKwKeyFromSecret({
    secret: normalizedRecoveryPhrase,
    salt: recoverySalt,
    iterations: CLOUD_RECOVERY_KDF_ITERATIONS,
  });
  const row: CloudKeyringRow = {
    user_id: sessionContext.userId,
    key_version: 1,
    wrap_alg: "A256KW",
    passphrase_kdf: "PBKDF2-SHA256",
    passphrase_salt_b64: bytesToBase64(passphraseSalt),
    passphrase_iterations: CLOUD_PASSPHRASE_KDF_ITERATIONS,
    passphrase_wrapped_mk_b64: bytesToBase64(await wrapRawKeyBytes(passphraseWrappingKey, masterKey)),
    recovery_kdf: "PBKDF2-SHA256",
    recovery_salt_b64: bytesToBase64(recoverySalt),
    recovery_iterations: CLOUD_RECOVERY_KDF_ITERATIONS,
    recovery_wrapped_mk_b64: bytesToBase64(await wrapRawKeyBytes(recoveryWrappingKey, masterKey)),
    recovery_phrase_format: "words24-v1",
  };

  const { error } = await sessionContext.supabase.from(sessionContext.config.keyringTable).upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    throw error;
  }

  await markCloudEncryptionConfigured({
    enabled: true,
    version: CLOUD_ENCRYPTION_VERSION,
    keyVersion: row.key_version,
    locked: false,
  });
  await clearCloudLastDecryptError();
  await cacheUnlockedMasterKey({
    userId: sessionContext.userId,
    keyVersion: row.key_version,
    masterKey,
  });

  return {
    recoveryPhrase,
    keyVersion: row.key_version,
  };
}

export async function unlockCloudSyncWithPassphrase(passphrase: string): Promise<{ keyVersion: number }> {
  const normalizedPassphrase = normalizePassphrase(passphrase);
  const sessionContext = await requireCloudSession();
  const keyring = await getCloudKeyringRowForUser(sessionContext.userId);

  if (!keyring) {
    throw new Error("Encrypted cloud sync is not configured for this account.");
  }

  const masterKey = await unwrapMasterKeyFromPassphrase(keyring, normalizedPassphrase);

  await markCloudEncryptionConfigured({
    enabled: true,
    version: CLOUD_ENCRYPTION_VERSION,
    keyVersion: keyring.key_version,
    locked: false,
  });
  await clearCloudLastDecryptError();
  await cacheUnlockedMasterKey({
    userId: sessionContext.userId,
    keyVersion: keyring.key_version,
    masterKey,
  });

  return {
    keyVersion: keyring.key_version,
  };
}

export async function unlockCloudSyncWithRecoveryPhrase(recoveryPhrase: string): Promise<{ keyVersion: number }> {
  const normalizedRecoveryPhrase = assertValidRecoveryPhrase(recoveryPhrase);
  const sessionContext = await requireCloudSession();
  const keyring = await getCloudKeyringRowForUser(sessionContext.userId);

  if (!keyring) {
    throw new Error("Encrypted cloud sync is not configured for this account.");
  }

  const masterKey = await unwrapMasterKeyFromRecoveryPhrase(keyring, normalizedRecoveryPhrase);

  await markCloudEncryptionConfigured({
    enabled: true,
    version: CLOUD_ENCRYPTION_VERSION,
    keyVersion: keyring.key_version,
    locked: false,
  });
  await clearCloudLastDecryptError();
  await cacheUnlockedMasterKey({
    userId: sessionContext.userId,
    keyVersion: keyring.key_version,
    masterKey,
  });

  return {
    keyVersion: keyring.key_version,
  };
}

export async function rotateCloudSyncPassphrase(input: {
  currentPassphrase?: string;
  newPassphrase: string;
}): Promise<{ keyVersion: number }> {
  const normalizedNextPassphrase = normalizePassphrase(input.newPassphrase);
  const sessionContext = await requireCloudSession();
  const keyring = await getCloudKeyringRowForUser(sessionContext.userId);

  if (!keyring) {
    throw new Error("Encrypted cloud sync is not configured for this account.");
  }

  const cachedMasterKey = await getUnlockedMasterKeyForUser(sessionContext.userId, keyring.key_version);
  const masterKey =
    cachedMasterKey ??
    (input.currentPassphrase
      ? await unwrapMasterKeyFromPassphrase(keyring, normalizePassphrase(input.currentPassphrase))
      : null);

  if (!masterKey) {
    throw new Error("Unlock cloud sync before rotating the passphrase.");
  }

  const nextPassphraseSalt = randomBytes(SALT_LENGTH_BYTES);
  const nextPassphraseWrapKey = await deriveAesKwKeyFromSecret({
    secret: normalizedNextPassphrase,
    salt: nextPassphraseSalt,
    iterations: CLOUD_PASSPHRASE_KDF_ITERATIONS,
  });
  const nextWrappedMasterKey = await wrapRawKeyBytes(nextPassphraseWrapKey, masterKey);

  const { error } = await sessionContext.supabase
    .from(sessionContext.config.keyringTable)
    .update({
      passphrase_salt_b64: bytesToBase64(nextPassphraseSalt),
      passphrase_iterations: CLOUD_PASSPHRASE_KDF_ITERATIONS,
      passphrase_wrapped_mk_b64: bytesToBase64(nextWrappedMasterKey),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", sessionContext.userId);

  if (error) {
    throw error;
  }

  await markCloudEncryptionConfigured({
    enabled: true,
    version: CLOUD_ENCRYPTION_VERSION,
    keyVersion: keyring.key_version,
    locked: false,
  });
  await clearCloudLastDecryptError();
  await cacheUnlockedMasterKey({
    userId: sessionContext.userId,
    keyVersion: keyring.key_version,
    masterKey,
  });

  return {
    keyVersion: keyring.key_version,
  };
}

export async function lockCloudSync(): Promise<void> {
  await clearCachedMasterKey();
  await markCloudEncryptionLocked(true);
}

export async function clearCloudSyncSessionKey(): Promise<void> {
  await clearCachedMasterKey();
}

export async function getUnlockedMasterKeyForUser(userId: string, keyVersion?: number): Promise<Uint8Array | null> {
  const cached = await getCachedMasterKey();

  if (!cached || cached.userId !== userId) {
    return null;
  }

  if (typeof keyVersion === "number" && cached.keyVersion !== keyVersion) {
    return null;
  }

  return base64ToBytes(cached.masterKeyB64);
}

export async function getCloudKeyringStatusForUser(userId: string): Promise<{
  keyringPresent: boolean;
  keyVersion: number;
  unlocked: boolean;
}> {
  const keyring = await getCloudKeyringRowForUser(userId);

  if (!keyring) {
    return {
      keyringPresent: false,
      keyVersion: 0,
      unlocked: false,
    };
  }

  const masterKey = await getUnlockedMasterKeyForUser(userId, keyring.key_version);

  return {
    keyringPresent: true,
    keyVersion: keyring.key_version,
    unlocked: Boolean(masterKey),
  };
}

async function unwrapMasterKeyFromPassphrase(keyring: CloudKeyringRow, passphrase: string): Promise<Uint8Array> {
  try {
    const passphraseWrappingKey = await deriveAesKwKeyFromSecret({
      secret: passphrase,
      salt: base64ToBytes(keyring.passphrase_salt_b64),
      iterations: keyring.passphrase_iterations,
    });

    return unwrapRawKeyBytes(passphraseWrappingKey, base64ToBytes(keyring.passphrase_wrapped_mk_b64));
  } catch {
    await markCloudLastDecryptError("Incorrect cloud sync passphrase.");
    throw new Error("Incorrect cloud sync passphrase.");
  }
}

async function unwrapMasterKeyFromRecoveryPhrase(keyring: CloudKeyringRow, recoveryPhrase: string): Promise<Uint8Array> {
  try {
    const recoveryWrappingKey = await deriveAesKwKeyFromSecret({
      secret: recoveryPhrase,
      salt: base64ToBytes(keyring.recovery_salt_b64),
      iterations: keyring.recovery_iterations,
    });

    return unwrapRawKeyBytes(recoveryWrappingKey, base64ToBytes(keyring.recovery_wrapped_mk_b64));
  } catch {
    await markCloudLastDecryptError("Incorrect cloud sync recovery phrase.");
    throw new Error("Incorrect cloud sync recovery phrase.");
  }
}

async function getCloudKeyringRowForUser(userId: string): Promise<CloudKeyringRow | null> {
  const supabase = getSupabaseClient();
  const config = getSupabaseCloudConfig();

  if (!supabase || !config) {
    return null;
  }

  const { data, error } = await supabase
    .from(config.keyringTable)
    .select(
      "user_id, key_version, wrap_alg, passphrase_kdf, passphrase_salt_b64, passphrase_iterations, passphrase_wrapped_mk_b64, recovery_kdf, recovery_salt_b64, recovery_iterations, recovery_wrapped_mk_b64, recovery_phrase_format, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as CloudKeyringRow | null) ?? null;
}

async function requireCloudSession(): Promise<{
  userId: string;
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>;
  config: NonNullable<ReturnType<typeof getSupabaseCloudConfig>>;
}> {
  const supabase = getSupabaseClient();
  const config = getSupabaseCloudConfig();

  if (!supabase || !config) {
    throw new Error("Supabase cloud backup is not configured.");
  }

  const session = await getSupabaseSession();
  const userId = session?.user.id;

  if (!session || !userId) {
    throw new Error("Sign in with Google before using cloud backup.");
  }

  return {
    userId,
    supabase,
    config,
  };
}

function normalizePassphrase(passphrase: string): string {
  const normalized = passphrase.normalize("NFKC").trim();

  if (normalized.length < 8) {
    throw new Error("Passphrase must be at least 8 characters.");
  }

  return normalized;
}

async function cacheUnlockedMasterKey(input: {
  userId: string;
  keyVersion: number;
  masterKey: Uint8Array;
}): Promise<void> {
  const value: CloudMasterKeySessionValue = {
    userId: input.userId,
    keyVersion: input.keyVersion,
    masterKeyB64: bytesToBase64(input.masterKey),
    unlockedAt: new Date().toISOString(),
  };

  await setSessionValue(CLOUD_MASTER_KEY_SESSION_KEY, value);
}

async function clearCachedMasterKey(): Promise<void> {
  await removeSessionValue(CLOUD_MASTER_KEY_SESSION_KEY);
}

async function getCachedMasterKey(): Promise<CloudMasterKeySessionValue | null> {
  const value = await getSessionValue(CLOUD_MASTER_KEY_SESSION_KEY);

  if (!isCloudMasterKeySessionValue(value)) {
    return null;
  }

  return value;
}

function isCloudMasterKeySessionValue(value: unknown): value is CloudMasterKeySessionValue {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.userId === "string" &&
    typeof candidate.keyVersion === "number" &&
    typeof candidate.masterKeyB64 === "string" &&
    typeof candidate.unlockedAt === "string"
  );
}

async function getSessionValue(key: string): Promise<unknown> {
  if (browser.storage?.session) {
    try {
      const values = await browser.storage.session.get(key);
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return values[key];
      }
    } catch {
      // Use in-memory fallback if storage.session is unavailable for this browser profile.
    }
  }

  return memorySessionCache.get(key);
}

async function setSessionValue(key: string, value: unknown): Promise<void> {
  if (browser.storage?.session) {
    try {
      await browser.storage.session.set({ [key]: value });
      return;
    } catch {
      // Use in-memory fallback if storage.session is unavailable for this browser profile.
    }
  }

  memorySessionCache.set(key, value);
}

async function removeSessionValue(key: string): Promise<void> {
  if (browser.storage?.session) {
    try {
      await browser.storage.session.remove(key);
    } catch {
      // Fall through to in-memory removal.
    }
  }

  memorySessionCache.delete(key);
}
