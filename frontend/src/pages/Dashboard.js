import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Building2,
  Calendar,
  TrendingUp,
  UserCheck,
  FileText,
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, description }) => (
  <Card className="shadow-card hover:-translate-y-1 transition-transform duration-200">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800 tabular-nums">{value}</p>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#1e1b4b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Selamat Datang, {user?.nama}! 👋
        </h2>
        <p className="text-indigo-200">
          {user?.role === 'admin' && 'Kelola data akademik universitas dengan mudah'}
          {user?.role === 'mahasiswa' && 'Akses informasi akademik Anda di sini'}
          {user?.role === 'dosen' && 'Kelola kelas dan nilai mahasiswa Anda'}
        </p>
        {stats?.tahun_akademik_aktif && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Tahun Akademik Aktif: <strong>{stats.tahun_akademik_aktif}</strong></span>
          </div>
        )}
      </div>

      {/* Stats Grid - Admin */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Mahasiswa"
            value={stats?.total_mahasiswa || 0}
            icon={GraduationCap}
            color="bg-blue-500"
            description="Semua mahasiswa terdaftar"
          />
          <StatCard
            title="Mahasiswa Aktif"
            value={stats?.mahasiswa_aktif || 0}
            icon={UserCheck}
            color="bg-emerald-500"
            description="Status aktif"
          />
          <StatCard
            title="Total Dosen"
            value={stats?.total_dosen || 0}
            icon={Users}
            color="bg-violet-500"
            description="Dosen terdaftar"
          />
          <StatCard
            title="Program Studi"
            value={stats?.total_prodi || 0}
            icon={Building2}
            color="bg-amber-500"
            description="Prodi aktif"
          />
        </div>
      )}

      {/* Quick Actions - Admin */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Mata Kuliah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800 mb-2">
                {stats?.total_mata_kuliah || 0}
              </p>
              <p className="text-sm text-slate-500">Total mata kuliah dalam sistem</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Statistik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Rasio Dosen:Mahasiswa</span>
                  <span className="font-medium">
                    1:{stats?.total_dosen > 0 ? Math.round(stats.total_mahasiswa / stats.total_dosen) : 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">MK per Prodi</span>
                  <span className="font-medium">
                    {stats?.total_prodi > 0 ? Math.round(stats.total_mata_kuliah / stats.total_prodi) : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-500" />
                Aktivitas Terkini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Belum ada aktivitas tercatat.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mahasiswa Dashboard */}
      {user?.role === 'mahasiswa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">KRS Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Lihat dan kelola Kartu Rencana Studi Anda
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">KHS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Lihat hasil studi semester ini
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Transkrip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Lihat transkrip nilai lengkap
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dosen Dashboard */}
      {user?.role === 'dosen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Kelas Saya</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Lihat daftar kelas yang Anda ampu
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Input Nilai</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Input nilai mahasiswa
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
