"""
Test suite for Biodata Module endpoints - SIAKAD University System
Tests both Mahasiswa and Admin endpoints for biodata management with approval system.

Endpoints tested:
- Mahasiswa: GET /api/mahasiswa/biodata, POST /api/mahasiswa/biodata,
             POST /api/mahasiswa/biodata/change-request, GET /api/mahasiswa/biodata/change-requests
- Admin: GET /api/biodata/change-requests, GET /api/biodata/change-requests/{id},
         PUT /api/biodata/change-requests/{id}/review, GET /api/biodata/list,
         GET /api/biodata/mahasiswa-belum-isi
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@siakad.ac.id"
ADMIN_PASSWORD = "admin123"
MAHASISWA_EMAIL = "budi@mahasiswa.ac.id"
MAHASISWA_PASSWORD = "mahasiswa123"

class TestAuthentication:
    """Test authentication for both admin and mahasiswa"""
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"PASS: Admin login successful, role={data['user']['role']}")
    
    def test_mahasiswa_login(self):
        """Test mahasiswa login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MAHASISWA_EMAIL,
            "password": MAHASISWA_PASSWORD
        })
        assert response.status_code == 200, f"Mahasiswa login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "mahasiswa"
        print(f"PASS: Mahasiswa login successful, role={data['user']['role']}")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.text}")
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def mahasiswa_token():
    """Get mahasiswa authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MAHASISWA_EMAIL,
        "password": MAHASISWA_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Mahasiswa login failed: {response.text}")
    return response.json()["access_token"]


class TestMahasiswaBiodataEndpoints:
    """Test Mahasiswa biodata endpoints"""
    
    def test_get_my_biodata(self, mahasiswa_token):
        """Test GET /api/mahasiswa/biodata - Get my biodata and pending request status"""
        headers = {"Authorization": f"Bearer {mahasiswa_token}"}
        response = requests.get(f"{BASE_URL}/api/mahasiswa/biodata", headers=headers)
        
        assert response.status_code == 200, f"Failed to get biodata: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "biodata" in data
        assert "has_pending_request" in data
        assert "pending_request" in data
        
        print(f"PASS: Get my biodata - biodata exists: {data['biodata'] is not None}, has_pending_request: {data['has_pending_request']}")
        return data
    
    def test_get_my_change_requests(self, mahasiswa_token):
        """Test GET /api/mahasiswa/biodata/change-requests - Get change request history"""
        headers = {"Authorization": f"Bearer {mahasiswa_token}"}
        response = requests.get(f"{BASE_URL}/api/mahasiswa/biodata/change-requests", headers=headers)
        
        assert response.status_code == 200, f"Failed to get change requests: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"PASS: Get my change requests - count: {len(data)}")
        return data
    
    def test_access_denied_for_admin(self, admin_token):
        """Test that admin cannot access mahasiswa biodata endpoints"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/mahasiswa/biodata", headers=headers)
        
        # Admin should get 403 - Access denied
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: Admin correctly denied access to mahasiswa biodata endpoint")


class TestAdminBiodataEndpoints:
    """Test Admin biodata management endpoints"""
    
    def test_get_all_change_requests_pending(self, admin_token):
        """Test GET /api/biodata/change-requests with status=pending filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/biodata/change-requests",
            params={"status": "pending"},
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get pending requests: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        # Verify all returned requests are pending
        for req in data:
            assert req.get("status") == "pending", f"Expected pending status, got {req.get('status')}"
        
        print(f"PASS: Get pending change requests - count: {len(data)}")
        return data
    
    def test_get_all_change_requests_no_filter(self, admin_token):
        """Test GET /api/biodata/change-requests without filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/biodata/change-requests", headers=headers)
        
        assert response.status_code == 200, f"Failed to get all requests: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        # Check structure of each request
        for req in data:
            assert "id" in req
            assert "mahasiswa_id" in req
            assert "data_lama" in req
            assert "data_baru" in req
            assert "status" in req
        
        print(f"PASS: Get all change requests - count: {len(data)}")
        return data
    
    def test_get_all_biodata_list(self, admin_token):
        """Test GET /api/biodata/list - Get all student biodata"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/biodata/list", headers=headers)
        
        assert response.status_code == 200, f"Failed to get biodata list: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"PASS: Get all biodata list - count: {len(data)}")
        return data
    
    def test_get_mahasiswa_belum_isi(self, admin_token):
        """Test GET /api/biodata/mahasiswa-belum-isi - Get students without biodata"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/biodata/mahasiswa-belum-isi", headers=headers)
        
        assert response.status_code == 200, f"Failed to get mahasiswa belum isi: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        # Verify structure
        for mhs in data:
            assert "id" in mhs
            assert "nim" in mhs
            assert "nama" in mhs
        
        print(f"PASS: Get mahasiswa belum isi biodata - count: {len(data)}")
        return data
    
    def test_access_denied_for_mahasiswa(self, mahasiswa_token):
        """Test that mahasiswa cannot access admin biodata endpoints"""
        headers = {"Authorization": f"Bearer {mahasiswa_token}"}
        response = requests.get(f"{BASE_URL}/api/biodata/change-requests", headers=headers)
        
        # Mahasiswa should get 403 - Access denied
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: Mahasiswa correctly denied access to admin biodata endpoint")


