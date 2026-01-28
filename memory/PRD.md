# SIAKAD - Sistem Informasi Akademik
## Product Requirements Document (PRD)

### Original Problem Statement
Build a comprehensive SIAKAD (Sistem Informasi Akademik) for Indonesian universities with modules including:
- Master Data (Tahun Akademik, Fakultas, Program Studi, Kurikulum, Mata Kuliah, Mahasiswa, Dosen)
- User & Access Management
- Academic Core (KRS, Nilai, Transkrip)

### User Personas
1. **Admin** - Super administrator who manages all master data, users, and academic operations
2. **Dosen (Lecturer)** - Inputs grades, views assigned classes
3. **Mahasiswa (Student)** - Enrolls in courses (KRS), views grades (KHS), downloads transcripts

### Core Requirements (Static)
- Tech Stack: FastAPI + React + MongoDB
- Authentication: JWT-based with role management
- Language: Bahasa Indonesia
- Design: Modern & Minimalist with Deep Indigo (#1e1b4b) sidebar

---

## What's Been Implemented

### Date: 2025-01-28

#### Backend (FastAPI)
- ✅ Authentication (Login/Logout, JWT tokens, password hashing)
- ✅ User Management (CRUD, role-based access, toggle active)
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
- ✅ Dashboard Stats API

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
  - Validasi KRS (approve/reject)
- ✅ User Management (toggle active users)
- ✅ Toast notifications (sonner)
- ✅ Indonesian language throughout

---

## Prioritized Backlog

### P0 (Critical - Next Phase)
1. Mahasiswa Portal - KRS page for students to enroll
2. Mahasiswa Portal - KHS page to view semester grades
3. Mahasiswa Portal - Transkrip page with print/PDF
4. Dosen Portal - Kelas management & grade input UI

### P1 (High Priority)
1. Jadwal Kuliah - Schedule management with conflict detection
2. Presensi - Attendance tracking
3. Cetak Dokumen - PDF generation for academic documents
4. Password reset functionality

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
1. Implement Student KRS enrollment page
2. Implement Student KHS and Transkrip views
3. Implement Lecturer grade input interface
4. Add Jadwal/Schedule management
5. Implement PDF generation for transcripts

---

## Technical Notes
- Default Admin: admin@siakad.ac.id / admin123
- MongoDB collections: users, mahasiswa, dosen, fakultas, prodi, kurikulum, mata_kuliah, tahun_akademik, kelas, krs, nilai
- All timestamps in UTC ISO format
- Password hashing with bcrypt
