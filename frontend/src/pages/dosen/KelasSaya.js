import React, { useEffect, useState } from 'react';
import { dosenAPI, tahunAkademikAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
import { Loader2, BookOpen, Users, Clock, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const KelasSaya = () => {
  const [kelasList, setKelasList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [loading, setLoading] = useState(true);

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

  const selectedTAData = tahunAkademikList.find(ta => ta.id === selectedTA);

  if (loading && kelasList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="kelas-saya-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Kelas Saya</h2>
          <p className="text-sm text-slate-500">Daftar kelas yang Anda ampu</p>
        </div>
        <div className="w-64">
          <Select value={selectedTA} onValueChange={setSelectedTA}>
            <SelectTrigger data-testid="select-ta-kelas">
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

      {/* Info Banner */}
      {selectedTAData && (
        <div className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">
                {selectedTAData.tahun} - Semester {selectedTAData.semester}
              </h3>
              <p className="text-indigo-200 text-sm">
                Total {kelasList.length} kelas yang diampu
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Kelas</p>
                <p className="text-2xl font-bold text-slate-800">{kelasList.length}</p>
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
                <p className="text-sm text-slate-500">Total Mahasiswa</p>
                <p className="text-2xl font-bold text-slate-800">
                  {kelasList.reduce((sum, k) => sum + (k.jumlah_peserta || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total SKS</p>
                <p className="text-2xl font-bold text-slate-800">
                  {kelasList.reduce((sum, k) => {
                    const sks = (k.sks_teori || 0) + (k.sks_praktik || 0);
                    return sum + sks;
                  }, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kelas List */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Kelas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-[#1e1b4b]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Ruangan</TableHead>
                  <TableHead className="text-center">Peserta</TableHead>
                  <TableHead className="text-center">Kuota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kelasList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>Tidak ada kelas yang diampu</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  kelasList.map((kelas, index) => (
                    <TableRow key={kelas.id} className="animate-fadeIn" style={{ animationDelay: `${index * 30}ms` }}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {kelas.kode_kelas}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">{kelas.mata_kuliah_nama}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          {kelas.jadwal || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          {kelas.ruangan || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {kelas.jumlah_peserta || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-slate-600">{kelas.kuota || 40}</span>
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
};

export default KelasSaya;
