# ChatGPT Notes Sidebar Extension Architecture

## Goal

Build a portable browser extension that lets a user save selected ChatGPT messages into a per-conversation notebook. Each ChatGPT conversation maps to one extension thread. Inside each extension thread, saved messages can be inserted, deleted, navigated, and searched.

The core app should be browser-agnostic so it can ship to Chrome and Firefox with only thin manifest/sidebar adapters.

## Platform Strategy

Use the WebExtensions model as the common foundation.

- Chrome: Manifest V3 with `chrome.sidePanel`.
- Firefox: WebExtension sidebar using `sidebar_action`.
- Shared API wrapper: use `webextension-polyfill` so app code talks to `browser.*` promises.
- Shared UI: one `sidebar.html` and bundled React/Svelte/Vue/plain TS app reused by both builds.
- Browser-specific files: generated manifests plus small sidebar-opening adapters.

The extension should avoid depending on ChatGPT internals outside one isolated content-script scraper module. ChatGPT DOM changes are expected, so all selectors and parsing logic should live in one replaceable layer.

## High-Level Components

```text
extension/
  src/
    background/
      background.ts
      sidebarAdapter.chrome.ts
      sidebarAdapter.firefox.ts
    content/
      chatgptContentScript.ts
      chatgptDomAdapter.ts
      messageCaptureOverlay.ts
    sidebar/
      sidebar.html
      main.tsx
      components/
        ThreadList.tsx
        MessageList.tsx
        SearchBox.tsx
        MessageActions.tsx
    core/
      models.ts
      linkedList.ts
      repository.ts
      search.ts
      threadIdentity.ts
      ports.ts
    storage/
      db.ts
      migrations.ts
      indexes.ts
    browser/
      runtime.ts
      tabs.ts
      storage.ts
  manifests/
    manifest.chrome.json
    manifest.firefox.json
  tests/
    linkedList.test.ts
    repository.test.ts
    chatgptDomAdapter.test.ts
```

## Runtime Responsibilities

### Content Script

Runs only on ChatGPT pages.

Responsibilities:

- Detect the current ChatGPT conversation ID from the URL.
- Extract assistant/user message metadata from the page.
- Inject a save button into each ChatGPT message.
- Keep injected save buttons in sync as ChatGPT streams or adds messages.
- Send `SAVE_CHATGPT_MESSAGE` events to the background script.

The content script should not own persistence. It only observes the page and sends structured data.

### Per-Message Save Button

Every visible ChatGPT message should get an extension-owned save button rendered by `messageCaptureOverlay.ts`.

Behavior:

- The content script scans the conversation DOM for message containers.
- For each message, `chatgptDomAdapter.ts` extracts role, stable source message ID if available, markdown/text content, and the current ChatGPT conversation ID.
- `messageCaptureOverlay.ts` injects a small save button into the message action area.
- Clicking the button sends `SAVE_CHATGPT_MESSAGE` to the background script with the extracted message payload.
- The sidebar thread for the active ChatGPT conversation is created automatically if it does not exist.
- On successful save, the button changes to a saved state for that source message.
- If the saved copy is deleted from the sidebar, the button can return to an unsaved state after the content script receives or polls the updated saved-message state.

Implementation notes:

- Use a `MutationObserver` to attach buttons to new messages as ChatGPT streams or virtualizes content.
- Scope the observer to the conversation container and debounce rescans so large ChatGPT threads do not trigger excessive DOM work.
- Mark processed message containers with an extension data attribute such as `data-cgpt-notes-bound="true"` to avoid duplicate buttons.
- Keep ChatGPT DOM selectors inside `chatgptDomAdapter.ts`; the rest of the extension should not know selector details.
- Do not store data in DOM attributes except small IDs/state flags.
- If a message is still streaming, either disable the save button until stable or allow saving and update the extracted content immediately before dispatch.
- Generate a `sourceMessageKey` for saved-state tracking. Prefer ChatGPT's stable message ID when available; otherwise use a hash of role plus normalized content.

### Sidebar App

The main user interface.

Responsibilities:

- Show all saved extension threads.
- Show saved messages for the selected thread.
- Search inside the selected thread.
- Delete saved messages.
- Copy a saved message's text to the clipboard so the user can paste it back into ChatGPT.
- Navigate previous/next via linked-list pointers.
- Optionally save the currently selected ChatGPT message.

