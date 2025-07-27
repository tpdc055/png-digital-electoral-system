// PNG Digital Electoral System - Enhanced Role-Based Access Control (RBAC) v2.0
// Advanced features: Role hierarchy, time-based permissions, delegation, and real-time monitoring

import { rbac, type Role, type Permission, type UserRole, SYSTEM_ROLES, SYSTEM_PERMISSIONS } from './roleBasedAccess';

export interface RoleHierarchy {
  roleId: string;
  parentRoleId?: string;
  childRoleIds: string[];
  inheritanceType: 'full' | 'partial' | 'conditional';
  level: number;
  maxDepth: number;
}

export interface TimeBasedPermission {
  permissionId: string;
  userId: string;
  schedules: PermissionSchedule[];
  timezone: string;
  expiresAt?: Date;
  isRecurring: boolean;
}

export interface PermissionSchedule {
  dayOfWeek: number[]; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ConditionalPermission {
  permissionId: string;
  userId: string;
  conditions: PermissionCondition[];
  combinationType: 'AND' | 'OR';
  isActive: boolean;
}

export interface PermissionCondition {
  type: 'ip_address' | 'device_id' | 'location' | 'mfa_verified' | 'session_duration' | 'user_attribute';
  operator: 'equals' | 'not_equals' | 'contains' | 'in_range' | 'greater_than' | 'less_than';
  value: string | number | string[];
  description: string;
}

export interface PermissionDelegation {
  id: string;
  delegatorUserId: string;
  delegateUserId: string;
  permissionIds: string[];
  expiresAt: Date;
  constraints?: {
    maxUsage?: number;
    usageCount: number;
    resourceRestrictions?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  revokedAt?: Date;
}

export interface RoleApprovalWorkflow {
  id: string;
  userId: string;
  requestedRoleId: string;
  currentRoleId?: string;
  workflowType: 'promotion' | 'demotion' | 'lateral_transfer' | 'temporary_elevation';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  justification: string;
  expiresAt?: Date; // For temporary roles
  approvalSteps: ApprovalStep[];
  createdAt: Date;
  completedAt?: Date;
}

export interface ApprovalStep {
  stepNumber: number;
  approverRoleId: string;
  approverUserId?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  completedAt?: Date;
  requiredMFA: boolean;
  requiresBiometric: boolean;
}

export interface SecurityAlert {
  id: string;
  type: 'unauthorized_access' | 'privilege_escalation' | 'unusual_activity' | 'suspicious_location' | 'failed_mfa';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  message: string;
  details: {
    action?: string;
    resource?: string;
    ipAddress?: string;
    location?: string;
    deviceId?: string;
    timestamp: Date;
  };
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface PermissionUsageAnalytics {
  userId: string;
  permissionId: string;
  usageCount: number;
  lastUsed: Date;
  avgSessionDuration: number;
  resourcesAccessed: string[];
  suspiciousActivityScore: number;
  trendAnalysis: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

class EnhancedRBACService {
  private static instance: EnhancedRBACService;
  private roleHierarchies: Map<string, RoleHierarchy> = new Map();
  private timeBasedPermissions: Map<string, TimeBasedPermission[]> = new Map();
  private conditionalPermissions: Map<string, ConditionalPermission[]> = new Map();
  private permissionDelegations: Map<string, PermissionDelegation[]> = new Map();
  private roleApprovalWorkflows: Map<string, RoleApprovalWorkflow> = new Map();
  private securityAlerts: SecurityAlert[] = [];
  private permissionUsageAnalytics: Map<string, PermissionUsageAnalytics> = new Map();
  private permissionCache: Map<string, { permissions: string[]; expires: number }> = new Map();

  public static getInstance(): EnhancedRBACService {
    if (!EnhancedRBACService.instance) {
      EnhancedRBACService.instance = new EnhancedRBACService();
    }
    return EnhancedRBACService.instance;
  }

  constructor() {
    this.initializeRoleHierarchies();
    this.setupSecurityMonitoring();
  }

  private initializeRoleHierarchies(): void {
    // Define role hierarchy for PNG Electoral System
    const hierarchies: RoleHierarchy[] = [
      {
        roleId: 'system_administrator',
        childRoleIds: ['electoral_commissioner', 'it_support'],
        inheritanceType: 'full',
        level: 1,
        maxDepth: 3
      },
      {
        roleId: 'electoral_commissioner',
        parentRoleId: 'system_administrator',
        childRoleIds: ['registration_officer', 'tally_officer', 'verification_officer'],
        inheritanceType: 'full',
        level: 2,
        maxDepth: 2
      },
      {
        roleId: 'registration_officer',
        parentRoleId: 'electoral_commissioner',
        childRoleIds: ['field_enumerator'],
        inheritanceType: 'partial',
        level: 3,
        maxDepth: 1
      },
      {
        roleId: 'tally_officer',
        parentRoleId: 'electoral_commissioner',
        childRoleIds: ['observer'],
        inheritanceType: 'conditional',
        level: 3,
        maxDepth: 1
      },
      {
        roleId: 'verification_officer',
        parentRoleId: 'electoral_commissioner',
        childRoleIds: [],
        inheritanceType: 'partial',
        level: 3,
        maxDepth: 0
      },
      {
        roleId: 'it_support',
        parentRoleId: 'system_administrator',
        childRoleIds: [],
        inheritanceType: 'conditional',
        level: 2,
        maxDepth: 0
      },
      {
        roleId: 'field_enumerator',
        parentRoleId: 'registration_officer',
        childRoleIds: [],
        inheritanceType: 'partial',
        level: 4,
        maxDepth: 0
      },
      {
        roleId: 'observer',
        parentRoleId: 'tally_officer',
        childRoleIds: ['candidate'],
        inheritanceType: 'conditional',
        level: 4,
        maxDepth: 1
      },
      {
        roleId: 'candidate',
        parentRoleId: 'observer',
        childRoleIds: ['voter'],
        inheritanceType: 'conditional',
        level: 5,
        maxDepth: 1
      },
      {
        roleId: 'voter',
        parentRoleId: 'candidate',
        childRoleIds: [],
        inheritanceType: 'conditional',
        level: 6,
        maxDepth: 0
      }
    ];

    for (const hierarchy of hierarchies) {
      this.roleHierarchies.set(hierarchy.roleId, hierarchy);
    }

    console.log('🏗️ Enhanced RBAC role hierarchies initialized');
  }

  private setupSecurityMonitoring(): void {
    // Setup real-time security monitoring
    setInterval(() => {
      this.analyzePermissionUsage();
      this.detectAnomalousActivity();
      this.cleanupExpiredPermissions();
    }, 60000); // Every minute

    console.log('🛡️ Enhanced RBAC security monitoring activated');
  }

  // Role Hierarchy Methods
  public getEffectivePermissions(userId: string, context?: Record<string, unknown>): string[] {
    const cacheKey = `${userId}_${JSON.stringify(context || {})}`;
    const cached = this.permissionCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.permissions;
    }

    const permissions = new Set<string>();

    // Get direct role permissions
    const userRoles = rbac.getUserRoles(userId);
    for (const userRole of userRoles) {
      if (!userRole.isActive) continue;

      const rolePermissions = this.getRolePermissionsWithInheritance(userRole.roleId);
      for (const permission of rolePermissions) {
        permissions.add(permission);
      }
    }

    // Add time-based permissions
    const timeBasedPerms = this.getActiveTimeBasedPermissions(userId);
    for (const permission of timeBasedPerms) {
      permissions.add(permission);
    }

    // Add conditional permissions
    const conditionalPerms = this.getActiveConditionalPermissions(userId, context);
    for (const permission of conditionalPerms) {
      permissions.add(permission);
    }

    // Add delegated permissions
    const delegatedPerms = this.getActiveDelegatedPermissions(userId);
    for (const permission of delegatedPerms) {
      permissions.add(permission);
    }

    const result = Array.from(permissions);

    // Cache result for 5 minutes
    this.permissionCache.set(cacheKey, {
      permissions: result,
      expires: Date.now() + 5 * 60 * 1000
    });

    return result;
  }

  private getRolePermissionsWithInheritance(roleId: string): string[] {
    const permissions = new Set<string>();
    const role = SYSTEM_ROLES.find(r => r.id === roleId);

    if (!role) return [];

    // Add direct permissions
    for (const permission of role.permissions) {
      permissions.add(permission);
    }

    // Add inherited permissions
    const hierarchy = this.roleHierarchies.get(roleId);
    if (hierarchy?.parentRoleId && hierarchy.inheritanceType !== 'conditional') {
      const parentPermissions = this.getRolePermissionsWithInheritance(hierarchy.parentRoleId);

      if (hierarchy.inheritanceType === 'full') {
        for (const permission of parentPermissions) {
          permissions.add(permission);
        }
      } else if (hierarchy.inheritanceType === 'partial') {
        // Only inherit read permissions
        for (const permission of parentPermissions) {
          if (permission.includes('.read') || permission.includes('.view')) {
            permissions.add(permission);
          }
        }
      }
    }

    return Array.from(permissions);
  }

  // Time-Based Permissions
  public addTimeBasedPermission(permission: TimeBasedPermission): void {
    const userPermissions = this.timeBasedPermissions.get(permission.userId) || [];
    userPermissions.push(permission);
    this.timeBasedPermissions.set(permission.userId, userPermissions);

    console.log(`⏰ Time-based permission added: ${permission.permissionId} for user ${permission.userId}`);
  }

  private getActiveTimeBasedPermissions(userId: string): string[] {
    const userPermissions = this.timeBasedPermissions.get(userId) || [];
    const activePermissions: string[] = [];
    const now = new Date();

    for (const permission of userPermissions) {
      if (permission.expiresAt && permission.expiresAt < now) continue;

      if (this.isTimeBasedPermissionActive(permission, now)) {
        activePermissions.push(permission.permissionId);
      }
    }

    return activePermissions;
  }

  private isTimeBasedPermissionActive(permission: TimeBasedPermission, now: Date): boolean {
    for (const schedule of permission.schedules) {
      // Check day of week
      if (!schedule.dayOfWeek.includes(now.getDay())) continue;

      // Check time range
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime < schedule.startTime || currentTime > schedule.endTime) continue;

      // Check date range if specified
      if (schedule.dateRange) {
        if (now < schedule.dateRange.start || now > schedule.dateRange.end) continue;
      }

      return true;
    }

    return false;
  }

