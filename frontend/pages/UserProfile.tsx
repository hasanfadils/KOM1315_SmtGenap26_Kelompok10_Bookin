import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { User, UserCircle, Mail, Briefcase, GraduationCap, Edit2, Save, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      nim: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
        navigate('/login');
        return;
    }
    setFormData({
        name: user.name,
        email: user.email,
        nim: user.nim || ''
    });
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      setIsLoading(true);
      setMessage(null);

      const result = await AuthService.updateProfile(user.id, {
          name: formData.name,
          email: formData.email,
          nim: formData.nim || undefined // undefined so it doesn't send empty string if not applicable
      });

      setIsLoading(false);

      if (result.success && result.data) {
          updateUser(result.data); // Update global context
          setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
          setIsEditing(false);
      } else {
          setMessage({ type: 'error', text: result.error || 'Gagal memperbarui profil.' });
      }
  };

  const handleCancel = () => {
      if (user) {
        setFormData({
            name: user.name,
            email: user.email,
            nim: user.nim || ''
        });
      }
      setIsEditing(false);
      setMessage(null);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
        
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-ipb-blue to-ipb-dark relative">
             <div className="absolute inset-0 bg-white/5 opacity-30 pattern-dots"></div>
        </div>

        {/* Profile Content */}
        <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="flex items-end">
                    <div className="bg-white p-1.5 rounded-full shadow-lg">
                        <div className="h-24 w-24 rounded-full bg-slate-200 border-4 border-white flex items-center justify-center text-slate-400 overflow-hidden">
                             {/* Placeholder Avatar based on Initials */}
                             <span className="text-3xl font-bold text-slate-500">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="ml-4 mb-2 hidden sm:block">
                        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-ipb-blue uppercase tracking-wide">
                            {user.role}
                        </span>
                    </div>
                </div>
                
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:text-ipb-blue transition-colors shadow-sm"
                    >
                        <Edit2 className="h-4 w-4" /> Edit Profil
                    </button>
                )}
            </div>

            {/* Mobile Name (shown below avatar on small screens) */}
            <div className="sm:hidden mb-6">
                 <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-ipb-blue uppercase tracking-wide">
                    {user.role}
                </span>
            </div>

            {/* Feedback Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">Nama Lengkap</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <input 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${isEditing ? 'bg-white border-slate-300 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue' : 'bg-slate-50 border-transparent text-slate-600'} transition-all`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">Alamat Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${isEditing ? 'bg-white border-slate-300 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue' : 'bg-slate-50 border-transparent text-slate-600'} transition-all`}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">Kategori Pengguna</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <input 
                                type="text" 
                                value={user.role === 'student' ? 'Mahasiswa' : user.role === 'staff' ? 'Dosen / Tendik' : 'Administrator'}
                                disabled
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-transparent bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        {isEditing && <p className="text-xs text-slate-400 mt-1 ml-1">*Kategori tidak dapat diubah.</p>}
                    </div>

                    {user.role === 'student' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 mb-1.5">Nomor Induk Mahasiswa (NIM)</label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    name="nim"
                                    value={formData.nim}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${isEditing ? 'bg-white border-slate-300 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue' : 'bg-slate-50 border-transparent text-slate-600'} transition-all`}
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Action Buttons */}
                {isEditing && (
                    <div className="md:col-span-2 pt-6 border-t border-slate-100 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="flex items-center px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                        >
                            <X className="h-4 w-4 mr-2" /> Batal
                        </button>
                        <button 
                            type="submit"
                            disabled={isLoading} 
                            className="flex items-center px-6 py-2.5 rounded-xl bg-ipb-blue text-white font-bold hover:bg-ipb-dark transition-colors shadow-lg shadow-blue-900/10 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Simpan Perubahan
                        </button>
                    </div>
                )}
            </form>
        </div>
      </div>
    </div>
  );
};