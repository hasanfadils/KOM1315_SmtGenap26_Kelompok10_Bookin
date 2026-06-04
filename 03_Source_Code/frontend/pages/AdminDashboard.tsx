import React, { useEffect, useState } from 'react';
import { BookingService } from '../services/bookingService';
import { FacilityService } from '../services/facilityService';
import { LaporanService } from '../services/laporanService';
import { Booking, BookingStatus, Facility, FacilityStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, FileText, MapPin, Edit, Users, Search, Loader2, Plus, Trash2, AlertTriangle, FileCheck, Eye, Download } from 'lucide-react';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'bookings' | 'facilities' | 'laporan'>('bookings');
    const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'review' | 'history'>('all');

    // Data State
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);

    // Laporan State
    const [laporanData, setLaporanData] = useState<Booking[]>([]);
    const [laporanSummary, setLaporanSummary] = useState<Record<string, { jumlah: number; persentase: number }>>({});
    const [laporanLoading, setLaporanLoading] = useState(false);

    // Laporan Filter State
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');
    const [filterRuanganId, setFilterRuanganId] = useState<string>('');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/login');
            return;
        }
        if (activeTab === 'laporan') {
            loadFacilitiesOnly();
            handleGenerateLaporan();
        } else {
            loadData();
        }
    }, [isAuthenticated, user, activeTab]);

    const loadFacilitiesOnly = async () => {
        const facRes = await FacilityService.getAllFacilities();
        if (facRes.data) setFacilities(facRes.data);
    };

    const handleGenerateLaporan = async () => {
        setLaporanLoading(true);
        const res = await LaporanService.generate({
            status: filterStatus || undefined,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
            ruanganId: filterRuanganId || undefined,
        });
        if (res.success && res.data) {
            setLaporanData(res.data.data_peminjaman);
            setLaporanSummary(res.data.ringkasan);
        } else {
            alert(res.error || 'Gagal generate laporan');
        }
        setLaporanLoading(false);
    };

    const handleDownloadCSV = () => {
        if (laporanData.length === 0) {
            alert('Tidak ada data untuk diunduh. Silakan generate laporan terlebih dahulu.');
            return;
        }

        const headers = ['ID Peminjaman', 'Nama Acara', 'Deskripsi Acara', 'Peminjam', 'Fasilitas', 'Tanggal Mulai', 'Tanggal Selesai', 'Jumlah Peserta', 'Status'];
        
        const rows = laporanData.map(item => {
            const facilityName = facilities.find(f => f.id === item.facilityId)?.name || item.facilityId;
            return [
                item.id,
                `"${item.eventName.replace(/"/g, '""')}"`,
                `"${item.eventDescription.replace(/"/g, '""')}"`,
                `"${(item.userName || 'N/A').replace(/"/g, '""')}"`,
                `"${facilityName.replace(/"/g, '""')}"`,
                new Date(item.startTime).toLocaleString('id-ID'),
                new Date(item.endTime).toLocaleString('id-ID'),
                item.attendees,
                item.status
            ];
        });

        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `rekap_peminjaman_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const loadData = async () => {
        setLoading(true);
        // Load facilities always so we can map names
        const facRes = await FacilityService.getAllFacilities();
        if (facRes.data) setFacilities(facRes.data);

        if (activeTab === 'bookings') {
            const res = await BookingService.getAllBookings();
            if (res.data) setBookings(res.data);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
        if (status === BookingStatus.REJECTED) {
            const reason = prompt('Masukkan alasan penolakan:');
            if (!reason) return;
            try {
                await api.put(`/bookings/${bookingId}/reject`, { reason });
                loadData();
            } catch (err: any) {
                alert(err.message || 'Gagal menolak pengajuan');
            }
        } else {
            const res = await BookingService.updateBookingStatus(bookingId, status);
            if (res.success) {
                if (res.data) {
                    setBookings(prev => prev.map(b => b.id === bookingId ? res.data! : b));
                } else {
                    loadData();
                }
            }
        }
    };

    const handleCreateFacility = () => {
        navigate('/admin/facility/edit/new');
    };

    const handleEditFacility = (facilityId: string) => {
        navigate(`/admin/facility/edit/${facilityId}`);
    };

    const handleDeleteFacility = async (facilityId: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus fasilitas ini secara permanen?")) {
            setLoading(true);
            const res = await FacilityService.deleteFacility(facilityId);
            if (res.success) {
                setFacilities(prev => prev.filter(f => f.id !== facilityId));
            } else {
                alert("Gagal menghapus fasilitas.");
            }
            setLoading(false);
        }
    };

    const handleViewDocument = (dokumenList?: { fileUrl: string; filename: string }[]) => {
        if (!dokumenList || dokumenList.length === 0) {
            alert("Dokumen tidak ditemukan.");
            return;
        }
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        dokumenList.forEach(doc => {
            const url = token ? `${baseUrl}${doc.fileUrl}?token=${token}` : `${baseUrl}${doc.fileUrl}`;
            window.open(url, '_blank');
        });
    };

    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.APPROVED: return "bg-green-100 text-green-700 border-green-200";
            case BookingStatus.REJECTED: return "bg-red-100 text-red-700 border-red-200";
            case BookingStatus.IN_REVIEW: return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case BookingStatus.PENDING: return "bg-yellow-50 text-yellow-700 border-yellow-200";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getFacilityStatusColor = (status: FacilityStatus) => {
        switch (status) {
            case FacilityStatus.AVAILABLE: return "bg-green-100 text-green-700 border-green-200";
            case FacilityStatus.MAINTENANCE: return "bg-orange-100 text-orange-700 border-orange-200";
            case FacilityStatus.RENOVATION: return "bg-red-100 text-red-700 border-red-200";
            case FacilityStatus.CLOSED: return "bg-slate-100 text-slate-700 border-slate-200";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Dashboard Administrator</h1>
                    <p className="text-slate-600">Kelola pengajuan peminjaman dan data fasilitas.</p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-1">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Persetujuan Peminjaman
                    </button>
                    <button
                        onClick={() => setActiveTab('facilities')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'facilities' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Manajemen Aset
                    </button>
                    <button
                        onClick={() => setActiveTab('laporan')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'laporan' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Laporan Rekapitulasi
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-ipb-blue" />
                </div>
            ) : (
                <>
                    {/* BOOKINGS TAB */}
                    {activeTab === 'bookings' && (
                        <div className="space-y-4">
                            {/* Sub-filter tabs */}
                            <div className="flex flex-wrap gap-2 bg-white p-1 rounded-lg border border-slate-200 w-fit mb-2">
                              <button
                                onClick={() => setBookingFilter('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${bookingFilter === 'all' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                Semua
                              </button>
                              <button
                                onClick={() => setBookingFilter('pending')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${bookingFilter === 'pending' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                Menunggu Verifikasi
                              </button>
                              <button
                                onClick={() => setBookingFilter('review')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${bookingFilter === 'review' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                Perlu Persetujuan
                              </button>
                              <button
                                onClick={() => setBookingFilter('history')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${bookingFilter === 'history' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                Riwayat
                              </button>
                            </div>

                            {bookings.filter(b => {
                              if (bookingFilter === 'pending') return b.status === BookingStatus.PENDING;
                              if (bookingFilter === 'review') return b.status === BookingStatus.IN_REVIEW;
                              if (bookingFilter === 'history') return b.status === BookingStatus.APPROVED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.COMPLETED;
                              return true;
                            }).length === 0 ? (
                                <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">Tidak ada data pengajuan.</div>
                            ) : (
                                bookings.filter(b => {
                                  if (bookingFilter === 'pending') return b.status === BookingStatus.PENDING;
                                  if (bookingFilter === 'review') return b.status === BookingStatus.IN_REVIEW;
                                  if (bookingFilter === 'history') return b.status === BookingStatus.APPROVED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.COMPLETED;
                                  return true;
                                }).map(booking => (
                                    <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                                        <div className={`w-full md:w-2 ${booking.status === BookingStatus.PENDING ? 'bg-yellow-400' :
                                                booking.status === BookingStatus.IN_REVIEW ? 'bg-indigo-500' :
                                                    booking.status === BookingStatus.APPROVED ? 'bg-green-500' :
                                                        booking.status === BookingStatus.REJECTED ? 'bg-red-500' : 'bg-slate-300'
                                            }`}></div>

                                        <div className="p-6 flex-1">
                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-xs px-2 py-1 rounded border font-medium ${getStatusColor(booking.status)}`}>
                                                            {booking.status}
                                                        </span>
                                                        <span className="text-xs text-slate-400">#{booking.id}</span>
                                                        <span className="text-xs text-slate-500 font-medium flex items-center bg-slate-100 px-2 py-0.5 rounded-full">
                                                            <Users className="h-3 w-3 mr-1" /> {booking.userName}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800">{booking.eventName}</h3>
                                                    <p className="text-sm text-slate-600 mt-1 line-clamp-1">{booking.eventDescription}</p>

                                                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-1.5" />
                                                            {new Date(booking.startTime).toLocaleDateString()} {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <MapPin className="h-4 w-4 mr-1.5" />
                                                            {facilities.find(f => f.id === booking.facilityId)?.name || booking.facilityId}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Users className="h-4 w-4 mr-1.5" />
                                                            {booking.attendees} Orang
                                                        </div>
                                                    </div>

                                                    {/* DOCUMENT VIEWER BUTTON */}
                                                    {booking.dokumenList && booking.dokumenList.length > 0 && (
                                                        <div className="mt-3">
                                                            <button
                                                                onClick={() => handleViewDocument(booking.dokumenList)}
                                                                className="text-xs font-bold text-ipb-blue hover:text-ipb-dark flex items-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors w-fit"
                                                            >
                                                                <FileCheck className="h-3.5 w-3.5 mr-1.5" /> Lihat Surat Pengantar ({booking.dokumenList.length} file)
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 self-start md:self-center flex-wrap justify-end">
                                                    {/* Action Buttons Logic */}
                                                    {booking.status === BookingStatus.PENDING && (
                                                        <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                                                            <Clock className="h-4 w-4 animate-pulse" /> Menunggu Verifikasi Tendik
                                                        </div>
                                                    )}

                                                    {booking.status === BookingStatus.IN_REVIEW && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.id, BookingStatus.REJECTED)}
                                                                className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                                                            >
                                                                Tolak
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.id, BookingStatus.APPROVED)}
                                                                className="px-4 py-2 rounded-lg bg-ipb-blue text-white hover:bg-ipb-dark text-sm font-medium transition-colors shadow-sm"
                                                            >
                                                                Setujui
                                                            </button>
                                                        </>
                                                    )}

                                                    {(booking.status === BookingStatus.APPROVED || booking.status === BookingStatus.REJECTED) && (
                                                        <div className="self-center text-sm font-medium text-slate-400 italic">
                                                            Selesai diproses
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* FACILITIES TAB */}
                    {activeTab === 'facilities' && (
                        <div>
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={handleCreateFacility}
                                    className="flex items-center gap-2 bg-ipb-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-ipb-dark transition-colors shadow-lg shadow-blue-900/10"
                                >
                                    <Plus className="h-5 w-5" /> Tambah Fasilitas Baru
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {facilities.map(facility => (
                                    <div key={facility.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group">
                                        <div className="h-40 overflow-hidden relative">
                                            <img src={facility.imageUrl?.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${facility.imageUrl}` : facility.imageUrl} alt={facility.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute top-2 left-2 flex gap-1">
                                                <div className="bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-slate-700 uppercase tracking-wide border border-slate-200 shadow-sm">
                                                    {facility.type}
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2">
                                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border shadow-sm flex items-center gap-1 ${getFacilityStatusColor(facility.status)}`}>
                                                    {facility.status === FacilityStatus.MAINTENANCE || facility.status === FacilityStatus.RENOVATION ? <AlertTriangle className="h-3 w-3" /> : null}
                                                    {facility.status}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-lg text-slate-800 mb-1">{facility.name}</h3>
                                            <div className="text-sm text-slate-500 mb-3 flex items-center">
                                                <MapPin className="h-3 w-3 mr-1" /> {facility.location}
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{facility.description}</p>

                                            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center gap-2">
                                                <button
                                                    onClick={() => handleEditFacility(facility.id)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-slate-700 font-bold text-sm px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
                                                >
                                                    <Edit className="h-4 w-4" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFacility(facility.id)}
                                                    className="flex items-center justify-center gap-1.5 text-red-600 font-bold text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                                                    title="Hapus Fasilitas"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LAPORAN TAB */}
                    {activeTab === 'laporan' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Filter Section */}
                            <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
                                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Search className="h-5 w-5 text-ipb-blue" />
                                    Filter Rekapitulasi Data Peminjaman
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 hover:bg-white transition-colors focus:ring-2 focus:ring-ipb-blue/20"
                                        >
                                            <option value="">Semua Status</option>
                                            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                                            <option value="Sedang Direview">Sedang Direview</option>
                                            <option value="Disetujui">Disetujui</option>
                                            <option value="Ditolak">Ditolak</option>
                                            <option value="Selesai">Selesai</option>
                                        </select>
                                    </div>

                                    {/* Start Date Filter */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Mulai</label>
                                        <input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 hover:bg-white transition-colors focus:ring-2 focus:ring-ipb-blue/20"
                                        />
                                    </div>

                                    {/* End Date Filter */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Selesai</label>
                                        <input
                                            type="date"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 hover:bg-white transition-colors focus:ring-2 focus:ring-ipb-blue/20"
                                        />
                                    </div>

                                    {/* Ruangan Filter */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fasilitas / Ruangan</label>
                                        <select
                                            value={filterRuanganId}
                                            onChange={(e) => setFilterRuanganId(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 hover:bg-white transition-colors focus:ring-2 focus:ring-ipb-blue/20"
                                        >
                                            <option value="">Semua Ruangan</option>
                                            {facilities.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleGenerateLaporan}
                                        disabled={laporanLoading}
                                        className="flex items-center gap-2 bg-ipb-blue text-white px-6 py-2.5 rounded-lg font-bold hover:bg-ipb-dark transition-colors disabled:bg-slate-300 shadow-sm"
                                    >
                                        {laporanLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-4 w-4" />
                                                Generate Laporan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Summary Metrics Section */}
                            {Object.keys(laporanSummary).length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {Object.entries(BookingStatus).map(([key, value]) => {
                                        const metrics = laporanSummary[value] || { jumlah: 0, persentase: 0 };
                                        
                                        let cardColor = "bg-white border-slate-200 text-slate-800";
                                        let badgeColor = "bg-slate-100 text-slate-700";
                                        
                                        if (value === BookingStatus.APPROVED) {
                                            cardColor = "bg-green-50/50 border-green-200 text-green-900 hover:bg-green-50 transition-colors";
                                            badgeColor = "bg-green-100 text-green-700";
                                        } else if (value === BookingStatus.REJECTED) {
                                            cardColor = "bg-red-50/50 border-red-200 text-red-900 hover:bg-red-50 transition-colors";
                                            badgeColor = "bg-red-100 text-red-700";
                                        } else if (value === BookingStatus.IN_REVIEW) {
                                            cardColor = "bg-indigo-50/50 border-indigo-200 text-indigo-900 hover:bg-indigo-50 transition-colors";
                                            badgeColor = "bg-indigo-100 text-indigo-700";
                                        } else if (value === BookingStatus.PENDING) {
                                            cardColor = "bg-yellow-50/50 border-yellow-200 text-yellow-900 hover:bg-yellow-50 transition-colors";
                                            badgeColor = "bg-yellow-100 text-yellow-700";
                                        } else if (value === BookingStatus.COMPLETED) {
                                            cardColor = "bg-blue-50/50 border-blue-200 text-blue-900 hover:bg-blue-50 transition-colors";
                                            badgeColor = "bg-blue-100 text-blue-700";
                                        }

                                        return (
                                            <div key={key} className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${cardColor}`}>
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 line-clamp-1 mb-2">
                                                    {value}
                                                </div>
                                                <div className="flex items-baseline justify-between mt-auto gap-2">
                                                    <span className="text-2xl font-extrabold">{metrics.jumlah}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                                        {metrics.persentase}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Data Table Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800">Tabel Rekapitulasi ({laporanData.length} Peminjaman)</h3>
                                    {laporanData.length > 0 && (
                                        <button
                                            onClick={handleDownloadCSV}
                                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                        >
                                            <Download className="h-4 w-4" />
                                            Unduh Rekap (CSV)
                                        </button>
                                    )}
                                </div>

                                {laporanData.length === 0 ? (
                                    <div className="text-center py-20 text-slate-400 bg-white">
                                        <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                        <p>Tidak ada data peminjaman yang cocok dengan filter.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                                            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                                                <tr>
                                                    <th className="px-6 py-4">Nama Acara</th>
                                                    <th className="px-6 py-4">Peminjam</th>
                                                    <th className="px-6 py-4">Ruangan / Fasilitas</th>
                                                    <th className="px-6 py-4">Tanggal & Waktu</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-150 bg-white">
                                                {laporanData.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-900">{item.eventName}</div>
                                                            <div className="text-xs text-slate-400 font-mono mt-0.5">#{item.id.substring(0, 8)}...</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-slate-800">{item.userName || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600">
                                                            {facilities.find(f => f.id === item.facilityId)?.name || item.facilityId}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-800">
                                                                {new Date(item.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};