import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
import { keuanganAPI, tahunAkademikAPI, prodiAPI, mahasiswaAPI } from '../../lib/api';
import { 
  Plus, 
  Search, 
  Trash2, 
  CreditCard, 
  FileText,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const ManajemenTagihan = () => {
  const [tagihan, setTagihan] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [rekap, setRekap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isKategoriDialogOpen, setIsKategoriDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  // Filters
  const [filterTahunAkademik, setFilterTahunAkademik] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    mahasiswa_id: '',
    tahun_akademik_id: '',
    kategori_ukt_id: '',
    jatuh_tempo: ''
  });

  const [kategoriForm, setKategoriForm] = useState({
    nama: '',
    nominal: '',
    deskripsi: ''
  });

  const [batchForm, setBatchForm] = useState({
    tahun_akademik_id: '',
    prodi_id: '',
    jatuh_tempo: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTagihan();
  }, [filterTahunAkademik, filterStatus, filterProdi]);

  const loadInitialData = async () => {
    try {
      const [taRes, prodiRes, kategoriRes, mahasiswaRes] = await Promise.all([
        tahunAkademikAPI.getAll(),
        prodiAPI.getAll(),
        keuanganAPI.getKategoriUKT(),
        mahasiswaAPI.getAll()
      ]);
      setTahunAkademikList(taRes.data);
      setProdiList(prodiRes.data);
      setKategoriList(kategoriRes.data);
      setMahasiswaList(mahasiswaRes.data);

      // Set default tahun akademik to active one
      const activeTA = taRes.data.find(ta => ta.is_active);
      if (activeTA) {
        setFilterTahunAkademik(activeTA.id);
        setFormData(prev => ({ ...prev, tahun_akademik_id: activeTA.id }));
        setBatchForm(prev => ({ ...prev, tahun_akademik_id: activeTA.id }));
      }
    } catch (error) {
      toast.error('Gagal memuat data awal');
    }
  };

  const loadTagihan = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus === 'all' ? null : filterStatus || null;
      const prodiParam = filterProdi === 'all' ? null : filterProdi || null;
      const [tagihanRes, rekapRes] = await Promise.all([
        keuanganAPI.getTagihan(filterTahunAkademik || null, statusParam, prodiParam),
        filterTahunAkademik ? keuanganAPI.getRekap(filterTahunAkademik) : Promise.resolve({ data: null })
      ]);
      setTagihan(tagihanRes.data);
      setRekap(rekapRes.data);
    } catch (error) {
      toast.error('Gagal memuat data tagihan');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTagihan = async () => {
    try {
      await keuanganAPI.createTagihan(formData);
      toast.success('Tagihan berhasil dibuat');
      setIsDialogOpen(false);
      setFormData({ mahasiswa_id: '', tahun_akademik_id: filterTahunAkademik, kategori_ukt_id: '', jatuh_tempo: '' });
      loadTagihan();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat tagihan');
    }
  };

  const handleCreateBatch = async () => {
    try {
      const res = await keuanganAPI.createTagihanBatch(batchForm);
      toast.success(res.data.message);
      setIsBatchDialogOpen(false);
      loadTagihan();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat tagihan batch');
    }
  };

  const handleDeleteTagihan = async (id) => {
    if (!window.confirm('Yakin ingin menghapus tagihan ini?')) return;
    try {
      await keuanganAPI.deleteTagihan(id);
      toast.success('Tagihan berhasil dihapus');
      loadTagihan();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus tagihan');
    }
  };

  const handleCreateKategori = async () => {
    try {
      await keuanganAPI.createKategoriUKT({
        ...kategoriForm,
        nominal: parseFloat(kategoriForm.nominal)
      });
      toast.success('Kategori UKT berhasil dibuat');
      setIsKategoriDialogOpen(false);
      setKategoriForm({ nama: '', nominal: '', deskripsi: '' });
      const res = await keuanganAPI.getKategoriUKT();
      setKategoriList(res.data);
    } catch (error) {
      toast.error('Gagal membuat kategori');
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredTagihan = tagihan.filter(t => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      t.mahasiswa_nama?.toLowerCase().includes(search) ||
      t.mahasiswa_nim?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6" data-testid="manajemen-tagihan-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Tagihan UKT</h1>
          <p className="text-gray-500 mt-1">Kelola tagihan UKT/SPP mahasiswa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsKategoriDialogOpen(true)} data-testid="btn-kategori">
            <CreditCard className="w-4 h-4 mr-2" />
            Kelola Kategori
          </Button>
          <Button variant="outline" onClick={() => setIsBatchDialogOpen(true)} data-testid="btn-batch">
            <Users className="w-4 h-4 mr-2" />
            Buat Tagihan Batch
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="btn-tambah-tagihan">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Tagihan
          </Button>
        </div>
      </div>

      {/* Rekap Cards */}
      {rekap && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tagihan</p>
                  <p className="text-lg font-bold">{formatCurrency(rekap.total_tagihan)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Terbayar</p>
                  <p className="text-lg font-bold">{formatCurrency(rekap.total_terbayar)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Belum Terbayar</p>
                  <p className="text-lg font-bold">{formatCurrency(rekap.total_belum_bayar)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status Mahasiswa</p>
                  <p className="text-sm">
                    <span className="text-green-600">{rekap.jumlah_mahasiswa_lunas} Lunas</span> | 
                    <span className="text-yellow-600 ml-1">{rekap.jumlah_mahasiswa_cicilan} Cicilan</span> | 
                    <span className="text-red-600 ml-1">{rekap.jumlah_mahasiswa_belum_bayar} Belum</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                  <SelectItem value="cicilan">Cicilan</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
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
                  data-testid="search-mahasiswa"
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
            Daftar Tagihan ({filteredTagihan.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama Mahasiswa</TableHead>
                  <TableHead>Prodi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-right">Terbayar</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredTagihan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Tidak ada data tagihan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTagihan.map((item) => (
                    <TableRow key={item.id} data-testid={`tagihan-row-${item.id}`}>
                      <TableCell className="font-medium">{item.mahasiswa_nim}</TableCell>
                      <TableCell>{item.mahasiswa_nama}</TableCell>
                      <TableCell>{item.prodi_nama}</TableCell>
                      <TableCell>{item.kategori_nama}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.nominal)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(item.total_dibayar)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(item.sisa_tagihan)}</TableCell>
                      <TableCell>{item.jatuh_tempo}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTagihan(item.id)}
                          disabled={item.total_dibayar > 0}
                          data-testid={`btn-delete-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Create Tagihan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Tagihan Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mahasiswa</Label>
              <Select 
                value={formData.mahasiswa_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, mahasiswa_id: v }))}
              >
                <SelectTrigger data-testid="select-mahasiswa">
                  <SelectValue placeholder="Pilih Mahasiswa" />
                </SelectTrigger>
                <SelectContent>
                  {mahasiswaList.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nim} - {m.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tahun Akademik</Label>
              <Select 
                value={formData.tahun_akademik_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, tahun_akademik_id: v }))}
              >
                <SelectTrigger data-testid="select-tahun-akademik">
                  <SelectValue placeholder="Pilih Tahun Akademik" />
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
              <Label>Kategori UKT</Label>
              <Select 
                value={formData.kategori_ukt_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, kategori_ukt_id: v }))}
              >
                <SelectTrigger data-testid="select-kategori">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriList.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama} - {formatCurrency(k.nominal)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jatuh Tempo</Label>
              <Input
                type="date"
                value={formData.jatuh_tempo}
                onChange={(e) => setFormData(prev => ({ ...prev, jatuh_tempo: e.target.value }))}
                data-testid="input-jatuh-tempo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateTagihan} data-testid="btn-simpan-tagihan">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Tagihan Dialog */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Tagihan Batch</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Buat tagihan untuk semua mahasiswa aktif sekaligus berdasarkan kategori UKT masing-masing.
          </p>
          <div className="space-y-4">
            <div>
              <Label>Tahun Akademik</Label>
              <Select 
                value={batchForm.tahun_akademik_id} 
                onValueChange={(v) => setBatchForm(prev => ({ ...prev, tahun_akademik_id: v }))}
              >
                <SelectTrigger data-testid="batch-tahun-akademik">
                  <SelectValue placeholder="Pilih Tahun Akademik" />
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
              <Label>Program Studi (Opsional)</Label>
              <Select 
                value={batchForm.prodi_id} 
                onValueChange={(v) => setBatchForm(prev => ({ ...prev, prodi_id: v }))}
              >
                <SelectTrigger data-testid="batch-prodi">
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
            <div>
              <Label>Jatuh Tempo</Label>
              <Input
                type="date"
                value={batchForm.jatuh_tempo}
                onChange={(e) => setBatchForm(prev => ({ ...prev, jatuh_tempo: e.target.value }))}
                data-testid="batch-jatuh-tempo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateBatch} data-testid="btn-buat-batch">Buat Tagihan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kategori UKT Dialog */}
      <Dialog open={isKategoriDialogOpen} onOpenChange={setIsKategoriDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kelola Kategori UKT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add new kategori */}
            <div className="grid grid-cols-4 gap-2 items-end">
              <div>
                <Label>Nama Kategori</Label>
                <Input
                  placeholder="UKT 1, UKT 2, dll"
                  value={kategoriForm.nama}
                  onChange={(e) => setKategoriForm(prev => ({ ...prev, nama: e.target.value }))}
                  data-testid="input-kategori-nama"
                />
              </div>
              <div>
                <Label>Nominal</Label>
                <Input
                  type="number"
                  placeholder="5000000"
                  value={kategoriForm.nominal}
                  onChange={(e) => setKategoriForm(prev => ({ ...prev, nominal: e.target.value }))}
                  data-testid="input-kategori-nominal"
                />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Input
                  placeholder="Keterangan"
                  value={kategoriForm.deskripsi}
                  onChange={(e) => setKategoriForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                  data-testid="input-kategori-deskripsi"
                />
              </div>
              <Button onClick={handleCreateKategori} data-testid="btn-tambah-kategori">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {/* List kategori */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kategoriList.map(k => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.nama}</TableCell>
                      <TableCell className="text-right">{formatCurrency(k.nominal)}</TableCell>
                      <TableCell className="text-gray-500">{k.deskripsi || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsKategoriDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManajemenTagihan;
