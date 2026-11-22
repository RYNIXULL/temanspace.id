# TEMANSPACE.ID

**"ruang berteman, tempat bertumbuh"**

TEMANSPACE.ID adalah media layanan bimbingan dan konseling sosial berbasis website untuk edukasi pertemanan sehat bagi siswa Sekolah Menengah Pertama (SMP).

> **Catatan Batasan Layanan:** TEMANSPACE.ID merupakan media edukasi sosial yang bersifat **non-diagnostik**. Aplikasi ini bukan alat diagnosis psikologis dan bukan pengganti layanan konseling profesional maupun peran Guru Bimbingan dan Konseling (Guru BK). Apabila siswa mengalami pengucilan, ancaman, atau perundungan, panduan bantuan mengarahkan siswa untuk segera melibatkan Guru BK, wali kelas, orang tua/wali, atau orang dewasa tepercaya.

---

## Fitur Utama

### 1. Halaman Publik (Pengunjung)
- **Beranda (`/`)**: Memperkenalkan identitas TEMANSPACE.ID, tagline, 7 tujuan pembelajaran, ringkasan 6 topik edukasi, serta CTA menuju pendaftaran dan login.
- **Tentang TEMANSPACE.ID (`/tentang`)**: Menjelaskan visi layanan edukatif, batasan non-diagnostik, batasan kerahasiaan demi keselamatan siswa, dan prinsip minimisasi data pribadi.
- **Registrasi Akun Siswa (`/daftar`)**: Formulir pendaftaran dengan data minimal (nama tampilan, email, tingkat kelas SMP 7/8/9, kata sandi, dan catatan opsional). Akun baru otomatis berstatus `pending` dan menerima **Kode Referensi Pendaftaran (`TS-XXXXXX`)**.
- **Status Pendaftaran (`/status-pendaftaran`)**: Pengecekan status persetujuan (`pending`, `approved`, `rejected`, `suspended`) menggunakan kombinasi email dan kode referensi.
- **Login (`/login`)**: Autentikasi siswa yang telah disetujui (`approved`) dan admin, dengan penegakan status akun di backend serta pembatasan percobaan login (*rate limiting*).

### 2. Dashboard Siswa (`/dashboard`)
- **Ringkasan Belajar (`/dashboard`)**: Progres bacaan modul, jumlah latihan, riwayat kuis/skenario, dan pengingat ruang aman.
- **6 Topik Edukasi Pertemanan (`/dashboard/materi/[slug]`)**:
  1. Pertemanan Sehat (`pertemanan-sehat`)
  2. Kenali Relasi Tidak Sehat (`relasi-tidak-sehat`)
  3. Komunikasi Interpersonal (`komunikasi-interpersonal`)
  4. Ngobrol dengan Asertif (`komunikasi-asertif`) — dilengkapi latihan interaktif pembangun kalimat *"Aku merasa... ketika..."*
  5. Belajar Empati (`belajar-empati`)
  6. Menghadapi Konflik (`menghadapi-konflik`)
- **Kuis dan Skenario Interaktif (`/dashboard/kuis`)**: Latihan kuis dan simulasi situasi pertemanan sehari-hari dengan umpan balik edukatif langsung dan non-diagnostik.
- **Panduan Mencari Bantuan (`/dashboard/bantuan`)**: Panduan kapan dan kepada siapa mencari bantuan di sekolah (Guru BK, Wali Kelas) maupun di rumah (Orang Tua/Wali).
- **Profil Saya (`/dashboard/profil`)**: Mengelola nama tampilan, tingkat kelas, dan mengubah kata sandi.

