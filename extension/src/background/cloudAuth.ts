import browser from "../browser/extensionApi";
import type { CloudBackupStatusResponse } from "../core/ports";
import { getLatestCloudBackupId } from "../core/cloudBackup";
import { getNotebookCloudBackupMetadata, markCloudEncryptionLocked } from "../core/repository";
import { clearCloudSyncSessionKey, getCloudKeyringStatusForUser } from "./cloudKeyring";
import { getSupabaseClient, getSupabaseCloudConfig, getSupabaseSession } from "./cloudSupabase";

export async function getCloudAuthStatus(): Promise<CloudBackupStatusResponse> {
  const config = getSupabaseCloudConfig();
  const metadata = await getNotebookCloudBackupMetadata();

  if (!config) {
    return {
      configured: false,
      signedIn: false,
      state: "disabled",
      user: null,
      dataRevision: metadata.dataRevision,
      lastCloudBackupRevision: metadata.lastCloudBackupRevision,
      lastCloudBackupAt: metadata.lastCloudBackupAt,
      lastCloudBackupError: metadata.lastCloudBackupError,
      cloudEncryptionEnabled: metadata.cloudEncryptionEnabled,
      cloudEncryptionLocked: metadata.cloudEncryptionEnabled ? metadata.cloudEncryptionLocked : false,
      cloudEncryptionVersion: metadata.cloudEncryptionVersion,
      cloudKeyVersion: metadata.cloudKeyVersion,
      cloudLastDecryptError: metadata.cloudLastDecryptError,
      latestBackupId: null,
    };
  }

  const session = await getSupabaseSession();
  const userId = session?.user.id ?? null;

  if (!session || !userId) {
    return {
      configured: true,
      signedIn: false,
      state: "signed_out",
      user: null,
      dataRevision: metadata.dataRevision,
      lastCloudBackupRevision: metadata.lastCloudBackupRevision,
      lastCloudBackupAt: metadata.lastCloudBackupAt,
      lastCloudBackupError: metadata.lastCloudBackupError,
      cloudEncryptionEnabled: metadata.cloudEncryptionEnabled,
      cloudEncryptionLocked: metadata.cloudEncryptionEnabled ? true : false,
      cloudEncryptionVersion: metadata.cloudEncryptionVersion,
      cloudKeyVersion: metadata.cloudKeyVersion,
      cloudLastDecryptError: metadata.cloudLastDecryptError,
      latestBackupId: null,
    };
  }

  let keyringStatus = {
    keyringPresent: false,
    keyVersion: metadata.cloudKeyVersion,
    unlocked: false,
  };

  try {
    keyringStatus = await getCloudKeyringStatusForUser(userId);
  } catch {
    // Keep cloud status usable even if keyring lookup fails.
  }

  const cloudEncryptionEnabled = metadata.cloudEncryptionEnabled || keyringStatus.keyringPresent;
  const cloudKeyVersion = keyringStatus.keyVersion || metadata.cloudKeyVersion;
  const cloudEncryptionLocked = cloudEncryptionEnabled ? !keyringStatus.unlocked : false;
  const state = !cloudEncryptionEnabled
    ? "locked"
    : cloudEncryptionLocked
      ? "locked"
      : metadata.lastCloudBackupError && metadata.dataRevision > metadata.lastCloudBackupRevision
        ? "error"
        : "idle";

  return {
    configured: true,
    signedIn: true,
    state,
    user: {
      id: userId,
      email: session.user.email ?? null,
    },
    dataRevision: metadata.dataRevision,
    lastCloudBackupRevision: metadata.lastCloudBackupRevision,
    lastCloudBackupAt: metadata.lastCloudBackupAt,
    lastCloudBackupError: metadata.lastCloudBackupError,
    cloudEncryptionEnabled,
    cloudEncryptionLocked,
    cloudEncryptionVersion: metadata.cloudEncryptionVersion,
    cloudKeyVersion,
    cloudLastDecryptError: metadata.cloudLastDecryptError,
    latestBackupId: getLatestCloudBackupId(userId),
  };
}

export async function startGoogleSignIn(): Promise<CloudBackupStatusResponse> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase cloud backup is not configured.");
  }

  const redirectTo = getIdentityRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("Supabase did not return a Google sign-in URL.");
  }

  let callbackUrl: string | undefined;

  try {
    callbackUrl = await browser.identity.launchWebAuthFlow({
      url: data.url,
      interactive: true,
    });
  } catch (error) {
    throw createWebAuthFlowError(error, redirectTo);
  }

  if (!callbackUrl) {
    throw new Error("Google sign-in did not return a browser extension callback URL.");
  }

  const callback = new URL(callbackUrl);
  const callbackError = callback.searchParams.get("error_description") ?? callback.searchParams.get("error");

  if (callbackError) {
    throw new Error(callbackError);
  }

  const code = callback.searchParams.get("code");

  if (!code) {
    throw new Error("Google sign-in did not return an authorization code.");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    throw exchangeError;
  }

  return getCloudAuthStatus();
}

export async function signOutCloud(): Promise<CloudBackupStatusResponse> {
  const supabase = getSupabaseClient();

  await clearCloudSyncSessionKey();
  await markCloudEncryptionLocked(true);

  if (!supabase) {
    return getCloudAuthStatus();
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return getCloudAuthStatus();
}

function getIdentityRedirectUrl(): string {
  const identity = browser.identity;

  if (!identity?.getRedirectURL || !identity.launchWebAuthFlow) {
    throw new Error("Browser identity OAuth is unavailable.");
  }

  return identity.getRedirectURL("supabase");
}

function createWebAuthFlowError(error: unknown, redirectTo: string): Error {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Could not open Google sign-in.";

  if (message.includes("Authorization page could not be loaded")) {
    const supabaseCallbackUrl = getSupabaseAuthCallbackUrl();
    const googleConsoleNote = supabaseCallbackUrl
      ? ` Google Console should still use the Supabase callback URL: ${supabaseCallbackUrl}.`
      : "";

    return new Error(
      `Chrome could not load the Supabase Google sign-in page. Add this exact URL to Supabase Authentication > URL Configuration > Redirect URLs: ${redirectTo}.${googleConsoleNote} If that URL is already listed, recheck the Google provider Client ID and Client Secret in Supabase.`,
    );
  }

  return new Error(message);
}

function getSupabaseAuthCallbackUrl(): string | null {
  const config = getSupabaseCloudConfig();

  if (!config) {
    return null;
  }

  return `${config.url.replace(/\/+$/, "")}/auth/v1/callback`;
}
