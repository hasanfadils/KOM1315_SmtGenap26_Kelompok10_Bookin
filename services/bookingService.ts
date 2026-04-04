import { Booking, BookingStatus, ServiceResponse, BookingRequestDTO, NotificationType, AnalyticsData } from '../types';
import { AuthService } from './authService';
import { NotificationService } from './notificationService';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

// Helper to convert File to Base64 (Simulating Cloud Upload)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- DOMAIN LAYER ---
class BookingDomain {
  static validateRequest(dto: BookingRequestDTO): { valid: boolean; error?: string; parsedData?: any } {
    const attendees = parseInt(dto.attendees.toString(), 10);
    
    if (isNaN(attendees) || attendees <= 0) {
      return { valid: false, error: "Jumlah peserta tidak valid." };
    }

    const startDateTime = new Date(`${dto.date}T${dto.startTime}:00`);
    const endDateTime = new Date(`${dto.date}T${dto.endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return { valid: false, error: "Format tanggal atau waktu salah." };
    }

    if (startDateTime >= endDateTime) {
      return { valid: false, error: "Waktu selesai harus setelah waktu mulai." };
    }

    if (startDateTime < new Date()) {
        return { valid: false, error: "Tidak dapat meminjam untuk waktu yang sudah lewat." };
    }

    return { 
        valid: true, 
        parsedData: { 
            startDateTime: startDateTime.toISOString(), 
            endDateTime: endDateTime.toISOString(),
            attendees
        } 
    };
  }

  static checkConflicts(facilityId: string, start: string, end: string, existingBookings: Booking[]): boolean {
    const startDate = new Date(start);
    const endDate = new Date(end);

    return existingBookings.some(b => 
      b.facilityId === facilityId &&
      b.status !== BookingStatus.REJECTED &&
      b.status !== BookingStatus.COMPLETED &&
      (
        (startDate >= new Date(b.startTime) && startDate < new Date(b.endTime)) ||
        (endDate > new Date(b.startTime) && endDate <= new Date(b.endTime))
      )
    );
  }

  static calculateQueueStatus(booking: Booking, allPending: Booking[]): Booking {
    if (booking.status !== BookingStatus.PENDING) return booking;

    const position = allPending.findIndex(pb => pb.id === booking.id) + 1;
    const processingTimePerItem = 30 * 60 * 1000; 
    const estimatedTime = new Date(Date.now() + (position * processingTimePerItem));
    
    return {
        ...booking,
        queuePosition: position,
        estimatedConfirmationDate: estimatedTime.toISOString()
    };
  }
}

// --- SERVICE LAYER ---
export class BookingService {
  
  static async createBooking(dto: BookingRequestDTO): Promise<ServiceResponse<Booking>> {
    try {
      const validation = BookingDomain.validateRequest(dto);
      if (!validation.valid) {
          return { success: false, error: validation.error };
      }

      const { startDateTime, endDateTime, attendees } = validation.parsedData;

      // Fetch existing bookings to check conflicts
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const existingBookings: Booking[] = [];
      bookingsSnapshot.forEach(doc => existingBookings.push({ id: doc.id, ...doc.data() } as Booking));

      const hasConflict = BookingDomain.checkConflicts(dto.facilityId, startDateTime, endDateTime, existingBookings);
      if (hasConflict) {
        return { success: false, error: "Fasilitas sudah dipesan pada jam tersebut." };
      }

      let documentUrl = undefined;
      if (dto.documentFile) {
          try {
              documentUrl = await fileToBase64(dto.documentFile);
          } catch (e) {
              console.error("File upload failed", e);
              return { success: false, error: "Gagal mengunggah dokumen." };
          }
      }

      // Fetch user name
      let userName = 'Unknown';
      try {
        const userDoc = await getDoc(doc(db, 'users', dto.userId));
        if (userDoc.exists()) {
          userName = userDoc.data().name;
        }
      } catch (e) {
        console.error("Failed to fetch user name", e);
      }

      const newBookingData = {
        facilityId: dto.facilityId,
        userId: dto.userId,
        userName: userName,
        eventName: dto.eventName,
        eventDescription: dto.eventDescription,
        startTime: startDateTime,
        endTime: endDateTime,
        attendees: attendees,
        status: BookingStatus.PENDING,
        documentUrl: documentUrl,
        createdAt: new Date().toISOString(),
        queuePosition: 0, 
        estimatedConfirmationDate: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'bookings'), newBookingData);
      const newBooking = { id: docRef.id, ...newBookingData } as Booking;

      return { success: true, data: newBooking };
    } catch (error: any) {
      console.error("Error creating booking:", error);
      return { success: false, error: error.message || "Gagal membuat peminjaman" };
    }
  }

  static async getUserBookings(userId: string): Promise<ServiceResponse<Booking[]>> {
    try {
      const q = query(collection(db, 'bookings'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      let userBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        userBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });

      // Fetch all pending bookings to calculate queue
      const pendingQ = query(collection(db, 'bookings'), where('status', '==', BookingStatus.PENDING));
      const pendingSnapshot = await getDocs(pendingQ);
      let pendingBookings: Booking[] = [];
      pendingSnapshot.forEach(doc => pendingBookings.push({ id: doc.id, ...doc.data() } as Booking));
      
      pendingBookings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      userBookings = userBookings
        .map(booking => BookingDomain.calculateQueueStatus(booking, pendingBookings))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return { success: true, data: userBookings };
    } catch (error: any) {
      console.error("Error fetching user bookings:", error);
      return { success: false, error: error.message || "Gagal mengambil data peminjaman" };
    }
  }

  static async getAllBookings(): Promise<ServiceResponse<Booking[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, 'bookings'));
      const allBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        allBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
      
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { success: true, data: allBookings };
    } catch (error: any) {
      console.error("Error fetching all bookings:", error);
      return { success: false, error: error.message || "Gagal mengambil data peminjaman" };
    }
  }

  static async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<ServiceResponse<Booking>> {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: "Booking tidak ditemukan" };
      }

      const oldBooking = { id: docSnap.id, ...docSnap.data() } as Booking;
      await updateDoc(docRef, { status });

      const updatedBooking = { ...oldBooking, status };

      if (oldBooking.status !== status) {
        const title = `Status Peminjaman Berubah: ${status}`;
        const message = `Status pengajuan peminjaman Anda untuk acara "${oldBooking.eventName}" telah diperbarui menjadi: ${status}.`;
        
        await NotificationService.createNotification(
          oldBooking.userId,
          title,
          message,
          NotificationType.BOOKING_STATUS,
          bookingId
        );
      }

      return { success: true, data: updatedBooking };
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      return { success: false, error: error.message || "Gagal memperbarui status peminjaman" };
    }
  }

  static async getAnalytics(): Promise<ServiceResponse<AnalyticsData>> {
    try {
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsStore: Booking[] = [];
      bookingsSnapshot.forEach(doc => bookingsStore.push({ id: doc.id, ...doc.data() } as Booking));

      const facilitiesSnapshot = await getDocs(collection(db, 'facilities'));
      const facilitiesMap: Record<string, string> = {};
      facilitiesSnapshot.forEach(doc => {
        facilitiesMap[doc.id] = doc.data().name;
      });

      const hoursMap = new Array(24).fill(0);
      bookingsStore.forEach(booking => {
          const date = new Date(booking.startTime);
          const hour = date.getHours();
          hoursMap[hour]++;
      });

      const busyHours = hoursMap.map((count, index) => ({
          hour: `${index.toString().padStart(2, '0')}:00`,
          count
      }));

      const facilityCount: Record<string, number> = {};
      bookingsStore.forEach(booking => {
          facilityCount[booking.facilityId] = (facilityCount[booking.facilityId] || 0) + 1;
      });

      const totalBookings = bookingsStore.length;
      const popularFacilities = Object.entries(facilityCount)
          .map(([id, count]) => {
              return {
                  name: facilitiesMap[id] || id,
                  count,
                  percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0
              };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

      const activeRequests = bookingsStore.filter(b => b.status === BookingStatus.PENDING).length;
      const approvedRequests = bookingsStore.filter(b => b.status === BookingStatus.APPROVED || b.status === BookingStatus.COMPLETED).length;
      const rejectedRequests = bookingsStore.filter(b => b.status === BookingStatus.REJECTED).length;
      const totalProcessed = approvedRequests + rejectedRequests;
      
      const approvalRate = totalProcessed > 0 ? Math.round((approvedRequests / totalProcessed) * 100) : 0;
      const cancellationRate = totalBookings > 0 ? Math.round((rejectedRequests / totalBookings) * 100) : 0;

      let totalEstimatedWaitMinutes = 0;
      const pendingBookings = bookingsStore.filter(b => b.status === BookingStatus.PENDING);
      
      if (pendingBookings.length > 0) {
          const waitTimes = pendingBookings.map((b, index) => {
              const baseReviewTime = 15;
              const queueFactor = (index + 1) * 5;
              const complexityFactor = Math.min(b.attendees / 50, 2) * 5;
              return baseReviewTime + queueFactor + complexityFactor;
          });
          
          totalEstimatedWaitMinutes = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
      } else {
          totalEstimatedWaitMinutes = 15;
      }

      return {
          success: true,
          data: {
              busyHours,
              popularFacilities,
              serviceHealth: {
                  activeRequests,
                  approvalRate,
                  averageWaitTimeMinutes: Math.round(totalEstimatedWaitMinutes),
                  cancellationRate
              }
          }
      };
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      return { success: false, error: error.message || "Gagal mengambil data analitik" };
    }
  }
}
