from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

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

security = HTTPBearer()

# ==================== MODELS ====================

# Base Models
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# User & Auth Models
class UserBase(BaseModel):
    email: EmailStr
    nama: str
    role: str  # admin, dosen, mahasiswa

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

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
    sks: int = 0
    dosen_nama: Optional[str] = None
    jadwal: Optional[str] = None

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
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
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
            is_active=user.get("is_active", True)
        )
    )

@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        nama=current_user["nama"],
        role=current_user["role"],
        is_active=current_user.get("is_active", True)
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
    query = {}
    if prodi_id:
        query["prodi_id"] = prodi_id
    if status:
        query["status"] = status
    
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
    
    return {
        **mhs,
        "prodi_nama": prodi["nama"] if prodi else None,
        "fakultas_nama": fakultas["nama"] if fakultas else None
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
        if kelas:
            mk = await db.mata_kuliah.find_one({"id": kelas["mata_kuliah_id"]}, {"_id": 0})
            dosen = await db.dosen.find_one({"id": kelas["dosen_id"]}, {"_id": 0})
            
            result.append(KRSResponse(
                **item,
                mata_kuliah_nama=mk["nama"] if mk else None,
                sks=(mk.get("sks_teori", 0) + mk.get("sks_praktik", 0)) if mk else 0,
                dosen_nama=dosen["nama"] if dosen else None,
                jadwal=kelas.get("jadwal")
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

# Include routers
api_router.include_router(auth_router)
api_router.include_router(master_router)
api_router.include_router(akademik_router)
api_router.include_router(mahasiswa_router)
api_router.include_router(dosen_router)

app.include_router(api_router)

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
