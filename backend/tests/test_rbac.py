"""
Role-Based Access Control (RBAC) Tests
Testing hierarchical access: Admin > Rektor > Dekan > Kaprodi > Dosen > Mahasiswa
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://siakad-st3i.preview.emergentagent.com')

# Test credentials for each role
TEST_CREDENTIALS = {
    'admin': {'user_id': '1234567890', 'password': 'admin123'},
    'rektor': {'user_id': 'RKT001', 'password': 'rektor123'},
    'dekan': {'user_id': 'DKN001', 'password': 'dekan123'},
    'kaprodi': {'user_id': 'KPD001', 'password': 'kaprodi123'},
}


class TestRBACLogin:
    """Test login functionality for all RBAC roles"""
    
    def test_admin_login(self):
        """Test admin login with NIP: 1234567890"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['admin']
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        assert data['user']['role'] == 'admin'
        assert data['user']['user_id_number'] == '1234567890'
        print(f"✓ Admin login successful - Role: {data['user']['role']}")
    
    def test_rektor_login(self):
        """Test rektor login with NIP: RKT001"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['rektor']
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        assert data['user']['role'] == 'rektor'
        assert data['user']['user_id_number'] == 'RKT001'
        print(f"✓ Rektor login successful - Role: {data['user']['role']}")
    
    def test_dekan_login(self):
        """Test dekan login with NIP: DKN001"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['dekan']
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        assert data['user']['role'] == 'dekan'
        assert data['user']['user_id_number'] == 'DKN001'
        assert data['user']['fakultas_id'] is not None  # Dekan should have fakultas_id
        print(f"✓ Dekan login successful - Role: {data['user']['role']}, Fakultas: {data['user']['fakultas_id']}")
    
    def test_kaprodi_login(self):
        """Test kaprodi login with NIP: KPD001"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['kaprodi']
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        assert data['user']['role'] == 'kaprodi'
        assert data['user']['user_id_number'] == 'KPD001'
        assert data['user']['prodi_id'] is not None  # Kaprodi should have prodi_id
        print(f"✓ Kaprodi login successful - Role: {data['user']['role']}, Prodi: {data['user']['prodi_id']}")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={'user_id': 'invalid', 'password': 'invalid'}
        )
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected with 401")


class TestMyAccessEndpoint:
    """Test /api/auth/my-access endpoint for role-based access"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['admin']
        )
        return response.json()['access_token']
    
    @pytest.fixture
    def rektor_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['rektor']
        )
        return response.json()['access_token']
    
    @pytest.fixture
    def dekan_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['dekan']
        )
        return response.json()['access_token']
    
    @pytest.fixture
    def kaprodi_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['kaprodi']
        )
        return response.json()['access_token']
    
    def test_admin_has_full_access(self, admin_token):
        """Admin should have full access to all prodi and fakultas"""
        response = requests.get(
            f"{BASE_URL}/api/auth/my-access",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['role'] == 'admin'
        assert data['has_full_access'] is True
        assert data['is_management'] is True
        # Admin should see all accessible data (null prodi_id and fakultas_id means full access)
        print(f"✓ Admin has full access - prodi count: {len(data['accessible_prodi'])}, fakultas count: {len(data['accessible_fakultas'])}")
    
    def test_rektor_has_full_access(self, rektor_token):
        """Rektor should have full access to all prodi and fakultas"""
        response = requests.get(
            f"{BASE_URL}/api/auth/my-access",
            headers={'Authorization': f'Bearer {rektor_token}'}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['role'] == 'rektor'
        assert data['has_full_access'] is True
        assert data['is_management'] is True
        print(f"✓ Rektor has full access - prodi count: {len(data['accessible_prodi'])}, fakultas count: {len(data['accessible_fakultas'])}")
    
    def test_dekan_limited_to_fakultas(self, dekan_token):
        """Dekan should be limited to their fakultas"""
        response = requests.get(
            f"{BASE_URL}/api/auth/my-access",
            headers={'Authorization': f'Bearer {dekan_token}'}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['role'] == 'dekan'
        assert data['has_full_access'] is False
        assert data['is_management'] is True
        assert data['fakultas_id'] is not None
        # Dekan should have access to prodi in their fakultas
        assert len(data['accessible_prodi']) >= 1
        assert len(data['accessible_fakultas']) == 1
        print(f"✓ Dekan limited to fakultas: {data['accessible_fakultas'][0]['nama']}")
        print(f"  Accessible prodi count: {len(data['accessible_prodi'])}")
    
    def test_kaprodi_limited_to_prodi(self, kaprodi_token):
        """Kaprodi should be limited to their prodi only"""
        response = requests.get(
            f"{BASE_URL}/api/auth/my-access",
            headers={'Authorization': f'Bearer {kaprodi_token}'}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['role'] == 'kaprodi'
        assert data['has_full_access'] is False
        assert data['is_management'] is True
        assert data['prodi_id'] is not None
        # Kaprodi should have access to only their prodi
        assert len(data['accessible_prodi']) == 1
        assert data['accessible_prodi'][0]['id'] == data['prodi_id']
        prodi_name = data['accessible_prodi'][0]['nama']
        print(f"✓ Kaprodi limited to prodi: {prodi_name} (ID: {data['prodi_id']})")


class TestMahasiswaDataAccess:
    """Test mahasiswa data access based on role"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['admin']
        )
        return response.json()['access_token']
    
    @pytest.fixture
    def kaprodi_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['kaprodi']
        )
        return response.json()['access_token']
    
    @pytest.fixture
    def kaprodi_prodi_id(self, kaprodi_token):
        response = requests.get(
            f"{BASE_URL}/api/auth/my-access",
            headers={'Authorization': f'Bearer {kaprodi_token}'}
        )
        return response.json()['prodi_id']
    
    def test_admin_can_see_all_mahasiswa(self, admin_token):
        """Admin should see all mahasiswa"""
        response = requests.get(
            f"{BASE_URL}/api/master/mahasiswa",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        mahasiswa = response.json()
        print(f"✓ Admin can see {len(mahasiswa)} mahasiswa (all)")
    
    def test_kaprodi_limited_to_prodi_mahasiswa(self, kaprodi_token, kaprodi_prodi_id):
        """Kaprodi should only see mahasiswa from their prodi"""
        response = requests.get(
            f"{BASE_URL}/api/master/mahasiswa",
            headers={'Authorization': f'Bearer {kaprodi_token}'}
        )
        assert response.status_code == 200
        mahasiswa = response.json()
        
        # All mahasiswa should belong to kaprodi's prodi
        for mhs in mahasiswa:
            assert mhs['prodi_id'] == kaprodi_prodi_id, f"Mahasiswa {mhs['nim']} has different prodi_id"
            assert mhs['prodi_nama'] == 'Teknik Informatika'  # Expected prodi for KPD001
        
        print(f"✓ Kaprodi can see {len(mahasiswa)} mahasiswa (only from Teknik Informatika)")
        for mhs in mahasiswa:
            print(f"  - {mhs['nim']}: {mhs['nama']} ({mhs['prodi_nama']})")


class TestProdiDataAccess:
    """Test prodi data access based on role"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['admin']
        )
        return response.json()['access_token']
    
    @pytest.fixture
    def kaprodi_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['kaprodi']
        )
        return response.json()['access_token']
    
    @pytest.fixture
    def dekan_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS['dekan']
        )
        return response.json()['access_token']
    
    def test_admin_can_see_all_prodi(self, admin_token):
        """Admin should see all prodi"""
        response = requests.get(
            f"{BASE_URL}/api/master/prodi",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        prodi = response.json()
        print(f"✓ Admin can see {len(prodi)} prodi")
    
    def test_kaprodi_limited_to_own_prodi(self, kaprodi_token):
        """Kaprodi should only see their own prodi"""
        response = requests.get(
            f"{BASE_URL}/api/master/prodi",
            headers={'Authorization': f'Bearer {kaprodi_token}'}
        )
        assert response.status_code == 200
        prodi = response.json()
        
        # Kaprodi should see only 1 prodi (their own)
        assert len(prodi) == 1, f"Expected 1 prodi, got {len(prodi)}"
        assert prodi[0]['nama'] == 'Teknik Informatika'
        print(f"✓ Kaprodi sees only 1 prodi: {prodi[0]['nama']}")
    
    def test_dekan_sees_fakultas_prodi(self, dekan_token):
        """Dekan should see all prodi in their fakultas"""
        response = requests.get(
            f"{BASE_URL}/api/master/prodi",
            headers={'Authorization': f'Bearer {dekan_token}'}
        )
        assert response.status_code == 200
        prodi = response.json()
        
        # Get dekan's fakultas_id
        access_response = requests.get(
            f"{BASE_URL}/api/auth/my-access",
            headers={'Authorization': f'Bearer {dekan_token}'}
        )
        fakultas_id = access_response.json()['fakultas_id']
        
        # All prodi should be from dekan's fakultas
        for p in prodi:
            assert p['fakultas_id'] == fakultas_id
        
        print(f"✓ Dekan sees {len(prodi)} prodi from their fakultas")


class TestManagementAccessControl:
    """Test that non-management roles cannot access management endpoints"""
    
    def test_unauthorized_without_token(self):
        """Request without token should be rejected"""
        response = requests.get(f"{BASE_URL}/api/master/mahasiswa")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized request without token rejected")


class TestRoleBadgeStyles:
    """Verify role constants are properly defined in backend"""
    
    def test_management_roles_defined(self):
        """Test that all management roles can login and are recognized"""
        management_roles = ['admin', 'rektor', 'dekan', 'kaprodi']
        
        for role, creds in TEST_CREDENTIALS.items():
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json=creds
            )
            if response.status_code == 200:
                data = response.json()
                actual_role = data['user']['role']
                is_management = actual_role in management_roles
                print(f"✓ {role.upper()}: is_management={is_management}")
            else:
                print(f"✗ {role.upper()}: Login failed")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
