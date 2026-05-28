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

If you enable optional cloud backup and sign in with Google, the extension sends backup data to the configured Supabase project. Cloud backups can include notebook text, Markdown, notebook names, folders, metadata, pending ChatGPT note operations, and image assets. The extension stores backup files in Supabase Storage and backup metadata in Supabase Postgres. Cloud backup is optional; local notebook features work without signing in.

## Data Sharing

ChatGPT Notebook does not sell, rent, or transfer your notebook data to third parties.

The extension does not use analytics, advertising, tracking pixels, or remote telemetry.

When cloud backup is enabled, Google processes your sign-in under Google's own terms and privacy policy. Supabase stores cloud backup data under the terms and privacy policy of the configured Supabase project.

When you use ChatGPT or DeepWiki, those websites continue to operate under their own privacy policies. This extension does not control how those websites process content you view or enter there.

## Permissions

ChatGPT Notebook requests only the permissions needed for its notebook workflow:

- `storage`: Save notebooks, settings, and local metadata.
- `tabs`: Find supported active tabs and send messages between the sidebar, background script, and content script.
- `clipboardWrite`: Copy notebook content when you use copy actions.
- `downloads`: Save notebook exports and local backup files.
- `sidePanel`: Open the Chrome side panel.
- `scripting`: Inject the content script and styles into supported Chrome tabs when needed.
- `identity`: Complete Google sign-in for optional cloud backup.
- Host permissions for `https://chatgpt.com/*`, `https://chat.openai.com/*`, and `https://deepwiki.com/*`: Add save controls and capture content only on supported pages.
- Host permissions for `https://*.supabase.co/*`: Send and restore optional cloud backups from the configured Supabase project.

## Data Deletion

You can delete notes, notebooks, folders, exports, and local backups through the extension UI or from your browser downloads folder. Cloud backup files and metadata can be removed from your Supabase project. Uninstalling the extension may remove browser-managed extension storage. Export a backup before uninstalling if you want to keep your notebook data.

## Changes

This policy may be updated when the extension changes. Material changes should be reflected in this file and in the browser store listing.
