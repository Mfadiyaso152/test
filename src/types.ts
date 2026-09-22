export type TabType = 'home' | 'map' | 'orders' | 'account' | 'provider_orders' | 'provider_workers' | 'provider_settings';

export type UserRole = 'client' | 'provider';

export type PaymentMethodType = 
  | 'visa' 
  | 'mastercard' 
  | 'apple_pay' 
  | 'google_pay' 
  | 'tabby' 
  | 'tamara';

export interface Worker {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  completedJobs: number;
  isAvailable: boolean;
  avatar?: string;
  nationalId?: string;
  createdAt?: string;
}

export interface ReviewItem {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  workerName?: string;
  serviceTitle: string;
}

export interface BankDetails {
  bankName: string; // e.g., مصرف الراجحي، البنك الأهلي السعودي، بنك الإنماء
  accountHolderName: string; // اسم صاحب الحساب
  iban: string; // SA...
}

export interface ProviderDetails {
  crNumber: string; // رقم السجل التجاري أو وثيقة العمل الحر
  crVerified: boolean;
  businessName: string; // اسم المنشأة / المؤسسة
  specialty: string;
  city: string;
  district: string;
  address?: string;
  lat: number;
  lng: number;
  coverageRadiusKm: number;
  isAvailableForOrders: boolean;
  bankDetails?: BankDetails;
  workers: Worker[];
  reviews: ReviewItem[];
  verificationStatus?: 'approved' | 'pending' | 'rejected';
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  district?: string;
  address?: string;
  birthDate?: string; // تاريخ الميلاد للعميل
  avatar?: string;
  role: UserRole;
  balance?: number;
  completedOrdersCount?: number;
  rating?: number;
  isProfileComplete?: boolean;
  isBanned?: boolean;
  providerDetails?: ProviderDetails;
  createdAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscount: number;
  isActive: boolean;
  usageCount: number;
  expiryDate: string;
}

export interface Complaint {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  providerName: string;
  issue: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  solutionNotes?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  priceStart: number;
  color: string;
}

export type OrderStatus = 
  | 'received' 
  | 'assigned' 
  | 'on_the_way' 
  | 'arrived' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  serviceTitle: string;
  category: string;
  client: {
    name: string;
    phone: string;
    address: string;
  };
  status: OrderStatus;
  createdAt: string;
  scheduledDate: string;
  price: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'paid' | 'pending' | 'installments';
  installmentDetails?: {
    provider: 'tabby' | 'tamara';
    monthlyAmount: number;
    installmentsCount: number;
  };
  notes?: string;
  location: {
    lat: number;
    lng: number;
    addressName: string;
  };
  assignedWorker?: Worker;
  providerId?: string;
  providerName?: string;
  rating?: number;
  workerRating?: number;
  reviewComment?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'worker_arrived' | 'worker_on_the_way' | 'order_accepted' | 'order_completed' | 'new_order' | 'info';
  orderId?: string;
}
