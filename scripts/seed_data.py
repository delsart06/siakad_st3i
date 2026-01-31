#!/usr/bin/env python3
"""
SIAKAD - Database Seed Script
Jalankan script ini untuk membuat data awal (admin, tahun akademik, dll)

Usage:
    cd backend
    source venv/bin/activate
    python ../scripts/seed_data.py
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_path))
os.chdir(backend_path)

from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'siakad')


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


async def seed_database():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"Connected to database: {DB_NAME}")
    print("")
    
    # 1. Create Admin User
    print("Creating admin user...")
    admin_exists = await db.users.find_one({"email": "admin@siakad.ac.id"})
    if not admin_exists:
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
        print("  [OK] Admin user created: admin@siakad.ac.id / admin123")
    else:
        print("  [SKIP] Admin user already exists")
    
    # 2. Create Tahun Akademik
    print("Creating tahun akademik...")
    ta_exists = await db.tahun_akademik.find_one({"tahun": "2024/2025", "semester": "Ganjil"})
    if not ta_exists:
        ta_doc = {
            "id": str(uuid.uuid4()),
            "tahun": "2024/2025",
            "semester": "Ganjil",
            "is_active": True,
            "tanggal_mulai": "2024-09-01",
            "tanggal_selesai": "2025-01-31"
        }
        await db.tahun_akademik.insert_one(ta_doc)
        print("  [OK] Tahun Akademik created: 2024/2025 - Ganjil (Active)")
    else:
        print("  [SKIP] Tahun Akademik already exists")
    
    # 3. Create Fakultas
    print("Creating fakultas...")
    fak_exists = await db.fakultas.find_one({"kode": "FT"})
    fakultas_id = None
    if not fak_exists:
        fakultas_id = str(uuid.uuid4())
        fak_doc = {
            "id": fakultas_id,
            "kode": "FT",
            "nama": "Fakultas Teknik",
            "dekan": "Prof. Dr. Ir. Teknologi, M.T."
        }
        await db.fakultas.insert_one(fak_doc)
        print("  [OK] Fakultas created: Fakultas Teknik")
    else:
        fakultas_id = fak_exists["id"]
        print("  [SKIP] Fakultas already exists")
    
    # 4. Create Program Studi
    print("Creating program studi...")
    prodi_exists = await db.prodi.find_one({"kode": "TI"})
    prodi_id = None
    if not prodi_exists:
        prodi_id = str(uuid.uuid4())
        prodi_doc = {
            "id": prodi_id,
            "kode": "TI",
            "nama": "Teknik Informatika",
            "fakultas_id": fakultas_id,
            "jenjang": "S1",
            "akreditasi": "A",
            "kaprodi": "Dr. Informatika, M.Kom."
        }
        await db.prodi.insert_one(prodi_doc)
        print("  [OK] Program Studi created: Teknik Informatika")
    else:
        prodi_id = prodi_exists["id"]
        print("  [SKIP] Program Studi already exists")
    
    # 5. Create Kurikulum
    print("Creating kurikulum...")
    kur_exists = await db.kurikulum.find_one({"kode": "KUR2024"})
    kurikulum_id = None
    if not kur_exists:
        kurikulum_id = str(uuid.uuid4())
        kur_doc = {
            "id": kurikulum_id,
            "kode": "KUR2024",
            "nama": "Kurikulum 2024",
            "tahun": "2024",
            "prodi_id": prodi_id,
            "is_active": True
        }
        await db.kurikulum.insert_one(kur_doc)
        print("  [OK] Kurikulum created: Kurikulum 2024")
    else:
        kurikulum_id = kur_exists["id"]
        print("  [SKIP] Kurikulum already exists")
    
    # 6. Create Mata Kuliah
    print("Creating mata kuliah...")
    mk_list = [
        {"kode": "TI101", "nama": "Algoritma dan Pemrograman", "sks_teori": 2, "sks_praktik": 1, "semester": 1},
        {"kode": "TI102", "nama": "Matematika Diskrit", "sks_teori": 3, "sks_praktik": 0, "semester": 1},
        {"kode": "TI201", "nama": "Struktur Data", "sks_teori": 2, "sks_praktik": 1, "semester": 2},
        {"kode": "TI202", "nama": "Basis Data", "sks_teori": 2, "sks_praktik": 1, "semester": 2},
        {"kode": "TI301", "nama": "Pemrograman Web", "sks_teori": 2, "sks_praktik": 1, "semester": 3},
        {"kode": "TI302", "nama": "Jaringan Komputer", "sks_teori": 2, "sks_praktik": 1, "semester": 3},
    ]
    
    for mk in mk_list:
        mk_exists = await db.mata_kuliah.find_one({"kode": mk["kode"]})
        if not mk_exists:
            mk_doc = {
                "id": str(uuid.uuid4()),
                "kode": mk["kode"],
                "nama": mk["nama"],
                "sks_teori": mk["sks_teori"],
                "sks_praktik": mk["sks_praktik"],
                "semester": mk["semester"],
                "kurikulum_id": kurikulum_id,
                "prasyarat_ids": []
            }
            await db.mata_kuliah.insert_one(mk_doc)
            print(f"  [OK] Mata Kuliah created: {mk['kode']} - {mk['nama']}")
        else:
            print(f"  [SKIP] Mata Kuliah {mk['kode']} already exists")
    
    # 7. Create Sample Dosen
    print("Creating sample dosen...")
    dosen_exists = await db.dosen.find_one({"nidn": "0001018901"})
    dosen_id = None
    if not dosen_exists:
        dosen_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Create user for dosen
        dosen_user = {
            "id": user_id,
            "email": "dosen@siakad.ac.id",
            "nama": "Dr. Budi Dosen, M.Kom.",
            "role": "dosen",
            "password": hash_password("password"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(dosen_user)
        
        dosen_doc = {
            "id": dosen_id,
            "nidn": "0001018901",
            "nama": "Dr. Budi Dosen, M.Kom.",
            "email": "dosen@siakad.ac.id",
            "prodi_id": prodi_id,
            "jabatan_fungsional": "Lektor Kepala",
            "status": "aktif",
            "user_id": user_id
        }
        await db.dosen.insert_one(dosen_doc)
        print("  [OK] Dosen created: Dr. Budi Dosen (dosen@siakad.ac.id / password)")
    else:
        dosen_id = dosen_exists["id"]
        print("  [SKIP] Dosen already exists")
    
    # 8. Create Sample Mahasiswa
    print("Creating sample mahasiswa...")
    mhs_exists = await db.mahasiswa.find_one({"nim": "2024001001"})
    if not mhs_exists:
        mhs_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Create user for mahasiswa
        mhs_user = {
            "id": user_id,
            "email": "mahasiswa@siakad.ac.id",
            "nama": "Andi Mahasiswa",
            "role": "mahasiswa",
            "password": hash_password("password"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(mhs_user)
        
        mhs_doc = {
            "id": mhs_id,
            "nim": "2024001001",
            "nama": "Andi Mahasiswa",
            "email": "mahasiswa@siakad.ac.id",
            "prodi_id": prodi_id,
            "tahun_masuk": "2024",
            "status": "aktif",
            "user_id": user_id,
            "dosen_pa_id": dosen_id
        }
        await db.mahasiswa.insert_one(mhs_doc)
        print("  [OK] Mahasiswa created: Andi Mahasiswa (mahasiswa@siakad.ac.id / password)")
    else:
        print("  [SKIP] Mahasiswa already exists")
    
    print("")
    print("==========================================")
    print("  Seed Complete!")
    print("==========================================")
    print("")
    print("Default accounts:")
    print("  Admin:     admin@siakad.ac.id / admin123")
    print("  Dosen:     dosen@siakad.ac.id / password")
    print("  Mahasiswa: mahasiswa@siakad.ac.id / password")
    print("")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
