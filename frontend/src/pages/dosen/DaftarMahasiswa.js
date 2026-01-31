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
import { Loader2, BookOpen, Users, ArrowLeft, Search, FileDown, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const DaftarMahasiswa = () => {
  const [kelasList, setKelasList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMhs, setLoadingMhs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    } catch (error) {
      console.error('Failed to load mahasiswa:', error);
      toast.error('Gagal memuat data mahasiswa');
    } finally {
      setLoadingMhs(false);
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

  // Filter mahasiswa by search term
  const filteredMahasiswa = mahasiswaList.filter(mhs => 
    mhs.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mhs.nim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export to CSV
  const exportToCSV = () => {
    if (mahasiswaList.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['No', 'NIM', 'Nama', 'Nilai Tugas', 'Nilai UTS', 'Nilai UAS', 'Nilai Akhir', 'Grade'];
    const rows = mahasiswaList.map((mhs, index) => [
      index + 1,
      mhs.nim,
      mhs.nama,
      mhs.nilai_tugas || '-',
      mhs.nilai_uts || '-',
      mhs.nilai_uas || '-',
      mhs.nilai_akhir?.toFixed(1) || '-',
      mhs.nilai_huruf || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daftar_Mahasiswa_${selectedKelas?.kode_kelas || 'kelas'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Data berhasil diekspor');
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
      <div className="space-y-6" data-testid="daftar-mahasiswa-detail">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedKelas(null);
                setMahasiswaList([]);
                setSearchTerm('');
              }}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Daftar Mahasiswa</h2>
              <p className="text-sm text-slate-500">
                {selectedKelas.mata_kuliah_nama} ({selectedKelas.kode_kelas})
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari NIM atau Nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="search-mahasiswa"
              />
            </div>
            <Button 
              variant="outline"
              onClick={exportToCSV}
              data-testid="export-csv-btn"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Mahasiswa</p>
              <p className="text-2xl font-bold text-slate-800">{mahasiswaList.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Sudah Dinilai</p>
              <p className="text-2xl font-bold text-emerald-600">
                {mahasiswaList.filter(m => m.nilai_huruf).length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Belum Dinilai</p>
              <p className="text-2xl font-bold text-amber-600">
                {mahasiswaList.filter(m => !m.nilai_huruf).length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-slate-800">
                {mahasiswaList.filter(m => m.nilai_akhir).length > 0
                  ? (mahasiswaList.reduce((sum, m) => sum + (m.nilai_akhir || 0), 0) / 
                     mahasiswaList.filter(m => m.nilai_akhir).length).toFixed(1)
                  : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mahasiswa Table */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daftar Mahasiswa
              {searchTerm && (
                <Badge variant="secondary" className="ml-2">
                  {filteredMahasiswa.length} hasil
                </Badge>
              )}
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
                    <TableHead className="w-[60px]">No</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-center">Tugas</TableHead>
                    <TableHead className="text-center">UTS</TableHead>
                    <TableHead className="text-center">UAS</TableHead>
                    <TableHead className="text-center">Nilai Akhir</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMahasiswa.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>{searchTerm ? 'Tidak ada hasil pencarian' : 'Tidak ada mahasiswa terdaftar'}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMahasiswa.map((mhs, index) => (
                      <TableRow key={mhs.mahasiswa_id} className="animate-fadeIn" style={{ animationDelay: `${index * 20}ms` }}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{mhs.nim}</TableCell>
                        <TableCell className="font-medium">{mhs.nama}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {mhs.nilai_tugas?.toFixed(1) || '-'}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {mhs.nilai_uts?.toFixed(1) || '-'}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {mhs.nilai_uas?.toFixed(1) || '-'}
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-semibold">
                          {mhs.nilai_akhir?.toFixed(1) || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getNilaiColor(mhs.nilai_huruf)}>
                            {mhs.nilai_huruf || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show kelas list
  return (
    <div className="space-y-6" data-testid="daftar-mahasiswa-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Daftar Mahasiswa per Kelas</h2>
          <p className="text-sm text-slate-500">Pilih kelas untuk melihat daftar mahasiswa</p>
        </div>
        <div className="w-64">
          <Select value={selectedTA} onValueChange={setSelectedTA}>
            <SelectTrigger data-testid="select-ta-mahasiswa">
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
                  <Badge className="bg-blue-100 text-blue-700">
                    {kelas.jumlah_peserta || 0} Mahasiswa
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{kelas.mata_kuliah_nama}</h3>
                <div className="space-y-1 text-sm text-slate-500">
                  <p>📅 {kelas.jadwal || 'Jadwal belum ditentukan'}</p>
                  <p>📍 {kelas.ruangan || 'Ruangan belum ditentukan'}</p>
                </div>
                <Button 
                  variant="outline"
                  className="w-full mt-4"
                  data-testid={`view-mahasiswa-btn-${kelas.id}`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Lihat Mahasiswa
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DaftarMahasiswa;
