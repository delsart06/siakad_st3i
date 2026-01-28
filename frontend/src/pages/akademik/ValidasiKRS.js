import React, { useEffect, useState } from 'react';
import { krsAdminAPI, tahunAkademikAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
import { Loader2, ClipboardList, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const ValidasiKRS = () => {
  const [data, setData] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTA, setFilterTA] = useState('');
  const [filterStatus, setFilterStatus] = useState('diajukan');

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (filterTA) loadData();
  }, [filterTA, filterStatus]);

  const loadTahunAkademik = async () => {
    try {
      const response = await tahunAkademikAPI.getAll();
      setTahunAkademikList(response.data);
      const activeTA = response.data.find(ta => ta.is_active);
      if (activeTA) setFilterTA(activeTA.id);
    } catch (error) {
      toast.error('Gagal memuat data tahun akademik');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await krsAdminAPI.getAll(filterTA || null, filterStatus || null);
      setData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await krsAdminAPI.approve(id);
      toast.success('KRS disetujui');
      loadData();
    } catch (error) {
      toast.error('Gagal menyetujui KRS');
    }
  };

  const handleReject = async (id) => {
    try {
      await krsAdminAPI.reject(id);
      toast.success('KRS ditolak');
      loadData();
    } catch (error) {
      toast.error('Gagal menolak KRS');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      diajukan: 'bg-amber-100 text-amber-700',
      disetujui: 'bg-emerald-100 text-emerald-700',
      ditolak: 'bg-rose-100 text-rose-700',
    };
    return <Badge className={styles[status] || 'bg-slate-100'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="validasi-krs-page">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Validasi KRS</h2>
        <p className="text-sm text-slate-500">Setujui atau tolak pengajuan KRS mahasiswa</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={filterTA} onValueChange={setFilterTA}>
            <SelectTrigger data-testid="filter-ta-krs">
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
          <Select value={filterStatus || undefined} onValueChange={(val) => setFilterStatus(val === 'all' ? '' : val)}>
            <SelectTrigger data-testid="filter-status-krs">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="diajukan">Diajukan</SelectItem>
              <SelectItem value="disetujui">Disetujui</SelectItem>
              <SelectItem value="ditolak">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
            </div>
          ) : (
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
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>Tidak ada pengajuan KRS</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => (
                    <TableRow key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 30}ms` }}>
                      <TableCell className="font-medium">{item.mata_kuliah_nama || '-'}</TableCell>
                      <TableCell className="text-slate-600">{item.dosen_nama || '-'}</TableCell>
                      <TableCell className="text-slate-600">{item.jadwal || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{item.sks} SKS</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        {item.status === 'diajukan' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handleApprove(item.id)}
                              data-testid={`approve-krs-${item.id}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(item.id)}
                              data-testid={`reject-krs-${item.id}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Tolak
                            </Button>
                          </div>
                        )}
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

export default ValidasiKRS;
