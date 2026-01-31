import React, { useEffect, useState } from 'react';
import { dosenAPI, tahunAkademikAPI } from '../../lib/api';
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
import { Loader2, Users, Calendar, ClipboardCheck, ArrowLeft, Plus, Check, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'izin', label: 'Izin', color: 'bg-blue-100 text-blue-700' },
  { value: 'sakit', label: 'Sakit', color: 'bg-amber-100 text-amber-700' },
  { value: 'alpha', label: 'Alpha', color: 'bg-rose-100 text-rose-700' },
];

const Presensi = () => {
  const [kelasList, setKelasList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [presensiList, setPresensiList] = useState([]);
  const [selectedPresensi, setSelectedPresensi] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [rekapData, setRekapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRekap, setShowRekap] = useState(false);
  const [newPresensi, setNewPresensi] = useState({ pertemuan_ke: 1, tanggal: '' });

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTA) {
      loadKelas();
    }
  }, [selectedTA]);

  const loadTahunAkademik = async () => {
    try {
      const response = await tahunAkademikAPI.getAll();
      setTahunAkademikList(response.data);
      const activeTA = response.data.find(ta => ta.is_active);
      if (activeTA) setSelectedTA(activeTA.id);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadKelas = async () => {
    try {
      const response = await dosenAPI.getMyKelas(selectedTA);
      setKelasList(response.data);
    } catch (error) {
      console.error('Failed to load kelas:', error);
    }
  };

  const selectKelas = async (kelas) => {
    setSelectedKelas(kelas);
    setShowRekap(false);
    setLoadingDetail(true);
    try {
      const response = await dosenAPI.getPresensiList(kelas.id);
      setPresensiList(response.data);
      
      // Set default pertemuan_ke
      const nextPertemuan = response.data.length > 0 
        ? Math.max(...response.data.map(p => p.pertemuan_ke)) + 1 
        : 1;
      setNewPresensi({ pertemuan_ke: nextPertemuan, tanggal: new Date().toISOString().split('T')[0] });
    } catch (error) {
      toast.error('Gagal memuat data presensi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const openPresensiDetail = async (presensi) => {
    setSelectedPresensi(presensi);
    setLoadingDetail(true);
    try {
      const response = await dosenAPI.getPresensiDetail(presensi.id);
      setMahasiswaList(response.data);
    } catch (error) {
      toast.error('Gagal memuat detail presensi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const createNewPresensi = async () => {
    if (!newPresensi.tanggal) {
      toast.error('Pilih tanggal pertemuan');
      return;
    }
    
    setSaving(true);
    try {
      const response = await dosenAPI.createPresensi({
        kelas_id: selectedKelas.id,
        pertemuan_ke: newPresensi.pertemuan_ke,
        tanggal: newPresensi.tanggal,
      });
      toast.success('Pertemuan baru berhasil dibuat');
      setDialogOpen(false);
      
      // Reload and open the new presensi
      const listResponse = await dosenAPI.getPresensiList(selectedKelas.id);
      setPresensiList(listResponse.data);
      openPresensiDetail(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat pertemuan');
    } finally {
      setSaving(false);
    }
  };

  const updateMahasiswaStatus = (mahasiswaId, status) => {
    setMahasiswaList(prev => prev.map(m => 
      m.mahasiswa_id === mahasiswaId ? { ...m, status } : m
    ));
  };

  const savePresensi = async () => {
    setSaving(true);
    try {
      const details = mahasiswaList.map(m => ({
        mahasiswa_id: m.mahasiswa_id,
        status: m.status,
        keterangan: m.keterangan || null,
      }));
      
      await dosenAPI.savePresensiDetail(selectedPresensi.id, details);
      toast.success('Presensi berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan presensi');
    } finally {
      setSaving(false);
    }
  };

  const loadRekap = async () => {
    setShowRekap(true);
    setSelectedPresensi(null);
    setLoadingDetail(true);
    try {
      const response = await dosenAPI.getRekapPresensi(selectedKelas.id);
      setRekapData(response.data);
    } catch (error) {
      toast.error('Gagal memuat rekap presensi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  // Show presensi detail (input mode)
  if (selectedPresensi) {
    return (
      <div className="space-y-6" data-testid="presensi-detail">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedPresensi(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Pertemuan {selectedPresensi.pertemuan_ke}
              </h2>
              <p className="text-sm text-slate-500">
                {selectedKelas?.mata_kuliah_nama} • {selectedPresensi.tanggal}
              </p>
            </div>
          </div>
          <Button onClick={savePresensi} disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Simpan Presensi
          </Button>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-[#1e1b4b]" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mahasiswaList.map((mhs, index) => (
                    <TableRow key={mhs.mahasiswa_id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{mhs.mahasiswa_nim}</TableCell>
                      <TableCell className="font-medium">{mhs.mahasiswa_nama}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          {STATUS_OPTIONS.map((opt) => (
                            <Button
                              key={opt.value}
                              size="sm"
                              variant={mhs.status === opt.value ? 'default' : 'outline'}
                              className={mhs.status === opt.value ? opt.color : ''}
                              onClick={() => updateMahasiswaStatus(mhs.mahasiswa_id, opt.value)}
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show rekap
  if (showRekap && selectedKelas) {
    return (
      <div className="space-y-6" data-testid="presensi-rekap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowRekap(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Rekap Presensi</h2>
            <p className="text-sm text-slate-500">{selectedKelas.mata_kuliah_nama}</p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-[#1e1b4b]" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-center">Hadir</TableHead>
                    <TableHead className="text-center">Izin</TableHead>
                    <TableHead className="text-center">Sakit</TableHead>
                    <TableHead className="text-center">Alpha</TableHead>
                    <TableHead className="text-center">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rekapData.map((item, index) => (
                    <TableRow key={item.mahasiswa_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.mahasiswa_nim}</TableCell>
                      <TableCell className="font-medium">{item.mahasiswa_nama}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-semibold">{item.hadir}</TableCell>
                      <TableCell className="text-center text-blue-600">{item.izin}</TableCell>
                      <TableCell className="text-center text-amber-600">{item.sakit}</TableCell>
                      <TableCell className="text-center text-rose-600">{item.alpha}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={item.persentase_kehadiran >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                          {item.persentase_kehadiran}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show presensi list for selected kelas
  if (selectedKelas) {
    return (
      <div className="space-y-6" data-testid="presensi-list">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedKelas(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Presensi Kelas</h2>
              <p className="text-sm text-slate-500">{selectedKelas.mata_kuliah_nama} ({selectedKelas.kode_kelas})</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadRekap}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Rekap
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-[#1e1b4b] hover:bg-[#312e81]">
              <Plus className="w-4 h-4 mr-2" />
              Pertemuan Baru
            </Button>
          </div>
        </div>

        {loadingDetail ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-[#1e1b4b]" />
          </div>
        ) : presensiList.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada pertemuan. Buat pertemuan baru untuk mulai input presensi.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {presensiList.map((p) => (
              <Card 
                key={p.id} 
                className="shadow-card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openPresensiDetail(p)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-[#1e1b4b] mb-1">{p.pertemuan_ke}</div>
                  <p className="text-sm text-slate-500">Pertemuan</p>
                  <p className="text-xs text-slate-400 mt-2">{p.tanggal}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* New Pertemuan Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Pertemuan Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Pertemuan Ke</Label>
                <Input
                  type="number"
                  value={newPresensi.pertemuan_ke}
                  onChange={(e) => setNewPresensi({ ...newPresensi, pertemuan_ke: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={newPresensi.tanggal}
                  onChange={(e) => setNewPresensi({ ...newPresensi, tanggal: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button onClick={createNewPresensi} disabled={saving} className="bg-[#1e1b4b] hover:bg-[#312e81]">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Buat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show kelas list
  return (
    <div className="space-y-6" data-testid="presensi-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Presensi Mahasiswa</h2>
          <p className="text-sm text-slate-500">Kelola presensi mahasiswa per kelas</p>
        </div>
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
      </div>

      {kelasList.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center text-slate-500">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Tidak ada kelas yang diampu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kelasList.map((kelas) => (
            <Card 
              key={kelas.id} 
              className="shadow-card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => selectKelas(kelas)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="font-mono">{kelas.kode_kelas}</Badge>
                  <Badge className="bg-blue-100 text-blue-700">{kelas.jumlah_peserta || 0} Mhs</Badge>
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{kelas.mata_kuliah_nama}</h3>
                <p className="text-sm text-slate-500">{kelas.jadwal || '-'}</p>
                <Button variant="outline" className="w-full mt-4">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Kelola Presensi
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Presensi;
