// PNG Digital Electoral System - Enhanced Authentication Service with RBAC
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { rbac, checkPermission, checkRole, checkModuleAccess, getAccessibleModules, getUserRoleDisplayName } from './roleBasedAccess';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  email: string;
  password: string;
  displayName: string;
  role?: string;
  province?: string;
  constituency?: string;
  district?: string;
}

export interface UserRole {
  roleId: string;
  roleName: string;
  assignedAt: Date;
  expiresAt?: Date;
  constraints?: {
    provinces?: string[];
    constituencies?: string[];
    devices?: string[];
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  roleDisplayName: string;
  province?: string;
  constituency?: string;
  district?: string;
  permissions: string[];
  accessibleModules: string[];
  lastLogin: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  assignedRoles: Array<{
    roleId: string;
    roleName: string;
    assignedAt: Date;
    expiresAt?: Date;
    constraints?: {
      provinces?: string[];
      constituencies?: string[];
      devices?: string[];
    };
  }>;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    profile: null,
    loading: true,
    error: null
  };
  private listeners: ((state: AuthState) => void)[] = [];

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
    this.setupDemoUsers();
  }

  private initializeAuth() {
    onAuthStateChanged(auth, async (user) => {
      this.authState.loading = true;
      this.notifyListeners();

      if (user) {
        try {
          const profile = await this.loadUserProfile(user);
          this.authState = {
            user,
            profile,
            loading: false,
            error: null
          };
        } catch (error) {
          console.error('Failed to load user profile:', error);
          this.authState = {
            user,
            profile: null,
            loading: false,
            error: 'Failed to load user profile'
          };
        }
      } else {
        this.authState = {
          user: null,
          profile: null,
          loading: false,
          error: null
        };
      }

      this.notifyListeners();
    });
  }

  private async setupDemoUsers() {
    // Setup demo users with different roles for testing
    const demoUsers = [
      {
        uid: 'demo-admin',
        email: 'admin@electoral.gov.pg',
        displayName: 'System Administrator',
        roles: ['system_administrator'],
        province: 'National Capital District'
      },
      {
        uid: 'demo-commissioner',
        email: 'commissioner@electoral.gov.pg',
        displayName: 'Electoral Commissioner',
        roles: ['electoral_commissioner'],
        province: 'National Capital District'
      },
      {
        uid: 'demo-registration',
        email: 'registration@electoral.gov.pg',
        displayName: 'Registration Officer',
        roles: ['registration_officer'],
        province: 'National Capital District',
        constituency: 'Port Moresby South'
      },
      {
        uid: 'demo-enumerator',
        email: 'enumerator@electoral.gov.pg',
        displayName: 'Field Enumerator',
        roles: ['field_enumerator'],
        province: 'Morobe',
        constituency: 'Lae Open'
      },
      {
        uid: 'demo-tally',
        email: 'tally@electoral.gov.pg',
        displayName: 'Tally Officer',
        roles: ['tally_officer'],
        province: 'National Capital District'
      },
      {
        uid: 'demo-observer',
        email: 'observer@electoral.gov.pg',
        displayName: 'Election Observer',
        roles: ['observer'],
        province: 'National Capital District'
      }
    ];

    // Assign roles to demo users in RBAC system
    for (const user of demoUsers) {
      for (const roleId of user.roles) {
        rbac.assignRole(user.uid, roleId, 'system', {
          provinces: user.province ? [user.province] : undefined,
          constituencies: user.constituency ? [user.constituency] : undefined
        });
      }
    }
  }

  private async loadUserProfile(user: User): Promise<UserProfile> {
    // Try to load from Firestore first
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let profileData: any = {};

    if (userDoc.exists()) {
      profileData = userDoc.data();
    }

    // Get user roles and permissions from RBAC
    const userRoles = rbac.getUserRoles(user.uid);
    const permissions = rbac.getUserPermissions(user.uid).map(p => p.id);
    const accessibleModules = rbac.getAccessibleModules(user.uid);
    const roleDisplayName = getUserRoleDisplayName(user.uid);

    // Get primary role (highest level)
    const primaryRole = userRoles.length > 0 ? userRoles[0].roleId : 'voter';

    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: profileData.displayName || user.displayName || 'Unknown User',
      role: primaryRole,
      roleDisplayName,
      province: profileData.province,
      constituency: profileData.constituency,
      permissions,
      accessibleModules,
      lastLogin: new Date().toISOString(),
      isActive: profileData.isActive !== false,
      assignedRoles: userRoles.map(ur => {
        const role = rbac.getAllRoles().find(r => r.id === ur.roleId);
        return {
          roleId: ur.roleId,
          roleName: role?.displayName || ur.roleId,
          assignedAt: ur.assignedAt,
          expiresAt: ur.expiresAt,
          constraints: ur.constraints
        };
      })
    };

    // Update last login in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...profileData,
      lastLogin: profile.lastLogin,
      permissions,
      accessibleModules,
      roleDisplayName
    }, { merge: true });

    return profile;
  }

  public async signIn(credentials: LoginCredentials): Promise<void>;
  public async signIn(email: string, password?: string): Promise<void>;
  public async signIn(emailOrCredentials: string | LoginCredentials, password?: string): Promise<void> {
    try {
      this.authState.loading = true;
      this.authState.error = null;
      this.notifyListeners();

      let email: string;
      let pass: string;

      if (typeof emailOrCredentials === 'string') {
        email = emailOrCredentials;
        pass = password!;
      } else {
        email = emailOrCredentials.email;
        pass = emailOrCredentials.password;
      }

      // Check if this is a demo user
      const demoUsers = [
        { email: 'admin@electoral.gov.pg', password: 'admin@12345', role: 'system_administrator' },
        { email: 'commissioner@electoral.gov.pg', password: 'commissioner@12345', role: 'electoral_commissioner' },
        { email: 'registration@electoral.gov.pg', password: 'registration@12345', role: 'registration_officer' },
        { email: 'enumerator@electoral.gov.pg', password: 'enumerator@12345', role: 'field_enumerator' },
        { email: 'tally@electoral.gov.pg', password: 'tally@12345', role: 'tally_officer' },
        { email: 'observer@electoral.gov.pg', password: 'observer@12345', role: 'observer' }
      ];

      const demoUser = demoUsers.find(user => user.email === email && user.password === pass);

      if (demoUser) {
        // Use demo login for demo users
        await this.signInAsDemo(demoUser.role);
        return;
      }

      // Otherwise use Firebase authentication
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      this.authState.loading = false;
      this.authState.error = error.message;
      this.notifyListeners();
      throw error;
    }
  }

  public async signInAsDemo(roleId: string): Promise<void> {
    // Demo login for testing different roles
    const demoUsers: Record<string, any> = {
      'system_administrator': {
        uid: 'demo-admin',
        email: 'admin@electoral.gov.pg',
        displayName: 'System Administrator'
      },
      'electoral_commissioner': {
        uid: 'demo-commissioner',
        email: 'commissioner@electoral.gov.pg',
        displayName: 'Electoral Commissioner'
      },
      'registration_officer': {
        uid: 'demo-registration',
        email: 'registration@electoral.gov.pg',
        displayName: 'Registration Officer'
      },
      'field_enumerator': {
        uid: 'demo-enumerator',
        email: 'enumerator@electoral.gov.pg',
        displayName: 'Field Enumerator'
      },
      'tally_officer': {
        uid: 'demo-tally',
        email: 'tally@electoral.gov.pg',
        displayName: 'Tally Officer'
      },
      'observer': {
        uid: 'demo-observer',
        email: 'observer@electoral.gov.pg',
        displayName: 'Election Observer'
      }
    };

    const demoUser = demoUsers[roleId];
    if (!demoUser) {
      throw new Error('Invalid demo role');
    }

    // Create mock user object
    const mockUser = {
      uid: demoUser.uid,
      email: demoUser.email,
      displayName: demoUser.displayName
    } as User;

    // Load profile and update auth state
    const profile = await this.loadUserProfile(mockUser);
    this.authState = {
      user: mockUser,
      profile,
      loading: false,
      error: null
    };

    this.notifyListeners();
  }

  public async signOut(): Promise<void> {
    await signOut(auth);
  }

  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  public getCurrentProfile(): UserProfile | null {
    return this.authState.profile;
  }

  public getUserDisplayName(): string {
    return this.authState.profile?.displayName || this.authState.user?.displayName || 'Unknown User';
  }

  public getError(): string | null {
    return this.authState.error;
  }

  public async registerUser(userData: RegisterUserData): Promise<string> {
    try {
      // In a real implementation, this would create a new user
      // For now, just simulate the process
      const userId = `user-${Date.now()}`;

      // Assign initial role if provided
      if (userData.role) {
        rbac.assignRole(userId, userData.role, 'system');
      }

      return userId;
    } catch (error) {
      throw new Error(`Failed to register user: ${(error as Error).message}`);
    }
  }

  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.authState);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // RBAC Permission Methods
  public hasPermission(permissionId: string): boolean {
    if (!this.authState.user) return false;
    return checkPermission(this.authState.user.uid, permissionId);
  }

  public hasRole(roleId: string): boolean {
    if (!this.authState.user) return false;
    return checkRole(this.authState.user.uid, roleId);
  }

  public canAccessModule(module: string): boolean {
    if (!this.authState.user) return false;
    return checkModuleAccess(this.authState.user.uid, module);
  }

  public getAccessibleModules(): string[] {
    if (!this.authState.user) return [];
    return getAccessibleModules(this.authState.user.uid);
  }

  public getUserRoleDisplayName(): string {
    if (!this.authState.user) return 'Not Logged In';
    return getUserRoleDisplayName(this.authState.user.uid);
  }

  // Convenience methods for common role checks
  public isSystemAdmin(): boolean {
    return this.hasRole('system_administrator');
  }

  public isElectoralCommissioner(): boolean {
    return this.hasRole('electoral_commissioner');
  }

  public isRegistrationOfficer(): boolean {
    return this.hasRole('registration_officer');
  }

  public isFieldEnumerator(): boolean {
    return this.hasRole('field_enumerator');
  }

  public isTallyOfficer(): boolean {
    return this.hasRole('tally_officer');
  }

  public isObserver(): boolean {
    return this.hasRole('observer');
  }

  // Permission-based access checks
  public canRegisterCitizens(): boolean {
    return this.hasPermission('citizen.create');
  }

  public canManageCandidates(): boolean {
    return this.hasPermission('candidate.create') || this.hasPermission('candidate.update');
  }

  public canConfigureElections(): boolean {
    return this.hasPermission('election.create') || this.hasPermission('election.update');
  }

  public canManageDevices(): boolean {
    return this.hasPermission('device.manage');
  }

  public canRunTests(): boolean {
    return this.hasPermission('testing.execute');
  }

  public canManageUsers(): boolean {
    return this.hasPermission('admin.users');
  }

  public canViewAuditLogs(): boolean {
    return this.hasPermission('admin.audit');
  }

  // Legacy compatibility methods (for existing code)
  public hasPermission_old(permission: string): boolean {
    // Map old permission format to new RBAC permissions
    const permissionMap: Record<string, string> = {
      'write:province_citizens': 'citizen.create',
      'read:province_citizens': 'citizen.read',
      'admin:all': 'admin.system',
      'manage:candidates': 'candidate.manage',
      'configure:elections': 'election.update'
    };

    const newPermission = permissionMap[permission] || permission;
    return this.hasPermission(newPermission);
  }

  // Get user's role constraints (provinces, constituencies, etc.)
  public getUserConstraints(): UserProfile['assignedRoles'][0]['constraints'] | null {
    const profile = this.getCurrentProfile();
    if (!profile || !profile.assignedRoles.length) return null;

    // Return constraints from highest priority role
    return profile.assignedRoles[0].constraints || null;
  }

  // Check if user can access specific province
  public canAccessProvince(province: string): boolean {
    if (this.isSystemAdmin()) return true;

    const constraints = this.getUserConstraints();
    if (!constraints?.provinces) return true; // No province restrictions

    return constraints.provinces.includes(province);
  }

  // Check if user can access specific constituency
  public canAccessConstituency(constituency: string): boolean {
    if (this.isSystemAdmin()) return true;

    const constraints = this.getUserConstraints();
    if (!constraints?.constituencies) return true; // No constituency restrictions

    return constraints.constituencies.includes(constituency);
  }
}

export const authService = AuthService.getInstance();
export default authService;
