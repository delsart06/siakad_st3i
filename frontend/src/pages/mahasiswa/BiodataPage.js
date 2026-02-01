import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';
import { biodataAPI } from '../../lib/api';
import { 
  User, 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  Edit,
  Save,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Users
} from 'lucide-react';

const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const JENIS_KELAMIN_OPTIONS = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' }
];

const BiodataPage = () => {
  const [biodata, setBiodata] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [changeHistory, setChangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    nik: '',
    no_kk: '',
    jenis_kelamin: '',
    agama: '',
    kewarganegaraan: 'Indonesia',
    alamat_jalan: '',
    alamat_rt: '',
    alamat_rw: '',
    alamat_kelurahan: '',
    alamat_kecamatan: '',
    alamat_kota: '',
    alamat_provinsi: '',
    alamat_kode_pos: '',
    nama_ayah: '',
    nama_ibu: '',
    no_hp: '',
    email: ''
  });

  // File refs
  const ktpRef = useRef(null);
  const kkRef = useRef(null);
  const akteRef = useRef(null);
  const [files, setFiles] = useState({ ktp: null, kk: null, akte: null });

  useEffect(() => {
    loadBiodata();
    loadChangeHistory();
  }, []);

  const loadBiodata = async () => {
    setLoading(true);
    try {
      const res = await biodataAPI.getMyBiodata();
      setBiodata(res.data.biodata);
      setPendingRequest(res.data.pending_request);
      
      if (res.data.biodata) {
        setFormData(res.data.biodata);
        setIsCreateMode(false);
      } else {
        setIsCreateMode(true);
      }
    } catch (error) {
      toast.error('Gagal memuat data biodata');
    } finally {
      setLoading(false);
    }
  };

  const loadChangeHistory = async () => {
    try {
      const res = await biodataAPI.getMyChangeRequests();
      setChangeHistory(res.data);
    } catch (error) {
      console.error('Failed to load change history');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleCreateBiodata = async () => {
    setSubmitting(true);
    try {
      await biodataAPI.createBiodata(formData);
      toast.success('Biodata berhasil disimpan');
      loadBiodata();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan biodata');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitChangeRequest = async () => {
    // Validate files
    if (!files.ktp || !files.kk || !files.akte) {
      toast.error('Semua dokumen pendukung (KTP, KK, Akte) wajib diupload');
      return;
    }

    // Find changed fields
    const changedData = {};
    Object.keys(formData).forEach(key => {
      if (biodata && formData[key] !== biodata[key]) {
        changedData[key] = formData[key];
      }
    });

    if (Object.keys(changedData).length === 0) {
      toast.error('Tidak ada perubahan data');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('data_baru', JSON.stringify(changedData));
      submitData.append('dokumen_ktp', files.ktp);
      submitData.append('dokumen_kk', files.kk);
      submitData.append('dokumen_akte', files.akte);

      await biodataAPI.createChangeRequest(submitData);
      toast.success('Pengajuan perubahan biodata berhasil dikirim');
      loadBiodata();
      loadChangeHistory();
      setIsEditDialogOpen(false);
      setFiles({ ktp: null, kk: null, akte: null });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengirim pengajuan');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = () => {
    if (biodata) {
      setFormData({ ...biodata });
    }
    setFiles({ ktp: null, kk: null, akte: null });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="biodata-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biodata Mahasiswa</h1>
          <p className="text-gray-500 mt-1">Data pribadi untuk keperluan ijazah dan dokumen resmi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsHistoryDialogOpen(true)} data-testid="btn-history">
            <FileText className="w-4 h-4 mr-2" />
            Riwayat Perubahan
          </Button>
          {!pendingRequest && (
            <Button onClick={openEditDialog} data-testid="btn-edit">
              <Edit className="w-4 h-4 mr-2" />
              {isCreateMode ? 'Isi Biodata' : 'Ubah Data'}
            </Button>
          )}
        </div>
      </div>

      {/* Pending Request Alert */}
      {pendingRequest && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Pengajuan perubahan sedang diproses.</strong> Anda tidak dapat mengajukan perubahan baru sampai pengajuan sebelumnya selesai direview oleh admin.
          </AlertDescription>
        </Alert>
      )}

      {/* No Biodata Alert */}
      {!biodata && !isCreateMode && (
        <Alert className="border-blue-200 bg-blue-50">
          <User className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Anda belum mengisi biodata. Silakan klik tombol &quot;Isi Biodata&quot; untuk melengkapi data pribadi Anda.
          </AlertDescription>
        </Alert>
      )}

      {/* Biodata Display */}
      {biodata && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Pribadi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Data Pribadi
              </CardTitle>
              {biodata.is_verified ? (
                <Badge className="bg-green-100 text-green-800 w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Terverifikasi</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 w-fit"><Clock className="w-3 h-3 mr-1" /> Belum Verifikasi</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-sm">Nama Lengkap</Label>
                  <p className="font-medium">{biodata.nama_lengkap}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Jenis Kelamin</Label>
                  <p className="font-medium">{biodata.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Tempat Lahir</Label>
                  <p className="font-medium">{biodata.tempat_lahir}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Tanggal Lahir</Label>
                  <p className="font-medium">{formatDate(biodata.tanggal_lahir)}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">NIK</Label>
                  <p className="font-medium">{biodata.nik}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">No. KK</Label>
                  <p className="font-medium">{biodata.no_kk}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Agama</Label>
                  <p className="font-medium">{biodata.agama}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Kewarganegaraan</Label>
                  <p className="font-medium">{biodata.kewarganegaraan}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Orang Tua */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Data Orang Tua
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-500 text-sm">Nama Ayah</Label>
                <p className="font-medium">{biodata.nama_ayah}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Nama Ibu</Label>
                <p className="font-medium">{biodata.nama_ibu}</p>
              </div>
            </CardContent>
          </Card>

          {/* Alamat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Alamat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {biodata.alamat_jalan}, RT {biodata.alamat_rt}/RW {biodata.alamat_rw}
              </p>
              <p className="text-gray-600">
                Kel. {biodata.alamat_kelurahan}, Kec. {biodata.alamat_kecamatan}
              </p>
              <p className="text-gray-600">
                {biodata.alamat_kota}, {biodata.alamat_provinsi} {biodata.alamat_kode_pos}
              </p>
            </CardContent>
          </Card>

          {/* Kontak */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{biodata.no_hp}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{biodata.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreateMode ? 'Isi Biodata' : 'Ubah Biodata'}</DialogTitle>
            <DialogDescription>
              {isCreateMode 
                ? 'Lengkapi data pribadi Anda untuk keperluan ijazah'
                : 'Perubahan data memerlukan upload dokumen pendukung dan persetujuan admin'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Data Pribadi */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Data Pribadi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Lengkap *</Label>
                  <Input
                    value={formData.nama_lengkap}
                    onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
                    placeholder="Nama sesuai KTP"
                    data-testid="input-nama-lengkap"
                  />
                </div>
                <div>
                  <Label>Jenis Kelamin *</Label>
                  <Select value={formData.jenis_kelamin} onValueChange={(v) => handleInputChange('jenis_kelamin', v)}>
                    <SelectTrigger data-testid="select-jenis-kelamin">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_KELAMIN_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tempat Lahir *</Label>
                  <Input
                    value={formData.tempat_lahir}
                    onChange={(e) => handleInputChange('tempat_lahir', e.target.value)}
                    placeholder="Kota kelahiran"
                    data-testid="input-tempat-lahir"
                  />
                </div>
                <div>
                  <Label>Tanggal Lahir *</Label>
                  <Input
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
                    data-testid="input-tanggal-lahir"
                  />
                </div>
                <div>
                  <Label>NIK *</Label>
                  <Input
                    value={formData.nik}
                    onChange={(e) => handleInputChange('nik', e.target.value)}
                    placeholder="16 digit NIK"
                    maxLength={16}
                    data-testid="input-nik"
                  />
                </div>
                <div>
                  <Label>No. Kartu Keluarga *</Label>
                  <Input
                    value={formData.no_kk}
                    onChange={(e) => handleInputChange('no_kk', e.target.value)}
                    placeholder="16 digit No. KK"
                    maxLength={16}
                    data-testid="input-no-kk"
                  />
                </div>
                <div>
                  <Label>Agama *</Label>
                  <Select value={formData.agama} onValueChange={(v) => handleInputChange('agama', v)}>
                    <SelectTrigger data-testid="select-agama">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGAMA_OPTIONS.map(agama => (
                        <SelectItem key={agama} value={agama}>{agama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kewarganegaraan *</Label>
                  <Input
                    value={formData.kewarganegaraan}
                    onChange={(e) => handleInputChange('kewarganegaraan', e.target.value)}
                    data-testid="input-kewarganegaraan"
                  />
                </div>
              </div>
            </div>

            {/* Data Orang Tua */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Data Orang Tua
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Ayah *</Label>
                  <Input
                    value={formData.nama_ayah}
                    onChange={(e) => handleInputChange('nama_ayah', e.target.value)}
                    placeholder="Nama ayah kandung"
                    data-testid="input-nama-ayah"
                  />
                </div>
                <div>
                  <Label>Nama Ibu *</Label>
                  <Input
                    value={formData.nama_ibu}
                    onChange={(e) => handleInputChange('nama_ibu', e.target.value)}
                    placeholder="Nama ibu kandung"
                    data-testid="input-nama-ibu"
                  />
                </div>
              </div>
            </div>

            {/* Alamat */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Alamat
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Alamat Jalan *</Label>
                  <Input
                    value={formData.alamat_jalan}
                    onChange={(e) => handleInputChange('alamat_jalan', e.target.value)}
                    placeholder="Nama jalan, nomor rumah"
                    data-testid="input-alamat-jalan"
                  />
                </div>
                <div>
                  <Label>RT *</Label>
                  <Input
                    value={formData.alamat_rt}
                    onChange={(e) => handleInputChange('alamat_rt', e.target.value)}
                    placeholder="001"
                    maxLength={3}
                    data-testid="input-alamat-rt"
                  />
                </div>
                <div>
                  <Label>RW *</Label>
                  <Input
                    value={formData.alamat_rw}
                    onChange={(e) => handleInputChange('alamat_rw', e.target.value)}
                    placeholder="001"
                    maxLength={3}
                    data-testid="input-alamat-rw"
                  />
                </div>
                <div>
                  <Label>Kelurahan/Desa *</Label>
                  <Input
                    value={formData.alamat_kelurahan}
                    onChange={(e) => handleInputChange('alamat_kelurahan', e.target.value)}
                    data-testid="input-alamat-kelurahan"
                  />
                </div>
                <div>
                  <Label>Kecamatan *</Label>
                  <Input
                    value={formData.alamat_kecamatan}
                    onChange={(e) => handleInputChange('alamat_kecamatan', e.target.value)}
                    data-testid="input-alamat-kecamatan"
                  />
                </div>
                <div>
                  <Label>Kota/Kabupaten *</Label>
                  <Input
                    value={formData.alamat_kota}
                    onChange={(e) => handleInputChange('alamat_kota', e.target.value)}
                    data-testid="input-alamat-kota"
                  />
                </div>
                <div>
                  <Label>Provinsi *</Label>
                  <Input
                    value={formData.alamat_provinsi}
                    onChange={(e) => handleInputChange('alamat_provinsi', e.target.value)}
                    data-testid="input-alamat-provinsi"
                  />
                </div>
                <div>
                  <Label>Kode Pos *</Label>
                  <Input
                    value={formData.alamat_kode_pos}
                    onChange={(e) => handleInputChange('alamat_kode_pos', e.target.value)}
                    placeholder="12345"
                    maxLength={5}
                    data-testid="input-alamat-kode-pos"
                  />
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Kontak
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>No. HP *</Label>
                  <Input
                    value={formData.no_hp}
                    onChange={(e) => handleInputChange('no_hp', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    data-testid="input-no-hp"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    data-testid="input-email"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload (only for change request) */}
            {!isCreateMode && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Dokumen Pendukung
                </h3>
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Upload dokumen pendukung wajib untuk setiap perubahan data. Format: JPG, PNG, PDF (max 5MB)
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Foto KTP *</Label>
                    <div className="mt-1">
                      <input
                        ref={ktpRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('ktp', e.target.files[0])}
                        className="hidden"
                        data-testid="input-file-ktp"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => ktpRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {files.ktp ? files.ktp.name : 'Pilih File'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Foto Kartu Keluarga *</Label>
                    <div className="mt-1">
                      <input
                        ref={kkRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('kk', e.target.files[0])}
                        className="hidden"
                        data-testid="input-file-kk"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => kkRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {files.kk ? files.kk.name : 'Pilih File'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Foto Akte Kelahiran *</Label>
                    <div className="mt-1">
                      <input
                        ref={akteRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('akte', e.target.files[0])}
                        className="hidden"
                        data-testid="input-file-akte"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => akteRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {files.akte ? files.akte.name : 'Pilih File'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={isCreateMode ? handleCreateBiodata : handleSubmitChangeRequest}
              disabled={submitting}
              data-testid="btn-submit"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Menyimpan...' : (isCreateMode ? 'Simpan Biodata' : 'Ajukan Perubahan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Riwayat Perubahan Biodata</DialogTitle>
          </DialogHeader>
          {changeHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada riwayat perubahan</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {changeHistory.map((req) => (
                <Card key={req.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">{formatDate(req.created_at)}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Perubahan:</p>
                      <div className="text-sm bg-gray-50 p-3 rounded-lg">
                        {Object.entries(req.data_baru).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-1 border-b last:border-b-0">
                            <span className="text-gray-500">{key.replace(/_/g, ' ')}</span>
                            <span>
                              <span className="line-through text-red-500 mr-2">{req.data_lama[key]}</span>
                              <span className="text-green-600">{value}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {req.catatan_admin && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                        <strong>Catatan Admin:</strong> {req.catatan_admin}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsHistoryDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BiodataPage;
