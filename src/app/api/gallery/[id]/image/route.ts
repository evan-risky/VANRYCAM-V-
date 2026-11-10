import { NextResponse } from "next/server";
import {
  buildGalleryResponse,
  isValidGalleryFileId,
} from "@/lib/collage-drive";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(
    `gallery-image:${clientIp(request)}`,
    60,
    60 * 1000,
  );
  if (!limited.ok) return rateLimitResponse(limited.retryAfter);

  const { id } = await context.params;
  if (!isValidGalleryFileId(id)) {
    return NextResponse.json(
      { error: "not_found", message: "Gambar tidak ditemukan." },
      { status: 404 },
    );
  }

  return buildGalleryResponse(id, "inline");
}
