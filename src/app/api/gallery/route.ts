import { NextResponse } from "next/server";
import { listGalleryFiles } from "@/lib/gas";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function galleryError(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

export async function GET(request: Request) {
  const limited = rateLimit(`gallery:${clientIp(request)}`, 30, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfter);

  try {
    const files = await listGalleryFiles();
    return NextResponse.json({ files });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/gallery] gagal memuat galeri:", message);
    }

    if (message.includes("belum diatur") || message.includes("placeholder")) {
      return galleryError(
        503,
        "gas_not_configured",
        "Layanan galeri belum dikonfigurasi.",
      );
    }

    if (message.includes("non-JSON")) {
      return galleryError(
        502,
        "gas_invalid_response",
        "Layanan galeri mengembalikan respons tidak valid.",
      );
    }

    if (message.includes("GAS responded")) {
      return galleryError(
        502,
        "gas_unreachable",
        "Layanan galeri tidak dapat dihubungi.",
      );
    }

    if (message.includes("ok:false") || message.includes("GAS menolak")) {
      return galleryError(
        502,
        "gas_error",
        "Layanan galeri melaporkan error.",
      );
    }

    return galleryError(
      502,
      "gallery_unavailable",
      "Galeri tidak dapat dimuat.",
    );
  }
}
