# ChatGPT Notes Sidebar

ChatGPT Notes Sidebar is a Firefox extension for saving useful ChatGPT messages into a per-conversation notebook.

At a high level, it helps you structure notes while learning about a topic with ChatGPT. When you are in a ChatGPT conversation, you can save individual messages, review them in the browser sidebar, search through saved notes, delete notes, and copy selected notes back out for later querying or study.

For prettier notes, we recommend asking ChatGPT to output responses in Markdown. The extension preserves Markdown-style content well, so headings, lists, code blocks, and other formatting are easier to read in your saved notebook.

## Firefox Installation

This project currently supports Firefox as a temporary/debug extension.

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

## Browser Support

Firefox is the current supported browser.

Chrome is not supported yet. The codebase has planned Chrome support, but the Chrome extension build should be considered unfinished for now.
