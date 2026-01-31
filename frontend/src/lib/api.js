import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (oldPassword, newPassword) => 
    api.put(`/auth/change-password?old_password=${oldPassword}&new_password=${newPassword}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Master Data - Tahun Akademik
export const tahunAkademikAPI = {
  getAll: () => api.get('/master/tahun-akademik'),
  getActive: () => api.get('/master/tahun-akademik/active'),
  create: (data) => api.post('/master/tahun-akademik', data),
  update: (id, data) => api.put(`/master/tahun-akademik/${id}`, data),
  delete: (id) => api.delete(`/master/tahun-akademik/${id}`),
};

// Master Data - Fakultas
export const fakultasAPI = {
  getAll: () => api.get('/master/fakultas'),
  create: (data) => api.post('/master/fakultas', data),
  update: (id, data) => api.put(`/master/fakultas/${id}`, data),
  delete: (id) => api.delete(`/master/fakultas/${id}`),
};

// Master Data - Prodi
export const prodiAPI = {
  getAll: (fakultasId = null) => api.get('/master/prodi', { params: { fakultas_id: fakultasId } }),
  create: (data) => api.post('/master/prodi', data),
  update: (id, data) => api.put(`/master/prodi/${id}`, data),
  delete: (id) => api.delete(`/master/prodi/${id}`),
};

// Master Data - Kurikulum
export const kurikulumAPI = {
  getAll: (prodiId = null) => api.get('/master/kurikulum', { params: { prodi_id: prodiId } }),
  create: (data) => api.post('/master/kurikulum', data),
  update: (id, data) => api.put(`/master/kurikulum/${id}`, data),
  delete: (id) => api.delete(`/master/kurikulum/${id}`),
};

// Master Data - Mata Kuliah
export const mataKuliahAPI = {
  getAll: (kurikulumId = null) => api.get('/master/mata-kuliah', { params: { kurikulum_id: kurikulumId } }),
  create: (data) => api.post('/master/mata-kuliah', data),
  update: (id, data) => api.put(`/master/mata-kuliah/${id}`, data),
  delete: (id) => api.delete(`/master/mata-kuliah/${id}`),
};

// Master Data - Mahasiswa
export const mahasiswaAPI = {
  getAll: (prodiId = null, status = null) => 
    api.get('/master/mahasiswa', { params: { prodi_id: prodiId, status } }),
  getById: (id) => api.get(`/master/mahasiswa/${id}`),
  create: (data) => api.post('/master/mahasiswa', data),
  update: (id, data) => api.put(`/master/mahasiswa/${id}`, data),
  delete: (id) => api.delete(`/master/mahasiswa/${id}`),
};

// Master Data - Dosen
export const dosenMasterAPI = {
  getAll: (prodiId = null) => api.get('/master/dosen', { params: { prodi_id: prodiId } }),
  create: (data) => api.post('/master/dosen', data),
  update: (id, data) => api.put(`/master/dosen/${id}`, data),
  delete: (id) => api.delete(`/master/dosen/${id}`),
};

// Akademik - Kelas
export const kelasAPI = {
  getAll: (tahunAkademikId = null) => 
    api.get('/akademik/kelas', { params: { tahun_akademik_id: tahunAkademikId } }),
  create: (data) => api.post('/akademik/kelas', data),
  update: (id, data) => api.put(`/akademik/kelas/${id}`, data),
  delete: (id) => api.delete(`/akademik/kelas/${id}`),
};

// Akademik - KRS (Admin)
export const krsAdminAPI = {
  getAll: (tahunAkademikId = null, status = null) =>
    api.get('/akademik/krs', { params: { tahun_akademik_id: tahunAkademikId, status } }),
  approve: (id) => api.put(`/akademik/krs/${id}/approve`),
  reject: (id) => api.put(`/akademik/krs/${id}/reject`),
};

// Mahasiswa - KRS
export const krsAPI = {
  getMyKRS: (tahunAkademikId = null) =>
    api.get('/mahasiswa/krs', { params: { tahun_akademik_id: tahunAkademikId } }),
  create: (kelasId) => api.post('/mahasiswa/krs', { kelas_id: kelasId }),
  delete: (id) => api.delete(`/mahasiswa/krs/${id}`),
  getKHS: (tahunAkademikId = null) =>
    api.get('/mahasiswa/khs', { params: { tahun_akademik_id: tahunAkademikId } }),
  getTranskrip: () => api.get('/mahasiswa/transkrip'),
  getProfile: () => api.get('/mahasiswa/profile'),
  getKelasTersedia: (tahunAkademikId = null) =>
    api.get('/mahasiswa/kelas-tersedia', { params: { tahun_akademik_id: tahunAkademikId } }),
};

// Dosen
export const dosenPortalAPI = {
  getMyKelas: (tahunAkademikId = null) =>
    api.get('/dosen/kelas', { params: { tahun_akademik_id: tahunAkademikId } }),
  getKelasMahasiswa: (kelasId) => api.get(`/dosen/kelas/${kelasId}/mahasiswa`),
  inputNilai: (data) => api.post('/dosen/nilai', data),
  // Dosen PA
  getMahasiswaBimbingan: () => api.get('/dosen/mahasiswa-bimbingan'),
  getKRSBimbingan: (tahunAkademikId = null, status = null) =>
    api.get('/dosen/krs-bimbingan', { params: { tahun_akademik_id: tahunAkademikId, status } }),
  // Presensi
  createPresensi: (data) => api.post('/dosen/presensi', data),
  getPresensiList: (kelasId) => api.get(`/dosen/presensi/${kelasId}`),
  getPresensiDetail: (presensiId) => api.get(`/dosen/presensi/${presensiId}/detail`),
  savePresensiDetail: (presensiId, details) => api.post(`/dosen/presensi/${presensiId}/detail`, details),
  getRekapPresensi: (kelasId) => api.get(`/dosen/presensi/${kelasId}/rekap`),
};

// Alias for dosenPortalAPI
export const dosenAPI = dosenPortalAPI;

// Jadwal Kuliah
export const jadwalAPI = {
  getAll: (tahunAkademikId = null, hari = null) =>
    api.get('/akademik/jadwal', { params: { tahun_akademik_id: tahunAkademikId, hari } }),
  create: (data) => api.post('/akademik/jadwal', data),
  update: (id, data) => api.put(`/akademik/jadwal/${id}`, data),
  checkConflict: (params) => api.get('/akademik/jadwal/check-conflict', { params }),
};

// Mahasiswa Jadwal & Presensi
export const mahasiswaJadwalAPI = {
  getMyJadwal: (tahunAkademikId = null) =>
    api.get('/mahasiswa/jadwal', { params: { tahun_akademik_id: tahunAkademikId } }),
  getMyPresensi: (kelasId = null) =>
    api.get('/mahasiswa/presensi', { params: { kelas_id: kelasId } }),
  getMyPresensiRekap: (tahunAkademikId = null) =>
    api.get('/mahasiswa/presensi/rekap', { params: { tahun_akademik_id: tahunAkademikId } }),
};

// Password Reset
export const passwordResetAPI = {
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
  generateResetToken: (id) => api.post(`/users/${id}/generate-reset-token`),
};

export default api;
