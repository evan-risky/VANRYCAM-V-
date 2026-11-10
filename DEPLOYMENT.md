# Deployment Vanry Cam (Vercel + MySQL)

Dokumen operasional produksi. Rahasia hanya di Environment Variables Vercel, jangan di Git.

## 1. Prasyarat

- MySQL 8 terkelola (PlanetScale/Vercel Postgres bukan opsi karena stack MySQL; gunakan Railway,
  Aiven, atau RDS MySQL) dengan koneksi TLS.
- Ruang disk MySQL cukup untuk foto `LONGBLOB` (perkirakan ~3MB × jumlah jepretan × jumlah tamu).
- Repo terhubung ke Vercel.

## 2. Penyimpanan foto & kolase

Foto tamu tetap di perangkat (IndexedDB) dan tidak diunggah ke server. Kolase dikirim ke Next.js
(`POST /api/upload/collage`) lalu diteruskan dari server ke Google Apps Script (`GAS_WEB_APP_URL`).
GAS menyimpan kolase ke Google Drive dan mencatat baris ke Google Sheet `up-foto`.

MySQL hanya menyimpan metadata kolase + `drive_file_url` + `drive_file_name`. Tidak ada biner kolase di
MySQL. Endpoint foto lama (`photos.file_data` LONGBLOB) dan validasi kuota server tetap ada untuk
kompatibilitas tetapi tidak dipakai alur tamu baru.

Pastikan `GAS_WEB_APP_URL` menunjuk ke deployment GAS yang benar dan boleh diakses server (deploy
sebagai Web App yang dapat diakses siapa saja). Panggilan GAS memakai header
`Content-Type: text/plain;charset=utf-8`, `redirect: "follow"`, `cache: "no-store"`.

## 3. Environment Variables (Vercel → Settings → Environment Variables)

| Variable | Nilai | Scope |
|---|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:port/defaultdb?ssl-mode=REQUIRED` (Aiven) | Production/Preview |
| `GAS_WEB_APP_URL` | URL Web App Google Apps Script (unggah kolase ke Drive) | Production/Preview |
| `SESSION_SECRET` | string acak panjang (≥32 byte) | Production/Preview |
| `NEXT_PUBLIC_APP_URL` | `https://domain-acara` | Production |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | hanya untuk seeding awal | jaga tetap lokal |
| `ADMIN_NAME` | nama admin untuk seed (opsional, default `Penyelenggara`) | lokal |
| `ALLOWED_DEV_ORIGINS` | origin dev yang diizinkan (opsional, default `192.168.101.127,localhost,127.0.0.1`) | Development |

Catatan: jangan pernah menaruh secret di `NEXT_PUBLIC_*`.

### Koneksi MySQL Aiven (SSL)

Runtime memakai `@prisma/adapter-mariadb`. Driver `mariadb` **tidak** mengenali parameter `ssl-mode`,
sehingga `src/lib/database-url.ts` (`buildMariaDbPoolConfig`) menerjemahkan URL Aiven menjadi konfigurasi
pool:

- `ssl-mode=REQUIRED` / `PREFERRED` → TLS aktif, `rejectUnauthorized: false` (sertifikat Aiven bertipe
  self-signed CA; tidak ada CA yang dipasang).
- `ssl-mode=VERIFY_CA` / `VERIFY_IDENTITY` → TLS aktif, `rejectUnauthorized: true`.
- `ssl-mode=DISABLED` / tanpa parameter → non-TLS (hanya untuk development lokal).

`prisma migrate deploy` (Prisma CLI) menerima `ssl-mode=REQUIRED` apa adanya. Format WAJIB `mysql://`
(bukan `mariadb://`).

## 4. Migrasi & Seed

Jalankan dari mesin dengan akses DB produksi (set `DATABASE_URL` di `.env.local` lokal atau pakai
terowongan), bukan dari runtime Vercel:

```text
npm run db:deploy   # prisma migrate deploy
npm run db:seed     # buat org + admin + event
```

## 5. Deploy

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Setelah semua hijau, dorong ke branch produksi (Vercel build otomatis). Pastikan domain memakai
**HTTPS** (cookie `Secure` aktif saat `NODE_ENV=production`).

## 6. Rate limiting

`src/lib/rate-limit.ts` bersifat in-memory (per instance serverless). Untuk produksi trafik tinggi,
ganti ke store bersama (Upstash Redis/Vercel KV) tanpa mengubah tanda tangan fungsi `rateLimit`.

## 7. Backup & retensi

- **Backup DB harian** (snapshot penyedia + `mysqldump` terjadwal, termasuk `photos.file_data`). Uji
  restore berkala; perhatikan ukuran dump karena foto ikut tersimpan sebagai biner.
