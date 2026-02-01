# SIAKAD - Sistem Informasi Akademik

Aplikasi Sistem Informasi Akademik untuk universitas berbasis web dengan fitur lengkap untuk Admin, Dosen, dan Mahasiswa.

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.9+)
- **Frontend**: React 18 + Tailwind CSS + Shadcn UI
- **Database**: MongoDB
- **Authentication**: JWT (Login dengan NIM/NIDN/NIP)

---

## 📋 Prerequisites

Pastikan sudah terinstall di komputer Anda:

1. **Python 3.9+** - [Download Python](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download Node.js](https://nodejs.org/)
3. **MongoDB** - [Download MongoDB](https://www.mongodb.com/try/download/community) atau gunakan [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud gratis)
4. **Git** - [Download Git](https://git-scm.com/)

---

## 🚀 Quick Start (Setup Cepat)

### Menggunakan Script Otomatis

**Linux/Mac:**
```bash
chmod +x scripts/setup_local.sh
./scripts/setup_local.sh
```

**Windows:**
```cmd
scripts\setup_local.bat
```

---

## 📖 Setup Manual

### Langkah 1: Clone Repository

```bash
git clone <your-repo-url>
cd siakad
```

### Langkah 2: Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Buat virtual environment
python -m venv venv

# Aktifkan virtual environment
# Linux/Mac:
source venv/bin/activate
# Windows CMD:
venv\Scripts\activate
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Langkah 3: Setup Frontend

```bash
# Buka terminal baru, masuk ke folder frontend
cd frontend

# Install dependencies (gunakan yarn)
yarn install
# atau npm
npm install
```

### Langkah 4: Konfigurasi Environment

**Backend** - Buat/Edit file `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=siakad
JWT_SECRET=siakad-secret-key-2024-secure
CORS_ORIGINS=http://localhost:3000
```

**Frontend** - Buat/Edit file `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Langkah 5: Jalankan MongoDB

Pastikan MongoDB sudah berjalan:
```bash
# Linux
sudo systemctl start mongod
# atau langsung
mongod

# Mac (dengan Homebrew)
brew services start mongodb-community

# Windows - jalankan MongoDB Service atau:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

### Langkah 6: Seed Database (Data Awal)

```bash
cd backend
source venv/bin/activate  # atau venv\Scripts\activate di Windows
python ../scripts/seed_data.py
```

### Langkah 7: Jalankan Aplikasi

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
# atau
npm start
```

### Langkah 8: Buka Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8001/docs

---

## 👤 Akun Default (Setelah Seed Data)

| Role | Login (NIM/NIDN/NIP) | Password |
|------|---------------------|----------|
| **Admin** | `1234567890` | `admin123` |
| **Dosen** | `0001018902` | `password` |
| **Mahasiswa** | `2024001` | `password` |

> **Note**: Login menggunakan NIM (Mahasiswa), NIDN (Dosen), atau NIP (Admin), bukan email!

---

## 📁 Struktur Project

```
siakad/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/            # Uploaded files (foto profil, biodata)
│   └── .env               # Backend environment variables
│
├── frontend/
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── layout/    # Layout components (Sidebar, Header)
│   │   │   ├── pdf/       # PDF templates (KRSPdf, KHSPdf)
│   │   │   └── ui/        # Shadcn UI components
│   │   ├── context/       # React Context (AuthContext)
│   │   ├── lib/           # Utilities (api.js, utils.js)
│   │   ├── pages/         # Page components
│   │   │   ├── master/    # Master data pages
│   │   │   ├── akademik/  # Academic pages
│   │   │   ├── mahasiswa/ # Student portal pages
│   │   │   ├── dosen/     # Lecturer portal pages
│   │   │   ├── keuangan/  # Finance pages
│   │   │   ├── biodata/   # Biodata pages
│   │   │   └── admin/     # Admin-specific pages
│   │   ├── App.js         # Main app with routing
│   │   └── index.js       # Entry point
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend environment variables
│
├── scripts/
│   ├── setup_local.sh     # Setup script untuk Linux/Mac
│   ├── setup_local.bat    # Setup script untuk Windows
│   └── seed_data.py       # Database seed script
│
├── memory/
│   └── PRD.md            # Product Requirements Document
│
└── README.md             # File ini
```

---

## ✅ Fitur yang Sudah Implementasi

### 🔐 Authentication
- ✅ Login dengan NIM/NIDN/NIP (bukan email)
- ✅ Lupa Password dengan approval admin
- ✅ Ganti Foto Profil dengan approval admin
- ✅ JWT Authentication

### 👨‍💼 Portal Admin
- ✅ Dashboard dengan statistik
- ✅ Master Data (Tahun Akademik, Fakultas, Prodi, Kurikulum, Mata Kuliah)
- ✅ Manajemen Mahasiswa & Dosen
- ✅ Manajemen Penawaran Kelas
- ✅ Jadwal Kuliah dengan deteksi konflik
- ✅ Validasi KRS
- ✅ Manajemen User
- ✅ Verifikasi Akun (Password & Foto)
- ✅ Manajemen Tagihan UKT
- ✅ Verifikasi Pembayaran
- ✅ Verifikasi Perubahan Biodata

### 👨‍🎓 Portal Mahasiswa
- ✅ Dashboard mahasiswa
- ✅ KRS - Pengajuan mata kuliah + Cetak PDF
- ✅ KHS - Lihat nilai semester + Cetak PDF
- ✅ Transkrip Nilai
- ✅ Jadwal Kuliah
- ✅ Presensi
- ✅ Keuangan (Tagihan & Pembayaran UKT)
- ✅ Biodata dengan approval

### 👨‍🏫 Portal Dosen
- ✅ Dashboard dosen
- ✅ Validasi KRS mahasiswa bimbingan (Dosen PA)
- ✅ Kelas Saya (Jadwal Mengajar)
- ✅ Daftar Mahasiswa per Kelas
- ✅ Input Nilai
- ✅ Presensi Mahasiswa

---

## 🔧 Scripts Development

### Backend
```bash
# Development dengan auto-reload
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Production
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

### Frontend
```bash
# Development
yarn start

# Build production
yarn build

# Lint check
yarn lint
```

---

## 📚 API Documentation

Setelah backend berjalan, akses dokumentasi API di:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Endpoint Utama

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login dengan NIM/NIDN/NIP |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/forgot-password-request | Request reset password |
| POST | /api/auth/upload-foto-profil | Upload foto profil baru |
| GET | /api/master/tahun-akademik | Get all tahun akademik |
| GET | /api/master/fakultas | Get all fakultas |
| GET | /api/master/prodi | Get all program studi |
| GET | /api/master/mata-kuliah | Get all mata kuliah |
| GET | /api/master/mahasiswa | Get all mahasiswa |
| GET | /api/master/dosen | Get all dosen |
| GET | /api/mahasiswa/krs | Get student KRS |
| POST | /api/mahasiswa/krs | Enroll in class |
| GET | /api/mahasiswa/khs | Get student grades |
| GET | /api/mahasiswa/keuangan/tagihan | Get student bills |
| GET | /api/dosen/krs-bimbingan | Get KRS for PA validation |
| GET | /api/keuangan/tagihan | Get all bills (admin) |
| GET | /api/biodata/change-requests | Get biodata change requests |

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solusi**: Pastikan MongoDB sudah berjalan dan MONGO_URL di `.env` sudah benar

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solusi**: Pastikan `CORS_ORIGINS` di `backend/.env` sesuai dengan URL frontend (http://localhost:3000)

### Module Not Found (Python)
```bash
# Pastikan virtual environment aktif
source venv/bin/activate  # atau venv\Scripts\activate

# Install ulang dependencies
pip install -r requirements.txt
```

### Module Not Found (Node)
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules
yarn install
```

### Port Already in Use
```bash
# Cari proses yang menggunakan port
# Linux/Mac:
lsof -i :8001
lsof -i :3000

# Windows:
netstat -ano | findstr :8001
netstat -ano | findstr :3000

# Kill proses tersebut
```

### Login Error "NIM/NIDN/NIP atau password salah"
1. Pastikan sudah menjalankan seed data: `python scripts/seed_data.py`
2. Pastikan menggunakan NIM/NIDN/NIP, bukan email
3. Cek password di tabel akun default di atas

---

## 🔮 Roadmap (Fitur Mendatang)

- [ ] Modul Laporan & Rekapitulasi
- [ ] Modul Monitoring & Dashboard Analytics
- [ ] Import Data dari Excel (Mahasiswa/Dosen/Nilai)
- [ ] QR Code untuk verifikasi dokumen
- [ ] Integrasi PDDIKTI
- [ ] Notifikasi Email/WhatsApp

---

## 📄 License

MIT License - Silakan gunakan dan modifikasi sesuai kebutuhan.

---

## 💡 Tips Pengembangan

1. **Hot Reload**: Backend dan frontend sudah mendukung hot reload. Perubahan kode akan otomatis diterapkan.

2. **Database GUI**: Gunakan [MongoDB Compass](https://www.mongodb.com/products/compass) untuk melihat/mengedit data di MongoDB.

3. **API Testing**: Gunakan Swagger UI di http://localhost:8001/docs untuk testing API langsung.

4. **React DevTools**: Install [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools) untuk debugging React.

5. **Environment Variables**: Jangan commit file `.env` ke git. Gunakan `.env.example` sebagai template.
