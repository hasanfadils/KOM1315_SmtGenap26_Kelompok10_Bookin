import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { Search, Plus, Trash2, Edit2, Shield, GraduationCap, Briefcase, Loader2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const result = await AuthService.getAllUsers();
    if (result.success && result.data) {
      setUsers(result.data);
    }
    setIsLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      const result = await AuthService.deleteUser(id);
      if (result.success) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert(result.error);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
        case 'admin': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Shield className="w-3 h-3"/> Admin</span>;
        case 'staff': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Briefcase className="w-3 h-3"/> Tendik</span>;
        default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><GraduationCap className="w-3 h-3"/> Mahasiswa</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-ipb-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
            <p className="text-slate-500">Kelola akun mahasiswa, tendik, dan admin</p>
        </div>
        <button className="bg-ipb-blue hover:bg-ipb-dark text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition-all">
            <Plus className="h-4 w-4" /> Tambah Pengguna
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Cari nama atau email..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-ipb-blue focus:border-transparent outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Nama Lengkap</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">NIM / NIP</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                            <td className="px-6 py-4 text-slate-600">{user.email}</td>
                            <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{user.nim || '-'}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button className="p-1.5 text-slate-400 hover:text-ipb-blue hover:bg-blue-50 rounded-md transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(user.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
                Tidak ada pengguna yang ditemukan.
            </div>
        )}
      </div>
    </div>
  );
};
