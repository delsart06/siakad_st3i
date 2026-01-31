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
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = React.useState(['master', 'akademik']);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(p => location.pathname.startsWith(p));

  const toggleMenu = (menu) => {
    setOpenMenus(prev => 
      prev.includes(menu) 
        ? prev.filter(m => m !== menu)
        : [...prev, menu]
    );
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
        { path: '/akademik/krs', label: 'Validasi KRS', icon: ClipboardList },
      ],
    },
  ];

  const mahasiswaMenus = [
    { path: '/mahasiswa/krs', label: 'KRS', icon: ClipboardList },
    { path: '/mahasiswa/khs', label: 'KHS', icon: FileText },
    { path: '/mahasiswa/transkrip', label: 'Transkrip', icon: FileText },
  ];

  const dosenMenus = [
    { path: '/dosen/kelas', label: 'Kelas Saya', icon: BookOpen },
    { path: '/dosen/mahasiswa', label: 'Daftar Mahasiswa', icon: Users },
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
            <h1 className="font-bold text-lg tracking-tight">SIAKAD</h1>
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
            <Link
              to="/users"
              className={`sidebar-link ${isActive('/users') ? 'active' : ''}`}
              data-testid="sidebar-users"
            >
              <Users className="w-5 h-5" />
              <span>Manajemen User</span>
            </Link>
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
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 bg-indigo-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.nama?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nama}</p>
            <p className="text-xs text-indigo-300 capitalize">{user?.role}</p>
          </div>
        </div>
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
