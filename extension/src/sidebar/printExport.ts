type NotebookPrintWindowController = {
  close(): void;
  print(html: string): void;
};

export function openNotebookPrintWindow(): NotebookPrintWindowController | null {
  const printWindow = window.open("", "_blank", "popup,width=900,height=700");

  if (!printWindow) {
    return null;
  }

  writeHtml(
    printWindow,
    [
      "<!doctype html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="utf-8">',
      "<title>Preparing notebook</title>",
      "</head>",
      "<body>",
      "<p>Preparing notebook...</p>",
      "</body>",
      "</html>",
    ].join("\n"),
  );

  return {
    close() {
      if (!printWindow.closed) {
        printWindow.close();
      }
    },
    print(html: string) {
      writeHtml(printWindow, html);
      printWindow.focus();

      window.setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.print();
        }
      }, 250);
    },
  };
}

function writeHtml(targetWindow: Window, html: string): void {
  targetWindow.document.open();
  targetWindow.document.write(html);
  targetWindow.document.close();
}
