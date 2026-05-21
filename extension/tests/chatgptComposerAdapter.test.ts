import { describe, expect, it } from "vitest";

import { insertTextIntoChatGptComposer } from "../src/content/chatgptComposerAdapter";

describe("chatgptComposerAdapter", () => {
  it("inserts text into the ChatGPT textarea without submitting", () => {
    document.body.innerHTML = `<textarea id="prompt-textarea">Existing prompt</textarea>`;
    const textarea = document.querySelector<HTMLTextAreaElement>("#prompt-textarea");

    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
    const result = insertTextIntoChatGptComposer("Saved note");

    expect(result).toEqual({ inserted: true });
    expect(textarea?.value).toBe("Existing prompt\n\nSaved note");
  });

  it("reports a friendly error when the composer is missing", () => {
    document.body.innerHTML = "";

    expect(insertTextIntoChatGptComposer("Saved note")).toEqual({
      inserted: false,
      error: "Could not find the ChatGPT text box.",
    });
  });
});
