import React, { useEffect, useState } from 'react';
import { mataKuliahAPI, kurikulumAPI } from '../../lib/api';
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
import { Plus, Pencil, Trash2, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const MataKuliah = () => {
  const [data, setData] = useState([]);
  const [kurikulumList, setKurikulumList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterKurikulum, setFilterKurikulum] = useState('');
  
  const [form, setForm] = useState({
    kode: '',
    nama: '',
    sks_teori: 0,
    sks_praktik: 0,
    semester: 1,
    kurikulum_id: '',
    prasyarat_ids: [],
  });

  useEffect(() => {
    loadData();
    loadKurikulum();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterKurikulum]);

  const loadData = async () => {
    try {
      const response = await mataKuliahAPI.getAll(filterKurikulum || null);
      setData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadKurikulum = async () => {
    try {
      const response = await kurikulumAPI.getAll();
      setKurikulumList(response.data);
    } catch (error) {
      console.error('Failed to load kurikulum');
    }
  };

  const openDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        kode: item.kode,
        nama: item.nama,
        sks_teori: item.sks_teori || 0,
        sks_praktik: item.sks_praktik || 0,
        semester: item.semester,
        kurikulum_id: item.kurikulum_id,
        prasyarat_ids: item.prasyarat_ids || [],
      });
    } else {
      setEditingItem(null);
      setForm({ kode: '', nama: '', sks_teori: 0, sks_praktik: 0, semester: 1, kurikulum_id: '', prasyarat_ids: [] });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const submitData = {
        ...form,
        sks_teori: parseInt(form.sks_teori) || 0,
        sks_praktik: parseInt(form.sks_praktik) || 0,
        semester: parseInt(form.semester) || 1,
      };
      
      if (editingItem) {
        await mataKuliahAPI.update(editingItem.id, submitData);
        toast.success('Data berhasil diperbarui');
      } else {
        await mataKuliahAPI.create(submitData);
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
    if (!window.confirm(`Hapus mata kuliah ${item.nama}?`)) return;
    
    try {
      await mataKuliahAPI.delete(item.id);
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
    <div className="space-y-6" data-testid="matakuliah-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Mata Kuliah</h2>
          <p className="text-sm text-slate-500">Kelola data mata kuliah</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-mk-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={filterKurikulum} onValueChange={setFilterKurikulum}>
            <SelectTrigger data-testid="filter-kurikulum">
              <SelectValue placeholder="Filter Kurikulum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kurikulum</SelectItem>
              {kurikulumList.map((kur) => (
                <SelectItem key={kur.id} value={kur.id}>{kur.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Mata Kuliah</TableHead>
                <TableHead className="text-center">SKS</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data mata kuliah</p>
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
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Badge variant="outline" className="text-xs">{item.sks_teori}T</Badge>
                        <Badge variant="outline" className="text-xs">{item.sks_praktik}P</Badge>
                        <Badge className="bg-blue-100 text-blue-700 text-xs">{item.total_sks} SKS</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">Sem {item.semester}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)} data-testid={`edit-mk-${item.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" data-testid={`delete-mk-${item.id}`}>
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
            <DialogTitle>{editingItem ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kode">Kode MK</Label>
                <Input id="kode" placeholder="Contoh: IF101" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} required data-testid="input-kode-mk" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select value={String(form.semester)} onValueChange={(value) => setForm({ ...form, semester: parseInt(value) })}>
                  <SelectTrigger data-testid="select-semester-mk">
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map((sem) => (
                      <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Mata Kuliah</Label>
              <Input id="nama" placeholder="Contoh: Pemrograman Web" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required data-testid="input-nama-mk" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sks_teori">SKS Teori</Label>
                <Input id="sks_teori" type="number" min="0" max="6" value={form.sks_teori} onChange={(e) => setForm({ ...form, sks_teori: e.target.value })} data-testid="input-sks-teori" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sks_praktik">SKS Praktik</Label>
                <Input id="sks_praktik" type="number" min="0" max="6" value={form.sks_praktik} onChange={(e) => setForm({ ...form, sks_praktik: e.target.value })} data-testid="input-sks-praktik" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurikulum">Kurikulum</Label>
              <Select value={form.kurikulum_id} onValueChange={(value) => setForm({ ...form, kurikulum_id: value })}>
                <SelectTrigger data-testid="select-kurikulum-mk">
                  <SelectValue placeholder="Pilih kurikulum" />
                </SelectTrigger>
                <SelectContent>
                  {kurikulumList.map((kur) => (
                    <SelectItem key={kur.id} value={kur.id}>{kur.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="submit-mk">
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

export default MataKuliah;
