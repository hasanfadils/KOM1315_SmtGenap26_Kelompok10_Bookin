import { User, ServiceResponse } from '../types';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export class AuthService {
  
  static async updateProfile(id: string, updates: Partial<User>): Promise<ServiceResponse<User>> {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, updates);
      
      const updatedDoc = await getDoc(docRef);
      return { success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } as User };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message || "Gagal memperbarui profil" };
    }
  }

  static async getUserById(id: string): Promise<User | undefined> {
    try {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching user by id:", error);
      return undefined;
    }
  }

  static async getAllUsers(): Promise<ServiceResponse<User[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });
      return { success: true, data: users };
    } catch (error: any) {
      console.error("Error fetching all users:", error);
      return { success: false, error: error.message || "Gagal mengambil data pengguna" };
    }
  }

  static async deleteUser(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await deleteDoc(doc(db, 'users', id));
      return { success: true, data: true };
    } catch (error: any) {
      console.error("Error deleting user:", error);
      return { success: false, error: error.message || "Gagal menghapus pengguna" };
    }
  }
}
