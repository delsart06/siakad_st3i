# SIAKAD - Sistem Informasi Akademik
## Product Requirements Document (PRD)

### Original Problem Statement
Build a comprehensive SIAKAD (Sistem Informasi Akademik) for Indonesian universities with modules including:
- Master Data (Tahun Akademik, Fakultas, Program Studi, Kurikulum, Mata Kuliah, Mahasiswa, Dosen)
- User & Access Management
- Academic Core (KRS, Nilai, Transkrip)

### User Personas
1. **Admin** - Super administrator who manages all master data, users, and academic operations
2. **Dosen (Lecturer)** - Inputs grades, views assigned classes, validates KRS as Dosen PA, manages presensi
3. **Mahasiswa (Student)** - Enrolls in courses (KRS), views grades (KHS), downloads transcripts, views jadwal & presensi

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
- ✅ **Portal Dosen:**
  - **Kelas Saya** - Daftar kelas yang diampu dengan stats (Total Kelas, Mahasiswa, SKS)
  - **Daftar Mahasiswa** - Lihat mahasiswa per kelas dengan search, filter, export CSV
  - **Presensi** - Input presensi per pertemuan, rekap kehadiran mahasiswa
  - **Input Nilai** - Input nilai Tugas, UTS, UAS dengan auto-calculation grade A-E
  - **Validasi KRS PA** - List mahasiswa bimbingan, approve/reject KRS
- ✅ **Password Reset:**
  - **Lupa Password Page** - Request reset token via email
  - **Reset Password Page** - Set new password with token validation
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
1. Keuangan Module - UKT/SPP integration
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
11. Add Modul Keuangan (UKT/SPP)
12. Add Bulk import Excel for Mahasiswa/Dosen

---

## Technical Notes
- Default Admin: admin@siakad.ac.id / admin123
- Test Mahasiswa: midel@siakad.ac.id / password
- Test Dosen PA: ahmad.pa@dosen.ac.id / password
- MongoDB collections: users, mahasiswa, dosen, fakultas, prodi, kurikulum, mata_kuliah, tahun_akademik, kelas, krs, nilai
- All timestamps in UTC ISO format
- Password hashing with bcrypt
- PDF generation using @react-pdf/renderer
