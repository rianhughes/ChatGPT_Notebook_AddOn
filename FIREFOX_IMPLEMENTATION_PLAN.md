# Firefox Implementation Plan

This plan implements the ChatGPT Notes Sidebar extension for Firefox first, while keeping the core code portable enough to add Chrome support with a second manifest and sidebar adapter.

## Implementation Principles

- Firefox is the first shipping target.
- Shared code must not import Firefox-only APIs directly.
- Browser-specific behavior lives behind small adapters.
- The data model, linked-list logic, repository, search, sidebar UI, and ChatGPT content script should be reusable for Chrome.
- The Firefox build should output to `dist/firefox/`.
- A later Chrome build should output to `dist/chrome/` without rewriting core features.
- Save commands from ChatGPT page buttons should go through the background script so they work even when the sidebar is closed.
- Important state must live in IndexedDB, not in background memory.

## Target Firefox MVP

The Firefox MVP should let a user:

- Open a browser sidebar for saved ChatGPT notes.
- Visit a ChatGPT conversation.
- See one save button injected into each visible ChatGPT message.
- Save individual ChatGPT messages into the sidebar thread for that ChatGPT conversation.
- View all saved ChatGPT sidebar threads.
- Open a saved thread and view saved messages in linked-list order.
- Search inside a saved thread.
- Delete saved messages.
- Copy one saved message.
- Select multiple saved messages and copy them as one combined text block.
- Select all visible messages, including visible search results.

Future, not MVP:

- Autofill the active ChatGPT composer from one saved message.
- Autofill the active ChatGPT composer from selected saved messages.
- Add Chrome `sidePanel` support.
- Add full-text indexing beyond simple per-thread search.

## Project Layout

Create the project using this structure:

```text
extension/
  package.json
  tsconfig.json
  vite.config.ts
  src/
    background/
      background.ts
      sidebarAdapter.ts
      sidebarAdapter.firefox.ts
      sidebarAdapter.chrome.ts
    browser/
      extensionApi.ts
      runtime.ts
      tabs.ts
    content/
      chatgptContentScript.ts
      chatgptDomAdapter.ts
      messageCaptureOverlay.ts
    core/
      clipboard.ts
      linkedList.ts
      models.ts
      ports.ts
      repository.ts
      search.ts
      threadIdentity.ts
    sidebar/
      sidebar.html
      main.tsx
      components/
        MessageActions.tsx
        MessageList.tsx
        SearchBox.tsx
        ThreadList.tsx
        Toolbar.tsx
    storage/
      db.ts
      migrations.ts
    styles/
      sidebar.css
      injected.css
    manifests/
      manifest.firefox.json
      manifest.chrome.json
  tests/
    linkedList.test.ts
    repository.test.ts
    search.test.ts
    chatgptDomAdapter.test.ts
    sidebarSelection.test.ts
```

Chrome-friendly rule:

- `src/core`, `src/storage`, `src/sidebar`, and most of `src/content` must stay browser-neutral.
- Only `src/background/sidebarAdapter.*.ts` and manifest files should know whether the target is Firefox or Chrome.

## Phase 1: Scaffold The Extension

Tasks:

1. Create `extension/package.json` with Vite, TypeScript, Vitest, React, and `webextension-polyfill`.
2. Configure Vite to build these entries:
   - `src/background/background.ts`
   - `src/content/chatgptContentScript.ts`
   - `src/sidebar/main.tsx`
3. Copy `src/sidebar/sidebar.html` into the build output.
4. Copy `src/manifests/manifest.firefox.json` to `dist/firefox/manifest.json`.
5. Emit all JS/CSS assets into `dist/firefox/`.

Firefox acceptance:

- `dist/firefox/manifest.json` exists.
- Firefox can load `dist/firefox/` as a temporary add-on.
- The sidebar opens and renders a placeholder UI.

Chrome-friendly note:

- Build scripts should take a `BROWSER_TARGET=firefox` style flag so Chrome can later reuse the same pipeline with `manifest.chrome.json`.

