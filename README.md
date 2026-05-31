# ChatGPT Notebook

ChatGPT Notebook is a Firefox and Chrome extension for saving useful ChatGPT and DeepWiki content into searchable browser notebooks.

Use it to collect important answers, excerpts, images, and hand-written notes while researching with ChatGPT. Saved notes live in the browser sidebar, where you can organize them by notebook and folder, search across saved material, merge and reorder notes, copy notes, insert notes back into ChatGPT, and export or back up your data.

For prettier notes, ask ChatGPT to output responses in Markdown. The extension preserves Markdown-style content well, so headings, lists, code blocks, tables, and other formatting remain easier to read in your saved notebook.

## Features

- Save full ChatGPT messages or selected text into notebook entries.
- Save supported DeepWiki content into the same notebook system.
- Organize notebooks with folders, search, rename, reorder, merge, and delete controls.
- Add manual notes and pasted/attached images.
- Copy notebook content or insert saved notes back into the active ChatGPT tab.
- Export individual notebooks or full local backups.
- Automatic local backups after notebook changes.
- Optional Google sign-in for Supabase cloud backup and restore.
- Restore the latest cloud backup onto a new browser/device.

## Firefox Installation

Install ChatGPT Notebook from Firefox Add-ons:

https://addons.mozilla.org/en-US/firefox/addon/chatgpt-notebook/

After installing:

1. Open ChatGPT or DeepWiki in Firefox.
2. Open the ChatGPT Notebook sidebar from the extension button/sidebar control.
3. Use the save buttons on supported pages, or highlight text in a message and use the popover button.
4. Review, organize, search, copy, export, or restore notes from the sidebar.

## Chrome Installation

ChatGPT Notebook is not available in the Chrome Web Store yet. Chrome support is available as an unpacked development extension. A ready-to-load Chrome build is included at `extension/dist/chrome`.

1. Download or clone this repo.
2. Open Chrome and go to:

   ```text
   chrome://extensions
   ```
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this folder from the project:

   ```text
   extension/dist/chrome
   ```
6. Open ChatGPT or DeepWiki and click the ChatGPT Notebook toolbar icon.

Chrome loads an unpacked extension folder, not a source manifest file, so point it at `extension/dist/chrome`, not `extension/src/manifests/manifest.chrome.json`.

Only rebuild when changing extension source code. To refresh the Chrome build, run `npm run build:chrome` from `extension/`, then return to `chrome://extensions` and click the reload button for ChatGPT Notebook. Reload any open ChatGPT tabs so the content script updates.

## Development Install

For temporary Firefox development installs:

1. Build Firefox from `extension/`:

   ```sh
   npm run build:firefox
   ```

2. Open Firefox and go to:

   ```text
   about:debugging#/runtime/this-firefox
   ```

3. Click **Load Temporary Add-on...**.
4. Select:

   ```text
   extension/dist/firefox/manifest.json
   ```

Temporary add-ons are removed when Firefox restarts, so repeat the loading step when needed during development.

## Backup and Restore

Browser extension storage may be removed when the extension is uninstalled. Use the notebook list toolbar to export a full backup before removing or reinstalling the add-on.

The full backup downloads a `chatgpt-notes-backup-YYYY-MM-DD.json` file. It includes folders, notebooks, notes, settings, pending ChatGPT note operations, and image assets. Keep this file outside the browser profile, then use the import button on the notebook list toolbar to restore it.

Importing a full backup or a single-notebook JSON export merges it into the current extension database. Matching notebooks and notes are updated, and unrelated current data is kept.

The extension also writes automatic local backups after notebook data changes. Changes are saved to IndexedDB immediately, then a background backup runs after a short quiet period. Automatic backups are written to `ChatGPT Notebook Backups/` in the browser downloads folder as `chatgpt-notes-autobackup-latest.json` plus one daily snapshot. Daily snapshots older than seven days are cleaned up after successful backups.

## Cloud Backup

Cloud backup is optional. In the Firefox Add-ons build, sign in with Google from the Notebooks tab, then enable encrypted cloud sync before uploading backups to Supabase.

Cloud backup can store:

- notebook JSON snapshots;
- notebook names, folders, notes, metadata, and pending ChatGPT note operations;
- image assets such as PNG, JPEG, WebP, and GIF files.

Cloud snapshots and image assets are encrypted client-side with a per-account master key before upload. The extension stores only wrapped keys and ciphertext in Supabase.

When you sign in on a fresh browser/device with the same Google account, unlock encrypted cloud sync with your passphrase or recovery phrase to restore backups. You can also open the notebook tools row and click **Restore latest cloud backup** manually. During restore, the sidebar shows a restoring indicator so the import does not look stuck.

Cloud backups store JSON snapshots separately from image files. Images stay capped at 5 MB in the extension. Cloud object paths are scoped under the Supabase user ID, and the included RLS policies restrict backup metadata and files to the signed-in user.

## Supabase Setup For Source Builds

Cloud backup requires building the extension with Supabase settings:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
VITE_SUPABASE_BACKUP_BUCKET=notebook-backups
VITE_SUPABASE_BACKUP_TABLE=cloud_backups
VITE_SUPABASE_KEYRING_TABLE=cloud_keyrings
# Optional rollout gate (default: enabled)
VITE_ENCRYPTED_CLOUD_SYNC_V1=true
```

Set `VITE_ENCRYPTED_CLOUD_SYNC_V1=false` to disable encrypted cloud sync at build time for staged rollouts.

Run `supabase/cloud-backup-schema.sql` in the Supabase SQL editor, create a private Storage bucket named `notebook-backups`, set the bucket file-size limit to 10 MB, and allow `application/octet-stream`, `application/json`, `image/png`, `image/jpeg`, `image/webp`, and `image/gif`.

The extension uses Google sign-in through Supabase Auth. Add the browser identity redirect URL to the Supabase Auth redirect allow list:

- Firefox uses the WebExtensions identity redirect URL for the add-on ID.
- Chrome uses `https://<extension-id>.chromiumapp.org/supabase`.

Google Console should use the Supabase callback URL:

```text
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Never put a Google OAuth client secret or Supabase service-role key into `VITE_*` variables or extension source. Browser extensions can only safely include public/publishable keys.

## Build And Package

From `extension/`:

```sh
npm test
npm run build:firefox
npm run build:chrome
npm run package:stores
```

Store-ready packages are written to `extension/dist/`.

## Browser Support

Firefox is the primary supported browser and is available from Firefox Add-ons. Chrome support is available through the unpacked development build and requires Chrome 116 or newer.
