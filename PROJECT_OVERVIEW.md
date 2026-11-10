# PROJECT OVERVIEW — Vanry Cam

> Dokumen hasil analisis read-only struktur project. Satu-satunya file yang dibuat adalah
> `PROJECT_OVERVIEW.md` ini. Tidak ada file kode yang diubah.
>
> Sumber data: pembacaan langsung seluruh file di repo, `package.json`, `prisma/schema.prisma`,
> `next.config.ts`, `prisma7.config.ts`, migrasi Prisma, `PRD.md`, `AGENTS.md`, `DEPLOYMENT.md`.
> Perilaku runtime, isi database nyata, dan endpoint GAS/Google Drive **tidak** diverifikasi karena
> membutuhkan layanan eksternal.

---

## 1. Pemetaan Struktur

### 1.1 Tree folder (tanpa `node_modules`, `.git`, `.next`, `src/generated`, dll.)

```text
Van-cam/
├── .env.example
├── .gitignore
├── AGENTS.md
├── DEPLOYMENT.md
├── LICENSE
├── PRD.md
├── README.md
├── components.json
├── docs/
│   └── gas-gallery.gs                  # Cuplikan handler GAS `action=listGallery`
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── prisma7.config.ts
├── tsconfig.json
├── vitest.config.mts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20261013033937_init/migration.sql
│       ├── 20261014090000_photo_blob_mysql/migration.sql
│       ├── 20261015090000_collages/migration.sql
│       ├── 20261016090000_collage_gas_drive/migration.sql
│       └── 20261017090000_collage_drive_file_id/migration.sql
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── src/
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx                      # Landing tamu
    │   ├── mulai/page.tsx                # Form nama + kuota
    │   ├── izin-kamera/page.tsx          # Penjelasan izin kamera
    │   ├── kamera/page.tsx               # Kamera + IndexedDB
    │   ├── kolase/page.tsx               # Susun & unggah kolase
    │   ├── galeri/page.tsx               # Galeri masonry (proxy GAS/Drive)
    │   ├── admin/
    │   │   ├── login/page.tsx
    │   │   └── (panel)/
    │   │       ├── layout.tsx
    │   │       ├── page.tsx              # Dashboard
    │   │       ├── tamu/page.tsx
    │   │       ├── qr/page.tsx
    │   │       ├── foto/page.tsx
    │   │       └── pengaturan/page.tsx
    │   └── api/
    │       ├── event/route.ts
    │       ├── sessions/route.ts
    │       ├── sessions/me/route.ts
    │       ├── sessions/me/reset/route.ts
    │       ├── sessions/me/photos/route.ts
    │       ├── sessions/me/photos/reserve/route.ts
    │       ├── sessions/me/collage/route.ts
    │       ├── sessions/me/collage/reserve/route.ts
    │       ├── photos/[id]/upload/route.ts
    │       ├── photos/[id]/download/route.ts
    │       ├── upload/collage/route.ts
    │       ├── collage/[id]/image/route.ts
    │       ├── collages/[id]/preview/route.ts
    │       ├── collages/[id]/download/route.ts
    │       ├── gallery/route.ts
    │       ├── gallery/[id]/image/route.ts
    │       ├── gallery/[id]/download/route.ts
    │       └── admin/
    │           ├── auth/login/route.ts
    │           ├── auth/logout/route.ts
    │           ├── auth/me/route.ts
    │           ├── overview/route.ts
    │           ├── guests/route.ts
    │           ├── photos/route.ts
    │           ├── photos/[id]/route.ts
    │           ├── audit/route.ts
    │           └── event/route.ts
    ├── components/
    │   ├── admin/
    │   │   ├── admin-nav.tsx
    │   │   └── logout-button.tsx
    │   ├── ui/
    │   │   ├── alert.tsx
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── progress.tsx
    │   │   ├── radio-group.tsx
    │   │   ├── separator.tsx
    │   │   └── skeleton.tsx
    │   ├── brand.tsx
    │   ├── collage-poster.tsx
    │   ├── guest-shell.tsx
    │   ├── photo-lightbox.tsx
    │   └── session-provider.tsx
    └── lib/
        ├── admin-auth.ts
        ├── admin-guard.ts
        ├── api-client.ts
        ├── audit.ts
        ├── collage-compose.ts
        ├── collage-drive.ts
        ├── collage-quota.ts
        ├── collage-style.ts
        ├── config.ts
        ├── crypto.ts
        ├── database-url.ts
        ├── event.ts
        ├── gas.ts
        ├── guest-guard.ts
        ├── guest-session.ts
        ├── image-capture.ts
        ├── image.ts
        ├── photo-store.ts
        ├── prisma.ts
        ├── quota.ts
        ├── rate-limit.ts
        ├── utils.ts
        ├── config.test.ts
        ├── crypto.test.ts
        ├── database-url.test.ts
        ├── photo-store.test.ts
        └── rate-limit.test.ts
```

File yang di-*generate* / diabaikan: `src/generated/prisma/*` (Prisma Client, di-*gitignore*, dibuat oleh
`prisma generate`/`postinstall`), `.next/`, `node_modules/`.

### 1.2 Jenis project

- **Framework:** Next.js 16.4.0 App Router (React Server Components + Client Components).
- **Bahasa:** TypeScript (`.ts`/`.tsx`), CSS (Tailwind v4), SQL (migrasi Prisma).
- **Arsitektur:** **Monolith full-stack** dalam satu aplikasi Next.js.
  - Frontend = halaman App Router (`src/app/**/page.tsx`).
  - Backend = Route Handlers (`src/app/api/**/route.ts`) sebagai API internal.
  - Bukan microservice, bukan SPA React/Vite terpisah.
- **Model komunikasi:** client-server internal (browser → Route Handler → Prisma → MySQL; Route Handler →
  GAS → Google Drive/Sheets).
