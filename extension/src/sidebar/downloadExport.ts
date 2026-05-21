import type { NotebookExportFile } from "../core/notebookExport";

export function downloadNotebookExport(file: NotebookExportFile): void {
  const blob = new Blob([file.contents], { type: `${file.mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = file.filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