- **Retensi foto**: tentukan kebijakan (mis. hapus foto setelah 90 hari). Karena file ada di MySQL,
  cukup hapus baris `photos` (atau set `file_data = NULL` lalu hapus baris).
- Simpan `audit_logs` minimal selama masa retensi untuk jejak akses.

## 8. Uji perangkat

Lihat checklist Android/iOS pada laporan Tahap 3. Wajib uji di perangkat fisik: izin kamera,
kualitas foto, upload jaringan lambat, dan safe area notch.

## 9. Development lokal (WSL)

- `.env.local` **wajib ada** di root project. Salin dari `.env.example`
  (`cp .env.example .env.local`), lalu isi nilai asli. Jangan commit file ini (sudah di-`.gitignore`).
- `next dev` / `next build` memuat `.env.local` otomatis. `prisma7.config.ts` juga memuatnya untuk
  Prisma CLI (`db:migrate`, `db:deploy`, `db:seed`).
- Script standalone dengan `tsx`/`node` **tidak** otomatis membaca `.env.local`; `import "dotenv/config"`
  hanya membaca `.env`. Pilih salah satu:
  - biarkan `src/lib/prisma.ts` memuat `.env.local` otomatis saat berjalan di luar Next.js (perilaku saat
    ini, memakai `process.loadEnvFile` bawaan Node), atau
  - jalankan `npx tsx --env-file=.env.local -e "..."`, atau
  - gunakan `npx dotenv -e .env.local -- npx tsx ...` (butuh `dotenv-cli`).
- Nama delegate Prisma mengikuti nama model, bukan nama tabel: gunakan `prisma.event`,
  `prisma.guestSession`, `prisma.collage` (bukan `prisma.events` / `prisma.guest_sessions`).
- Jangan menjalankan `prisma migrate dev`, `prisma db push`, atau `prisma migrate reset` terhadap DB
  produksi. Untuk menerapkan migrasi gunakan `npm run db:deploy`.

## 10. Setup Galeri (GAS)

Galeri `/galeri` mengambil daftar file dari Google Drive melalui GAS (`action=listGallery`), lalu
memproksikan pratinjau/unduhan lewat server. Deployment GAS **manual** dan tidak dilakukan aplikasi.

Catatan: repo ini menyediakan `docs/gas-gallery.gs` (tidak ada `docs/gas-gallery-full.gs`). Jika GAS
produksi sudah punya handler upload, **gabungkan** cabang `action=listGallery` + helper-nya ke `doGet`
yang ada; jangan menimpa seluruh `Code.gs`.

1. Backup dulu: buka project Apps Script → **File → Make a copy**.
2. Salin isi `docs/gas-gallery.gs` ke `Code.gs` (atau gabungkan cabang `action=listGallery`).
3. Pastikan `GALLERY_DRIVE_FOLDER_ID` di GAS sama dengan `GALLERY_DRIVE_FOLDER_ID` di
   `src/lib/config.ts` (`1MABCea1U99q63pVkN1WKb00DuJkGQirR`).
4. Opsional, tambahkan health check di `doGet`:
   ```js
   if (action === "ping") return jsonOutput_({ ok: true, message: "pong" });
   ```
5. Test dari Editor dengan fungsi sementara:
   ```js
   function testListGallery() {
     Logger.log(JSON.stringify(listGallery_()));
   }
   ```
   Jalankan dan pastikan hasilnya `{ ok: true, files: [...] }`.
6. **Deploy → Manage deployments → Edit → New version → Deploy**.
   - **Who has access: Anyone** (bukan “Anyone with Google account”).
7. Copy URL yang berakhiran `/exec`.
8. Set `GAS_WEB_APP_URL` ke URL `/exec` tersebut di `.env.local` (lokal) dan Environment Variables
   Vercel (production). Jangan memakai placeholder `DEPLOYMENT_ID`.
9. Restart `npm run dev`, lalu verifikasi:

   ```bash
   curl "$GAS_WEB_APP_URL?action=ping"
   curl "$GAS_WEB_APP_URL?action=listGallery"
   curl http://localhost:3000/api/gallery
   ```

   Harapan: `{"ok":true,...}`, `{"ok":true,"files":[...]}`, dan `{"files":[...]}` (HTTP 200).

### Troubleshooting galeri

| Status / Error | Penyebab | Fix |
|---|---|---|
| 503 `gas_not_configured` | `GAS_WEB_APP_URL` kosong / masih placeholder | Isi dengan URL `/exec` hasil deploy |
| 502 `gas_invalid_response` | GAS belum di-deploy dengan `listGallery` / access bukan Anyone | Deploy ulang, set access Anyone |
| 502 `gas_error` | `FOLDER_ID` salah / akses Drive ditolak | Cek `GALLERY_DRIVE_FOLDER_ID` dan izin folder |
| 200 tapi `files: []` | Folder kosong | Unggah kolase dulu |
