import React, { useEffect, useState, useRef } from 'react';
import { krsAPI } from '../../lib/api';
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
import { Loader2, FileText, Printer, Download, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const TranskripPage = () => {
  const [transkripData, setTranskripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    loadTranskrip();
  }, []);

  const loadTranskrip = async () => {
    try {
      const response = await krsAPI.getTranskrip();
      setTranskripData(response.data);
    } catch (error) {
      toast.error('Gagal memuat transkrip');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transkrip Nilai - ${transkripData?.mahasiswa?.nama}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            padding: 40px;
            color: #1e293b;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px double #1e1b4b;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 24px;
            color: #1e1b4b;
            margin-bottom: 5px;
          }
          
          .header p {
            font-size: 14px;
            color: #64748b;
          }
          
          .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          
          .student-info .row {
            display: flex;
            font-size: 14px;
          }
          
          .student-info .label {
            width: 120px;
            color: #64748b;
          }
          
          .student-info .value {
            font-weight: 500;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          th, td {
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            text-align: left;
            font-size: 13px;
          }
          
          th {
            background: #1e1b4b;
            color: white;
            font-weight: 600;
          }
          
          tr:nth-child(even) {
            background: #f8fafc;
          }
          
          .text-center {
            text-align: center;
          }
          
          .summary {
            display: flex;
            justify-content: flex-end;
            gap: 40px;
            padding: 20px;
            background: #1e1b4b;
            color: white;
            border-radius: 8px;
          }
          
          .summary-item {
            text-align: center;
          }
          
          .summary-item .label {
            font-size: 12px;
            opacity: 0.8;
          }
          
          .summary-item .value {
            font-size: 24px;
            font-weight: 700;
          }
          
          .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature {
            text-align: center;
            width: 200px;
          }
          
          .signature-line {
            margin-top: 80px;
            border-top: 1px solid #1e293b;
            padding-top: 5px;
          }
          
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getNilaiColor = (nilai) => {
    if (!nilai || nilai === '-') return 'bg-slate-100 text-slate-600';
    if (nilai.startsWith('A')) return 'bg-emerald-100 text-emerald-700';
    if (nilai.startsWith('B')) return 'bg-blue-100 text-blue-700';
    if (nilai.startsWith('C')) return 'bg-amber-100 text-amber-700';
    if (nilai === 'D') return 'bg-orange-100 text-orange-700';
    return 'bg-rose-100 text-rose-700';
  };

  const getPredikat = (ipk) => {
    if (ipk >= 3.51) return 'Dengan Pujian (Cum Laude)';
    if (ipk >= 2.76) return 'Sangat Memuaskan';
    if (ipk >= 2.00) return 'Memuaskan';
    return 'Cukup';
  };

  // Group by semester
  const groupedBySemester = transkripData?.nilai?.reduce((acc, item) => {
    const sem = item.semester || 0;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(item);
    return acc;
  }, {}) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="transkrip-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Transkrip Nilai</h2>
          <p className="text-sm text-slate-500">Rekap nilai seluruh mata kuliah</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            data-testid="print-transkrip"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
          <Button 
            onClick={handlePrint}
            className="bg-[#1e1b4b] hover:bg-[#312e81]"
            data-testid="download-transkrip"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      {transkripData && (
        <div className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{transkripData.mahasiswa?.nama}</h3>
                <p className="text-indigo-200">{transkripData.mahasiswa?.nim}</p>
                <p className="text-sm text-indigo-300">
                  {transkripData.mahasiswa?.prodi} • Angkatan {transkripData.mahasiswa?.tahun_masuk}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-indigo-200 text-sm">Total SKS</p>
                <p className="text-3xl font-bold tabular-nums">{transkripData.total_sks}</p>
              </div>
              <div className="text-center">
                <p className="text-indigo-200 text-sm">IPK</p>
                <p className="text-3xl font-bold tabular-nums">{transkripData.ipk?.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-indigo-200 text-sm">Predikat</p>
                <p className="text-sm font-semibold">{getPredikat(transkripData.ipk)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transkrip Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {!transkripData?.nilai || transkripData.nilai.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada data transkrip</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead className="w-24">Kode MK</TableHead>
                  <TableHead>Nama Mata Kuliah</TableHead>
                  <TableHead className="text-center w-16">SKS</TableHead>
                  <TableHead className="text-center w-20">Nilai</TableHead>
                  <TableHead className="text-center w-20">Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transkripData.nilai.map((item, index) => (
                  <TableRow key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 20}ms` }}>
                    <TableCell className="text-slate-500">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{item.kode_mk}</TableCell>
                    <TableCell className="font-medium">{item.nama_mk}</TableCell>
                    <TableCell className="text-center tabular-nums">{item.sks}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${getNilaiColor(item.nilai_huruf)} tabular-nums`}>
                        {item.nilai_huruf || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">Sem {item.semester}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Print Content (Hidden) */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="header">
            <h1>TRANSKRIP AKADEMIK</h1>
            <p>Sistem Informasi Akademik (SIAKAD)</p>
          </div>
          
          <div className="student-info">
            <div className="row">
              <span className="label">Nama</span>
              <span className="value">: {transkripData?.mahasiswa?.nama}</span>
            </div>
            <div className="row">
              <span className="label">NIM</span>
              <span className="value">: {transkripData?.mahasiswa?.nim}</span>
            </div>
            <div className="row">
              <span className="label">Program Studi</span>
              <span className="value">: {transkripData?.mahasiswa?.prodi}</span>
            </div>
            <div className="row">
              <span className="label">Tahun Masuk</span>
              <span className="value">: {transkripData?.mahasiswa?.tahun_masuk}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style={{width: '40px'}}>No</th>
                <th style={{width: '80px'}}>Kode</th>
                <th>Nama Mata Kuliah</th>
                <th className="text-center" style={{width: '50px'}}>SKS</th>
                <th className="text-center" style={{width: '60px'}}>Nilai</th>
                <th className="text-center" style={{width: '70px'}}>Semester</th>
              </tr>
            </thead>
            <tbody>
              {transkripData?.nilai?.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td>{item.kode_mk}</td>
                  <td>{item.nama_mk}</td>
                  <td className="text-center">{item.sks}</td>
                  <td className="text-center">{item.nilai_huruf || '-'}</td>
                  <td className="text-center">{item.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="summary">
            <div className="summary-item">
              <div className="label">Total SKS</div>
              <div className="value">{transkripData?.total_sks}</div>
            </div>
            <div className="summary-item">
              <div className="label">IPK</div>
              <div className="value">{transkripData?.ipk?.toFixed(2)}</div>
            </div>
            <div className="summary-item">
              <div className="label">Predikat</div>
              <div className="value" style={{fontSize: '14px'}}>{getPredikat(transkripData?.ipk)}</div>
            </div>
          </div>
          
          <div className="footer">
            <div></div>
            <div className="signature">
              <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div className="signature-line">
                <p>Kepala BAAK</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranskripPage;