- **Deployment target:** Vercel (serverless) + MySQL 8 terkelola.
- **Domain:** aplikasi web kamera disposable untuk pernikahan; tamu memotret, menyusun kolase, mengunggah
  satu kolase, lalu melihat galeri.

---

## 2. Tech Stack

### 2.1 Bahasa & runtime

| Komponen | Teknologi |
|---|---|
| Bahasa | TypeScript 5 (strict), TSX |
| Runtime | Node.js (Next.js server; `node:crypto`, `Buffer`, `ReadableStream`) |
| Styling | Tailwind CSS v4 |
| Markup/metadata | Next.js App Router, React 19.3.0 |

### 2.2 Dependensi produksi (`package.json`)

| Paket | Versi | Fungsi |
|---|---|---|
| `next` | `16.4.0` | Framework full-stack App Router + Route Handlers |
| `react`, `react-dom` | `19.3.0` | UI runtime |
| `@base-ui/react` | `^1.9.0` | Primitive UI untuk komponen shadcn style `base-nova` |
| `shadcn` | `^4.21.4` | Basis/CLI komponen shadcn |
| `class-variance-authority` | `^0.7.1` | Varian komponen (Button, Badge, Alert) |
| `cn` | `^0.4.0` | Utilitas penggabung className (di-*re-export* `src/lib/utils.ts`) |
| `lucide-react` | `^1.55.0` | Ikon |
| `qrcode.react` | `^4.2.0` | QR code halaman admin |
| `tw-animate-css` | `^1.4.0` | Animasi Tailwind |
| `@prisma/client` | `^7.10.0` | ORM client |
| `@prisma/adapter-mariadb` | `^7.10.0` | Adapter driver MariaDB/MySQL untuk Prisma 7 |
| `server-only` | `^0.0.1` | Guard modul khusus server |

### 2.3 Dependensi pengembangan

| Paket | Versi | Fungsi |
|---|---|---|
| `typescript` | `^5` | Type checking |
| `@types/node` | `^22.20.5` | Tipe Node |
| `@types/react`, `@types/react-dom` | `^19` | Tipe React |
| `eslint`, `eslint-config-next` | `^9`, `16.4.0` | Lint |
| `tailwindcss`, `@tailwindcss/turbopack` | `^4` | Tailwind v4 + loader Turbopack |
| `prisma` | `^7.10.0` | CLI Prisma |
| `tsx` | `^4.23.15` | Menjalankan `prisma/seed.ts` |
| `vitest` | `^5.0.4` | Unit test |
| `dotenv` | `^18.0.7` | Load `.env.local` untuk CLI Prisma/seed |

### 2.4 Tools & konfigurasi build

- **Turbopack** (`next.config.ts`): rule loader CSS `@tailwindcss/turbopack`.
- **Cache Components** aktif (`cacheComponents: true`) dan `partialPrefetching: true`.
- **`allowedDevOrigins`** dari env `ALLOWED_DEV_ORIGINS` (default `192.168.101.127,localhost,127.0.0.1`).
- **ESLint flat config** (`eslint.config.mjs`, `next/core-web-vitals` + `next/typescript`), mematikan
  `react-hooks/set-state-in-effect`.
- **Vitest** (`vitest.config.mts`): environment `node`, include `src/**/*.test.ts`, alias `@` → `src`,
  env `SESSION_SECRET=test-session-secret`.
- **shadcn** (`components.json`): style `base-nova`, RSC `true`, Tailwind CSS variables, ikon Lucide,
  alias `@/components`, `@/lib`, `@/components/ui`.
- **Prisma 7** (`prisma7.config.ts`): load `.env.local`, schema `prisma/schema.prisma`, seed `tsx prisma/seed.ts`,
  datasource URL dari `DATABASE_URL` (schema sendiri **tidak** memuat `url`).

### 2.5 Integration eksternal

- **MySQL 8** via `@prisma/adapter-mariadb`.
- **Google Apps Script (GAS) Web App** (`GAS_WEB_APP_URL`) → Google Drive + Google Sheet `up-foto`.
- **Google Drive folder listing via GAS** (`action=listGallery`) untuk galeri publik; gambar dan unduhan
  diproksi server (`/api/gallery/[id]/image|download`). Folder ID di-*hardcode* di `src/lib/config.ts` dan
  `docs/gas-gallery.gs`.
- **Tidak ada** `googleapis`, Service Account, Redis, atau penyimpanan objek lain.

---

## 3. Penjelasan Per File/Folder Penting

### 3.1 Root & konfigurasi

