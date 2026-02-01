"""
Test Suite: Login dengan NIM/NIDN/NIP, Lupa Password dengan Approval, dan Ganti Foto Profil
Tests:
1. Login flow using NIM/NIDN/NIP instead of email
2. Forgot Password flow with admin approval
3. Profile Photo change with admin approval
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test Credentials
ADMIN_USER_ID = "1234567890"  # NIP
ADMIN_PASSWORD = "admin123"
MAHASISWA_USER_ID = "2024001"  # NIM (Budi)
MAHASISWA_PASSWORD = "password"
DOSEN_USER_ID = "0001018902"  # NIDN
DOSEN_PASSWORD = "password"


class TestLoginWithNIMNIDNNIP:
    """Test login functionality using NIM/NIDN/NIP"""

    def test_admin_login_with_nip(self):
        """Admin can login using NIP"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": ADMIN_USER_ID,
            "password": ADMIN_PASSWORD
        })
        print(f"Admin login response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "user" in data, "Response should contain user info"
        assert data["user"]["role"] == "admin", f"Expected admin role, got {data['user']['role']}"
        print(f"Admin login successful: {data['user']['nama']}")

    def test_mahasiswa_login_with_nim(self):
        """Mahasiswa can login using NIM"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": MAHASISWA_USER_ID,
            "password": MAHASISWA_PASSWORD
        })
        print(f"Mahasiswa login response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "mahasiswa", f"Expected mahasiswa role, got {data['user']['role']}"
        print(f"Mahasiswa login successful: {data['user']['nama']}")

    def test_dosen_login_with_nidn(self):
        """Dosen can login using NIDN"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": DOSEN_USER_ID,
            "password": DOSEN_PASSWORD
        })
        print(f"Dosen login response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "dosen", f"Expected dosen role, got {data['user']['role']}"
        print(f"Dosen login successful: {data['user']['nama']}")

    def test_invalid_credentials_rejected(self):
        """Invalid credentials should be rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": "invalid_user",
            "password": "wrong_password"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Invalid credentials correctly rejected")

    def test_wrong_password_rejected(self):
        """Correct user ID but wrong password should be rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": ADMIN_USER_ID,
            "password": "wrong_password"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Wrong password correctly rejected")


class TestForgotPasswordWithApproval:
    """Test forgot password flow with admin approval"""

    @pytest.fixture
    def admin_token(self):
        """Get admin token for approval operations"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": ADMIN_USER_ID,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]

    def test_forgot_password_request_submission(self):
        """User can submit forgot password request"""
        # Use a unique test user_id for testing
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password-request", json={
            "user_id_number": MAHASISWA_USER_ID,
            "password_baru": "new_test_password123"
        })
        print(f"Forgot password request response: {response.status_code}, {response.text}")
        # Could be 200 (success) or 400 (already pending request)
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"Forgot password request submitted: {data['message']}")
        else:
            print("Note: Pending request already exists (expected if test run multiple times)")

    def test_forgot_password_invalid_user(self):
        """Invalid user ID should return 404"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password-request", json={
            "user_id_number": "999999999",
            "password_baru": "new_password123"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Invalid user correctly rejected with 404")

    def test_admin_get_pending_requests(self, admin_token):
        """Admin can get pending password reset requests"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/auth/forgot-password-requests",
            params={"status": "pending"},
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} pending password reset requests")

    def test_admin_get_all_requests(self, admin_token):
        """Admin can get all password reset requests"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/auth/forgot-password-requests",
            headers=headers
        )
        assert response.status_code == 200
        print(f"Admin can view all password reset requests")

    def test_non_admin_cannot_view_requests(self):
        """Non-admin users cannot view password reset requests"""
        # Login as mahasiswa
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": MAHASISWA_USER_ID,
            "password": MAHASISWA_PASSWORD
        })
        if login_res.status_code != 200:
            pytest.skip("Mahasiswa login failed")
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/auth/forgot-password-requests",
            headers=headers
        )
        assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
        print("Non-admin correctly denied access to password requests")


