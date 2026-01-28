import React, { useEffect, useState } from 'react';
import { tahunAkademikAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
import { Plus, Pencil, Trash2, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const TahunAkademik = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    tahun: '',
    semester: 'Ganjil',
    is_active: false,
    tanggal_mulai: '',
    tanggal_selesai: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await tahunAkademikAPI.getAll();
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
        tahun: item.tahun,
        semester: item.semester,
        is_active: item.is_active,
        tanggal_mulai: item.tanggal_mulai || '',
        tanggal_selesai: item.tanggal_selesai || '',
      });
    } else {
      setEditingItem(null);
      setForm({
        tahun: '',
        semester: 'Ganjil',
        is_active: false,
        tanggal_mulai: '',
        tanggal_selesai: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingItem) {
        await tahunAkademikAPI.update(editingItem.id, form);
        toast.success('Data berhasil diperbarui');
      } else {
        await tahunAkademikAPI.create(form);
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
    if (!window.confirm(`Hapus tahun akademik ${item.tahun} - ${item.semester}?`)) return;
    
    try {
      await tahunAkademikAPI.delete(item.id);
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
    <div className="space-y-6" data-testid="tahun-akademik-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Tahun Akademik</h2>
          <p className="text-sm text-slate-500">Kelola data tahun akademik dan semester</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-tahun-akademik-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tahun Akademik</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data tahun akademik</p>
                    <Button variant="link" onClick={() => openDialog()} className="mt-2">
                      Tambahkan sekarang
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                    <TableCell className="font-medium">{item.tahun}</TableCell>
                    <TableCell>{item.semester}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {item.tanggal_mulai && item.tanggal_selesai 
                        ? `${item.tanggal_mulai} - ${item.tanggal_selesai}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(item)}
                          data-testid={`edit-ta-${item.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                          className="text-red-500 hover:text-red-700"
                          data-testid={`delete-ta-${item.id}`}
                        >
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

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun Akademik</Label>
              <Input
                id="tahun"
                placeholder="Contoh: 2024/2025"
                value={form.tahun}
                onChange={(e) => setForm({ ...form, tahun: e.target.value })}
                required
                data-testid="input-tahun"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={form.semester}
                onValueChange={(value) => setForm({ ...form, semester: value })}
              >
                <SelectTrigger data-testid="select-semester">
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ganjil">Ganjil</SelectItem>
                  <SelectItem value="Genap">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                <Input
                  id="tanggal_mulai"
                  type="date"
                  value={form.tanggal_mulai}
                  onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                  data-testid="input-tanggal-mulai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                <Input
                  id="tanggal_selesai"
                  type="date"
                  value={form.tanggal_selesai}
                  onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                  data-testid="input-tanggal-selesai"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="is_active">Aktifkan tahun akademik ini</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="submit-ta">
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

export default TahunAkademik;
