import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { biodataAdminAPI } from '../../lib/api';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  FileText,
  User,
  Image,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VerifikasiBiodata = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus === 'all' ? null : filterStatus;
      const res = await biodataAdminAPI.getChangeRequests(statusParam);
      setRequests(res.data);
    } catch (error) {
      toast.error('Gagal memuat data pengajuan');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (req) => {
    setSelectedRequest(req);
    setCatatan('');
    try {
      const res = await biodataAdminAPI.getChangeRequestDetail(req.id);
      setDetailData(res.data);
      setIsDetailDialogOpen(true);
    } catch (error) {
      toast.error('Gagal memuat detail pengajuan');
    }
  };

  const handleReview = async (action) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await biodataAdminAPI.reviewChangeRequest(selectedRequest.id, action, catatan || null);
      toast.success(`Pengajuan berhasil di${action === 'approve' ? 'setujui' : 'tolak'}`);
      setIsDetailDialogOpen(false);
      setSelectedRequest(null);
      setDetailData(null);
      loadRequests();
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

  const formatFieldName = (field) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredRequests = requests.filter(r => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      r.mahasiswa_nama?.toLowerCase().includes(search) ||
      r.mahasiswa_nim?.toLowerCase().includes(search)
    );
  });

  const getDocumentUrl = (path) => {
    if (!path) return null;
    return `${BACKEND_URL}${path}`;
  };

  return (
    <div className="space-y-6" data-testid="verifikasi-biodata-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Perubahan Biodata</h1>
        <p className="text-gray-500 mt-1">Review dan setujui perubahan data mahasiswa</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="md:col-span-2">
              <Label>Cari Mahasiswa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari NIM atau nama..."
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Daftar Pengajuan ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama Mahasiswa</TableHead>
                  <TableHead>Jumlah Perubahan</TableHead>
                  <TableHead>Tanggal Pengajuan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada pengajuan perubahan biodata
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id} data-testid={`request-row-${req.id}`}>
                      <TableCell className="font-medium">{req.mahasiswa_nim}</TableCell>
                      <TableCell>{req.mahasiswa_nama}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{Object.keys(req.data_baru).length} field</Badge>
                      </TableCell>
                      <TableCell>{formatDate(req.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(req)}
                          data-testid={`btn-detail-${req.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan Perubahan Biodata</DialogTitle>
          </DialogHeader>
          
          {detailData && (
            <div className="space-y-6">
              {/* Mahasiswa Info */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{detailData.mahasiswa_nama}</h3>
                      <p className="text-gray-500">NIM: {detailData.mahasiswa_nim}</p>
                    </div>
                    <div className="ml-auto">
                      {getStatusBadge(detailData.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Comparison */}
              <div>
                <h3 className="font-semibold mb-4">Perbandingan Data</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-1/3">Field</TableHead>
                        <TableHead className="w-1/3">Data Lama</TableHead>
                        <TableHead className="w-1/3">Data Baru</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(detailData.data_baru).map(([key, newValue]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{formatFieldName(key)}</TableCell>
                          <TableCell className="text-red-600 bg-red-50">
                            {detailData.data_lama[key] || '-'}
                          </TableCell>
                          <TableCell className="text-green-600 bg-green-50">
                            {newValue}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Image className="w-4 h-4" /> Dokumen Pendukung
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {detailData.dokumen_ktp && (
                    <Card className="border">
                      <CardContent className="p-4 text-center">
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          <img 
                            src={getDocumentUrl(detailData.dokumen_ktp)} 
                            alt="KTP"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                          <div className="hidden items-center justify-center text-gray-400">
                            <FileText className="w-8 h-8" />
                          </div>
                        </div>
                        <p className="text-sm font-medium">KTP</p>
                        <a 
                          href={getDocumentUrl(detailData.dokumen_ktp)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 mt-1"
                        >
                          Lihat <ExternalLink className="w-3 h-3" />
                        </a>
                      </CardContent>
                    </Card>
                  )}
                  {detailData.dokumen_kk && (
                    <Card className="border">
                      <CardContent className="p-4 text-center">
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          <img 
                            src={getDocumentUrl(detailData.dokumen_kk)} 
                            alt="KK"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                          <div className="hidden items-center justify-center text-gray-400">
                            <FileText className="w-8 h-8" />
                          </div>
                        </div>
                        <p className="text-sm font-medium">Kartu Keluarga</p>
                        <a 
                          href={getDocumentUrl(detailData.dokumen_kk)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 mt-1"
                        >
                          Lihat <ExternalLink className="w-3 h-3" />
                        </a>
                      </CardContent>
                    </Card>
                  )}
                  {detailData.dokumen_akte && (
                    <Card className="border">
                      <CardContent className="p-4 text-center">
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          <img 
                            src={getDocumentUrl(detailData.dokumen_akte)} 
                            alt="Akte"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                          <div className="hidden items-center justify-center text-gray-400">
                            <FileText className="w-8 h-8" />
                          </div>
                        </div>
                        <p className="text-sm font-medium">Akte Kelahiran</p>
                        <a 
                          href={getDocumentUrl(detailData.dokumen_akte)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 mt-1"
                        >
                          Lihat <ExternalLink className="w-3 h-3" />
                        </a>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Review Section */}
              {detailData.status === 'pending' && (
                <div>
                  <h3 className="font-semibold mb-4">Review</h3>
                  <div>
                    <Label>Catatan (Opsional)</Label>
                    <Textarea
                      placeholder="Tambahkan catatan untuk mahasiswa..."
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      data-testid="input-catatan"
                    />
                  </div>
                </div>
              )}

              {/* Previous Review Info */}
              {detailData.status !== 'pending' && detailData.reviewed_at && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">
                      Direview pada {formatDate(detailData.reviewed_at)}
                    </p>
                    {detailData.catatan_admin && (
                      <p className="mt-2"><strong>Catatan:</strong> {detailData.catatan_admin}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            {detailData?.status === 'pending' ? (
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

export default VerifikasiBiodata;
