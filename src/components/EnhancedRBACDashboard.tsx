import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Lock,
  Unlock,
  Settings,
  Eye,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Zap,
  Network,
  Calendar,
  MapPin,
  Smartphone,
  FileText,
  BarChart3,
  Workflow,
  UserCheck,
  Timer,
  Share2,
  Bell,
  Download
} from 'lucide-react';

import {
  enhancedRBAC,
  type RoleHierarchy,
  type TimeBasedPermission,
  type ConditionalPermission,
  type PermissionDelegation,
  type RoleApprovalWorkflow,
  type SecurityAlert,
  type PermissionUsageAnalytics
} from '../services/enhancedRBAC';
import { authService } from '../services/authService';
import { SYSTEM_ROLES, SYSTEM_PERMISSIONS } from '../services/roleBasedAccess';

interface EnhancedUserProfile {
  id: string;
  email: string;
  displayName: string;
  primaryRole: string;
  effectivePermissions: string[];
  securityScore: number;
  lastActivity: Date;
  alertCount: number;
  delegationCount: number;
  timeBasedPermissionCount: number;
}

const EnhancedRBACDashboard: React.FC = () => {
  const [users, setUsers] = useState<EnhancedUserProfile[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [permissionAnalytics, setPermissionAnalytics] = useState<PermissionUsageAnalytics[]>([]);
  const [roleHierarchies, setRoleHierarchies] = useState<RoleHierarchy[]>([]);
  const [approvalWorkflows, setApprovalWorkflows] = useState<RoleApprovalWorkflow[]>([]);
  const [selectedUser, setSelectedUser] = useState<EnhancedUserProfile | null>(null);

  // Form states
  const [newTimeBasedPermission, setNewTimeBasedPermission] = useState({
    userId: '',
    permissionId: '',
    dayOfWeek: [] as number[],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'Pacific/Port_Moresby',
    expiresAt: '',
    isRecurring: true
  });

  const [newConditionalPermission, setNewConditionalPermission] = useState({
    userId: '',
    permissionId: '',
    conditionType: 'ip_address' as const,
    operator: 'equals' as const,
    value: '',
    description: ''
  });

  const [newDelegation, setNewDelegation] = useState({
    delegatorUserId: '',
    delegateUserId: '',
    permissionIds: [] as string[],
    expiresAt: '',
    maxUsage: 100
  });

  const currentUser = authService.getCurrentProfile();

  useEffect(() => {
    loadEnhancedRBACData();
    const cleanup = setupRealTimeUpdates();
    return cleanup;
  }, []);

  const loadEnhancedRBACData = () => {
    // Load enhanced RBAC data
    loadUsers();
    loadSecurityAlerts();
    loadPermissionAnalytics();
    loadRoleHierarchies();
    loadApprovalWorkflows();
  };

  const loadUsers = () => {
    // Mock enhanced user data - in production, fetch from database
    const mockUsers: EnhancedUserProfile[] = [
      {
        id: 'user-001',
        email: 'admin@electoral.png.gov',
        displayName: 'System Administrator',
        primaryRole: 'system_administrator',
        effectivePermissions: enhancedRBAC.getEffectivePermissions('user-001'),
        securityScore: 95,
        lastActivity: new Date(),
        alertCount: 0,
        delegationCount: 2,
        timeBasedPermissionCount: 1
      },
      {
        id: 'user-002',
        email: 'commissioner@electoral.png.gov',
        displayName: 'Electoral Commissioner',
        primaryRole: 'electoral_commissioner',
        effectivePermissions: enhancedRBAC.getEffectivePermissions('user-002'),
        securityScore: 88,
        lastActivity: new Date(Date.now() - 3600000),
        alertCount: 1,
        delegationCount: 0,
        timeBasedPermissionCount: 3
      },
      {
        id: 'user-003',
        email: 'registration@electoral.png.gov',
        displayName: 'Registration Officer',
        primaryRole: 'registration_officer',
        effectivePermissions: enhancedRBAC.getEffectivePermissions('user-003'),
        securityScore: 92,
        lastActivity: new Date(Date.now() - 7200000),
        alertCount: 0,
        delegationCount: 1,
        timeBasedPermissionCount: 2
      }
    ];

    setUsers(mockUsers);
  };

  const loadSecurityAlerts = () => {
    const alerts = enhancedRBAC.getSecurityAlerts();
    setSecurityAlerts(alerts);
  };

  const loadPermissionAnalytics = () => {
    const analytics = enhancedRBAC.getPermissionAnalytics();
    setPermissionAnalytics(analytics);
  };

  const loadRoleHierarchies = () => {
    const hierarchies: RoleHierarchy[] = [];
    for (const role of SYSTEM_ROLES) {
      const hierarchy = enhancedRBAC.getRoleHierarchy(role.id);
      if (hierarchy) {
        hierarchies.push(hierarchy);
      }
    }
    setRoleHierarchies(hierarchies);
  };

  const loadApprovalWorkflows = () => {
    // Mock approval workflows - in production, fetch from database
    setApprovalWorkflows([]);
  };

  const setupRealTimeUpdates = () => {
    const interval = setInterval(() => {
      loadSecurityAlerts();
      loadPermissionAnalytics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  };

  const handleCreateTimeBasedPermission = () => {
    if (!newTimeBasedPermission.userId || !newTimeBasedPermission.permissionId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const permission: TimeBasedPermission = {
      permissionId: newTimeBasedPermission.permissionId,
      userId: newTimeBasedPermission.userId,
      schedules: [{
        dayOfWeek: newTimeBasedPermission.dayOfWeek,
        startTime: newTimeBasedPermission.startTime,
        endTime: newTimeBasedPermission.endTime
      }],
      timezone: newTimeBasedPermission.timezone,
      expiresAt: newTimeBasedPermission.expiresAt ? new Date(newTimeBasedPermission.expiresAt) : undefined,
      isRecurring: newTimeBasedPermission.isRecurring
    };

    enhancedRBAC.addTimeBasedPermission(permission);
    toast.success('Time-based permission created successfully');

    // Reset form
    setNewTimeBasedPermission({
      userId: '',
      permissionId: '',
      dayOfWeek: [],
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'Pacific/Port_Moresby',
      expiresAt: '',
      isRecurring: true
    });

    loadUsers(); // Refresh user data
  };

  const handleCreateConditionalPermission = () => {
    if (!newConditionalPermission.userId || !newConditionalPermission.permissionId || !newConditionalPermission.value) {
      toast.error('Please fill in all required fields');
      return;
    }

    const permission: ConditionalPermission = {
      permissionId: newConditionalPermission.permissionId,
      userId: newConditionalPermission.userId,
      conditions: [{
        type: newConditionalPermission.conditionType,
        operator: newConditionalPermission.operator,
        value: newConditionalPermission.value,
        description: newConditionalPermission.description
      }],
      combinationType: 'AND',
      isActive: true
    };

    enhancedRBAC.addConditionalPermission(permission);
    toast.success('Conditional permission created successfully');

    // Reset form
    setNewConditionalPermission({
      userId: '',
      permissionId: '',
      conditionType: 'ip_address',
      operator: 'equals',
      value: '',
      description: ''
    });

    loadUsers(); // Refresh user data
  };

  const handleCreateDelegation = () => {
    if (!newDelegation.delegatorUserId || !newDelegation.delegateUserId || newDelegation.permissionIds.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const delegationId = enhancedRBAC.delegatePermissions({
      delegatorUserId: newDelegation.delegatorUserId,
      delegateUserId: newDelegation.delegateUserId,
      permissionIds: newDelegation.permissionIds,
      expiresAt: new Date(newDelegation.expiresAt),
      isActive: true,
      constraints: {
        maxUsage: newDelegation.maxUsage,
        usageCount: 0,
        resourceRestrictions: []
      }
    });

    toast.success(`Permission delegation created: ${delegationId}`);

    // Reset form
    setNewDelegation({
      delegatorUserId: '',
      delegateUserId: '',
      permissionIds: [],
      expiresAt: '',
      maxUsage: 100
    });

    loadUsers(); // Refresh user data
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlertSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!authService.hasRole('system_administrator')) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. System administrator privileges required for enhanced RBAC management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced RBAC Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Advanced role-based access control with hierarchy, time-based permissions, and security monitoring
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={loadEnhancedRBACData}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Avg security score: {Math.round(users.reduce((sum, u) => sum + u.securityScore, 0) / users.length)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {securityAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} critical/high
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Hierarchy</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleHierarchies.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.max(...roleHierarchies.map(h => h.level))} levels deep
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time-based Perms</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, u) => sum + u.timeBasedPermissionCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {users.filter(u => u.timeBasedPermissionCount > 0).length} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delegations</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, u) => sum + u.delegationCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active permission delegations
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hierarchy">Role Hierarchy</TabsTrigger>
          <TabsTrigger value="time-based">Time-based</TabsTrigger>
          <TabsTrigger value="conditional">Conditional</TabsTrigger>
          <TabsTrigger value="delegation">Delegation</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced User Overview</CardTitle>
              <CardDescription>
                Users with advanced RBAC features and security metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Primary Role</TableHead>
                      <TableHead>Security Score</TableHead>
                      <TableHead>Effective Permissions</TableHead>
                      <TableHead>Advanced Features</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{user.displayName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {SYSTEM_ROLES.find(r => r.id === user.primaryRole)?.displayName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={user.securityScore} className="w-16" />
                            <span className={`font-semibold ${getSecurityScoreColor(user.securityScore)}`}>
                              {user.securityScore}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {user.effectivePermissions.length} permissions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.timeBasedPermissionCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {user.timeBasedPermissionCount}
                              </Badge>
                            )}
                            {user.delegationCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Share2 className="w-3 h-3 mr-1" />
                                {user.delegationCount}
                              </Badge>
                            )}
                            {user.alertCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {user.alertCount}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {user.lastActivity.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Hierarchy Visualization</CardTitle>
              <CardDescription>
                Hierarchical role structure with inheritance patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleHierarchies
                  .filter(h => h.level === 1)
                  .map(hierarchy => (
                    <div key={hierarchy.roleId} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="default" className="bg-purple-100 text-purple-800">
                          Level {hierarchy.level}
                        </Badge>
                        <h3 className="font-semibold text-lg">
                          {SYSTEM_ROLES.find(r => r.id === hierarchy.roleId)?.displayName}
                        </h3>
                        <Badge variant="outline">
                          {hierarchy.inheritanceType}
                        </Badge>
                      </div>

                      {hierarchy.childRoleIds.length > 0 && (
                        <div className="ml-6 space-y-2">
                          {hierarchy.childRoleIds.map(childId => {
                            const childHierarchy = roleHierarchies.find(h => h.roleId === childId);
                            const childRole = SYSTEM_ROLES.find(r => r.id === childId);
                            return (
                              <div key={childId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                <Badge variant="secondary" className="text-xs">
                                  Level {childHierarchy?.level}
                                </Badge>
                                <span>{childRole?.displayName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {childHierarchy?.inheritanceType}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time-based Permissions Tab */}
        <TabsContent value="time-based" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Time-based Permission</CardTitle>
              <CardDescription>
                Grant permissions that are active only during specific time periods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeUserId">User</Label>
                  <Select value={newTimeBasedPermission.userId} onValueChange={(value) =>
                    setNewTimeBasedPermission(prev => ({ ...prev, userId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timePermissionId">Permission</Label>
                  <Select value={newTimeBasedPermission.permissionId} onValueChange={(value) =>
                    setNewTimeBasedPermission(prev => ({ ...prev, permissionId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_PERMISSIONS.map(permission => (
                        <SelectItem key={permission.id} value={permission.id}>
                          {permission.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newTimeBasedPermission.startTime}
                    onChange={(e) => setNewTimeBasedPermission(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newTimeBasedPermission.endTime}
                    onChange={(e) => setNewTimeBasedPermission(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newTimeBasedPermission.expiresAt}
                    onChange={(e) => setNewTimeBasedPermission(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Days of Week</Label>
                  <div className="flex gap-2 mt-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <Button
                        key={day}
                        variant={newTimeBasedPermission.dayOfWeek.includes(index) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newDays = newTimeBasedPermission.dayOfWeek.includes(index)
                            ? newTimeBasedPermission.dayOfWeek.filter(d => d !== index)
                            : [...newTimeBasedPermission.dayOfWeek, index];
                          setNewTimeBasedPermission(prev => ({ ...prev, dayOfWeek: newDays }));
                        }}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleCreateTimeBasedPermission} className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                Create Time-based Permission
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditional Permissions Tab */}
        <TabsContent value="conditional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Conditional Permission</CardTitle>
              <CardDescription>
                Grant permissions based on specific conditions like IP address, device, or location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condUserId">User</Label>
                  <Select value={newConditionalPermission.userId} onValueChange={(value) =>
                    setNewConditionalPermission(prev => ({ ...prev, userId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condPermissionId">Permission</Label>
                  <Select value={newConditionalPermission.permissionId} onValueChange={(value) =>
                    setNewConditionalPermission(prev => ({ ...prev, permissionId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_PERMISSIONS.map(permission => (
                        <SelectItem key={permission.id} value={permission.id}>
                          {permission.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="conditionType">Condition Type</Label>
                  <Select value={newConditionalPermission.conditionType} onValueChange={(value) =>
                    setNewConditionalPermission(prev => ({ ...prev, conditionType: value as typeof newConditionalPermission.conditionType }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ip_address">IP Address</SelectItem>
                      <SelectItem value="device_id">Device ID</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="mfa_verified">MFA Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="operator">Operator</Label>
                  <Select value={newConditionalPermission.operator} onValueChange={(value) =>
                    setNewConditionalPermission(prev => ({ ...prev, operator: value as typeof newConditionalPermission.operator }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condValue">Value</Label>
                  <Input
                    id="condValue"
                    value={newConditionalPermission.value}
                    onChange={(e) => setNewConditionalPermission(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter condition value"
                  />
                </div>

                <div>
                  <Label htmlFor="condDescription">Description</Label>
                  <Input
                    id="condDescription"
                    value={newConditionalPermission.description}
                    onChange={(e) => setNewConditionalPermission(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the condition"
                  />
                </div>
              </div>

              <Button onClick={handleCreateConditionalPermission} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Create Conditional Permission
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delegation Tab */}
        <TabsContent value="delegation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Permission Delegation</CardTitle>
              <CardDescription>
                Delegate permissions from one user to another with time limits and usage constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delegatorUserId">Delegator (From)</Label>
                  <Select value={newDelegation.delegatorUserId} onValueChange={(value) =>
                    setNewDelegation(prev => ({ ...prev, delegatorUserId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delegator" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="delegateUserId">Delegate (To)</Label>
                  <Select value={newDelegation.delegateUserId} onValueChange={(value) =>
                    setNewDelegation(prev => ({ ...prev, delegateUserId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delegate" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="delegationExpiresAt">Expires At</Label>
                  <Input
                    id="delegationExpiresAt"
                    type="datetime-local"
                    value={newDelegation.expiresAt}
                    onChange={(e) => setNewDelegation(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxUsage">Max Usage Count</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    min="1"
                    value={newDelegation.maxUsage}
                    onChange={(e) => setNewDelegation(prev => ({ ...prev, maxUsage: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label>Permissions to Delegate</Label>
                <div className="border rounded p-3 max-h-48 overflow-y-auto mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {SYSTEM_PERMISSIONS.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={newDelegation.permissionIds.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewDelegation(prev => ({
                                ...prev,
                                permissionIds: [...prev.permissionIds, permission.id]
                              }));
                            } else {
                              setNewDelegation(prev => ({
                                ...prev,
                                permissionIds: prev.permissionIds.filter(p => p !== permission.id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={permission.id} className="text-sm">
                          {permission.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleCreateDelegation} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Create Permission Delegation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>
                  Real-time security monitoring and threat detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>No security alerts - system secure</p>
                    </div>
                  ) : (
                    securityAlerts.slice(0, 5).map(alert => (
                      <div key={alert.id} className={`p-3 rounded border ${getAlertSeverityColor(alert.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={getAlertSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs">
                            {alert.createdAt.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs mt-1">User: {alert.userId}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permission Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Permission Usage Analytics</CardTitle>
                <CardDescription>
                  Analyze permission usage patterns and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permissionAnalytics.slice(0, 5).map(analytics => (
                    <div key={`${analytics.userId}_${analytics.permissionId}`} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {SYSTEM_PERMISSIONS.find(p => p.id === analytics.permissionId)?.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {analytics.usageCount} uses
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>User: {users.find(u => u.id === analytics.userId)?.displayName}</p>
                        <p>Last used: {analytics.lastUsed.toLocaleString()}</p>
                        <p>Security score: {analytics.suspiciousActivityScore}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedRBACDashboard;
