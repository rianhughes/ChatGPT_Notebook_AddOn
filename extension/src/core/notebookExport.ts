import { NOTEBOOK_ASSET_URL_PREFIX } from "./assets";
import type { ChatGptThread, MessageRole, NotebookAsset, SavedMessage } from "./models";

const EXPORT_APP_ID = "chatgpt-notes-sidebar";
const EXPORT_VERSION = 2;

export type NotebookExportFormatId = "markdown" | "json";

export type NotebookExportMessage = {
  id: string;
  position: number;
  role: MessageRole;
  sourceMessageId: string | null;
  sourceMessageKey: string;
  contentHash: string;
  contentMarkdown: string;
  contentText: string;
  createdAt: number;
  updatedAt: number;
};

export type NotebookExportData = {
  app: typeof EXPORT_APP_ID;
  exportVersion: typeof EXPORT_VERSION;
  exportedAt: string;
  thread: {
    id: string;
    source: ChatGptThread["source"];
    sourceThreadId: string;
    title: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
  };
  messages: NotebookExportMessage[];
  assets: NotebookExportAsset[];
};

export type NotebookExportAsset = {
  id: string;
  threadId: string;
  messageId: string | null;
  kind: NotebookAsset["kind"];
  mimeType: string;
  filename: string | null;
  altText: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  contentHash: string;
  contentBase64: string;
  createdAt: number;
  updatedAt: number;
};

export type NotebookExportFormatter = {
  id: NotebookExportFormatId;
  label: string;
  fileExtension: string;
  mimeType: string;
  format(data: NotebookExportData): string;
};

export type NotebookExportFile = {
  format: NotebookExportFormatter;
  filename: string;
  mimeType: string;
  contents: string;
};

export const DEFAULT_NOTEBOOK_EXPORT_FORMAT_ID: NotebookExportFormatId = "markdown";

export const NOTEBOOK_EXPORT_FORMATTERS: readonly NotebookExportFormatter[] = [
  {
    id: "markdown",
    label: "Markdown",
    fileExtension: "md",
    mimeType: "text/markdown",
    format: formatMarkdownExport,
  },
  {
    id: "json",
    label: "JSON",
    fileExtension: "json",
    mimeType: "application/json",
    format: formatJsonExport,
  },
] as const;

export function createNotebookExportData(
  thread: ChatGptThread,
  messages: SavedMessage[],
  options: { now?: number | Date } = {},
): NotebookExportData {
  return {
    app: EXPORT_APP_ID,
    exportVersion: EXPORT_VERSION,
    exportedAt: toIsoString(options.now ?? Date.now()),
    thread: {
      id: thread.id,
      source: thread.source,
      sourceThreadId: thread.sourceThreadId,
      title: thread.title,
      messageCount: messages.length,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    },
    messages: messages.map((message, index) => ({
      id: message.id,
      position: index,
      role: message.role,
      sourceMessageId: message.sourceMessageId,
      sourceMessageKey: message.sourceMessageKey,
      contentHash: message.contentHash,
      contentMarkdown: message.contentMarkdown,
      contentText: message.contentText,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    })),
    assets: [],
  };
}

export async function createNotebookExportDataWithAssets(
  thread: ChatGptThread,
  messages: SavedMessage[],
  assets: NotebookAsset[],
  options: { now?: number | Date } = {},
): Promise<NotebookExportData> {
  const data = createNotebookExportData(thread, messages, options);

  return {
    ...data,
    assets: await Promise.all(
      assets.map(async (asset) => ({
        id: asset.id,
        threadId: asset.threadId,
        messageId: asset.messageId,
        kind: asset.kind,
        mimeType: asset.mimeType,
        filename: asset.filename,
        altText: asset.altText,
        byteSize: asset.byteSize,
        width: asset.width,
        height: asset.height,
        contentHash: asset.contentHash,
        contentBase64: await blobToBase64(asset.blob),
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      })),
    ),
  };
}

export function createNotebookExportFile(
  data: NotebookExportData,
  formatId: NotebookExportFormatId,
): NotebookExportFile {
  const format = getNotebookExportFormatter(formatId);
  const contents = format.format(data);

  return {
    format,
    filename: createNotebookExportFilename(data, format.fileExtension),
    mimeType: format.mimeType,
    contents,
  };
}

export function getNotebookExportFormatter(formatId: NotebookExportFormatId): NotebookExportFormatter {
  const formatter = NOTEBOOK_EXPORT_FORMATTERS.find((candidate) => candidate.id === formatId);

  if (!formatter) {
    throw new Error(`Unsupported notebook export format: ${formatId}`);
  }

  return formatter;
}

function formatMarkdownExport(data: NotebookExportData): string {
  const header = [
    "---",
    `app: ${yamlScalar(data.app)}`,
    `exportVersion: ${data.exportVersion}`,
    `title: ${yamlScalar(data.thread.title)}`,
    `source: ${yamlScalar(data.thread.source)}`,
    `sourceThreadId: ${yamlScalar(data.thread.sourceThreadId)}`,
    `exportedAt: ${yamlScalar(data.exportedAt)}`,
    `messageCount: ${data.messages.length}`,
    "---",
    "",
    `# ${data.thread.title}`,
  ].join("\n");

  if (data.messages.length === 0) {
    return `${header}\n`;
  }

  return `${header}\n\n${data.messages.map((message) => formatMarkdownMessage(message, data.assets)).join("\n\n")}\n`;
}

function formatMarkdownMessage(message: NotebookExportMessage, assets: NotebookExportAsset[]): string {
  const markdown = replaceAssetLinksWithDataUrls(message.contentMarkdown.trim() || message.contentText.trim(), assets);
  const timestamp = toIsoString(message.createdAt);

  return [`## ${formatRole(message.role)} - ${timestamp}`, "", markdown].join("\n").trimEnd();
}

function formatJsonExport(data: NotebookExportData): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

function createNotebookExportFilename(data: NotebookExportData, fileExtension: string): string {
  const slug = slugifyFilenamePart(data.thread.title) || "notebook";
  const exportedDate = data.exportedAt.slice(0, 10);
  return `${slug}-${exportedDate}.${fileExtension}`;
}

function slugifyFilenamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function yamlScalar(value: string): string {
  return JSON.stringify(value);
}

function formatRole(role: MessageRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function toIsoString(value: number | Date): string {
  return new Date(value).toISOString();
}

function replaceAssetLinksWithDataUrls(markdown: string, assets: NotebookExportAsset[]): string {
  const assetsByHref = new Map(
    assets.map((asset) => [
      `${NOTEBOOK_ASSET_URL_PREFIX}${asset.id}`,
      `data:${asset.mimeType};base64,${asset.contentBase64}`,
    ]),
  );

  return markdown.replace(
    /!\[([^\]\n]*)\]\((cgpt-asset:[^)]+)\)/g,
    (_match, altText: string, href: string) => `![${altText}](${assetsByHref.get(href) ?? href})`,
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(index, index + 0x8000));
  }

  return btoa(binary);
}
