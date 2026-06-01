import { Facility, ServiceResponse, FacilityStatus } from '../types';
import { api } from './api';

export class FacilityService {
  static async getAllFacilities(): Promise<ServiceResponse<Facility[]>> {
    try {
      const data = await api.get<any[]>('/facilities');
      return { success: true, data: data.map(_mapFacility) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mengambil data fasilitas' };
    }
  }

  static async getFacilityById(id: string): Promise<Facility | undefined> {
    try {
      const raw = await api.get<any>(`/facilities/${id}`);
      return _mapFacility(raw);
    } catch {
      return undefined;
    }
  }

  static async createFacility(data: Omit<Facility, 'id'>): Promise<ServiceResponse<Facility>> {
    try {
      // Map camelCase frontend ke snake_case backend
      const payload = {
        name: data.name,
        type: data.type,
        status: data.status || FacilityStatus.AVAILABLE,
        capacity: data.capacity,
        location: data.location,
        description: data.description,
        image_url: data.imageUrl,
        features: data.features,
      };
      const result = await api.post<Facility>('/facilities', payload);
      return { success: true, data: _mapFacility(result) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal membuat fasilitas' };
    }
  }

  static async updateFacility(id: string, updatedData: Partial<Facility>): Promise<ServiceResponse<Facility>> {
    try {
      const payload: Record<string, unknown> = { ...updatedData };
      if ('imageUrl' in updatedData) {
        payload['image_url'] = updatedData.imageUrl;
        delete payload['imageUrl'];
      }
      const result = await api.put<Facility>(`/facilities/${id}`, payload);
      return { success: true, data: _mapFacility(result) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal memperbarui fasilitas' };
    }
  }

  static async deleteFacility(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await api.del(`/facilities/${id}`);
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal menghapus fasilitas' };
    }
  }

  static async uploadImage(file: File): Promise<ServiceResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.postForm<{ url: string }>('/facilities/upload-image', formData);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mengunggah foto fasilitas' };
    }
  }
}

// Helper: map snake_case dari backend ke camelCase Facility interface
function _mapFacility(raw: any): Facility {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    status: raw.status,
    capacity: raw.capacity,
    location: raw.location,
    description: raw.description,
    imageUrl: raw.image_url ?? raw.imageUrl,
    features: raw.features,
  };
}
