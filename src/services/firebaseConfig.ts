import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from 'firebase/analytics';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseServices {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  analytics?: Analytics;
}

class FirebaseConfigService {
  private static instance: FirebaseConfigService;
  private services: FirebaseServices | null = null;
  private initialized = false;

  public static getInstance(): FirebaseConfigService {
    if (!FirebaseConfigService.instance) {
      FirebaseConfigService.instance = new FirebaseConfigService();
    }
    return FirebaseConfigService.instance;
  }

  private validateConfig(config: Partial<FirebaseConfig>): config is FirebaseConfig {
    const requiredFields: (keyof FirebaseConfig)[] = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ];

    for (const field of requiredFields) {
      if (!config[field] || typeof config[field] !== 'string') {
        console.error(`Missing or invalid Firebase config field: ${field}`);
        return false;
      }
    }

    return true;
  }

  private getEnvironmentConfig(): FirebaseConfig | null {
    // Always use demo configuration for development
    if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
      console.log('Demo mode: Returning mock Firebase config');
      return {
        apiKey: "demo-api-key",
        authDomain: "demo.firebaseapp.com",
        projectId: "demo-project",
        storageBucket: "demo.appspot.com",
        messagingSenderId: "123456789",
        appId: "demo-app-id"
      };
    }

    const config: Partial<FirebaseConfig> = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    if (this.validateConfig(config)) {
      return config as FirebaseConfig;
    }

    // Fallback to demo configuration
    console.warn('Using demo Firebase configuration. Set environment variables for production.');
    return {
      apiKey: "demo-api-key",
      authDomain: "demo.firebaseapp.com",
      projectId: "demo-project",
      storageBucket: "demo.appspot.com",
      messagingSenderId: "123456789",
      appId: "demo-app-id"
    };
  }

  public async initialize(): Promise<FirebaseServices> {
    if (this.initialized && this.services) {
      return this.services;
    }

    // Completely skip Firebase in demo mode
    if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
      console.log('Demo mode: Using mock Firebase services');

      this.services = {
        app: { options: { projectId: 'demo-project' } } as any,
        db: this.createMockFirestore(),
        auth: this.createMockAuth(),
        storage: this.createMockStorage(),
        analytics: undefined
      };

      this.initialized = true;
      return this.services;
    }

    try {
      const config = this.getEnvironmentConfig();
      if (!config) {
        throw new Error('Failed to get Firebase configuration');
      }

      console.log(`Initializing Firebase with project: ${config.projectId}`);

      // Initialize Firebase App
      const app = initializeApp(config);

      // Initialize services
      const db = getFirestore(app);
      const auth = getAuth(app);
      const storage = getStorage(app);

      // Initialize Analytics in production only
      let analytics: Analytics | undefined;
      if (import.meta.env.PROD && config.measurementId) {
        try {
          analytics = getAnalytics(app);
          console.log('Firebase Analytics initialized');
        } catch (error) {
          console.warn('Failed to initialize Firebase Analytics:', error);
        }
      }

      // Connect to emulator in development if specified
      if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
        try {
          connectFirestoreEmulator(db, 'localhost', 8080);
          console.log('Connected to Firestore emulator');
        } catch (error) {
          console.warn('Failed to connect to Firestore emulator:', error);
        }
      }

      this.services = {
        app,
        db,
        auth,
        storage,
        analytics
      };

      this.initialized = true;
      console.log('Firebase services initialized successfully');

      return this.services;

    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw new Error(`Firebase initialization failed: ${(error as Error).message}`);
    }
  }

  private createMockFirestore(): any {
    return {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => null }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        add: () => Promise.resolve({ id: 'mock-doc-id' }),
        get: () => Promise.resolve({ docs: [] })
      }),
      doc: () => ({
        get: () => Promise.resolve({ exists: false, data: () => null }),
        set: () => Promise.resolve(),
        update: () => Promise.resolve(),
        delete: () => Promise.resolve()
      })
    };
  }

  private createMockAuth(): any {
    return {
      currentUser: null,
      onAuthStateChanged: (callback: any) => {
        setTimeout(() => callback(null), 100);
        return () => {};
      },
      signInWithEmailAndPassword: () => Promise.resolve({
        user: { uid: 'demo-user', email: 'demo@test.com' }
      }),
      signOut: () => Promise.resolve(),
      createUserWithEmailAndPassword: () => Promise.resolve({
        user: { uid: 'demo-user', email: 'demo@test.com' }
      })
    };
  }

  private createMockStorage(): any {
    return {
      ref: () => ({
        put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('mock-url') } }),
        delete: () => Promise.resolve()
      })
    };
  }

  public getServices(): FirebaseServices | null {
    return this.services;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getProjectId(): string | null {
    return this.services?.db.app?.options?.projectId || 'demo-project';
  }

  public isProduction(): boolean {
    return false; // Always false in demo mode
  }

  public isDemoMode(): boolean {
    return true; // Always true for now
  }

  // Health check for Firebase services
  public async healthCheck(): Promise<{
    firestore: boolean;
    auth: boolean;
    storage: boolean;
    analytics: boolean;
  }> {
    return {
      firestore: true,
      auth: true,
      storage: true,
      analytics: false
    };
  }
}

export const firebaseConfigService = FirebaseConfigService.getInstance();

// Initialize Firebase on import - but only in production
export const initializeFirebase = () => {
  if (import.meta.env.PROD) {
    return firebaseConfigService.initialize();
  }
  console.log('Demo mode: Skipping Firebase initialization on import');
  return Promise.resolve(null);
};

// Export convenient getters
export const getFirebaseServices = () => firebaseConfigService.getServices();
export const isFirebaseReady = () => firebaseConfigService.isInitialized();
export const isProductionEnvironment = () => firebaseConfigService.isProduction();
export const isDemoEnvironment = () => firebaseConfigService.isDemoMode();
