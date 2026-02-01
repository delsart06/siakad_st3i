import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../lib/api';
import { 
  User, 
  Camera, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  Mail,
  CreditCard,
  Shield
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProfilPage = () => {
  const { user, checkAuth } = useAuth();
  const fileInputRef = useRef(null);
  const [fotoRequests, setFotoRequests] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadFotoRequests();
  }, []);

  const loadFotoRequests = async () => {
    try {
      const res = await authAPI.getMyFotoProfilRequests();
      setFotoRequests(res.data);
    } catch (error) {
      console.error('Failed to load foto requests');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      toast.error('Pilih foto terlebih dahulu');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);
      
      await authAPI.uploadFotoProfil(formData);
      toast.success('Pengajuan ganti foto berhasil dikirim. Menunggu persetujuan admin.');
      setPreviewUrl(null);
      fileInputRef.current.value = '';
      loadFotoRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengupload foto');
    } finally {
      setUploading(false);
    }
  };

  const hasPendingRequest = fotoRequests.some(r => r.status === 'pending');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFotoUrl = (path) => {
    if (!path) return null;
    return `${BACKEND_URL}${path}`;
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Administrator' },
      dosen: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Dosen' },
      mahasiswa: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Mahasiswa' },
    };
    const style = styles[role] || { bg: 'bg-gray-100', text: 'text-gray-700', label: role };
    return <Badge className={`${style.bg} ${style.text}`}>{style.label}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="profil-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 mt-1">Kelola informasi profil Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            {/* Profile Photo */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
                {user?.foto_profil ? (
                  <img 
                    src={getFotoUrl(user.foto_profil)} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                    <User className="w-16 h-16 text-indigo-300" />
                  </div>
                )}
              </div>
              {!hasPendingRequest && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-colors"
                  data-testid="btn-change-photo"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900">{user?.nama}</h2>
            <p className="text-gray-500 mb-2">{user?.user_id_number}</p>
            {getRoleBadge(user?.role)}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-foto"
            />

            {/* Preview and Upload */}
            {previewUrl && (
              <div className="mt-4 space-y-3">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-blue-500">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setPreviewUrl(null); fileInputRef.current.value = ''; }}
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                    data-testid="btn-upload-foto"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Request Alert */}
          {hasPendingRequest && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Pengajuan ganti foto profil sedang diproses oleh admin. Anda tidak dapat mengajukan perubahan baru sampai pengajuan sebelumnya selesai.
              </AlertDescription>
            </Alert>
          )}

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Informasi Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-sm">NIM/NIDN/NIP</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{user?.user_id_number || '-'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{user?.email}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Nama Lengkap</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{user?.nama}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Role</Label>
                  <div className="mt-1">
                    {getRoleBadge(user?.role)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Foto Request History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Riwayat Pengajuan Foto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fotoRequests.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada riwayat pengajuan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fotoRequests.slice(0, 5).map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getFotoUrl(req.foto_baru)} 
                          alt="Foto"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium">{formatDate(req.created_at)}</p>
                          {req.catatan_admin && (
                            <p className="text-xs text-gray-500">{req.catatan_admin}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilPage;
