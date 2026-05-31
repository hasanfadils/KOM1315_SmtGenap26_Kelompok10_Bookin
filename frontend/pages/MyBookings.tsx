import React, { useEffect, useState } from 'react';
import { BookingService } from '../services/bookingService';
import { FacilityService } from '../services/facilityService';
import { Booking, BookingStatus, Facility } from '../types';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, XCircle, Calendar, MapPin, Loader2, Hourglass, TrendingUp, User, FileSearch } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [bookingsRes, facilitiesRes] = await Promise.all([
        user.role === 'admin' ? BookingService.getAllBookings() : BookingService.getUserBookings(user.id),
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

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    const res = await BookingService.updateBookingStatus(id, status);
    if (res.success) fetchBookings();
  };

  const getFacilityDetails = (id: string): Facility | undefined => {
    return facilities[id];
  };

  const getStatusColor = (status: BookingStatus) => {
    switch(status) {
        case BookingStatus.APPROVED: return "bg-green-100 text-green-700";
        case BookingStatus.REJECTED: return "bg-red-100 text-red-700";
        case BookingStatus.IN_REVIEW: return "bg-indigo-100 text-indigo-700";
        case BookingStatus.PENDING: return "bg-ipb-accent/20 text-yellow-800";
        default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch(status) {
        case BookingStatus.APPROVED: return <CheckCircle className="h-4 w-4 mr-1.5"/>;
        case BookingStatus.REJECTED: return <XCircle className="h-4 w-4 mr-1.5"/>;
        case BookingStatus.IN_REVIEW: return <FileSearch className="h-4 w-4 mr-1.5 animate-pulse"/>;
        case BookingStatus.PENDING: return <Hourglass className="h-4 w-4 mr-1.5 animate-pulse"/>;
        default: return <Clock className="h-4 w-4 mr-1.5"/>;
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (isoString?: string) => {
      if(!isoString) return "-";
      const date = new Date(isoString);
      const now = new Date();
      if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth()) {
          return `Hari ini, pukul ${date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`;
      }
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">
                {user?.role === 'admin' ? 'Kelola Seluruh Peminjaman' : 'Riwayat Peminjaman Saya'}
            </h1>
            {user?.role === 'admin' && (
                <p className="text-slate-500 text-sm mt-1">Anda masuk sebagai Administrator.</p>
            )}
        </div>
        <button 
            onClick={fetchBookings} 
            className="text-sm text-ipb-blue hover:underline flex items-center gap-1"
        >
            <Clock className="h-3 w-3" /> Perbarui Status
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-ipb-blue" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-slate-200">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Belum ada peminjaman</h3>
            <p className="text-slate-500 mt-2">
                {user?.role === 'admin' ? 'Belum ada data masuk.' : 'Anda belum mengajukan peminjaman fasilitas apapun.'}
            </p>
        </div>
      ) : (
        <div className="space-y-6">
            {bookings.map(booking => {
                const facility = getFacilityDetails(booking.facilityId);
                const isPending = booking.status === BookingStatus.PENDING;
                
                return (
                    <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
                        {/* Queue Status Header for Pending Items */}
                        {isPending && (
                            <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <TrendingUp className="h-5 w-5" />
                                    <span className="font-semibold text-sm">Status Antrean Real-time</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex flex-col md:items-end">
                                        <span className="text-blue-500 text-xs font-medium uppercase tracking-wider">Estimasi Diproses</span>
                                        <span className="font-bold text-blue-900">
                                            {booking.queuePosition ? `~${booking.queuePosition * 15} menit` : '-'}
                                        </span>
                                    </div>
                                    <div className="bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm">
                                        <span className="text-xs text-slate-500 mr-1">Urutan ke</span>
                                        <span className="text-lg font-bold text-ipb-blue">#{booking.queuePosition}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {booking.status === BookingStatus.IN_REVIEW && (
                            <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3 flex items-center gap-2 text-indigo-700">
                                <FileSearch className="h-5 w-5" />
                                <span className="font-semibold text-sm">Tendik sudah memverifikasi. Menunggu persetujuan Admin.</span>
                            </div>
                        )}

                        {booking.status === BookingStatus.REJECTED && booking.rejectionReason && (
                            <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-2 text-red-700">
                                <XCircle className="h-5 w-5" />
                                <span className="font-semibold text-sm">Alasan penolakan: {booking.rejectionReason}</span>
                            </div>
                        )}

                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </span>
                                        <span className="text-xs text-slate-400">ID: #{booking.id}</span>
                                        
                                        {/* Admin sees who booked it */}
                                        {user?.role === 'admin' && (
                                            <span className="flex items-center text-xs text-slate-500 ml-2 bg-slate-100 px-2 py-0.5 rounded-full">
                                                <User className="h-3 w-3 mr-1" />
                                                {booking.userName || 'Unknown User'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">{booking.eventName}</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 mt-4">
                                        <div className="flex items-center text-slate-600 text-sm">
                                            <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                                            <div>
                                                <span className="font-medium block">{facility?.name || 'Unknown Facility'}</span>
                                                <span className="text-xs text-slate-500">{facility?.location}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center text-slate-600 text-sm">
                                                <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                                <span>{formatDate(booking.startTime)}</span>
                                            </div>
                                            <div className="flex items-center text-slate-600 text-sm mt-1">
                                                <Clock className="h-4 w-4 mr-2 text-slate-400" />
                                                <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)} WIB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2">
                                    {isPending && user?.role !== 'admin' && (
                                        <button
                                            onClick={async () => {
                                                if (confirm('Apakah Anda yakin ingin membatalkan pengajuan ini?')) {
                                                    const res = await BookingService.deleteBooking(booking.id);
                                                    if (res.success) fetchBookings();
                                                    else alert(res.error || 'Gagal membatalkan');
                                                }
                                            }}
                                            className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 hover:border-red-200 w-full md:w-auto"
                                        >
                                            Batalkan
                                        </button>
                                    )}
                                    
                                    {user?.role === 'admin' && isPending && (
                                        <div className="flex gap-2 w-full md:w-auto">
                                             <button
                                                 onClick={() => handleStatusUpdate(booking.id, BookingStatus.REJECTED)}
                                                 className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
                                             >
                                                Tolak
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(booking.id, BookingStatus.APPROVED)}
                                                className="bg-ipb-blue text-white hover:bg-ipb-dark px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
                                            >
                                                Setujui
                                            </button>
                                        </div>
                                    )}

                                    {booking.status === BookingStatus.APPROVED && (
                                        <button className="bg-ipb-blue text-white hover:bg-ipb-dark px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full md:w-auto">
                                            {user?.role === 'admin' ? 'Lihat Izin' : 'Unduh Izin'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};