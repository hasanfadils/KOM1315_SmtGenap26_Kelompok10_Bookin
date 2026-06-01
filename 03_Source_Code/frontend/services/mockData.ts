import { Facility, FacilityType, FacilityStatus } from '../types';

export const FACILITIES: Facility[] = [
  {
    id: 'f1',
    name: 'Graha Widya Wisuda (GWW)',
    type: FacilityType.AUDITORIUM,
    status: FacilityStatus.AVAILABLE,
    capacity: 3000,
    location: 'Kampus Dramaga',
    description: 'Gedung serbaguna utama untuk wisuda dan acara besar universitas.',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    features: ['Stage', 'Sound System High End', 'AC Central', 'VVIP Room']
  },
  {
    id: 'f2',
    name: 'Auditorium Toyib Hadiwijaya',
    type: FacilityType.AUDITORIUM,
    status: FacilityStatus.MAINTENANCE,
    capacity: 400,
    location: 'Fakultas Pertanian, Dramaga',
    description: 'Auditorium medium cocok untuk seminar nasional dan kuliah umum.',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    features: ['Projector', 'AC', 'Sound System']
  },
  {
    id: 'f3',
    name: 'RK. U1.01 (Common Class)',
    type: FacilityType.CLASSROOM,
    status: FacilityStatus.AVAILABLE,
    capacity: 60,
    location: 'Gedung Teaching Lab',
    description: 'Ruang kelas modern dengan fasilitas multimedia lengkap.',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    features: ['Smart Board', 'AC', 'WiFi']
  },
  {
    id: 'f4',
    name: 'Gymnasium IPB',
    type: FacilityType.FIELD,
    status: FacilityStatus.RENOVATION,
    capacity: 1000,
    location: 'Kampus Dramaga',
    description: 'Gelanggang olahraga indoor untuk basket, voli, dan badminton.',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    features: ['Tribun', 'Lighting Standard', 'Locker Room']
  },
  {
    id: 'f5',
    name: 'IPB International Convention Center (IICC)',
    type: FacilityType.MEETING_ROOM,
    status: FacilityStatus.AVAILABLE,
    capacity: 200,
    location: 'Botani Square',
    description: 'Ruang meeting eksklusif di jantung kota Bogor.',
    imageUrl: 'https://picsum.photos/800/600?random=5',
    features: ['Catering', 'Video Conference', 'Lounge']
  },
  {
    id: 'f6',
    name: 'Ruang Sidang Senat',
    type: FacilityType.MEETING_ROOM,
    status: FacilityStatus.AVAILABLE,
    capacity: 50,
    location: 'Gedung Rektorat Andi Hakim Nasoetion',
    description: 'Ruang rapat formal untuk pimpinan universitas.',
    imageUrl: 'https://picsum.photos/800/600?random=6',
    features: ['Round Table', 'Mic Delegate', 'AC']
  }
];