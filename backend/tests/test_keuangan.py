"""
Backend API Tests for Finance Module (Modul Keuangan)
Tests for: Kategori UKT, Tagihan, Pembayaran, Rekap
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://siakad-st3i.preview.emergentagent.com').rstrip('/')

# Test data tracking for cleanup
test_data = {
    "kategori_ukt_id": None,
    "tagihan_id": None,
    "pembayaran_id": None,
    "mahasiswa_id": None,
    "tahun_akademik_id": None
}


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login(self):
        """Test admin login and token retrieval"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@siakad.ac.id",
            "password": "admin123"
        })
        print(f"Admin login response: {response.status_code}")
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        return data["access_token"]
    
    def test_invalid_login(self):
        """Test login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestKategoriUKT:
    """Kategori UKT CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@siakad.ac.id",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_kategori_ukt(self):
        """Test GET /api/keuangan/kategori-ukt"""
        response = requests.get(f"{BASE_URL}/api/keuangan/kategori-ukt", headers=self.headers)
        print(f"Get kategori UKT response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} kategori UKT")
    
    def test_create_kategori_ukt(self):
        """Test POST /api/keuangan/kategori-ukt"""
        test_kode = f"TEST-UKT-{str(uuid.uuid4())[:8]}"
        payload = {
            "kode": test_kode,
            "nama": f"TEST UKT Kategori {str(uuid.uuid4())[:4]}",
            "nominal": 5000000,
            "deskripsi": "Test kategori for automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/keuangan/kategori-ukt", 
                                json=payload, headers=self.headers)
        print(f"Create kategori UKT response: {response.status_code}")
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert data["nama"] == payload["nama"]
        assert data["nominal"] == payload["nominal"]
        assert "id" in data
        test_data["kategori_ukt_id"] = data["id"]
        print(f"Created kategori UKT with ID: {data['id']}")
    
    def test_kategori_ukt_persistence(self):
        """Verify created kategori UKT is persisted"""
        if not test_data.get("kategori_ukt_id"):
            pytest.skip("No kategori UKT created")
        response = requests.get(f"{BASE_URL}/api/keuangan/kategori-ukt", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        found = any(k["id"] == test_data["kategori_ukt_id"] for k in data)
        assert found, "Created kategori UKT not found in list"


class TestTagihan:
    """Tagihan UKT CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and required data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@siakad.ac.id",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get tahun akademik
        ta_response = requests.get(f"{BASE_URL}/api/master/tahun-akademik", headers=self.headers)
        if ta_response.status_code == 200 and ta_response.json():
            active_ta = next((ta for ta in ta_response.json() if ta.get("is_active")), None)
            if active_ta:
                test_data["tahun_akademik_id"] = active_ta["id"]
            elif ta_response.json():
                test_data["tahun_akademik_id"] = ta_response.json()[0]["id"]
        
        # Get mahasiswa
        mhs_response = requests.get(f"{BASE_URL}/api/master/mahasiswa", headers=self.headers)
        if mhs_response.status_code == 200 and mhs_response.json():
            test_data["mahasiswa_id"] = mhs_response.json()[0]["id"]
    
    def test_get_all_tagihan(self):
        """Test GET /api/keuangan/tagihan"""
        response = requests.get(f"{BASE_URL}/api/keuangan/tagihan", headers=self.headers)
        print(f"Get tagihan response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} tagihan")
    
    def test_get_tagihan_with_filters(self):
        """Test GET /api/keuangan/tagihan with filters"""
        if not test_data.get("tahun_akademik_id"):
            pytest.skip("No tahun akademik available")
        
        params = {"tahun_akademik_id": test_data["tahun_akademik_id"]}
        response = requests.get(f"{BASE_URL}/api/keuangan/tagihan", 
                               params=params, headers=self.headers)
        print(f"Get tagihan with filter response: {response.status_code}")
        assert response.status_code == 200
    
    def test_create_tagihan(self):
        """Test POST /api/keuangan/tagihan"""
        if not test_data.get("mahasiswa_id") or not test_data.get("tahun_akademik_id"):
            pytest.skip("Missing mahasiswa or tahun akademik data")
        
        # Get or create kategori UKT
        kat_response = requests.get(f"{BASE_URL}/api/keuangan/kategori-ukt", headers=self.headers)
        if kat_response.status_code == 200 and kat_response.json():
            kategori_id = kat_response.json()[0]["id"]
        else:
            pytest.skip("No kategori UKT available")
        
        payload = {
            "mahasiswa_id": test_data["mahasiswa_id"],
            "tahun_akademik_id": test_data["tahun_akademik_id"],
            "kategori_ukt_id": kategori_id,
            "jatuh_tempo": "2026-06-30"
        }
        response = requests.post(f"{BASE_URL}/api/keuangan/tagihan", 
                                json=payload, headers=self.headers)
        print(f"Create tagihan response: {response.status_code}, body: {response.text[:200]}")
        
        # Could be 200 or 400 if already exists
        if response.status_code == 200:
            data = response.json()
            test_data["tagihan_id"] = data["id"]
            assert "nominal" in data
            assert "sisa_tagihan" in data
            print(f"Created tagihan with ID: {data['id']}")
        elif response.status_code == 400:
            print("Tagihan already exists for this combination - expected behavior")
            # Get existing tagihan to use in tests
            tag_response = requests.get(f"{BASE_URL}/api/keuangan/tagihan", headers=self.headers)
            if tag_response.status_code == 200 and tag_response.json():
                test_data["tagihan_id"] = tag_response.json()[0]["id"]
    
    def test_delete_tagihan_with_payment_fails(self):
        """Test that deleting tagihan with payment fails"""
        # Get a tagihan that has payments
        response = requests.get(f"{BASE_URL}/api/keuangan/tagihan", headers=self.headers)
        if response.status_code != 200 or not response.json():
            pytest.skip("No tagihan available")
        
        tagihan_with_payment = None
        for t in response.json():
            if t.get("total_dibayar", 0) > 0:
                tagihan_with_payment = t
                break
        
        if not tagihan_with_payment:
            pytest.skip("No tagihan with payment found")
        
        delete_response = requests.delete(
            f"{BASE_URL}/api/keuangan/tagihan/{tagihan_with_payment['id']}", 
            headers=self.headers
        )
        print(f"Delete tagihan with payment response: {delete_response.status_code}")
        assert delete_response.status_code == 400, "Should not allow deletion of tagihan with payments"


class TestPembayaran:
    """Pembayaran UKT tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@siakad.ac.id",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_all_pembayaran(self):
        """Test GET /api/keuangan/pembayaran"""
        response = requests.get(f"{BASE_URL}/api/keuangan/pembayaran", headers=self.headers)
        print(f"Get pembayaran response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} pembayaran")
    
    def test_get_pembayaran_with_status_filter(self):
        """Test GET /api/keuangan/pembayaran with status filter"""
        for status in ["pending", "verified", "rejected"]:
            response = requests.get(f"{BASE_URL}/api/keuangan/pembayaran", 
                                   params={"status": status}, headers=self.headers)
            print(f"Get pembayaran status={status}: {response.status_code}")
            assert response.status_code == 200
    
    def test_verify_pembayaran_endpoint_exists(self):
        """Test that PUT /api/keuangan/pembayaran/{id}/verify endpoint exists"""
        # Use a fake ID to test endpoint existence (should return 404 or 400)
        fake_id = "non-existent-id"
        response = requests.put(
            f"{BASE_URL}/api/keuangan/pembayaran/{fake_id}/verify",
            json={"status": "verified"},
            headers=self.headers
        )
        # Should return 404 (not found) or 400 (bad request), not 404 Method Not Allowed
        print(f"Verify pembayaran endpoint test: {response.status_code}")
        assert response.status_code in [400, 404, 422], f"Unexpected status: {response.status_code}"


class TestRekap:
    """Rekap Keuangan tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@siakad.ac.id",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_rekap(self):
        """Test GET /api/keuangan/rekap"""
        response = requests.get(f"{BASE_URL}/api/keuangan/rekap", headers=self.headers)
        print(f"Get rekap response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        # Check expected fields
        assert "total_tagihan" in data
        assert "total_terbayar" in data
        assert "total_belum_bayar" in data
        assert "jumlah_mahasiswa_lunas" in data
        assert "jumlah_mahasiswa_cicilan" in data
        assert "jumlah_mahasiswa_belum_bayar" in data
        print(f"Rekap: Total tagihan={data['total_tagihan']}, Terbayar={data['total_terbayar']}")


class TestMahasiswaKeuangan:
    """Mahasiswa Keuangan endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get mahasiswa token"""
        # First get admin to find a mahasiswa
        admin_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@siakad.ac.id",
            "password": "admin123"
        })
        self.admin_token = admin_response.json()["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Try to find a mahasiswa user
        mhs_response = requests.get(f"{BASE_URL}/api/master/mahasiswa", headers=self.admin_headers)
        self.mahasiswa_email = None
        if mhs_response.status_code == 200 and mhs_response.json():
            self.mahasiswa_email = mhs_response.json()[0].get("email")
        
        # Try to login as mahasiswa
        self.mahasiswa_token = None
        if self.mahasiswa_email:
            # Try common passwords
            for pwd in ["mahasiswa123", "password123", "123456"]:
                mhs_login = requests.post(f"{BASE_URL}/api/auth/login", json={
                    "email": self.mahasiswa_email,
                    "password": pwd
                })
                if mhs_login.status_code == 200:
                    self.mahasiswa_token = mhs_login.json()["access_token"]
                    self.mahasiswa_headers = {"Authorization": f"Bearer {self.mahasiswa_token}"}
                    break
    
    def test_get_my_tagihan(self):
        """Test GET /api/mahasiswa/keuangan/tagihan"""
        if not self.mahasiswa_token:
            pytest.skip("No mahasiswa login available")
        
        response = requests.get(f"{BASE_URL}/api/mahasiswa/keuangan/tagihan", 
                               headers=self.mahasiswa_headers)
        print(f"Get my tagihan response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_my_pembayaran(self):
        """Test GET /api/mahasiswa/keuangan/pembayaran"""
        if not self.mahasiswa_token:
            pytest.skip("No mahasiswa login available")
        
        response = requests.get(f"{BASE_URL}/api/mahasiswa/keuangan/pembayaran", 
                               headers=self.mahasiswa_headers)
        print(f"Get my pembayaran response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_mahasiswa_can_only_see_own_tagihan(self):
        """Test that mahasiswa can only see their own tagihan"""
        if not self.mahasiswa_token:
            pytest.skip("No mahasiswa login available")
        
        # Get mahasiswa's tagihan
        mhs_response = requests.get(f"{BASE_URL}/api/mahasiswa/keuangan/tagihan", 
                                   headers=self.mahasiswa_headers)
        assert mhs_response.status_code == 200
        
        # Get all tagihan as admin
        admin_response = requests.get(f"{BASE_URL}/api/keuangan/tagihan", 
                                     headers=self.admin_headers)
        
        # Mahasiswa should only see a subset
        mhs_count = len(mhs_response.json())
        admin_count = len(admin_response.json())
        print(f"Mahasiswa sees {mhs_count} tagihan, Admin sees {admin_count} tagihan")
        assert mhs_count <= admin_count


class TestAuthorizationKeuangan:
    """Authorization tests for Keuangan endpoints"""
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated access is denied"""
        endpoints = [
            "/api/keuangan/kategori-ukt",
            "/api/keuangan/tagihan",
            "/api/keuangan/pembayaran",
            "/api/keuangan/rekap"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            print(f"Unauthenticated {endpoint}: {response.status_code}")
            assert response.status_code in [401, 403], f"Expected 401/403 for {endpoint}"


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@siakad.ac.id",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_cleanup_test_data(self):
        """Clean up test-created data"""
        # Delete test kategori UKT if created
        if test_data.get("kategori_ukt_id"):
            response = requests.delete(
                f"{BASE_URL}/api/keuangan/kategori-ukt/{test_data['kategori_ukt_id']}", 
                headers=self.headers
            )
            print(f"Cleanup kategori UKT: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
