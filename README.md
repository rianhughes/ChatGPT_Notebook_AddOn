# ChatGPT Notes Sidebar

ChatGPT Notes Sidebar is a Firefox and Chrome extension for saving useful ChatGPT messages into a per-conversation notebook.

At a high level, it helps you structure notes while learning about a topic with ChatGPT. When you are in a ChatGPT conversation, you can save individual messages, review them in the browser sidebar, search through saved notes, delete notes, and copy selected notes back out for later querying or study.

For prettier notes, we recommend asking ChatGPT to output responses in Markdown. The extension preserves Markdown-style content well, so headings, lists, code blocks, and other formatting are easier to read in your saved notebook.

## Firefox Installation

ChatGPT Notes Sidebar is not available in Firefox Add-ons yet. Until then Firefox can only install it temporarily as a development/debug add-on. The Firefox instructions below are for this temporary setup.

1. Download or clone this repo.
2. Open Firefox and go to:

   ```text
   about:debugging#/runtime/this-firefox
   ```
3. Click **Load Temporary Add-on...**.
4. Select this file from the project:

   ```text
   extension/dist/firefox/manifest.json
   ```
5. Open ChatGPT, start or open a conversation, and use the extension sidebar to save and organize notes.

Temporary add-ons are removed when Firefox restarts, so repeat the loading step when needed during development.

## Chrome Installation

ChatGPT Notes Sidebar is not available in the Chrome Web Store yet. For now, Chrome support is available as an unpacked development extension. A ready-to-load Chrome build is included at `extension/dist/chrome`.

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
6. Open ChatGPT, start or open a conversation, and click the ChatGPT Notes toolbar icon. Chrome opens the extension in the browser side panel.
7. Use the **Export to ChatGPT Note** buttons on ChatGPT messages, or highlight text in a message and use the popover button, to save notes into the side panel.
8. Use the side panel to switch notebooks, search saved notes, copy notes, insert notes back into the active ChatGPT tab, export notebooks, delete notes, merge notes, and reorder notes.

Chrome loads an unpacked extension folder, not a source manifest file, so point it at `extension/dist/chrome`, not `extension/src/manifests/manifest.chrome.json`.

Only rebuild when changing extension source code. To refresh the Chrome build, run `npm run build:chrome` from `extension/`, then return to `chrome://extensions` and click the reload button for ChatGPT Notes Sidebar. Reload any open ChatGPT tabs so the content script updates.

If the ChatGPT page does not show **Export to ChatGPT Note** buttons, click the ChatGPT Notes toolbar icon while the ChatGPT tab is active. If the buttons still do not appear, reload the ChatGPT tab once.

## Backup and Restore

Browser extension storage is removed when the extension is uninstalled. Use the notebook list toolbar to export a full backup before removing or reinstalling the add-on.

The full backup downloads a `chatgpt-notes-backup-YYYY-MM-DD.json` file. It includes folders, notebooks, notes, settings, pending ChatGPT note operations, and image assets. Keep this file outside the browser profile, then use the import button on the notebook list toolbar to restore it. Importing a full backup or a single-notebook JSON export merges it into the current extension database; matching notebooks and notes are updated, and unrelated current data is kept.

The extension also writes automatic local backups after notebook data changes. Changes are saved to IndexedDB immediately, then a background backup runs after a short quiet period. Automatic backups are written to `ChatGPT Notes Backups/` in the browser downloads folder as `chatgpt-notes-autobackup-latest.json` plus one daily snapshot. Daily snapshots older than seven days are cleaned up after successful backups.

## Browser Support

Firefox is the primary supported browser. Chrome support is available through the unpacked development build and requires Chrome 116 or newer.
