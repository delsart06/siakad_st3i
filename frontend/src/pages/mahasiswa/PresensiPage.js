import React, { useEffect, useState } from 'react';
import { mahasiswaJadwalAPI, tahunAkademikAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
import { Loader2, ClipboardCheck, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PresensiMahasiswa = () => {
  const [rekapData, setRekapData] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTA) {
      loadRekap();
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

  const loadRekap = async () => {
    setLoading(true);
    try {
      const response = await mahasiswaJadwalAPI.getMyPresensiRekap(selectedTA);
      setRekapData(response.data);
    } catch (error) {
      console.error('Failed to load rekap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPersentaseColor = (persen) => {
    if (persen >= 80) return 'bg-emerald-100 text-emerald-700';
    if (persen >= 75) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  const selectedTAData = tahunAkademikList.find(ta => ta.id === selectedTA);

  // Calculate totals
  const totals = rekapData.reduce((acc, item) => ({
    hadir: acc.hadir + item.hadir,
    izin: acc.izin + item.izin,
    sakit: acc.sakit + item.sakit,
    alpha: acc.alpha + item.alpha,
    total: acc.total + item.total_pertemuan,
  }), { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0 });

  const totalPersentase = totals.total > 0 ? (totals.hadir / totals.total * 100).toFixed(1) : 0;

  if (loading && rekapData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="presensi-mahasiswa-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Rekap Presensi</h2>
          <p className="text-sm text-slate-500">Rekap kehadiran per mata kuliah</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{totals.hadir}</div>
            <p className="text-xs text-slate-500">Hadir</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totals.izin}</div>
            <p className="text-xs text-slate-500">Izin</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{totals.sakit}</div>
            <p className="text-xs text-slate-500">Sakit</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-rose-600">{totals.alpha}</div>
            <p className="text-xs text-slate-500">Alpha</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${parseFloat(totalPersentase) >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalPersentase}%
            </div>
            <p className="text-xs text-slate-500">Kehadiran</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning if below 75% */}
      {parseFloat(totalPersentase) < 75 && parseFloat(totalPersentase) > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <div>
            <p className="font-medium text-rose-700">Perhatian: Kehadiran di bawah 75%</p>
            <p className="text-sm text-rose-600">Tingkatkan kehadiran untuk memenuhi syarat ujian</p>
          </div>
        </div>
      )}

      {/* Detail Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Detail Kehadiran per Mata Kuliah
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-[#1e1b4b]" />
            </div>
          ) : rekapData.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada data presensi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead className="text-center">Pertemuan</TableHead>
                  <TableHead className="text-center">Hadir</TableHead>
                  <TableHead className="text-center">Izin</TableHead>
                  <TableHead className="text-center">Sakit</TableHead>
                  <TableHead className="text-center">Alpha</TableHead>
                  <TableHead className="text-center">Kehadiran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rekapData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.mata_kuliah_nama}</TableCell>
                    <TableCell className="text-center">{item.total_pertemuan}</TableCell>
                    <TableCell className="text-center text-emerald-600 font-semibold">{item.hadir}</TableCell>
                    <TableCell className="text-center text-blue-600">{item.izin}</TableCell>
                    <TableCell className="text-center text-amber-600">{item.sakit}</TableCell>
                    <TableCell className="text-center text-rose-600">{item.alpha}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getPersentaseColor(item.persentase_kehadiran)}>
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

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">Informasi</span>
        </div>
        <p>Kehadiran minimal 75% diperlukan untuk mengikuti Ujian Akhir Semester (UAS)</p>
      </div>
    </div>
  );
};

export default PresensiMahasiswa;