The sidebar talks to `core/repository.ts`, not directly to raw browser storage.

### Background Script

The browser lifecycle and routing layer.

Responsibilities:

- Open or configure the sidebar.
- Listen for extension action clicks.
- Receive content-script events when needed.
- Relay messages between content script and sidebar.
- Persist `SAVE_CHATGPT_MESSAGE` commands so saving works even when the sidebar is closed.
- Keep browser-specific APIs out of the core model.
- Avoid storing important state in memory; Manifest V3 background contexts may be restarted.

### Core

Pure TypeScript domain logic.

Responsibilities:

- Define `Thread`, `SavedMessage`, and linked-list operations.
- Validate inserts/deletes.
- Normalize searchable text.
- Hide storage details behind repository methods.

This layer should have no direct `chrome.*`, `browser.*`, DOM, or React imports.

## Data Model

```ts
export type ChatGptThread = {
  id: string;                 // extension-owned ID
  source: "chatgpt";
  sourceThreadId: string;     // ChatGPT conversation ID from URL
  title: string;
  headMessageId: string | null;
  tailMessageId: string | null;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
};

export type SavedMessage = {
  id: string;
  threadId: string;
  sourceMessageId: string | null; // best-effort ChatGPT DOM/message ID
  sourceMessageKey: string;       // stable ID if available, otherwise derived hash key
  contentHash: string;
  role: "assistant" | "user" | "system" | "note";
  contentMarkdown: string;
  contentText: string;        // normalized text for search
  prevId: string | null;
  nextId: string | null;
  createdAt: number;
  updatedAt: number;
};
```

The doubly linked list is persisted directly on `SavedMessage.prevId` and `SavedMessage.nextId`. The thread stores `headMessageId` and `tailMessageId`.

This gives fast local insert/delete behavior:

- Append: update old tail `nextId`, new message `prevId`, and thread `tailMessageId`.
- Insert after: update previous node, next node, and inserted node.
- Delete: connect `prevId` to `nextId`; update head or tail if needed.

## Storage Choice

Use IndexedDB, ideally through Dexie or a tiny local wrapper.

Reasons:

- Better for structured records than `browser.storage.local`.
- Supports indexes for `threadId`, `sourceThreadId`, and timestamps.
- Avoids large-object limits and serialization pain as saved messages grow.
- Works in Chrome and Firefox extension contexts.

Suggested tables:

```ts
threads: "&id, &[source+sourceThreadId], updatedAt"
messages: "&id, threadId, &[threadId+sourceMessageKey], sourceMessageId, prevId, nextId, updatedAt"
searchTerms: "[threadId+term+messageId], threadId, term"
```

For a first version, search can scan `contentText` for messages in one thread. Later, add `searchTerms` or MiniSearch/Fuse.js if the saved corpus grows.

## Linked-List Operations

All write operations should run through repository transactions.

```ts
appendMessage(threadId, message)
insertMessageAfter(threadId, afterMessageId, message)
insertMessageBefore(threadId, beforeMessageId, message)
deleteMessage(threadId, messageId)
moveMessageAfter(threadId, messageId, afterMessageId)
getMessagesInOrder(threadId)
getPreviousMessage(messageId)
getNextMessage(messageId)
```

### Delete Algorithm

```text
node = messages[messageId]
prev = node.prevId ? messages[node.prevId] : null
next = node.nextId ? messages[node.nextId] : null

if prev exists: prev.nextId = node.nextId
else: thread.headMessageId = node.nextId

if next exists: next.prevId = node.prevId
else: thread.tailMessageId = node.prevId

delete node
thread.messageCount -= 1
thread.updatedAt = now
```

### Integrity Rules

The repository should enforce:

- A message can only point to messages in the same thread.
- A thread with `messageCount === 0` must have null head and tail.
- A non-empty thread must have both head and tail.
- `head.prevId` must be null.
- `tail.nextId` must be null.
- Traversing from head should visit exactly `messageCount` messages.

Add a development-only `assertThreadIntegrity(threadId)` helper and run it in tests.

## Thread Identity

Each ChatGPT conversation gets one extension thread.

Preferred identity:

```text
https://chatgpt.com/c/<conversation-id>
```

Use `<conversation-id>` as `sourceThreadId`. If the URL shape changes, isolate that logic in `core/threadIdentity.ts` and `content/chatgptDomAdapter.ts`.

When saving a message:

