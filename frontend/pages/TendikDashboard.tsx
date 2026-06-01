import React, { useEffect, useState } from 'react';
import { Booking, BookingStatus } from '../types';
import { BookingService } from '../services/bookingService';
import { api } from '../services/api';
import { CheckCircle, XCircle, FileText, Clock, User, Calendar, MapPin, Download } from 'lucide-react';

export const TendikDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'review' | 'history'>('pending');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const [bookingsRes, facilitiesRes] = await Promise.all([
        BookingService.getAllBookings(),
        import('../services/facilityService').then(m => m.FacilityService.getAllFacilities())
      ]);

      if (facilitiesRes.success && facilitiesRes.data) {
        const facMap: Record<string, string> = {};
        facilitiesRes.data.forEach(f => {
          facMap[f.id] = f.name;
        });
        setFacilities(facMap);
      }

      if (bookingsRes.success && bookingsRes.data) {
        setBookings(bookingsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    if (status === BookingStatus.REJECTED) {
      const reason = prompt('Masukkan alasan penolakan:');
      if (!reason) return;
      try {
        await api.put(`/bookings/${id}/reject`, { reason });
        fetchBookings();
      } catch (err: any) {
        alert(err.message || 'Gagal menolak pengajuan');
      }
    } else {
      if (confirm(`Apakah Anda yakin ingin mengubah status menjadi ${status}?`)) {
        await BookingService.updateBookingStatus(id, status);
        fetchBookings();
      }
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'pending') return b.status === BookingStatus.PENDING;
    if (filter === 'review') return b.status === BookingStatus.IN_REVIEW;
    if (filter === 'history') return b.status === BookingStatus.APPROVED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.COMPLETED;
    return true;
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.APPROVED: return "bg-green-100 text-green-700 border-green-200";
      case BookingStatus.REJECTED: return "bg-red-100 text-red-700 border-red-200";
      case BookingStatus.IN_REVIEW: return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case BookingStatus.PENDING: return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case BookingStatus.COMPLETED: return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Tendik</h1>
          <p className="text-slate-500">Kelola pengajuan peminjaman fasilitas</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Perlu Tindakan
          </button>
          <button
            onClick={() => setFilter('review')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'review' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Menunggu Persetujuan
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
              <p className="text-slate-500">Tidak ada data pengajuan.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                {/* Left: Status colored strip (Admin style) */}
                <div className={`w-full md:w-2 ${
                  booking.status === BookingStatus.PENDING ? 'bg-yellow-400' :
                  booking.status === BookingStatus.IN_REVIEW ? 'bg-indigo-500' :
                  booking.status === BookingStatus.APPROVED ? 'bg-green-500' :
                  booking.status === BookingStatus.REJECTED ? 'bg-red-500' : 'bg-slate-300'
                }`}></div>

                <div className="p-6 flex-1">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">#{booking.id}</span>
                        <span className="text-xs text-slate-500 font-medium flex items-center bg-slate-100 px-2.5 py-0.5 rounded-full">
                          <User className="h-3 w-3 mr-1 text-slate-400" /> {booking.userName || 'Unknown User'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 mb-1">{booking.eventName}</h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">{booking.eventDescription}</p>

                      <div className="flex flex-wrap gap-x-6 gap-y-2.5 mt-3 text-sm text-slate-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 text-slate-400" />
                          <span>{new Date(booking.startTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
                          <span>
                            {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                            {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1.5 text-slate-400" />
                          <span>Fasilitas: <span className="font-bold text-slate-700">{facilities[booking.facilityId] || booking.facilityId}</span></span>
                        </div>
                      </div>

                      {/* Document Section (Polished Admin-inspired style) */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-ipb-blue" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Surat Pengantar</p>
                            <p className="text-xs text-slate-400">Diunggah pada {new Date(booking.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {booking.dokumenList && booking.dokumenList.length > 0 ? (
                          <div className="flex flex-col gap-1.5 items-end">
                            {booking.dokumenList.map(doc => (
                              <a
                                key={doc.id}
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${doc.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-ipb-blue hover:text-ipb-dark hover:underline flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm transition-colors"
                              >
                                <Download className="h-3 w-3" />
                                {doc.filename}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-red-400 italic">Tidak ada dokumen</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2.5 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 pl-0 md:pl-6 min-w-[200px]">
                      {booking.status === BookingStatus.PENDING && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(booking.id, BookingStatus.IN_REVIEW)}
                            className="flex items-center justify-center gap-2 bg-ipb-blue hover:bg-ipb-dark text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm w-full"
                          >
                            <CheckCircle className="h-4 w-4" /> Verifikasi Dokumen
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(booking.id, BookingStatus.REJECTED)}
                            className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors w-full"
                          >
                            <XCircle className="h-4 w-4" /> Tolak
                          </button>
                        </>
                      )}
                      {booking.status === BookingStatus.IN_REVIEW && (
                        <>
                          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-2.5 rounded-lg border border-emerald-100 text-center flex items-center justify-center gap-1.5">
                            <Clock className="h-4 w-4 text-emerald-600 animate-pulse" /> Menunggu Persetujuan Admin
                          </div>
                          <button 
                            onClick={() => handleStatusUpdate(booking.id, BookingStatus.REJECTED)}
                            className="flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg font-bold text-xs transition-colors w-full mt-1"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Batalkan/Tolak
                          </button>
                        </>
                      )}
                      {(booking.status === BookingStatus.APPROVED || booking.status === BookingStatus.REJECTED || booking.status === BookingStatus.COMPLETED) && (
                        <div className="text-center text-sm font-medium text-slate-400 italic">
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
    </div>
  );
};
