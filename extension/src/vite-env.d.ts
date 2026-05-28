/// <reference types="vite/client" />

declare const __BROWSER_TARGET__: "firefox" | "chrome";

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_BACKUP_BUCKET?: string;
  readonly VITE_SUPABASE_BACKUP_TABLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
