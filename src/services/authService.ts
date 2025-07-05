// PNG Digital Electoral System - Authentication Service
// Handles both Firebase production auth and demo mode authentication

import { PNG_PROVINCES } from '../types/citizen';

export type UserRole = 'admin' | 'enumerator' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  province: string;
  district?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  province: string;
  district?: string;
}

class AuthService {
  private static instance: AuthService;
  private authStateListeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    profile: null,
    loading: true,
    error: null
  };

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuthListener();
  }

  private async initializeAuthListener(): Promise<void> {
    try {
      console.log('Demo mode: Using mock authentication');
      this.updateAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to initialize auth listener:', error);
      this.updateAuthState({
        user: null,
        profile: null,
        loading: false,
        error: 'Authentication service initialization failed'
      });
    }
  }

  private updateAuthState(newState: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...newState };
    this.authStateListeners.forEach(listener => listener(this.currentState));
  }

  public onAuthStateChange(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.push(listener);
    listener(this.currentState);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  public async signIn(credentials: LoginCredentials): Promise<any> {
    try {
      this.updateAuthState({ loading: true, error: null });
      return await this.handleDemoLogin(credentials);
    } catch (error) {
      console.error('Sign in failed:', error);
      this.updateAuthState({
        loading: false,
        error: this.getAuthErrorMessage(error)
      });
      throw error;
    }
  }

  private async handleDemoLogin(credentials: LoginCredentials): Promise<any> {
    const demoUsers = {
      'admin@demo.png': {
        uid: 'demo-admin-123',
        email: 'admin@demo.png',
        password: 'demo123',
        profile: {
          uid: 'demo-admin-123',
          email: 'admin@demo.png',
          displayName: 'Demo Administrator',
          role: 'admin' as UserRole,
          province: 'All Provinces',
          permissions: ['read:all_citizens', 'write:all_citizens', 'delete:citizens', 'manage:users', 'manage:backups', 'view:statistics', 'export:data', 'manage:system'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      },
      'enumerator@demo.png': {
        uid: 'demo-enumerator-456',
        email: 'enumerator@demo.png',
        password: 'demo123',
        profile: {
          uid: 'demo-enumerator-456',
          email: 'enumerator@demo.png',
          displayName: 'Demo Field Enumerator',
          role: 'enumerator' as UserRole,
          province: 'National Capital District',
          district: 'Port Moresby',
          permissions: ['read:province_citizens', 'write:province_citizens', 'create:citizens', 'update:own_citizens', 'view:statistics', 'export:province_data'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      },
      'test@demo.png': {
        uid: 'demo-test-789',
        email: 'test@demo.png',
        password: 'test123',
        profile: {
          uid: 'demo-test-789',
          email: 'test@demo.png',
          displayName: 'Test User',
          role: 'viewer' as UserRole,
          province: 'Western Province',
          permissions: ['read:province_citizens', 'view:statistics'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      }
    };

    const demoUser = demoUsers[credentials.email as keyof typeof demoUsers];

    if (!demoUser || demoUser.password !== credentials.password) {
      throw new Error('Invalid demo credentials. Try: admin@demo.png/demo123 or enumerator@demo.png/demo123');
    }

    const mockUserCredential = {
      user: {
        uid: demoUser.uid,
        email: demoUser.email,
        displayName: demoUser.profile.displayName
      }
    };

    this.updateAuthState({
      user: mockUserCredential.user,
      profile: demoUser.profile,
      loading: false,
      error: null
    });

    console.log('Demo login successful:', demoUser.profile.displayName);
    return mockUserCredential;
  }

  public async signOut(): Promise<void> {
    try {
      console.log('Demo mode: Signing out');
      this.updateAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      this.updateAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null
      });
    }
  }

  public async registerUser(userData: RegisterUserData, createdBy?: string): Promise<any> {
    try {
      if (!this.canCreateUsers()) {
        throw new Error('Insufficient permissions to create user accounts');
      }

      console.log('Demo mode: Simulating user creation');
      const mockUserCredential = {
        user: {
          uid: `demo-${Date.now()}`,
          email: userData.email,
          displayName: userData.displayName
        }
      };
      return mockUserCredential;
    } catch (error) {
      console.error('User registration failed:', error);
      throw error;
    }
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      admin: [
        'read:all_citizens',
        'write:all_citizens',
        'delete:citizens',
        'manage:users',
        'manage:backups',
        'view:statistics',
        'export:data',
        'manage:system'
      ],
      enumerator: [
        'read:province_citizens',
        'write:province_citizens',
        'create:citizens',
        'update:own_citizens',
        'view:statistics',
        'export:province_data'
      ],
      viewer: [
        'read:province_citizens',
        'view:statistics'
      ]
    };

    return permissions[role] || [];
  }

  private getAuthErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    return 'Authentication failed. Please try again';
  }

  // Public getters for current auth state
  public getCurrentUser(): any | null {
    return this.currentState.user;
  }

  public getCurrentProfile(): UserProfile | null {
    return this.currentState.profile;
  }

  public isAuthenticated(): boolean {
    return this.currentState.user !== null;
  }

  public isLoading(): boolean {
    return this.currentState.loading;
  }

  public getError(): string | null {
    return this.currentState.error;
  }

  // Permission checking methods
  public hasRole(role: UserRole): boolean {
    return this.currentState.profile?.role === role;
  }

  public hasPermission(permission: string): boolean {
    return this.currentState.profile?.permissions.includes(permission) || false;
  }

  public canAccessProvince(province: string): boolean {
    const profile = this.currentState.profile;
    return profile?.role === 'admin' || profile?.province === province;
  }

  public canCreateUsers(): boolean {
    return this.hasRole('admin');
  }

  public canManageBackups(): boolean {
    return this.hasRole('admin');
  }

  public canDeleteCitizens(): boolean {
    return this.hasRole('admin');
  }

  public canExportData(): boolean {
    return this.hasPermission('export:data') || this.hasPermission('export:province_data');
  }

  // Utility methods
  public getAvailableProvinces(): string[] {
    const profile = this.currentState.profile;
    if (profile?.role === 'admin') {
      return [...PNG_PROVINCES];
    }
    return profile?.province ? [profile.province] : [];
  }

  public getUserDisplayName(): string {
    const profile = this.currentState.profile;
    return profile?.displayName || profile?.email || 'User';
  }

  public getUserRoleDisplayName(): string {
    const role = this.currentState.profile?.role;
    switch (role) {
      case 'admin':
        return 'System Administrator';
      case 'enumerator':
        return 'Field Enumerator';
      case 'viewer':
        return 'Data Viewer';
      default:
        return 'Unknown Role';
    }
  }
}

export const authService = AuthService.getInstance();
