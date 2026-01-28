import React, { useEffect, useState } from 'react';
import { dosenPortalAPI, tahunAkademikAPI, krsAdminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  Loader2, 
  ClipboardList, 
  Check, 
  X, 
  Users,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  XCircle,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

const ValidasiKRSDosenPA = () => {
  const [krsList, setKrsList] = useState([]);
  const [mahasiswaBimbingan, setMahasiswaBimbingan] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTA, setFilterTA] = useState('');
  const [filterStatus, setFilterStatus] = useState('diajukan');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedKRS, setSelectedKRS] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filterTA) {
      loadKRS();
    }
  }, [filterTA, filterStatus]);

  const loadInitialData = async () => {
    try {
      const [taRes, mhsRes] = await Promise.all([
        tahunAkademikAPI.getAll(),
        dosenPortalAPI.getMahasiswaBimbingan(),
      ]);
      
      setTahunAkademikList(taRes.data);
      setMahasiswaBimbingan(mhsRes.data);
      
      const activeTA = taRes.data.find(ta => ta.is_active);
      if (activeTA) {
        setFilterTA(activeTA.id);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKRS = async () => {
    try {
      const response = await dosenPortalAPI.getKRSBimbingan(
        filterTA || null,
        filterStatus === 'all' ? null : filterStatus
      );
      setKrsList(response.data);
    } catch (error) {
      console.error('Failed to load KRS:', error);
    }
  };

  const handleApprove = async (krsId) => {
    setProcessing(true);
    try {
      await krsAdminAPI.approve(krsId);
      toast.success('KRS disetujui');
      loadKRS();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyetujui KRS');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (krs) => {
    setSelectedKRS(krs);
    setCatatan('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedKRS) return;
    
    setProcessing(true);
    try {
      await krsAdminAPI.reject(selectedKRS.id);
      toast.success('KRS ditolak');
      setRejectDialogOpen(false);
      loadKRS();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menolak KRS');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      diajukan: { class: 'bg-amber-100 text-amber-700', icon: AlertCircle, label: 'Menunggu' },
      disetujui: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Disetujui' },
      ditolak: { class: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'Ditolak' },
    };
    const c = config[status] || config.diajukan;
    const Icon = c.icon;
    return (
      <Badge className={`${c.class} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </Badge>
    );
  };

  // Group KRS by mahasiswa
  const groupedByMahasiswa = krsList.reduce((acc, krs) => {
    const key = krs.mahasiswa_id;
    if (!acc[key]) {
      acc[key] = {
        mahasiswa_id: krs.mahasiswa_id,
        mahasiswa_nim: krs.mahasiswa_nim,
        mahasiswa_nama: krs.mahasiswa_nama,
        krs: [],
      };
    }
    acc[key].krs.push(krs);
    return acc;
  }, {});

  const pendingCount = krsList.filter(k => k.status === 'diajukan').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="validasi-krs-dosen-pa-page">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Validasi KRS Mahasiswa Bimbingan</h2>
        <p className="text-sm text-slate-500">Setujui atau tolak pengajuan KRS mahasiswa PA Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Mahasiswa Bimbingan</p>
                <p className="text-2xl font-bold text-slate-800">{mahasiswaBimbingan.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Menunggu Validasi</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total KRS</p>
                <p className="text-2xl font-bold text-slate-800">{krsList.length}</p>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={filterTA} onValueChange={setFilterTA}>
            <SelectTrigger data-testid="filter-ta">
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger data-testid="filter-status">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="diajukan">Menunggu</SelectItem>
              <SelectItem value="disetujui">Disetujui</SelectItem>
              <SelectItem value="ditolak">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KRS List by Mahasiswa */}
      {mahasiswaBimbingan.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center text-slate-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Belum ada mahasiswa bimbingan</p>
            <p className="text-sm mt-1">Anda belum ditugaskan sebagai Dosen PA untuk mahasiswa manapun</p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedByMahasiswa).length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center text-slate-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Belum ada pengajuan KRS</p>
            <p className="text-sm mt-1">Mahasiswa bimbingan Anda belum mengajukan KRS untuk semester ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByMahasiswa).map((group) => (
            <Card key={group.mahasiswa_id} className="shadow-card">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1e1b4b] rounded-full flex items-center justify-center text-white font-medium">
                      {group.mahasiswa_nama?.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{group.mahasiswa_nama}</CardTitle>
                      <p className="text-sm text-slate-500">{group.mahasiswa_nim}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {group.krs.length} Mata Kuliah
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Jadwal</TableHead>
                      <TableHead className="text-center">SKS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.krs.map((krs) => (
                      <TableRow key={krs.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{krs.mata_kuliah_nama}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{krs.jadwal || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{krs.sks} SKS</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(krs.status)}</TableCell>
                        <TableCell className="text-right">
                          {krs.status === 'diajukan' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => handleApprove(krs.id)}
                                disabled={processing}
                                data-testid={`approve-krs-${krs.id}`}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(krs)}
                                disabled={processing}
                                data-testid={`reject-krs-${krs.id}`}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Tolak
                              </Button>
                            </div>
                          )}
                          {krs.status === 'ditolak' && krs.catatan_penolakan && (
                            <span className="text-xs text-rose-600">
                              {krs.catatan_penolakan}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak KRS</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk mata kuliah: {selectedKRS?.mata_kuliah_nama}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Catatan Penolakan (opsional)</Label>
              <Textarea
                placeholder="Contoh: Tidak memenuhi prasyarat, melebihi batas SKS, dll."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                data-testid="input-catatan-penolakan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Batal</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing}
              data-testid="confirm-reject"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tolak KRS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValidasiKRSDosenPA;
