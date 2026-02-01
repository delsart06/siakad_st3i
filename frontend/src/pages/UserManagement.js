import React, { useEffect, useState } from 'react';
import { usersAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
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
import { Loader2, Users, Power, KeyRound, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
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

  const handleGenerateResetToken = async () => {
    if (!selectedUser) return;
    setGenerating(true);
    try {
      const response = await usersAPI.generateResetToken(selectedUser.id);
      setResetResult(response.data);
      toast.success('Token reset password berhasil dibuat');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal generate token');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Link berhasil disalin');
    setTimeout(() => setCopied(false), 2000);
  };

  const getFullResetUrl = () => {
    if (!resetResult) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/reset-password?token=${resetResult.reset_token}`;
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-violet-100 text-violet-700',
      dosen: 'bg-blue-100 text-blue-700',
      mahasiswa: 'bg-emerald-100 text-emerald-700',
    };
    return <Badge className={styles[role] || 'bg-slate-100'}>{role}</Badge>;
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
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Manajemen User</h2>
        <p className="text-sm text-slate-500">Kelola akun pengguna sistem</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada data user</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 30}ms` }}>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell className="text-slate-600">{item.email}</TableCell>
                    <TableCell>{getRoleBadge(item.role)}</TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openResetDialog(item)}
                        className="text-blue-500 hover:text-blue-700"
                        data-testid={`reset-password-${item.id}`}
                      >
                        <KeyRound className="w-4 h-4 mr-1" />
                        Reset Password
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(item)}
                        className={item.is_active ? 'text-red-500 hover:text-red-700' : 'text-emerald-500 hover:text-emerald-700'}
                        data-testid={`toggle-user-${item.id}`}
                      >
                        <Power className="w-4 h-4 mr-1" />
                        {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Reset Password User
            </DialogTitle>
            <DialogDescription>
              Generate link reset password untuk user ini
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
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

              {/* Generate Button or Result */}
              {!resetResult ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600 mb-4">
                    Klik tombol di bawah untuk generate link reset password.
                    Link akan berlaku selama 24 jam.
                  </p>
                  <Button 
                    onClick={handleGenerateResetToken}
                    disabled={generating}
                    data-testid="btn-generate-token"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Generate Link Reset
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Link Reset Berhasil Dibuat!</span>
                    </div>
                    <p className="text-sm text-green-600">
                      Berlaku hingga: {resetResult.expires_in}
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-500">Link Reset Password:</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={getFullResetUrl()} 
                        readOnly 
                        className="text-xs"
                        data-testid="reset-link-input"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(getFullResetUrl())}
                        data-testid="btn-copy-link"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="text-center">
                    <a 
                      href={getFullResetUrl()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Buka Link <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    Bagikan link ini kepada user untuk mereset password mereka.
                    Jangan bagikan link ini kepada orang lain.
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
