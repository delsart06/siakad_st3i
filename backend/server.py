from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import aiofiles
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'siakad-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="SIAKAD API", version="1.0.0")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
master_router = APIRouter(prefix="/master", tags=["Master Data"])
akademik_router = APIRouter(prefix="/akademik", tags=["Akademik"])
mahasiswa_router = APIRouter(prefix="/mahasiswa", tags=["Mahasiswa"])
dosen_router = APIRouter(prefix="/dosen", tags=["Dosen"])
keuangan_router = APIRouter(prefix="/keuangan", tags=["Keuangan"])
biodata_router = APIRouter(prefix="/biodata", tags=["Biodata"])

# File upload directory
UPLOAD_DIR = Path(__file__).parent / "uploads" / "biodata"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

security = HTTPBearer()

# ==================== MODELS ====================

# Base Models
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Role Constants - Hierarchical Access
ROLE_ADMIN = "admin"           # Super admin - full access
ROLE_REKTOR = "rektor"         # Rector - all data access (pimpinan level)
ROLE_DEKAN = "dekan"           # Dean - access all prodi in their fakultas
ROLE_KAPRODI = "kaprodi"       # Head of Study Program - access their prodi only
ROLE_DOSEN = "dosen"           # Lecturer
ROLE_MAHASISWA = "mahasiswa"   # Student

MANAGEMENT_ROLES = [ROLE_ADMIN, ROLE_REKTOR, ROLE_DEKAN, ROLE_KAPRODI]
ALL_ACCESS_ROLES = [ROLE_ADMIN, ROLE_REKTOR]

# User & Auth Models
class UserBase(BaseModel):
    email: EmailStr
    nama: str
    role: str  # admin, rektor, dekan, kaprodi, dosen, mahasiswa
    user_id_number: Optional[str] = None  # NIM/NIDN/NIP
    foto_profil: Optional[str] = None
    prodi_id: Optional[str] = None      # For kaprodi - their prodi
    fakultas_id: Optional[str] = None   # For dekan - their fakultas

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    user_id: str  # NIM/NIDN/NIP
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Password Reset Request (untuk approval admin)
class PasswordResetRequestCreate(BaseModel):
    user_id_number: str  # NIM/NIDN/NIP
    password_baru: str

class PasswordResetRequestResponse(BaseModel):
    id: str
    user_id: str
    user_id_number: str
    user_nama: Optional[str] = None
    prodi_id: Optional[str] = None
    prodi_nama: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    catatan_admin: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: Optional[str] = None

# Foto Profil Change Request
class FotoProfilChangeRequestResponse(BaseModel):
    id: str
    user_id: str
    user_id_number: str
    user_nama: Optional[str] = None
    prodi_id: Optional[str] = None
    prodi_nama: Optional[str] = None
    foto_lama: Optional[str] = None
    foto_baru: str
    status: str = "pending"
    catatan_admin: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: Optional[str] = None

# Tahun Akademik
class TahunAkademikBase(BaseModel):
    tahun: str  # e.g., "2024/2025"
    semester: str  # Ganjil, Genap
    is_active: bool = False
    tanggal_mulai: Optional[str] = None
    tanggal_selesai: Optional[str] = None

class TahunAkademikCreate(TahunAkademikBase):
    pass

class TahunAkademikResponse(TahunAkademikBase):
    id: str

# Fakultas
class FakultasBase(BaseModel):
    kode: str
    nama: str
    dekan: Optional[str] = None

class FakultasCreate(FakultasBase):
    pass

class FakultasResponse(FakultasBase):
    id: str

# Program Studi
class ProdiBase(BaseModel):
    kode: str
    nama: str
    fakultas_id: str
    jenjang: str  # D3, S1, S2, S3
    akreditasi: Optional[str] = None
    kaprodi: Optional[str] = None

class ProdiCreate(ProdiBase):
    pass

class ProdiResponse(ProdiBase):
    id: str
    fakultas_nama: Optional[str] = None

# Kurikulum
class KurikulumBase(BaseModel):
    kode: str
    nama: str
    tahun: str
    prodi_id: str
    is_active: bool = True

class KurikulumCreate(KurikulumBase):
    pass

class KurikulumResponse(KurikulumBase):
    id: str
    prodi_nama: Optional[str] = None

# Mata Kuliah
class MataKuliahBase(BaseModel):
    kode: str
    nama: str
    sks_teori: int = 0
    sks_praktik: int = 0
    semester: int  # 1-8
    kurikulum_id: str
    prasyarat_ids: List[str] = []

class MataKuliahCreate(MataKuliahBase):
    pass

class MataKuliahResponse(MataKuliahBase):
    id: str
    total_sks: int = 0

# Mahasiswa
class MahasiswaBase(BaseModel):
    nim: str
    nama: str
    email: EmailStr
    prodi_id: str
    tahun_masuk: str
    status: str = "aktif"  # aktif, cuti, lulus, drop_out
    jenis_kelamin: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[str] = None
    alamat: Optional[str] = None
    no_hp: Optional[str] = None
    dosen_pa_id: Optional[str] = None  # Dosen Pembimbing Akademik

class MahasiswaCreate(MahasiswaBase):
    password: str

class MahasiswaResponse(MahasiswaBase):
    id: str
    user_id: Optional[str] = None
    prodi_nama: Optional[str] = None
    dosen_pa_nama: Optional[str] = None

# Dosen
class DosenBase(BaseModel):
    nidn: str
    nama: str
    email: EmailStr
    prodi_id: Optional[str] = None
    jabatan_fungsional: Optional[str] = None
    status: str = "aktif"
    jenis_kelamin: Optional[str] = None
    no_hp: Optional[str] = None

class DosenCreate(DosenBase):
    password: str

class DosenResponse(DosenBase):
    id: str
    user_id: Optional[str] = None
    prodi_nama: Optional[str] = None

# Kelas (Penawaran Mata Kuliah)
class KelasBase(BaseModel):
    kode_kelas: str
    mata_kuliah_id: str
    dosen_id: str
    tahun_akademik_id: str
    kuota: int = 40
    jadwal: Optional[str] = None
    ruangan: Optional[str] = None

class KelasCreate(KelasBase):
    pass

class KelasResponse(KelasBase):
    id: str
    mata_kuliah_nama: Optional[str] = None
    dosen_nama: Optional[str] = None
    jumlah_peserta: int = 0

# KRS (Kartu Rencana Studi)
class KRSBase(BaseModel):
    mahasiswa_id: str
    kelas_id: str
    tahun_akademik_id: str
    status: str = "diajukan"  # diajukan, disetujui, ditolak

class KRSCreate(BaseModel):
    kelas_id: str

class KRSResponse(KRSBase):
    id: str
    mata_kuliah_nama: Optional[str] = None
    kode_mk: Optional[str] = None
    sks: int = 0
    dosen_nama: Optional[str] = None
    jadwal: Optional[str] = None
    mahasiswa_nim: Optional[str] = None
    mahasiswa_nama: Optional[str] = None

# Nilai
class NilaiBase(BaseModel):
    krs_id: str
    nilai_tugas: Optional[float] = None
    nilai_uts: Optional[float] = None
    nilai_uas: Optional[float] = None
    nilai_akhir: Optional[float] = None
    nilai_huruf: Optional[str] = None
    bobot: Optional[float] = None

class NilaiCreate(BaseModel):
    mahasiswa_id: str
    kelas_id: str
    nilai_tugas: Optional[float] = None
    nilai_uts: Optional[float] = None
    nilai_uas: Optional[float] = None

class NilaiResponse(NilaiBase):
    id: str
    mahasiswa_nama: Optional[str] = None
    nim: Optional[str] = None

# Jadwal Detail untuk conflict detection
class JadwalDetail(BaseModel):
    hari: str  # Senin, Selasa, etc.
    jam_mulai: str  # HH:MM format
    jam_selesai: str  # HH:MM format
    ruangan: Optional[str] = None

class KelasJadwalCreate(BaseModel):
    kode_kelas: str
    mata_kuliah_id: str
    dosen_id: str
    tahun_akademik_id: str
    kuota: int = 40
    hari: str
    jam_mulai: str
    jam_selesai: str
    ruangan: Optional[str] = None

class KelasJadwalResponse(BaseModel):
    id: str
    kode_kelas: str
    mata_kuliah_id: str
    mata_kuliah_nama: Optional[str] = None
    dosen_id: str
    dosen_nama: Optional[str] = None
    tahun_akademik_id: str
    kuota: int = 40
    hari: str
    jam_mulai: str
    jam_selesai: str
    ruangan: Optional[str] = None
    jumlah_peserta: int = 0

# Presensi (Attendance)
class PresensiBase(BaseModel):
    kelas_id: str
    pertemuan_ke: int
    tanggal: str  # YYYY-MM-DD

class PresensiCreate(PresensiBase):
    pass

class PresensiDetailCreate(BaseModel):
    mahasiswa_id: str
    status: str = "hadir"  # hadir, izin, sakit, alpha
    keterangan: Optional[str] = None

class PresensiResponse(PresensiBase):
    id: str
    created_at: Optional[str] = None

class PresensiDetailResponse(BaseModel):
    id: str
    presensi_id: str
    mahasiswa_id: str
    mahasiswa_nama: Optional[str] = None
    mahasiswa_nim: Optional[str] = None
    status: str
    keterangan: Optional[str] = None

class RekapPresensiResponse(BaseModel):
    mahasiswa_id: str
    mahasiswa_nama: str
    mahasiswa_nim: str
    hadir: int = 0
    izin: int = 0
    sakit: int = 0
    alpha: int = 0
    total_pertemuan: int = 0
    persentase_kehadiran: float = 0.0

# Password Reset
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetVerify(BaseModel):
    token: str
    new_password: str

class PasswordResetResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None  # Only for admin-generated tokens

# ==================== KEUANGAN (FINANCE) MODELS ====================

# Kategori UKT
class KategoriUKTBase(BaseModel):
    kode: str  # UKT-1, UKT-2, etc.
    nama: str  # "UKT Kategori 1", etc.
    nominal: float  # Amount in IDR
    deskripsi: Optional[str] = None

class KategoriUKTCreate(KategoriUKTBase):
    pass

class KategoriUKTResponse(KategoriUKTBase):
    id: str

# Tagihan UKT
class TagihanUKTBase(BaseModel):
    mahasiswa_id: str
    tahun_akademik_id: str
    kategori_ukt_id: str
    nominal: float
    status: str = "belum_bayar"  # belum_bayar, cicilan, lunas
    jatuh_tempo: str  # YYYY-MM-DD

class TagihanUKTCreate(BaseModel):
    mahasiswa_id: str
    tahun_akademik_id: str
    kategori_ukt_id: str
    jatuh_tempo: str

class TagihanUKTBatchCreate(BaseModel):
    tahun_akademik_id: str
    prodi_id: Optional[str] = None  # Optional filter by prodi
    jatuh_tempo: str

class TagihanUKTResponse(TagihanUKTBase):
    id: str
    mahasiswa_nim: Optional[str] = None
    mahasiswa_nama: Optional[str] = None
    prodi_nama: Optional[str] = None
    tahun_akademik_label: Optional[str] = None
    kategori_nama: Optional[str] = None
    total_dibayar: float = 0
    sisa_tagihan: float = 0
    created_at: Optional[str] = None

# Pembayaran UKT
class PembayaranUKTBase(BaseModel):
    tagihan_id: str
    nominal: float
    metode_pembayaran: str  # transfer, tunai, va_bank
    bukti_pembayaran: Optional[str] = None
    keterangan: Optional[str] = None

class PembayaranUKTCreate(PembayaranUKTBase):
    pass

class PembayaranUKTVerify(BaseModel):
    status: str  # verified, rejected
    catatan: Optional[str] = None

class PembayaranUKTResponse(PembayaranUKTBase):
    id: str
    status: str = "pending"  # pending, verified, rejected
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    catatan_verifikasi: Optional[str] = None
    created_at: Optional[str] = None
    mahasiswa_nama: Optional[str] = None
    mahasiswa_nim: Optional[str] = None

# Rekap Keuangan
class RekapKeuanganResponse(BaseModel):
    total_tagihan: float
    total_terbayar: float
    total_belum_bayar: float
    jumlah_mahasiswa_lunas: int
    jumlah_mahasiswa_cicilan: int
    jumlah_mahasiswa_belum_bayar: int

# Biodata Mahasiswa (untuk Ijazah)
class BiodataBase(BaseModel):
    nama_lengkap: str
    tempat_lahir: str
    tanggal_lahir: str  # YYYY-MM-DD
    nik: str
    no_kk: str
    jenis_kelamin: str  # L/P
    agama: str
    kewarganegaraan: str = "Indonesia"
    alamat_jalan: str
    alamat_rt: str
    alamat_rw: str
    alamat_kelurahan: str
    alamat_kecamatan: str
    alamat_kota: str
    alamat_provinsi: str
    alamat_kode_pos: str
    nama_ayah: str
    nama_ibu: str
    no_hp: str
    email: EmailStr

class BiodataCreate(BiodataBase):
    pass

class BiodataResponse(BiodataBase):
    id: str
    mahasiswa_id: str
    is_verified: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Biodata Change Request
class BiodataChangeRequestCreate(BaseModel):
    data_baru: Dict[str, Any]  # Changed fields only

class BiodataChangeRequestResponse(BaseModel):
    id: str
    mahasiswa_id: str
    mahasiswa_nim: Optional[str] = None
    mahasiswa_nama: Optional[str] = None
    data_lama: Dict[str, Any]
    data_baru: Dict[str, Any]
    dokumen_ktp: Optional[str] = None
    dokumen_kk: Optional[str] = None
    dokumen_akte: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    catatan_admin: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: Optional[str] = None

