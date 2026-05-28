import { createClient, type AuthSession, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js";

import browser from "../browser/extensionApi";

export type SupabaseCloudConfig = {
  url: string;
  anonKey: string;
  backupBucket: string;
  backupTable: string;
};

let client: SupabaseClient | null = null;
const memoryAuthStorage = new Map<string, string>();

export function getSupabaseCloudConfig(): SupabaseCloudConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey,
    backupBucket: import.meta.env.VITE_SUPABASE_BACKUP_BUCKET?.trim() || "notebook-backups",
    backupTable: import.meta.env.VITE_SUPABASE_BACKUP_TABLE?.trim() || "cloud_backups",
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseCloudConfig();

  if (!config) {
    return null;
  }

  if (!client) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        persistSession: true,
        storage: createExtensionAuthStorage(),
        storageKey: "chatgpt-notebook-supabase-auth",
      },
    });
  }

  return client;
}

export async function getSupabaseSession(): Promise<AuthSession | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

function createExtensionAuthStorage(): SupportedStorage {
  return {
    async getItem(key: string) {
      if (!browser.storage?.local) {
        return memoryAuthStorage.get(key) ?? null;
      }

      const values = await browser.storage.local.get(key);
      const value = values[key];
      return typeof value === "string" ? value : null;
    },
    async setItem(key: string, value: string) {
      if (!browser.storage?.local) {
        memoryAuthStorage.set(key, value);
        return;
      }

      await browser.storage.local.set({ [key]: value });
    },
    async removeItem(key: string) {
      if (!browser.storage?.local) {
        memoryAuthStorage.delete(key);
        return;
      }

      await browser.storage.local.remove(key);
    },
  };
}
