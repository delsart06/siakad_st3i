import React, { useEffect, useState } from 'react';
import { krsAPI, tahunAkademikAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
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
import { Loader2, FileText, TrendingUp, BookOpen, Award, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import KHSPdf from '../../components/pdf/KHSPdf';

const KHSPage = () => {
  const [khsData, setKhsData] = useState(null);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTA) {
      loadKHS(selectedTA);
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

  const loadKHS = async (tahunAkademikId) => {
    setLoading(true);
    try {
      const response = await krsAPI.getKHS(tahunAkademikId);
      setKhsData(response.data);
    } catch (error) {
      console.error('Failed to load KHS:', error);
      setKhsData(null);
    } finally {
      setLoading(false);
    }
  };

  const getNilaiColor = (nilai) => {
    if (!nilai || nilai === '-') return 'bg-slate-100 text-slate-600';
    if (nilai.startsWith('A')) return 'bg-emerald-100 text-emerald-700';
    if (nilai.startsWith('B')) return 'bg-blue-100 text-blue-700';
    if (nilai.startsWith('C')) return 'bg-amber-100 text-amber-700';
    if (nilai === 'D') return 'bg-orange-100 text-orange-700';
    return 'bg-rose-100 text-rose-700';
  };

  const getIPSLabel = (ips) => {
    if (ips >= 3.5) return { label: 'Sangat Baik', color: 'text-emerald-600' };
    if (ips >= 3.0) return { label: 'Baik', color: 'text-blue-600' };
    if (ips >= 2.5) return { label: 'Cukup', color: 'text-amber-600' };
    if (ips >= 2.0) return { label: 'Kurang', color: 'text-orange-600' };
    return { label: 'Perlu Perhatian', color: 'text-rose-600' };
  };

  const selectedTAData = tahunAkademikList.find(ta => ta.id === selectedTA);

  // Handle PDF print
  const handlePrintPDF = async () => {
    if (!selectedTAData || !khsData) {
      toast.error('Tidak ada data KHS untuk dicetak');
      return;
    }
    
    setPrinting(true);
    try {
      const blob = await pdf(
        <KHSPdf 
          mahasiswa={khsData?.mahasiswa}
          tahunAkademik={selectedTAData}
          khsData={khsData}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KHS_${khsData?.mahasiswa?.nim || 'unknown'}_${selectedTAData?.tahun?.replace('/', '-') || ''}_${selectedTAData?.semester || ''}.pdf`;
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

  if (loading && !khsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="khs-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Kartu Hasil Studi (KHS)</h2>
          <p className="text-sm text-slate-500">Lihat hasil studi per semester</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-64">
            <Select value={selectedTA} onValueChange={setSelectedTA}>
              <SelectTrigger data-testid="select-ta-khs">
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
          <Button 
            onClick={handlePrintPDF}
            variant="outline"
            disabled={!selectedTAData || !khsData || printing}
            data-testid="print-khs-btn"
          >
            {printing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            Cetak PDF
          </Button>
        </div>
      </div>

      {/* Student Info & Summary */}
      {khsData && (
        <>
          <div className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{khsData.mahasiswa?.nama}</h3>
                <p className="text-indigo-200">{khsData.mahasiswa?.nim}</p>
                {selectedTAData && (
                  <p className="text-sm text-indigo-300 mt-1">
                    {selectedTAData.tahun} - Semester {selectedTAData.semester}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-indigo-200 text-sm">Total SKS</p>
                  <p className="text-3xl font-bold tabular-nums">{khsData.total_sks}</p>
                </div>
                <div className="text-center">
                  <p className="text-indigo-200 text-sm">IPS</p>
                  <p className="text-3xl font-bold tabular-nums">{khsData.ips?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Mata Kuliah</p>
                    <p className="text-2xl font-bold text-slate-800">{khsData.nilai?.length || 0}</p>
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
                    <p className="text-sm text-slate-500">Total SKS</p>
                    <p className="text-2xl font-bold text-slate-800 tabular-nums">{khsData.total_sks}</p>
                  </div>
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">IPS</p>
                    <p className="text-2xl font-bold text-slate-800 tabular-nums">{khsData.ips?.toFixed(2)}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Predikat</p>
                    <p className={`text-lg font-bold ${getIPSLabel(khsData.ips).color}`}>
                      {getIPSLabel(khsData.ips).label}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Grades Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Nilai</CardTitle>
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
                  <TableHead>Kode MK</TableHead>
                  <TableHead>Nama Mata Kuliah</TableHead>
                  <TableHead className="text-center">SKS</TableHead>
                  <TableHead className="text-center">Nilai</TableHead>
                  <TableHead className="text-center">Bobot</TableHead>
                  <TableHead className="text-center">Mutu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!khsData?.nilai || khsData.nilai.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>Belum ada data nilai untuk semester ini</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {khsData.nilai.map((item, index) => (
                      <TableRow key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 30}ms` }}>
                        <TableCell className="font-mono text-sm">{item.kode_mk}</TableCell>
                        <TableCell className="font-medium">{item.nama_mk}</TableCell>
                        <TableCell className="text-center tabular-nums">{item.sks}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${getNilaiColor(item.nilai_huruf)} tabular-nums`}>
                            {item.nilai_huruf || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{item.bobot?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center tabular-nums font-medium">{item.mutu?.toFixed(2) || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="bg-slate-50 font-semibold">
                      <TableCell colSpan={2} className="text-right">Total</TableCell>
                      <TableCell className="text-center tabular-nums">{khsData.total_sks}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-center tabular-nums">
                        {khsData.nilai.reduce((sum, item) => sum + (item.mutu || 0), 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KHSPage;
