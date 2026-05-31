import React, { useEffect, useState } from 'react';
import { BookingService } from '../services/bookingService';
import { FacilityService } from '../services/facilityService';
import { Booking, BookingStatus, Facility, FacilityStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, FileText, MapPin, Edit, Users, Search, Loader2, Plus, Trash2, AlertTriangle, FileCheck, Eye } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'bookings' | 'facilities'>('bookings');

    // Data State
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/login');
            return;
        }
        loadData();
    }, [isAuthenticated, user, activeTab]);

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
        const res = await BookingService.updateBookingStatus(bookingId, status);
        if (res.success) {
            // Refresh data locally
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
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

    const handleViewDocument = (documentUrl?: string) => {
        if (!documentUrl) {
            alert("Dokumen tidak ditemukan.");
            return;
        }
        // Open Base64 PDF in new tab
        const win = window.open();
        if (win) {
            win.document.write(`<iframe src="${documentUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
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
                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
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
                            {bookings.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">Belum ada data peminjaman.</div>
                            ) : (
                                bookings.map(booking => (
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
                                                    {booking.documentUrl && (
                                                        <div className="mt-3">
                                                            <button
                                                                onClick={() => handleViewDocument(booking.documentUrl)}
                                                                className="text-xs font-bold text-ipb-blue hover:text-ipb-dark flex items-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors w-fit"
                                                            >
                                                                <FileCheck className="h-3.5 w-3.5 mr-1.5" /> Lihat Surat Pengantar
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
                                            <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
                </>
            )}
        </div>
    );
};