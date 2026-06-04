import { Booking, LaporanResponse, ServiceResponse, DokumenItem } from '../types';
import { api } from './api';

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

export interface LaporanFilter {
  status?: string;
  startDate?: string;
  endDate?: string;
  ruanganId?: string;
}

export class LaporanService {
  static async generate(filters: LaporanFilter): Promise<ServiceResponse<LaporanResponse>> {
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.ruanganId) params.ruangan_id = filters.ruanganId;

      const queryString = new URLSearchParams(params).toString();
      const raw = await api.get<any>(`/laporan/generate${queryString ? `?${queryString}` : ''}`);

      const data_peminjaman = (raw.data_peminjaman || []).map(_mapBooking);
      const ringkasan = raw.ringkasan || {};

      return {
        success: true,
        data: {
          data_peminjaman,
          ringkasan,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Gagal menghasilkan laporan rekapitulasi',
      };
    }
  }
}
