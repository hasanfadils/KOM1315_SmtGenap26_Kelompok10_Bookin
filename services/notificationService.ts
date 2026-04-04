import { Notification, NotificationType, ServiceResponse } from '../types';
import { toast } from 'sonner';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';

export class NotificationService {
  
  static async createNotification(userId: string, title: string, message: string, type: NotificationType, relatedId?: string): Promise<ServiceResponse<Notification>> {
    try {
      const newNotificationData = {
        userId,
        title,
        message,
        type,
        relatedId: relatedId || null,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'notifications'), newNotificationData);
      const newNotification = { id: docRef.id, ...newNotificationData } as Notification;

      // Trigger Toast (if user is online - simulated by just calling it)
      toast.info(title, {
        description: message,
        duration: 5000,
      });

      // Simulate Email Notification
      this.simulateEmail(userId, title, message);

      return { success: true, data: newNotification };
    } catch (error: any) {
      console.error("Error creating notification:", error);
      return { success: false, error: error.message || "Gagal membuat notifikasi" };
    }
  }

  static async getUserNotifications(userId: string): Promise<ServiceResponse<Notification[]>> {
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const userNotifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        userNotifications.push({ id: doc.id, ...doc.data() } as Notification);
      });
      
      userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return { success: true, data: userNotifications };
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      return { success: false, error: error.message || "Gagal mengambil notifikasi" };
    }
  }

  static async markAsRead(notificationId: string): Promise<ServiceResponse<void>> {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { isRead: true });
      return { success: true };
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message || "Gagal menandai notifikasi" };
    }
  }

  static async markAllAsRead(userId: string): Promise<ServiceResponse<void>> {
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(document => 
        updateDoc(doc(db, 'notifications', document.id), { isRead: true })
      );
      
      await Promise.all(updatePromises);
      return { success: true };
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message || "Gagal menandai semua notifikasi" };
    }
  }

  private static simulateEmail(userId: string, title: string, message: string) {
    console.log(`%c[SIMULATED EMAIL] To User: ${userId}`, 'color: #004e92; font-weight: bold;');
    console.log(`Subject: ${title}`);
    console.log(`Body: ${message}`);
    console.log('-----------------------------------');
  }
}
