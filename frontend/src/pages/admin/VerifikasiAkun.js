import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { authAPI, prodiAPI } from '../../lib/api';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  KeyRound,
  Image,
  User,
  ExternalLink
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VerifikasiAkun = () => {
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [fotoRequests, setFotoRequests] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestType, setRequestType] = useState('password');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterProdi, setFilterProdi] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProdi();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterProdi]);

  const loadProdi = async () => {
    try {
      const res = await prodiAPI.getAll();
      setProdiList(res.data);
    } catch (error) {
      console.error('Failed to load prodi');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus === 'all' ? null : filterStatus;
      const prodiParam = filterProdi === 'all' ? null : filterProdi || null;
      
      const [pwRes, fotoRes] = await Promise.all([
        authAPI.getForgotPasswordRequests(statusParam, prodiParam),
        authAPI.getFotoProfilRequests(statusParam, prodiParam)
      ]);
      
      setPasswordRequests(pwRes.data);
      setFotoRequests(fotoRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (req, type) => {
    setSelectedRequest(req);
    setRequestType(type);
    setCatatan('');
    setIsDetailDialogOpen(true);
  };

  const handleReview = async (action) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      if (requestType === 'password') {
        await authAPI.reviewForgotPassword(selectedRequest.id, action, catatan || null);
      } else {
        await authAPI.reviewFotoProfil(selectedRequest.id, action, catatan || null);
      }
      toast.success(`Pengajuan berhasil di${action === 'approve' ? 'setujui' : 'tolak'}`);
      setIsDetailDialogOpen(false);
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal memproses pengajuan');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterBySearch = (items) => {
    if (!searchTerm) return items;
    const search = searchTerm.toLowerCase();
    return items.filter(r => 
      r.user_nama?.toLowerCase().includes(search) ||
      r.user_id_number?.toLowerCase().includes(search)
    );
  };

  const getDocumentUrl = (path) => {
    if (!path) return null;
    return `${BACKEND_URL}${path}`;
  };

  return (
    <div className="space-y-6" data-testid="verifikasi-akun-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Akun</h1>
        <p className="text-gray-500 mt-1">Review pengajuan reset password dan perubahan foto profil</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Program Studi</Label>
              <Select value={filterProdi} onValueChange={setFilterProdi}>
                <SelectTrigger data-testid="filter-prodi">
                  <SelectValue placeholder="Semua Prodi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prodi</SelectItem>
                  {prodiList.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari NIM/NIDN/NIP atau nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="password" className="space-y-4">
        <TabsList>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Reset Password ({filterBySearch(passwordRequests).length})
          </TabsTrigger>
          <TabsTrigger value="foto" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Foto Profil ({filterBySearch(fotoRequests).length})
          </TabsTrigger>
        </TabsList>

        {/* Password Reset Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Pengajuan Reset Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIM/NIDN/NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Prodi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Memuat data...</TableCell>
                    </TableRow>
                  ) : filterBySearch(passwordRequests).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Tidak ada pengajuan reset password
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterBySearch(passwordRequests).map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.user_id_number}</TableCell>
                        <TableCell>{req.user_nama}</TableCell>
                        <TableCell>{req.prodi_nama || '-'}</TableCell>
                        <TableCell>{formatDate(req.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(req, 'password')}
                            data-testid={`detail-pw-${req.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Foto Profil Tab */}
        <TabsContent value="foto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Pengajuan Ganti Foto Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIM/NIDN/NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Prodi</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Memuat data...</TableCell>
                    </TableRow>
                  ) : filterBySearch(fotoRequests).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Tidak ada pengajuan ganti foto
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterBySearch(fotoRequests).map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.user_id_number}</TableCell>
                        <TableCell>{req.user_nama}</TableCell>
                        <TableCell>{req.prodi_nama || '-'}</TableCell>
                        <TableCell>
                          <img 
                            src={getDocumentUrl(req.foto_baru)} 
                            alt="Preview"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </TableCell>
                        <TableCell>{formatDate(req.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(req, 'foto')}
                            data-testid={`detail-foto-${req.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {requestType === 'password' ? <KeyRound className="w-5 h-5" /> : <Image className="w-5 h-5" />}
              {requestType === 'password' ? 'Detail Pengajuan Reset Password' : 'Detail Pengajuan Ganti Foto'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* User Info */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedRequest.user_nama}</h3>
                      <p className="text-gray-500 text-sm">{selectedRequest.user_id_number}</p>
                      {selectedRequest.prodi_nama && (
                        <p className="text-gray-400 text-xs">{selectedRequest.prodi_nama}</p>
                      )}
                    </div>
                    <div className="ml-auto">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Foto Preview (for foto requests) */}
              {requestType === 'foto' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Label className="text-gray-500 text-sm">Foto Lama</Label>
                    <div className="mt-2 w-24 h-24 mx-auto rounded-full bg-gray-100 overflow-hidden">
                      {selectedRequest.foto_lama ? (
                        <img 
                          src={getDocumentUrl(selectedRequest.foto_lama)} 
                          alt="Foto lama"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <Label className="text-gray-500 text-sm">Foto Baru</Label>
                    <div className="mt-2 w-24 h-24 mx-auto rounded-full bg-gray-100 overflow-hidden border-2 border-blue-500">
                      <img 
                        src={getDocumentUrl(selectedRequest.foto_baru)} 
                        alt="Foto baru"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <a 
                      href={getDocumentUrl(selectedRequest.foto_baru)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
                    >
                      Lihat Full <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Tanggal */}
              <div className="text-sm text-gray-500">
                Diajukan: {formatDate(selectedRequest.created_at)}
              </div>

              {/* Review Section */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <Label>Catatan (Opsional)</Label>
                  <Textarea
                    placeholder="Tambahkan catatan..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    data-testid="input-catatan"
                  />
                </div>
              )}

              {/* Previous Review Info */}
              {selectedRequest.status !== 'pending' && selectedRequest.reviewed_at && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4 text-sm">
                    <p className="text-gray-500">Direview pada {formatDate(selectedRequest.reviewed_at)}</p>
                    {selectedRequest.catatan_admin && (
                      <p className="mt-2"><strong>Catatan:</strong> {selectedRequest.catatan_admin}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === 'pending' ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleReview('reject')}
                  disabled={submitting}
                  data-testid="btn-reject"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button 
                  onClick={() => handleReview('approve')}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="btn-approve"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Setujui
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifikasiAkun;
