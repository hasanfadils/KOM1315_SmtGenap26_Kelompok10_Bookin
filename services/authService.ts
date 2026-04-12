import { User, ServiceResponse } from '../types';
import { api } from './api';

export class AuthService {
  static async updateProfile(id: string, updates: Partial<User>): Promise<ServiceResponse<User>> {
    try {
      const data = await api.put<User>(`/users/${id}`, updates);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal memperbarui profil' };
    }
  }

  static async getUserById(id: string): Promise<User | undefined> {
    try {
      return await api.get<User>(`/users/${id}`);
    } catch {
      return undefined;
    }
  }

  static async getAllUsers(): Promise<ServiceResponse<User[]>> {
    try {
      const data = await api.get<User[]>('/users');
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mengambil data pengguna' };
    }
  }

  static async deleteUser(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await api.del(`/users/${id}`);
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal menghapus pengguna' };
    }
  }
}