## Phase 2: Firefox Manifest And Sidebar Adapter

Firefox manifest:

```json
{
  "manifest_version": 3,
  "name": "ChatGPT Notes Sidebar",
  "version": "0.1.0",
  "permissions": ["storage", "tabs", "clipboardWrite"],
  "host_permissions": ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  "background": {
    "scripts": ["background.js"]
  },
  "sidebar_action": {
    "default_title": "ChatGPT Notes",
    "default_panel": "sidebar.html"
  },
  "content_scripts": [
    {
      "matches": ["https://chatgpt.com/*", "https://chat.openai.com/*"],
      "js": ["content.js"],
      "css": ["injected.css"]
    }
  ],
  "action": {
    "default_title": "Open ChatGPT Notes"
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "chatgpt-notes-sidebar@example.local"
    }
  }
}
```

Tasks:

1. Implement `sidebarAdapter.firefox.ts`.
2. Use Firefox sidebar APIs only inside the adapter.
3. Make `background.ts` call generic methods such as `openSidebarForCurrentWindow()`.
4. Keep `sidebarAdapter.chrome.ts` as a stub with the same interface.
5. Register background message handlers for `SAVE_CHATGPT_MESSAGE`.

Suggested adapter interface:

```ts
export type SidebarAdapter = {
  initialize(): Promise<void>;
  openForCurrentWindow(): Promise<void>;
};
```

Firefox acceptance:

- Clicking the extension action opens or focuses the sidebar.
- The background script does not import React or DOM code.
- The background script may import repository command functions for content-script saves.
- Saving from a ChatGPT page works even if the sidebar is closed.

Chrome-friendly note:

- Chrome support should later implement the same `SidebarAdapter` interface using `chrome.sidePanel`.

## Phase 3: Shared Browser API Wrapper

Tasks:

1. Add `webextension-polyfill`.
2. Create `browser/extensionApi.ts` that exports the normalized `browser` object.
3. Use promise-based `browser.runtime.sendMessage`, `browser.runtime.onMessage`, and `browser.tabs` from wrappers.
4. Avoid direct `chrome.*` calls outside adapter or wrapper code.

Acceptance:

- Content script, sidebar, and background communicate using typed messages from `core/ports.ts`.
- No shared module imports a Firefox-only global.

## Phase 4: Core Models And Linked List

Tasks:

1. Implement `core/models.ts`.
2. Implement `core/linkedList.ts` with pure operations:
   - `appendMessage`
   - `insertMessageAfter`
   - `insertMessageBefore`
   - `deleteMessage`
   - `moveMessageAfter`
   - `getMessagesInOrder`
   - `assertThreadIntegrity`
3. Keep linked-list logic free of IndexedDB and browser APIs.

Acceptance tests:

- Append to empty thread.
- Append to non-empty thread.
- Insert before head.
- Insert after tail.
- Delete only message.
- Delete head.
- Delete tail.
- Delete middle.
- Reject cross-thread pointer corruption.
- Detect cycles or broken pointers.

Chrome-friendly note:

- This layer should move unchanged into the Chrome build.

## Phase 5: IndexedDB Repository

Tasks:

1. Implement `storage/db.ts`.
2. Create tables:
   - `threads`
   - `messages`
3. Implement `core/repository.ts` as the only write path.
4. Run all mutations in transactions.
5. Add `getOrCreateThreadForChatGptConversation`.
6. Add `appendSavedMessageFromChatGpt`.
7. Add delete and read APIs.
8. Enforce idempotent saves using `(threadId, sourceMessageKey)`.

Repository API:

```ts
getThreads(): Promise<ChatGptThread[]>
getThreadBySource(sourceThreadId: string): Promise<ChatGptThread | null>
getOrCreateChatGptThread(input): Promise<ChatGptThread>
getMessagesInOrder(threadId: string): Promise<SavedMessage[]>
appendMessage(threadId: string, input): Promise<SavedMessage>
deleteMessage(threadId: string, messageId: string): Promise<void>
isSourceMessageSaved(threadId: string, sourceMessageKey: string): Promise<boolean>
```

