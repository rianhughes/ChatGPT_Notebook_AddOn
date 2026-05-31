const AES_KEY_LENGTH_BYTES = 32;
const AES_GCM_IV_LENGTH_BYTES = 12;

export const CLOUD_ENCRYPTION_VERSION = 1;
export const CLOUD_ENCRYPTION_SCHEME = "aes-256-gcm+a256kw+pbkdf2-sha256";
export const CLOUD_PASSPHRASE_KDF_ITERATIONS = 600_000;
export const CLOUD_RECOVERY_KDF_ITERATIONS = 600_000;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type AesGcmEncryptedBytes = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
};

export function randomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Expected a positive integer byte length.");
  }

  const values = new Uint8Array(length);
  getCrypto().getRandomValues(values);
  return values;
}

export function createMasterKeyBytes(): Uint8Array {
  return randomBytes(AES_KEY_LENGTH_BYTES);
}

export function createDataKeyBytes(): Uint8Array {
  return randomBytes(AES_KEY_LENGTH_BYTES);
}

export async function deriveAesKwKeyFromSecret(input: {
  secret: string;
  salt: Uint8Array;
  iterations: number;
}): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const normalizedSecret = input.secret.normalize("NFKC");

  if (!normalizedSecret) {
    throw new Error("Passphrase cannot be empty.");
  }

  const baseKey = await subtle.importKey("raw", textEncoder.encode(normalizedSecret), "PBKDF2", false, ["deriveKey"]);

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: input.salt,
      iterations: input.iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-KW", length: AES_KEY_LENGTH_BYTES * 8 },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

export async function wrapRawKeyBytes(wrappingKey: CryptoKey, keyBytes: Uint8Array): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();
  const keyToWrap = await importRawAesGcmKey(keyBytes, ["encrypt", "decrypt"], true);
  const wrapped = await subtle.wrapKey("raw", keyToWrap, wrappingKey, "AES-KW");

  return new Uint8Array(wrapped);
}

export async function importAesKwKeyFromRaw(rawKey: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  if (rawKey.byteLength !== AES_KEY_LENGTH_BYTES) {
    throw new Error("Expected a 256-bit AES key.");
  }

  return getSubtleCrypto().importKey(
    "raw",
    rawKey,
    {
      name: "AES-KW",
      length: AES_KEY_LENGTH_BYTES * 8,
    },
    false,
    usages,
  );
}

export async function unwrapRawKeyBytes(wrappingKey: CryptoKey, wrapped: Uint8Array): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();
  const key = await subtle.unwrapKey(
    "raw",
    wrapped,
    wrappingKey,
    "AES-KW",
    { name: "AES-GCM", length: AES_KEY_LENGTH_BYTES * 8 },
    true,
    ["encrypt", "decrypt"],
  );
  const raw = await subtle.exportKey("raw", key);

  return new Uint8Array(raw);
}

export async function encryptBytesWithDataKey(input: {
  plaintext: Uint8Array;
  dataKey: Uint8Array;
  aad?: string;
}): Promise<AesGcmEncryptedBytes> {
  const subtle = getSubtleCrypto();
  const iv = randomBytes(AES_GCM_IV_LENGTH_BYTES);
  const cryptoKey = await importRawAesGcmKey(input.dataKey, ["encrypt"]);
  const ciphertext = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: input.aad ? textEncoder.encode(input.aad) : undefined,
      tagLength: 128,
    },
    cryptoKey,
    input.plaintext,
  );

  return {
    ciphertext: new Uint8Array(ciphertext),
    iv,
  };
}

export async function decryptBytesWithDataKey(input: {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  dataKey: Uint8Array;
  aad?: string;
}): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();
  const cryptoKey = await importRawAesGcmKey(input.dataKey, ["decrypt"]);
  const plaintext = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: input.iv,
      additionalData: input.aad ? textEncoder.encode(input.aad) : undefined,
      tagLength: 128,
    },
    cryptoKey,
    input.ciphertext,
  );

  return new Uint8Array(plaintext);
}

export async function encryptTextWithDataKey(input: {
  plaintext: string;
  dataKey: Uint8Array;
  aad?: string;
}): Promise<AesGcmEncryptedBytes> {
  return encryptBytesWithDataKey({
    plaintext: textEncoder.encode(input.plaintext),
    dataKey: input.dataKey,
    aad: input.aad,
  });
}

export async function decryptTextWithDataKey(input: {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  dataKey: Uint8Array;
  aad?: string;
}): Promise<string> {
  const plaintext = await decryptBytesWithDataKey(input);
  return textDecoder.decode(plaintext);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }

  return globalThis.btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getCrypto(): Crypto {
  const crypto = globalThis.crypto;

  if (!crypto) {
    throw new Error("WebCrypto is unavailable in this environment.");
  }

  return crypto;
}

function getSubtleCrypto(): SubtleCrypto {
  const subtle = getCrypto().subtle;

  if (!subtle) {
    throw new Error("SubtleCrypto is unavailable in this environment.");
  }

  return subtle;
}

async function importRawAesGcmKey(
  rawKey: Uint8Array,
  usages: KeyUsage[],
  extractable = false,
): Promise<CryptoKey> {
  if (rawKey.byteLength !== AES_KEY_LENGTH_BYTES) {
    throw new Error("Expected a 256-bit AES key.");
  }

  return getSubtleCrypto().importKey(
    "raw",
    rawKey,
    {
      name: "AES-GCM",
      length: AES_KEY_LENGTH_BYTES * 8,
    },
    extractable,
    usages,
  );
}
