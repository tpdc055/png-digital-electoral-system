// PNG Electoral System - Role-Based Access Control (RBAC)
// Comprehensive permission management for electoral operations

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'manage';
  resource: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  level: number; // Higher number = more privileges
  permissions: string[]; // Permission IDs
  isSystem: boolean; // Cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  constraints?: {
    provinces?: string[];
    constituencies?: string[];
    devices?: string[];
  };
}

// Define all system permissions
export const SYSTEM_PERMISSIONS: Permission[] = [
  // Citizen Registration Module
  {
    id: 'citizen.create',
    name: 'Register Citizens',
    description: 'Create new citizen registrations',
    module: 'registration',
    action: 'create',
    resource: 'citizen'
  },
  {
    id: 'citizen.read',
    name: 'View Citizens',
    description: 'View citizen registration data',
    module: 'registration',
    action: 'read',
    resource: 'citizen'
  },
  {
    id: 'citizen.update',
    name: 'Edit Citizens',
    description: 'Modify citizen registration data',
    module: 'registration',
    action: 'update',
    resource: 'citizen'
  },
  {
    id: 'citizen.delete',
    name: 'Delete Citizens',
    description: 'Remove citizen registrations',
    module: 'registration',
    action: 'delete',
    resource: 'citizen'
  },
  {
    id: 'citizen.verify',
    name: 'Verify Citizens',
    description: 'Perform community verification',
    module: 'registration',
    action: 'execute',
    resource: 'verification'
  },

  // Candidate Management Module
  {
    id: 'candidate.create',
    name: 'Register Candidates',
    description: 'Register new election candidates',
    module: 'candidates',
    action: 'create',
    resource: 'candidate'
  },
  {
    id: 'candidate.read',
    name: 'View Candidates',
    description: 'View candidate information',
    module: 'candidates',
    action: 'read',
    resource: 'candidate'
  },
  {
    id: 'candidate.update',
    name: 'Edit Candidates',
    description: 'Modify candidate information',
    module: 'candidates',
    action: 'update',
    resource: 'candidate'
  },
  {
    id: 'candidate.delete',
    name: 'Remove Candidates',
    description: 'Remove candidate registrations',
    module: 'candidates',
    action: 'delete',
    resource: 'candidate'
  },
  {
    id: 'candidate.approve',
    name: 'Approve Candidates',
    description: 'Approve candidate registrations',
    module: 'candidates',
    action: 'execute',
    resource: 'approval'
  },

  // Election Management Module
  {
    id: 'election.create',
    name: 'Create Elections',
    description: 'Set up new elections',
    module: 'elections',
    action: 'create',
    resource: 'election'
  },
  {
    id: 'election.read',
    name: 'View Elections',
    description: 'View election configurations',
    module: 'elections',
    action: 'read',
    resource: 'election'
  },
  {
    id: 'election.update',
    name: 'Configure Elections',
    description: 'Modify election settings',
    module: 'elections',
    action: 'update',
    resource: 'election'
  },
  {
    id: 'election.delete',
    name: 'Delete Elections',
    description: 'Remove election configurations',
    module: 'elections',
    action: 'delete',
    resource: 'election'
  },
  {
    id: 'election.deploy',
    name: 'Deploy Elections',
    description: 'Deploy elections to production',
    module: 'elections',
    action: 'execute',
    resource: 'deployment'
  },

  // Voting Module
  {
    id: 'voting.cast',
    name: 'Cast Votes',
    description: 'Cast votes in elections',
    module: 'voting',
    action: 'create',
    resource: 'vote'
  },
  {
    id: 'voting.monitor',
    name: 'Monitor Voting',
    description: 'Monitor voting process',
    module: 'voting',
    action: 'read',
    resource: 'voting_session'
  },
  {
    id: 'voting.manage',
    name: 'Manage Voting',
    description: 'Control voting sessions',
    module: 'voting',
    action: 'manage',
    resource: 'voting_session'
  },

  // Tallying & Results Module
  {
    id: 'tally.execute',
    name: 'Execute Tallying',
    description: 'Perform vote counting',
    module: 'tallying',
    action: 'execute',
    resource: 'tally'
  },
  {
    id: 'tally.verify',
    name: 'Verify Results',
    description: 'Verify tally results',
    module: 'tallying',
    action: 'execute',
    resource: 'verification'
  },
  {
    id: 'results.read',
    name: 'View Results',
    description: 'View election results',
    module: 'results',
    action: 'read',
    resource: 'results'
  },
  {
    id: 'results.publish',
    name: 'Publish Results',
    description: 'Publish official results',
    module: 'results',
    action: 'execute',
    resource: 'publication'
  },
  {
    id: 'results.certify',
    name: 'Certify Results',
    description: 'Officially certify results',
    module: 'results',
    action: 'execute',
    resource: 'certification'
  },

  // Device Management Module
  {
    id: 'device.read',
    name: 'View Devices',
    description: 'View device status and location',
    module: 'devices',
    action: 'read',
    resource: 'device'
  },
  {
    id: 'device.manage',
    name: 'Manage Devices',
    description: 'Control device operations',
    module: 'devices',
    action: 'manage',
    resource: 'device'
  },
  {
    id: 'device.lock',
    name: 'Lock/Unlock Devices',
    description: 'Remotely lock or unlock devices',
    module: 'devices',
    action: 'execute',
    resource: 'device_control'
  },

  // Testing Module
  {
    id: 'testing.execute',
    name: 'Run System Tests',
    description: 'Execute system testing procedures',
    module: 'testing',
    action: 'execute',
    resource: 'test'
  },
  {
    id: 'testing.monitor',
    name: 'Monitor Tests',
    description: 'View test results and metrics',
    module: 'testing',
    action: 'read',
    resource: 'test_results'
  },

  // Administration Module
  {
    id: 'admin.users',
    name: 'Manage Users',
    description: 'Create and manage user accounts',
    module: 'administration',
    action: 'manage',
    resource: 'user'
  },
  {
    id: 'admin.roles',
    name: 'Manage Roles',
    description: 'Create and assign roles',
    module: 'administration',
    action: 'manage',
    resource: 'role'
  },
  {
    id: 'admin.permissions',
    name: 'Manage Permissions',
    description: 'Configure system permissions',
    module: 'administration',
    action: 'manage',
    resource: 'permission'
  },
  {
    id: 'admin.audit',
    name: 'View Audit Logs',
    description: 'Access system audit trails',
    module: 'administration',
    action: 'read',
    resource: 'audit'
  },
  {
    id: 'admin.system',
    name: 'System Administration',
    description: 'Full system administration access',
    module: 'administration',
    action: 'manage',
    resource: 'system'
  },

  // Backup & Security Module
  {
    id: 'backup.create',
    name: 'Create Backups',
    description: 'Generate system backups',
    module: 'backup',
    action: 'create',
    resource: 'backup'
  },
  {
    id: 'backup.restore',
    name: 'Restore Backups',
    description: 'Restore from backups',
    module: 'backup',
    action: 'execute',
    resource: 'restore'
  },
  {
    id: 'security.monitor',
    name: 'Security Monitoring',
    description: 'Monitor security events',
    module: 'security',
    action: 'read',
    resource: 'security_event'
  }
];