| File | Tujuan | Bagian penting | Keterkaitan |
|---|---|---|---|
| `package.json` | Manifest npm | Scripts `dev/build/start/lint/typecheck/test` + Prisma `db:*`; `postinstall: prisma generate` | Semua build/test |
| `next.config.ts` | Konfigurasi Next | `cacheComponents`, `partialPrefetching`, `turbopack`, `allowedDevOrigins` | Build & dev server |
| `tsconfig.json` | Konfigurasi TS | `strict`, path alias `@/*` → `./src/*`, plugin Next | Semua impor `@/...` |
| `prisma7.config.ts` | Konfigurasi Prisma CLI | `config({ path: ".env.local" })`, seed, datasource `DATABASE_URL` | `npm run db:*`, `prisma/seed.ts` |
| `prisma/schema.prisma` | Skema DB | Model `Organization`, `User`, `OrganizationMember`, `Event`, `GuestSession`, `Photo`, `Collage`, `AuditLog`; enum status | Dipakai `src/lib/prisma.ts` & seluruh query |
| `prisma/seed.ts` | Seed awal | Upsert org `org_vanry_demo`, admin, membership owner, event `evan-inri`; hash password via `hashPassword` | `npm run db:seed`; login admin |
| `prisma/migrations/*` | Riwayat migrasi | `init`, `photo_blob_mysql` (LONGBLOB), `collages`, `collage_gas_drive`, `collage_drive_file_id` | `db:migrate` / `db:deploy` |
| `.env.example` | Template env | `DATABASE_URL`, `GAS_WEB_APP_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Semua integrasi |
| `.gitignore` | Abaikan file | `.env*`, `.next`, `src/generated`, `/uploads` | Keamanan & repo |
| `components.json` | Konfigurasi shadcn | style `base-nova`, alias, CSS | `src/components/ui/*` |
| `eslint.config.mjs` | Lint | Next core-web-vitals + TS, ignore generated | `npm run lint` |
| `vitest.config.mts` | Test | alias `@`, env test | `npm run test` |
| `AGENTS.md` | Instruksi agen/developer | Kontrak arsitektur, aturan kerja, struktur kunci | Dokumentasi |
| `PRD.md` | Spesifikasi produk | Alur tamu, model data, env, Tahap 1 & 2 | Sumber kebenaran produk |
| `DEPLOYMENT.md` | Operasional produksi | Env Vercel, SSL Aiven, migrasi/seed, rate limit, backup | Deployment |
| `README.md` | **Masih boilerplate `create-next-app`** | Tidak menjelaskan Vanry Cam | — |

### 3.2 `src/app` — halaman (UI)

| File | Tujuan | Bagian penting | Keterkaitan |
|---|---|---|---|
| `src/app/layout.tsx` | Root layout | Font Geist + Playfair Display, metadata, `viewportFit: "cover"`, membungkus `SessionProvider` | Semua halaman |
| `src/app/globals.css` | Tema global | Variabel warna Vanry Cam, Tailwind v4, `prefers-reduced-motion` | Semua komponen |
| `src/app/page.tsx` | Landing tamu | `GuestHeader`, hero, 3 kartu langkah, CTA, `useSession()` untuk `event.couple` | `/`, link ke `/mulai`, `/galeri` |
| `src/app/mulai/page.tsx` | Form sesi | Input nama 2–60, `RadioGroup` kuota 4/8/16/32 (default 8), `createSession`, `clearPhotos` | `POST /api/sessions` → `/kamera` |
| `src/app/izin-kamera/page.tsx` | Edukasi izin | Daftar jaminan kamera/mikrofon/lokasi, tombol ke `/kamera` | `/izin-kamera` |
| `src/app/kamera/page.tsx` | Kamera nyata + IndexedDB | `getUserMedia`, ganti kamera, `captureFrame`, simpan `addPhoto`, hapus/retake/`clearPhotos`, status izin & HTTPS, tombol `Buat Kolase` saat kuota penuh, tombol **Kembali** dan **Reset Kuota** di atas kamera | `src/lib/photo-store.ts`, `src/lib/image-capture.ts`, `/kolase` |
| `src/app/kolase/page.tsx` | Komposisi & unggah | `composeCollage`, preview `CollagePoster`, download lokal, `FormData` → `POST /api/upload/collage`, redirect `/galeri?uploaded=1` | `src/lib/collage-compose.ts`, `src/lib/api-client.ts` |
| `src/app/galeri/page.tsx` | Galeri bersama | Grid masonry dari `GET /api/gallery` (listing GAS); thumbnail/lightbox lewat `/api/gallery/[id]/image`; unduh via `/api/gallery/[id]/download`; muat ulang, `resetSession` lalu `/mulai` | `src/lib/gas.ts`, `src/lib/collage-drive.ts`, `useSession` |
| `src/app/admin/login/page.tsx` | Login admin | Form email/password, `apiPost("/api/admin/auth/login")`, redirect `/admin` | Route login admin |
| `src/app/admin/(panel)/layout.tsx` | Guard + shell admin | `getAdminUserFromCookies()` → redirect login; nav, logout, info event; `export const instant = false` | Semua halaman admin |
| `src/app/admin/(panel)/page.tsx` | Dashboard | `GET /api/admin/overview`; kartu statistik, progres kuota, sesi terbaru, audit | `admin-guard` → Prisma |
| `src/app/admin/(panel)/tamu/page.tsx` | Daftar tamu | `GET /api/admin/guests`; pencarian client-side, progress per tamu | Prisma `guest_sessions` + `photos` |
| `src/app/admin/(panel)/qr/page.tsx` | QR acara | `QRCodeCanvas`, link `origin/?acara=slug`, copy, unduh PNG, print | `GET /api/event`, `qrcode.react` |
| `src/app/admin/(panel)/foto/page.tsx` | Daftar foto legacy | `GET /api/admin/photos`, grid, lightbox via `/api/admin/photos/[id]` | Prisma `photos` (alur lama) |
| `src/app/admin/(panel)/pengaturan/page.tsx` | Edit event | `GET/PATCH /api/admin/event`, validasi form | Prisma `events` + audit |

### 3.3 `src/app/api` — Route Handlers (backend)

Semua handler mengembalikan JSON `{ error, message }` saat gagal, dan memakai helper guard/limit yang sama.

#### API tamu & kolase

| File | Method | Fungsi | Alur penting |
|---|---|---|---|
| `api/event/route.ts` | GET | Ambil event publik by `slug` (default `evan-inri`) | `getEventBySlug` |
| `api/sessions/route.ts` | POST | Buat/resume sesi tamu | validasi nama+kuota → `getEventBySlug` → reuse token cookie / create → `guest_sessions` → audit → set cookie `vanry_guest` |
| `api/sessions/me/route.ts` | GET | Data sesi tamu + event + foto | cookie → hash token → query `guest_sessions` + `photos` |
| `api/sessions/me/reset/route.ts` | POST | Tutup sesi (`COMPLETED`) & hapus cookie | audit `session.reset` → clear cookie |
| `api/sessions/me/photos/route.ts` | GET | Foto milik sesi (legacy) | hanya `UPLOADED` |
| `api/sessions/me/photos/reserve/route.ts` | POST | Reserve kuota foto (legacy) | `reservePhoto` transaksi `SELECT ... FOR UPDATE`; 409 bila kuota habis |
| `api/photos/[id]/upload/route.ts` | POST | Upload foto individual ke MySQL LONGBLOB (legacy) | validasi MIME/ukuran/dimensi (`src/lib/image.ts`) → `photos.file_data`; gagal → status `FAILED` |
| `api/photos/[id]/download/route.ts` | GET | Unduh/pratinjau foto milik sesi (legacy) | cek token+event+ownership → `file_data` → response |
| `api/sessions/me/collage/route.ts` | GET | Metadata kolase sesi | query `collages` |
| `api/sessions/me/collage/reserve/route.ts` | POST | Reserve kolase (idempoten) | `reserveCollage` + audit |
| `api/upload/collage/route.ts` | POST | **Alur utama**: unggah kolase → GAS → Drive | `requireGuestSession` → validasi FormData (`file`, `photoCount`, `idempotencyKey`) → `reserveCollage` → `uploadCollageToGas` → update `collages` (`UPLOADED`/`FAILED`) |
| `api/collage/[id]/image/route.ts` | GET | Proxy inline gambar kolase dari Drive | `buildCollageResponse(... "inline")`; validasi sesi/ownership |
| `api/collages/[id]/preview/route.ts` | GET | Alias inline | idem |
| `api/collages/[id]/download/route.ts` | GET | Unduh kolase dari Drive | `buildCollageResponse(... "attachment")` |
| `api/gallery/route.ts` | GET | Daftar file gambar folder Drive (galeri bersama) | rate limit 30/menit → `listGalleryFiles` (GAS `action=listGallery`, cache 20 dtk) → `{ files }`; error → 502 |
| `api/gallery/[id]/image/route.ts` | GET | Proxy inline gambar galeri dari Drive | validasi id + rate limit 60/menit → `buildGalleryResponse(... "inline")` |
| `api/gallery/[id]/download/route.ts` | GET | Unduh gambar galeri via proxy | validasi id + rate limit 60/menit → `buildGalleryResponse(... "attachment")` (`Content-Disposition: attachment`) |

#### API admin

| File | Method | Fungsi | Guard |
|---|---|---|---|
| `api/admin/auth/login/route.ts` | POST | Login admin | rate limit 10/menit; `verifyPassword`; cek membership; audit; set cookie `vanry_admin` |
| `api/admin/auth/logout/route.ts` | POST | Logout | clear cookie |
| `api/admin/auth/me/route.ts` | GET | User admin saat ini | `getAdminUser` |
| `api/admin/overview/route.ts` | GET | Statistik + sesi terbaru + audit | `requireAdminEvent` |
| `api/admin/guests/route.ts` | GET | Daftar tamu + hitungan status + search | `requireAdminEvent` |
| `api/admin/photos/route.ts` | GET | Daftar foto (filter status) | `requireAdminEvent` |
| `api/admin/photos/[id]/route.ts` | GET | Pratinjau biner foto | `requireAdminEvent` + event scope |
| `api/admin/audit/route.ts` | GET | 100 audit log terakhir | `requireAdminEvent` |
| `api/admin/event/route.ts` | GET/PATCH | Baca/ubah info event | `requireAdminEvent` + audit |

### 3.4 `src/components`

| File | Tujuan | Bagian penting | Keterkaitan |
|---|---|---|---|
| `session-provider.tsx` | State sesi tamu global (bukan localStorage) | `SessionProvider`, `useSession` (`ready`, `event`, `session`, `refresh`, `createSession`, `resetSession`); fetch `/api/sessions/me` | Dipakai semua halaman tamu |
| `guest-shell.tsx` | Layout tamu | `GuestHeader`, `GuestFooter`, `FlowLayout` (step indicator, safe-area) | Halaman flow |
| `brand.tsx` | Logo/identitas | `CameraMark`, `Brand` | Header, admin |
| `collage-poster.tsx` | Preview kolase HTML | Paper + polaroid + bunga SVG + tipografi Great Vibes/Playfair; teks dari event | `/kolase` |
| `photo-lightbox.tsx` | Lightbox foto | `Dialog` + navigasi + tombol unduh | Halaman admin foto |
| `admin/admin-nav.tsx` | Navigasi panel | Item Dashboard/Tamu/QR/Foto/Pengaturan, active state | Layout admin |
| `admin/logout-button.tsx` | Logout | `fetch("/api/admin/auth/logout")` → `/admin/login` | Layout admin |
| `ui/*.tsx` | Komponen shadcn base-nova | `Button`, `Card`, `Dialog`, `Input`, `Label`, `Progress`, `RadioGroup`, `Alert`, `Badge`, `Separator`, `Skeleton` | Dipakai seluruh UI |

### 3.5 `src/lib` — server & client

#### Library server (sebagian `import "server-only"`)

| File | Tujuan | Bagian penting |
|---|---|---|
| `prisma.ts` | Singleton Prisma 7 + adapter MariaDB | `createClient()` memakai `buildMariaDbPoolConfig`; cache di `globalThis` saat non-produksi |
| `database-url.ts` | Parse URL MySQL → config pool | `buildMariaDbPoolConfig` menerjemahkan `ssl-mode` (`REQUIRED`/`PREFERRED`/`VERIFY_*`/`DISABLED`) |
| `quota.ts` | Kuota foto transaksional (legacy) | `reservePhoto` dengan `SELECT ... FOR UPDATE`, idempotency, hitung `RESERVED`+`UPLOADED` |
| `collage-quota.ts` | Satu kolase per sesi | `reserveCollage`: lock sesi, reuse key sama, atau reset/replace kolase |
| `image.ts` | Parser dimensi gambar dari header | `readImageDimensions` (JPEG/PNG/WebP), `isAcceptableDimensions` |
| `gas.ts` | Klien Google Apps Script | `isGasConfigured`, `uploadCollageToGas` (POST `text/plain`, JSON `{fileName,mimeType,base64}`), `listGalleryFiles` (GET `?action=listGallery`, filter `image/*`, cache in-memory 20 dtk per instance) |
| `collage-drive.ts` | Proxy gambar Drive | `buildCollageResponse` (guard sesi/ownership) dan `buildGalleryResponse` (galeri bersama): coba kandidat URL Drive → stream `inline`/`attachment`; `isValidGalleryFileId` |
| `guest-guard.ts` | Guard sesi tamu | `requireGuestSession`: slug → event → cookie token → hash → `guest_sessions` |
| `guest-session.ts` | Cookie tamu | `createGuestToken`, `guestTokenHash` (SHA-256), `buildGuestCookie`, `getGuestToken`, `readGuestToken` |
| `admin-auth.ts` | Cookie & sesi admin | `createAdminCookie` (payload+HMAC), `decodeAdminToken`, `getAdminUser`, `getAdminOrganizationIds` |
| `admin-guard.ts` | Guard admin + event scope | `requireAdminEvent` (401/403), `isGuardFailure` |
| `event.ts` | Query event publik | `getEventBySlug` (default `evan-inri`) |
| `crypto.ts` | Kriptografi | `randomToken`, `hashToken`, `hashPassword`/`verifyPassword` (scrypt), `signValue`/`verifySignedValue` (HMAC-ish SHA-256 + `SESSION_SECRET`) |
| `audit.ts` | Audit log best-effort | `writeAuditLog` (gagal tidak melempar) |
| `rate-limit.ts` | Rate limit in-memory | `rateLimit`, `clientIp`, `rateLimitResponse` (429 + `Retry-After`) |
| `config.ts` | Konstanta & validasi | Cookie, kuota, batas nama/ukuran/dimensi, MIME, TTL, slug default, Drive folder ID/URL helper, `isQuota`, `isValidGuestName`, `isAllowedMimeType` |
| `utils.ts` | Utilitas | `export { cn } from "cn"` |

#### Library client (`"use client"` / browser-only)

| File | Tujuan | Bagian penting |
|---|---|---|
| `photo-store.ts` | IndexedDB `vanry-cam` store `photos` | `addPhoto`, `updatePhoto`, `listPhotos`, `removePhoto`, `clearPhotos`, `newIdempotencyKey`, `isPhotoStoreSupported` |
| `image-capture.ts` | Capture & kompresi JPEG | `captureFrame(video)`: max dimensi 1600px, target ≤3MB |
| `collage-compose.ts` | Komposisi Canvas | `composeCollage`: kanvas 1080px, paper + polaroid + bunga SVG + tipografi Great Vibes/Playfair, `drawCover`, kompresi bertahap hingga ≤25MB |
| `collage-style.ts` | Palet, tipografi, layout grid, SVG | `POSTER_COLORS`, `POSTER_TYPOGRAPHY`, `collageGridLayout` (4/8/16/32), `SVG_FLOWERS`, `POSTER_TEXT_DEFAULTS` |
| `api-client.ts` | Fetch wrapper + tipe | `apiGet`, `apiPost`, `apiUpload`, `apiUploadForm`, `ApiError`, helper URL foto/kolase |

#### Test

`config.test.ts`, `crypto.test.ts`, `database-url.test.ts`, `photo-store.test.ts`, `rate-limit.test.ts` —
hanya unit test library (tidak ada test API/route atau E2E).

---

## 4. Peta Fitur (Feature Map)

| Fitur | Deskripsi | File Terkait | Entry Point |
|---|---|---|---|
| Landing acara | Hero, langkah, CTA, info event | `src/app/page.tsx`, `src/components/guest-shell.tsx`, `src/components/brand.tsx`, `src/components/session-provider.tsx` | `/` |
| Sesi tamu | Nama + kuota, anonymous cookie, resume | `src/app/mulai/page.tsx`, `src/app/api/sessions/route.ts`, `src/lib/guest-session.ts`, `src/lib/crypto.ts`, `src/lib/config.ts` | `POST /api/sessions` |
| Izin kamera (edukasi) | Penjelasan akses kamera saja | `src/app/izin-kamera/page.tsx` | `/izin-kamera` |
| Kamera + IndexedDB | `getUserMedia`, capture, hapus/retake, progress kuota; tombol Kembali (ke `/mulai`) dan Reset Kuota (hapus foto lokal + reset sesi) di atas kamera | `src/app/kamera/page.tsx`, `src/lib/image-capture.ts`, `src/lib/photo-store.ts`, `src/lib/config.ts` | `/kamera` |
| Susun kolase | Desain paper + polaroid + bunga SVG + Great Vibes; preview HTML dan canvas 1080px konsisten, teks dari event config | `src/app/kolase/page.tsx`, `src/lib/collage-compose.ts`, `src/lib/collage-style.ts`, `src/components/collage-poster.tsx`, `src/app/layout.tsx` (font), `src/app/globals.css` | `/kolase` |
| Unggah kolase → Drive | FormData → GAS → Drive + Sheet; idempoten | `src/app/api/upload/collage/route.ts`, `src/lib/gas.ts`, `src/lib/collage-quota.ts`, `src/lib/guest-guard.ts`, `src/lib/image.ts` | `POST /api/upload/collage` |
| Metadata kolase | Baca status kolase sesi | `src/app/api/sessions/me/collage/route.ts`, `src/lib/collage-quota.ts` | `GET /api/sessions/me/collage` |
| Proxy/unduh kolase | Ambil gambar Drive ber-guard | `src/app/api/collage/[id]/image/route.ts`, `src/app/api/collages/[id]/preview/route.ts`, `src/app/api/collages/[id]/download/route.ts`, `src/lib/collage-drive.ts` | `GET /api/collage/:id/image`, `GET /api/collages/:id/download` |
| Galeri bersama | Grid masonry isi folder Drive via listing GAS + proxy gambar/unduh, lightbox, reset sesi | `src/app/galeri/page.tsx`, `src/app/api/gallery/route.ts`, `src/app/api/gallery/[id]/image/route.ts`, `src/app/api/gallery/[id]/download/route.ts`, `src/lib/gas.ts`, `src/lib/collage-drive.ts`, `src/app/api/sessions/me/reset/route.ts` | `/galeri` |
| Reset sesi | Tutup sesi & hapus cookie | `src/app/api/sessions/me/reset/route.ts`, `src/components/session-provider.tsx` | `POST /api/sessions/me/reset` |
| Login admin | Email/password, cookie HMAC, rate limit | `src/app/admin/login/page.tsx`, `src/app/api/admin/auth/login/route.ts`, `src/lib/admin-auth.ts`, `src/lib/crypto.ts`, `src/lib/rate-limit.ts` | `POST /api/admin/auth/login` |
| Guard panel admin | Redirect & scoping organisasi/event | `src/app/admin/(panel)/layout.tsx`, `src/lib/admin-auth.ts`, `src/lib/admin-guard.ts` | `/admin/*` |
| Dashboard admin | Statistik sesi/foto/kuota + audit terbaru | `src/app/admin/(panel)/page.tsx`, `src/app/api/admin/overview/route.ts` | `GET /api/admin/overview` |
| Daftar tamu | Search & progres per tamu | `src/app/admin/(panel)/tamu/page.tsx`, `src/app/api/admin/guests/route.ts` | `GET /api/admin/guests` |
| QR acara | QR satu acara, copy link, unduh/print | `src/app/admin/(panel)/qr/page.tsx`, `src/app/api/event/route.ts` | `/admin/qr` |
| Daftar foto (legacy) | Grid + lightbox foto MySQL | `src/app/admin/(panel)/foto/page.tsx`, `src/app/api/admin/photos/route.ts`, `src/app/api/admin/photos/[id]/route.ts`, `src/components/photo-lightbox.tsx` | `GET /api/admin/photos` |
| Pengaturan acara | Edit nama/pasangan/lokasi/tanggal/tahun | `src/app/admin/(panel)/pengaturan/page.tsx`, `src/app/api/admin/event/route.ts`, `src/lib/audit.ts` | `PATCH /api/admin/event` |
| Audit log | Catat aksi penting | `src/lib/audit.ts`, `src/app/api/admin/audit/route.ts`, dipanggil semua route penting | `GET /api/admin/audit` |
| Rate limiting | Batasi endpoint publik/admin | `src/lib/rate-limit.ts`, dipakai route `sessions`, `reserve`, `upload`, `login`, `download` | Middleware inline per route |
| Kuota foto server (legacy) | Reserve transaksional `FOR UPDATE` | `src/lib/quota.ts`, `src/app/api/sessions/me/photos/reserve/route.ts`, `src/app/api/photos/[id]/upload/route.ts` | `POST /api/sessions/me/photos/reserve` |
| Resume sesi | Cookie sama mengembalikan sesi yang ada | `src/app/api/sessions/route.ts`, `src/app/api/sessions/me/route.ts`, `src/components/session-provider.tsx` | `GET /api/sessions/me` |

---

## 5. Alur Utama (Main Flow)

### 5.1 Alur tamu (happy path)

1. **Scan QR / buka link** → `GET /` (`src/app/page.tsx`).
   - `SessionProvider` (`src/components/session-provider.tsx`) memanggil `GET /api/sessions/me`.
   - Route (`src/app/api/sessions/me/route.ts`) → `getEventBySlug` (`src/lib/event.ts`) → cek cookie
     `vanry_guest` (`src/lib/guest-session.ts`) → Prisma `guest_sessions` (`src/lib/prisma.ts`).
2. **Isi nama & kuota** → `/mulai` (`src/app/mulai/page.tsx`) → `POST /api/sessions`
   (`src/app/api/sessions/route.ts`): rate limit → validasi `isValidGuestName`/`isQuota` → event → resume
   atau `CREATE guest_sessions` → audit (`src/lib/audit.ts`) → `Set-Cookie` token.
3. **Izin kamera** → `/izin-kamera` → `/kamera` (`src/app/kamera/page.tsx`).
   - `getUserMedia({ video, audio: false })`; capture `captureFrame` (`src/lib/image-capture.ts`).
   - Simpan blob ke IndexedDB (`src/lib/photo-store.ts`); hapus/retake/clear.
   - Kuota dicek dari sesi (`session.quota`) dan jumlah foto lokal.
4. **Buat kolase** → `/kolase` → `composeCollage` (`src/lib/collage-compose.ts`) menghasilkan blob JPEG.
5. **Unggah kolase** → `POST /api/upload/collage` (`src/app/api/upload/collage/route.ts`).
   - Inline rate limit (`src/lib/rate-limit.ts`).
   - `requireGuestSession` (`src/lib/guest-guard.ts`) → event + sesi.
   - `request.formData()` → validasi `file`/MIME/ukuran/`photoCount` (`src/lib/config.ts`, `src/lib/image.ts`).
   - `reserveCollage` (`src/lib/collage-quota.ts`) transaksi + lock `guest_sessions`.
   - `uploadCollageToGas` (`src/lib/gas.ts`) → GAS (`GAS_WEB_APP_URL`) → Google Drive + Sheet.
   - Update `collages` menjadi `UPLOADED` (metadata + `driveFileUrl`/`driveFileId`/`driveFileName`) atau
     `FAILED` bila gagal; tulis audit.
6. **Galeri** → redirect `/galeri?uploaded=1` (`src/app/kolase/page.tsx`).
   - Halaman (`src/app/galeri/page.tsx`) memanggil `GET /api/gallery` → `listGalleryFiles`
     (`src/lib/gas.ts`) → GAS `action=listGallery` (cache 20 dtk per instance), lalu menampilkan grid masonry.
   - Thumbnail/lightbox memakai `GET /api/gallery/:id/image` dan unduhan `GET /api/gallery/:id/download` →
     `buildGalleryResponse` (`src/lib/collage-drive.ts`); link/folder Drive tidak dikirim ke browser.
   - “Lanjutkan Jepret” → `POST /api/sessions/me/reset` (`src/app/api/sessions/me/reset/route.ts`) →
     sesi `COMPLETED`, cookie dihapus, IndexedDB dibersihkan → `/mulai`.

### 5.2 Alur admin

1. `GET /admin/login` → form → `POST /api/admin/auth/login`
   (`src/app/api/admin/auth/login/route.ts`): rate limit → `prisma.user` → `verifyPassword`
   (`src/lib/crypto.ts`) → cek `organization_members` → audit → cookie `vanry_admin`
   (`src/lib/admin-auth.ts`).
2. `GET /admin/*` → layout `src/app/admin/(panel)/layout.tsx` → `getAdminUserFromCookies()` →
   redirect `/admin/login` bila tidak valid.
3. Halaman admin memanggil API (`/api/admin/overview|guests|photos|event|audit`) dengan cookie.
4. Setiap API admin: `requireAdminEvent` (`src/lib/admin-guard.ts`) → `getAdminOrganizationIds`
   (`src/lib/admin-auth.ts`) → scoping `eventId`/`organizationId` di Prisma.
5. Mutasi event (`PATCH /api/admin/event`) menulis `audit_logs` (`src/lib/audit.ts`).

### 5.3 Alur legacy foto individual (masih ada, tidak dipakai UI baru)

`POST /api/sessions/me/photos/reserve` (`reservePhoto`, `SELECT ... FOR UPDATE`) →
`POST /api/photos/:id/upload` (validasi `src/lib/image.ts`, simpan `LONGBLOB` ke `photos.file_data`) →
`GET /api/photos/:id/download` (guard kepemilikan) atau `GET /api/admin/photos/:id` (admin).
Halaman kamera saat ini **tidak** memanggil endpoint ini.

---

## 6. Entry Point & Config

### 6.1 Entry point

| Kategori | File |
|---|---|
| Root layout (semua halaman) | `src/app/layout.tsx` |
| Halaman awal tamu | `src/app/page.tsx` |
| Halaman flow tamu | `src/app/mulai/page.tsx`, `src/app/izin-kamera/page.tsx`, `src/app/kamera/page.tsx`, `src/app/kolase/page.tsx`, `src/app/galeri/page.tsx` |
| Entry admin | `src/app/admin/login/page.tsx` → `src/app/admin/(panel)/layout.tsx` |
| API entry (Route Handlers) | `src/app/api/**/route.ts` (Next.js memetakan folder ke URL) |
| Seed / bootstrap data | `prisma/seed.ts` |

Tidak ada `middleware.ts`, `server.ts`, `main.ts`, atau entry backend terpisah. Semua backend berjalan
sebagai Route Handler di dalam aplikasi Next.js.

### 6.2 Konfigurasi penting

| Konfigurasi | File | Isi penting |
|---|---|---|
| Environment | `.env.example`, `.env.local` (tidak di repo) | `DATABASE_URL`, `GAS_WEB_APP_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| Database | `prisma/schema.prisma`, `prisma7.config.ts`, `src/lib/prisma.ts`, `src/lib/database-url.ts` | Skema, URL CLI, adapter runtime, SSL Aiven |
| Routing | Struktur folder `src/app` | File-system routing App Router; halaman & API |
| Alias impor | `tsconfig.json` | `@/*` → `./src/*` |
| Build/Next | `next.config.ts` | Cache Components, Turbopack, allowed dev origins |
| UI/theme | `components.json`, `src/app/globals.css` | shadcn base-nova, palet warna |
| Test | `vitest.config.mts` | Alias `@`, environment node, `SESSION_SECRET` test |
| Lint | `eslint.config.mjs` | Next core-web-vitals + TS |
| Migrasi | `prisma/migrations/*` | 5 migrasi berurutan |

