import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { UserProfile, Order, AppNotification, Worker, ReviewItem } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Recursively cleans out any `undefined` properties before sending payloads to Firestore
 * to prevent the error: "Unsupported field value: undefined".
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = cleanForFirestore(value);
      }
    }
    return result as T;
  }
  return obj;
}

// Auth Functions
export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.warn('Firebase Google Sign-In popup notice:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// User Profile Firestore operations
export async function syncUserProfile(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    const cleanedPayload = cleanForFirestore({
      ...user,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userRef, cleanedPayload, { merge: true });
  } catch (err) {
    console.error('Failed to sync user to Firestore:', err);
  }
}

export const saveUserProfileToFirestore = syncUserProfile;

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.error('Error fetching user from Firestore:', err);
  }
  return null;
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (err) {
    console.error('Error fetching all users from Firestore:', err);
    return [];
  }
}

export const fetchUsersFromFirestore = fetchAllUsers;

// Orders Firestore operations
export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', order.id);
    const cleanedPayload = cleanForFirestore({
      ...order,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(orderRef, cleanedPayload, { merge: true });
  } catch (err) {
    console.error('Error saving order to Firestore:', err);
  }
}

export async function fetchAllOrdersFromFirestore(): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const snap = await getDocs(ordersCol);
    return snap.docs.map(d => d.data() as Order);
  } catch (err) {
    console.error('Error fetching orders from Firestore:', err);
    return [];
  }
}

export const fetchOrdersFromFirestore = fetchAllOrdersFromFirestore;

export async function updateOrderStatusInFirestore(
  orderId: string, 
  status: Order['status'], 
  assignedWorker?: Worker
): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (assignedWorker) {
      updateData.assignedWorker = assignedWorker;
    }
    const cleanedPayload = cleanForFirestore(updateData);
    await updateDoc(orderRef, cleanedPayload as Record<string, unknown>);
  } catch (err) {
    console.error('Error updating order in Firestore:', err);
  }
}

export async function updateOrderRatingInFirestore(
  orderId: string, 
  rating: number, 
  comment: string, 
  workerRating?: number
): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: Record<string, unknown> = {
      rating,
      workerRating: workerRating || rating,
      reviewComment: comment,
      ratedAt: new Date().toISOString(),
    };
    const cleanedPayload = cleanForFirestore(updateData);
    await updateDoc(orderRef, cleanedPayload as Record<string, unknown>);
  } catch (err) {
    console.error('Error updating order rating in Firestore:', err);
  }
}

// Notifications Firestore operations
export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  try {
    const notifRef = doc(db, 'notifications', notif.id);
    const cleanedPayload = cleanForFirestore({
      ...notif,
      createdAt: new Date().toISOString(),
    });
    await setDoc(notifRef, cleanedPayload, { merge: true });
  } catch (err) {
    console.error('Error saving notification to Firestore:', err);
  }
}

export async function fetchNotificationsFromFirestore(): Promise<AppNotification[]> {
  try {
    const notifsCol = collection(db, 'notifications');
    const snap = await getDocs(notifsCol);
    return snap.docs.map(d => d.data() as AppNotification);
  } catch (err) {
    console.error('Error fetching notifications from Firestore:', err);
    return [];
  }
}