1. Content script sends `sourceThreadId`, page title, role, content, optional source message ID, `sourceMessageKey`, and `contentHash`.
2. Repository calls `getOrCreateThread({ source: "chatgpt", sourceThreadId })`.
3. Repository checks for an existing message with the same `(threadId, sourceMessageKey)`.
4. If one exists, the save operation is idempotent and returns the existing saved message. If the content hash changed because the message was saved while still streaming, update the saved content in place instead of appending a duplicate.
5. If none exists, repository appends or inserts the saved message.

## Command Routing And Ownership

Use one route for content-script saves:

```text
ChatGPT page button -> content script -> background -> repository -> saved-state event
```

Reasons:

- Saving should work even when the sidebar is closed.
- The background script is the stable extension command handler.
- The sidebar can remain a UI for reading, searching, copying, and deleting.
- Content scripts stay simple and never touch storage directly.

The sidebar may call repository read/delete APIs directly because it is an extension page, but all save commands originating from ChatGPT page buttons should go through the background script.

## Messaging Contracts

Use typed message envelopes so browser runtime messaging stays predictable.

```ts
type ExtensionMessage =
  | {
      type: "CHATGPT_THREAD_CHANGED";
      payload: { sourceThreadId: string; title: string };
    }
  | {
      type: "SAVE_CHATGPT_MESSAGE";
      payload: {
        sourceThreadId: string;
        title: string;
        sourceMessageId: string | null;
        sourceMessageKey: string;
        contentHash: string;
        role: "assistant" | "user";
        contentMarkdown: string;
        contentText: string;
        insertAfterId?: string | null;
      };
    }
  | {
      type: "SAVE_CHATGPT_MESSAGE_RESULT";
      payload: {
        sourceThreadId: string;
        sourceMessageKey: string;
        savedMessageId: string;
        status: "created" | "already_saved" | "updated";
      };
    }
  | {
      type: "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES";
      payload: { sourceThreadId: string; sourceMessageKeys: string[] };
    }
  | {
      type: "GET_ACTIVE_CHATGPT_CONTEXT";
      payload: {};
    };
```

Keep the envelope types in `core/ports.ts`.

## UI Information Architecture

Sidebar layout:

```text
┌────────────────────────────┐
│ Thread search / filter     │
├────────────────────────────┤
│ Saved threads              │
│ - Chat title A             │
│ - Chat title B             │
├────────────────────────────┤
│ Current thread title       │
│ Message search             │
│ [select all] [copy selected]│
├────────────────────────────┤
│ Saved message list         │
│ [ ] [message] [copy] [del] │
│ [ ] [message] [copy] [del] │
└────────────────────────────┘
```

Expected user actions:

- Save any individual ChatGPT message using the injected save button on that message.
- Open saved thread for current ChatGPT conversation.
- Search messages in the selected thread.
- Delete a saved message.
- Copy a saved message's text and paste it back into the ChatGPT composer.
- Select multiple saved messages, or all messages in the current thread, and copy them as one combined text block.
- Navigate to previous/next saved message.
- Rename a saved extension thread.

## Clipboard And Reuse

Each saved message in the sidebar should include a copy button.

Behavior:

- Clicking copy writes the message text to the system clipboard.
- Prefer copying `contentMarkdown` when the saved message has meaningful Markdown formatting.
- Fall back to `contentText` for plain-text messages.
- Show a short copied state on the button after success.
- If clipboard access fails, show a small inline error and leave the message unchanged.
- Request the `clipboardWrite` extension permission for reliable copying from the sidebar.

### Multi-Select Copy

The sidebar should also support selecting multiple saved messages.

Behavior:

- Each saved message row has a checkbox.
- A select-all control selects all messages currently shown in the thread.
- When search is active, select-all should apply to the visible search results, not hidden messages.
- Copy selected combines selected messages in linked-list display order.
- The combined text should use a readable separator between messages, such as two newlines.
- If no messages are selected, the copy-selected button is disabled.
- Selection is UI state only; it should not be stored in IndexedDB.
- Changing threads clears the current selection.
- Deleting a selected message removes it from the current selection.

Future enhancement:

- Add an "insert into ChatGPT" action that sends the saved text from the sidebar to the content script and autofills the active ChatGPT composer.
- Add an "insert selected into ChatGPT" action that uses the same selected-message ordering and combined text format.
- These should be separate from copy-to-clipboard because autofill depends on ChatGPT composer DOM behavior and may require more brittle page-specific logic.