---

## 7. Catatan Observasi

### 7.1 Pattern yang dipakai

- **Full-stack monolith Next.js**: UI + API + akses DB dalam satu repo/app; tidak ada backend terpisah.
- **Anonymous session cookie** untuk tamu (opaque token + hash di DB), **signed cookie** untuk admin.
- **Server-side quota/ownership guard** di setiap endpoint sensitif; download/proxy selalu lewat server.
- **Idempotency key** untuk foto & kolase agar retry tidak menduplikasi.
- **Transaksi + `SELECT ... FOR UPDATE`** untuk reserve kuota.
- **Best-effort audit log** (`writeAuditLog` menelan error).
- **Client components** untuk halaman interaktif; **server component** untuk layout admin (guard).
- **Cache Components** (`instant = false`) pada layout admin yang memakai `cookies()`.

### 7.2 Inkonsistensi & potensi technical debt

1. **Dua alur penyimpanan foto bercampur.** PRD revisi menyatakan foto tetap di IndexedDB dan hanya kolase
   yang diunggah, tetapi `photos.fileData` LONGBLOB, endpoint reserve/upload/download foto, dan halaman
   admin “Foto” masih ada. Akibatnya halaman admin foto kemungkinan **kosong** pada alur baru karena tamu
   tidak lagi mengunggah foto individual.
