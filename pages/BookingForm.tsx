import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Facility } from '../types';
import { BookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { Upload, AlertCircle, ArrowLeft, Clock, FileText, Users, CheckCircle2, X, File as FileIcon } from 'lucide-react';
import { DatePicker } from '../components/DatePicker';
import { TimePicker } from '../components/TimePicker';

export const BookingForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const facility = location.state?.facility as Facility;
  
  // Ref for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: '' as string | number,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (!isAuthenticated) {
          navigate('/login');
      }
  }, [isAuthenticated, navigate]);

  if (!facility) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <h2 className="text-xl font-bold mb-4">Fasilitas tidak valid</h2>
                <button onClick={() => navigate('/facilities')} className="text-ipb-blue hover:underline">Kembali ke Daftar</button>
            </div>
        </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'attendees') {
      // Parse as number explicitly to avoid off-by-one from string/number coercion
      const numVal = value === '' ? '' : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: isNaN(numVal as number) ? '' : numVal }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, date }));
  };

  const handleStartTimeChange = (time: string) => {
    setFormData(prev => ({ ...prev, startTime: time }));
  };

  const handleEndTimeChange = (time: string) => {
    setFormData(prev => ({ ...prev, endTime: time }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Validation
        if (file.type !== 'application/pdf') {
            setError("Hanya format PDF yang diperbolehkan.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            setError("Ukuran file maksimal 5MB.");
            return;
        }

        setError(null);
        setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.date || !formData.startTime || !formData.endTime) {
        setError("Harap lengkapi tanggal dan waktu peminjaman.");
        return;
    }

    if (!selectedFile) {
        setError("Wajib mengunggah Surat Pengantar.");
        return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await BookingService.createBooking({
        facilityId: facility.id,
        userId: user.id,
        eventName: formData.eventName,
        eventDescription: formData.eventDescription,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        attendees: formData.attendees,
        documentFile: selectedFile
    });

    setIsSubmitting(false);

    if (result.success) {
        navigate('/my-bookings', { state: { newBooking: true } });
    } else {
        setError(result.error || "Gagal mengajukan peminjaman.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="group flex items-center text-slate-600 hover:text-slate-900 transition-colors">
                <div className="bg-white border border-slate-300 p-2 rounded-full mr-3 shadow-sm group-hover:shadow transition-all">
                    <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-bold">Kembali</span>
            </button>
            <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fasilitas Dipilih</span>
                <p className="font-bold text-slate-900 text-lg">{facility.name}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Form */}
            <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start border border-red-200 shadow-sm animate-fade-in">
                            <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="font-bold">{error}</span>
                        </div>
                    )}

                    {/* Section 1: Event Info (Highest Z-Index) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fade-in-up relative z-30">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="bg-blue-50 p-2 rounded-lg text-ipb-blue border border-blue-100">
                                <FileText className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Detail Kegiatan</h3>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2">Nama Acara</label>
                                <input 
                                    required
                                    type="text" 
                                    name="eventName" 
                                    value={formData.eventName}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue transition-all py-3 px-4 font-semibold placeholder:font-normal placeholder:text-slate-400 shadow-sm" 
                                    placeholder="Contoh: Seminar Nasional Pertanian"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2">Deskripsi Lengkap</label>
                                <textarea 
                                    required
                                    name="eventDescription"
                                    value={formData.eventDescription}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue transition-all py-3 px-4 font-medium placeholder:text-slate-400 shadow-sm" 
                                    placeholder="Jelaskan tujuan dan isi kegiatan..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2">Estimasi Peserta</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <input 
                                        required
                                        type="number" 
                                        name="attendees"
                                        min="1"
                                        max={facility.capacity}
                                        value={formData.attendees}
                                        onChange={handleChange}
                                        className="w-full pl-12 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-ipb-blue/10 focus:border-ipb-blue transition-all py-3 pr-4 font-semibold shadow-sm" 
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        Max {facility.capacity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Time (Middle Z-Index to overlap Section 3) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fade-in-up relative z-20" style={{animationDelay: '0.1s'}}>
                         <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="bg-yellow-50 p-2 rounded-lg text-yellow-600 border border-yellow-100">
                                <Clock className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Waktu Pelaksanaan</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <DatePicker 
                                    label="Tanggal"
                                    value={formData.date}
                                    onChange={handleDateChange}
                                    minDate={new Date().toISOString().split('T')[0]} // Disable past dates
                                    required
                                />
                            </div>
                            <div>
                                <TimePicker 
                                    label="Jam Mulai"
                                    value={formData.startTime}
                                    onChange={handleStartTimeChange}
                                    required
                                />
                            </div>
                             <div>
                                <TimePicker 
                                    label="Jam Selesai"
                                    value={formData.endTime}
                                    onChange={handleEndTimeChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Docs (Lowest Z-Index) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fade-in-up relative z-10" style={{animationDelay: '0.2s'}}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 border border-emerald-100">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Kelengkapan Administrasi</h3>
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="application/pdf"
                            className="hidden"
                        />

                        {!selectedFile ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-ipb-blue hover:bg-blue-50/30 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 transition-all cursor-pointer group bg-slate-50"
                            >
                                <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform border border-slate-200">
                                    <Upload className="h-6 w-6 text-ipb-blue" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-ipb-blue transition-colors">Unggah Surat Pengantar</span>
                                <span className="text-xs mt-1 font-medium">Format PDF, Maksimal 5MB</span>
                            </div>
                        ) : (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between animate-fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
                                        <FileIcon className="h-6 w-6 text-ipb-blue" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 line-clamp-1 break-all">{selectedFile.name}</p>
                                        <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`bg-ipb-accent hover:bg-yellow-500 text-ipb-dark font-extrabold text-lg px-8 py-4 rounded-xl shadow-lg shadow-yellow-500/20 transition-all transform hover:-translate-y-1 hover:shadow-xl w-full md:w-auto ${isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
                        >
                            {isSubmitting ? 'Sedang Memproses...' : 'Kirim Pengajuan Peminjaman'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:w-80">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Ringkasan</h4>
                    
                    <div className="aspect-video rounded-lg overflow-hidden mb-4 relative shadow-inner">
                        <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 text-white font-bold text-sm shadow-black drop-shadow-md">{facility.type}</div>
                    </div>

                    <h3 className="font-bold text-slate-900 mb-2 text-lg">{facility.name}</h3>
                    <div className="flex items-center text-sm text-slate-600 mb-4 font-medium">
                        <div className="w-2 h-2 rounded-full bg-ipb-accent mr-2"></div>
                        {facility.location}
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Kapasitas</span>
                            <span className="font-bold text-slate-800">{facility.capacity} Orang</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Fasilitas</span>
                            <span className="font-bold text-slate-800 text-right">{facility.features.length} item</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};