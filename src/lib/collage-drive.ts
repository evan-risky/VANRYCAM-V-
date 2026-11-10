import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGuestGuardFailure, requireGuestSession } from "@/lib/guest-guard";

type CollageFile = {
  id: string;
  mimeType: string | null;
  driveFileUrl: string | null;
  driveFileId: string | null;
  driveFileName: string | null;
};

type DriveStream = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
};

const GALLERY_FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

export function isValidGalleryFileId(value: string): boolean {
  return GALLERY_FILE_ID_PATTERN.test(value);
}

function driveIdCandidates(fileId: string): string[] {
  const id = encodeURIComponent(fileId);
  return [
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    `https://lh3.googleusercontent.com/d/${id}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
  ];
}

function driveCandidates(collage: CollageFile): string[] {
  const urls = collage.driveFileId
    ? driveIdCandidates(collage.driveFileId)
    : [];
  if (collage.driveFileUrl) urls.push(collage.driveFileUrl);
  return urls;
}

async function loadDriveStream(
  candidates: string[],
): Promise<DriveStream | null> {
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        cache: "no-store",
      });
      if (!response.ok || !response.body) continue;
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) continue;
      return { body: response.body, contentType };
    } catch {
      continue;
    }
  }
  return null;
}

function buildStreamResponse(
  file: DriveStream,
  disposition: "inline" | "attachment",
  fileName: string,
  mimeType?: string | null,
): NextResponse {
  const headers = new Headers();
  headers.set("Content-Type", mimeType ?? file.contentType);
  headers.set("Cache-Control", "private, no-store");
  headers.set(
    "Content-Disposition",
    disposition === "inline"
      ? "inline"
      : `attachment; filename="${fileName}"`,
  );
  return new NextResponse(file.body, { status: 200, headers });
}

export async function buildCollageResponse(
  request: Request,
  collageId: string,
  disposition: "inline" | "attachment",
): Promise<NextResponse> {
  const guard = await requireGuestSession(request);
  if (isGuestGuardFailure(guard)) {
    return NextResponse.json(
      { error: guard.error, message: guard.message },
      { status: guard.status },
    );
  }

  const collage = await prisma.collage.findFirst({
    where: {
      id: collageId,
      sessionId: guard.session.id,
      eventId: guard.event.id,
      status: "UPLOADED",
    },
    select: {
      id: true,
      mimeType: true,
      driveFileUrl: true,
      driveFileId: true,
      driveFileName: true,
    },
  });
  if (!collage) {
    return NextResponse.json(
      { error: "not_found", message: "Kolase tidak ditemukan." },
      { status: 404 },
    );
  }

  const file = await loadDriveStream(driveCandidates(collage));
  if (!file) {
    return NextResponse.json(
      { error: "storage_unavailable", message: "Kolase tidak dapat diambil." },
      { status: 502 },
    );
  }

  return buildStreamResponse(
    file,
    disposition,
    collage.driveFileName ?? `vanry-cam-kolase-${collage.id}.jpg`,
    collage.mimeType,
  );
}

export async function buildGalleryResponse(
  fileId: string,
  disposition: "inline" | "attachment",
): Promise<Response> {
  if (!isValidGalleryFileId(fileId)) {
    return NextResponse.json(
      { error: "not_found", message: "Gambar tidak ditemukan." },
      { status: 404 },
    );
  }

  const file = await loadDriveStream(driveIdCandidates(fileId));
  if (!file) {
    return NextResponse.json(
      { error: "not_found", message: "Gambar tidak ditemukan." },
      { status: 404 },
    );
  }

  return buildStreamResponse(
    file,
    disposition,
    `vanry-cam-${fileId}.jpg`,
    file.contentType,
  );
}