2. **[SELESAI] Galeri tidak lagi memakai iframe folder Drive.** `src/app/galeri/page.tsx` kini mengambil
   daftar file via `GET /api/gallery` (GAS `action=listGallery`) dan menampilkan grid masonry; pratinjau
   serta unduhan diproksi server (`/api/gallery/[id]/image|download`), sehingga link/folder ID Drive tidak
   terekspos ke browser. Galeri bersifat bersama (semua kolase acara), bukan per sesi.
3. **Folder ID Drive di-hardcode** (`GALLERY_DRIVE_FOLDER_ID = "1MABCea1U99q63pVkN1WKb00DuJkGQirR"`) di
   kode, sehingga tidak bisa dikonfigurasi per event/organisasi.
4. **Kolase per-sesi tidak tampil di admin.** Admin tidak punya halaman daftar kolase meski `collages`
   adalah output utama; admin hanya melihat `photos` legacy.
5. **`reserveCollage` tidak mereset `driveFileId`.** Saat kolase lama di-reserve ulang dengan key berbeda,
   `driveFileUrl`, `driveFileName`, dll. di-null-kan tetapi `driveFileId` tidak. Berpotensi metadata basi.
6. **`photoCount` tidak diverifikasi terhadap isi kolase.** Server hanya memvalidasi `photoCount` termasuk
   `isQuota` dan ≤ kuota sesi; tidak ada cara memastikan jumlah gambar nyata di dalam JPEG sesuai.
