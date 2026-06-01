import React, { useEffect, useState } from 'react';
import { BookingService } from '../services/bookingService';
import { FacilityService } from '../services/facilityService';
import { Booking, BookingStatus, Facility } from '../types';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, XCircle, Calendar, MapPin, Loader2, Hourglass, TrendingUp, User, FileSearch, FileCheck, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'history'>('all');
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [bookingsRes, facilitiesRes] = await Promise.all([
        BookingService.getUserBookings(user.id),
        FacilityService.getAllFacilities()
      ]);

      if (facilitiesRes.success && facilitiesRes.data) {
        const facMap: Record<string, Facility> = {};
        facilitiesRes.data.forEach(f => {
          facMap[f.id] = f;
        });
        setFacilities(facMap);
      }

      if (bookingsRes.data) {
        setBookings(bookingsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
        navigate('/login');
        return;
    }

    fetchBookings();
    
    const interval = setInterval(() => {
        fetchBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, [location.state, isAuthenticated, user]);

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

  const filteredBookings = bookings.filter(b => {
    if (filter === 'active') return b.status === BookingStatus.PENDING || b.status === BookingStatus.IN_REVIEW;
    if (filter === 'history') return b.status === BookingStatus.APPROVED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.COMPLETED;
    return true;
  });

  const getStatusColor = (status: BookingStatus) => {
    switch(status) {
        case BookingStatus.APPROVED: return "bg-green-100 text-green-700 border-green-200";
        case BookingStatus.REJECTED: return "bg-red-100 text-red-700 border-red-200";
        case BookingStatus.IN_REVIEW: return "bg-indigo-100 text-indigo-700 border-indigo-200";
        case BookingStatus.PENDING: return "bg-yellow-50 text-yellow-700 border-yellow-200";
        case BookingStatus.COMPLETED: return "bg-slate-100 text-slate-700 border-slate-200";
        default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStripColor = (status: BookingStatus) => {
    switch(status) {
        case BookingStatus.APPROVED: return 'bg-green-500';
        case BookingStatus.REJECTED: return 'bg-red-500';
        case BookingStatus.IN_REVIEW: return 'bg-indigo-500';
        case BookingStatus.PENDING: return 'bg-yellow-400';
        case BookingStatus.COMPLETED: return 'bg-slate-300';
        default: return 'bg-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Peminjaman Saya</h1>
          <p className="text-slate-500">Pantau status pengajuan peminjaman fasilitas Anda</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'active' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Dalam Proses
          </button>
          <button
            onClick={() => setFilter('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'history' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Riwayat
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ipb-blue"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Belum ada peminjaman</h3>
              <p className="text-slate-500 mt-2">Anda belum mengajukan peminjaman fasilitas apapun.</p>
            </div>
          ) : (
            filteredBookings.map(booking => {
              const facility = facilities[booking.facilityId];
              const isPending = booking.status === BookingStatus.PENDING;

              return (
                <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                  {/* Left: Status colored strip */}
                  <div className={`w-full md:w-2 ${getStripColor(booking.status)}`}></div>

                  <div className="p-6 flex-1">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      {/* Left: Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                          <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">#{booking.id}</span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-1">{booking.eventName}</h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">{booking.eventDescription}</p>

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
                            {new Date(booking.startTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1.5 text-slate-400" />
                            {facility?.name || 'Unknown Facility'}
                          </div>
                          {booking.attendees && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1.5 text-slate-400" />
                              {booking.attendees} Orang
                            </div>
                          )}
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

                      {/* Right: Status & Actions */}
                      <div className="flex flex-col gap-2.5 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 pl-0 md:pl-6 min-w-[200px]">
                        {/* Queue Status for Pending */}
                        {isPending && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-2 text-blue-800 mb-1">
                              <TrendingUp className="h-4 w-4" />
                              <span className="font-semibold text-xs">Status Antrean</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-blue-500 text-xs">Estimasi</span>
                              <span className="font-bold text-blue-900 text-sm">
                                {booking.queuePosition ? `~${booking.queuePosition * 15} mnt` : '-'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-blue-500 text-xs">Urutan</span>
                              <span className="font-bold text-ipb-blue text-sm">#{booking.queuePosition}</span>
                            </div>
                          </div>
                        )}

                        {/* In Review Status */}
                        {booking.status === BookingStatus.IN_REVIEW && (
                          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-2.5 rounded-lg border border-emerald-100 text-center flex items-center justify-center gap-1.5">
                            <Clock className="h-4 w-4 text-emerald-600 animate-pulse" /> Menunggu Persetujuan Admin
                          </div>
                        )}

                        {/* Rejected Reason */}
                        {booking.status === BookingStatus.REJECTED && booking.rejectionReason && (
                          <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
                            <div className="font-semibold flex items-center gap-1 mb-1">
                              <XCircle className="h-3.5 w-3.5" /> Alasan Penolakan
                            </div>
                            <p className="text-red-600">{booking.rejectionReason}</p>
                          </div>
                        )}

                        {/* Approved */}
                        {booking.status === BookingStatus.APPROVED && (
                          <div className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-2.5 rounded-lg border border-green-100 text-center flex items-center justify-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-green-600" /> Disetujui
                          </div>
                        )}

                        {/* Cancel button for pending */}
                        {isPending && (
                          <button
                            onClick={async () => {
                              if (confirm('Apakah Anda yakin ingin membatalkan pengajuan ini?')) {
                                const res = await BookingService.deleteBooking(booking.id);
                                if (res.success) fetchBookings();
                                else alert(res.error || 'Gagal membatalkan');
                              }
                            }}
                            className="flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-xs transition-colors w-full"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Batalkan Pengajuan
                          </button>
                        )}

                        {/* History items */}
                        {(booking.status === BookingStatus.COMPLETED) && (
                          <div className="text-center text-sm font-medium text-slate-400 italic">
                            Selesai diproses
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};