// Define system roles with their permissions
export const SYSTEM_ROLES: Role[] = [
  {
    id: 'system_administrator',
    name: 'system_administrator',
    displayName: 'System Administrator',
    description: 'Full system access - highest privilege level',
    level: 1000,
    permissions: SYSTEM_PERMISSIONS.map(p => p.id), // All permissions
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'electoral_commissioner',
    name: 'electoral_commissioner',
    displayName: 'Electoral Commissioner',
    description: 'Senior electoral official with broad access',
    level: 900,
    permissions: [
      'citizen.read', 'citizen.update',
      'candidate.read', 'candidate.update', 'candidate.approve',
      'election.create', 'election.read', 'election.update', 'election.deploy',
      'voting.monitor', 'voting.manage',
      'tally.verify', 'results.read', 'results.publish', 'results.certify',
      'device.read', 'device.manage',
      'testing.monitor',
      'admin.audit',
      'security.monitor'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'registration_officer',
    name: 'registration_officer',
    displayName: 'Registration Officer',
    description: 'Responsible for citizen registration and data management',
    level: 700,
    permissions: [
      'citizen.create', 'citizen.read', 'citizen.update',
      'citizen.verify',
      'candidate.read',
      'election.read',
      'device.read',
      'backup.create'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'verification_officer',
    name: 'verification_officer',
    displayName: 'Verification Officer',
    description: 'Community verification specialist',
    level: 600,
    permissions: [
      'citizen.read', 'citizen.verify',
      'candidate.read',
      'election.read'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tally_officer',
    name: 'tally_officer',
    displayName: 'Tally Officer',
    description: 'Authorized to perform vote counting and result verification',
    level: 800,
    permissions: [
      'citizen.read',
      'candidate.read',
      'election.read',
      'voting.monitor',
      'tally.execute', 'tally.verify',
      'results.read',
      'device.read'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'field_enumerator',
    name: 'field_enumerator',
    displayName: 'Field Enumerator',
    description: 'Mobile registration officer for remote areas',
    level: 500,
    permissions: [
      'citizen.create', 'citizen.read',
      'citizen.verify',
      'candidate.read',
      'election.read',
      'device.read'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'it_support',
    name: 'it_support',
    displayName: 'IT Support Officer',
    description: 'Technical support and system maintenance',
    level: 750,
    permissions: [
      'citizen.read',
      'candidate.read',
      'election.read',
      'device.read', 'device.manage', 'device.lock',
      'testing.execute', 'testing.monitor',
      'backup.create', 'backup.restore',
      'security.monitor'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'observer',
    name: 'observer',
    displayName: 'Election Observer',
    description: 'Read-only access for monitoring elections',
    level: 300,
    permissions: [
      'citizen.read',
      'candidate.read',
      'election.read',
      'voting.monitor',
      'results.read',
      'device.read'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'candidate',
    name: 'candidate',
    displayName: 'Election Candidate',
    description: 'Limited access for registered candidates',
    level: 200,
    permissions: [
      'candidate.read',
      'election.read',
      'results.read'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'voter',
    name: 'voter',
    displayName: 'Registered Voter',
    description: 'Basic voting access for registered citizens',
    level: 100,
    permissions: [
      'voting.cast',
      'results.read'
    ],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Role-Based Access Control Service
class RoleBasedAccessControl {
  private static instance: RoleBasedAccessControl;
  private userRoles: Map<string, UserRole[]> = new Map();
  private roleCache: Map<string, Role> = new Map();
  private permissionCache: Map<string, Permission> = new Map();

  public static getInstance(): RoleBasedAccessControl {
    if (!RoleBasedAccessControl.instance) {
      RoleBasedAccessControl.instance = new RoleBasedAccessControl();
    }
    return RoleBasedAccessControl.instance;
  }

  constructor() {
    this.initializeRoles();
    this.initializePermissions();
  }

  private initializeRoles(): void {
    for (const role of SYSTEM_ROLES) {
      this.roleCache.set(role.id, role);
    }
  }

  private initializePermissions(): void {
    for (const permission of SYSTEM_PERMISSIONS) {
      this.permissionCache.set(permission.id, permission);
    }
  }

  // Check if user has specific permission
  public hasPermission(userId: string, permissionId: string): boolean {
    const userRoles = this.getUserRoles(userId);
    for (const userRole of userRoles) {
      if (!userRole.isActive) continue;
      if (userRole.expiresAt && userRole.expiresAt < new Date()) continue;

      const role = this.roleCache.get(userRole.roleId);
      if (role?.permissions.includes(permissionId)) {
        return true;
      }
    }
    return false;
  }

  // Check if user has role
  public hasRole(userId: string, roleId: string): boolean {
    const userRoles = this.getUserRoles(userId);
    return userRoles.some(ur => ur.roleId === roleId && ur.isActive);
  }

  // Get all user permissions
  public getUserPermissions(userId: string): Permission[] {
    const permissions = new Set<string>();
    const userRoles = this.getUserRoles(userId);

    for (const userRole of userRoles) {
      if (!userRole.isActive) continue;
      if (userRole.expiresAt && userRole.expiresAt < new Date()) continue;

      const role = this.roleCache.get(userRole.roleId);
      if (role) {
        for (const p of role.permissions) {
          permissions.add(p);
        }
      }
    }

    return Array.from(permissions)
      .map(id => this.permissionCache.get(id))
      .filter(p => p !== undefined) as Permission[];
  }

  // Get user roles
  public getUserRoles(userId: string): UserRole[] {
    return this.userRoles.get(userId) || [];
  }

  // Get user's highest role level
  public getUserMaxLevel(userId: string): number {
    const userRoles = this.getUserRoles(userId);
    let maxLevel = 0;

    for (const userRole of userRoles) {
      if (!userRole.isActive) continue;
      if (userRole.expiresAt && userRole.expiresAt < new Date()) continue;

      const role = this.roleCache.get(userRole.roleId);
      if (role && role.level > maxLevel) {
        maxLevel = role.level;
      }
    }

    return maxLevel;
  }

  // Assign role to user
  public assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    constraints?: UserRole['constraints'],
    expiresAt?: Date
  ): void {
    const userRoles = this.userRoles.get(userId) || [];

    const newUserRole: UserRole = {
      userId,
      roleId,
      assignedBy,
      assignedAt: new Date(),
      expiresAt,
      isActive: true,
      constraints
    };

    userRoles.push(newUserRole);
    this.userRoles.set(userId, userRoles);
  }

  // Remove role from user
  public removeRole(userId: string, roleId: string): void {
    const userRoles = this.userRoles.get(userId) || [];
    const updatedRoles = userRoles.filter(ur => ur.roleId !== roleId);
    this.userRoles.set(userId, updatedRoles);
  }

  // Get all available roles
  public getAllRoles(): Role[] {
    return Array.from(this.roleCache.values());
  }

  // Get all available permissions
  public getAllPermissions(): Permission[] {
    return Array.from(this.permissionCache.values());
  }

  // Get permissions by module
  public getPermissionsByModule(module: string): Permission[] {
    return Array.from(this.permissionCache.values())
      .filter(p => p.module === module);
  }

  // Check module access
  public canAccessModule(userId: string, module: string): boolean {
    const modulePermissions = this.getPermissionsByModule(module);
    const userPermissions = this.getUserPermissions(userId);

    return modulePermissions.some(mp =>
      userPermissions.some(up => up.id === mp.id)
    );
  }

  // Get accessible modules for user
  public getAccessibleModules(userId: string): string[] {
    const userPermissions = this.getUserPermissions(userId);
    const modules = new Set<string>();

    for (const p of userPermissions) {
      modules.add(p.module);
    }
    return Array.from(modules);
  }

  // Check if user can perform action on resource
  public canPerformAction(
    userId: string,
    module: string,
    action: Permission['action'],
    resource: string
  ): boolean {
    const userPermissions = this.getUserPermissions(userId);
    return userPermissions.some(p =>
      p.module === module &&
      p.action === action &&
      p.resource === resource
    );
  }
}

export const rbac = RoleBasedAccessControl.getInstance();

// Utility functions for easy permission checking
export const checkPermission = (userId: string, permissionId: string): boolean => {
  return rbac.hasPermission(userId, permissionId);
};

export const checkRole = (userId: string, roleId: string): boolean => {
  return rbac.hasRole(userId, roleId);
};

export const checkModuleAccess = (userId: string, module: string): boolean => {
  return rbac.canAccessModule(userId, module);
};

export const getAccessibleModules = (userId: string): string[] => {
  return rbac.getAccessibleModules(userId);
};

export const getUserRoleDisplayName = (userId: string): string => {
  const userRoles = rbac.getUserRoles(userId);
  if (userRoles.length === 0) return 'No Role Assigned';

  // Get highest level role
  let highestRole: Role | undefined;
  let maxLevel = 0;

  for (const userRole of userRoles) {
    if (!userRole.isActive) continue;
    const role = SYSTEM_ROLES.find(r => r.id === userRole.roleId);
    if (role && role.level > maxLevel) {
      maxLevel = role.level;
      highestRole = role;
    }
  }

  return highestRole?.displayName || 'Unknown Role';
};

export default rbac;
