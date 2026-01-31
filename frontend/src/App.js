import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import TahunAkademik from './pages/master/TahunAkademik';
import Fakultas from './pages/master/Fakultas';
import Prodi from './pages/master/Prodi';
import Kurikulum from './pages/master/Kurikulum';
import MataKuliah from './pages/master/MataKuliah';
import Mahasiswa from './pages/master/Mahasiswa';
import Dosen from './pages/master/Dosen';
import Kelas from './pages/akademik/Kelas';
import ValidasiKRS from './pages/akademik/ValidasiKRS';
import JadwalKuliah from './pages/akademik/JadwalKuliah';
import UserManagement from './pages/UserManagement';
import KRSPage from './pages/mahasiswa/KRSPage';
import KHSPage from './pages/mahasiswa/KHSPage';
import TranskripPage from './pages/mahasiswa/TranskripPage';
import JadwalPage from './pages/mahasiswa/JadwalPage';
import PresensiPage from './pages/mahasiswa/PresensiPage';
import ValidasiKRSDosenPA from './pages/dosen/ValidasiKRSDosenPA';
import KelasSaya from './pages/dosen/KelasSaya';
import InputNilai from './pages/dosen/InputNilai';
import DaftarMahasiswa from './pages/dosen/DaftarMahasiswa';
import Presensi from './pages/dosen/Presensi';
import ManajemenTagihan from './pages/keuangan/ManajemenTagihan';
import VerifikasiPembayaran from './pages/keuangan/VerifikasiPembayaran';
import KeuanganPage from './pages/mahasiswa/KeuanganPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Master Data */}
            <Route path="/master/tahun-akademik" element={<TahunAkademik />} />
            <Route path="/master/fakultas" element={<Fakultas />} />
            <Route path="/master/prodi" element={<Prodi />} />
            <Route path="/master/kurikulum" element={<Kurikulum />} />
            <Route path="/master/mata-kuliah" element={<MataKuliah />} />
            <Route path="/master/mahasiswa" element={<Mahasiswa />} />
            <Route path="/master/dosen" element={<Dosen />} />
            
            {/* Akademik */}
            <Route path="/akademik/kelas" element={<Kelas />} />
            <Route path="/akademik/krs" element={<ValidasiKRS />} />
            <Route path="/akademik/jadwal" element={<JadwalKuliah />} />
            
            {/* User Management */}
            <Route path="/users" element={<UserManagement />} />
            
            {/* Keuangan (Admin) */}
            <Route path="/keuangan/tagihan" element={<ManajemenTagihan />} />
            <Route path="/keuangan/pembayaran" element={<VerifikasiPembayaran />} />
            
            {/* Mahasiswa Portal */}
            <Route path="/mahasiswa/krs" element={<KRSPage />} />
            <Route path="/mahasiswa/khs" element={<KHSPage />} />
            <Route path="/mahasiswa/transkrip" element={<TranskripPage />} />
            <Route path="/mahasiswa/jadwal" element={<JadwalPage />} />
            <Route path="/mahasiswa/presensi" element={<PresensiPage />} />
            <Route path="/mahasiswa/keuangan" element={<KeuanganPage />} />
            
            {/* Dosen Portal */}
            <Route path="/dosen/kelas" element={<KelasSaya />} />
            <Route path="/dosen/validasi-krs-pa" element={<ValidasiKRSDosenPA />} />
            <Route path="/dosen/nilai" element={<InputNilai />} />
            <Route path="/dosen/mahasiswa" element={<DaftarMahasiswa />} />
            <Route path="/dosen/presensi" element={<Presensi />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