  // Conditional Permissions
  public addConditionalPermission(permission: ConditionalPermission): void {
    const userPermissions = this.conditionalPermissions.get(permission.userId) || [];
    userPermissions.push(permission);
    this.conditionalPermissions.set(permission.userId, userPermissions);

    console.log(`🔀 Conditional permission added: ${permission.permissionId} for user ${permission.userId}`);
  }

  private getActiveConditionalPermissions(userId: string, context?: Record<string, unknown>): string[] {
    const userPermissions = this.conditionalPermissions.get(userId) || [];
    const activePermissions: string[] = [];

    for (const permission of userPermissions) {
      if (!permission.isActive) continue;

      if (this.evaluatePermissionConditions(permission, context)) {
        activePermissions.push(permission.permissionId);
      }
    }

    return activePermissions;
  }

  private evaluatePermissionConditions(permission: ConditionalPermission, context?: Record<string, unknown>): boolean {
    if (!context) return false;

    const results = permission.conditions.map(condition => {
      return this.evaluateCondition(condition, context);
    });

    return permission.combinationType === 'AND'
      ? results.every(r => r)
      : results.some(r => r);
  }

  private evaluateCondition(condition: PermissionCondition, context: Record<string, unknown>): boolean {
    const contextValue = context[condition.type];
    if (contextValue === undefined) return false;

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      case 'in_range':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          const numValue = Number(contextValue);
          return numValue >= Number(condition.value[0]) && numValue <= Number(condition.value[1]);
        }
        return false;
      case 'greater_than':
        return Number(contextValue) > Number(condition.value);
      case 'less_than':
        return Number(contextValue) < Number(condition.value);
      default:
        return false;
    }
  }

