import requests
import sys
import json
from datetime import datetime

class PortalMahasiswaAPITester:
    def __init__(self, base_url="https://siakad-st3i.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.mahasiswa_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_items = {
            'tahun_akademik': [],
            'fakultas': [],
            'prodi': [],
            'mahasiswa': [],
            'dosen': [],
            'kurikulum': [],
            'mata_kuliah': [],
            'kelas': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        if description:
            print(f"   Description: {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def setup_test_data(self):
        """Setup required test data: fakultas, prodi, tahun akademik aktif"""
        print("\n🏗️ Setting up test data...")
        
        # Login as admin
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@siakad.ac.id", "password": "admin123"},
            description="Login with admin credentials"
        )
        if not success or 'access_token' not in response:
            return False
        
        self.admin_token = response['access_token']
        
        # Create Tahun Akademik Aktif
        ta_data = {
            "tahun": "2024/2025",
            "semester": "Ganjil",
            "is_active": True,
            "tanggal_mulai": "2024-08-01",
            "tanggal_selesai": "2024-12-31"
        }
        success, response = self.run_test(
            "Create Active Tahun Akademik",
            "POST",
            "master/tahun-akademik",
            200,
            data=ta_data,
            token=self.admin_token,
            description="Create active academic year"
        )
        if success and 'id' in response:
            self.created_items['tahun_akademik'].append(response['id'])
        
        # Create Fakultas
        fak_data = {
            "kode": "FT",
            "nama": "Fakultas Teknik",
            "dekan": "Prof. Dr. Test Dekan"
        }
        success, response = self.run_test(
            "Create Fakultas",
            "POST",
            "master/fakultas",
            200,
            data=fak_data,
            token=self.admin_token,
            description="Create faculty for testing"
        )
        if success and 'id' in response:
            fakultas_id = response['id']
            self.created_items['fakultas'].append(fakultas_id)
            
            # Create Program Studi
            prodi_data = {
                "kode": "TI",
                "nama": "Teknik Informatika",
                "fakultas_id": fakultas_id,
                "jenjang": "S1",
                "akreditasi": "A",
                "kaprodi": "Dr. Test Kaprodi"
            }
            success, response = self.run_test(
                "Create Program Studi",
                "POST",
                "master/prodi",
                200,
                data=prodi_data,
                token=self.admin_token,
                description="Create study program for testing"
            )
            if success and 'id' in response:
                self.created_items['prodi'].append(response['id'])
                return True
        
        return False

    def test_create_mahasiswa(self):
        """Test creating mahasiswa via admin"""
        print("\n👨‍🎓 Testing Mahasiswa Creation...")
        
        if not self.created_items['prodi']:
            print("❌ No prodi available for mahasiswa creation")
            return False
            
        # Create mahasiswa
        mhs_data = {
            "nim": "2024001001",
            "nama": "Test Portal Mahasiswa",
            "email": "portal.mahasiswa@test.ac.id",
            "prodi_id": self.created_items['prodi'][0],
            "tahun_masuk": "2024",
            "password": "mahasiswa123",
            "status": "aktif",
            "jenis_kelamin": "L",
            "tempat_lahir": "Jakarta",
            "tanggal_lahir": "2000-01-01",
            "alamat": "Jl. Test No. 123",
            "no_hp": "081234567890"
        }
        success, response = self.run_test(
            "Create Test Mahasiswa",
            "POST",
            "master/mahasiswa",
            200,
            data=mhs_data,
            token=self.admin_token,
            description="Create mahasiswa for portal testing"
        )
        if success and 'id' in response:
            self.created_items['mahasiswa'].append(response['id'])
            return True
        return False

    def test_mahasiswa_login(self):
        """Test mahasiswa login"""
        print("\n🔐 Testing Mahasiswa Login...")
        
        success, response = self.run_test(
            "Mahasiswa Login",
            "POST",
            "auth/login",
            200,
            data={"email": "portal.mahasiswa@test.ac.id", "password": "mahasiswa123"},
            description="Login as created mahasiswa"
        )
        if success and 'access_token' in response:
            self.mahasiswa_token = response['access_token']
            print(f"   Mahasiswa logged in successfully")
            print(f"   User: {response.get('user', {}).get('nama', 'Unknown')}")
            print(f"   Role: {response.get('user', {}).get('role', 'Unknown')}")
            return True
        return False

    def test_mahasiswa_profile(self):
        """Test mahasiswa profile endpoint"""
        success, response = self.run_test(
            "Get Mahasiswa Profile",
            "GET",
            "mahasiswa/profile",
            200,
            token=self.mahasiswa_token,
            description="Get mahasiswa profile data"
        )
        if success:
            print(f"   Profile: {response.get('nama', 'Unknown')} - {response.get('nim', 'Unknown')}")
            print(f"   Prodi: {response.get('prodi_nama', 'Unknown')}")
        return success

    def test_krs_endpoints(self):
        """Test KRS related endpoints"""
        print("\n📋 Testing KRS Endpoints...")
        
        # Get active tahun akademik
        if not self.created_items['tahun_akademik']:
            print("❌ No active tahun akademik for KRS testing")
            return False
            
        ta_id = self.created_items['tahun_akademik'][0]
        
        # Test get my KRS (should be empty initially)
        success, response = self.run_test(
            "Get My KRS",
            "GET",
            f"mahasiswa/krs?tahun_akademik_id={ta_id}",
            200,
            token=self.mahasiswa_token,
            description="Get mahasiswa KRS for active semester"
        )
        if success:
            print(f"   Current KRS count: {len(response)}")
        
        # Test get available kelas
        success2, response2 = self.run_test(
            "Get Available Kelas",
            "GET",
            f"mahasiswa/kelas-tersedia?tahun_akademik_id={ta_id}",
            200,
            token=self.mahasiswa_token,
            description="Get available classes for enrollment"
        )
        if success2:
            print(f"   Available classes: {len(response2)}")
        
        return success and success2

    def test_khs_endpoint(self):
        """Test KHS endpoint"""
        print("\n📊 Testing KHS Endpoint...")
        
        if not self.created_items['tahun_akademik']:
            print("❌ No tahun akademik for KHS testing")
            return False
            
        ta_id = self.created_items['tahun_akademik'][0]
        
        success, response = self.run_test(
            "Get KHS",
            "GET",
            f"mahasiswa/khs?tahun_akademik_id={ta_id}",
            200,
            token=self.mahasiswa_token,
            description="Get KHS for specific semester"
        )
        if success:
            print(f"   KHS data retrieved successfully")
            print(f"   Total SKS: {response.get('total_sks', 0)}")
            print(f"   IPS: {response.get('ips', 0)}")
            print(f"   Nilai count: {len(response.get('nilai', []))}")
        return success

    def test_transkrip_endpoint(self):
        """Test Transkrip endpoint"""
        print("\n🎓 Testing Transkrip Endpoint...")
        
        success, response = self.run_test(
            "Get Transkrip",
            "GET",
            "mahasiswa/transkrip",
            200,
            token=self.mahasiswa_token,
            description="Get complete academic transcript"
        )
        if success:
            print(f"   Transkrip data retrieved successfully")
            mahasiswa_data = response.get('mahasiswa', {})
            print(f"   Student: {mahasiswa_data.get('nama', 'Unknown')} - {mahasiswa_data.get('nim', 'Unknown')}")
            print(f"   Program: {mahasiswa_data.get('prodi', 'Unknown')}")
            print(f"   Total SKS: {response.get('total_sks', 0)}")
            print(f"   IPK: {response.get('ipk', 0)}")
            print(f"   Total courses: {len(response.get('nilai', []))}")
        return success

    def test_tahun_akademik_list(self):
        """Test getting tahun akademik list for mahasiswa"""
        success, response = self.run_test(
            "Get Tahun Akademik List (Mahasiswa)",
            "GET",
            "master/tahun-akademik",
            200,
            token=self.mahasiswa_token,
            description="Get academic years list as mahasiswa"
        )
        if success:
            print(f"   Available academic years: {len(response)}")
            active_count = len([ta for ta in response if ta.get('is_active')])
            print(f"   Active academic years: {active_count}")
        return success

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order to handle dependencies
        for mhs_id in self.created_items['mahasiswa']:
            self.run_test(f"Delete Mahasiswa {mhs_id}", "DELETE", f"master/mahasiswa/{mhs_id}", 200, token=self.admin_token)
            
        for prodi_id in self.created_items['prodi']:
            self.run_test(f"Delete Prodi {prodi_id}", "DELETE", f"master/prodi/{prodi_id}", 200, token=self.admin_token)
            
        for fak_id in self.created_items['fakultas']:
            self.run_test(f"Delete Fakultas {fak_id}", "DELETE", f"master/fakultas/{fak_id}", 200, token=self.admin_token)
            
        for ta_id in self.created_items['tahun_akademik']:
            self.run_test(f"Delete Tahun Akademik {ta_id}", "DELETE", f"master/tahun-akademik/{ta_id}", 200, token=self.admin_token)

def main():
    print("🚀 Starting Portal Mahasiswa API Testing...")
    print("=" * 60)
    
    tester = PortalMahasiswaAPITester()
    
    # Test sequence
    tests = [
        ("Setup Test Data", tester.setup_test_data),
        ("Create Mahasiswa", tester.test_create_mahasiswa),
        ("Mahasiswa Login", tester.test_mahasiswa_login),
        ("Mahasiswa Profile", tester.test_mahasiswa_profile),
        ("Tahun Akademik List", tester.test_tahun_akademik_list),
        ("KRS Endpoints", tester.test_krs_endpoints),
        ("KHS Endpoint", tester.test_khs_endpoint),
        ("Transkrip Endpoint", tester.test_transkrip_endpoint),
    ]
    
    # Run tests
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            if not result:
                print(f"❌ Test {test_name} failed")
        except Exception as e:
            print(f"❌ Test {test_name} failed with exception: {str(e)}")
            tester.failed_tests.append({
                'name': test_name,
                'error': str(e)
            })
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Print results
    print(f"\n{'='*60}")
    print(f"📊 Portal Mahasiswa Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {len(tester.failed_tests)}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"   {i}. {failure['name']}")
            if 'error' in failure:
                print(f"      Error: {failure['error']}")
            else:
                print(f"      Expected: {failure.get('expected')}, Got: {failure.get('actual')}")
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())