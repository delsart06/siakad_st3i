import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
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
import UserManagement from './pages/UserManagement';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
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
            
            {/* User Management */}
            <Route path="/users" element={<UserManagement />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
