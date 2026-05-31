import { Booking, BookingStatus, ServiceResponse, BookingRequestDTO, AnalyticsData, DokumenItem } from '../types';
import { api } from './api';

// ===========================
// MAPPER HELPERS
// ===========================

function _mapBooking(raw: any): Booking {
  return {
    id: raw.id,
    facilityId: raw.ruangan_id,
    userId: raw.user_id,
    userName: raw.user_name,
    eventName: raw.event_name,
    eventDescription: raw.event_description,
    startTime: raw.start_time,
    endTime: raw.end_time,
    status: raw.status,
    attendees: raw.attendees,
    dokumenList: raw.dokumen_list?.map((d: any): DokumenItem => ({
      id: d.id,
      pengajuanId: d.pengajuan_id,
      filename: d.filename,
      fileUrl: d.file_url,
      fileType: d.file_type,
      fileSize: d.file_size,
      uploadedAt: d.uploaded_at,
    })),
    createdAt: raw.created_at,
    queuePosition: raw.queue_position,
    rejectionReason: raw.rejection_reason,
    verifiedBy: raw.verified_by,
    verifiedAt: raw.verified_at,
    approvedBy: raw.approved_by,
    approvedAt: raw.approved_at,
  };
}

function _mapAnalytics(raw: any): AnalyticsData {
  return {
    busyHours: raw.busy_hours,
    popularFacilities: raw.popular_facilities.map((f: any) => ({
      name: f.name,
      count: f.count,
      percentage: f.percentage,
    })),
    serviceHealth: {
      activeRequests: raw.service_health.active_requests,
      approvalRate: raw.service_health.approval_rate,
      averageWaitTimeMinutes: raw.service_health.average_wait_time_minutes,
      cancellationRate: raw.service_health.cancellation_rate,
    },
  };
}

// ===========================
// BOOKING SERVICE
// ===========================

export class BookingService {

  static async createBooking(dto: BookingRequestDTO): Promise<ServiceResponse<Booking>> {
    try {
      const formData = new FormData();
      formData.append('facility_id', dto.facilityId);
      formData.append('event_name', dto.eventName);
      formData.append('event_description', dto.eventDescription);
      formData.append('date', dto.date);
      formData.append('start_time', dto.startTime);
      formData.append('end_time', dto.endTime);
      formData.append('attendees', String(Math.round(Number(dto.attendees))));
      if (dto.documentFile) {
        formData.append('document', dto.documentFile);
      }

      const raw = await api.postForm<any>('/bookings', formData);
      return { success: true, data: _mapBooking(raw) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal membuat peminjaman' };
    }
  }

  static async getUserBookings(userId: string): Promise<ServiceResponse<Booking[]>> {
    try {
      const raw = await api.get<any[]>('/bookings/me');
      return { success: true, data: raw.map(_mapBooking) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mengambil data peminjaman' };
    }
  }

  static async getPublicBookings(facilityId?: string): Promise<ServiceResponse<Booking[]>> {
    try {
      const query = facilityId ? `?facility_id=${facilityId}` : '';
      const raw = await api.get<any[]>(`/bookings/public${query}`);
      return { success: true, data: raw.map(_mapBooking) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mengambil data jadwal' };
    }
  }

  static async getAllBookings(): Promise<ServiceResponse<Booking[]>> {
    try {
      const raw = await api.get<any[]>('/bookings');
      return { success: true, data: raw.map(_mapBooking) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mengambil data peminjaman' };
    }
  }

  static async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<ServiceResponse<Booking>> {
    try {
      const raw = await api.put<any>(`/bookings/${bookingId}/status`, { status });
      return { success: true, data: _mapBooking(raw) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal memperbarui status peminjaman' };
    }
  }

  static async getAnalytics(): Promise<ServiceResponse<AnalyticsData>> {
    try {
      const raw = await api.get<any>('/analytics');
      return { success: true, data: _mapAnalytics(raw) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mengambil data analitik' };
    }
  }

  static async deleteBooking(bookingId: string): Promise<ServiceResponse<boolean>> {
    try {
      await api.del(`/bookings/${bookingId}`);
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal menghapus pengajuan' };
    }
  }
}