# Dashboard Stats
class DashboardStats(BaseModel):
    total_mahasiswa: int = 0
    total_dosen: int = 0
    total_prodi: int = 0
    total_mata_kuliah: int = 0
    mahasiswa_aktif: int = 0
    tahun_akademik_aktif: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token tidak valid")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token sudah kadaluarsa")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

# ==================== ROLE-BASED ACCESS HELPERS ====================

async def get_accessible_prodi_ids(user: dict) -> Optional[List[str]]:
    """
    Returns list of prodi_ids the user can access based on their role.
    Returns None if user has full access (admin/rektor).
    """
    role = user.get("role")
    
    # Admin dan Rektor punya akses penuh
    if role in ALL_ACCESS_ROLES:
        return None
    
    # Dekan: akses semua prodi di fakultasnya
    if role == ROLE_DEKAN:
        fakultas_id = user.get("fakultas_id")
        if not fakultas_id:
            return []
        prodis = await db.prodi.find({"fakultas_id": fakultas_id}, {"_id": 0, "id": 1}).to_list(100)
        return [p["id"] for p in prodis]
    
    # Kaprodi: hanya akses prodi-nya sendiri
    if role == ROLE_KAPRODI:
        prodi_id = user.get("prodi_id")
        return [prodi_id] if prodi_id else []
    
    # Dosen/Mahasiswa: tidak punya akses management
    return []

async def get_accessible_fakultas_ids(user: dict) -> Optional[List[str]]:
    """
    Returns list of fakultas_ids the user can access based on their role.
    Returns None if user has full access (admin/rektor).
    """
    role = user.get("role")
    
    if role in ALL_ACCESS_ROLES:
        return None
    
    if role == ROLE_DEKAN:
        fakultas_id = user.get("fakultas_id")
        return [fakultas_id] if fakultas_id else []
    
    if role == ROLE_KAPRODI:
        prodi_id = user.get("prodi_id")
        if prodi_id:
            prodi = await db.prodi.find_one({"id": prodi_id}, {"_id": 0})
            if prodi:
                return [prodi.get("fakultas_id")]
        return []
    
    return []

def check_management_access(user: dict):
    """Check if user has management access (admin, rektor, dekan, kaprodi)"""
    if user.get("role") not in MANAGEMENT_ROLES:
        raise HTTPException(status_code=403, detail="Akses ditolak. Anda tidak memiliki hak akses manajemen.")

def check_admin_access(user: dict):
    """Check if user has full admin access (admin only)"""
    if user.get("role") != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Akses ditolak. Hanya admin yang dapat melakukan aksi ini.")

def check_full_access(user: dict):
    """Check if user has full access (admin or rektor)"""
    if user.get("role") not in ALL_ACCESS_ROLES:
        raise HTTPException(status_code=403, detail="Akses ditolak. Hanya admin/rektor yang dapat melakukan aksi ini.")

async def filter_by_prodi_access(query: dict, user: dict, prodi_field: str = "prodi_id") -> dict:
    """Add prodi filter to query based on user's role access"""
    accessible_prodis = await get_accessible_prodi_ids(user)
    if accessible_prodis is not None:  # Not full access
        if not accessible_prodis:  # Empty list = no access
            query[prodi_field] = {"$in": []}
        else:
            query[prodi_field] = {"$in": accessible_prodis}
    return query

async def can_access_prodi(user: dict, prodi_id: str) -> bool:
    """Check if user can access a specific prodi"""
    accessible_prodis = await get_accessible_prodi_ids(user)
    if accessible_prodis is None:  # Full access
        return True
    return prodi_id in accessible_prodis

async def can_access_fakultas(user: dict, fakultas_id: str) -> bool:
    """Check if user can access a specific fakultas"""
    accessible_fakultas = await get_accessible_fakultas_ids(user)
    if accessible_fakultas is None:  # Full access
        return True
    return fakultas_id in accessible_fakultas

def calculate_nilai(tugas: float = 0, uts: float = 0, uas: float = 0) -> tuple:
    # Bobot: Tugas 30%, UTS 30%, UAS 40%
    nilai_akhir = (tugas * 0.3) + (uts * 0.3) + (uas * 0.4)
    
    if nilai_akhir >= 85:
        return nilai_akhir, "A", 4.0
    elif nilai_akhir >= 80:
        return nilai_akhir, "A-", 3.7
    elif nilai_akhir >= 75:
        return nilai_akhir, "B+", 3.3
    elif nilai_akhir >= 70:
        return nilai_akhir, "B", 3.0
    elif nilai_akhir >= 65:
        return nilai_akhir, "B-", 2.7
    elif nilai_akhir >= 60:
        return nilai_akhir, "C+", 2.3
    elif nilai_akhir >= 55:
        return nilai_akhir, "C", 2.0
    elif nilai_akhir >= 50:
        return nilai_akhir, "D", 1.0
    else:
        return nilai_akhir, "E", 0.0

# ==================== AUTH ROUTES ====================

@auth_router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "nama": user.nama,
        "role": user.role,
        "password": hash_password(user.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        id=user_id,
        email=user.email,
        nama=user.nama,
        role=user.role,
        is_active=True
    )

@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Login menggunakan NIM/NIDN/NIP
    user_id_input = credentials.user_id.strip()
    
    # Cari user berdasarkan user_id_number (NIM/NIDN/NIP)
    user = await db.users.find_one({"user_id_number": user_id_input}, {"_id": 0})
    
    # Fallback: coba cari di mahasiswa berdasarkan NIM
    if not user:
        mahasiswa = await db.mahasiswa.find_one({"nim": user_id_input}, {"_id": 0})
        if mahasiswa and mahasiswa.get("user_id"):
            user = await db.users.find_one({"id": mahasiswa["user_id"]}, {"_id": 0})
            # Update user_id_number jika belum ada
            if user and not user.get("user_id_number"):
                await db.users.update_one({"id": user["id"]}, {"$set": {"user_id_number": user_id_input}})
                user["user_id_number"] = user_id_input
    
    # Fallback: coba cari di dosen berdasarkan NIDN
    if not user:
        dosen = await db.dosen.find_one({"nidn": user_id_input}, {"_id": 0})
        if dosen and dosen.get("user_id"):
            user = await db.users.find_one({"id": dosen["user_id"]}, {"_id": 0})
            if user and not user.get("user_id_number"):
                await db.users.update_one({"id": user["id"]}, {"$set": {"user_id_number": user_id_input}})
                user["user_id_number"] = user_id_input
    
    if not user:
        raise HTTPException(status_code=401, detail="NIM/NIDN/NIP atau password salah")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="NIM/NIDN/NIP atau password salah")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Akun tidak aktif")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            nama=user["nama"],
            role=user["role"],
            is_active=user.get("is_active", True),
            user_id_number=user.get("user_id_number"),
            foto_profil=user.get("foto_profil")
        )
    )

@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        nama=current_user["nama"],
        role=current_user["role"],
        is_active=current_user.get("is_active", True),
        user_id_number=current_user.get("user_id_number"),
        foto_profil=current_user.get("foto_profil")
    )

@auth_router.put("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not verify_password(old_password, user["password"]):
        raise HTTPException(status_code=400, detail="Password lama salah")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": hash_password(new_password)}}
    )
    return {"message": "Password berhasil diubah"}