Acceptance:

- Saved messages persist after reloading Firefox.
- Deleting head, middle, and tail messages preserves linked-list integrity.
- Clicking the same ChatGPT message save button twice does not append duplicates.
- If a still-streaming saved message later has changed content, the existing saved record can update in place.

Chrome-friendly note:

- IndexedDB works in both Firefox and Chrome extension contexts, so do not use `browser.storage.local` for primary message storage.

## Phase 6: Message Contracts

Tasks:

1. Define all runtime message envelopes in `core/ports.ts`.
2. Include these message types:
   - `CHATGPT_THREAD_CHANGED`
   - `SAVE_CHATGPT_MESSAGE`
   - `SAVE_CHATGPT_MESSAGE_RESULT`
   - `GET_ACTIVE_CHATGPT_CONTEXT`
   - `SOURCE_MESSAGE_SAVED_STATE_CHANGED`
   - `REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES`
3. Add validators or type guards for incoming messages.

Acceptance:

- Content script can save a message through background routing.
- Content script saves are routed through background to repository.
- Bad or unknown message types are ignored safely.

Chrome-friendly note:

- Message contracts are shared. Chrome should only replace transport details if needed.

## Phase 7: ChatGPT DOM Adapter

Tasks:

1. Implement `threadIdentity.ts` to parse ChatGPT conversation IDs from:
   - `https://chatgpt.com/c/<conversation-id>`
   - `https://chat.openai.com/c/<conversation-id>`
2. Implement `chatgptDomAdapter.ts`:
   - Find visible message containers.
   - Determine message role.
   - Extract best-effort source message ID.
   - Generate `sourceMessageKey` from the source message ID when available, otherwise a hash of role plus normalized content.
   - Generate `contentHash`.
   - Extract Markdown-ish content and plain text.
   - Detect whether a message is still streaming.
3. Keep all ChatGPT selectors inside this file.

Acceptance:

- Unit tests with mocked HTML extract role, source ID, and text.
- The rest of the content script only consumes adapter return values.

Chrome-friendly note:

- Content scripts are mostly portable. Avoid Firefox-specific DOM assumptions.

## Phase 8: Inject Per-Message Save Buttons

Tasks:

1. Implement `messageCaptureOverlay.ts`.
2. Attach one save button per ChatGPT message.
3. Mark processed containers with `data-cgpt-notes-bound="true"`.
4. Use a `MutationObserver` to handle new and streaming messages.
5. On click, re-extract the message content immediately before sending.
6. Send `SAVE_CHATGPT_MESSAGE`.
7. Update button state after save succeeds.
8. Query saved state for visible source messages when the content script starts.
9. Scope the observer to the conversation container and debounce rescans.

Acceptance:

- Every visible ChatGPT message has exactly one save button.
- Clicking save creates the matching sidebar thread automatically.
- Saved buttons visibly change state.
- No duplicate buttons appear after ChatGPT streams new content.
- Re-clicking a saved button does not duplicate the saved message.

Chrome-friendly note:

- Button injection and DOM observation should be identical in Chrome.

## Phase 9: Sidebar UI

Tasks:

1. Build `ThreadList`.
2. Build `MessageList`.
3. Build `SearchBox`.
4. Build `MessageActions`.
5. Build `Toolbar` with:
   - select all
   - copy selected
6. Load all threads on sidebar startup.
7. Open the current ChatGPT thread when context is available.
8. Render messages in linked-list order.

Acceptance:

- Sidebar shows saved threads.
- Selecting a thread shows its messages.
- Search filters messages in the current thread.
- Deleting a message updates the list without corrupting order.

Chrome-friendly note:

- Sidebar UI should not know whether it is running in Firefox `sidebar_action` or Chrome `sidePanel`.

## Phase 10: Clipboard And Multi-Select Copy

Tasks:

1. Implement `core/clipboard.ts`.
2. Add per-message copy buttons.
3. Add row checkboxes.
4. Add select-all behavior.
5. Add copy-selected behavior.
6. Clear selection when switching threads.
7. Remove deleted messages from selection.

