import React, { useEffect, useState } from 'react';
import { dosenAPI, prodiAPI } from '../../lib/api';
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
import { Plus, Pencil, Trash2, Loader2, UserCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

const Dosen = () => {
  const [data, setData] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    nidn: '',
    nama: '',
    email: '',
    prodi_id: '',
    jabatan_fungsional: '',
    status: 'aktif',
    jenis_kelamin: '',
    no_hp: '',
    password: '',
  });

  useEffect(() => {
    loadData();
    loadProdi();
  }, []);

  const loadData = async () => {
    try {
      const response = await dosenAPI.getAll();
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
        nidn: item.nidn,
        nama: item.nama,
        email: item.email,
        prodi_id: item.prodi_id || '',
        jabatan_fungsional: item.jabatan_fungsional || '',
        status: item.status,
        jenis_kelamin: item.jenis_kelamin || '',
        no_hp: item.no_hp || '',
        password: '',
      });
    } else {
      setEditingItem(null);
      setForm({
        nidn: '',
        nama: '',
        email: '',
        prodi_id: '',
        jabatan_fungsional: '',
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
        await dosenAPI.update(editingItem.id, updateData);
        toast.success('Data berhasil diperbarui');
      } else {
        await dosenAPI.create(form);
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
    if (!window.confirm(`Hapus dosen ${item.nama}?`)) return;
    
    try {
      await dosenAPI.delete(item.id);
      toast.success('Data berhasil dihapus');
      loadData();
    } catch (error) {
      toast.error('Gagal menghapus data');
    }
  };

  const filteredData = data.filter(item =>
    item.nidn.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="space-y-6" data-testid="dosen-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Dosen</h2>
          <p className="text-sm text-slate-500">Kelola data dosen</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-dosen-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Cari NIDN atau nama..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="search-dosen"
        />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIDN</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    <UserCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data dosen</p>
                    <Button variant="link" onClick={() => openDialog()} className="mt-2">
                      Tambahkan sekarang
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 30}ms` }}>
                    <TableCell className="font-mono text-sm">{item.nidn}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell className="text-slate-600">{item.prodi_nama || '-'}</TableCell>
                    <TableCell className="text-slate-600">{item.jabatan_fungsional || '-'}</TableCell>
                    <TableCell>
                      {item.status === 'aktif' ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)} data-testid={`edit-dosen-${item.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" data-testid={`delete-dosen-${item.id}`}>
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
            <DialogTitle>{editingItem ? 'Edit Dosen' : 'Tambah Dosen'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nidn">NIDN</Label>
                <Input id="nidn" placeholder="Contoh: 0001018901" value={form.nidn} onChange={(e) => setForm({ ...form, nidn: e.target.value })} required disabled={!!editingItem} data-testid="input-nidn" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <Select value={form.jenis_kelamin} onValueChange={(value) => setForm({ ...form, jenis_kelamin: value })}>
                  <SelectTrigger data-testid="select-jk-dosen">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input id="nama" placeholder="Nama lengkap dosen" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required data-testid="input-nama-dosen" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@dosen.ac.id" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="input-email-dosen" />
            </div>
            {!editingItem && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Password untuk login" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required data-testid="input-password-dosen" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prodi">Program Studi</Label>
                <Select value={form.prodi_id} onValueChange={(value) => setForm({ ...form, prodi_id: value })}>
                  <SelectTrigger data-testid="select-prodi-dosen">
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
                <Label htmlFor="jabatan">Jabatan Fungsional</Label>
                <Select value={form.jabatan_fungsional} onValueChange={(value) => setForm({ ...form, jabatan_fungsional: value })}>
                  <SelectTrigger data-testid="select-jabatan-dosen">
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asisten Ahli">Asisten Ahli</SelectItem>
                    <SelectItem value="Lektor">Lektor</SelectItem>
                    <SelectItem value="Lektor Kepala">Lektor Kepala</SelectItem>
                    <SelectItem value="Guru Besar">Guru Besar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_hp">No. HP</Label>
              <Input id="no_hp" placeholder="08xxxxxxxxxx" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} data-testid="input-nohp-dosen" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="submit-dosen">
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

export default Dosen;
