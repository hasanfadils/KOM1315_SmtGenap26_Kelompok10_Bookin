import { Notification, NotificationType, ServiceResponse } from '../types';
import { api } from './api';

function _mapNotification(raw: any): Notification {
  return {
    id: raw.id,
    userId: raw.user_id,
    title: raw.title,
    message: raw.message,
    type: raw.type as NotificationType,
    relatedId: raw.related_id,
    isRead: raw.is_read,
    createdAt: raw.created_at,
  };
}

export class NotificationService {

  static async getUserNotifications(userId: string): Promise<ServiceResponse<Notification[]>> {
    try {
      const raw = await api.get<any[]>('/notifications/me');
      return { success: true, data: raw.map(_mapNotification) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mengambil notifikasi' };
    }
  }

  static async markAsRead(notificationId: string): Promise<ServiceResponse<void>> {
    try {
      await api.put(`/notifications/${notificationId}/read`, {});
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal menandai notifikasi' };
    }
  }

  static async markAllAsRead(userId: string): Promise<ServiceResponse<void>> {
    try {
      await api.put('/notifications/read-all', {});
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal menandai semua notifikasi' };
    }
  }

  // Notifikasi sekarang dibuat di backend saat status booking berubah
  // Method createNotification tidak perlu di frontend lagi
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    relatedId?: string
  ): Promise<ServiceResponse<Notification>> {
    console.warn('[NotificationService] createNotification sekarang otomatis dibuat di backend saat status booking berubah.');
    return { success: true };
  }
}