7. **`README.md` masih boilerplate `create-next-app`**, tidak mencerminkan aplikasi.
8. **PRD memuat dua narasi historis yang saling bertentangan** (Tahap 2 menyebut foto di MySQL & reveal;
   revisi atas menyebut IndexedDB & tanpa reveal). Bagian revisi di atas file adalah yang paling baru.
9. **Rate limit in-memory** per instance serverless; `Map` bucket tidak pernah dibersihkan (pertumbuhan
   memori kecil jangka panjang). Sudah dicatat di `DEPLOYMENT.md`.
10. **Tidak ada CSRF token eksplisit.** Mutasi admin mengandalkan cookie `SameSite=Lax` + JSON; relatif
    aman untuk same-site, tetapi bukan pertahanan CSRF berlapis.
11. **Fallback password seed** `ADMIN_PASSWORD ?? "vanrycam-admin"` di `prisma/seed.ts` — berisiko bila
    seed dijalankan di lingkungan yang bisa diakses.
12. **Tidak ada `middleware.ts`.** Proteksi rute admin dilakukan di layout + guard per API; konsisten,
    tetapi tidak ada lapisan global.
13. **Pengujian terbatas** pada unit library (`crypto`, `config`, `database-url`, `photo-store`,
    `rate-limit`). Tidak ada test Route Handler, integrasi DB, atau E2E; alur GAS → Drive juga belum
    diverifikasi (sesuai catatan `AGENTS.md`).
