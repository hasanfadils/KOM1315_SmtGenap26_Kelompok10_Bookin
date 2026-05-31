import React, { useState, useEffect } from 'react';
import { User, Facility } from '../types';
import { AuthService } from '../services/authService';
import { FacilityService } from '../services/facilityService';
import { api } from '../services/api';
import { Search, Plus, Trash2, Edit2, Shield, GraduationCap, Briefcase, Loader2, X, CheckSquare } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'staff' | 'admin',
    nim: '',
    managed_ruangan_ids: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    const res = await FacilityService.getAllFacilities();
    if (res.success && res.data) {
      setFacilities(res.data);
    }
  };

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

  const openAddModal = () => {
    setModalMode('add');
    setSelectedUser(null);
    setFormData({
      name: '', email: '', password: '', role: 'student', nim: '', managed_ruangan_ids: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      nim: user.nim || '',
      managed_ruangan_ids: user.managed_ruangan_ids || []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        const payload = { ...formData, nim: formData.nim || undefined };
        // Exclude managed_ruangan_ids if not staff/admin
        if (formData.role === 'student') payload.managed_ruangan_ids = [];
        await api.post('/auth/register', payload);
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          nim: formData.nim || undefined,
          managed_ruangan_ids: formData.role !== 'student' ? formData.managed_ruangan_ids : undefined
        };
        await AuthService.updateProfile(selectedUser!.id, payload);
      }
      closeModal();
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data pengguna');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckboxChange = (facilityId: string) => {
    const strId = String(facilityId);
    setFormData(prev => {
      const currentIds = prev.managed_ruangan_ids || [];
      const isChecked = currentIds.includes(strId);
      if (isChecked) {
        return { ...prev, managed_ruangan_ids: currentIds.filter(id => id !== strId) };
      } else {
        return { ...prev, managed_ruangan_ids: [...currentIds, strId] };
      }
    });
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
        <button 
            onClick={openAddModal}
            className="bg-ipb-blue hover:bg-ipb-dark text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition-all"
        >
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
                                    <button 
                                        onClick={() => openEditModal(user)}
                                        className="p-1.5 text-slate-400 hover:text-ipb-blue hover:bg-blue-50 rounded-md transition-colors"
                                    >
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

      {/* MODAL TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-ipb-blue outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-ipb-blue outline-none" />
                </div>

                {modalMode === 'add' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                    <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-ipb-blue outline-none" minLength={6} />
                  </div>
                )}

                {modalMode === 'add' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role Pengguna</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any, managed_ruangan_ids: []})} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-ipb-blue outline-none bg-white">
                      <option value="student">Mahasiswa</option>
                      <option value="staff">Tendik / Staf</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}

                {/* NIM (Opsional tapi relevan untuk Mahasiswa) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">NIM / NIP (Opsional)</label>
                  <input type="text" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-ipb-blue outline-none" />
                </div>

                {/* Ruangan yang Dikelola (Hanya untuk Staf/Admin) */}
                {(formData.role === 'staff' || formData.role === 'admin') && (
                  <div className="pt-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 border-t pt-4">Penugasan Ruangan (Opsional)</label>
                    <p className="text-xs text-slate-500 mb-3">Pilih ruangan mana saja yang pengajuannya akan dikelola oleh pengguna ini.</p>
                    <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                      {facilities.map(facility => {
                        const isSelected = (formData.managed_ruangan_ids || []).includes(String(facility.id));
                        return (
                          <label 
                            key={facility.id} 
                            className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-ipb-blue text-ipb-blue shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                          >
                            <input 
                              type="checkbox"
                              value={facility.id}
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(String(facility.id))}
                              className="hidden" // Hide native checkbox which might be reset by Tailwind
                            />
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-ipb-blue flex-shrink-0" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-slate-300 rounded flex-shrink-0 transition-colors group-hover:border-ipb-blue"></div>
                            )}
                            <span className="text-sm font-semibold">{facility.name}</span>
                          </label>
                        );
                      })}
                      {facilities.length === 0 && <span className="text-xs text-slate-400">Belum ada ruangan.</span>}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button onClick={closeModal} disabled={isSaving} className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                Batal
              </button>
              <button type="submit" form="user-form" disabled={isSaving} className="bg-ipb-blue hover:bg-ipb-dark text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
