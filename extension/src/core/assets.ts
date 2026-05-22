import { stableHash } from "./hash";

export const NOTEBOOK_ASSET_URL_PREFIX = "cgpt-asset:";
export const MAX_IMAGE_ASSET_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type ImageAssetValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; error: string };

export function validateImageAsset(file: Blob): ImageAssetValidationResult {
  const mimeType = normalizeImageMimeType(file.type);

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: "Use a PNG, JPEG, WebP, or GIF image." };
  }

  if (file.size > MAX_IMAGE_ASSET_BYTES) {
    return { ok: false, error: "Images must be 5 MB or smaller." };
  }

  return { ok: true, mimeType };
}

export function createAssetMarkdown(assetId: string, altText: string): string {
  return `![${escapeImageAltText(altText)}](${NOTEBOOK_ASSET_URL_PREFIX}${assetId})`;
}

export function getAssetIdFromHref(href: string): string | null {
  return href.startsWith(NOTEBOOK_ASSET_URL_PREFIX) ? href.slice(NOTEBOOK_ASSET_URL_PREFIX.length) || null : null;
}

export function extractAssetIdsFromMarkdown(markdown: string): string[] {
  const ids = new Set<string>();
  const pattern = /!\[[^\]\n]*\]\(([^)\s]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown)) !== null) {
    const assetId = getAssetIdFromHref(match[1]);

    if (assetId) {
      ids.add(assetId);
    }
  }

  return [...ids];
}

export async function getBlobContentHash(blob: Blob): Promise<string> {
  const buffer = await blobToArrayBuffer(blob);

  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array(buffer));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  const bytes = Array.from(new Uint8Array(buffer), (byte) => String.fromCharCode(byte)).join("");
  return stableHash(bytes);
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read image bytes."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image bytes."));
    reader.readAsArrayBuffer(blob);
  });
}

export async function readImageDimensions(blob: Blob): Promise<{ width: number; height: number } | null> {
  if (typeof Image === "undefined" || !globalThis.URL?.createObjectURL) {
    return null;
  }

  const url = URL.createObjectURL(blob);

  try {
    return await new Promise((resolve) => {
      const image = new Image();

      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve(null);
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function normalizeImageMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}

function escapeImageAltText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\r?\n/g, " ").trim();
}