14. **`getAdminUserId` mendukung dua sumber cookie** (header `Request` dan `next/headers`), sedikit
    duplikasi logika dibanding `getAdminUserFromCookies`.
15. **Komponen UI memakai paket `cn`** (bukan kombinasi `clsx` + `tailwind-merge` yang umum), sesuai
    style shadcn `base-nova`.
16. **`apiPost` selalu mengirim `Content-Type: application/json`** meski body `undefined`; saat ini aman
    karena semua pemanggil mengirim objek/`{}`.
17. **Seed & skrip DB butuh MySQL**; tidak bisa dijalankan tanpa `DATABASE_URL` valid di `.env.local`.
18. **Tidak ada `TODO`/`FIXME`/`HACK` eksplisit** di `src/` maupun `prisma/` (hasil pencarian kosong).

### 7.3 Asumsi yang dipakai

- Versi dependensi diambil dari `package.json`; versi terpasang aktual dapat berbeda dalam batas semver.
- `src/generated/prisma` tidak dianalisis karena merupakan kode generated (di-*gitignore*).
- Perilaku GAS, Google Drive, dan isi database nyata tidak diverifikasi; analisis berdasarkan kode dan
  dokumentasi repo.
- `README.md` boilerplate dianggap bukan dokumentasi produk yang valid.