## Portability Boundaries

Browser-specific:

- Manifest fields.
- Sidebar opening/configuration.
- Extension action behavior.
- Firefox add-on ID/signing metadata.

Shared:

- Sidebar UI.
- Content script.
- Storage schema.
- Linked-list model.
- Search.
- Repository.

Recommended build output:

```text
dist/chrome/
dist/firefox/
```

The source code should compile twice with different manifest templates and a browser target flag.

## Privacy And Permissions

The MVP should be local-only.

- Do not send saved ChatGPT messages to any external server.
- Request only the host permissions needed for ChatGPT: `https://chatgpt.com/*` and `https://chat.openai.com/*`.
- Request `storage`, `tabs`, and `clipboardWrite`; Chrome additionally needs `sidePanel`.
- Keep saved notes in IndexedDB in the extension origin.
- Treat exported/copied content as user-controlled text and avoid injecting it as HTML.

## Manifest Shape

Chrome:

```json
{
  "manifest_version": 3,
  "permissions": ["sidePanel", "storage", "tabs", "clipboardWrite"],
  "host_permissions": ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  "background": { "service_worker": "background.js" },
  "side_panel": { "default_path": "sidebar.html" },
  "content_scripts": [
    {
      "matches": ["https://chatgpt.com/*", "https://chat.openai.com/*"],
      "js": ["content.js"]
    }
  ],
  "action": { "default_title": "Open notes" }
}
```

Firefox:

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "tabs", "clipboardWrite"],
  "host_permissions": ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  "background": { "scripts": ["background.js"] },
  "sidebar_action": {
    "default_title": "ChatGPT Notes",
    "default_panel": "sidebar.html"
  },
  "content_scripts": [
    {
      "matches": ["https://chatgpt.com/*", "https://chat.openai.com/*"],
      "js": ["content.js"]
    }
  ],
  "action": { "default_title": "Open notes" },
  "browser_specific_settings": {
    "gecko": {
      "id": "chatgpt-notes-sidebar@example.local"
    }
  }
}
```

Confirm exact Firefox background syntax during implementation, because Firefox Manifest V3 behavior can differ by version and signing target.

## Search Design

Version 1:

- Fetch messages for selected thread.
- Traverse in linked-list order.
- Case-insensitive substring match on `contentText`.
- Highlight matches in UI.

Version 2:

- Add a small full-text index using MiniSearch or Fuse.js.
- Rebuild per-thread index when messages change.
- Keep linked-list order as the display order for results unless the user chooses relevance sorting.

## Testing Strategy

Unit tests:

- Append to empty thread.
- Append to non-empty thread.
- Insert before head.
- Insert after tail.
- Delete only message.
- Delete head.
- Delete tail.
- Delete middle.
- Reject cross-thread pointer corruption.
- Traverse detects cycles or broken pointers.

Integration tests:

- Inject save buttons into mocked ChatGPT message DOM.
- Save message from mocked ChatGPT DOM button click.
- Open sidebar and see thread.
- Search saved messages.
- Copy saved message text from the sidebar.
- Select multiple saved messages and copy them as one ordered text block.
- Select all visible search results and copy them.
- Delete saved message and verify list order.

Manual browser tests:

- Load unpacked Chrome build.
- Load temporary Firefox add-on.
- Open ChatGPT conversation.
- Verify each ChatGPT message has one save button.
- Save several assistant messages using their injected buttons.
- Copy a saved message from the sidebar and paste it into the ChatGPT composer manually.
- Select multiple saved messages, copy them together, and paste the combined text into the ChatGPT composer manually.
- Search within a thread, select all visible results, and copy only those visible selected results.
- Delete head/middle/tail saved messages.
- Reload browser and verify persistence.

## Suggested First Milestone

Build the extension as a local-only MVP:

1. Scaffold TypeScript extension project with Vite.
2. Add Chrome and Firefox manifest templates.
3. Implement IndexedDB repository and linked-list tests.
4. Implement static sidebar UI against repository.
5. Add ChatGPT content script to detect messages and inject one save button per message.
6. Wire save button clicks to create/update the matching sidebar thread.
7. Wire sidebar single-copy, multi-select copy, select-all, delete, search, and navigation.
8. Package separate Chrome and Firefox builds.