# ----- Lupa Password Request (untuk approval admin) -----
@auth_router.post("/forgot-password-request")
async def create_forgot_password_request(data: PasswordResetRequestCreate):
    user_id_input = data.user_id_number.strip()
    
    # Cari user
    user = await db.users.find_one({"user_id_number": user_id_input}, {"_id": 0})
    
    # Fallback ke mahasiswa
    prodi_id = None
    if not user:
        mahasiswa = await db.mahasiswa.find_one({"nim": user_id_input}, {"_id": 0})
        if mahasiswa and mahasiswa.get("user_id"):
            user = await db.users.find_one({"id": mahasiswa["user_id"]}, {"_id": 0})
            prodi_id = mahasiswa.get("prodi_id")
    
    # Fallback ke dosen
    if not user:
        dosen = await db.dosen.find_one({"nidn": user_id_input}, {"_id": 0})
        if dosen and dosen.get("user_id"):
            user = await db.users.find_one({"id": dosen["user_id"]}, {"_id": 0})
            # Cari prodi dari kelas yang diajar
            kelas = await db.kelas.find_one({"dosen_id": dosen["id"]}, {"_id": 0})
            if kelas:
                mk = await db.mata_kuliah.find_one({"id": kelas.get("mata_kuliah_id")}, {"_id": 0})
                if mk:
                    kurikulum = await db.kurikulum.find_one({"id": mk.get("kurikulum_id")}, {"_id": 0})
                    if kurikulum:
                        prodi_id = kurikulum.get("prodi_id")
    
    if not user:
        raise HTTPException(status_code=404, detail="User dengan NIM/NIDN/NIP tersebut tidak ditemukan")
    
    # Cek apakah sudah ada request pending
    existing = await db.password_reset_requests.find_one({
        "user_id": user["id"],
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Masih ada pengajuan yang belum diproses")
    
    # Hash password baru
    hashed_password = hash_password(data.password_baru)
    
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_id_number": user_id_input,
        "prodi_id": prodi_id,
        "password_baru_hash": hashed_password,
        "status": "pending",
        "catatan_admin": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.password_reset_requests.insert_one(doc)
    
    return {"message": "Pengajuan reset password berhasil dikirim. Menunggu persetujuan admin."}

@auth_router.get("/forgot-password-requests")
async def get_password_reset_requests(
    status: Optional[str] = "pending",
    prodi_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    query = {}
    if status:
        query["status"] = status
    if prodi_id:
        query["prodi_id"] = prodi_id
    
    requests = await db.password_reset_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    result = []
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0})
        prodi = await db.prodi.find_one({"id": req.get("prodi_id")}, {"_id": 0}) if req.get("prodi_id") else None
        result.append({
            **req,
            "user_nama": user["nama"] if user else None,
            "prodi_nama": prodi["nama"] if prodi else None
        })
    
    return result

@auth_router.put("/forgot-password-requests/{request_id}/review")
async def review_password_reset_request(
    request_id: str,
    action: str,
    catatan: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action harus 'approve' atau 'reject'")
    
    request = await db.password_reset_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Pengajuan sudah diproses")
    
    new_status = "approved" if action == "approve" else "rejected"
    
    await db.password_reset_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": new_status,
            "catatan_admin": catatan,
            "reviewed_by": current_user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Jika approved, update password user
    if action == "approve":
        await db.users.update_one(
            {"id": request["user_id"]},
            {"$set": {"password": request["password_baru_hash"]}}
        )
    
    return {"message": f"Pengajuan berhasil di{new_status}"}

# ----- Foto Profil -----
@auth_router.post("/upload-foto-profil")
async def upload_foto_profil(
    foto: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Cek apakah sudah ada request pending
    existing = await db.foto_profil_requests.find_one({
        "user_id": current_user["id"],
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Masih ada pengajuan foto yang belum diproses")
    
    # Simpan foto
    user_dir = UPLOAD_DIR.parent / "foto_profil" / current_user["id"]
    user_dir.mkdir(parents=True, exist_ok=True)
    
    ext = Path(foto.filename).suffix if foto.filename else ".jpg"
    filename = f"pending_{uuid.uuid4().hex[:8]}{ext}"
    file_path = user_dir / filename
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await foto.read()
        await f.write(content)
    
    foto_path = f"/uploads/foto_profil/{current_user['id']}/{filename}"
    
    # Dapatkan prodi_id
    prodi_id = None
    if current_user["role"] == "mahasiswa":
        mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if mhs:
            prodi_id = mhs.get("prodi_id")
    
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_id_number": current_user.get("user_id_number"),
        "prodi_id": prodi_id,
        "foto_lama": current_user.get("foto_profil"),
        "foto_baru": foto_path,
        "status": "pending",
        "catatan_admin": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.foto_profil_requests.insert_one(doc)
    
    return {"message": "Pengajuan ganti foto profil berhasil. Menunggu persetujuan admin."}

@auth_router.get("/foto-profil-requests")
async def get_foto_profil_requests(
    status: Optional[str] = "pending",
    prodi_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    query = {}
    if status:
        query["status"] = status
    if prodi_id:
        query["prodi_id"] = prodi_id
    
    requests = await db.foto_profil_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    result = []
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0})
        prodi = await db.prodi.find_one({"id": req.get("prodi_id")}, {"_id": 0}) if req.get("prodi_id") else None
        result.append({
            **req,
            "user_nama": user["nama"] if user else None,
            "prodi_nama": prodi["nama"] if prodi else None
        })
    
    return result

@auth_router.put("/foto-profil-requests/{request_id}/review")
async def review_foto_profil_request(
    request_id: str,
    action: str,
    catatan: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action harus 'approve' atau 'reject'")
    
    request = await db.foto_profil_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Pengajuan sudah diproses")
    
    new_status = "approved" if action == "approve" else "rejected"
    
    await db.foto_profil_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": new_status,
            "catatan_admin": catatan,
            "reviewed_by": current_user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Jika approved, update foto profil user
    if action == "approve":
        await db.users.update_one(
            {"id": request["user_id"]},
            {"$set": {"foto_profil": request["foto_baru"]}}
        )
    
    return {"message": f"Pengajuan berhasil di{new_status}"}

@auth_router.get("/my-foto-profil-requests")
async def get_my_foto_profil_requests(current_user: dict = Depends(get_current_user)):
    requests = await db.foto_profil_requests.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    return requests

# ==================== MASTER DATA ROUTES ====================

# Tahun Akademik
@master_router.get("/tahun-akademik", response_model=List[TahunAkademikResponse])
async def get_tahun_akademik(current_user: dict = Depends(get_current_user)):
    items = await db.tahun_akademik.find({}, {"_id": 0}).sort("tahun", -1).to_list(100)
    return items

@master_router.post("/tahun-akademik", response_model=TahunAkademikResponse)
async def create_tahun_akademik(
    data: TahunAkademikCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    item_id = str(uuid.uuid4())
    doc = {**data.model_dump(), "id": item_id}
    await db.tahun_akademik.insert_one(doc)
    return TahunAkademikResponse(**doc)

@master_router.put("/tahun-akademik/{item_id}", response_model=TahunAkademikResponse)
async def update_tahun_akademik(
    item_id: str,
    data: TahunAkademikCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # If setting as active, deactivate others
    if data.is_active:
        await db.tahun_akademik.update_many({}, {"$set": {"is_active": False}})
    
    await db.tahun_akademik.update_one(
        {"id": item_id},
        {"$set": data.model_dump()}
    )
    updated = await db.tahun_akademik.find_one({"id": item_id}, {"_id": 0})
    return TahunAkademikResponse(**updated)

@master_router.delete("/tahun-akademik/{item_id}")
async def delete_tahun_akademik(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    result = await db.tahun_akademik.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return {"message": "Data berhasil dihapus"}

@master_router.get("/tahun-akademik/active", response_model=Optional[TahunAkademikResponse])
async def get_active_tahun_akademik():
    item = await db.tahun_akademik.find_one({"is_active": True}, {"_id": 0})
    return item

# Fakultas
@master_router.get("/fakultas", response_model=List[FakultasResponse])
async def get_fakultas(current_user: dict = Depends(get_current_user)):
    items = await db.fakultas.find({}, {"_id": 0}).sort("nama", 1).to_list(100)
    return items

@master_router.post("/fakultas", response_model=FakultasResponse)
async def create_fakultas(
    data: FakultasCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    item_id = str(uuid.uuid4())
    doc = {**data.model_dump(), "id": item_id}
    await db.fakultas.insert_one(doc)
    return FakultasResponse(**doc)

@master_router.put("/fakultas/{item_id}", response_model=FakultasResponse)
async def update_fakultas(
    item_id: str,
    data: FakultasCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    await db.fakultas.update_one({"id": item_id}, {"$set": data.model_dump()})
    updated = await db.fakultas.find_one({"id": item_id}, {"_id": 0})
    return FakultasResponse(**updated)

@master_router.delete("/fakultas/{item_id}")
async def delete_fakultas(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    result = await db.fakultas.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return {"message": "Data berhasil dihapus"}

# Program Studi
@master_router.get("/prodi", response_model=List[ProdiResponse])
async def get_prodi(
    fakultas_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if fakultas_id:
        query["fakultas_id"] = fakultas_id
    
    items = await db.prodi.find(query, {"_id": 0}).sort("nama", 1).to_list(100)
    
    # Add fakultas nama
    for item in items:
        fakultas = await db.fakultas.find_one({"id": item["fakultas_id"]}, {"_id": 0})
        item["fakultas_nama"] = fakultas["nama"] if fakultas else None
    
    return items

@master_router.post("/prodi", response_model=ProdiResponse)
async def create_prodi(
    data: ProdiCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    item_id = str(uuid.uuid4())
    doc = {**data.model_dump(), "id": item_id}
    await db.prodi.insert_one(doc)
    
    fakultas = await db.fakultas.find_one({"id": data.fakultas_id}, {"_id": 0})
    return ProdiResponse(**doc, fakultas_nama=fakultas["nama"] if fakultas else None)

@master_router.put("/prodi/{item_id}", response_model=ProdiResponse)
async def update_prodi(
    item_id: str,
    data: ProdiCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    await db.prodi.update_one({"id": item_id}, {"$set": data.model_dump()})
    updated = await db.prodi.find_one({"id": item_id}, {"_id": 0})
    fakultas = await db.fakultas.find_one({"id": updated["fakultas_id"]}, {"_id": 0})
    return ProdiResponse(**updated, fakultas_nama=fakultas["nama"] if fakultas else None)

@master_router.delete("/prodi/{item_id}")
async def delete_prodi(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    result = await db.prodi.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return {"message": "Data berhasil dihapus"}

# Kurikulum
@master_router.get("/kurikulum", response_model=List[KurikulumResponse])
async def get_kurikulum(
    prodi_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if prodi_id:
        query["prodi_id"] = prodi_id
    
    items = await db.kurikulum.find(query, {"_id": 0}).sort("tahun", -1).to_list(100)
    
    for item in items:
        prodi = await db.prodi.find_one({"id": item["prodi_id"]}, {"_id": 0})
        item["prodi_nama"] = prodi["nama"] if prodi else None
    
    return items

@master_router.post("/kurikulum", response_model=KurikulumResponse)
async def create_kurikulum(
    data: KurikulumCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    item_id = str(uuid.uuid4())
    doc = {**data.model_dump(), "id": item_id}
    await db.kurikulum.insert_one(doc)
    
    prodi = await db.prodi.find_one({"id": data.prodi_id}, {"_id": 0})
    return KurikulumResponse(**doc, prodi_nama=prodi["nama"] if prodi else None)

@master_router.put("/kurikulum/{item_id}", response_model=KurikulumResponse)
async def update_kurikulum(
    item_id: str,
    data: KurikulumCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    await db.kurikulum.update_one({"id": item_id}, {"$set": data.model_dump()})
    updated = await db.kurikulum.find_one({"id": item_id}, {"_id": 0})
    prodi = await db.prodi.find_one({"id": updated["prodi_id"]}, {"_id": 0})
    return KurikulumResponse(**updated, prodi_nama=prodi["nama"] if prodi else None)

@master_router.delete("/kurikulum/{item_id}")
async def delete_kurikulum(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    result = await db.kurikulum.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return {"message": "Data berhasil dihapus"}

# Mata Kuliah
@master_router.get("/mata-kuliah", response_model=List[MataKuliahResponse])
async def get_mata_kuliah(
    kurikulum_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if kurikulum_id:
        query["kurikulum_id"] = kurikulum_id
    
    items = await db.mata_kuliah.find(query, {"_id": 0}).sort("semester", 1).to_list(500)
    
    for item in items:
        item["total_sks"] = item.get("sks_teori", 0) + item.get("sks_praktik", 0)
    
    return items

@master_router.post("/mata-kuliah", response_model=MataKuliahResponse)
async def create_mata_kuliah(
    data: MataKuliahCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    item_id = str(uuid.uuid4())
    doc = {**data.model_dump(), "id": item_id}
    await db.mata_kuliah.insert_one(doc)
    
    return MataKuliahResponse(
        **doc,
        total_sks=data.sks_teori + data.sks_praktik
    )

@master_router.put("/mata-kuliah/{item_id}", response_model=MataKuliahResponse)
async def update_mata_kuliah(
    item_id: str,
    data: MataKuliahCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    await db.mata_kuliah.update_one({"id": item_id}, {"$set": data.model_dump()})
    updated = await db.mata_kuliah.find_one({"id": item_id}, {"_id": 0})
    return MataKuliahResponse(
        **updated,
        total_sks=updated.get("sks_teori", 0) + updated.get("sks_praktik", 0)
    )

@master_router.delete("/mata-kuliah/{item_id}")
async def delete_mata_kuliah(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    result = await db.mata_kuliah.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return {"message": "Data berhasil dihapus"}

# ==================== MAHASISWA ROUTES ====================

@master_router.get("/mahasiswa", response_model=List[MahasiswaResponse])
async def get_mahasiswa(
    prodi_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Check management access for listing mahasiswa
    check_management_access(current_user)
    
    query = {}
    if prodi_id:
        query["prodi_id"] = prodi_id
    if status:
        query["status"] = status
    
    # Apply role-based prodi filter
    query = await filter_by_prodi_access(query, current_user, "prodi_id")
    
    items = await db.mahasiswa.find(query, {"_id": 0}).sort("nim", 1).to_list(1000)
    
    for item in items:
        prodi = await db.prodi.find_one({"id": item["prodi_id"]}, {"_id": 0})
        item["prodi_nama"] = prodi["nama"] if prodi else None
        # Add dosen PA nama
        if item.get("dosen_pa_id"):
            dosen_pa = await db.dosen.find_one({"id": item["dosen_pa_id"]}, {"_id": 0})
            item["dosen_pa_nama"] = dosen_pa["nama"] if dosen_pa else None
        else:
            item["dosen_pa_nama"] = None
    
    return items

@master_router.post("/mahasiswa", response_model=MahasiswaResponse)
async def create_mahasiswa(
    data: MahasiswaCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Check if NIM exists
    existing = await db.mahasiswa.find_one({"nim": data.nim})
    if existing:
        raise HTTPException(status_code=400, detail="NIM sudah terdaftar")
    
    # Create user account
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "nama": data.nama,
        "role": "mahasiswa",
        "password": hash_password(data.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create mahasiswa
    item_id = str(uuid.uuid4())
    mhs_data = data.model_dump()
    del mhs_data["password"]
    doc = {**mhs_data, "id": item_id, "user_id": user_id}
    await db.mahasiswa.insert_one(doc)
    
    prodi = await db.prodi.find_one({"id": data.prodi_id}, {"_id": 0})
    dosen_pa_nama = None
    if data.dosen_pa_id:
        dosen_pa = await db.dosen.find_one({"id": data.dosen_pa_id}, {"_id": 0})
        dosen_pa_nama = dosen_pa["nama"] if dosen_pa else None
    
    return MahasiswaResponse(**doc, prodi_nama=prodi["nama"] if prodi else None, dosen_pa_nama=dosen_pa_nama)

@master_router.put("/mahasiswa/{item_id}", response_model=MahasiswaResponse)
async def update_mahasiswa(
    item_id: str,
    data: MahasiswaBase,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    await db.mahasiswa.update_one({"id": item_id}, {"$set": data.model_dump()})
    updated = await db.mahasiswa.find_one({"id": item_id}, {"_id": 0})
    prodi = await db.prodi.find_one({"id": updated["prodi_id"]}, {"_id": 0})
    dosen_pa_nama = None
    if updated.get("dosen_pa_id"):
        dosen_pa = await db.dosen.find_one({"id": updated["dosen_pa_id"]}, {"_id": 0})
        dosen_pa_nama = dosen_pa["nama"] if dosen_pa else None
    
    return MahasiswaResponse(**updated, prodi_nama=prodi["nama"] if prodi else None, dosen_pa_nama=dosen_pa_nama)

@master_router.delete("/mahasiswa/{item_id}")
async def delete_mahasiswa(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    mhs = await db.mahasiswa.find_one({"id": item_id}, {"_id": 0})
    if mhs and mhs.get("user_id"):
        await db.users.delete_one({"id": mhs["user_id"]})
    
    result = await db.mahasiswa.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return {"message": "Data berhasil dihapus"}

@master_router.get("/mahasiswa/{item_id}", response_model=MahasiswaResponse)
async def get_mahasiswa_by_id(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"id": item_id}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    
    prodi = await db.prodi.find_one({"id": mhs["prodi_id"]}, {"_id": 0})
    return MahasiswaResponse(**mhs, prodi_nama=prodi["nama"] if prodi else None)

# ==================== DOSEN ROUTES ====================

@master_router.get("/dosen", response_model=List[DosenResponse])
async def get_dosen(
    prodi_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if prodi_id:
        query["prodi_id"] = prodi_id
    
    items = await db.dosen.find(query, {"_id": 0}).sort("nama", 1).to_list(500)
    
    for item in items:
        if item.get("prodi_id"):
            prodi = await db.prodi.find_one({"id": item["prodi_id"]}, {"_id": 0})
            item["prodi_nama"] = prodi["nama"] if prodi else None
    
    return items

@master_router.post("/dosen", response_model=DosenResponse)
async def create_dosen(
    data: DosenCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Check if NIDN exists
    existing = await db.dosen.find_one({"nidn": data.nidn})
    if existing:
        raise HTTPException(status_code=400, detail="NIDN sudah terdaftar")
    
    # Create user account
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "nama": data.nama,
        "role": "dosen",
        "password": hash_password(data.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create dosen
    item_id = str(uuid.uuid4())
    dosen_data = data.model_dump()
    del dosen_data["password"]
    doc = {**dosen_data, "id": item_id, "user_id": user_id}
    await db.dosen.insert_one(doc)
    
    prodi_nama = None
    if data.prodi_id:
        prodi = await db.prodi.find_one({"id": data.prodi_id}, {"_id": 0})
        prodi_nama = prodi["nama"] if prodi else None
    
    return DosenResponse(**doc, prodi_nama=prodi_nama)

@master_router.put("/dosen/{item_id}", response_model=DosenResponse)
async def update_dosen(
    item_id: str,
    data: DosenBase,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    await db.dosen.update_one({"id": item_id}, {"$set": data.model_dump()})
    updated = await db.dosen.find_one({"id": item_id}, {"_id": 0})
    
    prodi_nama = None
    if updated.get("prodi_id"):
        prodi = await db.prodi.find_one({"id": updated["prodi_id"]}, {"_id": 0})
        prodi_nama = prodi["nama"] if prodi else None
    
    return DosenResponse(**updated, prodi_nama=prodi_nama)

@master_router.delete("/dosen/{item_id}")
async def delete_dosen(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    dosen = await db.dosen.find_one({"id": item_id}, {"_id": 0})
    if dosen and dosen.get("user_id"):
        await db.users.delete_one({"id": dosen["user_id"]})
    
    result = await db.dosen.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return {"message": "Data berhasil dihapus"}

# ==================== AKADEMIK ROUTES ====================

# Kelas (Penawaran MK)
@akademik_router.get("/kelas", response_model=List[KelasResponse])
async def get_kelas(
    tahun_akademik_id: Optional[str] = None,
    mata_kuliah_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    if mata_kuliah_id:
        query["mata_kuliah_id"] = mata_kuliah_id
    
    items = await db.kelas.find(query, {"_id": 0}).to_list(500)
    
    result = []
    for item in items:
        mk = await db.mata_kuliah.find_one({"id": item["mata_kuliah_id"]}, {"_id": 0})
        dosen = await db.dosen.find_one({"id": item["dosen_id"]}, {"_id": 0})
        
        # Count enrolled students
        krs_count = await db.krs.count_documents({
            "kelas_id": item["id"],
            "status": "disetujui"
        })
        
        result.append(KelasResponse(
            **item,
            mata_kuliah_nama=mk["nama"] if mk else None,
            dosen_nama=dosen["nama"] if dosen else None,
            jumlah_peserta=krs_count
        ))
    
    return result

@akademik_router.post("/kelas", response_model=KelasResponse)
async def create_kelas(
    data: KelasCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    item_id = str(uuid.uuid4())
    doc = {**data.model_dump(), "id": item_id}
    await db.kelas.insert_one(doc)
    
    mk = await db.mata_kuliah.find_one({"id": data.mata_kuliah_id}, {"_id": 0})
    dosen = await db.dosen.find_one({"id": data.dosen_id}, {"_id": 0})
    
    return KelasResponse(
        **doc,
        mata_kuliah_nama=mk["nama"] if mk else None,
        dosen_nama=dosen["nama"] if dosen else None,
        jumlah_peserta=0
    )

@akademik_router.put("/kelas/{item_id}", response_model=KelasResponse)
async def update_kelas(
    item_id: str,
    data: KelasCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    await db.kelas.update_one({"id": item_id}, {"$set": data.model_dump()})
    updated = await db.kelas.find_one({"id": item_id}, {"_id": 0})
    
    mk = await db.mata_kuliah.find_one({"id": updated["mata_kuliah_id"]}, {"_id": 0})
    dosen = await db.dosen.find_one({"id": updated["dosen_id"]}, {"_id": 0})
    krs_count = await db.krs.count_documents({"kelas_id": item_id, "status": "disetujui"})
    
    return KelasResponse(
        **updated,
        mata_kuliah_nama=mk["nama"] if mk else None,
        dosen_nama=dosen["nama"] if dosen else None,
        jumlah_peserta=krs_count
    )

@akademik_router.delete("/kelas/{item_id}")
async def delete_kelas(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    result = await db.kelas.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return {"message": "Data berhasil dihapus"}

# ==================== KRS ROUTES ====================

@mahasiswa_router.get("/krs", response_model=List[KRSResponse])
async def get_my_krs(
    tahun_akademik_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Get mahasiswa from user
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs and current_user["role"] != "admin":
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    query = {"mahasiswa_id": mhs["id"]} if mhs else {}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    
    items = await db.krs.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for item in items:
        kelas = await db.kelas.find_one({"id": item["kelas_id"]}, {"_id": 0})
        if kelas:
            mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
            dosen = await db.dosen.find_one({"id": kelas["dosen_id"]}, {"_id": 0})
            
            result.append(KRSResponse(
                **item,
                mata_kuliah_nama=mk["nama"] if mk else None,
                kode_mk=mk["kode"] if mk else None,
                sks=(mk.get("sks_teori", 0) + mk.get("sks_praktik", 0)) if mk else 0,
                dosen_nama=dosen["nama"] if dosen else None,
                jadwal=kelas.get("jadwal")
            ))
    
    return result

@mahasiswa_router.post("/krs", response_model=KRSResponse)
async def create_krs(
    data: KRSCreate,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    # Get active tahun akademik
    ta = await db.tahun_akademik.find_one({"is_active": True}, {"_id": 0})
    if not ta:
        raise HTTPException(status_code=400, detail="Tidak ada tahun akademik aktif")
    
    # Check if already enrolled
    existing = await db.krs.find_one({
        "mahasiswa_id": mhs["id"],
        "kelas_id": data.kelas_id,
        "tahun_akademik_id": ta["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Sudah terdaftar di kelas ini")
    
    # Check kuota
    kelas = await db.kelas.find_one({"id": data.kelas_id}, {"_id": 0})
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    
    enrolled = await db.krs.count_documents({
        "kelas_id": data.kelas_id,
        "status": {"$in": ["diajukan", "disetujui"]}
    })
    if enrolled >= kelas.get("kuota", 40):
        raise HTTPException(status_code=400, detail="Kuota kelas penuh")
    
    item_id = str(uuid.uuid4())
    doc = {
        "id": item_id,
        "mahasiswa_id": mhs["id"],
        "kelas_id": data.kelas_id,
        "tahun_akademik_id": ta["id"],
        "status": "diajukan",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.krs.insert_one(doc)
    
    mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
    dosen = await db.dosen.find_one({"id": kelas["dosen_id"]}, {"_id": 0})
    
    return KRSResponse(
        **doc,
        mata_kuliah_nama=mk["nama"] if mk else None,
        kode_mk=mk["kode"] if mk else None,
        sks=(mk.get("sks_teori", 0) + mk.get("sks_praktik", 0)) if mk else 0,
        dosen_nama=dosen["nama"] if dosen else None,
        jadwal=kelas.get("jadwal")
    )

@mahasiswa_router.delete("/krs/{item_id}")
async def delete_krs(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    krs = await db.krs.find_one({"id": item_id, "mahasiswa_id": mhs["id"]}, {"_id": 0})
    if not krs:
        raise HTTPException(status_code=404, detail="KRS tidak ditemukan")
    
    if krs["status"] == "disetujui":
        raise HTTPException(status_code=400, detail="KRS yang sudah disetujui tidak bisa dihapus")
    
    await db.krs.delete_one({"id": item_id})
    return {"message": "KRS berhasil dihapus"}

# Mahasiswa profile
@mahasiswa_router.get("/profile")
async def get_mahasiswa_profile(current_user: dict = Depends(get_current_user)):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    prodi = await db.prodi.find_one({"id": mhs["prodi_id"]}, {"_id": 0})
    fakultas = None
    if prodi:
        fakultas = await db.fakultas.find_one({"id": prodi.get("fakultas_id")}, {"_id": 0})
    
    # Get dosen PA nama
    dosen_pa_nama = None
    if mhs.get("dosen_pa_id"):
        dosen_pa = await db.dosen.find_one({"id": mhs["dosen_pa_id"]}, {"_id": 0})
        dosen_pa_nama = dosen_pa["nama"] if dosen_pa else None
    
    return {
        **mhs,
        "prodi_nama": prodi["nama"] if prodi else None,
        "fakultas_nama": fakultas["nama"] if fakultas else None,
        "dosen_pa_nama": dosen_pa_nama
    }

# Get available kelas for mahasiswa
@mahasiswa_router.get("/kelas-tersedia", response_model=List[KelasResponse])
async def get_available_kelas(
    tahun_akademik_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # If no TA specified, get active one
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    else:
        active_ta = await db.tahun_akademik.find_one({"is_active": True}, {"_id": 0})
        if active_ta:
            query["tahun_akademik_id"] = active_ta["id"]
    
    items = await db.kelas.find(query, {"_id": 0}).to_list(500)
    
    result = []
    for item in items:
        mk = await db.mata_kuliah.find_one({"id": item["mata_kuliah_id"]}, {"_id": 0})
        dosen = await db.dosen.find_one({"id": item["dosen_id"]}, {"_id": 0})
        
        # Count enrolled students
        krs_count = await db.krs.count_documents({
            "kelas_id": item["id"],
            "status": {"$in": ["diajukan", "disetujui"]}
        })
        
        result.append(KelasResponse(
            **item,
            mata_kuliah_nama=mk["nama"] if mk else None,
            dosen_nama=dosen["nama"] if dosen else None,
            jumlah_peserta=krs_count
        ))
    
    return result

# Admin or Dosen PA approve/reject KRS
@akademik_router.put("/krs/{item_id}/approve")
async def approve_krs(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Check if admin or dosen PA
    if current_user["role"] == "admin":
        await db.krs.update_one({"id": item_id}, {"$set": {"status": "disetujui", "approved_by": current_user["id"]}})
        return {"message": "KRS disetujui"}
    
    if current_user["role"] == "dosen":
        # Check if this dosen is PA for this mahasiswa
        krs = await db.krs.find_one({"id": item_id}, {"_id": 0})
        if not krs:
            raise HTTPException(status_code=404, detail="KRS tidak ditemukan")
        
        mhs = await db.mahasiswa.find_one({"id": krs["mahasiswa_id"]}, {"_id": 0})
        dosen = await db.dosen.find_one({"user_id": current_user["id"]}, {"_id": 0})
        
        if not mhs or not dosen:
            raise HTTPException(status_code=403, detail="Akses ditolak")
        
        if mhs.get("dosen_pa_id") != dosen["id"]:
            raise HTTPException(status_code=403, detail="Anda bukan Dosen PA mahasiswa ini")
        
        await db.krs.update_one({"id": item_id}, {"$set": {"status": "disetujui", "approved_by": current_user["id"]}})
        return {"message": "KRS disetujui oleh Dosen PA"}
    
    raise HTTPException(status_code=403, detail="Akses ditolak")

@akademik_router.put("/krs/{item_id}/reject")
async def reject_krs(
    item_id: str,
    catatan: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Check if admin or dosen PA
    if current_user["role"] == "admin":
        update_data = {"status": "ditolak", "rejected_by": current_user["id"]}
        if catatan:
            update_data["catatan_penolakan"] = catatan
        await db.krs.update_one({"id": item_id}, {"$set": update_data})
        return {"message": "KRS ditolak"}
    
    if current_user["role"] == "dosen":
        krs = await db.krs.find_one({"id": item_id}, {"_id": 0})
        if not krs:
            raise HTTPException(status_code=404, detail="KRS tidak ditemukan")
        
        mhs = await db.mahasiswa.find_one({"id": krs["mahasiswa_id"]}, {"_id": 0})
        dosen = await db.dosen.find_one({"user_id": current_user["id"]}, {"_id": 0})
        
        if not mhs or not dosen:
            raise HTTPException(status_code=403, detail="Akses ditolak")
        
        if mhs.get("dosen_pa_id") != dosen["id"]:
            raise HTTPException(status_code=403, detail="Anda bukan Dosen PA mahasiswa ini")
        
        update_data = {"status": "ditolak", "rejected_by": current_user["id"]}
        if catatan:
            update_data["catatan_penolakan"] = catatan
        await db.krs.update_one({"id": item_id}, {"$set": update_data})
        return {"message": "KRS ditolak oleh Dosen PA"}
    
    raise HTTPException(status_code=403, detail="Akses ditolak")

# Get all KRS for admin
@akademik_router.get("/krs", response_model=List[KRSResponse])
async def get_all_krs(
    tahun_akademik_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    query = {}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    if status:
        query["status"] = status
    
    items = await db.krs.find(query, {"_id": 0}).to_list(1000)
    
    result = []
    for item in items:
        kelas = await db.kelas.find_one({"id": item["kelas_id"]}, {"_id": 0})
        mahasiswa = await db.mahasiswa.find_one({"id": item["mahasiswa_id"]}, {"_id": 0})
        if kelas:
            mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
            dosen = await db.dosen.find_one({"id": kelas["dosen_id"]}, {"_id": 0})
            
            result.append(KRSResponse(
                **item,
                mata_kuliah_nama=mk["nama"] if mk else None,
                kode_mk=mk["kode"] if mk else None,
                sks=(mk.get("sks_teori", 0) + mk.get("sks_praktik", 0)) if mk else 0,
                dosen_nama=dosen["nama"] if dosen else None,
                jadwal=kelas.get("jadwal"),
                mahasiswa_nim=mahasiswa["nim"] if mahasiswa else None,
                mahasiswa_nama=mahasiswa["nama"] if mahasiswa else None
            ))
    
    return result

# ==================== NILAI ROUTES ====================

# Dosen input nilai
@dosen_router.get("/kelas", response_model=List[KelasResponse])
async def get_my_kelas(
    tahun_akademik_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    dosen = await db.dosen.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not dosen:
        raise HTTPException(status_code=404, detail="Data dosen tidak ditemukan")
    
    query = {"dosen_id": dosen["id"]}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    
    items = await db.kelas.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for item in items:
        mk = await db.mata_kuliah.find_one({"id": item["mata_kuliah_id"]}, {"_id": 0})
        krs_count = await db.krs.count_documents({"kelas_id": item["id"], "status": "disetujui"})
        
        result.append(KelasResponse(
            **item,
            mata_kuliah_nama=mk["nama"] if mk else None,
            dosen_nama=dosen["nama"],
            jumlah_peserta=krs_count
        ))
    
    return result

# Dosen PA - Get mahasiswa bimbingan
@dosen_router.get("/mahasiswa-bimbingan")
async def get_mahasiswa_bimbingan(
    current_user: dict = Depends(get_current_user)
):
    dosen = await db.dosen.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not dosen:
        raise HTTPException(status_code=404, detail="Data dosen tidak ditemukan")
    
    # Get all mahasiswa where this dosen is PA
    mahasiswa_list = await db.mahasiswa.find(
        {"dosen_pa_id": dosen["id"]},
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for mhs in mahasiswa_list:
        prodi = await db.prodi.find_one({"id": mhs["prodi_id"]}, {"_id": 0})
        result.append({
            **mhs,
            "prodi_nama": prodi["nama"] if prodi else None
        })
    
    return result

# Dosen PA - Get KRS mahasiswa bimbingan
@dosen_router.get("/krs-bimbingan")
async def get_krs_bimbingan(
    tahun_akademik_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    dosen = await db.dosen.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not dosen:
        raise HTTPException(status_code=404, detail="Data dosen tidak ditemukan")
    
    # Get all mahasiswa where this dosen is PA
    mahasiswa_list = await db.mahasiswa.find(
        {"dosen_pa_id": dosen["id"]},
        {"_id": 0}
    ).to_list(100)
    
    mhs_ids = [m["id"] for m in mahasiswa_list]
    
    # Get KRS for these mahasiswa
    query = {"mahasiswa_id": {"$in": mhs_ids}}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    if status:
        query["status"] = status
    
    krs_list = await db.krs.find(query, {"_id": 0}).to_list(500)
    
    result = []
    for krs in krs_list:
        mhs = next((m for m in mahasiswa_list if m["id"] == krs["mahasiswa_id"]), None)
        kelas = await db.kelas.find_one({"id": krs["kelas_id"]}, {"_id": 0})
        
        if kelas:
            mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
            
            result.append({
                "id": krs["id"],
                "mahasiswa_id": krs["mahasiswa_id"],
                "mahasiswa_nim": mhs["nim"] if mhs else None,
                "mahasiswa_nama": mhs["nama"] if mhs else None,
                "kelas_id": krs["kelas_id"],
                "mata_kuliah_nama": mk["nama"] if mk else None,
                "sks": (mk.get("sks_teori", 0) + mk.get("sks_praktik", 0)) if mk else 0,
                "jadwal": kelas.get("jadwal"),
                "status": krs["status"],
                "tahun_akademik_id": krs["tahun_akademik_id"],
                "catatan_penolakan": krs.get("catatan_penolakan"),
            })
    
    return result

@dosen_router.get("/kelas/{kelas_id}/mahasiswa")
async def get_kelas_mahasiswa(
    kelas_id: str,
    current_user: dict = Depends(get_current_user)
):
    dosen = await db.dosen.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not dosen and current_user["role"] != "admin":
        raise HTTPException(status_code=404, detail="Data dosen tidak ditemukan")
    
    # Get all approved KRS for this class
    krs_list = await db.krs.find(
        {"kelas_id": kelas_id, "status": "disetujui"},
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for krs in krs_list:
        mhs = await db.mahasiswa.find_one({"id": krs["mahasiswa_id"]}, {"_id": 0})
        if mhs:
            # Get nilai if exists
            nilai = await db.nilai.find_one({"krs_id": krs["id"]}, {"_id": 0})
            
            result.append({
                "krs_id": krs["id"],
                "mahasiswa_id": mhs["id"],
                "nim": mhs["nim"],
                "nama": mhs["nama"],
                "nilai_tugas": nilai.get("nilai_tugas") if nilai else None,
                "nilai_uts": nilai.get("nilai_uts") if nilai else None,
                "nilai_uas": nilai.get("nilai_uas") if nilai else None,
                "nilai_akhir": nilai.get("nilai_akhir") if nilai else None,
                "nilai_huruf": nilai.get("nilai_huruf") if nilai else None,
            })
    
    return result

@dosen_router.post("/nilai")
async def input_nilai(
    data: NilaiCreate,
    current_user: dict = Depends(get_current_user)
):
    dosen = await db.dosen.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not dosen and current_user["role"] != "admin":
        raise HTTPException(status_code=404, detail="Data dosen tidak ditemukan")
    
    # Get KRS
    krs = await db.krs.find_one({
        "mahasiswa_id": data.mahasiswa_id,
        "kelas_id": data.kelas_id,
        "status": "disetujui"
    }, {"_id": 0})
    
    if not krs:
        raise HTTPException(status_code=404, detail="KRS tidak ditemukan")
    
    # Calculate nilai
    tugas = data.nilai_tugas or 0
    uts = data.nilai_uts or 0
    uas = data.nilai_uas or 0
    nilai_akhir, nilai_huruf, bobot = calculate_nilai(tugas, uts, uas)
    
    # Check if nilai exists
    existing = await db.nilai.find_one({"krs_id": krs["id"]})
    
    nilai_doc = {
        "krs_id": krs["id"],
        "nilai_tugas": data.nilai_tugas,
        "nilai_uts": data.nilai_uts,
        "nilai_uas": data.nilai_uas,
        "nilai_akhir": round(nilai_akhir, 2),
        "nilai_huruf": nilai_huruf,
        "bobot": bobot,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.nilai.update_one({"krs_id": krs["id"]}, {"$set": nilai_doc})
    else:
        nilai_doc["id"] = str(uuid.uuid4())
        await db.nilai.insert_one(nilai_doc)
    
    return {"message": "Nilai berhasil disimpan", "nilai_huruf": nilai_huruf, "nilai_akhir": round(nilai_akhir, 2)}

# ==================== KHS & TRANSKRIP ====================

@mahasiswa_router.get("/khs")
async def get_khs(
    tahun_akademik_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    query = {"mahasiswa_id": mhs["id"], "status": "disetujui"}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    
    krs_list = await db.krs.find(query, {"_id": 0}).to_list(100)
    
    result = []
    total_sks = 0
    total_bobot = 0
    
    for krs in krs_list:
        nilai = await db.nilai.find_one({"krs_id": krs["id"]}, {"_id": 0})
        kelas = await db.kelas.find_one({"id": krs["kelas_id"]}, {"_id": 0})
        
        if kelas:
            mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
            if mk:
                sks = mk.get("sks_teori", 0) + mk.get("sks_praktik", 0)
                bobot = nilai.get("bobot", 0) if nilai else 0
                
                total_sks += sks
                total_bobot += (sks * bobot)
                
                result.append({
                    "kode_mk": mk["kode"],
                    "nama_mk": mk["nama"],
                    "sks": sks,
                    "nilai_huruf": nilai.get("nilai_huruf") if nilai else "-",
                    "bobot": bobot,
                    "mutu": round(sks * bobot, 2)
                })
    
    ips = round(total_bobot / total_sks, 2) if total_sks > 0 else 0
    
    return {
        "mahasiswa": {"nim": mhs["nim"], "nama": mhs["nama"]},
        "nilai": result,
        "total_sks": total_sks,
        "ips": ips
    }

@mahasiswa_router.get("/transkrip")
async def get_transkrip(current_user: dict = Depends(get_current_user)):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    krs_list = await db.krs.find(
        {"mahasiswa_id": mhs["id"], "status": "disetujui"},
        {"_id": 0}
    ).to_list(500)
    
    result = []
    total_sks = 0
    total_bobot = 0
    
    for krs in krs_list:
        nilai = await db.nilai.find_one({"krs_id": krs["id"]}, {"_id": 0})
        if not nilai:
            continue
            
        kelas = await db.kelas.find_one({"id": krs["kelas_id"]}, {"_id": 0})
        if not kelas:
            continue
            
        mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
        if not mk:
            continue
        
        sks = mk.get("sks_teori", 0) + mk.get("sks_praktik", 0)
        bobot = nilai.get("bobot", 0)
        
        total_sks += sks
        total_bobot += (sks * bobot)
        
        result.append({
            "kode_mk": mk["kode"],
            "nama_mk": mk["nama"],
            "sks": sks,
            "nilai_huruf": nilai.get("nilai_huruf", "-"),
            "semester": mk.get("semester", 0)
        })
    
    # Sort by semester
    result.sort(key=lambda x: x["semester"])
    
    ipk = round(total_bobot / total_sks, 2) if total_sks > 0 else 0
    
    prodi = await db.prodi.find_one({"id": mhs["prodi_id"]}, {"_id": 0})
    
    return {
        "mahasiswa": {
            "nim": mhs["nim"],
            "nama": mhs["nama"],
            "prodi": prodi["nama"] if prodi else None,
            "tahun_masuk": mhs["tahun_masuk"]
        },
        "nilai": result,
        "total_sks": total_sks,
        "ipk": ipk
    }

# ==================== DASHBOARD ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_mhs = await db.mahasiswa.count_documents({})
    mhs_aktif = await db.mahasiswa.count_documents({"status": "aktif"})
    total_dosen = await db.dosen.count_documents({})
    total_prodi = await db.prodi.count_documents({})
    total_mk = await db.mata_kuliah.count_documents({})
    
    ta = await db.tahun_akademik.find_one({"is_active": True}, {"_id": 0})
    ta_aktif = f"{ta['tahun']} - {ta['semester']}" if ta else None
    
    return DashboardStats(
        total_mahasiswa=total_mhs,
        total_dosen=total_dosen,
        total_prodi=total_prodi,
        total_mata_kuliah=total_mk,
        mahasiswa_aktif=mhs_aktif,
        tahun_akademik_aktif=ta_aktif
    )

@api_router.get("/")
async def root():
    return {"message": "SIAKAD API v1.0.0"}

# ==================== USERS MANAGEMENT ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(500)
    return [UserResponse(**u) for u in users]

@api_router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": new_status}})
    
    return {"message": f"User {'diaktifkan' if new_status else 'dinonaktifkan'}"}

# ==================== JADWAL KULIAH (SCHEDULE MANAGEMENT) ====================

def parse_time(time_str: str) -> int:
    """Convert HH:MM to minutes from midnight for comparison"""
    h, m = map(int, time_str.split(':'))
    return h * 60 + m

def check_time_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    """Check if two time ranges overlap"""
    s1, e1 = parse_time(start1), parse_time(end1)
    s2, e2 = parse_time(start2), parse_time(end2)
    return s1 < e2 and s2 < e1

@akademik_router.post("/jadwal", response_model=KelasJadwalResponse)
async def create_jadwal_kelas(
    data: KelasJadwalCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Check for conflicts
    conflicts = []
    
    # 1. Check room conflict (same room, same day, overlapping time)
    if data.ruangan:
        room_conflict = await db.kelas.find_one({
            "ruangan": data.ruangan,
            "hari": data.hari,
            "tahun_akademik_id": data.tahun_akademik_id,
        }, {"_id": 0})
        
        if room_conflict and check_time_overlap(
            data.jam_mulai, data.jam_selesai,
            room_conflict.get("jam_mulai", "00:00"),
            room_conflict.get("jam_selesai", "00:00")
        ):
            conflicts.append(f"Ruangan {data.ruangan} sudah digunakan pada {data.hari} {room_conflict['jam_mulai']}-{room_conflict['jam_selesai']}")
    
    # 2. Check dosen conflict (same dosen, same day, overlapping time)
    dosen_conflict = await db.kelas.find_one({
        "dosen_id": data.dosen_id,
        "hari": data.hari,
        "tahun_akademik_id": data.tahun_akademik_id,
    }, {"_id": 0})
    
    if dosen_conflict and check_time_overlap(
        data.jam_mulai, data.jam_selesai,
        dosen_conflict.get("jam_mulai", "00:00"),
        dosen_conflict.get("jam_selesai", "00:00")
    ):
        dosen = await db.dosen.find_one({"id": data.dosen_id}, {"_id": 0})
        dosen_nama = dosen["nama"] if dosen else "Dosen"
        conflicts.append(f"{dosen_nama} sudah mengajar pada {data.hari} {dosen_conflict['jam_mulai']}-{dosen_conflict['jam_selesai']}")
    
    if conflicts:
        raise HTTPException(status_code=400, detail={"message": "Terdapat konflik jadwal", "conflicts": conflicts})
    
    # Create kelas with jadwal
    kelas_id = str(uuid.uuid4())
    jadwal_str = f"{data.hari} {data.jam_mulai}-{data.jam_selesai}"
    
    doc = {
        "id": kelas_id,
        "kode_kelas": data.kode_kelas,
        "mata_kuliah_id": data.mata_kuliah_id,
        "dosen_id": data.dosen_id,
        "tahun_akademik_id": data.tahun_akademik_id,
        "kuota": data.kuota,
        "hari": data.hari,
        "jam_mulai": data.jam_mulai,
        "jam_selesai": data.jam_selesai,
        "ruangan": data.ruangan,
        "jadwal": jadwal_str,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.kelas.insert_one(doc)
    
    mk = await db.mata_kuliah.find_one({"id": data.mata_kuliah_id}, {"_id": 0})
    dosen = await db.dosen.find_one({"id": data.dosen_id}, {"_id": 0})
    
    return KelasJadwalResponse(
        **doc,
        mata_kuliah_nama=mk["nama"] if mk else None,
        dosen_nama=dosen["nama"] if dosen else None,
        jumlah_peserta=0
    )

@akademik_router.put("/jadwal/{item_id}", response_model=KelasJadwalResponse)
async def update_jadwal_kelas(
    item_id: str,
    data: KelasJadwalCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    existing = await db.kelas.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    
    # Check for conflicts (excluding current kelas)
    conflicts = []
    
    # Room conflict
    if data.ruangan:
        room_conflict = await db.kelas.find_one({
            "ruangan": data.ruangan,
            "hari": data.hari,
            "tahun_akademik_id": data.tahun_akademik_id,
            "id": {"$ne": item_id}
        }, {"_id": 0})
        
        if room_conflict and check_time_overlap(
            data.jam_mulai, data.jam_selesai,
            room_conflict.get("jam_mulai", "00:00"),
            room_conflict.get("jam_selesai", "00:00")
        ):
            conflicts.append(f"Ruangan {data.ruangan} sudah digunakan")
    
    # Dosen conflict
    dosen_conflict = await db.kelas.find_one({
        "dosen_id": data.dosen_id,
        "hari": data.hari,
        "tahun_akademik_id": data.tahun_akademik_id,
        "id": {"$ne": item_id}
    }, {"_id": 0})
    
    if dosen_conflict and check_time_overlap(
        data.jam_mulai, data.jam_selesai,
        dosen_conflict.get("jam_mulai", "00:00"),
        dosen_conflict.get("jam_selesai", "00:00")
    ):
        conflicts.append("Dosen sudah mengajar pada waktu tersebut")
    
    if conflicts:
        raise HTTPException(status_code=400, detail={"message": "Terdapat konflik jadwal", "conflicts": conflicts})
    
    jadwal_str = f"{data.hari} {data.jam_mulai}-{data.jam_selesai}"
    
    update_data = {
        "kode_kelas": data.kode_kelas,
        "mata_kuliah_id": data.mata_kuliah_id,
        "dosen_id": data.dosen_id,
        "tahun_akademik_id": data.tahun_akademik_id,
        "kuota": data.kuota,
        "hari": data.hari,
        "jam_mulai": data.jam_mulai,
        "jam_selesai": data.jam_selesai,
        "ruangan": data.ruangan,
        "jadwal": jadwal_str,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.kelas.update_one({"id": item_id}, {"$set": update_data})
    
    mk = await db.mata_kuliah.find_one({"id": data.mata_kuliah_id}, {"_id": 0})
    dosen = await db.dosen.find_one({"id": data.dosen_id}, {"_id": 0})
    krs_count = await db.krs.count_documents({"kelas_id": item_id, "status": "disetujui"})
    
    return KelasJadwalResponse(
        id=item_id,
        **update_data,
        mata_kuliah_nama=mk["nama"] if mk else None,
        dosen_nama=dosen["nama"] if dosen else None,
        jumlah_peserta=krs_count
    )

@akademik_router.get("/jadwal", response_model=List[KelasJadwalResponse])
async def get_all_jadwal(
    tahun_akademik_id: Optional[str] = None,
    hari: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    if hari:
        query["hari"] = hari
    
    items = await db.kelas.find(query, {"_id": 0}).to_list(500)
    
    result = []
    for item in items:
        mk = await db.mata_kuliah.find_one({"id": item["mata_kuliah_id"]}, {"_id": 0})
        dosen = await db.dosen.find_one({"id": item["dosen_id"]}, {"_id": 0})
        krs_count = await db.krs.count_documents({"kelas_id": item["id"], "status": "disetujui"})
        
        result.append(KelasJadwalResponse(
            id=item["id"],
            kode_kelas=item["kode_kelas"],
            mata_kuliah_id=item["mata_kuliah_id"],
            mata_kuliah_nama=mk["nama"] if mk else None,
            dosen_id=item["dosen_id"],
            dosen_nama=dosen["nama"] if dosen else None,
            tahun_akademik_id=item["tahun_akademik_id"],
            kuota=item.get("kuota", 40),
            hari=item.get("hari", ""),
            jam_mulai=item.get("jam_mulai", ""),
            jam_selesai=item.get("jam_selesai", ""),
            ruangan=item.get("ruangan"),
            jumlah_peserta=krs_count
        ))
    
    return result

@akademik_router.get("/jadwal/check-conflict")
async def check_jadwal_conflict(
    hari: str,
    jam_mulai: str,
    jam_selesai: str,
    tahun_akademik_id: str,
    dosen_id: Optional[str] = None,
    ruangan: Optional[str] = None,
    exclude_kelas_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    conflicts = []
    
    # Check room conflict
    if ruangan:
        room_query = {
            "ruangan": ruangan,
            "hari": hari,
            "tahun_akademik_id": tahun_akademik_id
        }
        if exclude_kelas_id:
            room_query["id"] = {"$ne": exclude_kelas_id}
        
        room_conflicts = await db.kelas.find(room_query, {"_id": 0}).to_list(100)
        for rc in room_conflicts:
            if check_time_overlap(jam_mulai, jam_selesai, rc.get("jam_mulai", "00:00"), rc.get("jam_selesai", "00:00")):
                mk = await db.mata_kuliah.find_one({"id": rc["mata_kuliah_id"]}, {"_id": 0})
                conflicts.append({
                    "type": "room",
                    "message": f"Ruangan {ruangan} digunakan untuk {mk['nama'] if mk else rc['kode_kelas']} ({rc['jam_mulai']}-{rc['jam_selesai']})"
                })
    
    # Check dosen conflict
    if dosen_id:
        dosen_query = {
            "dosen_id": dosen_id,
            "hari": hari,
            "tahun_akademik_id": tahun_akademik_id
        }
        if exclude_kelas_id:
            dosen_query["id"] = {"$ne": exclude_kelas_id}
        
        dosen_conflicts = await db.kelas.find(dosen_query, {"_id": 0}).to_list(100)
        for dc in dosen_conflicts:
            if check_time_overlap(jam_mulai, jam_selesai, dc.get("jam_mulai", "00:00"), dc.get("jam_selesai", "00:00")):
                mk = await db.mata_kuliah.find_one({"id": dc["mata_kuliah_id"]}, {"_id": 0})
                conflicts.append({
                    "type": "dosen",
                    "message": f"Dosen mengajar {mk['nama'] if mk else dc['kode_kelas']} ({dc['jam_mulai']}-{dc['jam_selesai']})"
                })
    
    return {"has_conflict": len(conflicts) > 0, "conflicts": conflicts}

# Mahasiswa jadwal view
@mahasiswa_router.get("/jadwal")
async def get_my_jadwal(
    tahun_akademik_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    query = {"mahasiswa_id": mhs["id"], "status": "disetujui"}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    
    krs_list = await db.krs.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for krs in krs_list:
        kelas = await db.kelas.find_one({"id": krs["kelas_id"]}, {"_id": 0})
        if kelas:
            mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
            dosen = await db.dosen.find_one({"id": kelas["dosen_id"]}, {"_id": 0})
            
            result.append({
                "kelas_id": kelas["id"],
                "kode_kelas": kelas["kode_kelas"],
                "mata_kuliah_nama": mk["nama"] if mk else None,
                "dosen_nama": dosen["nama"] if dosen else None,
                "hari": kelas.get("hari", ""),
                "jam_mulai": kelas.get("jam_mulai", ""),
                "jam_selesai": kelas.get("jam_selesai", ""),
                "ruangan": kelas.get("ruangan"),
                "jadwal": kelas.get("jadwal")
            })
    
    # Sort by day order
    day_order = {"Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6, "Minggu": 7}
    result.sort(key=lambda x: (day_order.get(x["hari"], 8), x["jam_mulai"]))
    
    return result

# ==================== PRESENSI (ATTENDANCE) ====================

@dosen_router.post("/presensi")
async def create_presensi(
    data: PresensiCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "dosen"]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Check if presensi already exists
    existing = await db.presensi.find_one({
        "kelas_id": data.kelas_id,
        "pertemuan_ke": data.pertemuan_ke
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Presensi untuk pertemuan ini sudah ada")
    
    presensi_id = str(uuid.uuid4())
    doc = {
        "id": presensi_id,
        "kelas_id": data.kelas_id,
        "pertemuan_ke": data.pertemuan_ke,
        "tanggal": data.tanggal,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    
    await db.presensi.insert_one(doc)
    
    return PresensiResponse(**doc)

@dosen_router.get("/presensi/{kelas_id}")
async def get_presensi_list(
    kelas_id: str,
    current_user: dict = Depends(get_current_user)
):
    presensi_list = await db.presensi.find(
        {"kelas_id": kelas_id},
        {"_id": 0}
    ).sort("pertemuan_ke", 1).to_list(100)
    
    return presensi_list

@dosen_router.post("/presensi/{presensi_id}/detail")
async def save_presensi_detail(
    presensi_id: str,
    details: List[PresensiDetailCreate],
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "dosen"]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    presensi = await db.presensi.find_one({"id": presensi_id}, {"_id": 0})
    if not presensi:
        raise HTTPException(status_code=404, detail="Presensi tidak ditemukan")
    
    # Delete existing details for this presensi
    await db.presensi_detail.delete_many({"presensi_id": presensi_id})
    
    # Insert new details
    for detail in details:
        doc = {
            "id": str(uuid.uuid4()),
            "presensi_id": presensi_id,
            "mahasiswa_id": detail.mahasiswa_id,
            "status": detail.status,
            "keterangan": detail.keterangan,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.presensi_detail.insert_one(doc)
    
    return {"message": f"Presensi {len(details)} mahasiswa berhasil disimpan"}

@dosen_router.get("/presensi/{presensi_id}/detail")
async def get_presensi_detail(
    presensi_id: str,
    current_user: dict = Depends(get_current_user)
):
    presensi = await db.presensi.find_one({"id": presensi_id}, {"_id": 0})
    if not presensi:
        raise HTTPException(status_code=404, detail="Presensi tidak ditemukan")
    
    # Get all mahasiswa enrolled in this class
    krs_list = await db.krs.find(
        {"kelas_id": presensi["kelas_id"], "status": "disetujui"},
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for krs in krs_list:
        mhs = await db.mahasiswa.find_one({"id": krs["mahasiswa_id"]}, {"_id": 0})
        if mhs:
            # Check if detail exists
            detail = await db.presensi_detail.find_one({
                "presensi_id": presensi_id,
                "mahasiswa_id": mhs["id"]
            }, {"_id": 0})
            
            result.append({
                "mahasiswa_id": mhs["id"],
                "mahasiswa_nama": mhs["nama"],
                "mahasiswa_nim": mhs["nim"],
                "status": detail["status"] if detail else "hadir",
                "keterangan": detail.get("keterangan") if detail else None,
                "has_record": detail is not None
            })
    
    # Sort by NIM
    result.sort(key=lambda x: x["mahasiswa_nim"])
    
    return result

@dosen_router.get("/presensi/{kelas_id}/rekap")
async def get_rekap_presensi(
    kelas_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Get all presensi for this class
    presensi_list = await db.presensi.find({"kelas_id": kelas_id}, {"_id": 0}).to_list(100)
    total_pertemuan = len(presensi_list)
    presensi_ids = [p["id"] for p in presensi_list]
    
    # Get all mahasiswa enrolled
    krs_list = await db.krs.find(
        {"kelas_id": kelas_id, "status": "disetujui"},
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for krs in krs_list:
        mhs = await db.mahasiswa.find_one({"id": krs["mahasiswa_id"]}, {"_id": 0})
        if mhs:
            # Count attendance by status
            hadir = await db.presensi_detail.count_documents({
                "presensi_id": {"$in": presensi_ids},
                "mahasiswa_id": mhs["id"],
                "status": "hadir"
            })
            izin = await db.presensi_detail.count_documents({
                "presensi_id": {"$in": presensi_ids},
                "mahasiswa_id": mhs["id"],
                "status": "izin"
            })
            sakit = await db.presensi_detail.count_documents({
                "presensi_id": {"$in": presensi_ids},
                "mahasiswa_id": mhs["id"],
                "status": "sakit"
            })
            alpha = await db.presensi_detail.count_documents({
                "presensi_id": {"$in": presensi_ids},
                "mahasiswa_id": mhs["id"],
                "status": "alpha"
            })
            
            persentase = (hadir / total_pertemuan * 100) if total_pertemuan > 0 else 0
            
            result.append(RekapPresensiResponse(
                mahasiswa_id=mhs["id"],
                mahasiswa_nama=mhs["nama"],
                mahasiswa_nim=mhs["nim"],
                hadir=hadir,
                izin=izin,
                sakit=sakit,
                alpha=alpha,
                total_pertemuan=total_pertemuan,
                persentase_kehadiran=round(persentase, 1)
            ))
    
    # Sort by NIM
    result.sort(key=lambda x: x.mahasiswa_nim)
    
    return result

# Mahasiswa view presensi
@mahasiswa_router.get("/presensi")
async def get_my_presensi(
    kelas_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    # Get my presensi details
    query = {"mahasiswa_id": mhs["id"]}
    
    details = await db.presensi_detail.find(query, {"_id": 0}).to_list(500)
    
    result = []
    for detail in details:
        presensi = await db.presensi.find_one({"id": detail["presensi_id"]}, {"_id": 0})
        if presensi:
            if kelas_id and presensi["kelas_id"] != kelas_id:
                continue
            
            kelas = await db.kelas.find_one({"id": presensi["kelas_id"]}, {"_id": 0})
            mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0}) if kelas else None
            
            result.append({
                "presensi_id": presensi["id"],
                "kelas_id": presensi["kelas_id"],
                "mata_kuliah_nama": mk["nama"] if mk else None,
                "pertemuan_ke": presensi["pertemuan_ke"],
                "tanggal": presensi["tanggal"],
                "status": detail["status"],
                "keterangan": detail.get("keterangan")
            })
    
    # Sort by tanggal descending
    result.sort(key=lambda x: x["tanggal"], reverse=True)
    
    return result

@mahasiswa_router.get("/presensi/rekap")
async def get_my_presensi_rekap(
    tahun_akademik_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    # Get my KRS
    krs_query = {"mahasiswa_id": mhs["id"], "status": "disetujui"}
    if tahun_akademik_id:
        krs_query["tahun_akademik_id"] = tahun_akademik_id
    
    krs_list = await db.krs.find(krs_query, {"_id": 0}).to_list(100)
    
    result = []
    for krs in krs_list:
        kelas = await db.kelas.find_one({"id": krs["kelas_id"]}, {"_id": 0})
        if kelas:
            mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
            
            # Get presensi for this class
            presensi_list = await db.presensi.find({"kelas_id": kelas["id"]}, {"_id": 0}).to_list(100)
            presensi_ids = [p["id"] for p in presensi_list]
            total_pertemuan = len(presensi_list)
            
            # Count attendance
            hadir = await db.presensi_detail.count_documents({
                "presensi_id": {"$in": presensi_ids},
                "mahasiswa_id": mhs["id"],
                "status": "hadir"
            })
            izin = await db.presensi_detail.count_documents({
                "presensi_id": {"$in": presensi_ids},
                "mahasiswa_id": mhs["id"],
                "status": "izin"
            })
            sakit = await db.presensi_detail.count_documents({
                "presensi_id": {"$in": presensi_ids},
                "mahasiswa_id": mhs["id"],
                "status": "sakit"
            })
            alpha = await db.presensi_detail.count_documents({
                "presensi_id": {"$in": presensi_ids},
                "mahasiswa_id": mhs["id"],
                "status": "alpha"
            })
            
            persentase = (hadir / total_pertemuan * 100) if total_pertemuan > 0 else 0
            
            result.append({
                "kelas_id": kelas["id"],
                "mata_kuliah_nama": mk["nama"] if mk else None,
                "hadir": hadir,
                "izin": izin,
                "sakit": sakit,
                "alpha": alpha,
                "total_pertemuan": total_pertemuan,
                "persentase_kehadiran": round(persentase, 1)
            })
    
    return result

# ==================== PASSWORD RESET ====================

@auth_router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "Jika email terdaftar, link reset password akan dikirim"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    await db.password_resets.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "email": data.email,
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # In production, send email here. For now, return token for testing
    # NOTE: In real app, don't return token in response - send via email
    return {
        "message": "Token reset password telah dibuat",
        "reset_token": reset_token,  # Remove this in production
        "expires_in": "24 jam"
    }

@auth_router.post("/reset-password")
async def reset_password(data: PasswordResetVerify):
    reset_record = await db.password_resets.find_one({
        "token": data.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Token tidak valid atau sudah digunakan")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token sudah kadaluarsa")
    
    # Update password
    hashed = hash_password(data.new_password)
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password": hashed, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Password berhasil direset"}

@auth_router.get("/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    reset_record = await db.password_resets.find_one({
        "token": token,
        "used": False
    }, {"_id": 0})
    
    if not reset_record:
        return {"valid": False, "message": "Token tidak valid atau sudah digunakan"}
    
    expires_at = datetime.fromisoformat(reset_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        return {"valid": False, "message": "Token sudah kadaluarsa"}
    
    user = await db.users.find_one({"id": reset_record["user_id"]}, {"_id": 0, "password": 0})
    
    return {
        "valid": True,
        "email": reset_record["email"],
        "user_name": user["nama"] if user else None
    }

# Admin generate new random password for user
@api_router.post("/users/{user_id}/generate-new-password")
async def admin_generate_new_password(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    import random
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    # Generate random 8-digit numeric password
    new_password = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    
    # Hash and update password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password": hashed_password}}
    )
    
    return {
        "message": f"Password untuk {user['email']} berhasil direset",
        "new_password": new_password,
        "user_email": user["email"],
        "user_name": user.get("nama", user["email"])
    }

# ==================== KEUANGAN (FINANCE) ENDPOINTS ====================

# ----- Kategori UKT -----
@keuangan_router.get("/kategori-ukt", response_model=List[KategoriUKTResponse])
async def get_kategori_ukt(current_user: dict = Depends(get_current_user)):
    items = await db.kategori_ukt.find({}, {"_id": 0}).sort("nominal", 1).to_list(100)
    return items

@keuangan_router.post("/kategori-ukt", response_model=KategoriUKTResponse)
async def create_kategori_ukt(
    data: KategoriUKTCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    existing = await db.kategori_ukt.find_one({"kode": data.kode})
    if existing:
        raise HTTPException(status_code=400, detail="Kode kategori sudah ada")
    
    doc = {
        "id": str(uuid.uuid4()),
        **data.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kategori_ukt.insert_one(doc)
    return KategoriUKTResponse(**doc)

@keuangan_router.put("/kategori-ukt/{item_id}", response_model=KategoriUKTResponse)
async def update_kategori_ukt(
    item_id: str,
    data: KategoriUKTCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    existing = await db.kategori_ukt.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    
    await db.kategori_ukt.update_one(
        {"id": item_id},
        {"$set": {**data.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.kategori_ukt.find_one({"id": item_id}, {"_id": 0})
    return KategoriUKTResponse(**updated)

@keuangan_router.delete("/kategori-ukt/{item_id}")
async def delete_kategori_ukt(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Check if used in tagihan
    used = await db.tagihan_ukt.find_one({"kategori_ukt_id": item_id})
    if used:
        raise HTTPException(status_code=400, detail="Kategori masih digunakan dalam tagihan")
    
    await db.kategori_ukt.delete_one({"id": item_id})
    return {"message": "Kategori UKT berhasil dihapus"}

# ----- Tagihan UKT -----
@keuangan_router.get("/tagihan", response_model=List[TagihanUKTResponse])
async def get_all_tagihan(
    tahun_akademik_id: Optional[str] = None,
    status: Optional[str] = None,
    prodi_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Build query
    pipeline = []
    match_stage = {}
    
    if tahun_akademik_id:
        match_stage["tahun_akademik_id"] = tahun_akademik_id
    if status:
        match_stage["status"] = status
    
    if match_stage:
        pipeline.append({"$match": match_stage})
    
    # Get tagihan
    items = await db.tagihan_ukt.find(match_stage if match_stage else {}, {"_id": 0}).to_list(1000)
    
    result = []
    for item in items:
        mhs = await db.mahasiswa.find_one({"id": item["mahasiswa_id"]}, {"_id": 0})
        
        # Filter by prodi if specified
        if prodi_id and mhs and mhs.get("prodi_id") != prodi_id:
            continue
        
        ta = await db.tahun_akademik.find_one({"id": item["tahun_akademik_id"]}, {"_id": 0})
        kategori = await db.kategori_ukt.find_one({"id": item["kategori_ukt_id"]}, {"_id": 0})
        prodi = await db.prodi.find_one({"id": mhs.get("prodi_id")}, {"_id": 0}) if mhs else None
        
        # Calculate total paid
        pembayaran = await db.pembayaran_ukt.find(
            {"tagihan_id": item["id"], "status": "verified"},
            {"_id": 0}
        ).to_list(100)
        total_dibayar = sum(p["nominal"] for p in pembayaran)
        
        result.append(TagihanUKTResponse(
            **item,
            mahasiswa_nim=mhs["nim"] if mhs else None,
            mahasiswa_nama=mhs["nama"] if mhs else None,
            prodi_nama=prodi["nama"] if prodi else None,
            tahun_akademik_label=f"{ta['tahun']} - {ta['semester']}" if ta else None,
            kategori_nama=kategori["nama"] if kategori else None,
            total_dibayar=total_dibayar,
            sisa_tagihan=item["nominal"] - total_dibayar
        ))
    
    return result

@keuangan_router.post("/tagihan", response_model=TagihanUKTResponse)
async def create_tagihan(
    data: TagihanUKTCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Check if tagihan already exists for this mahasiswa and tahun akademik
    existing = await db.tagihan_ukt.find_one({
        "mahasiswa_id": data.mahasiswa_id,
        "tahun_akademik_id": data.tahun_akademik_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Tagihan untuk mahasiswa ini sudah ada")
    
    # Get kategori for nominal
    kategori = await db.kategori_ukt.find_one({"id": data.kategori_ukt_id}, {"_id": 0})
    if not kategori:
        raise HTTPException(status_code=404, detail="Kategori UKT tidak ditemukan")
    
    doc = {
        "id": str(uuid.uuid4()),
        "mahasiswa_id": data.mahasiswa_id,
        "tahun_akademik_id": data.tahun_akademik_id,
        "kategori_ukt_id": data.kategori_ukt_id,
        "nominal": kategori["nominal"],
        "status": "belum_bayar",
        "jatuh_tempo": data.jatuh_tempo,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tagihan_ukt.insert_one(doc)
    
    mhs = await db.mahasiswa.find_one({"id": data.mahasiswa_id}, {"_id": 0})
    ta = await db.tahun_akademik.find_one({"id": data.tahun_akademik_id}, {"_id": 0})
    prodi = await db.prodi.find_one({"id": mhs.get("prodi_id")}, {"_id": 0}) if mhs else None
    
    return TagihanUKTResponse(
        **doc,
        mahasiswa_nim=mhs["nim"] if mhs else None,
        mahasiswa_nama=mhs["nama"] if mhs else None,
        prodi_nama=prodi["nama"] if prodi else None,
        tahun_akademik_label=f"{ta['tahun']} - {ta['semester']}" if ta else None,
        kategori_nama=kategori["nama"],
        total_dibayar=0,
        sisa_tagihan=kategori["nominal"]
    )

@keuangan_router.post("/tagihan/batch")
async def create_tagihan_batch(
    data: TagihanUKTBatchCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Get all active mahasiswa
    mhs_query = {"status": "aktif"}
    if data.prodi_id:
        mhs_query["prodi_id"] = data.prodi_id
    
    mahasiswa_list = await db.mahasiswa.find(mhs_query, {"_id": 0}).to_list(5000)
    
    created_count = 0
    skipped_count = 0
    
    for mhs in mahasiswa_list:
        # Check if tagihan already exists
        existing = await db.tagihan_ukt.find_one({
            "mahasiswa_id": mhs["id"],
            "tahun_akademik_id": data.tahun_akademik_id
        })
        
        if existing:
            skipped_count += 1
            continue
        
        # Get mahasiswa's kategori UKT (default to first if not set)
        kategori_id = mhs.get("kategori_ukt_id")
        if not kategori_id:
            # Get default kategori (first one)
            default_kat = await db.kategori_ukt.find_one({}, {"_id": 0}, sort=[("nominal", 1)])
            if default_kat:
                kategori_id = default_kat["id"]
        
        if not kategori_id:
            continue
        
        kategori = await db.kategori_ukt.find_one({"id": kategori_id}, {"_id": 0})
        if not kategori:
            continue
        
        doc = {
            "id": str(uuid.uuid4()),
            "mahasiswa_id": mhs["id"],
            "tahun_akademik_id": data.tahun_akademik_id,
            "kategori_ukt_id": kategori_id,
            "nominal": kategori["nominal"],
            "status": "belum_bayar",
            "jatuh_tempo": data.jatuh_tempo,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.tagihan_ukt.insert_one(doc)
        created_count += 1
    
    return {
        "message": f"Tagihan batch berhasil dibuat",
        "created": created_count,
        "skipped": skipped_count,
        "total_mahasiswa": len(mahasiswa_list)
    }

@keuangan_router.put("/tagihan/{item_id}/kategori")
async def update_tagihan_kategori(
    item_id: str,
    kategori_ukt_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    tagihan = await db.tagihan_ukt.find_one({"id": item_id}, {"_id": 0})
    if not tagihan:
        raise HTTPException(status_code=404, detail="Tagihan tidak ditemukan")
    
    kategori = await db.kategori_ukt.find_one({"id": kategori_ukt_id}, {"_id": 0})
    if not kategori:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    
    # Calculate total paid
    pembayaran = await db.pembayaran_ukt.find(
        {"tagihan_id": item_id, "status": "verified"},
        {"_id": 0}
    ).to_list(100)
    total_dibayar = sum(p["nominal"] for p in pembayaran)
    
    # Update status based on payment
    new_status = "belum_bayar"
    if total_dibayar >= kategori["nominal"]:
        new_status = "lunas"
    elif total_dibayar > 0:
        new_status = "cicilan"
    
    await db.tagihan_ukt.update_one(
        {"id": item_id},
        {"$set": {
            "kategori_ukt_id": kategori_ukt_id,
            "nominal": kategori["nominal"],
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Kategori tagihan berhasil diubah"}

@keuangan_router.delete("/tagihan/{item_id}")
async def delete_tagihan(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Check if has payments
    payments = await db.pembayaran_ukt.find_one({"tagihan_id": item_id})
    if payments:
        raise HTTPException(status_code=400, detail="Tagihan sudah memiliki pembayaran, tidak bisa dihapus")
    
    await db.tagihan_ukt.delete_one({"id": item_id})
    return {"message": "Tagihan berhasil dihapus"}

# ----- Pembayaran UKT -----
@keuangan_router.get("/pembayaran", response_model=List[PembayaranUKTResponse])
async def get_all_pembayaran(
    tahun_akademik_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    query = {}
    if status:
        query["status"] = status
    
    items = await db.pembayaran_ukt.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    result = []
    for item in items:
        tagihan = await db.tagihan_ukt.find_one({"id": item["tagihan_id"]}, {"_id": 0})
        
        # Filter by tahun_akademik_id if specified
        if tahun_akademik_id and tagihan and tagihan.get("tahun_akademik_id") != tahun_akademik_id:
            continue
        
        mhs = None
        if tagihan:
            mhs = await db.mahasiswa.find_one({"id": tagihan["mahasiswa_id"]}, {"_id": 0})
        
        result.append(PembayaranUKTResponse(
            **item,
            mahasiswa_nama=mhs["nama"] if mhs else None,
            mahasiswa_nim=mhs["nim"] if mhs else None
        ))
    
    return result

@keuangan_router.post("/pembayaran", response_model=PembayaranUKTResponse)
async def create_pembayaran(
    data: PembayaranUKTCreate,
    current_user: dict = Depends(get_current_user)
):
    tagihan = await db.tagihan_ukt.find_one({"id": data.tagihan_id}, {"_id": 0})
    if not tagihan:
        raise HTTPException(status_code=404, detail="Tagihan tidak ditemukan")
    
    # Check if user is admin or owner
    if current_user["role"] != "admin":
        mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not mhs or mhs["id"] != tagihan["mahasiswa_id"]:
            raise HTTPException(status_code=403, detail="Akses ditolak")
    
    doc = {
        "id": str(uuid.uuid4()),
        **data.dict(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pembayaran_ukt.insert_one(doc)
    
    mhs = await db.mahasiswa.find_one({"id": tagihan["mahasiswa_id"]}, {"_id": 0})
    
    return PembayaranUKTResponse(
        **doc,
        mahasiswa_nama=mhs["nama"] if mhs else None,
        mahasiswa_nim=mhs["nim"] if mhs else None
    )

@keuangan_router.put("/pembayaran/{item_id}/verify")
async def verify_pembayaran(
    item_id: str,
    data: PembayaranUKTVerify,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    pembayaran = await db.pembayaran_ukt.find_one({"id": item_id}, {"_id": 0})
    if not pembayaran:
        raise HTTPException(status_code=404, detail="Pembayaran tidak ditemukan")
    
    await db.pembayaran_ukt.update_one(
        {"id": item_id},
        {"$set": {
            "status": data.status,
            "catatan_verifikasi": data.catatan,
            "verified_by": current_user["id"],
            "verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # If verified, update tagihan status
    if data.status == "verified":
        tagihan = await db.tagihan_ukt.find_one({"id": pembayaran["tagihan_id"]}, {"_id": 0})
        if tagihan:
            # Calculate total verified payments
            pembayaran_list = await db.pembayaran_ukt.find(
                {"tagihan_id": tagihan["id"], "status": "verified"},
                {"_id": 0}
            ).to_list(100)
            total_dibayar = sum(p["nominal"] for p in pembayaran_list) + pembayaran["nominal"]
            
            # Update status
            new_status = "cicilan"
            if total_dibayar >= tagihan["nominal"]:
                new_status = "lunas"
            
            await db.tagihan_ukt.update_one(
                {"id": tagihan["id"]},
                {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    return {"message": f"Pembayaran berhasil di{data.status}"}

# ----- Mahasiswa Keuangan -----
@mahasiswa_router.get("/keuangan/tagihan")
async def get_my_tagihan(
    tahun_akademik_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    query = {"mahasiswa_id": mhs["id"]}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    
    items = await db.tagihan_ukt.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for item in items:
        ta = await db.tahun_akademik.find_one({"id": item["tahun_akademik_id"]}, {"_id": 0})
        kategori = await db.kategori_ukt.find_one({"id": item["kategori_ukt_id"]}, {"_id": 0})
        
        # Calculate total paid
        pembayaran = await db.pembayaran_ukt.find(
            {"tagihan_id": item["id"], "status": "verified"},
            {"_id": 0}
        ).to_list(100)
        total_dibayar = sum(p["nominal"] for p in pembayaran)
        
        result.append({
            **item,
            "tahun_akademik_label": f"{ta['tahun']} - {ta['semester']}" if ta else None,
            "kategori_nama": kategori["nama"] if kategori else None,
            "total_dibayar": total_dibayar,
            "sisa_tagihan": item["nominal"] - total_dibayar
        })
    
    return result

@mahasiswa_router.get("/keuangan/pembayaran")
async def get_my_pembayaran(
    tagihan_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    # Get my tagihan IDs
    tagihan_query = {"mahasiswa_id": mhs["id"]}
    if tagihan_id:
        tagihan_query["id"] = tagihan_id
    
    tagihan_list = await db.tagihan_ukt.find(tagihan_query, {"_id": 0}).to_list(100)
    tagihan_ids = [t["id"] for t in tagihan_list]
    
    items = await db.pembayaran_ukt.find(
        {"tagihan_id": {"$in": tagihan_ids}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    
    return items

@mahasiswa_router.post("/keuangan/pembayaran", response_model=PembayaranUKTResponse)
async def create_my_pembayaran(
    data: PembayaranUKTCreate,
    current_user: dict = Depends(get_current_user)
):
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    # Verify tagihan belongs to this mahasiswa
    tagihan = await db.tagihan_ukt.find_one({
        "id": data.tagihan_id,
        "mahasiswa_id": mhs["id"]
    }, {"_id": 0})
    
    if not tagihan:
        raise HTTPException(status_code=404, detail="Tagihan tidak ditemukan")
    
    doc = {
        "id": str(uuid.uuid4()),
        **data.dict(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pembayaran_ukt.insert_one(doc)
    
    return PembayaranUKTResponse(
        **doc,
        mahasiswa_nama=mhs["nama"],
        mahasiswa_nim=mhs["nim"]
    )

# ----- Rekap Keuangan -----
@keuangan_router.get("/rekap", response_model=RekapKeuanganResponse)
async def get_rekap_keuangan(
    tahun_akademik_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    query = {}
    if tahun_akademik_id:
        query["tahun_akademik_id"] = tahun_akademik_id
    
    tagihan_list = await db.tagihan_ukt.find(query, {"_id": 0}).to_list(10000)
    
    total_tagihan = sum(t["nominal"] for t in tagihan_list)
    
    # Calculate total verified payments
    tagihan_ids = [t["id"] for t in tagihan_list]
    pembayaran_list = await db.pembayaran_ukt.find(
        {"tagihan_id": {"$in": tagihan_ids}, "status": "verified"},
        {"_id": 0}
    ).to_list(50000)
    total_terbayar = sum(p["nominal"] for p in pembayaran_list)
    
    lunas_count = len([t for t in tagihan_list if t["status"] == "lunas"])
    cicilan_count = len([t for t in tagihan_list if t["status"] == "cicilan"])
    belum_bayar_count = len([t for t in tagihan_list if t["status"] == "belum_bayar"])
    
    return RekapKeuanganResponse(
        total_tagihan=total_tagihan,
        total_terbayar=total_terbayar,
        total_belum_bayar=total_tagihan - total_terbayar,
        jumlah_mahasiswa_lunas=lunas_count,
        jumlah_mahasiswa_cicilan=cicilan_count,
        jumlah_mahasiswa_belum_bayar=belum_bayar_count
    )

# ==================== BIODATA ENDPOINTS ====================

# ----- Helper: Save uploaded file -----
async def save_upload_file(file: UploadFile, mahasiswa_id: str, doc_type: str) -> str:
    """Save uploaded file and return the relative path"""
    # Create directory for mahasiswa
    mhs_dir = UPLOAD_DIR / mahasiswa_id
    mhs_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = mhs_dir / filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Return relative path for storage
    return f"/uploads/biodata/{mahasiswa_id}/{filename}"

# ----- Mahasiswa: Get My Biodata -----
@mahasiswa_router.get("/biodata")
async def get_my_biodata(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "mahasiswa":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    biodata = await db.biodata.find_one({"mahasiswa_id": mhs["id"]}, {"_id": 0})
    
    # Check for pending change request
    pending_request = await db.biodata_change_request.find_one(
        {"mahasiswa_id": mhs["id"], "status": "pending"},
        {"_id": 0}
    )
    
    return {
        "biodata": biodata,
        "has_pending_request": pending_request is not None,
        "pending_request": pending_request
    }

# ----- Mahasiswa: Create Initial Biodata -----
@mahasiswa_router.post("/biodata")
async def create_my_biodata(
    data: BiodataCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "mahasiswa":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    # Check if biodata already exists
    existing = await db.biodata.find_one({"mahasiswa_id": mhs["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Biodata sudah ada, gunakan fitur perubahan data")
    
    doc = {
        "id": str(uuid.uuid4()),
        "mahasiswa_id": mhs["id"],
        **data.dict(),
        "is_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.biodata.insert_one(doc)
    
    return {"message": "Biodata berhasil dibuat", "id": doc["id"]}

# ----- Mahasiswa: Create Change Request -----
@mahasiswa_router.post("/biodata/change-request")
async def create_biodata_change_request(
    data_baru: str = File(..., description="JSON string of changed data"),
    dokumen_ktp: UploadFile = File(...),
    dokumen_kk: UploadFile = File(...),
    dokumen_akte: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    import json
    
    if current_user["role"] != "mahasiswa":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    # Check for pending request
    pending = await db.biodata_change_request.find_one(
        {"mahasiswa_id": mhs["id"], "status": "pending"}
    )
    if pending:
        raise HTTPException(status_code=400, detail="Masih ada pengajuan yang belum diproses")
    
    # Get current biodata
    biodata = await db.biodata.find_one({"mahasiswa_id": mhs["id"]}, {"_id": 0})
    if not biodata:
        raise HTTPException(status_code=404, detail="Biodata belum ada, silakan isi biodata terlebih dahulu")
    
    # Parse changed data
    try:
        changed_data = json.loads(data_baru)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Format data tidak valid")
    
    # Build data_lama (only changed fields)
    data_lama = {}
    for key in changed_data.keys():
        if key in biodata:
            data_lama[key] = biodata[key]
    
    # Save uploaded files
    ktp_path = await save_upload_file(dokumen_ktp, mhs["id"], "ktp")
    kk_path = await save_upload_file(dokumen_kk, mhs["id"], "kk")
    akte_path = await save_upload_file(dokumen_akte, mhs["id"], "akte")
    
    doc = {
        "id": str(uuid.uuid4()),
        "mahasiswa_id": mhs["id"],
        "data_lama": data_lama,
        "data_baru": changed_data,
        "dokumen_ktp": ktp_path,
        "dokumen_kk": kk_path,
        "dokumen_akte": akte_path,
        "status": "pending",
        "catatan_admin": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.biodata_change_request.insert_one(doc)
    
    return {"message": "Pengajuan perubahan biodata berhasil diajukan", "id": doc["id"]}

# ----- Mahasiswa: Get My Change Requests -----
@mahasiswa_router.get("/biodata/change-requests")
async def get_my_biodata_change_requests(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "mahasiswa":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    mhs = await db.mahasiswa.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not mhs:
        raise HTTPException(status_code=404, detail="Data mahasiswa tidak ditemukan")
    
    requests = await db.biodata_change_request.find(
        {"mahasiswa_id": mhs["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return requests

# ----- Admin: Get All Biodata Change Requests -----
@biodata_router.get("/change-requests")
async def get_all_biodata_change_requests(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    query = {}
    if status:
        query["status"] = status
    
    requests = await db.biodata_change_request.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    result = []
    for req in requests:
        mhs = await db.mahasiswa.find_one({"id": req["mahasiswa_id"]}, {"_id": 0})
        result.append({
            **req,
            "mahasiswa_nim": mhs["nim"] if mhs else None,
            "mahasiswa_nama": mhs["nama"] if mhs else None
        })
    
    return result

# ----- Admin: Get Biodata Change Request Detail -----
@biodata_router.get("/change-requests/{request_id}")
async def get_biodata_change_request_detail(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    request = await db.biodata_change_request.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    
    mhs = await db.mahasiswa.find_one({"id": request["mahasiswa_id"]}, {"_id": 0})
    biodata = await db.biodata.find_one({"mahasiswa_id": request["mahasiswa_id"]}, {"_id": 0})
    
    return {
        **request,
        "mahasiswa_nim": mhs["nim"] if mhs else None,
        "mahasiswa_nama": mhs["nama"] if mhs else None,
        "biodata_lengkap": biodata
    }

# ----- Admin: Approve/Reject Change Request -----
@biodata_router.put("/change-requests/{request_id}/review")
async def review_biodata_change_request(
    request_id: str,
    action: str,  # approve or reject
    catatan: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action harus 'approve' atau 'reject'")
    
    request = await db.biodata_change_request.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Pengajuan sudah diproses")
    
    new_status = "approved" if action == "approve" else "rejected"
    
    # Update request status
    await db.biodata_change_request.update_one(
        {"id": request_id},
        {"$set": {
            "status": new_status,
            "catatan_admin": catatan,
            "reviewed_by": current_user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # If approved, update biodata
    if action == "approve":
        await db.biodata.update_one(
            {"mahasiswa_id": request["mahasiswa_id"]},
            {"$set": {
                **request["data_baru"],
                "is_verified": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return {"message": f"Pengajuan berhasil di{new_status}"}

# ----- Admin: Get All Biodata -----
@biodata_router.get("/list")
async def get_all_biodata(
    prodi_id: Optional[str] = None,
    is_verified: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Get all mahasiswa
    mhs_query = {}
    if prodi_id:
        mhs_query["prodi_id"] = prodi_id
    
    mahasiswa_list = await db.mahasiswa.find(mhs_query, {"_id": 0}).to_list(1000)
    mhs_ids = [m["id"] for m in mahasiswa_list]
    mhs_map = {m["id"]: m for m in mahasiswa_list}
    
    # Get biodata
    biodata_query = {"mahasiswa_id": {"$in": mhs_ids}}
    if is_verified is not None:
        biodata_query["is_verified"] = is_verified
    
    biodata_list = await db.biodata.find(biodata_query, {"_id": 0}).to_list(1000)
    
    result = []
    for bio in biodata_list:
        mhs = mhs_map.get(bio["mahasiswa_id"])
        prodi = await db.prodi.find_one({"id": mhs.get("prodi_id")}, {"_id": 0}) if mhs else None
        result.append({
            **bio,
            "mahasiswa_nim": mhs["nim"] if mhs else None,
            "mahasiswa_nama_mhs": mhs["nama"] if mhs else None,
            "prodi_nama": prodi["nama"] if prodi else None
        })
    
    return result

# ----- Admin: Get Mahasiswa Without Biodata -----
@biodata_router.get("/mahasiswa-belum-isi")
async def get_mahasiswa_without_biodata(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Get all active mahasiswa
    mahasiswa_list = await db.mahasiswa.find({"status": "aktif"}, {"_id": 0}).to_list(1000)
    
    # Get all biodata mahasiswa_ids
    biodata_list = await db.biodata.find({}, {"mahasiswa_id": 1, "_id": 0}).to_list(1000)
    biodata_mhs_ids = set(b["mahasiswa_id"] for b in biodata_list)
    
    # Filter mahasiswa without biodata
    result = []
    for mhs in mahasiswa_list:
        if mhs["id"] not in biodata_mhs_ids:
            prodi = await db.prodi.find_one({"id": mhs.get("prodi_id")}, {"_id": 0})
            result.append({
                "id": mhs["id"],
                "nim": mhs["nim"],
                "nama": mhs["nama"],
                "prodi_nama": prodi["nama"] if prodi else None
            })
    
    return result

# Include routers
api_router.include_router(auth_router)
api_router.include_router(master_router)
api_router.include_router(akademik_router)
api_router.include_router(mahasiswa_router)
api_router.include_router(dosen_router)
api_router.include_router(keuangan_router)
api_router.include_router(biodata_router)

app.include_router(api_router)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(Path(__file__).parent / "uploads")), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.mahasiswa.create_index("nim", unique=True)
    await db.dosen.create_index("nidn", unique=True)
    
    # Create default admin if not exists
    admin = await db.users.find_one({"email": "admin@siakad.ac.id"})
    if not admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "admin@siakad.ac.id",
            "nama": "Administrator",
            "role": "admin",
            "password": hash_password("admin123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin created: admin@siakad.ac.id / admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
