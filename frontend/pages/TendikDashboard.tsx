import React, { useEffect, useState } from 'react';
import { Booking, BookingStatus } from '../types';
import { BookingService } from '../services/bookingService';
import { api } from '../services/api';
import { CheckCircle, XCircle, FileText, Clock, User, Calendar, MapPin, Download } from 'lucide-react';

export const TendikDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'history'>('pending');

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
    if (filter === 'pending') return b.status === BookingStatus.PENDING || b.status === BookingStatus.IN_REVIEW;
    if (filter === 'history') return b.status === BookingStatus.APPROVED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.COMPLETED;
    return true;
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.IN_REVIEW: return 'bg-blue-100 text-blue-800';
      case BookingStatus.APPROVED: return 'bg-green-100 text-green-800';
      case BookingStatus.REJECTED: return 'bg-red-100 text-red-800';
      case BookingStatus.COMPLETED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Tendik</h1>
          <p className="text-slate-500">Kelola pengajuan peminjaman fasilitas</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Perlu Tindakan
          </button>
          <button
            onClick={() => setFilter('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'history' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Riwayat
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-ipb-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Semua
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
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">#{booking.id}</span>
                        <span className="text-xs text-slate-400">• {new Date(booking.createdAt).toLocaleDateString()}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-1">{booking.eventName}</h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">{booking.eventDescription}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{booking.userName || 'Unknown User'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>Fasilitas: <span className="font-mono font-bold">{facilities[booking.facilityId] || booking.facilityId}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{new Date(booking.startTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>
                            {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                            {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Document Section */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-ipb-blue" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Surat Pengantar</p>
                            <p className="text-xs text-slate-400">Diunggah pada {new Date(booking.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {booking.dokumenList && booking.dokumenList.length > 0 ? (
                          <div className="flex flex-col gap-1 items-end">
                            {booking.dokumenList.map(doc => (
                              <a
                                key={doc.id}
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${doc.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-ipb-blue hover:underline flex items-center gap-1"
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
                    {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.IN_REVIEW) && (
                      <div className="flex flex-col gap-2 justify-center border-l border-slate-100 pl-0 md:pl-6">
                        {booking.status === BookingStatus.PENDING && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(booking.id, BookingStatus.IN_REVIEW)}
                              className="flex items-center justify-center gap-2 bg-ipb-blue hover:bg-ipb-dark text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm w-full md:w-auto"
                            >
                              <CheckCircle className="h-4 w-4" /> Verifikasi Dokumen
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(booking.id, BookingStatus.REJECTED)}
                              className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors w-full md:w-auto"
                            >
                              <XCircle className="h-4 w-4" /> Tolak
                            </button>
                          </>
                        )}
                        {booking.status === BookingStatus.IN_REVIEW && (
                          <>
                            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 text-center flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-emerald-600" /> Menunggu Persetujuan Admin
                            </div>
                            <button 
                              onClick={() => handleStatusUpdate(booking.id, BookingStatus.REJECTED)}
                              className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg font-bold text-xs transition-colors w-full md:w-auto mt-1"
                            >
                              <XCircle className="h-3 w-3" /> Batalkan/Tolak
                            </button>
                          </>
                        )}
                      </div>
                    )}
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