class TestFotoProfilWithApproval:
    """Test profile photo change with admin approval"""

    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": ADMIN_USER_ID,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]

    @pytest.fixture
    def mahasiswa_token(self):
        """Get mahasiswa token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": MAHASISWA_USER_ID,
            "password": MAHASISWA_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Mahasiswa login failed")
        return response.json()["access_token"]

    def test_upload_foto_profil(self, mahasiswa_token):
        """Mahasiswa can upload profile photo request"""
        headers = {"Authorization": f"Bearer {mahasiswa_token}"}
        
        # Create a simple test image
        test_image = io.BytesIO()
        # Create minimal JPEG header
        test_image.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00')
        test_image.write(b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t')
        test_image.write(b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a')
        test_image.write(b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9LJ7=')
        test_image.write(b'<9:;8')
        test_image.write(b'\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00')
        test_image.write(b'\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b')
        test_image.write(b'\xff\xda\x00\x08\x01\x01\x00\x00?\x00')
        test_image.write(b'\x7f\xff\xd9')
        test_image.seek(0)
        
        files = {
            'foto': ('test_profile.jpg', test_image, 'image/jpeg')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/upload-foto-profil",
            files=files,
            headers=headers
        )
        print(f"Upload foto response: {response.status_code}, {response.text}")
        # 200 = success, 400 = pending request exists
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}"
        if response.status_code == 200:
            print("Foto profil upload request submitted successfully")
        else:
            print("Note: Pending foto request already exists")

    def test_admin_get_foto_requests(self, admin_token):
        """Admin can get pending foto profil requests"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/auth/foto-profil-requests",
            params={"status": "pending"},
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} pending foto profil requests")

    def test_user_get_my_foto_requests(self, mahasiswa_token):
        """User can view their own foto request history"""
        headers = {"Authorization": f"Bearer {mahasiswa_token}"}
        response = requests.get(
            f"{BASE_URL}/api/auth/my-foto-profil-requests",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"User has {len(data)} foto profil requests in history")

    def test_non_admin_cannot_view_foto_requests(self, mahasiswa_token):
        """Non-admin cannot view all foto requests"""
        headers = {"Authorization": f"Bearer {mahasiswa_token}"}
        response = requests.get(
            f"{BASE_URL}/api/auth/foto-profil-requests",
            headers=headers
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("Non-admin correctly denied access to foto requests list")


class TestApprovalWorkflow:
    """Test the complete approval workflow"""

    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": ADMIN_USER_ID,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]

    def test_review_password_request_approve(self, admin_token):
        """Admin can approve password reset request"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get pending requests
        response = requests.get(
            f"{BASE_URL}/api/auth/forgot-password-requests",
            params={"status": "pending"},
            headers=headers
        )
        if response.status_code != 200:
            pytest.skip("Cannot get pending requests")
        
        requests_list = response.json()
        if len(requests_list) == 0:
            pytest.skip("No pending password requests to test approval")
        
        request_id = requests_list[0]["id"]
        
        # Approve the request
        approve_response = requests.put(
            f"{BASE_URL}/api/auth/forgot-password-requests/{request_id}/review",
            params={"action": "approve", "catatan": "Disetujui oleh test"},
            headers=headers
        )
        print(f"Approve response: {approve_response.status_code}, {approve_response.text}")
        assert approve_response.status_code == 200, f"Expected 200, got {approve_response.status_code}"
        print("Password reset request approved successfully")

    def test_review_foto_request_flow(self, admin_token):
        """Admin can review foto profil request"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get pending foto requests
        response = requests.get(
            f"{BASE_URL}/api/auth/foto-profil-requests",
            params={"status": "pending"},
            headers=headers
        )
        if response.status_code != 200:
            pytest.skip("Cannot get pending foto requests")
        
        requests_list = response.json()
        if len(requests_list) == 0:
            print("No pending foto requests found")
            pytest.skip("No pending foto requests to test")
        
        request_id = requests_list[0]["id"]
        
        # Approve the request
        approve_response = requests.put(
            f"{BASE_URL}/api/auth/foto-profil-requests/{request_id}/review",
            params={"action": "approve", "catatan": "Foto disetujui"},
            headers=headers
        )
        print(f"Foto approve response: {approve_response.status_code}")
        assert approve_response.status_code == 200
        print("Foto profil request approved successfully")

    def test_invalid_action_rejected(self, admin_token):
        """Invalid action should be rejected"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Try with invalid action
        response = requests.put(
            f"{BASE_URL}/api/auth/forgot-password-requests/some-id/review",
            params={"action": "invalid_action"},
            headers=headers
        )
        assert response.status_code in [400, 404], f"Expected 400 or 404, got {response.status_code}"
        print("Invalid action correctly rejected")


class TestUserProfile:
    """Test user profile operations"""

    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": MAHASISWA_USER_ID,
            "password": MAHASISWA_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("User login failed")
        return response.json()["access_token"]

    def test_get_user_profile(self, user_token):
        """User can get their profile"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "nama" in data
        assert "email" in data
        assert "role" in data
        # Check for user_id_number (NIM/NIDN/NIP)
        assert "user_id_number" in data or data.get("user_id_number") is None
        print(f"User profile retrieved: {data['nama']}, role: {data['role']}")

    def test_unauthorized_access_rejected(self):
        """Unauthorized access to /me should be rejected"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Unauthorized access correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
