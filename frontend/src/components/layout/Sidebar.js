import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  School,
  UserCircle,
  BookMarked,
  Wallet,
  CreditCard,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = React.useState(['master', 'akademik', 'keuangan', 'biodata']);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(p => location.pathname.startsWith(p));

  const toggleMenu = (menu) => {
    setOpenMenus(prev => 
      prev.includes(menu) 
        ? prev.filter(m => m !== menu)
        : [...prev, menu]
    );
  };

  // Check if user has management role (admin, rektor, dekan, kaprodi)
  const isManagement = ['admin', 'rektor', 'dekan', 'kaprodi'].includes(user?.role);
  const isFullAccess = ['admin', 'rektor'].includes(user?.role);
  
  // Get user's modules access
  const modulesAccess = user?.modules_access || [];
  
  // Helper function to check if user has access to a specific module
  const hasModuleAccess = (moduleId) => {
    // Admin always has full access
    if (user?.role === 'admin') return true;
    return modulesAccess.includes(moduleId);
  };

  const adminMenus = [
    {
      id: 'master',
      label: 'Master Data',
      icon: Settings,
      children: [
        { path: '/master/tahun-akademik', label: 'Tahun Akademik', icon: Calendar },
        { path: '/master/fakultas', label: 'Fakultas', icon: Building2 },
        { path: '/master/prodi', label: 'Program Studi', icon: School },
        { path: '/master/kurikulum', label: 'Kurikulum', icon: BookMarked },
        { path: '/master/mata-kuliah', label: 'Mata Kuliah', icon: BookOpen },
        { path: '/master/mahasiswa', label: 'Mahasiswa', icon: GraduationCap },
        { path: '/master/dosen', label: 'Dosen', icon: UserCircle },
      ],
    },
    {
      id: 'akademik',
      label: 'Akademik',
      icon: ClipboardList,
      children: [
        { path: '/akademik/kelas', label: 'Penawaran Kelas', icon: BookOpen },
        { path: '/akademik/jadwal', label: 'Jadwal Kuliah', icon: Calendar },
        { path: '/akademik/krs', label: 'Validasi KRS', icon: ClipboardList },
      ],
    },
    {
      id: 'keuangan',
      label: 'Keuangan',
      icon: Wallet,
      children: [
        { path: '/keuangan/tagihan', label: 'Manajemen Tagihan', icon: CreditCard },
        { path: '/keuangan/pembayaran', label: 'Verifikasi Pembayaran', icon: FileText },
      ],
    },
    {
      id: 'biodata',
      label: 'Biodata',
      icon: UserCheck,
      children: [
        { path: '/biodata/verifikasi', label: 'Verifikasi Perubahan', icon: UserCheck },
      ],
    },
  ];

  // Menu khusus untuk User Management (di luar collapsible)
  const userManagementMenu = [
    { path: '/users', label: 'Manajemen User', icon: Users },
    { path: '/verifikasi-akun', label: 'Verifikasi Akun', icon: KeyRound },
  ];

  const mahasiswaMenus = [
    { path: '/mahasiswa/krs', label: 'KRS', icon: ClipboardList },
    { path: '/mahasiswa/jadwal', label: 'Jadwal Kuliah', icon: Calendar },
    { path: '/mahasiswa/presensi', label: 'Presensi', icon: ClipboardList },
    { path: '/mahasiswa/khs', label: 'KHS', icon: FileText },
    { path: '/mahasiswa/transkrip', label: 'Transkrip', icon: FileText },
    { path: '/mahasiswa/keuangan', label: 'Keuangan', icon: Wallet },
    { path: '/mahasiswa/biodata', label: 'Biodata', icon: UserCheck },
  ];

  const dosenMenus = [
    { path: '/dosen/kelas', label: 'Kelas Saya', icon: BookOpen },
    { path: '/dosen/mahasiswa', label: 'Daftar Mahasiswa', icon: Users },
    { path: '/dosen/presensi', label: 'Presensi', icon: ClipboardList },
    { path: '/dosen/nilai', label: 'Input Nilai', icon: ClipboardList },
    { path: '/dosen/validasi-krs-pa', label: 'Validasi KRS PA', icon: ClipboardList },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#1e1b4b] text-white hidden md:flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-indigo-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-[#1e1b4b]" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">SIA ST3I</h1>
            <p className="text-xs text-indigo-300">Sistem Informasi Akademik</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Dashboard - All roles */}
        <Link
          to="/"
          className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
          data-testid="sidebar-dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        {/* Admin Menus */}
        {user?.role === 'admin' && (
          <>
            {adminMenus.map((menu) => (
              <Collapsible
                key={menu.id}
                open={openMenus.includes(menu.id)}
                onOpenChange={() => toggleMenu(menu.id)}
              >
                <CollapsibleTrigger
                  className={`sidebar-link w-full justify-between ${
                    isParentActive(menu.children.map(c => c.path)) ? 'bg-indigo-900/50' : ''
                  }`}
                  data-testid={`sidebar-${menu.id}`}
                >
                  <div className="flex items-center gap-3">
                    <menu.icon className="w-5 h-5" />
                    <span>{menu.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMenus.includes(menu.id) ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1 mt-1">
                  {menu.children.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-link text-sm ${isActive(item.path) ? 'active' : ''}`}
                      data-testid={`sidebar-${item.path.replace(/\//g, '-')}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}

            {/* Users Management */}
            {userManagementMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                data-testid={`sidebar-${item.path.replace(/\//g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}

        {/* Rektor/Dekan/Kaprodi Management Menus - Can view data based on their access */}
        {['rektor', 'dekan', 'kaprodi'].includes(user?.role) && (
          <>
            {/* Master Data - Check module access */}
            {hasModuleAccess('master_data') && (
              <Collapsible
                open={openMenus.includes('master')}
                onOpenChange={() => toggleMenu('master')}
              >
                <CollapsibleTrigger
                  className={`sidebar-link w-full justify-between ${
                    isParentActive(['/master']) ? 'bg-indigo-900/50' : ''
                  }`}
                  data-testid="sidebar-master"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span>Master Data</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMenus.includes('master') ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1 mt-1">
                  {isFullAccess && (
                    <>
                      <Link to="/master/tahun-akademik" className={`sidebar-link text-sm ${isActive('/master/tahun-akademik') ? 'active' : ''}`}>
                        <Calendar className="w-4 h-4" />
                        <span>Tahun Akademik</span>
                      </Link>
                      <Link to="/master/fakultas" className={`sidebar-link text-sm ${isActive('/master/fakultas') ? 'active' : ''}`}>
                        <Building2 className="w-4 h-4" />
                        <span>Fakultas</span>
                      </Link>
                    </>
                  )}
                  <Link to="/master/prodi" className={`sidebar-link text-sm ${isActive('/master/prodi') ? 'active' : ''}`}>
                    <School className="w-4 h-4" />
                    <span>Program Studi</span>
                  </Link>
                  {hasModuleAccess('mahasiswa') && (
                    <Link to="/master/mahasiswa" className={`sidebar-link text-sm ${isActive('/master/mahasiswa') ? 'active' : ''}`}>
                      <GraduationCap className="w-4 h-4" />
                      <span>Mahasiswa</span>
                    </Link>
                  )}
                  {hasModuleAccess('dosen') && (
                    <Link to="/master/dosen" className={`sidebar-link text-sm ${isActive('/master/dosen') ? 'active' : ''}`}>
                      <UserCircle className="w-4 h-4" />
                      <span>Dosen</span>
                    </Link>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Akademik - Check module access */}
            {hasModuleAccess('akademik') && (
              <Collapsible
                open={openMenus.includes('akademik')}
                onOpenChange={() => toggleMenu('akademik')}
              >
                <CollapsibleTrigger
                  className={`sidebar-link w-full justify-between ${
                    isParentActive(['/akademik']) ? 'bg-indigo-900/50' : ''
                  }`}
                  data-testid="sidebar-akademik"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5" />
                    <span>Akademik</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMenus.includes('akademik') ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1 mt-1">
                  <Link to="/akademik/kelas" className={`sidebar-link text-sm ${isActive('/akademik/kelas') ? 'active' : ''}`}>
                    <BookOpen className="w-4 h-4" />
                    <span>Penawaran Kelas</span>
                  </Link>
                  <Link to="/akademik/jadwal" className={`sidebar-link text-sm ${isActive('/akademik/jadwal') ? 'active' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    <span>Jadwal Kuliah</span>
                  </Link>
                  <Link to="/akademik/krs" className={`sidebar-link text-sm ${isActive('/akademik/krs') ? 'active' : ''}`}>
                    <ClipboardList className="w-4 h-4" />
                    <span>Validasi KRS</span>
                  </Link>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Keuangan - Check module access */}
            {hasModuleAccess('keuangan') && (
              <Collapsible
                open={openMenus.includes('keuangan')}
                onOpenChange={() => toggleMenu('keuangan')}
              >
                <CollapsibleTrigger
                  className={`sidebar-link w-full justify-between ${
                    isParentActive(['/keuangan']) ? 'bg-indigo-900/50' : ''
                  }`}
                  data-testid="sidebar-keuangan"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5" />
                    <span>Keuangan</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMenus.includes('keuangan') ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1 mt-1">
                  <Link to="/keuangan/tagihan" className={`sidebar-link text-sm ${isActive('/keuangan/tagihan') ? 'active' : ''}`}>
                    <CreditCard className="w-4 h-4" />
                    <span>Manajemen Tagihan</span>
                  </Link>
                  <Link to="/keuangan/pembayaran" className={`sidebar-link text-sm ${isActive('/keuangan/pembayaran') ? 'active' : ''}`}>
                    <FileText className="w-4 h-4" />
                    <span>Verifikasi Pembayaran</span>
                  </Link>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Biodata - Check module access */}
            {hasModuleAccess('biodata') && (
              <Collapsible
                open={openMenus.includes('biodata')}
                onOpenChange={() => toggleMenu('biodata')}
              >
                <CollapsibleTrigger
                  className={`sidebar-link w-full justify-between ${
                    isParentActive(['/biodata']) ? 'bg-indigo-900/50' : ''
                  }`}
                  data-testid="sidebar-biodata"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5" />
                    <span>Biodata</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMenus.includes('biodata') ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1 mt-1">
                  <Link to="/biodata/verifikasi" className={`sidebar-link text-sm ${isActive('/biodata/verifikasi') ? 'active' : ''}`}>
                    <UserCheck className="w-4 h-4" />
                    <span>Verifikasi Perubahan</span>
                  </Link>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* User Management - Check module access */}
            {hasModuleAccess('user_management') && userManagementMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                data-testid={`sidebar-${item.path.replace(/\//g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Verifikasi Akun - Check module access */}
            {hasModuleAccess('verifikasi_akun') && (
              <Link
                to="/verifikasi-akun"
                className={`sidebar-link ${isActive('/verifikasi-akun') ? 'active' : ''}`}
                data-testid="sidebar-verifikasi-akun"
              >
                <KeyRound className="w-5 h-5" />
                <span>Verifikasi Akun</span>
              </Link>
            )}
          </>
        )}

        {/* Mahasiswa Menus */}
        {user?.role === 'mahasiswa' && (
          <>
            {mahasiswaMenus.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                data-testid={`sidebar-${item.path.replace(/\//g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}

        {/* Dosen Menus */}
        {user?.role === 'dosen' && (
          <>
            {dosenMenus.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                data-testid={`sidebar-${item.path.replace(/\//g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-indigo-800">
        <Link
          to="/profil"
          className="flex items-center gap-3 mb-3 px-2 py-2 rounded-lg hover:bg-indigo-800 transition-colors cursor-pointer"
          data-testid="sidebar-profil"
        >
          <div className="w-9 h-9 bg-indigo-700 rounded-full flex items-center justify-center overflow-hidden">
            {user?.foto_profil ? (
              <img 
                src={`${process.env.REACT_APP_BACKEND_URL}${user.foto_profil}`} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium">
                {user?.nama?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nama}</p>
            <p className="text-xs text-indigo-300 capitalize">{user?.role}</p>
          </div>
        </Link>
        <button
          onClick={logout}
          className="sidebar-link w-full text-red-300 hover:bg-red-900/30"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
