# SIA ST3I - Sistem Informasi Akademik Sekolah Tinggi Teologi Transformasi Indonesia
## Product Requirements Document (PRD)

### Original Problem Statement
Build a comprehensive SIA (Sistem Informasi Akademik) for Sekolah Tinggi Teologi Transformasi Indonesia (ST3I) with modules including:
- Master Data (Tahun Akademik, Fakultas, Program Studi, Kurikulum, Mata Kuliah, Mahasiswa, Dosen)
- User & Access Management
- Academic Core (KRS, Nilai, Transkrip)

### User Personas
1. **Admin** - Super administrator who manages all master data, users, and academic operations
2. **Rektor** - Executive level with full data access across all fakultas and prodi
3. **Dekan (Dean)** - Faculty head who can access all prodi within their fakultas
4. **Kaprodi (Head of Study Program)** - Can only access data within their specific prodi
5. **Dosen (Lecturer)** - Inputs grades, views assigned classes, validates KRS as Dosen PA, manages presensi
6. **Mahasiswa (Student)** - Enrolls in courses (KRS), views grades (KHS), downloads transcripts, views jadwal & presensi

### Core Requirements (Static)
- Tech Stack: FastAPI + React + MongoDB
- Authentication: JWT-based with role management
- Language: Bahasa Indonesia
- Design: Modern & Minimalist with Deep Indigo (#1e1b4b) sidebar

---

## What's Been Implemented

### Date: 2025-01-31

#### Backend (FastAPI)
- ✅ Authentication (Login/Logout, JWT tokens, password hashing, **password reset**)
- ✅ User Management (CRUD, role-based access, toggle active, **generate reset token**)
- ✅ Master Data APIs:
  - Tahun Akademik (CRUD, active semester management)
  - Fakultas (CRUD)
  - Program Studi (CRUD, linked to Fakultas)
  - Kurikulum (CRUD, linked to Prodi)
  - Mata Kuliah (CRUD, SKS management)
  - Mahasiswa (CRUD, creates user account automatically)
  - Dosen (CRUD, creates user account automatically)
- ✅ Akademik APIs:
  - Kelas/Penawaran MK (CRUD)
  - KRS (enrollment, approval/rejection)
  - Nilai (grade input, auto-calculation A-E)
  - KHS & Transkrip (IPK calculation)
  - **Jadwal Kuliah (CRUD with conflict detection)**
- ✅ **Keuangan APIs:**
  - Kategori UKT (CRUD - Kelola golongan UKT)
  - Tagihan UKT (CRUD, batch create per prodi)
  - Pembayaran UKT (create, verify/reject)
  - Rekap Keuangan (summary totals)
- ✅ **Biodata APIs:**
  - Biodata Mahasiswa (CRUD)
  - Change Request (create with file upload, list, detail)
  - Review (approve/reject with notes)
  - File serving (/uploads/biodata/...)
- ✅ Dashboard Stats API
- ✅ **Mahasiswa Portal APIs:**
  - Profile mahasiswa (with dosen_pa_nama)
  - Kelas tersedia untuk enrollment
  - KRS mahasiswa (get, create, delete) with kode_mk
  - KHS dengan IPK per semester
  - Transkrip lengkap dengan IPK kumulatif
  - **Jadwal kuliah mahasiswa**
  - **Presensi rekap mahasiswa**
- ✅ **Dosen Portal APIs:**
  - Mahasiswa bimbingan list
  - KRS bimbingan (approve/reject)
  - **Presensi (create, list, detail, rekap)**
  - **Input nilai mahasiswa**
- ✅ **Password Reset APIs:**
  - Forgot password (generate token)
  - Verify reset token
  - Reset password with token
  - Admin generate reset token for user
  - Mahasiswa bimbingan list
  - KRS bimbingan (approve/reject)

#### Frontend (React)
- ✅ Login Page with beautiful university background
- ✅ Dashboard with role-based content & stats cards
- ✅ Sidebar navigation with collapsible menus
- ✅ Master Data Pages:
  - Tahun Akademik (table, CRUD dialog, active toggle)
  - Fakultas (table, CRUD dialog)
  - Program Studi (table, CRUD with fakultas relation)
  - Kurikulum (table, CRUD with prodi relation)
  - Mata Kuliah (table, CRUD, SKS badges)
  - Mahasiswa (table, search, filters, CRUD)
  - Dosen (table, search, CRUD)
- ✅ Akademik Pages:
  - Penawaran Kelas (table, CRUD)
  - Validasi KRS (approve/reject) with mahasiswa info
  - **Jadwal Kuliah** - Grid view per hari, CRUD dengan conflict detection
- ✅ User Management (toggle active users)
- ✅ **Portal Mahasiswa:**
  - **KRS Page** - Enrollment mata kuliah dengan summary cards, pilih kelas dialog, **Cetak PDF**
  - **KHS Page** - Hasil studi per semester dengan selector tahun akademik, **Cetak PDF**
  - **Transkrip Page** - Rekap nilai lengkap dengan cetak/download PDF
  - **Jadwal Page** - Lihat jadwal kuliah mingguan dengan group by hari
  - **Presensi Page** - Rekap kehadiran per mata kuliah dengan warning <75%
  - **Keuangan Page** - Lihat tagihan UKT, bayar cicilan, riwayat pembayaran
  - **Biodata Page** - Isi/ubah biodata, upload dokumen pendukung, riwayat perubahan
- ✅ **Portal Dosen:**
  - **Kelas Saya** - Daftar kelas yang diampu dengan stats (Total Kelas, Mahasiswa, SKS)
  - **Daftar Mahasiswa** - Lihat mahasiswa per kelas dengan search, filter, export CSV
  - **Presensi** - Input presensi per pertemuan, rekap kehadiran mahasiswa
  - **Input Nilai** - Input nilai Tugas, UTS, UAS dengan auto-calculation grade A-E
  - **Validasi KRS PA** - List mahasiswa bimbingan, approve/reject KRS
- ✅ **Keuangan Admin:**
  - **Manajemen Tagihan** - CRUD tagihan UKT, batch create, filter, rekap cards
  - **Verifikasi Pembayaran** - Approve/reject pembayaran mahasiswa
- ✅ **Biodata Admin:**
  - **Verifikasi Perubahan** - Review perubahan biodata dengan perbandingan data lama vs baru
  - **Lihat Dokumen Pendukung** - Preview KTP, KK, Akte yang diupload
  - **Approve/Reject** - Setujui atau tolak dengan catatan
- ✅ **Password Reset:**
  - Lupa password dengan approval admin (user input NIM/NIDN/NIP + password baru → admin approve)
  - Admin generate password baru langsung (8 digit angka acak)
- ✅ **Login dengan NIM/NIDN/NIP:**
  - Mahasiswa login dengan NIM
  - Dosen login dengan NIDN
  - Admin login dengan NIP
- ✅ **Ganti Foto Profil dengan Approval:**
  - User upload foto baru → Admin review → Approve/Reject
  - Halaman Profil dengan preview foto dan riwayat pengajuan
  - Admin: Halaman Verifikasi Akun untuk review password & foto
- ✅ **PDF Components:**
  - KRSPdf - PDF template untuk cetak KRS
  - KHSPdf - PDF template untuk cetak KHS
- ✅ Toast notifications (sonner)
- ✅ Indonesian language throughout

---

## Prioritized Backlog

### P0 (Critical) - ALL DONE ✅
1. ~~Mahasiswa Portal - KRS page for students to enroll~~ ✅
2. ~~Mahasiswa Portal - KHS page to view semester grades~~ ✅
3. ~~Mahasiswa Portal - Transkrip page with print/PDF~~ ✅
4. ~~Dosen PA - Validasi KRS mahasiswa bimbingan~~ ✅
5. ~~Cetak PDF KRS dan KHS~~ ✅
6. ~~Dosen Portal - Input Nilai mahasiswa~~ ✅

### P1 (High Priority) - ALL DONE ✅
1. ~~Dosen Portal - Kelas Saya~~ ✅
2. ~~Dosen Portal - Daftar Mahasiswa per Kelas~~ ✅
3. ~~Jadwal Kuliah - Schedule management with conflict detection~~ ✅
4. ~~Presensi - Attendance tracking~~ ✅
5. ~~Password reset functionality~~ ✅

### P2 (Medium Priority)
1. ~~Keuangan Module - UKT/SPP integration~~ ✅ (Implemented 2026-01-31)
2. Audit Log - Track all data changes
3. Notifications - Email/WhatsApp alerts
4. Bulk import for Mahasiswa/Dosen (Excel)

### P3 (Future Enhancements)
1. Feeder PDDIKTI integration
2. LMS Integration (Moodle)
3. Mobile responsive improvements
4. Multi-tenant (multiple universities)

---

## Next Tasks
1. ~~Implement Student KRS enrollment page~~ ✅
2. ~~Implement Student KHS and Transkrip views~~ ✅
3. ~~Implement Dosen PA KRS validation~~ ✅
4. ~~Implement PDF generation for KRS & KHS~~ ✅
5. ~~Implement Lecturer (Dosen) grade input interface~~ ✅
6. ~~Add Dosen Kelas Saya page~~ ✅
7. ~~Add Dosen Daftar Mahasiswa per Kelas page~~ ✅
8. ~~Add Jadwal Kuliah management with conflict detection~~ ✅
9. ~~Add Presensi mahasiswa (Dosen & Mahasiswa view)~~ ✅
10. ~~Add Password Reset functionality~~ ✅
11. ~~Add Modul Keuangan (UKT/SPP)~~ ✅
12. ~~Add Fitur Biodata dengan Approval System~~ ✅
13. ~~Login dengan NIM/NIDN/NIP~~ ✅
14. ~~Lupa Password dengan Approval Admin~~ ✅
15. ~~Ganti Foto Profil dengan Approval Admin~~ ✅
16. Add Modul Laporan & Rekapitulasi
17. Add Modul Monitoring & Dashboard Analytics
18. Add Bulk import Excel for Mahasiswa/Dosen

---

## Technical Notes
- Default Admin: NIP 1234567890 / admin123
- Test Mahasiswa: NIM 2024001 / password
- Test Dosen: NIDN 0001018902 / password
- Login menggunakan NIM/NIDN/NIP (bukan email)
- MongoDB collections: users, mahasiswa, dosen, fakultas, prodi, kurikulum, mata_kuliah, tahun_akademik, kelas, krs, nilai, presensi, presensi_detail, kategori_ukt, tagihan_ukt, pembayaran_ukt, biodata, biodata_change_request, password_reset_requests, foto_profil_requests
- All timestamps in UTC ISO format
- Password hashing with bcrypt
- PDF generation using @react-pdf/renderer

---

## Changelog

### 2026-01-31: Modul Keuangan (Finance Module)
**Backend:**
- Added `kategori_ukt` collection - UKT category management
- Added `tagihan_ukt` collection - Student tuition bills
- Added `pembayaran_ukt` collection - Payment records
- Admin endpoints: CRUD kategori, tagihan, pembayaran, rekap
- Mahasiswa endpoints: View tagihan, create pembayaran
- Payment flow: pending → verified/rejected with status tracking
- Auto-update tagihan status (belum_bayar → cicilan → lunas)

**Frontend:**
- `/keuangan/tagihan` - Admin: Manajemen Tagihan UKT with summary cards, filters, batch create
- `/keuangan/pembayaran` - Admin: Verifikasi Pembayaran with approve/reject
- `/mahasiswa/keuangan` - Student: View tagihan, make payment, view history
- Updated Sidebar with Keuangan menu for Admin and Mahasiswa

### 2026-02-01: Fitur Biodata dengan Approval System
**Backend:**
- Added `biodata` collection - Student personal data for graduation certificates
- Added `biodata_change_request` collection - Track change requests with documents
- File upload endpoint with aiofiles for KTP, KK, Akte documents
- Static file serving via `/uploads/biodata/...`
- Mahasiswa endpoints: Get/Create biodata, submit change request, view history
- Admin endpoints: List change requests, view detail with comparison, approve/reject

**Frontend:**
- `/mahasiswa/biodata` - Student: View/Edit biodata, upload documents for changes, history
- `/biodata/verifikasi` - Admin: Review changes with old vs new comparison, view documents, approve/reject
- Form with all biodata fields (nama, TTL, NIK, alamat, orang tua, kontak)
- Document upload preview and external link
- Status badges and change history timeline

### 2026-02-01: Rename Aplikasi ke SIA ST3I
**Changes:**
- Renamed application from "SIAKAD" to "SIA ST3I"
- Updated browser title to "SIA ST3I - Sistem Informasi Akademik"
- Updated Login page header with full institution name
- Updated Sidebar brand name
- Updated PDF documents header to "SEKOLAH TINGGI TEOLOGI TRANSFORMASI INDONESIA"
- Updated Transkrip page footer

**Files Modified:**
- `frontend/public/index.html` - Page title
- `frontend/src/pages/Login.js` - Login header
- `frontend/src/components/layout/Sidebar.js` - Sidebar brand
- `frontend/src/components/layout/DashboardLayout.js` - Fallback title
- `frontend/src/pages/mahasiswa/TranskripPage.js` - Footer
- `frontend/src/components/pdf/KRSPdf.js` - PDF header
- `frontend/src/components/pdf/KHSPdf.js` - PDF header
