import React, { useEffect, useState } from 'react';
import { jadwalAPI, tahunAkademikAPI, mataKuliahAPI, dosenMasterAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Loader2, Calendar, Clock, MapPin, Plus, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const JadwalKuliah = () => {
  const [jadwalList, setJadwalList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedHari, setSelectedHari] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [formData, setFormData] = useState({
    kode_kelas: '',
    mata_kuliah_id: '',
    dosen_id: '',
    hari: '',
    jam_mulai: '08:00',
    jam_selesai: '10:00',
    ruangan: '',
    kuota: 40,
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTA) {
      loadJadwal();
    }
  }, [selectedTA, selectedHari]);

  const loadInitialData = async () => {
    try {
      const [taRes, mkRes, dosenRes] = await Promise.all([
        tahunAkademikAPI.getAll(),
        mataKuliahAPI.getAll(),
        dosenMasterAPI.getAll(),
      ]);
      
      setTahunAkademikList(taRes.data);
      setMataKuliahList(mkRes.data);
      setDosenList(dosenRes.data);
      
      const activeTA = taRes.data.find(ta => ta.is_active);
      if (activeTA) {
        setSelectedTA(activeTA.id);
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadJadwal = async () => {
    try {
      const response = await jadwalAPI.getAll(selectedTA, selectedHari || null);
      setJadwalList(response.data);
    } catch (error) {
      console.error('Failed to load jadwal:', error);
    }
  };

  const checkConflicts = async () => {
    if (!formData.hari || !formData.jam_mulai || !formData.jam_selesai) return;
    
    try {
      const response = await jadwalAPI.checkConflict({
        hari: formData.hari,
        jam_mulai: formData.jam_mulai,
        jam_selesai: formData.jam_selesai,
        tahun_akademik_id: selectedTA,
        dosen_id: formData.dosen_id || null,
        ruangan: formData.ruangan || null,
        exclude_kelas_id: editId || null,
      });
      setConflicts(response.data.conflicts || []);
    } catch (error) {
      console.error('Failed to check conflicts:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (dialogOpen) {
        checkConflicts();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.hari, formData.jam_mulai, formData.jam_selesai, formData.dosen_id, formData.ruangan]);

  const openCreateDialog = () => {
    setFormData({
      kode_kelas: '',
      mata_kuliah_id: '',
      dosen_id: '',
      hari: '',
      jam_mulai: '08:00',
      jam_selesai: '10:00',
      ruangan: '',
      kuota: 40,
    });
    setEditId(null);
    setConflicts([]);
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setFormData({
      kode_kelas: item.kode_kelas,
      mata_kuliah_id: item.mata_kuliah_id,
      dosen_id: item.dosen_id,
      hari: item.hari,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      ruangan: item.ruangan || '',
      kuota: item.kuota,
    });
    setEditId(item.id);
    setConflicts([]);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.kode_kelas || !formData.mata_kuliah_id || !formData.dosen_id || !formData.hari) {
      toast.error('Lengkapi semua field yang wajib');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        tahun_akademik_id: selectedTA,
      };

      if (editId) {
        await jadwalAPI.update(editId, data);
        toast.success('Jadwal berhasil diupdate');
      } else {
        await jadwalAPI.create(data);
        toast.success('Jadwal berhasil ditambahkan');
      }
      setDialogOpen(false);
      loadJadwal();
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'object' && detail.conflicts) {
        toast.error(detail.message);
        setConflicts(detail.conflicts.map(c => ({ message: c })));
      } else {
        toast.error(detail || 'Gagal menyimpan jadwal');
      }
    } finally {
      setSaving(false);
    }
  };

  // Group jadwal by hari
  const groupedJadwal = HARI_LIST.reduce((acc, hari) => {
    acc[hari] = jadwalList.filter(j => j.hari === hari).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="jadwal-kuliah-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Jadwal Kuliah</h2>
          <p className="text-sm text-slate-500">Kelola jadwal kuliah dengan deteksi konflik</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-[#1e1b4b] hover:bg-[#312e81]" data-testid="add-jadwal-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jadwal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-64">
          <Select value={selectedTA} onValueChange={setSelectedTA}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              {tahunAkademikList.map((ta) => (
                <SelectItem key={ta.id} value={ta.id}>
                  {ta.tahun} - {ta.semester} {ta.is_active && '(Aktif)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={selectedHari} onValueChange={setSelectedHari}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Hari" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Hari</SelectItem>
              {HARI_LIST.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {HARI_LIST.filter(h => !selectedHari || h === selectedHari).map((hari) => (
          <Card key={hari} className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {hari}
                <Badge variant="secondary" className="ml-auto">{groupedJadwal[hari].length} kelas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {groupedJadwal[hari].length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Tidak ada jadwal</p>
              ) : (
                groupedJadwal[hari].map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => openEditDialog(item)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="font-mono text-xs">{item.kode_kelas}</Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.jam_mulai}-{item.jam_selesai}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-slate-800">{item.mata_kuliah_nama}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.dosen_nama}
                      </span>
                      {item.ruangan && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.ruangan}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Conflict Warning */}
            {conflicts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Konflik Jadwal Terdeteksi
                </div>
                <ul className="text-sm text-amber-600 space-y-1">
                  {conflicts.map((c, i) => (
                    <li key={i}>• {c.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kode Kelas *</Label>
                <Input
                  value={formData.kode_kelas}
                  onChange={(e) => setFormData({ ...formData, kode_kelas: e.target.value })}
                  placeholder="Contoh: IF101-A"
                />
              </div>
              <div>
                <Label>Kuota</Label>
                <Input
                  type="number"
                  value={formData.kuota}
                  onChange={(e) => setFormData({ ...formData, kuota: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Mata Kuliah *</Label>
              <Select value={formData.mata_kuliah_id} onValueChange={(v) => setFormData({ ...formData, mata_kuliah_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Mata Kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {mataKuliahList.map((mk) => (
                    <SelectItem key={mk.id} value={mk.id}>
                      {mk.kode} - {mk.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Dosen Pengampu *</Label>
              <Select value={formData.dosen_id} onValueChange={(v) => setFormData({ ...formData, dosen_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Dosen" />
                </SelectTrigger>
                <SelectContent>
                  {dosenList.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Hari *</Label>
                <Select value={formData.hari} onValueChange={(v) => setFormData({ ...formData, hari: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {HARI_LIST.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jam Mulai</Label>
                <Input
                  type="time"
                  value={formData.jam_mulai}
                  onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                />
              </div>
              <div>
                <Label>Jam Selesai</Label>
                <Input
                  type="time"
                  value={formData.jam_selesai}
                  onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Ruangan</Label>
              <Input
                value={formData.ruangan}
                onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })}
                placeholder="Contoh: R.301"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={saving || conflicts.length > 0}
              className="bg-[#1e1b4b] hover:bg-[#312e81]"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? 'Update' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JadwalKuliah;
