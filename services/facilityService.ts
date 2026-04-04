import { Facility, ServiceResponse, FacilityStatus } from '../types';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

export class FacilityService {
  static async getAllFacilities(): Promise<ServiceResponse<Facility[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, 'facilities'));
      const facilities: Facility[] = [];
      querySnapshot.forEach((doc) => {
        facilities.push({ id: doc.id, ...doc.data() } as Facility);
      });
      return { success: true, data: facilities };
    } catch (error: any) {
      console.error("Error fetching facilities:", error);
      return { success: false, error: error.message || "Gagal mengambil data fasilitas" };
    }
  }

  static async getFacilityById(id: string): Promise<Facility | undefined> {
    try {
      const docRef = doc(db, 'facilities', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Facility;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching facility by id:", error);
      return undefined;
    }
  }

  static async createFacility(data: Omit<Facility, 'id'>): Promise<ServiceResponse<Facility>> {
    try {
      const docRef = await addDoc(collection(db, 'facilities'), {
        ...data,
        status: data.status || FacilityStatus.AVAILABLE
      });
      return { success: true, data: { id: docRef.id, ...data, status: data.status || FacilityStatus.AVAILABLE } as Facility };
    } catch (error: any) {
      console.error("Error creating facility:", error);
      return { success: false, error: error.message || "Gagal membuat fasilitas" };
    }
  }

  static async updateFacility(id: string, updatedData: Partial<Facility>): Promise<ServiceResponse<Facility>> {
    try {
      const docRef = doc(db, 'facilities', id);
      await updateDoc(docRef, updatedData);
      
      const updatedDoc = await getDoc(docRef);
      return { success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } as Facility };
    } catch (error: any) {
      console.error("Error updating facility:", error);
      return { success: false, error: error.message || "Gagal memperbarui fasilitas" };
    }
  }

  static async deleteFacility(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await deleteDoc(doc(db, 'facilities', id));
      return { success: true, data: true };
    } catch (error: any) {
      console.error("Error deleting facility:", error);
      return { success: false, error: error.message || "Gagal menghapus fasilitas" };
    }
  }
}
