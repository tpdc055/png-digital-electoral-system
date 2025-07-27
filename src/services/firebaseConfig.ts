// PNG Digital Electoral System - Enhanced Firebase Configuration
// Production-grade configuration with security rules and offline support

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration for PNG Electoral System
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCd4YQFdeub4kwc4QKjIzuhVC-QALPhWCM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'png-citizen-registration-prod.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'png-citizen-registration-prod',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'png-citizen-registration-prod.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '29379902965',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:29379902965:web:e4582785c4100fd96d34bc',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-4NLJ0FVTBJ'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics if in production
let analytics = null;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics not available:', error);
  }
}
export { analytics };

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.warn('Firebase emulator connection failed:', error);
  }
}

// Export the app instance
export default app;
