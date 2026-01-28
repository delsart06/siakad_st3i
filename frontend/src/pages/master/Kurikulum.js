import React, { useEffect, useState } from 'react';
import { kurikulumAPI, prodiAPI } from '../../lib/api';
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
import { Switch } from '../../components/ui/switch';
import { Plus, Pencil, Trash2, Loader2, BookMarked } from 'lucide-react';
import { toast } from 'sonner';

const Kurikulum = () => {
  const [data, setData] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    kode: '',
    nama: '',
    tahun: '',
    prodi_id: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
    loadProdi();
  }, []);

  const loadData = async () => {
    try {
      const response = await kurikulumAPI.getAll();
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
        kode: item.kode,
        nama: item.nama,
        tahun: item.tahun,
        prodi_id: item.prodi_id,
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setForm({ kode: '', nama: '', tahun: '', prodi_id: '', is_active: true });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingItem) {
        await kurikulumAPI.update(editingItem.id, form);
        toast.success('Data berhasil diperbarui');
      } else {
        await kurikulumAPI.create(form);
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
    if (!window.confirm(`Hapus kurikulum ${item.nama}?`)) return;
    
    try {
      await kurikulumAPI.delete(item.id);
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
    <div className="space-y-6" data-testid="kurikulum-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Kurikulum</h2>
          <p className="text-sm text-slate-500">Kelola data kurikulum per program studi</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-kurikulum-btn">
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
                <TableHead>Nama Kurikulum</TableHead>
                <TableHead>Tahun</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    <BookMarked className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data kurikulum</p>
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
                    <TableCell>{item.tahun}</TableCell>
                    <TableCell className="text-slate-600">{item.prodi_nama || '-'}</TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)} data-testid={`edit-kur-${item.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" data-testid={`delete-kur-${item.id}`}>
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
            <DialogTitle>{editingItem ? 'Edit Kurikulum' : 'Tambah Kurikulum'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kode">Kode Kurikulum</Label>
                <Input id="kode" placeholder="Contoh: K2024" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} required data-testid="input-kode-kur" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahun">Tahun</Label>
                <Input id="tahun" placeholder="Contoh: 2024" value={form.tahun} onChange={(e) => setForm({ ...form, tahun: e.target.value })} required data-testid="input-tahun-kur" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Kurikulum</Label>
              <Input id="nama" placeholder="Contoh: Kurikulum 2024 - OBE" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required data-testid="input-nama-kur" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prodi">Program Studi</Label>
              <Select value={form.prodi_id} onValueChange={(value) => setForm({ ...form, prodi_id: value })}>
                <SelectTrigger data-testid="select-prodi-kur">
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  {prodiList.map((prodi) => (
                    <SelectItem key={prodi.id} value={prodi.id}>{prodi.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} data-testid="switch-kur-active" />
              <Label htmlFor="is_active">Aktifkan kurikulum ini</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="submit-kur">
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

export default Kurikulum;
