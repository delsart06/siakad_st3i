# SIAKAD - Sistem Informasi Akademik

Aplikasi Sistem Informasi Akademik untuk universitas berbasis web dengan fitur lengkap untuk Admin, Dosen, dan Mahasiswa.

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.9+)
- **Frontend**: React 18 + Tailwind CSS + Shadcn UI
- **Database**: MongoDB
- **Authentication**: JWT

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

### Setup Manual

#### Langkah 1: Clone Repository

```bash
git clone <your-repo-url>
cd siakad
```

#### Langkah 2: Setup Backend

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

#### Langkah 3: Setup Frontend

```bash
# Buka terminal baru, masuk ke folder frontend
cd frontend

# Install dependencies (gunakan yarn atau npm)
yarn install
# atau
npm install
```

#### Langkah 4: Konfigurasi Environment

**Backend** - Edit file `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=siakad
JWT_SECRET=siakad-secret-key-2024-secure
CORS_ORIGINS=http://localhost:3000
```

**Frontend** - Edit file `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

#### Langkah 5: Jalankan MongoDB

Pastikan MongoDB sudah berjalan:
```bash
# Linux/Mac
sudo systemctl start mongod
# atau
mongod

# Windows - jalankan MongoDB Service atau:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

#### Langkah 6: Seed Database (Opsional)

Untuk membuat data awal (admin, fakultas, prodi, dll):
```bash
cd backend
source venv/bin/activate  # atau venv\Scripts\activate di Windows
python ../scripts/seed_data.py
```

#### Langkah 7: Jalankan Aplikasi

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # aktifkan venv jika belum
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
# atau
npm start
```

#### Langkah 8: Buka Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8001/docs

---

## 👤 Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@siakad.ac.id | admin123 |
| Dosen | dosen@siakad.ac.id | password |
| Mahasiswa | mahasiswa@siakad.ac.id | password |

---

## 📁 Struktur Project

```
siakad/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
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
│   │   │   └── dosen/     # Lecturer portal pages
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

## 🔧 Scripts Development

### Backend
```bash
# Jalankan dengan auto-reload
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Jalankan production
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
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET | /api/master/tahun-akademik | Get all tahun akademik |
| GET | /api/master/fakultas | Get all fakultas |
| GET | /api/master/prodi | Get all program studi |
| GET | /api/master/mata-kuliah | Get all mata kuliah |
| GET | /api/master/mahasiswa | Get all mahasiswa |
| GET | /api/master/dosen | Get all dosen |
| GET | /api/mahasiswa/krs | Get student KRS |
| POST | /api/mahasiswa/krs | Enroll in class |
| GET | /api/mahasiswa/khs | Get student grades |
| GET | /api/dosen/krs-bimbingan | Get KRS for PA validation |

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Pastikan MongoDB sudah berjalan dan MONGO_URL di .env sudah benar
```

### CORS Error
```
Pastikan CORS_ORIGINS di backend/.env sesuai dengan URL frontend
```

### Module Not Found (Python)
```bash
pip install -r requirements.txt
```

### Module Not Found (Node)
```bash
yarn install
# atau
npm install
```

---

## 📝 Fitur yang Sudah Implementasi

### Admin
- ✅ Dashboard dengan statistik
- ✅ Manajemen Master Data (Tahun Akademik, Fakultas, Prodi, Kurikulum, Mata Kuliah)
- ✅ Manajemen Mahasiswa & Dosen
- ✅ Manajemen Penawaran Kelas
- ✅ Validasi KRS

### Mahasiswa
- ✅ Dashboard mahasiswa
- ✅ KRS - Pengajuan mata kuliah + Cetak PDF
- ✅ KHS - Lihat nilai semester + Cetak PDF
- ✅ Transkrip Nilai

### Dosen
- ✅ Dashboard dosen
- ✅ Validasi KRS mahasiswa bimbingan (Dosen PA)
- ✅ Lihat kelas yang diampu

---

## 🔮 Roadmap (Fitur Mendatang)

- [ ] Input Nilai oleh Dosen
- [ ] Jadwal Kuliah
- [ ] Presensi Mahasiswa
- [ ] Modul Keuangan (UKT/SPP)
- [ ] Integrasi PDDIKTI
- [ ] Notifikasi Email/WhatsApp

---

## 📄 License

MIT License - Silakan gunakan dan modifikasi sesuai kebutuhan.
