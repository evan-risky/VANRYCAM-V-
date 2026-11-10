"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  CircleAlert,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/components/session-provider";
import { apiGet, ApiError } from "@/lib/api-client";
import type { GalleryFile } from "@/lib/gas";
import { clearPhotos } from "@/lib/photo-store";

type GalleryResponse = { files: GalleryFile[] };

type GalleryError = {
  code: string;
  message: string;
  detail: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  gas_not_configured:
    "Galeri belum dikonfigurasi. Admin perlu mengatur GAS_WEB_APP_URL di environment.",
  gas_invalid_response:
    "Layanan galeri mengembalikan respons tidak valid. Hubungi admin.",
  gas_unreachable:
    "Layanan galeri tidak dapat dihubungi. Periksa koneksi.",
  gas_error: "Layanan galeri melaporkan error. Hubungi admin.",
  gallery_unavailable: "Galeri tidak dapat dimuat. Coba lagi.",
};

const SPAN_PATTERN = [
  "",
  "row-span-2",
  "",
  "col-span-2 row-span-2",
  "",
  "row-span-2",
  "col-span-2",
  "",
  "row-span-2",
  "col-span-2 row-span-2",
];

function spanClass(index: number): string {
  return SPAN_PATTERN[index % SPAN_PATTERN.length] ?? "";
}

function imageUrl(id: string): string {
  return `/api/gallery/${id}/image`;
}

function downloadUrl(id: string): string {
  return `/api/gallery/${id}/download`;
}

function GalleryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uploaded = searchParams.get("uploaded") === "1";
  const { resetSession } = useSession();

  const [items, setItems] = useState<GalleryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GalleryError | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<GalleryResponse>("/api/gallery");
      setItems(data.files);
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError({
          code: cause.code,
          message:
            ERROR_MESSAGES[cause.code] ?? ERROR_MESSAGES.gallery_unavailable,
          detail: cause.message,
        });
      } else {
        setError({
          code: "gallery_unavailable",
          message: ERROR_MESSAGES.gallery_unavailable,
          detail: cause instanceof Error ? cause.message : "Unknown error",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (activeIdx === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIdx(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIdx]);

  const reload = useCallback(() => {
    setActiveIdx(null);
    void load();
  }, [load]);

  async function lanjutkanJepret() {
    if (resetting) return;
    setResetError(null);
    setResetting(true);
    const result = await resetSession();
    if (!result.ok) {
      setResetError(result.message);
      setResetting(false);
      return;
    }
    await clearPhotos().catch(() => undefined);
    router.push("/mulai");
  }

  const active = activeIdx === null ? null : (items[activeIdx] ?? null);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <Brand />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Beranda
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Galeri acara
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Semua kolase yang diunggah tamu ke folder acara tampil di sini.
            Pratinjau dan unduhan diproses lewat server Vanry Cam.
          </p>
        </div>

        {uploaded ? (
          <Alert>
            <Sparkles />
            <AlertTitle>Kolase terunggah</AlertTitle>
            <AlertDescription>
              Kolase milikmu sudah tersimpan. Jika belum muncul, tunggu sebentar
              lalu tekan “Muat ulang”.
            </AlertDescription>
          </Alert>
        ) : null}

        {resetError ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{resetError}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="gallery-wrapper" aria-busy="true">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="size-full rounded" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>
              {error.code === "gas_not_configured"
                ? "Galeri belum dikonfigurasi"
                : "Galeri tidak dapat dimuat"}
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>{error.message}</span>
              {process.env.NODE_ENV === "development" &&
              error.detail.length > 0 ? (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none">
                    Detail (dev)
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap break-words">
                    {error.detail}
                  </pre>
                </details>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => void load()}
              >
                <RefreshCw className="size-3.5" />
                Coba lagi
              </Button>
            </AlertDescription>
          </Alert>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Camera className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Belum ada kolase. Jadilah yang pertama!
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Jepret momen acara, buat kolase, lalu unggah agar tampil di
                galeri ini.
              </p>
              <Button
                nativeButton={false}
                render={<Link href="/kamera" />}
              >
                <Camera className="size-4" />
                Buka kamera
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="gallery-wrapper">
            {items.map((file, index) => (
              <figure
                key={file.id}
                className={[
                  "gallery-item group bg-muted",
                  spanClass(index),
                  "max-[399px]:col-span-1",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => setActiveIdx(index)}
                  aria-label={`Buka ${file.name}`}
                  className="block size-full cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(file.id)}
                    alt={file.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>

                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                />

                <a
                  href={downloadUrl(file.id)}
                  download
                  aria-label={`Unduh ${file.name}`}
                  className="absolute right-2 bottom-2 z-10 inline-flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="size-4" />
                </a>
              </figure>
            ))}
          </div>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="flex w-full gap-3 sm:mx-auto sm:max-w-md">
            <Button
              className="flex-1"
              onClick={() => void lanjutkanJepret()}
              disabled={resetting}
            >
              {resetting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {resetting ? "Menyiapkan…" : "Lanjutkan Jepret"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={reload}
              disabled={loading}
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin" : ""}`}
              />
              Muat ulang
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Lanjutkan Jepret memulai sesi baru dengan kuota baru. Kolase yang
            sudah diunggah tetap tersimpan.
          </p>
        </div>
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.name}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-4 bg-black/90 p-4"
          onClick={() => setActiveIdx(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(active.id)}
            alt={active.name}
            className="max-h-[78vh] max-w-[92vw] rounded border border-white/20 object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          <div
            className="flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              nativeButton={false}
              render={<a href={downloadUrl(active.id)} download />}
            >
              <Download className="size-4" />
              Unduh
            </Button>
            <Button variant="outline" onClick={() => setActiveIdx(null)}>
              <X className="size-4" />
              Tutup
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function GaleriPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-4 py-6">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-[60vh] w-full rounded-2xl" />
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
