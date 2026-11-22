# Dokumentasi Pengujian — TEMANSPACE.ID

Dokumen ini merangkum strategi dan cakupan pengujian fungsional, keamanan, otorisasi, serta antarmuka pengguna untuk aplikasi **TEMANSPACE.ID**.

## 1. Pengujian Otomatis Backend, Autentikasi & CRUD (`Vitest`)

Suite pengujian otomatis berada di `tests/api-and-security.test.ts` dengan konfigurasi database uji terisolasi (`prisma/test.db`) pada `tests/setup.ts` sehingga database pengembangan (`prisma/dev.db`) tidak terpengaruh.

Perintah eksekusi:
```bash
npm test
```

### Daftar Skenario yang Diuji
1. **Validasi Input Registrasi & Anti-Privilege Escalation**:
   - Menolak email tidak valid, nama terlalu pendek, kelas di luar `7`/`8`/`9`, dan kata sandi lemah (`400 Bad Request`).
   - Mengabaikan `roleCode: "ADMIN"` atau `status: "approved"` yang dikirim client; akun baru tetap dibuat sebagai `STUDENT` dengan status `pending` dan menerima `referenceCode` (`TS-XXXXXX`).
2. **Penolakan Duplikasi Email**:
   - Pendaftaran ulang dengan email yang sama mengembalikan `409 Conflict`.
3. **Cek Status Pendaftaran (`/api/registration-status`)**:
   - Mengembalikan status yang akurat jika `email` dan `referenceCode` cocok, serta mengembalikan `404` jika kombinasi salah.
4. **Blokir Login Akun `pending`**:
   - Siswa dengan status `pending` ditolak saat login (`403 Forbidden`, kode `ACCOUNT_PENDING`).
5. **Proteksi Akses Tanpa Autentikasi**:
   - Endpoint `/api/auth/me`, `/api/student/overview`, dan `/api/admin/categories` mengembalikan `401 Unauthorized` tanpa sesi valid.
6. **Pembatasan Percobaan Login (*Rate Limiting*)**:
   - Setelah melebihi `LOGIN_MAX_ATTEMPTS`, percobaan login berikutnya mengembalikan `429 Too Many Requests` (`RATE_LIMITED`).
7. **Persetujuan & Penolakan Admin + Audit Log**:
   - Admin menyetujui siswa 1 (`APPROVE_REGISTRATION`) dan menolak siswa 2 (`REJECT_REGISTRATION`); identitas peninjau (`reviewedById`) dan waktu keputusan (`reviewedAt`) tersimpan di `registration_requests` dan tercatat di `audit_logs`.
8. **Blokir Akun `rejected` & Pembatasan Role (`RBAC`)**:
   - Akun `rejected` ditolak login (`403`, `ACCOUNT_REJECTED`).
   - Akun `approved` dapat login dan mengakses `/api/student/**` (`200`), tetapi ditolak saat mengakses `/api/admin/**` (`403 Forbidden`).
9. **Operasi CRUD Penuh & Pengerjaan Kuis/Skenario**:
   - Admin membuat, memperbarui, dan menghapus kategori materi, materi edukasi, kuis/skenario, pertanyaan beserta pilihan jawaban, dan panduan bantuan.
   - Siswa mengirimkan jawaban kuis (`POST /api/student/quizzes/[id]/attempt`) dan menerima umpan balik reflektif non-diagnostik.
10. **Penangguhan Akun (*Suspend*) Real-Time & Logout**:
    - Saat admin mengubah status siswa menjadi `suspended`, cookie sesi lama yang masih berlaku langsung ditolak (`401`) pada request berikutnya, dan login ulang diblokir (`403`, `ACCOUNT_SUSPENDED`).
    - Endpoint logout menghapus cookie sesi.

## 2. Pengujian Static Analysis & Build

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## 3. Verifikasi Browser & Responsivitas UI

Verifikasi langsung pada server produksi lokal (`http://localhost:3000`) mencakup:
- Pemeriksaan tata letak desktop (`1440px`, `1024px`) dan mobile (`375px`) untuk memastikan tidak ada *horizontal overflow* atau elemen navigasi bertumpuk.
- Pengujian Light/Dark mode toggle dan tampilan *Frosted Glassmorphism* serta `LiquidNavbar`.
- Pengujian alur nyata pengguna melalui browser: halaman publik (`/`, `/tentang`, `/daftar`, `/status-pendaftaran`, `/login`), dashboard siswa (6 modul edukasi, pembangun kalimat asertif, kuis/skenario, panduan bantuan, profil), serta dashboard admin (persetujuan pendaftaran, manajemen siswa, CRUD konten, audit log, dan pengaturan).