  // Permission Delegation
  public delegatePermissions(delegation: Omit<PermissionDelegation, 'id' | 'createdAt'>): string {
    const delegationId = `delegation-${Date.now()}`;
    const fullDelegation: PermissionDelegation = {
      ...delegation,
      id: delegationId,
      createdAt: new Date(),
      constraints: delegation.constraints || {
        maxUsage: 100,
        usageCount: 0,
        resourceRestrictions: []
      }
    };

    const userDelegations = this.permissionDelegations.get(delegation.delegateUserId) || [];
    userDelegations.push(fullDelegation);
    this.permissionDelegations.set(delegation.delegateUserId, userDelegations);

    console.log(`🤝 Permissions delegated from ${delegation.delegatorUserId} to ${delegation.delegateUserId}`);
    return delegationId;
  }

  private getActiveDelegatedPermissions(userId: string): string[] {
    const userDelegations = this.permissionDelegations.get(userId) || [];
    const activePermissions: string[] = [];
    const now = new Date();

    for (const delegation of userDelegations) {
      if (!delegation.isActive) continue;
      if (delegation.expiresAt && delegation.expiresAt < now) continue;
      if (delegation.revokedAt) continue;
      if (delegation.constraints?.maxUsage && delegation.constraints.usageCount >= delegation.constraints.maxUsage) continue;

      activePermissions.push(...delegation.permissionIds);
    }

    return activePermissions;
  }

