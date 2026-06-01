import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FacilityService } from '../services/facilityService';
import { Facility, FacilityStatus, FacilityType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, Loader2, PlusCircle } from 'lucide-react';

export const FacilityEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<Partial<Facility>>({
      status: FacilityStatus.AVAILABLE,
      type: FacilityType.CLASSROOM,
      features: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const isNew = id === 'new';

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    if (!isNew && id) {
        FacilityService.getFacilityById(id).then(data => {
            if (data) {
                setFormData(data);
            } else {
                setError("Fasilitas tidak ditemukan.");
            }
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, [id, isAuthenticated, user, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     // Simple feature list string parsing for demo
     const features = e.target.value.split(',').map(f => f.trim()).filter(f => f !== '');
     setFormData(prev => ({...prev, features}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let res;
    if (isNew) {
        // Validation for required fields for creation
         if(!formData.name || !formData.capacity || !formData.location) {
              setError("Harap isi Nama, Kapasitas, dan Lokasi.");
              setSaving(false);
              return;
         }

         let finalImageUrl = formData.imageUrl;
         if (imageFile) {
             const uploadRes = await FacilityService.uploadImage(imageFile);
             if (uploadRes.success && uploadRes.data) {
                 finalImageUrl = uploadRes.data.url;
             } else {
                 setError(uploadRes.error || "Gagal mengupload gambar.");
                 setSaving(false);
                 return;
             }
         }

         const rawData = { ...formData, imageUrl: finalImageUrl };
         res = await FacilityService.createFacility(rawData as Omit<Facility, 'id'>);
    } else if (id) {
        let finalImageUrl = formData.imageUrl;
        if (imageFile) {
             const uploadRes = await FacilityService.uploadImage(imageFile);
             if (uploadRes.success && uploadRes.data) {
                 finalImageUrl = uploadRes.data.url;
             } else {
                 setError(uploadRes.error || "Gagal mengupload gambar.");
                 setSaving(false);
                 return;
             }
        }
        const rawData = { ...formData, imageUrl: finalImageUrl };
        res = await FacilityService.updateFacility(id, rawData);
    } else {
        res = { success: false, error: "Invalid Operation" };
    }

    setSaving(false);

    if (res.success) {
        navigate('/admin/dashboard');
    } else {
        setError(res.error || "Gagal menyimpan perubahan");
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-ipb-blue" /></div>;
  if (error && !isNew) return <div className="p-10 text-red-600 font-bold">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
      <button onClick={() => navigate('/admin/dashboard')} className="mb-6 flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold">{isNew ? 'Tambah Fasilitas Baru' : 'Edit Fasilitas'}</h1>
                <p className="text-slate-400 text-sm mt-1">
                    {isNew ? 'Masukkan detail fasilitas baru di bawah ini.' : `Mengubah informasi: ${formData.name}`}
                </p>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
                {isNew ? <PlusCircle className="h-6 w-6 text-white"/> : <Save className="h-6 w-6 text-white"/>}
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-sm font-bold">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nama Fasilitas <span className="text-red-500">*</span></label>
                    <input 
                        type="text" name="name" value={formData.name || ''} onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue px-4 py-2" required
                        placeholder="Contoh: Auditorium Utama"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipe Fasilitas <span className="text-red-500">*</span></label>
                    <select 
                        name="type" value={formData.type} onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue px-4 py-2"
                    >
                        {Object.values(FacilityType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Status Operasional <span className="text-red-500">*</span></label>
                    <select 
                        name="status" value={formData.status} onChange={handleChange}
                        className={`w-full rounded-lg border border-slate-300 text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue px-4 py-2 font-bold ${
                            formData.status === FacilityStatus.AVAILABLE ? 'bg-green-50 text-green-700' :
                            formData.status === FacilityStatus.MAINTENANCE ? 'bg-orange-50 text-orange-700' :
                            'bg-red-50 text-red-700'
                        }`}
                    >
                        {Object.values(FacilityStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Ubah ke "Maintenance" atau "Renovasi" jika ada kendala.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Kapasitas (Orang) <span className="text-red-500">*</span></label>
                    <input 
                        type="number" name="capacity" value={formData.capacity || ''} onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue px-4 py-2" required
                        placeholder="0"
                    />
                </div>
                
                <div className="">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Lokasi <span className="text-red-500">*</span></label>
                    <input 
                        type="text" name="location" value={formData.location || ''} onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue px-4 py-2" required
                        placeholder="Gedung..."
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi</label>
                    <textarea 
                        name="description" rows={4} value={formData.description || ''} onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue px-4 py-2" required
                        placeholder="Jelaskan detail fasilitas..."
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Foto Fasilitas ({isNew ? 'Wajib' : 'Opsional'})</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setImageFile(e.target.files[0]);
                            }
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ipb-blue/10 file:text-ipb-blue hover:file:bg-ipb-blue/20"
                    />
                    {!isNew && formData.imageUrl && !imageFile && (
                        <p className="text-xs text-slate-500 mt-2">
                            Gambar saat ini: <a href={formData.imageUrl} target="_blank" rel="noreferrer" className="text-ipb-blue underline">Lihat Gambar</a>
                        </p>
                    )}
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Fitur Fasilitas (pisahkan dengan koma)</label>
                    <input 
                        type="text" 
                        defaultValue={formData.features?.join(', ')} 
                        onBlur={handleFeatureChange}
                        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue px-4 py-2"
                        placeholder="AC, Proyektor, Sound System"
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                    type="button"
                    onClick={() => navigate('/admin/dashboard')}
                    className="px-6 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                    Batal
                </button>
                <button 
                    type="submit" disabled={saving}
                    className="flex items-center bg-ipb-blue text-white px-8 py-2 rounded-xl font-bold hover:bg-ipb-dark transition-colors disabled:opacity-70 shadow-lg shadow-blue-900/20"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Save className="h-5 w-5 mr-2" />}
                    {isNew ? 'Buat Fasilitas' : 'Simpan Perubahan'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};