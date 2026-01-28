import React, { useEffect, useState } from 'react';
import { prodiAPI, fakultasAPI } from '../../lib/api';
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
import { Plus, Pencil, Trash2, Loader2, School } from 'lucide-react';
import { toast } from 'sonner';

const Prodi = () => {
  const [data, setData] = useState([]);
  const [fakultasList, setFakultasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    kode: '',
    nama: '',
    fakultas_id: '',
    jenjang: 'S1',
    akreditasi: '',
    kaprodi: '',
  });

  useEffect(() => {
    loadData();
    loadFakultas();
  }, []);

  const loadData = async () => {
    try {
      const response = await prodiAPI.getAll();
      setData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadFakultas = async () => {
    try {
      const response = await fakultasAPI.getAll();
      setFakultasList(response.data);
    } catch (error) {
      console.error('Failed to load fakultas');
    }
  };

  const openDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        kode: item.kode,
        nama: item.nama,
        fakultas_id: item.fakultas_id,
        jenjang: item.jenjang,
        akreditasi: item.akreditasi || '',
        kaprodi: item.kaprodi || '',
      });
    } else {
      setEditingItem(null);
      setForm({ kode: '', nama: '', fakultas_id: '', jenjang: 'S1', akreditasi: '', kaprodi: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingItem) {
        await prodiAPI.update(editingItem.id, form);
        toast.success('Data berhasil diperbarui');
      } else {
        await prodiAPI.create(form);
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
    if (!window.confirm(`Hapus program studi ${item.nama}?`)) return;
    
    try {
      await prodiAPI.delete(item.id);
      toast.success('Data berhasil dihapus');
      loadData();
    } catch (error) {
      toast.error('Gagal menghapus data');
    }
  };

  const getAkreditasiBadge = (akr) => {
    if (!akr) return <Badge variant="secondary">-</Badge>;
    const colors = {
      'A': 'bg-emerald-100 text-emerald-700',
      'B': 'bg-blue-100 text-blue-700',
      'C': 'bg-amber-100 text-amber-700',
      'Unggul': 'bg-emerald-100 text-emerald-700',
      'Baik Sekali': 'bg-blue-100 text-blue-700',
      'Baik': 'bg-amber-100 text-amber-700',
    };
    return <Badge className={colors[akr] || 'bg-slate-100 text-slate-700'}>{akr}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="prodi-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Program Studi</h2>
          <p className="text-sm text-slate-500">Kelola data program studi</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-prodi-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Program Studi</TableHead>
                <TableHead>Fakultas</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Akreditasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    <School className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data program studi</p>
                    <Button variant="link" onClick={() => openDialog()} className="mt-2">
                      Tambahkan sekarang
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                    <TableCell className="font-mono text-sm">{item.kode}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell className="text-slate-600">{item.fakultas_nama || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{item.jenjang}</Badge></TableCell>
                    <TableCell>{getAkreditasiBadge(item.akreditasi)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)} data-testid={`edit-prodi-${item.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" data-testid={`delete-prodi-${item.id}`}>
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
            <DialogTitle>{editingItem ? 'Edit Program Studi' : 'Tambah Program Studi'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kode">Kode Prodi</Label>
                <Input id="kode" placeholder="Contoh: TI" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} required data-testid="input-kode-prodi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenjang">Jenjang</Label>
                <Select value={form.jenjang} onValueChange={(value) => setForm({ ...form, jenjang: value })}>
                  <SelectTrigger data-testid="select-jenjang">
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D3">D3</SelectItem>
                    <SelectItem value="S1">S1</SelectItem>
                    <SelectItem value="S2">S2</SelectItem>
                    <SelectItem value="S3">S3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Program Studi</Label>
              <Input id="nama" placeholder="Contoh: Teknik Informatika" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required data-testid="input-nama-prodi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fakultas">Fakultas</Label>
              <Select value={form.fakultas_id} onValueChange={(value) => setForm({ ...form, fakultas_id: value })}>
                <SelectTrigger data-testid="select-fakultas">
                  <SelectValue placeholder="Pilih fakultas" />
                </SelectTrigger>
                <SelectContent>
                  {fakultasList.map((fak) => (
                    <SelectItem key={fak.id} value={fak.id}>{fak.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="akreditasi">Akreditasi</Label>
                <Select value={form.akreditasi} onValueChange={(value) => setForm({ ...form, akreditasi: value })}>
                  <SelectTrigger data-testid="select-akreditasi">
                    <SelectValue placeholder="Pilih akreditasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unggul">Unggul</SelectItem>
                    <SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
                    <SelectItem value="Baik">Baik</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kaprodi">Ketua Prodi</Label>
                <Input id="kaprodi" placeholder="Nama kaprodi" value={form.kaprodi} onChange={(e) => setForm({ ...form, kaprodi: e.target.value })} data-testid="input-kaprodi" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="submit-prodi">
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

export default Prodi;
