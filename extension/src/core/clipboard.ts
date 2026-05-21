export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const selection = document.getSelection();
  const selectedRanges =
    selection && selection.rangeCount > 0
      ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange())
      : [];
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.append(textarea);
  textarea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Clipboard copy was rejected");
    }
  } finally {
    textarea.remove();
    selection?.removeAllRanges();
    selectedRanges.forEach((range) => selection?.addRange(range));
    activeElement?.focus({ preventScroll: true });
  }
}

export function getMessageCopyText(input: { contentMarkdown: string; contentText: string }): string {
  return input.contentMarkdown.trim() || input.contentText.trim();
}

export function joinMessagesForCopy(messages: Array<{ contentMarkdown: string; contentText: string }>): string {
  return messages.map(getMessageCopyText).filter(Boolean).join("\n\n");
}
