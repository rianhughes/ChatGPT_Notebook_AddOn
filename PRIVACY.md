# Privacy Policy for ChatGPT Notebook

Effective date: May 24, 2026

ChatGPT Notebook is a browser extension for saving selected ChatGPT, chat.openai.com, and DeepWiki page content into a local notebook in your browser.

## Data the Extension Handles

The extension can store notebook data that you explicitly save, including:

- Saved message text and Markdown.
- Manually written notes.
- Notebook names, folders, note order, and note metadata.
- Images that you paste or attach to notes.
- Backup and export files that you choose to create.

The extension also reads limited page content on supported sites so it can show save buttons, capture selected messages, and insert saved notebook text back into ChatGPT when you request it.

## How Data Is Stored

Notebook data is stored locally in your browser using extension storage and IndexedDB. Automatic backups and manual exports are saved to your browser downloads folder when you enable or trigger those features.

ChatGPT Notebook does not operate a remote server and does not send your notebook data to the developer.

## Data Sharing

ChatGPT Notebook does not sell, rent, or transfer your notebook data to third parties.

The extension does not use analytics, advertising, tracking pixels, or remote telemetry.

When you use ChatGPT or DeepWiki, those websites continue to operate under their own privacy policies. This extension does not control how those websites process content you view or enter there.

## Permissions

ChatGPT Notebook requests only the permissions needed for its notebook workflow:

- `storage`: Save notebooks, settings, and local metadata.
- `tabs`: Find supported active tabs and send messages between the sidebar, background script, and content script.
- `clipboardWrite`: Copy notebook content when you use copy actions.
- `downloads`: Save notebook exports and local backup files.
- `sidePanel`: Open the Chrome side panel.
- `scripting`: Inject the content script and styles into supported Chrome tabs when needed.
- Host permissions for `https://chatgpt.com/*`, `https://chat.openai.com/*`, and `https://deepwiki.com/*`: Add save controls and capture content only on supported pages.

## Data Deletion

You can delete notes, notebooks, folders, exports, and backups through the extension UI or from your browser downloads folder. Uninstalling the extension may remove browser-managed extension storage. Export a backup before uninstalling if you want to keep your notebook data.

## Changes

This policy may be updated when the extension changes. Material changes should be reflected in this file and in the browser store listing.
