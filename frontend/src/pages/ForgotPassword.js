import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId || !newPassword || !confirmPassword) {
      toast.error('Lengkapi semua field');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Password tidak sama');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPasswordRequest({
        user_id_number: userId,
        password_baru: newPassword
      });
      setSuccess(true);
      toast.success('Pengajuan reset password berhasil dikirim');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengirim pengajuan');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Pengajuan Berhasil Dikirim</h2>
            <p className="text-slate-500 mb-6">
              Pengajuan reset password Anda sedang diproses oleh admin. 
              Anda akan dihubungi setelah pengajuan disetujui.
            </p>
            <Button onClick={() => navigate('/login')} className="bg-[#1e1b4b] hover:bg-[#312e81]">
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-[#1e1b4b] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Lupa Password</CardTitle>
          <CardDescription>
            Masukkan NIM/NIDN/NIP dan password baru Anda. Pengajuan akan direview oleh admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>NIM / NIDN / NIP</Label>
              <Input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Masukkan NIM/NIDN/NIP"
                data-testid="forgot-userid-input"
              />
            </div>
            <div>
              <Label>Password Baru</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="pr-10"
                  data-testid="forgot-newpassword-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Konfirmasi Password</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                data-testid="forgot-confirm-input"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#1e1b4b] hover:bg-[#312e81]"
              disabled={loading}
              data-testid="forgot-submit-btn"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ajukan Reset Password
            </Button>
            <Link to="/login">
              <Button 
                type="button"
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Login
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
