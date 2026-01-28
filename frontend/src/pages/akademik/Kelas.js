import React, { useEffect, useState } from 'react';
import { kelasAPI, mataKuliahAPI, dosenAPI, tahunAkademikAPI } from '../../lib/api';
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
import { Plus, Pencil, Trash2, Loader2, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';

const Kelas = () => {
  const [data, setData] = useState([]);
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterTA, setFilterTA] = useState('');
  
  const [form, setForm] = useState({
    kode_kelas: '',
    mata_kuliah_id: '',
    dosen_id: '',
    tahun_akademik_id: '',
    kuota: 40,
    jadwal: '',
    ruangan: '',
  });

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterTA]);

  const loadMasterData = async () => {
    try {
      const [mkRes, dosenRes, taRes] = await Promise.all([
        mataKuliahAPI.getAll(),
        dosenAPI.getAll(),
        tahunAkademikAPI.getAll(),
      ]);
      setMataKuliahList(mkRes.data);
      setDosenList(dosenRes.data);
      setTahunAkademikList(taRes.data);
      
      // Set default filter to active TA
      const activeTA = taRes.data.find(ta => ta.is_active);
      if (activeTA) setFilterTA(activeTA.id);
    } catch (error) {
      console.error('Failed to load master data');
    }
  };

  const loadData = async () => {
    try {
      const response = await kelasAPI.getAll(filterTA || null);
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
        kode_kelas: item.kode_kelas,
        mata_kuliah_id: item.mata_kuliah_id,
        dosen_id: item.dosen_id,
        tahun_akademik_id: item.tahun_akademik_id,
        kuota: item.kuota,
        jadwal: item.jadwal || '',
        ruangan: item.ruangan || '',
      });
    } else {
      setEditingItem(null);
      const activeTA = tahunAkademikList.find(ta => ta.is_active);
      setForm({
        kode_kelas: '',
        mata_kuliah_id: '',
        dosen_id: '',
        tahun_akademik_id: activeTA?.id || '',
        kuota: 40,
        jadwal: '',
        ruangan: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const submitData = { ...form, kuota: parseInt(form.kuota) || 40 };
      
      if (editingItem) {
        await kelasAPI.update(editingItem.id, submitData);
        toast.success('Data berhasil diperbarui');
      } else {
        await kelasAPI.create(submitData);
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
    if (!window.confirm(`Hapus kelas ${item.kode_kelas}?`)) return;
    
    try {
      await kelasAPI.delete(item.id);
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
    <div className="space-y-6" data-testid="kelas-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Penawaran Kelas</h2>
          <p className="text-sm text-slate-500">Kelola penawaran kelas per semester</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-kelas-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kelas
        </Button>
      </div>

      {/* Filter */}
      <div className="w-64">
        <Select value={filterTA} onValueChange={setFilterTA}>
          <SelectTrigger data-testid="filter-ta-kelas">
            <SelectValue placeholder="Filter Tahun Akademik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Tahun Akademik</SelectItem>
            {tahunAkademikList.map((ta) => (
              <SelectItem key={ta.id} value={ta.id}>
                {ta.tahun} - {ta.semester} {ta.is_active && '(Aktif)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Kelas</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Ruangan</TableHead>
                <TableHead className="text-center">Peserta</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada penawaran kelas</p>
                    <Button variant="link" onClick={() => openDialog()} className="mt-2">
                      Tambahkan sekarang
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 30}ms` }}>
                    <TableCell className="font-mono text-sm">{item.kode_kelas}</TableCell>
                    <TableCell className="font-medium">{item.mata_kuliah_nama || '-'}</TableCell>
                    <TableCell className="text-slate-600">{item.dosen_nama || '-'}</TableCell>
                    <TableCell className="text-slate-600">{item.jadwal || '-'}</TableCell>
                    <TableCell className="text-slate-600">{item.ruangan || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.jumlah_peserta >= item.kuota ? 'destructive' : 'secondary'}>
                        <Users className="w-3 h-3 mr-1" />
                        {item.jumlah_peserta}/{item.kuota}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)} data-testid={`edit-kelas-${item.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" data-testid={`delete-kelas-${item.id}`}>
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
            <DialogTitle>{editingItem ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kode_kelas">Kode Kelas</Label>
                <Input id="kode_kelas" placeholder="Contoh: IF101-A" value={form.kode_kelas} onChange={(e) => setForm({ ...form, kode_kelas: e.target.value })} required data-testid="input-kode-kelas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kuota">Kuota</Label>
                <Input id="kuota" type="number" min="1" max="100" value={form.kuota} onChange={(e) => setForm({ ...form, kuota: e.target.value })} data-testid="input-kuota" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mata_kuliah">Mata Kuliah</Label>
              <Select value={form.mata_kuliah_id} onValueChange={(value) => setForm({ ...form, mata_kuliah_id: value })}>
                <SelectTrigger data-testid="select-mk-kelas">
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {mataKuliahList.map((mk) => (
                    <SelectItem key={mk.id} value={mk.id}>{mk.kode} - {mk.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosen">Dosen Pengampu</Label>
              <Select value={form.dosen_id} onValueChange={(value) => setForm({ ...form, dosen_id: value })}>
                <SelectTrigger data-testid="select-dosen-kelas">
                  <SelectValue placeholder="Pilih dosen" />
                </SelectTrigger>
                <SelectContent>
                  {dosenList.map((dosen) => (
                    <SelectItem key={dosen.id} value={dosen.id}>{dosen.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahun_akademik">Tahun Akademik</Label>
              <Select value={form.tahun_akademik_id} onValueChange={(value) => setForm({ ...form, tahun_akademik_id: value })}>
                <SelectTrigger data-testid="select-ta-kelas">
                  <SelectValue placeholder="Pilih tahun akademik" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAkademikList.map((ta) => (
                    <SelectItem key={ta.id} value={ta.id}>{ta.tahun} - {ta.semester}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jadwal">Jadwal</Label>
                <Input id="jadwal" placeholder="Contoh: Senin 08:00-10:00" value={form.jadwal} onChange={(e) => setForm({ ...form, jadwal: e.target.value })} data-testid="input-jadwal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruangan">Ruangan</Label>
                <Input id="ruangan" placeholder="Contoh: R.301" value={form.ruangan} onChange={(e) => setForm({ ...form, ruangan: e.target.value })} data-testid="input-ruangan" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="submit-kelas">
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

export default Kelas;
