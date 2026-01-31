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
import { Loader2, Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const HARI_ORDER = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7 };
const HARI_COLORS = {
  Senin: 'bg-blue-500',
  Selasa: 'bg-emerald-500',
  Rabu: 'bg-amber-500',
  Kamis: 'bg-purple-500',
  Jumat: 'bg-rose-500',
  Sabtu: 'bg-cyan-500',
};

const JadwalMahasiswa = () => {
  const [jadwalList, setJadwalList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTA) {
      loadJadwal();
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

  const loadJadwal = async () => {
    setLoading(true);
    try {
      const response = await mahasiswaJadwalAPI.getMyJadwal(selectedTA);
      setJadwalList(response.data);
    } catch (error) {
      console.error('Failed to load jadwal:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group by hari
  const groupedJadwal = jadwalList.reduce((acc, item) => {
    const hari = item.hari || 'Tidak Ditentukan';
    if (!acc[hari]) acc[hari] = [];
    acc[hari].push(item);
    return acc;
  }, {});

  // Sort each group by time
  Object.keys(groupedJadwal).forEach(hari => {
    groupedJadwal[hari].sort((a, b) => (a.jam_mulai || '').localeCompare(b.jam_mulai || ''));
  });

  // Get sorted hari list
  const sortedHari = Object.keys(groupedJadwal).sort((a, b) => 
    (HARI_ORDER[a] || 99) - (HARI_ORDER[b] || 99)
  );

  const selectedTAData = tahunAkademikList.find(ta => ta.id === selectedTA);

  if (loading && jadwalList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="jadwal-mahasiswa-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Jadwal Kuliah Saya</h2>
          <p className="text-sm text-slate-500">Jadwal mata kuliah yang diambil semester ini</p>
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
                {jadwalList.length} mata kuliah terjadwal
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule */}
      {jadwalList.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Belum ada jadwal kuliah. Pastikan KRS sudah disetujui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedHari.map((hari) => (
            <Card key={hari} className="shadow-card overflow-hidden">
              <div className={`h-1 ${HARI_COLORS[hari] || 'bg-slate-500'}`} />
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {hari}
                  <Badge variant="secondary" className="ml-auto">
                    {groupedJadwal[hari].length} kelas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedJadwal[hari].map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-semibold text-[#1e1b4b]">
                        {item.jam_mulai || '--:--'}
                      </div>
                      <div className="text-xs text-slate-400">s/d</div>
                      <div className="text-sm font-semibold text-[#1e1b4b]">
                        {item.jam_selesai || '--:--'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="font-mono text-xs mb-1">
                        {item.kode_kelas}
                      </Badge>
                      <h4 className="font-medium text-slate-800">{item.mata_kuliah_nama}</h4>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.dosen_nama || '-'}
                        </span>
                        {item.ruangan && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.ruangan}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JadwalMahasiswa;
