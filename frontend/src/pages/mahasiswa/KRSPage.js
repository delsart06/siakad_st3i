import React, { useEffect, useState } from 'react';
import { krsAPI, tahunAkademikAPI } from '../../lib/api';
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
import { 
  Plus, 
  Loader2, 
  ClipboardList, 
  BookOpen, 
  Clock, 
  MapPin, 
  User,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import KRSPdf from '../../components/pdf/KRSPdf';

const KRSPage = () => {
  const [myKRS, setMyKRS] = useState([]);
  const [availableKelas, setAvailableKelas] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [activeTahunAkademik, setActiveTahunAkademik] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [mahasiswa, setMahasiswa] = useState(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load mahasiswa profile
      const profileRes = await krsAPI.getProfile();
      setMahasiswa(profileRes.data);
      
      const taResponse = await tahunAkademikAPI.getAll();
      setTahunAkademikList(taResponse.data);
      
      const activeTA = taResponse.data.find(ta => ta.is_active);
      if (activeTA) {
        setActiveTahunAkademik(activeTA);
        await loadKRS(activeTA.id);
        await loadAvailableKelas(activeTA.id);
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadKRS = async (tahunAkademikId) => {
    try {
      const response = await krsAPI.getMyKRS(tahunAkademikId);
      setMyKRS(response.data);
    } catch (error) {
      console.error('Failed to load KRS:', error);
    }
  };

  const loadAvailableKelas = async (tahunAkademikId) => {
    try {
      const response = await krsAPI.getKelasTersedia(tahunAkademikId);
      setAvailableKelas(response.data);
    } catch (error) {
      console.error('Failed to load available kelas:', error);
    }
  };

  const handleEnroll = async () => {
    if (!selectedKelas) return;
    
    setEnrolling(true);
    try {
      await krsAPI.create(selectedKelas);
      toast.success('Berhasil mendaftar mata kuliah');
      setDialogOpen(false);
      setSelectedKelas(null);
      if (activeTahunAkademik) {
        await loadKRS(activeTahunAkademik.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mendaftar mata kuliah');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDelete = async (krsId) => {
    if (!window.confirm('Batalkan pengajuan KRS ini?')) return;
    
    try {
      await krsAPI.delete(krsId);
      toast.success('KRS berhasil dibatalkan');
      if (activeTahunAkademik) {
        await loadKRS(activeTahunAkademik.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membatalkan KRS');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      diajukan: { class: 'bg-amber-100 text-amber-700', icon: AlertCircle },
      disetujui: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      ditolak: { class: 'bg-rose-100 text-rose-700', icon: XCircle },
    };
    const config = styles[status] || styles.diajukan;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.class} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Calculate total SKS
  const totalSKS = myKRS
    .filter(krs => krs.status !== 'ditolak')
    .reduce((sum, krs) => sum + (krs.sks || 0), 0);

  // Filter out already enrolled classes
  const enrolledKelasIds = myKRS.map(krs => krs.kelas_id);
  const filteredAvailableKelas = availableKelas.filter(
    kelas => !enrolledKelasIds.includes(kelas.id)
  );

  // Handle PDF print
  const handlePrintPDF = async () => {
    if (!activeTahunAkademik || myKRS.length === 0) {
      toast.error('Tidak ada data KRS untuk dicetak');
      return;
    }
    
    setPrinting(true);
    try {
      const blob = await pdf(
        <KRSPdf 
          mahasiswa={mahasiswa}
          tahunAkademik={activeTahunAkademik}
          krsData={myKRS}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KRS_${mahasiswa?.nim || 'unknown'}_${activeTahunAkademik?.tahun?.replace('/', '-') || ''}_${activeTahunAkademik?.semester || ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF berhasil diunduh');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Gagal membuat PDF');
    } finally {
      setPrinting(false);
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
    <div className="space-y-6" data-testid="krs-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Kartu Rencana Studi (KRS)</h2>
          <p className="text-sm text-slate-500">
            {activeTahunAkademik 
              ? `${activeTahunAkademik.tahun} - Semester ${activeTahunAkademik.semester}`
              : 'Tidak ada tahun akademik aktif'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handlePrintPDF}
            variant="outline"
            disabled={!activeTahunAkademik || myKRS.length === 0 || printing}
            data-testid="print-krs-btn"
          >
            {printing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            Cetak PDF
          </Button>
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="bg-[#1e1b4b] hover:bg-[#312e81]"
            disabled={!activeTahunAkademik}
            data-testid="add-krs-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Mata Kuliah
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total SKS Diambil</p>
                <p className="text-2xl font-bold text-slate-800 tabular-nums">{totalSKS}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Disetujui</p>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                  {myKRS.filter(k => k.status === 'disetujui').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Menunggu Persetujuan</p>
                <p className="text-2xl font-bold text-amber-600 tabular-nums">
                  {myKRS.filter(k => k.status === 'diajukan').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KRS Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Mata Kuliah</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead className="text-center">SKS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myKRS.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Belum ada mata kuliah yang diambil</p>
                    <p className="text-sm mt-1">Klik tombol "Tambah Mata Kuliah" untuk memulai</p>
                  </TableCell>
                </TableRow>
              ) : (
                myKRS.map((krs, index) => (
                  <TableRow key={krs.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                    <TableCell>
                      <div className="font-medium text-slate-800">{krs.mata_kuliah_nama || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4" />
                        {krs.dosen_nama || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        {krs.jadwal || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="tabular-nums">{krs.sks} SKS</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(krs.status)}</TableCell>
                    <TableCell className="text-right">
                      {krs.status === 'diajukan' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(krs.id)}
                          className="text-red-500 hover:text-red-700"
                          data-testid={`delete-krs-${krs.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enroll Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Mata Kuliah</DialogTitle>
            <DialogDescription>
              Pilih kelas yang ingin Anda ambil untuk semester ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {filteredAvailableKelas.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Tidak ada kelas yang tersedia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAvailableKelas.map((kelas) => (
                  <div
                    key={kelas.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedKelas === kelas.id
                        ? 'border-[#1e1b4b] bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedKelas(kelas.id)}
                    data-testid={`kelas-option-${kelas.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800">{kelas.mata_kuliah_nama}</h4>
                          <Badge variant="outline" className="text-xs">{kelas.kode_kelas}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {kelas.dosen_nama || '-'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {kelas.jadwal || 'Belum ditentukan'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {kelas.ruangan || 'Belum ditentukan'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Kuota: {kelas.jumlah_peserta}/{kelas.kuota}
                          </div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedKelas === kelas.id ? 'border-[#1e1b4b] bg-[#1e1b4b]' : 'border-slate-300'
                      }`}>
                        {selectedKelas === kelas.id && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={handleEnroll} 
              disabled={!selectedKelas || enrolling}
              className="bg-[#1e1b4b] hover:bg-[#312e81]"
              data-testid="submit-krs"
            >
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Daftar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KRSPage;
