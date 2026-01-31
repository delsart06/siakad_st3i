import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { passwordResetAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, Lock, Mail, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    setLoading(true);
    try {
      const response = await passwordResetAPI.verifyToken(token);
      setTokenValid(response.data.valid);
      setTokenInfo(response.data);
    } catch (error) {
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Masukkan email');
      return;
    }

    setLoading(true);
    try {
      const response = await passwordResetAPI.forgotPassword(email);
      toast.success('Token reset password berhasil dibuat');
      setResetToken(response.data.reset_token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat token reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
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
      await passwordResetAPI.resetPassword(token, newPassword);
      setSuccess(true);
      toast.success('Password berhasil direset');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (token && loading && tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password form (with token)
  if (token) {
    // Success state
    if (success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Password Berhasil Direset</h2>
              <p className="text-slate-500 mb-6">Silakan login dengan password baru Anda</p>
              <Button onClick={() => navigate('/login')} className="bg-[#1e1b4b] hover:bg-[#312e81]">
                Ke Halaman Login
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Invalid token
    if (tokenValid === false) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-rose-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Token Tidak Valid</h2>
              <p className="text-slate-500 mb-6">{tokenInfo?.message || 'Token sudah tidak berlaku'}</p>
              <Button onClick={() => navigate('/forgot-password')} variant="outline">
                Minta Token Baru
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Valid token - show reset form
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-[#1e1b4b] rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {tokenInfo?.user_name && <span>Untuk: <strong>{tokenInfo.user_name}</strong></span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label>Password Baru</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  data-testid="new-password-input"
                />
              </div>
              <div>
                <Label>Konfirmasi Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  data-testid="confirm-password-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#1e1b4b] hover:bg-[#312e81]"
                disabled={loading}
                data-testid="reset-password-btn"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password form (request token)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-[#1e1b4b] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Lupa Password</CardTitle>
          <CardDescription>Masukkan email untuk mendapatkan link reset password</CardDescription>
        </CardHeader>
        <CardContent>
          {resetToken ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-700 font-medium mb-2">Token Reset Berhasil Dibuat!</p>
                <p className="text-xs text-emerald-600 mb-3">
                  Dalam production, token ini akan dikirim via email. Untuk testing, gunakan link di bawah:
                </p>
                <div className="bg-white rounded border p-2 text-xs font-mono break-all">
                  {window.location.origin}/forgot-password?token={resetToken}
                </div>
              </div>
              <Button 
                onClick={() => navigate(`/forgot-password?token=${resetToken}`)}
                className="w-full bg-[#1e1b4b] hover:bg-[#312e81]"
              >
                Gunakan Token
              </Button>
              <Button 
                variant="outline"
                onClick={() => { setResetToken(null); setEmail(''); }}
                className="w-full"
              >
                Minta Token Lagi
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  data-testid="forgot-email-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#1e1b4b] hover:bg-[#312e81]"
                disabled={loading}
                data-testid="forgot-submit-btn"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kirim Link Reset
              </Button>
              <Button 
                type="button"
                variant="ghost"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
