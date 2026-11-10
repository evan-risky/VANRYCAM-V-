import "server-only";
import { getGasWebAppUrl } from "@/lib/config";

export type GasUploadResult = {
  success: boolean;
  message: string;
  folderUrl: string | null;
  fileUrl: string | null;
  fileId: string | null;
  fileNameFoto: string | null;
};

export type GalleryFile = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
};

const GALLERY_CACHE_TTL_MS = 20_000;
const GAS_PLACEHOLDER_PATTERN = /DEPLOYMENT_ID|YOUR_DEPLOYMENT|EXAMPLE/i;

// Cache in-memory per-instance serverless. Tidak dibagi antar instance dan
// hilang saat instance dingin; hanya untuk mengurangi frekuensi panggilan GAS.
let galleryCache: { files: GalleryFile[]; fetchedAt: number } | null = null;

export function isGasConfigured(): boolean {
  const url = getGasWebAppUrl();
  return url !== null && !GAS_PLACEHOLDER_PATTERN.test(url);
}

function normalizeGalleryFile(value: unknown): GalleryFile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const id = typeof record.id === "string" ? record.id : "";
  const mimeType =
    typeof record.mimeType === "string" ? record.mimeType : "";
  const name = typeof record.name === "string" ? record.name : "";
  const size =
    typeof record.size === "number" && Number.isFinite(record.size)
      ? record.size
      : 0;
  const createdAt =
    typeof record.createdAt === "string" ? record.createdAt : "";

  if (!id || !mimeType.startsWith("image/")) return null;

  return { id, name: name || id, size, mimeType, createdAt };
}

function nonJsonSnippet(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

// Pesan error sengaja dibedakan (env/placeholder, non-JSON, HTTP error,
// ok:false) agar route /api/gallery bisa memetakan ke status code dan pesan
// yang tepat. Jangan sertakan URL GAS di pesan error.
export async function listGalleryFiles(): Promise<GalleryFile[]> {
  const now = Date.now();
  if (galleryCache && now - galleryCache.fetchedAt < GALLERY_CACHE_TTL_MS) {
    return galleryCache.files;
  }

  const base = getGasWebAppUrl();
  if (!base || !isGasConfigured()) {
    throw new Error("GAS_WEB_APP_URL belum diatur atau masih placeholder");
  }

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new Error("GAS_WEB_APP_URL belum diatur atau masih placeholder");
  }
  url.searchParams.set("action", "listGallery");

  const response = await fetch(url.toString(), {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GAS responded ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const snippet = nonJsonSnippet(await response.text());
    throw new Error(
      `GAS non-JSON response (mungkin HTML form atau login page): ${snippet}`,
    );
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `GAS non-JSON response (mungkin HTML form atau login page): ${nonJsonSnippet(text)}`,
    );
  }

  const record = (parsed ?? {}) as Record<string, unknown>;
  if (record.ok !== true || !Array.isArray(record.files)) {
    const detail =
      typeof record.message === "string" && record.message.length > 0
        ? record.message
        : typeof record.error === "string" && record.error.length > 0
          ? record.error
          : "";
    throw new Error(
      detail ? `GAS returned ok:false: ${detail}` : "GAS returned ok:false",
    );
  }

  const files = record.files
    .map(normalizeGalleryFile)
    .filter((file): file is GalleryFile => file !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  galleryCache = { files, fetchedAt: now };
  return files;
}

export async function uploadCollageToGas(input: {
  fileName: string;
  mimeType: string;
  base64: string;
}): Promise<GasUploadResult> {
  const url = getGasWebAppUrl();
  if (!url) throw new Error("GAS_WEB_APP_URL belum diatur");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      fileName: input.fileName,
      mimeType: input.mimeType,
      base64: input.base64,
    }),
    redirect: "follow",
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GAS merespons ${response.status}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Respons GAS bukan JSON yang valid");
  }

  const record = (parsed ?? {}) as Record<string, unknown>;
  const pick = (keys: string[]): string | null => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.length > 0) return value;
    }
    return null;
  };

  return {
    success: record.success === true,
    message: typeof record.message === "string" ? record.message : "",
    folderUrl: pick(["folderUrl", "folder_url"]),
    fileUrl: pick(["fileUrl", "file_url", "driveFileUrl", "downloadUrl"]),
    fileId: pick(["driveFileId", "fileId", "file_id", "id"]),
    fileNameFoto: pick(["fileNameFoto", "fileName", "file_name"]),
  };
}