class TestBiodataCreateFlow:
    """Test biodata creation flow for mahasiswa without existing biodata"""
    
    def test_create_initial_biodata(self, mahasiswa_token):
        """Test POST /api/mahasiswa/biodata - Create initial biodata"""
        headers = {"Authorization": f"Bearer {mahasiswa_token}"}
        
        # First check if biodata already exists
        response = requests.get(f"{BASE_URL}/api/mahasiswa/biodata", headers=headers)
        existing_data = response.json()
        
        if existing_data.get("biodata"):
            # Biodata already exists - test should pass
            print("SKIP: Biodata already exists - cannot test create flow")
            pytest.skip("Biodata already exists")
            return
        
        # Create biodata
        biodata = {
            "nama_lengkap": "TEST_Budi Santoso",
            "tempat_lahir": "Jakarta",
            "tanggal_lahir": "2000-01-15",
            "nik": "3175012001000001",
            "no_kk": "3175012001000001",
            "jenis_kelamin": "L",
            "agama": "Islam",
            "kewarganegaraan": "Indonesia",
            "alamat_jalan": "Jl. Test No. 123",
            "alamat_rt": "001",
            "alamat_rw": "002",
            "alamat_kelurahan": "Test Kelurahan",
            "alamat_kecamatan": "Test Kecamatan",
            "alamat_kota": "Jakarta Selatan",
            "alamat_provinsi": "DKI Jakarta",
            "alamat_kode_pos": "12345",
            "nama_ayah": "TEST_Ayah Budi",
            "nama_ibu": "TEST_Ibu Budi",
            "no_hp": "081234567890",
            "email": "budi.test@example.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mahasiswa/biodata",
            json=biodata,
            headers=headers
        )
        
        if response.status_code == 400:
            # Biodata already exists
            print("SKIP: Biodata already exists - returned 400")
            return
        
        assert response.status_code == 200, f"Failed to create biodata: {response.text}"
        data = response.json()
        assert "id" in data or "message" in data
        
        print(f"PASS: Created initial biodata")
        
        # Verify data persisted
        response = requests.get(f"{BASE_URL}/api/mahasiswa/biodata", headers=headers)
        verify_data = response.json()
        assert verify_data.get("biodata") is not None, "Biodata not persisted"
        print("PASS: Biodata persisted successfully")


class TestChangeRequestDetailAndReview:
    """Test change request detail and review endpoints"""
    
    def test_get_change_request_detail(self, admin_token):
        """Test GET /api/biodata/change-requests/{id} - Get change request detail"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get list to find a request ID
        response = requests.get(f"{BASE_URL}/api/biodata/change-requests", headers=headers)
        requests_list = response.json()
        
        if not requests_list:
            print("SKIP: No change requests to test detail")
            pytest.skip("No change requests available")
            return
        
        request_id = requests_list[0]["id"]
        
        # Get detail
        response = requests.get(
            f"{BASE_URL}/api/biodata/change-requests/{request_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get detail: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "id" in data
        assert "mahasiswa_id" in data
        assert "data_lama" in data
        assert "data_baru" in data
        assert "mahasiswa_nim" in data
        assert "mahasiswa_nama" in data
        
        print(f"PASS: Got change request detail - id={request_id}, mahasiswa={data.get('mahasiswa_nama')}")
        return data
    
    def test_get_nonexistent_request_detail(self, admin_token):
        """Test GET /api/biodata/change-requests/{id} with invalid ID"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/biodata/change-requests/nonexistent-id-12345",
            headers=headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Correctly returned 404 for nonexistent request")
    
    def test_review_invalid_action(self, admin_token):
        """Test PUT /api/biodata/change-requests/{id}/review with invalid action"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get list to find a pending request ID
        response = requests.get(
            f"{BASE_URL}/api/biodata/change-requests",
            params={"status": "pending"},
            headers=headers
        )
        pending_list = response.json()
        
        if not pending_list:
            print("SKIP: No pending change requests to test review")
            pytest.skip("No pending change requests available")
            return
        
        request_id = pending_list[0]["id"]
        
        # Try with invalid action
        response = requests.put(
            f"{BASE_URL}/api/biodata/change-requests/{request_id}/review",
            params={"action": "invalid_action"},
            headers=headers
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Correctly rejected invalid action")


class TestEdgeCases:
    """Test edge cases and validation"""
    
    def test_unauthorized_access(self):
        """Test endpoints without authentication"""
        # Mahasiswa endpoint
        response = requests.get(f"{BASE_URL}/api/mahasiswa/biodata")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        # Admin endpoint
        response = requests.get(f"{BASE_URL}/api/biodata/change-requests")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        print("PASS: Unauthorized access correctly denied")
    
    def test_invalid_token(self):
        """Test endpoints with invalid token"""
        headers = {"Authorization": "Bearer invalid_token_12345"}
        
        response = requests.get(f"{BASE_URL}/api/mahasiswa/biodata", headers=headers)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        print("PASS: Invalid token correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
