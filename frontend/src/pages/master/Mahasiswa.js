import React, { useEffect, useState } from 'react';
import { mahasiswaAPI, prodiAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Plus, Pencil, Trash2, Loader2, GraduationCap, Search } from 'lucide-react';
import { toast } from 'sonner';

const Mahasiswa = () => {
  const [data, setData] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterProdi, setFilterProdi] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    nim: '',
    nama: '',
    email: '',
    prodi_id: '',
    tahun_masuk: '',
    status: 'aktif',
    jenis_kelamin: '',
    no_hp: '',
    password: '',
  });

  useEffect(() => {
    loadProdi();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterProdi, filterStatus]);

  const loadData = async () => {
    try {
      const response = await mahasiswaAPI.getAll(
        filterProdi || null,
        filterStatus || null
      );
      setData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadProdi = async () => {
    try {
      const response = await prodiAPI.getAll();
      setProdiList(response.data);
    } catch (error) {
      console.error('Failed to load prodi');
    }
  };

  const openDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        nim: item.nim,
        nama: item.nama,
        email: item.email,
        prodi_id: item.prodi_id,
        tahun_masuk: item.tahun_masuk,
        status: item.status,
        jenis_kelamin: item.jenis_kelamin || '',
        no_hp: item.no_hp || '',
        password: '',
      });
    } else {
      setEditingItem(null);
      setForm({
        nim: '',
        nama: '',
        email: '',
        prodi_id: '',
        tahun_masuk: new Date().getFullYear().toString(),
        status: 'aktif',
        jenis_kelamin: '',
        no_hp: '',
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingItem) {
        const { password, ...updateData } = form;
        await mahasiswaAPI.update(editingItem.id, updateData);
        toast.success('Data berhasil diperbarui');
      } else {
        await mahasiswaAPI.create(form);
        toast.success('Data berhasil ditambahkan');
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus mahasiswa ${item.nama}?`)) return;
    
    try {
      await mahasiswaAPI.delete(item.id);
      toast.success('Data berhasil dihapus');
      loadData();
    } catch (error) {
      toast.error('Gagal menghapus data');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      aktif: 'bg-emerald-100 text-emerald-700',
      cuti: 'bg-amber-100 text-amber-700',
      lulus: 'bg-blue-100 text-blue-700',
      drop_out: 'bg-rose-100 text-rose-700',
    };
    const labels = {
      aktif: 'Aktif',
      cuti: 'Cuti',
      lulus: 'Lulus',
      drop_out: 'Drop Out',
    };
    return <Badge className={styles[status] || 'bg-slate-100 text-slate-700'}>{labels[status] || status}</Badge>;
  };

  const filteredData = data.filter(item =>
    item.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="mahasiswa-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Mahasiswa</h2>
          <p className="text-sm text-slate-500">Kelola data mahasiswa</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-mhs-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Cari NIM atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="search-mhs"
          />
        </div>
        <div className="w-48">
          <Select value={filterProdi} onValueChange={setFilterProdi}>
            <SelectTrigger data-testid="filter-prodi-mhs">
              <SelectValue placeholder="Filter Prodi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Prodi</SelectItem>
              {prodiList.map((prodi) => (
                <SelectItem key={prodi.id} value={prodi.id}>{prodi.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger data-testid="filter-status-mhs">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="cuti">Cuti</SelectItem>
              <SelectItem value="lulus">Lulus</SelectItem>
              <SelectItem value="drop_out">Drop Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIM</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Angkatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data mahasiswa</p>
                    <Button variant="link" onClick={() => openDialog()} className="mt-2">
                      Tambahkan sekarang
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 30}ms` }}>
                    <TableCell className="font-mono text-sm">{item.nim}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell className="text-slate-600">{item.prodi_nama || '-'}</TableCell>
                    <TableCell>{item.tahun_masuk}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)} data-testid={`edit-mhs-${item.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" data-testid={`delete-mhs-${item.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nim">NIM</Label>
                <Input id="nim" placeholder="Contoh: 2024001" value={form.nim} onChange={(e) => setForm({ ...form, nim: e.target.value })} required disabled={!!editingItem} data-testid="input-nim" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahun_masuk">Tahun Masuk</Label>
                <Input id="tahun_masuk" placeholder="Contoh: 2024" value={form.tahun_masuk} onChange={(e) => setForm({ ...form, tahun_masuk: e.target.value })} required data-testid="input-tahun-masuk" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input id="nama" placeholder="Nama lengkap mahasiswa" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required data-testid="input-nama-mhs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@mahasiswa.ac.id" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="input-email-mhs" />
            </div>
            {!editingItem && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Password untuk login" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required data-testid="input-password-mhs" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prodi">Program Studi</Label>
                <Select value={form.prodi_id} onValueChange={(value) => setForm({ ...form, prodi_id: value })}>
                  <SelectTrigger data-testid="select-prodi-mhs">
                    <SelectValue placeholder="Pilih prodi" />
                  </SelectTrigger>
                  <SelectContent>
                    {prodiList.map((prodi) => (
                      <SelectItem key={prodi.id} value={prodi.id}>{prodi.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger data-testid="select-status-mhs">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="cuti">Cuti</SelectItem>
                    <SelectItem value="lulus">Lulus</SelectItem>
                    <SelectItem value="drop_out">Drop Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <Select value={form.jenis_kelamin} onValueChange={(value) => setForm({ ...form, jenis_kelamin: value })}>
                  <SelectTrigger data-testid="select-jk-mhs">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_hp">No. HP</Label>
                <Input id="no_hp" placeholder="08xxxxxxxxxx" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} data-testid="input-nohp-mhs" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="submit-mhs">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingItem ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mahasiswa;
