
// Domain Entities

export enum FacilityType {
  AUDITORIUM = 'Auditorium',
  CLASSROOM = 'Ruang Kelas',
  FIELD = 'Lapangan',
  LABORATORY = 'Laboratorium',
  MEETING_ROOM = 'Ruang Rapat'
}

export enum FacilityStatus {
  AVAILABLE = 'Tersedia',
  MAINTENANCE = 'Pemeliharaan',
  RENOVATION = 'Renovasi',
  CLOSED = 'Ditutup Sementara'
}

export enum BookingStatus {
  PENDING = 'Menunggu Persetujuan',
  IN_REVIEW = 'Sedang Direview',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak',
  COMPLETED = 'Selesai'
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  status: FacilityStatus; // New field for operational status
  capacity: number;
  location: string; // e.g., "Kampus Dramaga", "Kampus Baranangsiang"
  description: string;
  imageUrl: string;
  features: string[]; // e.g., ["Projector", "AC", "Sound System"]
}

export interface User {
  id: string;
  name: string;
  nim?: string; // Optional for admin/staff
  role: 'student' | 'staff' | 'admin';
  email: string;
  managed_ruangan_ids?: string[]; // Ruangan yang dikelola (Tendik/Admin)
  // Password is deliberately excluded from the interface used in the frontend UI for security
}

export interface DokumenItem {
  id: string;
  pengajuanId: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Booking {
  id: string;
  facilityId: string;   // mapped from backend ruangan_id
  userId: string;
  userName?: string;
  eventName: string;
  eventDescription: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  status: BookingStatus;
  attendees: number;
  dokumenList?: DokumenItem[];
  createdAt: string;

  // Queue Transparency
  queuePosition?: number;

  // Audit trail (dari backend PengajuanOut)
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

// DTO for Form Submission (Separates UI from Domain)
export interface BookingRequestDTO {
  facilityId: string;
  userId: string;
  eventName: string;
  eventDescription: string;
  date: string;       // Raw date string from input
  startTime: string;  // Raw time string from input
  endTime: string;    // Raw time string from input
  attendees: string | number; // Raw input
  documentFile?: File; // Added file object
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AISearchResult {
  recommendedFacilityIds: string[];
  reasoning: string;
}

export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

export interface AnalyticsData {
  busyHours: { hour: string; count: number }[];
  popularFacilities: { name: string; count: number; percentage: number }[];
  serviceHealth: {
    activeRequests: number;
    approvalRate: number;
    averageWaitTimeMinutes: number;
    cancellationRate: number;
  };
}

export enum NotificationType {
  BOOKING_STATUS = 'BOOKING_STATUS',
  VERIFICATION = 'VERIFICATION',
  SYSTEM = 'SYSTEM'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string; // e.g., bookingId
  isRead: boolean;
  createdAt: string;
}