### 3. Dashboard Admin (`/admin`)
- **Overview Dashboard (`/admin`)**: Statistik akun siswa (`pending`, `approved`, `rejected`, `suspended`), jumlah materi, kategori, kuis, skenario, panduan bantuan, dan aktivitas terbaru.
- **Persetujuan Pendaftaran (`/admin/persetujuan`)**: Menyetujui atau menolak permohonan siswa disertai catatan keputusan yang tercatat pada `registration_requests` dan `audit_logs`.
- **Manajemen Akun Siswa (`/admin/siswa`)**: Mengubah status (`approved`, `suspended`, `rejected`), memperbarui data dasar, atau menghapus akun siswa.
- **Manajemen Kategori Materi (`/admin/kategori`)**: CRUD lengkap kategori topik edukasi.
- **Manajemen Materi (`/admin/materi`)**: CRUD lengkap modul materi, poin kunci, contoh dialog, durasi baca, dan status publikasi.
- **Manajemen Kuis (`/admin/kuis`) & Skenario (`/admin/skenario`)**: CRUD lengkap kuis dan skenario interaktif.
- **Manajemen Pertanyaan & Pilihan Jawaban (`/admin/kuis/[id]/pertanyaan`)**: CRUD pertanyaan, konteks skenario, opsi jawaban, penanda opsi konstruktif, dan pembahasan edukatif.
- **Manajemen Panduan Bantuan (`/admin/bantuan`)**: CRUD panduan mencari bantuan.
- **Audit Log (`/admin/audit-log`)**: Riwayat kronologis aktivitas administratif dan autentikasi.
- **Pengaturan Akun (`/admin/pengaturan`)**: Pengelolaan nama tampilan admin dan kata sandi.

---

## Arsitektur & Teknologi

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS v4, Liquid Glass & Tactile Clay UI (Frosted Glass header, WebGL SDF `LiquidNavbar` dengan CSS fallback, View-Transition Light/Dark Mode, Custom Toast & Modal pengganti `alert()`)
- **Database & ORM**: Prisma ORM 7 (`@prisma/adapter-libsql`) + SQLite (`file:./prisma/dev.db` secara default)
- **Keamanan**:
  - Hashing kata sandi menggunakan **Argon2id** (`@node-rs/argon2`)
  - Session JWT HS256 (`jose`) dalam cookie `httpOnly`, `SameSite=Lax`
  - Validasi ulang status user (`pending` / `approved` / `rejected` / `suspended`) dan peran (`ADMIN` / `STUDENT`) langsung dari database pada setiap endpoint terproteksi
  - Validasi input menggunakan `zod` di frontend dan backend
  - Rate limiting login tersimpan di tabel `login_attempts`
  - Tidak ada pendaftaran admin publik

### Skema Database Relasional
Tabel inti yang diimplementasikan di `prisma/schema.prisma`:
1. `roles`
2. `users`
3. `registration_requests`
4. `material_categories`
5. `materials`
6. `material_progress` *(pelacakan progres baca siswa)*
7. `quizzes`
8. `quiz_questions`
9. `quiz_options`
10. `quiz_attempts`
11. `quiz_answers`
12. `help_resources`
13. `audit_logs`
14. `login_attempts` *(rate limiting percobaan login)*

---

## Panduan Instalasi & Konfigurasi

### Prasyarat
- Node.js 20+ (diuji pada Node.js v25.8.0)
- npm 10+

### Langkah Setup Lokal
1. **Install dependensi:**
   ```bash
   npm install
   ```
2. **Siapkan file `.env`:**
   Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi seluruh variabel di `.env` (jangan pernah menyalin atau meng-commit `.env` ke Git):
   - `DATABASE_URL="file:./prisma/dev.db"`
   - `AUTH_SESSION_SECRET` (string acak minimal 32 karakter)
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` untuk akun admin awal saat seeding.
3. **Jalankan migrasi database:**
   ```bash
   npm run db:migrate
   ```
4. **Isi data awal (roles, admin awal, 6 kategori, 12 materi, 2 kuis, 2 skenario, dan panduan bantuan):**
   ```bash
   npm run db:seed
   ```
5. **Jalankan aplikasi mode pengembangan:**
   ```bash
   npm run dev
   ```
   Atau jalankan mode produksi:
   ```bash
   npm run build
   npm run start
   ```
6. Buka `http://localhost:3000` di browser.

---

## Pengujian & Verifikasi Kualitas

```bash
# Menjalankan suite pengujian API, Auth, RBAC, dan CRUD (Vitest)
npm test

# Memeriksa TypeScript dan ESLint
npx tsc --noEmit
npm run lint

# Memverifikasi production build
npm run build
```

Lihat [docs/TESTING.md](file:///d:/proyek/TEMANSPACE.ID/docs/TESTING.md) untuk rincian skenario pengujian.