  // Role Approval Workflow
  public requestRoleChange(workflow: Omit<RoleApprovalWorkflow, 'id' | 'createdAt' | 'status' | 'approvalSteps'>): string {
    const workflowId = `workflow-${Date.now()}`;
    const fullWorkflow: RoleApprovalWorkflow = {
      ...workflow,
      id: workflowId,
      createdAt: new Date(),
      status: 'pending',
      approvalSteps: this.generateApprovalSteps(workflow.requestedRoleId, workflow.currentRoleId)
    };

    this.roleApprovalWorkflows.set(workflowId, fullWorkflow);

    console.log(`📋 Role change request created: ${workflowId}`);
    return workflowId;
  }

  private generateApprovalSteps(requestedRoleId: string, currentRoleId?: string): ApprovalStep[] {
    const steps: ApprovalStep[] = [];

    // Determine approval requirements based on role hierarchy
    const requestedHierarchy = this.roleHierarchies.get(requestedRoleId);
    const currentHierarchy = currentRoleId ? this.roleHierarchies.get(currentRoleId) : undefined;

    if (requestedHierarchy && requestedHierarchy.level <= 2) {
      // High-privilege roles require multiple approvals
      steps.push({
        stepNumber: 1,
        approverRoleId: 'electoral_commissioner',
        status: 'pending',
        requiredMFA: true,
        requiresBiometric: false
      });

      steps.push({
        stepNumber: 2,
        approverRoleId: 'system_administrator',
        status: 'pending',
        requiredMFA: true,
        requiresBiometric: true
      });
    } else {
      // Standard roles require single approval
      steps.push({
        stepNumber: 1,
        approverRoleId: 'electoral_commissioner',
        status: 'pending',
        requiredMFA: false,
        requiresBiometric: false
      });
    }

    return steps;
  }