Copy rules:

- Single copy uses `contentMarkdown` when available, otherwise `contentText`.
- Multi-copy uses linked-list display order.
- Multi-copy separates messages with two newlines.
- When search is active, select all applies only to visible filtered results.
- Selection is UI state only and is not persisted.

Acceptance:

- User can copy one saved message.
- User can select multiple messages and copy them as one block.
- User can search, select all visible results, and copy only those visible results.
- The copied block can be pasted into the ChatGPT composer manually.

Chrome-friendly note:

- Prefer `navigator.clipboard.writeText` from the sidebar UI. If Firefox permission behavior requires changes, isolate them inside `core/clipboard.ts`.
- Keep `clipboardWrite` in both Firefox and future Chrome manifests for reliability.

## Phase 11: Search

Tasks:

1. Implement simple search in `core/search.ts`.
2. Search only within the selected thread.
3. Match against normalized `contentText`.
4. Preserve linked-list display order.
5. Add optional match highlighting in the UI.

Acceptance:

- Searching filters visible messages.
- Clearing search restores full linked-list order.
- Select all respects the filtered visible set.

Chrome-friendly note:

- Do not add a browser-specific search backend.

## Phase 12: Manual Firefox Verification

Run this checklist in Firefox:

1. Load `dist/firefox/` as a temporary add-on.
2. Open `https://chatgpt.com/`.
3. Open an existing ChatGPT conversation.
4. Confirm each visible message has exactly one save button.
5. Save several assistant messages.
6. Open the sidebar.
7. Confirm the current ChatGPT thread appears.
8. Confirm saved messages are shown in save order.
9. Search within the saved thread.
10. Copy one saved message and paste it into ChatGPT manually.
11. Select multiple saved messages and copy them into ChatGPT manually.
12. Search, select all visible results, copy, and paste manually.
13. Delete a head message.
14. Delete a middle message.
15. Delete a tail message.
16. Reload Firefox and confirm persistence.

## Phase 13: Automated Tests

Add tests before broad manual iteration:

```text
linkedList.test.ts
repository.test.ts
search.test.ts
chatgptDomAdapter.test.ts
sidebarSelection.test.ts
```

Minimum test coverage:

- Linked-list mutation integrity.
- Repository transaction behavior.
- Search filtering.
- Select-all with and without search.
- Multi-copy ordering.
- ChatGPT DOM extraction from mocked markup.
- Save button injection avoids duplicate buttons.

## Chrome Support Later

When Firefox MVP is stable, add Chrome with these steps:

1. Implement `sidebarAdapter.chrome.ts` using `chrome.sidePanel`.
2. Add or complete `manifest.chrome.json`.
3. Build to `dist/chrome/`.
4. Verify the same sidebar UI loads in Chrome side panel.
5. Verify the same content script injects save buttons.
6. Verify IndexedDB data operations work unchanged.
7. Run the same test suite.

Expected unchanged modules:

- `core/*`
- `storage/*`
- `sidebar/*`
- `content/chatgptDomAdapter.ts`
- `content/messageCaptureOverlay.ts`
- `content/chatgptContentScript.ts`, except for any tiny runtime transport differences hidden behind wrappers

Expected Chrome-specific modules:

- `background/sidebarAdapter.chrome.ts`
- `manifests/manifest.chrome.json`
- build target config for `dist/chrome/`

## Implementation Order

1. Scaffold build and Firefox manifest.
2. Add placeholder sidebar and verify Firefox loads it.
3. Add core models and linked-list tests.
4. Add IndexedDB repository.
5. Add typed runtime messages.
6. Add ChatGPT thread identity and DOM extraction.
7. Inject save buttons into ChatGPT messages.
8. Save messages into per-conversation threads.
9. Render threads and messages in sidebar.
10. Add delete and integrity checks.
11. Add search.
12. Add single-message copy.
13. Add multi-select, select all, and copy selected.
14. Run Firefox manual verification.
15. Stabilize browser adapters for future Chrome support.
