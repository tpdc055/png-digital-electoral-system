// PNG Digital Electoral System - Firebase Service (Demo Mode)
// This file provides mock Firebase services for demo mode

// Check if we're in demo mode
const isDemoMode = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';

console.log('Firebase service loading...', { isDemoMode });

// Mock Firebase services for demo mode
const createMockApp = () => ({
  options: { projectId: 'demo-project' }
});

const createMockFirestore = () => ({
  collection: (path: string) => ({
    doc: (id?: string) => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: (data: any) => Promise.resolve(),
      update: (data: any) => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: (data: any) => Promise.resolve({ id: 'mock-doc-id' }),
    get: () => Promise.resolve({ docs: [] }),
    where: () => createMockFirestore().collection(path),
    orderBy: () => createMockFirestore().collection(path),
    limit: () => createMockFirestore().collection(path)
  }),
  doc: (path: string) => ({
    get: () => Promise.resolve({ exists: false, data: () => null }),
    set: (data: any) => Promise.resolve(),
    update: (data: any) => Promise.resolve(),
    delete: () => Promise.resolve()
  }),
  writeBatch: () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: () => Promise.resolve()
  }),
  serverTimestamp: () => new Date(),
  onSnapshot: () => () => {}
});

const createMockAuth = () => ({
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Don't call callback in demo mode to prevent auth state changes
    return () => {};
  },
  signInWithEmailAndPassword: () => Promise.resolve({
    user: { uid: 'demo-user', email: 'demo@test.com' }
  }),
  signOut: () => Promise.resolve(),
  createUserWithEmailAndPassword: () => Promise.resolve({
    user: { uid: 'demo-user', email: 'demo@test.com' }
  })
});

// Initialize services based on mode
const mockApp = createMockApp();
const mockDb = createMockFirestore();
const mockAuth = createMockAuth();

// Always export mock services for demo mode
console.log('Demo mode: Using mock Firebase services');

export const app = mockApp;
export const db = mockDb;
export const auth = mockAuth;

export const getApp = () => app;
export const getDb = () => db;
export const getAuth = () => auth;

export const initializeFirebase = () => {
  console.log('Demo mode: Firebase initialization skipped');
  return Promise.resolve({
    app,
    db,
    auth,
    storage: { ref: () => ({}) },
    analytics: undefined
  });
};
