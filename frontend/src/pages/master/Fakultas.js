import React, { useEffect, useState } from 'react';
import { fakultasAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
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
import { Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const Fakultas = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    kode: '',
    nama: '',
    dekan: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fakultasAPI.getAll();
      setData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        kode: item.kode,
        nama: item.nama,
        dekan: item.dekan || '',
      });
    } else {
      setEditingItem(null);
      setForm({ kode: '', nama: '', dekan: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingItem) {
        await fakultasAPI.update(editingItem.id, form);
        toast.success('Data berhasil diperbarui');
      } else {
        await fakultasAPI.create(form);
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
    if (!window.confirm(`Hapus fakultas ${item.nama}?`)) return;
    
    try {
      await fakultasAPI.delete(item.id);
      toast.success('Data berhasil dihapus');
      loadData();
    } catch (error) {
      toast.error('Gagal menghapus data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="fakultas-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Fakultas</h2>
          <p className="text-sm text-slate-500">Kelola data fakultas</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-fakultas-btn">
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
                <TableHead>Nama Fakultas</TableHead>
                <TableHead>Dekan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data fakultas</p>
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
                    <TableCell className="text-slate-600">{item.dekan || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)} data-testid={`edit-fak-${item.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" data-testid={`delete-fak-${item.id}`}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Fakultas' : 'Tambah Fakultas'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Fakultas</Label>
              <Input id="kode" placeholder="Contoh: FT" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} required data-testid="input-kode-fak" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Fakultas</Label>
              <Input id="nama" placeholder="Contoh: Fakultas Teknik" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required data-testid="input-nama-fak" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dekan">Nama Dekan (opsional)</Label>
              <Input id="dekan" placeholder="Nama dekan" value={form.dekan} onChange={(e) => setForm({ ...form, dekan: e.target.value })} data-testid="input-dekan" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="submit-fak">
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

export default Fakultas;
