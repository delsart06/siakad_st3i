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
import { Loader2, Users, Power } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
                    <TableCell className="text-right">
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
    </div>
  );
};

export default UserManagement;
