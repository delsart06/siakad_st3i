import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { Sheet, SheetContent } from '../ui/sheet';
import { Toaster } from '../ui/sonner';

const pageTitles = {
  '/': 'Dashboard',
  '/master/tahun-akademik': 'Tahun Akademik',
  '/master/fakultas': 'Fakultas',
  '/master/prodi': 'Program Studi',
  '/master/kurikulum': 'Kurikulum',
  '/master/mata-kuliah': 'Mata Kuliah',
  '/master/mahasiswa': 'Mahasiswa',
  '/master/dosen': 'Dosen',
  '/akademik/kelas': 'Penawaran Kelas',
  '/akademik/krs': 'Validasi KRS',
  '/users': 'Manajemen User',
  '/mahasiswa/krs': 'Kartu Rencana Studi',
  '/mahasiswa/khs': 'Kartu Hasil Studi',
  '/mahasiswa/transkrip': 'Transkrip Nilai',
  '/dosen/kelas': 'Kelas Saya',
  '/dosen/nilai': 'Input Nilai',
};

const DashboardLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1e1b4b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const pageTitle = pageTitles[location.pathname] || 'SIAKAD';

  return (
    <div className="flex h-screen bg-slate-50" data-testid="dashboard-layout">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-[#1e1b4b]">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setMobileMenuOpen(true)} 
          title={pageTitle}
        />
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </div>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
};

export default DashboardLayout;
