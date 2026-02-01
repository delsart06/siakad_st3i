#!/usr/bin/env python3
"""
SIAKAD Database Seed Script
Membuat data awal untuk development dan testing

Jalankan dengan:
    python scripts/seed_data.py

Atau dari folder backend:
    python ../scripts/seed_data.py
"""

import asyncio
import uuid
import bcrypt
import os
import sys
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except ImportError:
    print("Error: motor package not installed")
    print("Run: pip install motor")
    sys.exit(1)

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'siakad')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_id() -> str:
    return str(uuid.uuid4())

async def seed_database():
    print(f"\n{'='*60}")
    print("SIAKAD Database Seed Script")
    print(f"{'='*60}")
    print(f"MongoDB URL: {MONGO_URL}")
    print(f"Database: {DB_NAME}")
    print(f"{'='*60}\n")
    
    # Connect to MongoDB
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB\n")
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        print("\nPastikan MongoDB sudah berjalan!")
        return
    
    # ========== TAHUN AKADEMIK ==========
    print("Creating Tahun Akademik...")
    ta_ganjil = {
        "id": generate_id(),
        "tahun": "2024/2025",
        "semester": "Ganjil",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    ta_genap = {
        "id": generate_id(),
        "tahun": "2024/2025",
        "semester": "Genap",
        "is_active": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tahun_akademik.delete_many({})
    await db.tahun_akademik.insert_many([ta_ganjil, ta_genap])
    print(f"  ✓ Created 2 Tahun Akademik (Active: {ta_ganjil['tahun']} - {ta_ganjil['semester']})")
    
    # ========== FAKULTAS ==========
    print("\nCreating Fakultas...")
    fakultas_data = [
        {"id": generate_id(), "nama": "Fakultas Teknik", "kode": "FT"},
        {"id": generate_id(), "nama": "Fakultas Ekonomi & Bisnis", "kode": "FEB"},
        {"id": generate_id(), "nama": "Fakultas Ilmu Komputer", "kode": "FILKOM"},
    ]
    
    await db.fakultas.delete_many({})
    await db.fakultas.insert_many(fakultas_data)
    print(f"  ✓ Created {len(fakultas_data)} Fakultas")
    
    # ========== PRODI ==========
    print("\nCreating Program Studi...")
    prodi_data = [
        {"id": generate_id(), "nama": "Teknik Informatika", "kode": "TI", "fakultas_id": fakultas_data[0]["id"], "jenjang": "S1"},
        {"id": generate_id(), "nama": "Sistem Informasi", "kode": "SI", "fakultas_id": fakultas_data[2]["id"], "jenjang": "S1"},
        {"id": generate_id(), "nama": "Teknik Elektro", "kode": "TE", "fakultas_id": fakultas_data[0]["id"], "jenjang": "S1"},
        {"id": generate_id(), "nama": "Manajemen", "kode": "MN", "fakultas_id": fakultas_data[1]["id"], "jenjang": "S1"},
        {"id": generate_id(), "nama": "Akuntansi", "kode": "AK", "fakultas_id": fakultas_data[1]["id"], "jenjang": "S1"},
    ]
    
    await db.prodi.delete_many({})
    await db.prodi.insert_many(prodi_data)
    print(f"  ✓ Created {len(prodi_data)} Program Studi")
    
    # ========== KURIKULUM ==========
    print("\nCreating Kurikulum...")
    kurikulum_data = [
        {"id": generate_id(), "nama": "Kurikulum TI 2020", "tahun": "2020", "prodi_id": prodi_data[0]["id"], "is_active": True},
        {"id": generate_id(), "nama": "Kurikulum SI 2020", "tahun": "2020", "prodi_id": prodi_data[1]["id"], "is_active": True},
        {"id": generate_id(), "nama": "Kurikulum TE 2020", "tahun": "2020", "prodi_id": prodi_data[2]["id"], "is_active": True},
    ]
    
    await db.kurikulum.delete_many({})
    await db.kurikulum.insert_many(kurikulum_data)
    print(f"  ✓ Created {len(kurikulum_data)} Kurikulum")
    
    # ========== MATA KULIAH ==========
    print("\nCreating Mata Kuliah...")
    mk_data = [
        # TI
        {"id": generate_id(), "kode": "TI101", "nama": "Algoritma dan Pemrograman", "sks": 3, "semester": 1, "kurikulum_id": kurikulum_data[0]["id"]},
        {"id": generate_id(), "kode": "TI102", "nama": "Matematika Diskrit", "sks": 3, "semester": 1, "kurikulum_id": kurikulum_data[0]["id"]},
        {"id": generate_id(), "kode": "TI103", "nama": "Pengantar Teknologi Informasi", "sks": 2, "semester": 1, "kurikulum_id": kurikulum_data[0]["id"]},
        {"id": generate_id(), "kode": "TI201", "nama": "Struktur Data", "sks": 3, "semester": 2, "kurikulum_id": kurikulum_data[0]["id"]},
        {"id": generate_id(), "kode": "TI202", "nama": "Basis Data", "sks": 3, "semester": 2, "kurikulum_id": kurikulum_data[0]["id"]},
        {"id": generate_id(), "kode": "TI301", "nama": "Pemrograman Web", "sks": 3, "semester": 3, "kurikulum_id": kurikulum_data[0]["id"]},
        {"id": generate_id(), "kode": "TI302", "nama": "Pemrograman Berorientasi Objek", "sks": 3, "semester": 3, "kurikulum_id": kurikulum_data[0]["id"]},
        # SI
        {"id": generate_id(), "kode": "SI101", "nama": "Pengantar Sistem Informasi", "sks": 3, "semester": 1, "kurikulum_id": kurikulum_data[1]["id"]},
        {"id": generate_id(), "kode": "SI102", "nama": "Logika dan Algoritma", "sks": 3, "semester": 1, "kurikulum_id": kurikulum_data[1]["id"]},
    ]
    
    await db.mata_kuliah.delete_many({})
    await db.mata_kuliah.insert_many(mk_data)
    print(f"  ✓ Created {len(mk_data)} Mata Kuliah")
    
    # ========== KATEGORI UKT ==========
    print("\nCreating Kategori UKT...")
    kategori_ukt = [
        {"id": generate_id(), "nama": "UKT 1", "nominal": 500000, "deskripsi": "Golongan 1 (Tidak Mampu)"},
        {"id": generate_id(), "nama": "UKT 2", "nominal": 1000000, "deskripsi": "Golongan 2"},
        {"id": generate_id(), "nama": "UKT 3", "nominal": 2500000, "deskripsi": "Golongan 3"},
        {"id": generate_id(), "nama": "UKT 4", "nominal": 4000000, "deskripsi": "Golongan 4"},
        {"id": generate_id(), "nama": "UKT 5", "nominal": 5500000, "deskripsi": "Golongan 5"},
        {"id": generate_id(), "nama": "UKT 6", "nominal": 7000000, "deskripsi": "Golongan 6 (Mampu)"},
    ]
    
    await db.kategori_ukt.delete_many({})
    await db.kategori_ukt.insert_many(kategori_ukt)
    print(f"  ✓ Created {len(kategori_ukt)} Kategori UKT")
    
    # ========== USERS & DOSEN ==========
    print("\nCreating Users & Dosen...")
    
    # Admin
    admin_id = generate_id()
    admin_user = {
        "id": admin_id,
        "email": "admin@siakad.ac.id",
        "password": hash_password("admin123"),
        "nama": "Administrator",
        "role": "admin",
        "user_id_number": "1234567890",  # NIP
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Dosen
    dosen_data = []
    dosen_users = []
    
    dosen_list = [
        {"nidn": "0001018902", "nama": "Dr. Ahmad Wijaya, M.Kom", "email": "ahmad.wijaya@siakad.ac.id"},
        {"nidn": "0015038801", "nama": "Prof. Dr. Budi Santoso, M.T", "email": "budi.santoso@siakad.ac.id"},
        {"nidn": "0020058803", "nama": "Dr. Citra Dewi, M.Sc", "email": "citra.dewi@siakad.ac.id"},
        {"nidn": "0005078805", "nama": "Dian Pratama, S.Kom, M.Kom", "email": "dian.pratama@siakad.ac.id"},
    ]
    
    for dsn in dosen_list:
        user_id = generate_id()
        dosen_id = generate_id()
        
        dosen_users.append({
            "id": user_id,
            "email": dsn["email"],
            "password": hash_password("password"),
            "nama": dsn["nama"],
            "role": "dosen",
            "user_id_number": dsn["nidn"],  # NIDN
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        dosen_data.append({
            "id": dosen_id,
            "nidn": dsn["nidn"],
            "nama": dsn["nama"],
            "email": dsn["email"],
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.dosen.delete_many({})
    await db.dosen.insert_many(dosen_data)
    print(f"  ✓ Created {len(dosen_data)} Dosen")
    
    # ========== MAHASISWA ==========
    print("\nCreating Mahasiswa...")
    mahasiswa_data = []
    mahasiswa_users = []
    
    mahasiswa_list = [
        {"nim": "2024001", "nama": "Budi Santoso", "email": "budi@mahasiswa.ac.id", "prodi_idx": 0, "dosen_pa_idx": 0, "kategori_ukt_idx": 3},
        {"nim": "2024002", "nama": "Dewi Lestari", "email": "dewi@mahasiswa.ac.id", "prodi_idx": 0, "dosen_pa_idx": 0, "kategori_ukt_idx": 2},
        {"nim": "2024003", "nama": "Eko Prasetyo", "email": "eko@mahasiswa.ac.id", "prodi_idx": 0, "dosen_pa_idx": 1, "kategori_ukt_idx": 4},
        {"nim": "2024004", "nama": "Fitri Handayani", "email": "fitri@mahasiswa.ac.id", "prodi_idx": 1, "dosen_pa_idx": 2, "kategori_ukt_idx": 3},
        {"nim": "2024005", "nama": "Gunawan Wibowo", "email": "gunawan@mahasiswa.ac.id", "prodi_idx": 1, "dosen_pa_idx": 2, "kategori_ukt_idx": 5},
        {"nim": "2023001", "nama": "Hendra Kurniawan", "email": "hendra@mahasiswa.ac.id", "prodi_idx": 0, "dosen_pa_idx": 1, "kategori_ukt_idx": 2},
        {"nim": "2023002", "nama": "Indah Permata", "email": "indah@mahasiswa.ac.id", "prodi_idx": 0, "dosen_pa_idx": 0, "kategori_ukt_idx": 3},
        {"nim": "2023003", "nama": "Joko Susilo", "email": "joko@mahasiswa.ac.id", "prodi_idx": 1, "dosen_pa_idx": 3, "kategori_ukt_idx": 4},
    ]
    
    for mhs in mahasiswa_list:
        user_id = generate_id()
        mhs_id = generate_id()
        
        mahasiswa_users.append({
            "id": user_id,
            "email": mhs["email"],
            "password": hash_password("password"),
            "nama": mhs["nama"],
            "role": "mahasiswa",
            "user_id_number": mhs["nim"],  # NIM
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        mahasiswa_data.append({
            "id": mhs_id,
            "nim": mhs["nim"],
            "nama": mhs["nama"],
            "email": mhs["email"],
            "prodi_id": prodi_data[mhs["prodi_idx"]]["id"],
            "dosen_pa_id": dosen_data[mhs["dosen_pa_idx"]]["id"],
            "kategori_ukt_id": kategori_ukt[mhs["kategori_ukt_idx"]]["id"],
            "user_id": user_id,
            "status": "aktif",
            "angkatan": mhs["nim"][:4],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.mahasiswa.delete_many({})
    await db.mahasiswa.insert_many(mahasiswa_data)
    print(f"  ✓ Created {len(mahasiswa_data)} Mahasiswa")
    
    # Insert all users
    all_users = [admin_user] + dosen_users + mahasiswa_users
    await db.users.delete_many({})
    await db.users.insert_many(all_users)
    print(f"  ✓ Created {len(all_users)} Users total")
    
    # ========== KELAS ==========
    print("\nCreating Kelas...")
    kelas_data = []
    
    jadwal_list = [
        {"hari": "Senin", "jam_mulai": "08:00", "jam_selesai": "10:30", "ruangan": "Lab Komputer 1"},
        {"hari": "Senin", "jam_mulai": "13:00", "jam_selesai": "15:30", "ruangan": "R301"},
        {"hari": "Selasa", "jam_mulai": "08:00", "jam_selesai": "10:30", "ruangan": "R302"},
        {"hari": "Selasa", "jam_mulai": "13:00", "jam_selesai": "15:30", "ruangan": "Lab Komputer 2"},
        {"hari": "Rabu", "jam_mulai": "10:00", "jam_selesai": "12:30", "ruangan": "R303"},
        {"hari": "Kamis", "jam_mulai": "08:00", "jam_selesai": "10:30", "ruangan": "R301"},
        {"hari": "Kamis", "jam_mulai": "13:00", "jam_selesai": "15:30", "ruangan": "Lab Komputer 1"},
    ]
    
    for i, mk in enumerate(mk_data[:7]):
        jadwal = jadwal_list[i % len(jadwal_list)]
        kelas_data.append({
            "id": generate_id(),
            "mata_kuliah_id": mk["id"],
            "dosen_id": dosen_data[i % len(dosen_data)]["id"],
            "tahun_akademik_id": ta_ganjil["id"],
            "kode_kelas": f"{mk['kode']}-A",
            "kuota": 40,
            "terisi": 0,
            "hari": jadwal["hari"],
            "jam_mulai": jadwal["jam_mulai"],
            "jam_selesai": jadwal["jam_selesai"],
            "ruangan": jadwal["ruangan"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.kelas.delete_many({})
    await db.kelas.insert_many(kelas_data)
    print(f"  ✓ Created {len(kelas_data)} Kelas")
    
    # ========== TAGIHAN UKT ==========
    print("\nCreating Tagihan UKT...")
    tagihan_data = []
    
    for mhs in mahasiswa_data:
        kategori = await db.kategori_ukt.find_one({"id": mhs.get("kategori_ukt_id")})
        if kategori:
            tagihan_data.append({
                "id": generate_id(),
                "mahasiswa_id": mhs["id"],
                "tahun_akademik_id": ta_ganjil["id"],
                "kategori_ukt_id": kategori["id"],
                "nominal": kategori["nominal"],
                "jatuh_tempo": "2024-09-30",
                "status": "belum_bayar",
                "total_dibayar": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    await db.tagihan_ukt.delete_many({})
    await db.tagihan_ukt.insert_many(tagihan_data)
    print(f"  ✓ Created {len(tagihan_data)} Tagihan UKT")
    
    # ========== CLEAR OTHER COLLECTIONS ==========
    print("\nClearing other collections...")
    await db.krs.delete_many({})
    await db.nilai.delete_many({})
    await db.presensi.delete_many({})
    await db.presensi_detail.delete_many({})
    await db.biodata.delete_many({})
    await db.biodata_change_request.delete_many({})
    await db.password_reset_requests.delete_many({})
    await db.foto_profil_requests.delete_many({})
    await db.pembayaran_ukt.delete_many({})
    print("  ✓ Cleared KRS, Nilai, Presensi, Biodata, etc.")
    
    # Close connection
    client.close()
    
    # Print summary
    print(f"\n{'='*60}")
    print("SEED DATA COMPLETED!")
    print(f"{'='*60}")
    print("\n📋 AKUN LOGIN:")
    print("-" * 50)
    print(f"{'Role':<15} {'Login (NIM/NIDN/NIP)':<20} {'Password':<15}")
    print("-" * 50)
    print(f"{'Admin':<15} {'1234567890':<20} {'admin123':<15}")
    print(f"{'Dosen':<15} {'0001018902':<20} {'password':<15}")
    print(f"{'Mahasiswa':<15} {'2024001':<20} {'password':<15}")
    print("-" * 50)
    print("\n⚠️  PENTING: Login menggunakan NIM/NIDN/NIP, bukan email!")
    print(f"\n{'='*60}\n")

if __name__ == "__main__":
    asyncio.run(seed_database())
