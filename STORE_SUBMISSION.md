# Store Submission Checklist

This repo builds separate Chrome and Firefox extension packages from `extension/src/manifests`.

## Pre-Submission Checks

Run these from `extension/` before every upload:

```sh
npm test
npm run package:stores
```

The packaging script rebuilds both browser targets and writes uploadable zip files to `extension/dist/`.

Firefox uses this permanent add-on ID:

```text
@chatgpt-notebook.rianhughes
```

If AMO reports that the ID is already taken, choose a new unique ID before first approval. Do not change the ID after users install the add-on unless you intentionally want Firefox to treat it as a different extension.

## Generated Upload Files

- Chrome Web Store: `extension/dist/chatgpt-notebook-chrome-0.1.0.zip`
- Firefox Add-ons: `extension/dist/chatgpt-notebook-firefox-0.1.0.zip`
- Firefox reviewer source archive: `extension/dist/chatgpt-notebook-source-0.1.0.zip`

Upload the Chrome zip to the Chrome Web Store dashboard. Upload the Firefox zip to addons.mozilla.org. If Mozilla requests source code for review, upload the source archive and point reviewers to `extension/scripts/build.mjs` and `extension/scripts/package-stores.mjs`.

## Listing Copy

Short description:

```text
Save useful ChatGPT and DeepWiki content into a searchable local notebook.
```

Long description:

```text
ChatGPT Notebook helps you save useful messages, excerpts, images, and notes from supported research pages into a local browser sidebar notebook.

Use it to collect important ChatGPT answers, organize notebooks by conversation, search saved notes, merge or reorder notes, copy notebook content, insert notes back into ChatGPT, and export or back up your notebook data.

Notebook data is stored locally in your browser. The extension does not run analytics, advertising, tracking, or a remote sync service.
```

Category suggestion:

```text
Productivity
```

Support text:

```text
For support, use the support contact configured in the store listing or open an issue in the project repository.
```

## Permission Explanations

Use these explanations in the Chrome privacy/permissions form and Firefox reviewer notes.

`storage`:

```text
Stores notebooks, folders, saved notes, settings, and local backup metadata in the browser.
```

`tabs`:

```text
Finds supported active ChatGPT, chat.openai.com, and DeepWiki tabs so the sidebar and content script can exchange messages.
```

`clipboardWrite`:

```text
Copies selected notebook content to the clipboard when the user clicks a copy action.
```

`downloads`:

```text
Creates user-requested notebook exports and automatic local backup files in the browser downloads folder.
```

`sidePanel`:

```text
Opens ChatGPT Notebook in Chrome's side panel.
```

`scripting`:

```text
Injects the content script and stylesheet into supported Chrome tabs when the user opens or refreshes the notebook workflow.
```

Host permissions:

```text
Runs only on https://chatgpt.com/*, https://chat.openai.com/*, and https://deepwiki.com/* so the extension can add save controls, read selected user-requested content, and insert notebook text when requested.
```

## Privacy Answers

Data collection summary:

```text
The extension stores saved notebook content locally in the user's browser. It does not transmit notebook data to the developer, does not use analytics, and does not sell or share user data.
```

Firefox manifest data collection declaration:

```text
browser_specific_settings.gecko.data_collection_permissions.required = ["none"]
```

Remote code:

```text
The extension does not load or execute remote code. JavaScript and CSS are bundled with the extension package.
```

Single purpose:

```text
The extension's single purpose is to let users save, organize, search, export, back up, and reuse selected ChatGPT and DeepWiki content in a local notebook.
```

Privacy policy:

```text
Host PRIVACY.md at a public HTTPS URL, such as the repository page, and use that URL in both store dashboards.
```

## Assets Still Needed

The raw example screenshots have been moved to `store-assets/screenshots/`:

- `Example_homescreen.png`
- `Example_save_notes.png`
- `Example_create_travel_plans.png`
- `Example_new_chat_old_notes.png`

Before final submission, export store-ready versions at `1280x800` or
`640x400` for Chrome Web Store. Firefox AMO recommends `1280x800`, or another
`1.6:1` image if needed. The current example screenshots are larger/wider raw
captures, so crop or recapture them before upload.

Also confirm each screenshot is from a clean browser profile and does not show
private ChatGPT conversations, account details, local file paths, or other
personal data.

Use `extension/src/assets/icon.png` for the 128px store icon unless you decide to create separate store artwork.
