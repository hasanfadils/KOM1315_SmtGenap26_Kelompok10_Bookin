
import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Facility, Booking } from '../types';
import { FacilityService } from '../services/facilityService';
import { BookingService } from '../services/bookingService';

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Distinct color palette for facility tabs
const FACILITY_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', ring: 'ring-blue-500/20' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', ring: 'ring-violet-500/20' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', ring: 'ring-amber-500/20' },
  { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', ring: 'ring-rose-500/20' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', ring: 'ring-cyan-500/20' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', ring: 'ring-orange-500/20' },
  { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', ring: 'ring-teal-500/20' },
];

export const BookingCalendar: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Fetch facilities on mount
  useEffect(() => {
    const loadFacilities = async () => {
      const res = await FacilityService.getAllFacilities();
      if (res.success && res.data) {
        setFacilities(res.data);
        if (res.data.length > 0) {
          setSelectedFacilityId(res.data[0].id);
        }
      }
      setLoading(false);
    };
    loadFacilities();
  }, []);

  // Fetch bookings whenever facility changes
  useEffect(() => {
    if (!selectedFacilityId) return;
    const loadBookings = async () => {
      setLoadingBookings(true);
      const res = await BookingService.getPublicBookings(selectedFacilityId);
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
      setLoadingBookings(false);
    };
    loadBookings();
  }, [selectedFacilityId]);

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);
  const colorIndex = facilities.findIndex(f => f.id === selectedFacilityId);
  const color = FACILITY_COLORS[colorIndex % FACILITY_COLORS.length] || FACILITY_COLORS[0];

  // Group bookings by date string (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      const date = new Date(b.startTime);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bookings]);

  // Calendar helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(selectedDate === key ? null : key);
  };

  const selectedDateBookings = selectedDate ? (bookingsByDate[selectedDate] || []) : [];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ipb-blue" />
      </div>
    );
  }

  if (facilities.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white" id="jadwal-peminjaman">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-ipb-blue text-xs font-semibold tracking-wide uppercase mb-4 border border-blue-100">
            <Calendar className="h-3 w-3" /> Jadwal Peminjaman
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Lihat Ketersediaan Fasilitas
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Cek jadwal peminjaman yang sudah disetujui sebelum mengajukan pinjaman. Pilih fasilitas untuk melihat kalendernya.
          </p>
        </div>

        {/* Facility Selector — Scrollable Pills */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-center flex-wrap">
            {facilities.map((f, i) => {
              const c = FACILITY_COLORS[i % FACILITY_COLORS.length];
              const isActive = f.id === selectedFacilityId;
              return (
                <button
                  key={f.id}
                  onClick={() => { setSelectedFacilityId(f.id); setSelectedDate(null); }}
                  className={`
                    flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
                    ${isActive
                      ? `${c.bg} text-white shadow-lg ring-4 ${c.ring} border-transparent scale-105`
                      : `bg-white ${c.text} ${c.border} hover:${c.light} hover:shadow-md`
                    }
                  `}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar + Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Calendar Header */}
            <div className={`${color.bg} px-6 py-4 flex items-center justify-between`}>
              <button 
                onClick={handlePrevMonth}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <h3 className="text-white font-bold text-lg">
                  {MONTH_NAMES[month]} {year}
                </h3>
                {selectedFacility && (
                  <p className="text-white/80 text-xs font-medium flex items-center justify-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {selectedFacility.name}
                  </p>
                )}
              </div>
              <button 
                onClick={handleNextMonth}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4 sm:p-6">
              {loadingBookings ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-400 text-sm">Memuat jadwal...</span>
                </div>
              ) : (
                <>
                  {/* Day Names */}
                  <div className="grid grid-cols-7 mb-3">
                    {DAY_NAMES.map(day => (
                      <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day Cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty slots */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Day numbers */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayBookings = bookingsByDate[key] || [];
                      const hasBookings = dayBookings.length > 0;
                      const isSelected = selectedDate === key;
                      const today = new Date();
                      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                      const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateClick(day)}
                          className={`
                            aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 text-sm group
                            ${isSelected
                              ? `${color.bg} text-white shadow-lg ring-4 ${color.ring} scale-105`
                              : isToday
                                ? `border-2 border-ipb-blue text-ipb-blue font-bold bg-blue-50/50`
                                : isPast
                                  ? 'text-slate-300'
                                  : 'text-slate-700 hover:bg-slate-50'
                            }
                            ${hasBookings && !isSelected ? 'font-semibold' : ''}
                          `}
                        >
                          <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{day}</span>
                          {hasBookings && (
                            <div className="flex gap-0.5 mt-0.5">
                              {dayBookings.slice(0, 3).map((_, idx) => (
                                <div 
                                  key={idx} 
                                  className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : color.dot}`}
                                />
                              ))}
                              {dayBookings.length > 3 && (
                                <span className={`text-[8px] ${isSelected ? 'text-white/80' : color.text} font-bold`}>+</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Legend */}
            <div className="px-6 pb-4 flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${color.dot}`} />
                <span>Ada peminjaman</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full border-2 border-ipb-blue" />
                <span>Hari ini</span>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {selectedDate 
                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Pilih Tanggal'
                  }
                </h4>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {!selectedDate ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-sm text-slate-400">Klik tanggal pada kalender untuk melihat detail peminjaman.</p>
                  </div>
                ) : selectedDateBookings.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-sm font-semibold text-green-600">Tidak ada peminjaman</p>
                    <p className="text-xs text-slate-400 mt-1">Fasilitas tersedia pada tanggal ini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedDateBookings.map((b, i) => (
                      <div
                        key={b.id}
                        className={`p-4 hover:bg-slate-50 transition-colors animate-fade-in`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 h-8 w-8 rounded-lg ${color.light} flex items-center justify-center flex-shrink-0`}>
                            <Clock className={`h-4 w-4 ${color.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{b.eventName}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color.text} ${color.light} px-2 py-0.5 rounded-full`}>
                                <Clock className="h-3 w-3" />
                                {formatTime(b.startTime)} – {formatTime(b.endTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                              <Users className="h-3 w-3" />
                              <span>{b.attendees} peserta</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedDateBookings.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                  <span className="text-xs font-bold text-slate-500">
                    {selectedDateBookings.length} peminjaman pada hari ini
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
