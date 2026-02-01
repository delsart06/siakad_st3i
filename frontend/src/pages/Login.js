import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(userId, password);
      toast.success('Login berhasil!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'NIM/NIDN/NIP atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(30, 27, 75, 0.85), rgba(30, 27, 75, 0.95)), url('https://images.unsplash.com/photo-1680444873773-7c106c23ac52?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwbW9kZXJuJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2OTU5NzA0Mnww&ixlib=rb-4.1.0&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-testid="login-page"
    >
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-[#1e1b4b] rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">SIA ST3I</CardTitle>
          <CardDescription className="text-slate-500">
            Sistem Informasi Akademik Sekolah Tinggi Teologi Transformasi Indonesia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-slate-700">NIM / NIDN / NIP</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Masukkan NIM/NIDN/NIP"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="h-11"
                data-testid="login-userid"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div></div>
              <Link 
                to="/forgot-password" 
                className="text-sm text-[#1e1b4b] hover:underline"
                data-testid="forgot-password-link"
              >
                Lupa Password?
              </Link>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-[#1e1b4b] hover:bg-[#312e81] text-white font-medium"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-500 mb-3">Demo Akun:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Admin</span>
                <code className="text-xs bg-slate-200 px-2 py-1 rounded">NIP: 1234567890 / admin123</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Rektor</span>
                <code className="text-xs bg-slate-200 px-2 py-1 rounded">NIP: RKT001 / rektor123</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Dekan</span>
                <code className="text-xs bg-slate-200 px-2 py-1 rounded">NIP: DKN001 / dekan123</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Kaprodi</span>
                <code className="text-xs bg-slate-200 px-2 py-1 rounded">NIP: KPD001 / kaprodi123</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Mahasiswa</span>
                <code className="text-xs bg-slate-200 px-2 py-1 rounded">NIM: 2024001 / password</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
