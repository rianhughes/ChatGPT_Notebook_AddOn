import react from "@vitejs/plugin-react";
import { build, loadEnv } from "vite";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const target = process.env.BROWSER_TARGET ?? "firefox";
const supportedTargets = new Set(["firefox", "chrome"]);

if (!supportedTargets.has(target)) {
  throw new Error(`Unsupported BROWSER_TARGET "${target}"`);
}

const outDir = resolve(projectRoot, "dist", target);
const viteEnv = loadEnv(process.env.MODE ?? "production", projectRoot, "");
const getEnv = (key) => process.env[key] ?? viteEnv[key] ?? "";
const define = {
  __BROWSER_TARGET__: JSON.stringify(target),
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(getEnv("VITE_SUPABASE_URL")),
  "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(getEnv("VITE_SUPABASE_ANON_KEY")),
  "import.meta.env.VITE_SUPABASE_BACKUP_BUCKET": JSON.stringify(getEnv("VITE_SUPABASE_BACKUP_BUCKET")),
  "import.meta.env.VITE_SUPABASE_BACKUP_TABLE": JSON.stringify(getEnv("VITE_SUPABASE_BACKUP_TABLE")),
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

await build({
  root: resolve(projectRoot, "src", "sidebar"),
  base: "./",
  configFile: false,
  plugins: [react()],
  define,
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: resolve(projectRoot, "src", "sidebar", "sidebar.html"),
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});

await buildClassicEntry("background", "src/background/background.ts", "ChatGptNotesBackground");
await buildClassicEntry("content", "src/content/chatgptContentScript.ts", "ChatGptNotesContent");

copyRequiredFile(
  resolve(projectRoot, "src", "manifests", `manifest.${target}.json`),
  resolve(outDir, "manifest.json"),
);
copyRequiredFile(resolve(projectRoot, "src", "styles", "injected.css"), resolve(outDir, "injected.css"));
copyAssetPngs(resolve(projectRoot, "src", "assets"), outDir);

async function buildClassicEntry(name, entry, globalName) {
  await build({
    root: projectRoot,
    base: "./",
    configFile: false,
    define,
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: true,
      minify: false,
      lib: {
        entry: resolve(projectRoot, entry),
        name: globalName,
        formats: ["iife"],
        fileName: () => `${name}.js`,
      },
    },
  });
}

function copyRequiredFile(from, to) {
  if (!existsSync(from)) {
    throw new Error(`Missing required build input: ${from}`);
  }

  copyFileSync(from, to);
}

function copyAssetPngs(fromDir, toDir) {
  if (!existsSync(fromDir)) {
    throw new Error(`Missing required build input: ${fromDir}`);
  }

  for (const entry of readdirSync(fromDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".png")) {
      copyRequiredFile(resolve(fromDir, entry.name), resolve(toDir, entry.name));
    }
  }
}
