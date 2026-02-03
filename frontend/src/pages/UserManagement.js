import React, { useEffect, useState } from 'react';
import { usersAPI, fakultasAPI, prodiAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Loader2, Users, Power, KeyRound, Copy, CheckCircle, AlertTriangle, 
  Plus, Edit, Settings2, Building2, School 
} from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    role: '',
    user_id_number: '',
    password: '',
    prodi_id: '',
    fakultas_id: '',
  });
  
  // Reference data
  const [fakultasList, setFakultasList] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [defaultModulesByRole, setDefaultModulesByRole] = useState({});
  const [selectedModules, setSelectedModules] = useState([]);

  useEffect(() => {
    loadData();
    loadReferenceData();
  }, []);

  const loadData = async () => {
    try {
      const response = await usersAPI.getAll();
      setData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [fakultasRes, prodiRes, modulesRes] = await Promise.all([
        fakultasAPI.getAll(),
        prodiAPI.getAll(),
        usersAPI.getAvailableModules()
      ]);
      setFakultasList(fakultasRes.data);
      setProdiList(prodiRes.data);
      setAvailableModules(modulesRes.data.modules);
      setDefaultModulesByRole(modulesRes.data.default_by_role);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await usersAPI.toggleActive(user.id);
      toast.success(`User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      loadData();
    } catch (error) {
      toast.error('Gagal mengubah status user');
    }
  };

  const openResetDialog = (user) => {
    setSelectedUser(user);
    setResetResult(null);
    setCopied(false);
    setIsResetDialogOpen(true);
  };

  const openAddDialog = () => {
    setFormData({
      nama: '',
      email: '',
      role: '',
      user_id_number: '',
      password: '',
      prodi_id: '',
      fakultas_id: '',
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      nama: user.nama,
      email: user.email,
      role: user.role,
      user_id_number: user.user_id_number || '',
      password: '',
      prodi_id: user.prodi_id || '',
      fakultas_id: user.fakultas_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const openModulesDialog = (user) => {
    setSelectedUser(user);
    setSelectedModules(user.modules_access || defaultModulesByRole[user.role] || []);
    setIsModulesDialogOpen(true);
  };

  const handleGenerateNewPassword = async () => {
    if (!selectedUser) return;
    setGenerating(true);
    try {
      const response = await usersAPI.generateNewPassword(selectedUser.id);
      setResetResult(response.data);
      toast.success('Password baru berhasil dibuat');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal generate password');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.nama || !formData.email || !formData.role || !formData.user_id_number || !formData.password) {
      toast.error('Harap isi semua field yang wajib');
      return;
    }

    if (formData.role === 'kaprodi' && !formData.prodi_id) {
      toast.error('Prodi harus dipilih untuk role Kaprodi');
      return;
    }

    if (formData.role === 'dekan' && !formData.fakultas_id) {
      toast.error('Fakultas harus dipilih untuk role Dekan');
      return;
    }

    setSaving(true);
    try {
      await usersAPI.createUser({
        nama: formData.nama,
        email: formData.email,
        role: formData.role,
        user_id_number: formData.user_id_number,
        password: formData.password,
        prodi_id: formData.prodi_id || null,
        fakultas_id: formData.fakultas_id || null,
      });
      toast.success('User berhasil ditambahkan');
      setIsAddDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan user');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      await usersAPI.updateUser(selectedUser.id, {
        nama: formData.nama,
        email: formData.email,
        role: formData.role,
        prodi_id: formData.prodi_id || null,
        fakultas_id: formData.fakultas_id || null,
      });
      toast.success('User berhasil diperbarui');
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal memperbarui user');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModules = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      await usersAPI.updateModulesAccess(selectedUser.id, selectedModules);
      toast.success('Akses modul berhasil diperbarui');
      setIsModulesDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal memperbarui akses modul');
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (moduleId) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Password berhasil disalin');
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-violet-100 text-violet-700',
      rektor: 'bg-amber-100 text-amber-700',
      dekan: 'bg-orange-100 text-orange-700',
      kaprodi: 'bg-cyan-100 text-cyan-700',
      dosen: 'bg-blue-100 text-blue-700',
      mahasiswa: 'bg-emerald-100 text-emerald-700',
    };
    const labels = {
      admin: 'Admin',
      rektor: 'Rektor',
      dekan: 'Dekan',
      kaprodi: 'Kaprodi',
      dosen: 'Dosen',
      mahasiswa: 'Mahasiswa',
    };
    return <Badge className={styles[role] || 'bg-slate-100'}>{labels[role] || role}</Badge>;
  };

  const getFilteredProdi = () => {
    if (formData.fakultas_id) {
      return prodiList.filter(p => p.fakultas_id === formData.fakultas_id);
    }
    return prodiList;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e1b4b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Manajemen User</h2>
          <p className="text-sm text-slate-500">Kelola akun pengguna sistem</p>
        </div>
        <Button onClick={openAddDialog} data-testid="btn-add-user">
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>NIP/NIM/NIDN</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Fakultas/Prodi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data user</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 30}ms` }}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.nama}</p>
                        <p className="text-xs text-slate-500">{item.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-mono text-sm">
                      {item.user_id_number || '-'}
                    </TableCell>
                    <TableCell>{getRoleBadge(item.role)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.fakultas_nama && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Building2 className="w-3 h-3" />
                            <span>{item.fakultas_nama}</span>
                          </div>
                        )}
                        {item.prodi_nama && (
                          <div className="flex items-center gap-1 text-cyan-600">
                            <School className="w-3 h-3" />
                            <span>{item.prodi_nama}</span>
                          </div>
                        )}
                        {!item.fakultas_nama && !item.prodi_nama && (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          className="text-slate-500 hover:text-slate-700"
                          data-testid={`edit-user-${item.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModulesDialog(item)}
                          className="text-purple-500 hover:text-purple-700"
                          data-testid={`modules-user-${item.id}`}
                        >
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openResetDialog(item)}
                          className="text-blue-500 hover:text-blue-700"
                          data-testid={`reset-password-${item.id}`}
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item)}
                          className={item.is_active ? 'text-red-500 hover:text-red-700' : 'text-emerald-500 hover:text-emerald-700'}
                          data-testid={`toggle-user-${item.id}`}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Tambah User Baru
            </DialogTitle>
            <DialogDescription>
              Buat akun pengguna baru dengan role dan akses yang sesuai
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  placeholder="Masukkan nama"
                  data-testid="input-nama"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@domain.com"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIP/NIM/NIDN *</Label>
                <Input
                  value={formData.user_id_number}
                  onChange={(e) => setFormData({...formData, user_id_number: e.target.value})}
                  placeholder="Nomor identitas"
                  data-testid="input-user-id"
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Password"
                  data-testid="input-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value, prodi_id: '', fakultas_id: ''})}
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="rektor">Rektor</SelectItem>
                  <SelectItem value="dekan">Dekan</SelectItem>
                  <SelectItem value="kaprodi">Kaprodi</SelectItem>
                  <SelectItem value="dosen">Dosen</SelectItem>
                  <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'dekan' && (
              <div className="space-y-2">
                <Label>Fakultas *</Label>
                <Select 
                  value={formData.fakultas_id} 
                  onValueChange={(value) => setFormData({...formData, fakultas_id: value})}
                >
                  <SelectTrigger data-testid="select-fakultas">
                    <SelectValue placeholder="Pilih fakultas" />
                  </SelectTrigger>
                  <SelectContent>
                    {fakultasList.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.role === 'kaprodi' || formData.role === 'mahasiswa') && (
              <div className="space-y-2">
                <Label>Program Studi *</Label>
                <Select 
                  value={formData.prodi_id} 
                  onValueChange={(value) => setFormData({...formData, prodi_id: value})}
                >
                  <SelectTrigger data-testid="select-prodi">
                    <SelectValue placeholder="Pilih prodi" />
                  </SelectTrigger>
                  <SelectContent>
                    {prodiList.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddUser} disabled={saving} data-testid="btn-save-user">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Tambah User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi dan role pengguna
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  data-testid="edit-input-nama"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  data-testid="edit-input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectTrigger data-testid="edit-select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="rektor">Rektor</SelectItem>
                  <SelectItem value="dekan">Dekan</SelectItem>
                  <SelectItem value="kaprodi">Kaprodi</SelectItem>
                  <SelectItem value="dosen">Dosen</SelectItem>
                  <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'dekan' && (
              <div className="space-y-2">
                <Label>Fakultas</Label>
                <Select 
                  value={formData.fakultas_id} 
                  onValueChange={(value) => setFormData({...formData, fakultas_id: value})}
                >
                  <SelectTrigger data-testid="edit-select-fakultas">
                    <SelectValue placeholder="Pilih fakultas" />
                  </SelectTrigger>
                  <SelectContent>
                    {fakultasList.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.role === 'kaprodi' || formData.role === 'mahasiswa') && (
              <div className="space-y-2">
                <Label>Program Studi</Label>
                <Select 
                  value={formData.prodi_id} 
                  onValueChange={(value) => setFormData({...formData, prodi_id: value})}
                >
                  <SelectTrigger data-testid="edit-select-prodi">
                    <SelectValue placeholder="Pilih prodi" />
                  </SelectTrigger>
                  <SelectContent>
                    {prodiList.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditUser} disabled={saving} data-testid="btn-update-user">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modules Access Dialog */}
      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Atur Akses Modul
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>Atur modul yang dapat diakses oleh <strong>{selectedUser.nama}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {availableModules.map(module => (
              <div
                key={module.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedModules.includes(module.id)
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => toggleModule(module.id)}
              >
                <Checkbox
                  checked={selectedModules.includes(module.id)}
                  onCheckedChange={() => toggleModule(module.id)}
                  data-testid={`module-${module.id}`}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{module.name}</p>
                  <p className="text-xs text-slate-500">{module.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-slate-500">
              {selectedModules.length} modul dipilih
            </p>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setSelectedModules(defaultModulesByRole[selectedUser?.role] || [])}
            >
              Reset ke Default
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModulesDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveModules} disabled={saving} data-testid="btn-save-modules">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Simpan Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Reset Password User
            </DialogTitle>
            <DialogDescription>
              Generate password baru untuk user ini
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Nama:</span>
                    <p className="font-medium">{selectedUser.nama}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Role:</span>
                    <p>{getRoleBadge(selectedUser.role)}</p>
                  </div>
                </div>
              </div>

              {!resetResult ? (
                <div className="text-center py-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Password lama akan diganti dengan password baru</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerateNewPassword}
                    disabled={generating}
                    data-testid="btn-generate-password"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Generate Password Baru
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Password Berhasil Direset!</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-500">Password Baru:</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={resetResult.new_password} 
                        readOnly 
                        className="text-center text-2xl font-mono tracking-widest"
                        data-testid="new-password-input"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(resetResult.new_password)}
                        data-testid="btn-copy-password"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    Catat password ini dan berikan kepada user. Password tidak akan ditampilkan lagi setelah dialog ditutup.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
