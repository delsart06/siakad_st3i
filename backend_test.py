import requests
import sys
import json
from datetime import datetime

class SIAKADAPITester:
    def __init__(self, base_url="https://kampus-digital-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_items = {
            'tahun_akademik': [],
            'fakultas': [],
            'prodi': [],
            'mahasiswa': [],
            'dosen': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

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

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@siakad.ac.id", "password": "admin123"},
            description="Login with default admin credentials"
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            description="Get dashboard statistics"
        )
        if success:
            print(f"   Stats: Mahasiswa={response.get('total_mahasiswa', 0)}, Dosen={response.get('total_dosen', 0)}")
        return success

    def test_tahun_akademik_crud(self):
        """Test Tahun Akademik CRUD operations"""
        print("\n📚 Testing Tahun Akademik CRUD...")
        
        # Create
        ta_data = {
            "tahun": "2024/2025",
            "semester": "Ganjil",
            "is_active": True,
            "tanggal_mulai": "2024-08-01",
            "tanggal_selesai": "2024-12-31"
        }
        success, response = self.run_test(
            "Create Tahun Akademik",
            "POST",
            "master/tahun-akademik",
            200,
            data=ta_data,
            description="Create new academic year"
        )
        if success and 'id' in response:
            ta_id = response['id']
            self.created_items['tahun_akademik'].append(ta_id)
            
            # Read
            self.run_test(
                "Get Tahun Akademik List",
                "GET",
                "master/tahun-akademik",
                200,
                description="Get all academic years"
            )
            
            # Update
            updated_data = ta_data.copy()
            updated_data['semester'] = 'Genap'
            self.run_test(
                "Update Tahun Akademik",
                "PUT",
                f"master/tahun-akademik/{ta_id}",
                200,
                data=updated_data,
                description="Update academic year"
            )
            
            return True
        return False

    def test_fakultas_crud(self):
        """Test Fakultas CRUD operations"""
        print("\n🏢 Testing Fakultas CRUD...")
        
        # Create
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
            description="Create new faculty"
        )
        if success and 'id' in response:
            fak_id = response['id']
            self.created_items['fakultas'].append(fak_id)
            
            # Read
            self.run_test(
                "Get Fakultas List",
                "GET",
                "master/fakultas",
                200,
                description="Get all faculties"
            )
            
            return True
        return False

    def test_prodi_crud(self):
        """Test Program Studi CRUD operations"""
        print("\n🎓 Testing Program Studi CRUD...")
        
        if not self.created_items['fakultas']:
            print("❌ Skipping Prodi test - No fakultas created")
            return False
            
        # Create
        prodi_data = {
            "kode": "TI",
            "nama": "Teknik Informatika",
            "fakultas_id": self.created_items['fakultas'][0],
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
            description="Create new study program"
        )
        if success and 'id' in response:
            prodi_id = response['id']
            self.created_items['prodi'].append(prodi_id)
            
            # Read
            self.run_test(
                "Get Prodi List",
                "GET",
                "master/prodi",
                200,
                description="Get all study programs"
            )
            
            return True
        return False

    def test_mata_kuliah_crud(self):
        """Test Mata Kuliah operations"""
        print("\n📖 Testing Mata Kuliah...")
        
        success, response = self.run_test(
            "Get Mata Kuliah List",
            "GET",
            "master/mata-kuliah",
            200,
            description="Get all courses"
        )
        return success

    def test_mahasiswa_crud(self):
        """Test Mahasiswa CRUD operations"""
        print("\n👨‍🎓 Testing Mahasiswa CRUD...")
        
        if not self.created_items['prodi']:
            print("❌ Skipping Mahasiswa test - No prodi created")
            return False
            
        # Create
        mhs_data = {
            "nim": "2024001",
            "nama": "Test Mahasiswa",
            "email": "test.mahasiswa@test.ac.id",
            "prodi_id": self.created_items['prodi'][0],
            "tahun_masuk": "2024",
            "password": "password123",
            "status": "aktif"
        }
        success, response = self.run_test(
            "Create Mahasiswa",
            "POST",
            "master/mahasiswa",
            200,
            data=mhs_data,
            description="Create new student"
        )
        if success and 'id' in response:
            mhs_id = response['id']
            self.created_items['mahasiswa'].append(mhs_id)
            
            # Read
            self.run_test(
                "Get Mahasiswa List",
                "GET",
                "master/mahasiswa",
                200,
                description="Get all students"
            )
            
            return True
        return False

    def test_dosen_crud(self):
        """Test Dosen CRUD operations"""
        print("\n👨‍🏫 Testing Dosen CRUD...")
        
        # Create
        dosen_data = {
            "nidn": "1234567890",
            "nama": "Test Dosen",
            "email": "test.dosen@test.ac.id",
            "password": "password123",
            "status": "aktif"
        }
        success, response = self.run_test(
            "Create Dosen",
            "POST",
            "master/dosen",
            200,
            data=dosen_data,
            description="Create new lecturer"
        )
        if success and 'id' in response:
            dosen_id = response['id']
            self.created_items['dosen'].append(dosen_id)
            
            # Read
            self.run_test(
                "Get Dosen List",
                "GET",
                "master/dosen",
                200,
                description="Get all lecturers"
            )
            
            return True
        return False

    def test_kelas_operations(self):
        """Test Kelas (Penawaran) operations"""
        print("\n📚 Testing Penawaran Kelas...")
        
        success, response = self.run_test(
            "Get Kelas List",
            "GET",
            "akademik/kelas",
            200,
            description="Get all class offerings"
        )
        return success

    def cleanup_created_items(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order to handle dependencies
        for mhs_id in self.created_items['mahasiswa']:
            self.run_test(f"Delete Mahasiswa {mhs_id}", "DELETE", f"master/mahasiswa/{mhs_id}", 200)
            
        for dosen_id in self.created_items['dosen']:
            self.run_test(f"Delete Dosen {dosen_id}", "DELETE", f"master/dosen/{dosen_id}", 200)
            
        for prodi_id in self.created_items['prodi']:
            self.run_test(f"Delete Prodi {prodi_id}", "DELETE", f"master/prodi/{prodi_id}", 200)
            
        for fak_id in self.created_items['fakultas']:
            self.run_test(f"Delete Fakultas {fak_id}", "DELETE", f"master/fakultas/{fak_id}", 200)
            
        for ta_id in self.created_items['tahun_akademik']:
            self.run_test(f"Delete Tahun Akademik {ta_id}", "DELETE", f"master/tahun-akademik/{ta_id}", 200)

def main():
    print("🚀 Starting SIAKAD API Testing...")
    print("=" * 50)
    
    tester = SIAKADAPITester()
    
    # Test sequence
    tests = [
        ("Login", tester.test_login),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Tahun Akademik CRUD", tester.test_tahun_akademik_crud),
        ("Fakultas CRUD", tester.test_fakultas_crud),
        ("Program Studi CRUD", tester.test_prodi_crud),
        ("Mata Kuliah", tester.test_mata_kuliah_crud),
        ("Mahasiswa CRUD", tester.test_mahasiswa_crud),
        ("Dosen CRUD", tester.test_dosen_crud),
        ("Penawaran Kelas", tester.test_kelas_operations),
    ]
    
    # Run tests
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test {test_name} failed with exception: {str(e)}")
            tester.failed_tests.append({
                'name': test_name,
                'error': str(e)
            })
    
    # Cleanup
    tester.cleanup_created_items()
    
    # Print results
    print(f"\n{'='*50}")
    print(f"📊 Test Results:")
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