---

## Ringkasan Singkat — Apa Sebenarnya Project Ini?

1. **Vanry Cam** adalah aplikasi web *disposable camera* untuk pernikahan Evan & Inri, dapat diakses lewat
   satu QR/link untuk seluruh acara (tanpa QR per meja).
2. Dibangun sebagai **monolith full-stack Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 +
   shadcn/base-ui**, dengan **Route Handlers** sebagai backend dan **MySQL 8 via Prisma 7**.
3. Tamu membuat sesi anonim (cookie HttpOnly), memilih kuota 4/8/16/32, memotret lewat browser, dan foto
   disimpan sementara di **IndexedDB** — bukan diunggah ke server.
4. Tamu menyusun **satu kolase** di Canvas, lalu mengunggahnya ke server; server meneruskan ke **Google
   Apps Script → Google Drive + Google Sheet**, dan MySQL hanya menyimpan metadata kolase.
5. Galeri berupa **grid masonry** isi folder Google Drive (listing via GAS) dengan lightbox dan unduhan per
   gambar; semua pratinjau/unduhan lewat proxy server sehingga link Drive tidak terekspos, dengan opsi reset
   sesi untuk memulai roll baru.
6. Panel admin nyata menyediakan login, dashboard statistik, daftar tamu, QR acara, daftar foto legacy,
   pengaturan acara, dan audit log; otorisasi berbasis membership organisasi.
7. Fitur keamanan/robustness mencakup kuota transaksional, idempotency, guard kepemilikan sesi, rate
   limiting in-memory, dan audit log.
8. Terdapat **warisan alur foto individual** (MySQL LONGBLOB) yang masih ada untuk kompatibilitas tetapi
   tidak dipakai UI kamera saat ini.
9. Dokumentasi produk ada di `PRD.md`/`AGENTS.md`; `README.md` masih template bawaan.
10. Status yang belum terverifikasi: alur end-to-end kolase → GAS → Drive → galeri terhadap layanan nyata.
