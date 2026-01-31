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
  DialogDescription,
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
import { mahasiswaKeuanganAPI, tahunAkademikAPI } from '../../lib/api';
import { 
  CreditCard, 
  Receipt, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  DollarSign,
  Upload,
  History,
  Wallet
} from 'lucide-react';

const KeuanganPage = () => {
  const [tagihan, setTagihan] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [loading, setLoading] = useState(true);
  const [isBayarDialogOpen, setIsBayarDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState(null);

  const [bayarForm, setBayarForm] = useState({
    nominal: '',
    metode_pembayaran: 'transfer',
    bukti_pembayaran: '',
    keterangan: ''
  });

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTA) {
      loadData();
    }
  }, [selectedTA]);

  const loadTahunAkademik = async () => {
    try {
      const res = await tahunAkademikAPI.getAll();
      setTahunAkademikList(res.data);
      const activeTA = res.data.find(ta => ta.is_active);
      if (activeTA) {
        setSelectedTA(activeTA.id);
      }
    } catch (error) {
      toast.error('Gagal memuat data tahun akademik');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tagihanRes, pembayaranRes] = await Promise.all([
        mahasiswaKeuanganAPI.getMyTagihan(selectedTA),
        mahasiswaKeuanganAPI.getMyPembayaran()
      ]);
      setTagihan(tagihanRes.data);
      setPembayaran(pembayaranRes.data);
    } catch (error) {
      toast.error('Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  };

  const handleBayar = async () => {
    if (!selectedTagihan) return;
    if (!bayarForm.nominal || parseFloat(bayarForm.nominal) <= 0) {
      toast.error('Masukkan nominal pembayaran yang valid');
      return;
    }
    try {
      await mahasiswaKeuanganAPI.createPembayaran({
        tagihan_id: selectedTagihan.id,
        nominal: parseFloat(bayarForm.nominal),
        metode_pembayaran: bayarForm.metode_pembayaran,
        bukti_pembayaran: bayarForm.bukti_pembayaran || null,
        keterangan: bayarForm.keterangan || null
      });
      toast.success('Pembayaran berhasil diajukan. Menunggu verifikasi admin.');
      setIsBayarDialogOpen(false);
      setBayarForm({ nominal: '', metode_pembayaran: 'transfer', bukti_pembayaran: '', keterangan: '' });
      setSelectedTagihan(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengajukan pembayaran');
    }
  };

  const openBayarDialog = (item) => {
    setSelectedTagihan(item);
    setBayarForm({
      nominal: item.sisa_tagihan.toString(),
      metode_pembayaran: 'transfer',
      bukti_pembayaran: '',
      keterangan: ''
    });
    setIsBayarDialogOpen(true);
  };

  const openHistoryDialog = (item) => {
    setSelectedTagihan(item);
    setIsHistoryDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'lunas':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Lunas</Badge>;
      case 'cicilan':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Cicilan</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Belum Bayar</Badge>;
    }
  };

  const getPembayaranStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Ditolak</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
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
      year: 'numeric'
    });
  };

  // Calculate totals
  const totalTagihan = tagihan.reduce((sum, t) => sum + t.nominal, 0);
  const totalTerbayar = tagihan.reduce((sum, t) => sum + t.total_dibayar, 0);
  const totalSisa = tagihan.reduce((sum, t) => sum + t.sisa_tagihan, 0);

  const getTagihanPembayaran = (tagihanId) => {
    return pembayaran.filter(p => p.tagihan_id === tagihanId);
  };

  return (
    <div className="space-y-6" data-testid="keuangan-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keuangan</h1>
          <p className="text-gray-500 mt-1">Kelola tagihan dan pembayaran UKT Anda</p>
        </div>
        <Select value={selectedTA} onValueChange={setSelectedTA}>
          <SelectTrigger className="w-[200px]" data-testid="select-tahun-akademik">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tagihan</p>
                <p className="text-xl font-bold">{formatCurrency(totalTagihan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sudah Dibayar</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalTerbayar)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Wallet className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sisa Tagihan</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalSisa)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tagihan List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Daftar Tagihan
          </CardTitle>
          <CardDescription>Tagihan UKT semester ini</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : tagihan.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada tagihan untuk semester ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tagihan.map((item) => (
                <Card key={item.id} className="border" data-testid={`tagihan-card-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{item.kategori_nama}</h3>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-gray-500">{item.tahun_akademik_label}</p>
                        <p className="text-sm text-gray-500">Jatuh Tempo: {formatDate(item.jatuh_tempo)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Tagihan</p>
                        <p className="text-lg font-bold">{formatCurrency(item.nominal)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Terbayar</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(item.total_dibayar)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Sisa</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(item.sisa_tagihan)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openHistoryDialog(item)}
                          data-testid={`btn-history-${item.id}`}
                        >
                          <History className="w-4 h-4 mr-1" />
                          Riwayat
                        </Button>
                        {item.status !== 'lunas' && (
                          <Button
                            size="sm"
                            onClick={() => openBayarDialog(item)}
                            data-testid={`btn-bayar-${item.id}`}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Bayar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Pembayaran */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Pembayaran Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pembayaran.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada riwayat pembayaran</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pembayaran.slice(0, 5).map((item) => (
                  <TableRow key={item.id} data-testid={`pembayaran-row-${item.id}`}>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.nominal)}</TableCell>
                    <TableCell className="capitalize">{item.metode_pembayaran?.replace('_', ' ')}</TableCell>
                    <TableCell>{getPembayaranStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-gray-500">{item.keterangan || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bayar Dialog */}
      <Dialog open={isBayarDialogOpen} onOpenChange={setIsBayarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lakukan Pembayaran</DialogTitle>
            <DialogDescription>
              {selectedTagihan && `Sisa tagihan: ${formatCurrency(selectedTagihan.sisa_tagihan)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nominal Pembayaran</Label>
              <Input
                type="number"
                placeholder="Masukkan nominal"
                value={bayarForm.nominal}
                onChange={(e) => setBayarForm(prev => ({ ...prev, nominal: e.target.value }))}
                data-testid="input-nominal"
              />
              <p className="text-xs text-gray-500 mt-1">Anda dapat membayar sebagian (cicilan)</p>
            </div>
            <div>
              <Label>Metode Pembayaran</Label>
              <Select 
                value={bayarForm.metode_pembayaran} 
                onValueChange={(v) => setBayarForm(prev => ({ ...prev, metode_pembayaran: v }))}
              >
                <SelectTrigger data-testid="select-metode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="va_bank">Virtual Account</SelectItem>
                  <SelectItem value="tunai">Tunai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bukti Pembayaran (Link/No. Referensi)</Label>
              <Input
                placeholder="Link bukti transfer atau nomor referensi"
                value={bayarForm.bukti_pembayaran}
                onChange={(e) => setBayarForm(prev => ({ ...prev, bukti_pembayaran: e.target.value }))}
                data-testid="input-bukti"
              />
            </div>
            <div>
              <Label>Keterangan (Opsional)</Label>
              <Textarea
                placeholder="Keterangan tambahan..."
                value={bayarForm.keterangan}
                onChange={(e) => setBayarForm(prev => ({ ...prev, keterangan: e.target.value }))}
                data-testid="input-keterangan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBayarDialogOpen(false)}>Batal</Button>
            <Button onClick={handleBayar} data-testid="btn-submit-bayar">
              <Upload className="w-4 h-4 mr-2" />
              Ajukan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Riwayat Pembayaran</DialogTitle>
            <DialogDescription>
              {selectedTagihan?.kategori_nama} - {selectedTagihan?.tahun_akademik_label}
            </DialogDescription>
          </DialogHeader>
          {selectedTagihan && (
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Total Tagihan</p>
                  <p className="font-bold">{formatCurrency(selectedTagihan.nominal)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Sisa</p>
                  <p className="font-bold text-red-600">{formatCurrency(selectedTagihan.sisa_tagihan)}</p>
                </div>
              </div>
              {getTagihanPembayaran(selectedTagihan.id).length === 0 ? (
                <p className="text-center py-4 text-gray-500">Belum ada pembayaran</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getTagihanPembayaran(selectedTagihan.id).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(p.nominal)}</p>
                        <p className="text-sm text-gray-500">{formatDate(p.created_at)}</p>
                      </div>
                      <div className="text-right">
                        {getPembayaranStatusBadge(p.status)}
                        <p className="text-xs text-gray-500 capitalize mt-1">{p.metode_pembayaran?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsHistoryDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KeuanganPage;