  // Security Monitoring
  private analyzePermissionUsage(): void {
    // Analyze permission usage patterns for anomalies
    for (const [userId, analytics] of this.permissionUsageAnalytics) {
      if (analytics.suspiciousActivityScore > 70) {
        this.createSecurityAlert({
          type: 'unusual_activity',
          severity: 'medium',
          userId,
          message: `Unusual permission usage pattern detected for user ${userId}`,
          details: {
            timestamp: new Date()
          }
        });
      }
    }
  }

  private detectAnomalousActivity(): void {
    // Implement machine learning-based anomaly detection
    // This is a simplified version - in production, use proper ML algorithms
    console.log('🔍 Running anomaly detection...');
  }

  private cleanupExpiredPermissions(): void {
    const now = new Date();

    // Cleanup time-based permissions
    for (const [userId, permissions] of this.timeBasedPermissions) {
      const activePermissions = permissions.filter(p => !p.expiresAt || p.expiresAt > now);
      if (activePermissions.length !== permissions.length) {
        this.timeBasedPermissions.set(userId, activePermissions);
      }
    }

    // Cleanup delegated permissions
    for (const [userId, delegations] of this.permissionDelegations) {
      const activeDelegations = delegations.filter(d => !d.expiresAt || d.expiresAt > now);
      if (activeDelegations.length !== delegations.length) {
        this.permissionDelegations.set(userId, activeDelegations);
      }
    }
  }

  private createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'createdAt' | 'status'>): void {
    const fullAlert: SecurityAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      createdAt: new Date(),
      status: 'open'
    };

    this.securityAlerts.push(fullAlert);
    console.warn(`🚨 Security alert created: ${fullAlert.type} - ${fullAlert.message}`);
  }

  // Public API Methods
  public hasEnhancedPermission(userId: string, permissionId: string, context?: Record<string, unknown>): boolean {
    const effectivePermissions = this.getEffectivePermissions(userId, context);
    const hasPermission = effectivePermissions.includes(permissionId);

    // Track permission usage
    this.trackPermissionUsage(userId, permissionId);

    return hasPermission;
  }

  private trackPermissionUsage(userId: string, permissionId: string): void {
    const key = `${userId}_${permissionId}`;
    const analytics = this.permissionUsageAnalytics.get(key) || {
      userId,
      permissionId,
      usageCount: 0,
      lastUsed: new Date(),
      avgSessionDuration: 0,
      resourcesAccessed: [],
      suspiciousActivityScore: 0,
      trendAnalysis: {
        daily: new Array(24).fill(0),
        weekly: new Array(7).fill(0),
        monthly: new Array(30).fill(0)
      }
    };

    analytics.usageCount++;
    analytics.lastUsed = new Date();

    // Update trend analysis
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const dayOfMonth = new Date().getDate() - 1;

    analytics.trendAnalysis.daily[hour]++;
    analytics.trendAnalysis.weekly[day]++;
    analytics.trendAnalysis.monthly[dayOfMonth]++;

    this.permissionUsageAnalytics.set(key, analytics);
  }

  public getRoleHierarchy(roleId: string): RoleHierarchy | undefined {
    return this.roleHierarchies.get(roleId);
  }

  public getSecurityAlerts(userId?: string): SecurityAlert[] {
    if (userId) {
      return this.securityAlerts.filter(alert => alert.userId === userId);
    }
    return [...this.securityAlerts];
  }

  public getPermissionAnalytics(userId?: string): PermissionUsageAnalytics[] {
    const analytics = Array.from(this.permissionUsageAnalytics.values());
    if (userId) {
      return analytics.filter(a => a.userId === userId);
    }
    return analytics;
  }

  public invalidatePermissionCache(userId?: string): void {
    if (userId) {
      for (const key of this.permissionCache.keys()) {
        if (key.startsWith(userId)) {
          this.permissionCache.delete(key);
        }
      }
    } else {
      this.permissionCache.clear();
    }
  }
}

export const enhancedRBAC = EnhancedRBACService.getInstance();
export default enhancedRBAC;
