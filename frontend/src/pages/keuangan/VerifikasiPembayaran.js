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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { keuanganAPI, tahunAkademikAPI } from '../../lib/api';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  FileCheck,
  Eye
} from 'lucide-react';

const VerifikasiPembayaran = () => {
  const [pembayaran, setPembayaran] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedPembayaran, setSelectedPembayaran] = useState(null);
  const [verifyNote, setVerifyNote] = useState('');

  // Filters
  const [filterTahunAkademik, setFilterTahunAkademik] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (filterTahunAkademik) {
      loadPembayaran();
    }
  }, [filterTahunAkademik, filterStatus]);

  const loadTahunAkademik = async () => {
    try {
      const res = await tahunAkademikAPI.getAll();
      setTahunAkademikList(res.data);
      const activeTA = res.data.find(ta => ta.is_active);
      if (activeTA) {
        setFilterTahunAkademik(activeTA.id);
      }
    } catch (error) {
      toast.error('Gagal memuat data tahun akademik');
    }
  };

  const loadPembayaran = async () => {
    setLoading(true);
    try {
      const res = await keuanganAPI.getPembayaran(filterTahunAkademik, filterStatus || null);
      setPembayaran(res.data);
    } catch (error) {
      toast.error('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status) => {
    if (!selectedPembayaran) return;
    try {
      await keuanganAPI.verifyPembayaran(selectedPembayaran.id, {
        status,
        catatan: verifyNote
      });
      toast.success(`Pembayaran berhasil di${status === 'verified' ? 'verifikasi' : 'tolak'}`);
      setIsDetailDialogOpen(false);
      setSelectedPembayaran(null);
      setVerifyNote('');
      loadPembayaran();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal memproses pembayaran');
    }
  };

  const openDetail = (item) => {
    setSelectedPembayaran(item);
    setVerifyNote('');
    setIsDetailDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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

  const filteredPembayaran = pembayaran.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.mahasiswa_nama?.toLowerCase().includes(search) ||
      p.mahasiswa_nim?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6" data-testid="verifikasi-pembayaran-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pembayaran</h1>
        <p className="text-gray-500 mt-1">Verifikasi pembayaran UKT dari mahasiswa</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tahun Akademik</Label>
              <Select value={filterTahunAkademik} onValueChange={setFilterTahunAkademik}>
                <SelectTrigger data-testid="filter-tahun-akademik">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAkademikList.map(ta => (
                    <SelectItem key={ta.id} value={ta.id}>
                      {ta.tahun} - {ta.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
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
            <FileCheck className="w-5 h-5" />
            Daftar Pembayaran ({filteredPembayaran.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama Mahasiswa</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredPembayaran.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada data pembayaran
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPembayaran.map((item) => (
                    <TableRow key={item.id} data-testid={`pembayaran-row-${item.id}`}>
                      <TableCell className="font-medium">{item.mahasiswa_nim}</TableCell>
                      <TableCell>{item.mahasiswa_nama}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.nominal)}</TableCell>
                      <TableCell className="capitalize">{item.metode_pembayaran?.replace('_', ' ')}</TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(item)}
                          data-testid={`btn-detail-${item.id}`}
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

      {/* Detail & Verify Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedPembayaran && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">NIM</Label>
                  <p className="font-medium">{selectedPembayaran.mahasiswa_nim}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Nama</Label>
                  <p className="font-medium">{selectedPembayaran.mahasiswa_nama}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Nominal</Label>
                  <p className="font-bold text-lg">{formatCurrency(selectedPembayaran.nominal)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Metode</Label>
                  <p className="capitalize">{selectedPembayaran.metode_pembayaran?.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Tanggal Bayar</Label>
                  <p>{formatDate(selectedPembayaran.created_at)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPembayaran.status)}</div>
                </div>
              </div>
              {selectedPembayaran.bukti_pembayaran && (
                <div>
                  <Label className="text-gray-500">Bukti Pembayaran</Label>
                  <p className="text-blue-600 underline">{selectedPembayaran.bukti_pembayaran}</p>
                </div>
              )}
              {selectedPembayaran.keterangan && (
                <div>
                  <Label className="text-gray-500">Keterangan</Label>
                  <p>{selectedPembayaran.keterangan}</p>
                </div>
              )}
              {selectedPembayaran.status === 'pending' && (
                <div>
                  <Label>Catatan Verifikasi (Opsional)</Label>
                  <Textarea
                    placeholder="Catatan untuk mahasiswa..."
                    value={verifyNote}
                    onChange={(e) => setVerifyNote(e.target.value)}
                    data-testid="input-catatan"
                  />
                </div>
              )}
              {selectedPembayaran.catatan_verifikasi && (
                <div>
                  <Label className="text-gray-500">Catatan Verifikasi</Label>
                  <p>{selectedPembayaran.catatan_verifikasi}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedPembayaran?.status === 'pending' ? (
              <>
                <Button variant="outline" onClick={() => handleVerify('rejected')} data-testid="btn-tolak">
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button onClick={() => handleVerify('verified')} className="bg-green-600 hover:bg-green-700" data-testid="btn-verifikasi">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verifikasi
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

export default VerifikasiPembayaran;
