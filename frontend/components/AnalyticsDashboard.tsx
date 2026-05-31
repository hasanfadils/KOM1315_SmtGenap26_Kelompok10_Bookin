import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, Activity, Clock, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { BookingService } from '../services/bookingService';
import { AnalyticsData } from '../types';

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await BookingService.getAnalytics();
        if (response.success && response.data) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Realtime update every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ipb-blue"></div>
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#004e92', '#002d72', '#f59e0b', '#10b981', '#64748b'];

  return (
    <div className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Dashboard Analitik Cerdas</h2>
          <p className="text-slate-500 text-lg">
            Keputusan berbasis data untuk efisiensi pemanfaatan aset universitas.
            <span className="block text-xs mt-2 text-emerald-600 font-medium flex items-center justify-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Update Realtime
            </span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Analitik Jam Sibuk */}
            <div className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Analitik Jam Sibuk</h3>
                        <p className="text-slate-500 text-xs">Distribusi waktu peminjaman</p>
                    </div>
                </div>
                
                <div className="h-48 w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.busyHours}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#004e92" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#004e92" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="hour" 
                                tick={{fontSize: 10}} 
                                interval={3} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                itemStyle={{color: '#004e92', fontWeight: 'bold'}}
                            />
                            <Area type="monotone" dataKey="count" stroke="#004e92" fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="h-3 w-3 text-ipb-accent" />
                    <span>Jam tersibuk: <strong>09:00 - 14:00</strong></span>
                </div>
            </div>

            {/* Card 2: Fasilitas Paling Diminati */}
            <div className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-ipb-accent rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Fasilitas Populer</h3>
                        <p className="text-slate-500 text-xs">Top 5 fasilitas paling sering dipinjam</p>
                    </div>
                </div>
                
                <div className="space-y-4 mt-auto">
                    {data.popularFacilities.map((facility, index) => (
                        <div key={index} className="relative">
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5 z-10 relative">
                                <span className="truncate max-w-[70%]">{index + 1}. {facility.name}</span>
                                <span className="text-ipb-blue">{facility.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-ipb-blue h-2 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${facility.percentage}%`, opacity: 1 - (index * 0.15) }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 3: Kesehatan Layanan */}
            <div className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Kesehatan Layanan</h3>
                        <p className="text-slate-500 text-xs">Metrik performa sistem & antrean</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-slate-400 mb-1"><Users className="h-4 w-4" /></div>
                        <div className="text-2xl font-bold text-slate-800">{data.serviceHealth.activeRequests}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Antrean Aktif</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-emerald-500 mb-1"><CheckCircle2 className="h-4 w-4" /></div>
                        <div className="text-2xl font-bold text-slate-800">{data.serviceHealth.approvalRate}%</div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Approval Rate</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm col-span-2 flex items-center justify-between">
                        <div>
                            <div className="text-ipb-blue mb-1"><Clock className="h-4 w-4" /></div>
                            <div className="text-3xl font-bold text-slate-800">{data.serviceHealth.averageWaitTimeMinutes}<span className="text-sm font-normal text-slate-400 ml-1">menit</span></div>
                            <div className="text-[10px] font-bold text-ipb-blue uppercase">Est. Waktu Tunggu</div>
                        </div>
                        <div className="text-right max-w-[50%]">
                            <p className="text-[9px] text-slate-400 leading-tight">
                                *Dihitung dari antrean saat ini + kompleksitas acara
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
