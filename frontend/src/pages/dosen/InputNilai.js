import React, { useEffect, useState } from 'react';
import { dosenAPI, tahunAkademikAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Loader2, BookOpen, Users, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const InputNilai = () => {
  const [kelasList, setKelasList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMhs, setLoadingMhs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedNilai, setEditedNilai] = useState({});

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTA) {
      loadKelas(selectedTA);
    }
  }, [selectedTA]);

  const loadTahunAkademik = async () => {
    try {
      const response = await tahunAkademikAPI.getAll();
      setTahunAkademikList(response.data);
      
      const activeTA = response.data.find(ta => ta.is_active);
      if (activeTA) {
        setSelectedTA(activeTA.id);
      } else if (response.data.length > 0) {
        setSelectedTA(response.data[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat data tahun akademik');
    } finally {
      setLoading(false);
    }
  };

  const loadKelas = async (tahunAkademikId) => {
    setLoading(true);
    try {
      const response = await dosenAPI.getMyKelas(tahunAkademikId);
      setKelasList(response.data);
    } catch (error) {
      console.error('Failed to load kelas:', error);
      setKelasList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMahasiswa = async (kelas) => {
    setSelectedKelas(kelas);
    setLoadingMhs(true);
    try {
      const response = await dosenAPI.getKelasMahasiswa(kelas.id);
      setMahasiswaList(response.data);
      
      // Initialize edited nilai from existing data
      const initialNilai = {};
      response.data.forEach(mhs => {
        initialNilai[mhs.mahasiswa_id] = {
          nilai_tugas: mhs.nilai_tugas || '',
          nilai_uts: mhs.nilai_uts || '',
          nilai_uas: mhs.nilai_uas || '',
        };
      });
      setEditedNilai(initialNilai);
    } catch (error) {
      console.error('Failed to load mahasiswa:', error);
      toast.error('Gagal memuat data mahasiswa');
    } finally {
      setLoadingMhs(false);
    }
  };

  const handleNilaiChange = (mahasiswaId, field, value) => {
    // Validate input (0-100)
    const numValue = parseFloat(value);
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
      return;
    }
    
    setEditedNilai(prev => ({
      ...prev,
      [mahasiswaId]: {
        ...prev[mahasiswaId],
        [field]: value,
      }
    }));
  };

  const saveNilai = async (mahasiswaId) => {
    const nilai = editedNilai[mahasiswaId];
    if (!nilai) return;
    
    setSaving(true);
    try {
      const response = await dosenAPI.inputNilai({
        mahasiswa_id: mahasiswaId,
        kelas_id: selectedKelas.id,
        nilai_tugas: nilai.nilai_tugas ? parseFloat(nilai.nilai_tugas) : null,
        nilai_uts: nilai.nilai_uts ? parseFloat(nilai.nilai_uts) : null,
        nilai_uas: nilai.nilai_uas ? parseFloat(nilai.nilai_uas) : null,
      });
      
      // Update local state with calculated nilai
      setMahasiswaList(prev => prev.map(mhs => {
        if (mhs.mahasiswa_id === mahasiswaId) {
          return {
            ...mhs,
            nilai_tugas: nilai.nilai_tugas ? parseFloat(nilai.nilai_tugas) : null,
            nilai_uts: nilai.nilai_uts ? parseFloat(nilai.nilai_uts) : null,
            nilai_uas: nilai.nilai_uas ? parseFloat(nilai.nilai_uas) : null,
            nilai_akhir: response.data.nilai_akhir,
            nilai_huruf: response.data.nilai_huruf,
          };
        }
        return mhs;
      }));
      
      toast.success(`Nilai ${response.data.nilai_huruf} berhasil disimpan`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  const saveAllNilai = async () => {
    setSaving(true);
    let successCount = 0;
    
    for (const mhs of mahasiswaList) {
      const nilai = editedNilai[mhs.mahasiswa_id];
      if (nilai && (nilai.nilai_tugas || nilai.nilai_uts || nilai.nilai_uas)) {
        try {
          await dosenAPI.inputNilai({
            mahasiswa_id: mhs.mahasiswa_id,
            kelas_id: selectedKelas.id,
            nilai_tugas: nilai.nilai_tugas ? parseFloat(nilai.nilai_tugas) : null,
            nilai_uts: nilai.nilai_uts ? parseFloat(nilai.nilai_uts) : null,
            nilai_uas: nilai.nilai_uas ? parseFloat(nilai.nilai_uas) : null,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to save nilai for ${mhs.nama}:`, error);
        }
      }
    }
    
    setSaving(false);
    if (successCount > 0) {
      toast.success(`${successCount} nilai berhasil disimpan`);
      // Reload mahasiswa list to get updated nilai
      loadMahasiswa(selectedKelas);
    }
  };

  const getNilaiColor = (nilai) => {
    if (!nilai) return 'bg-slate-100 text-slate-600';
    if (nilai.startsWith('A')) return 'bg-emerald-100 text-emerald-700';
    if (nilai.startsWith('B')) return 'bg-blue-100 text-blue-700';
    if (nilai.startsWith('C')) return 'bg-amber-100 text-amber-700';
    if (nilai === 'D') return 'bg-orange-100 text-orange-700';
    return 'bg-rose-100 text-rose-700';
  };

  if (loading && kelasList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  // Show mahasiswa list if kelas is selected
  if (selectedKelas) {
    return (
      <div className="space-y-6" data-testid="input-nilai-detail">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedKelas(null);
                setMahasiswaList([]);
              }}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Input Nilai</h2>
              <p className="text-sm text-slate-500">
                {selectedKelas.mata_kuliah_nama} ({selectedKelas.kode_kelas})
              </p>
            </div>
          </div>
          <Button 
            onClick={saveAllNilai}
            disabled={saving}
            className="bg-[#1e1b4b] hover:bg-[#312e81]"
            data-testid="save-all-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Semua
          </Button>
        </div>

        {/* Mahasiswa Table */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daftar Mahasiswa ({mahasiswaList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingMhs ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-[#1e1b4b]" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">No</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-center w-[100px]">Tugas (30%)</TableHead>
                    <TableHead className="text-center w-[100px]">UTS (30%)</TableHead>
                    <TableHead className="text-center w-[100px]">UAS (40%)</TableHead>
                    <TableHead className="text-center w-[80px]">Nilai Akhir</TableHead>
                    <TableHead className="text-center w-[80px]">Grade</TableHead>
                    <TableHead className="text-center w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mahasiswaList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>Tidak ada mahasiswa terdaftar di kelas ini</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    mahasiswaList.map((mhs, index) => (
                      <TableRow key={mhs.mahasiswa_id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{mhs.nim}</TableCell>
                        <TableCell className="font-medium">{mhs.nama}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0-100"
                            value={editedNilai[mhs.mahasiswa_id]?.nilai_tugas || ''}
                            onChange={(e) => handleNilaiChange(mhs.mahasiswa_id, 'nilai_tugas', e.target.value)}
                            className="w-full text-center"
                            data-testid={`input-tugas-${mhs.mahasiswa_id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0-100"
                            value={editedNilai[mhs.mahasiswa_id]?.nilai_uts || ''}
                            onChange={(e) => handleNilaiChange(mhs.mahasiswa_id, 'nilai_uts', e.target.value)}
                            className="w-full text-center"
                            data-testid={`input-uts-${mhs.mahasiswa_id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0-100"
                            value={editedNilai[mhs.mahasiswa_id]?.nilai_uas || ''}
                            onChange={(e) => handleNilaiChange(mhs.mahasiswa_id, 'nilai_uas', e.target.value)}
                            className="w-full text-center"
                            data-testid={`input-uas-${mhs.mahasiswa_id}`}
                          />
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {mhs.nilai_akhir?.toFixed(1) || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getNilaiColor(mhs.nilai_huruf)}>
                            {mhs.nilai_huruf || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveNilai(mhs.mahasiswa_id)}
                            disabled={saving}
                            className="text-emerald-600 hover:text-emerald-700"
                            data-testid={`save-btn-${mhs.mahasiswa_id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">Keterangan Perhitungan Nilai:</p>
          <p>Nilai Akhir = (Tugas × 30%) + (UTS × 30%) + (UAS × 40%)</p>
          <p className="mt-2">
            <span className="font-medium">Konversi:</span> A (≥85), A- (≥80), B+ (≥75), B (≥70), B- (≥65), C+ (≥60), C (≥55), D (≥50), E (&lt;50)
          </p>
        </div>
      </div>
    );
  }

  // Show kelas list
  return (
    <div className="space-y-6" data-testid="input-nilai-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Input Nilai</h2>
          <p className="text-sm text-slate-500">Pilih kelas untuk input nilai mahasiswa</p>
        </div>
        <div className="w-64">
          <Select value={selectedTA} onValueChange={setSelectedTA}>
            <SelectTrigger data-testid="select-ta-nilai">
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

      {/* Kelas Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-[#1e1b4b]" />
        </div>
      ) : kelasList.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Tidak ada kelas yang diampu pada semester ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kelasList.map((kelas, index) => (
            <Card 
              key={kelas.id} 
              className="shadow-card hover:shadow-lg transition-shadow cursor-pointer animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => loadMahasiswa(kelas)}
              data-testid={`kelas-card-${kelas.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="font-mono">
                    {kelas.kode_kelas}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {kelas.jumlah_peserta || 0} Mahasiswa
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{kelas.mata_kuliah_nama}</h3>
                <div className="space-y-1 text-sm text-slate-500">
                  <p>📅 {kelas.jadwal || 'Jadwal belum ditentukan'}</p>
                  <p>📍 {kelas.ruangan || 'Ruangan belum ditentukan'}</p>
                </div>
                <Button 
                  className="w-full mt-4 bg-[#1e1b4b] hover:bg-[#312e81]"
                  data-testid={`input-nilai-btn-${kelas.id}`}
                >
                  Input Nilai
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InputNilai;
