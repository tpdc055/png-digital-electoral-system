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
import { toast } from 'sonner';
import {
  Shield,
  Users,
  Key,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
  Crown,
  Zap,
  Globe,
  Database,
  Vote,
  Smartphone
} from 'lucide-react';

import { rbac, SYSTEM_ROLES, SYSTEM_PERMISSIONS, type Role, type Permission, type UserRole } from '../services/roleBasedAccess';
import { authService } from '../services/authService';

interface SystemUser {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  assignedRoles: UserRole[];
  effectivePermissions: string[];
  province?: string;
  constituency?: string;
}

interface RoleAssignment {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  constraints?: {
    provinces?: string[];
    constituencies?: string[];
    devices?: string[];
  };
}

interface ModuleAccess {
  module: string;
  displayName: string;
  description: string;
  icon: string;
  permissions: Permission[];
  requiredRoles: string[];
}

const AdminRBACManager: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<ModuleAccess[]>([]);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    province: '',
    constituency: '',
    initialRole: ''
  });

  // New role form state
  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    level: 100,
    permissions: [] as string[]
  });

  const currentUser = authService.getCurrentProfile();

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = () => {
    // Load system users (mock data - in production, fetch from database)
    const mockUsers: SystemUser[] = [
      {
        id: 'user-001',
        email: 'admin@electoral.png.gov',
        displayName: 'System Administrator',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2024-01-01'),
        assignedRoles: rbac.getUserRoles('user-001'),
        effectivePermissions: rbac.getUserPermissions('user-001').map(p => p.id),
        province: 'National Capital District'
      },
      {
        id: 'user-002',
        email: 'commissioner@electoral.png.gov',
        displayName: 'Electoral Commissioner',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2024-01-05'),
        assignedRoles: rbac.getUserRoles('user-002'),
        effectivePermissions: rbac.getUserPermissions('user-002').map(p => p.id),
        province: 'National Capital District'
      },
      {
        id: 'user-003',
        email: 'registration@electoral.png.gov',
        displayName: 'Registration Officer',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2024-01-10'),
        assignedRoles: rbac.getUserRoles('user-003'),
        effectivePermissions: rbac.getUserPermissions('user-003').map(p => p.id),
        province: 'National Capital District',
        constituency: 'Port Moresby South'
      }
    ];

    // Assign some roles for demo
    rbac.assignRole('user-001', 'system_administrator', currentUser?.uid || 'system');
    rbac.assignRole('user-002', 'electoral_commissioner', currentUser?.uid || 'system');
    rbac.assignRole('user-003', 'registration_officer', currentUser?.uid || 'system', {
      provinces: ['National Capital District'],
      constituencies: ['Port Moresby South']
    });

    setUsers(mockUsers);
    setRoles(SYSTEM_ROLES);
    setPermissions(SYSTEM_PERMISSIONS);

    // Define system modules
    const systemModules: ModuleAccess[] = [
      {
        module: 'registration',
        displayName: 'Citizen Registration',
        description: 'Register and manage citizen records with biometric data',
        icon: 'UserPlus',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'registration'),
        requiredRoles: ['system_administrator', 'registration_officer', 'field_enumerator']
      },
      {
        module: 'candidates',
        displayName: 'Candidate Management',
        description: 'Manage election candidates and their registration',
        icon: 'Users',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'candidates'),
        requiredRoles: ['system_administrator', 'electoral_commissioner']
      },
      {
        module: 'elections',
        displayName: 'Election Configuration',
        description: 'Configure and manage election settings',
        icon: 'Vote',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'elections'),
        requiredRoles: ['system_administrator', 'electoral_commissioner']
      },
      {
        module: 'voting',
        displayName: 'Digital Voting',
        description: 'LPV voting interface and ballot management',
        icon: 'Globe',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'voting'),
        requiredRoles: ['system_administrator', 'electoral_commissioner', 'tally_officer', 'voter']
      },
      {
        module: 'tallying',
        displayName: 'Vote Tallying',
        description: 'Secure LPV counting and result verification',
        icon: 'BarChart3',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'tallying'),
        requiredRoles: ['system_administrator', 'electoral_commissioner', 'tally_officer']
      },
      {
        module: 'results',
        displayName: 'Election Results',
        description: 'View and publish election results',
        icon: 'Crown',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'results'),
        requiredRoles: ['system_administrator', 'electoral_commissioner', 'observer']
      },
      {
        module: 'devices',
        displayName: 'Device Management',
        description: 'Manage electoral devices and hardware',
        icon: 'Smartphone',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'devices'),
        requiredRoles: ['system_administrator', 'it_support']
      },
      {
        module: 'testing',
        displayName: 'System Testing',
        description: 'Run electoral system tests and monitoring',
        icon: 'Zap',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'testing'),
        requiredRoles: ['system_administrator', 'it_support']
      },
      {
        module: 'administration',
        displayName: 'System Administration',
        description: 'User management and system configuration',
        icon: 'Settings',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'administration'),
        requiredRoles: ['system_administrator']
      },
      {
        module: 'backup',
        displayName: 'Backup & Security',
        description: 'Data backup and security management',
        icon: 'Shield',
        permissions: SYSTEM_PERMISSIONS.filter(p => p.module === 'backup'),
        requiredRoles: ['system_administrator', 'it_support']
      }
    ];

    setModules(systemModules);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.displayName || !newUser.initialRole) {
      toast.error('Please fill in all required fields');
      return;
    }

    const userId = `user-${Date.now()}`;
    const user: SystemUser = {
      id: userId,
      email: newUser.email,
      displayName: newUser.displayName,
      isActive: true,
      createdAt: new Date(),
      assignedRoles: [],
      effectivePermissions: [],
      province: newUser.province || undefined,
      constituency: newUser.constituency || undefined
    };

    // Assign initial role
    rbac.assignRole(userId, newUser.initialRole, currentUser?.uid || 'admin');
    user.assignedRoles = rbac.getUserRoles(userId);
    user.effectivePermissions = rbac.getUserPermissions(userId).map(p => p.id);

    setUsers(prev => [...prev, user]);
    setNewUser({ email: '', displayName: '', province: '', constituency: '', initialRole: '' });
    setIsCreateUserOpen(false);

    toast.success(`User ${user.displayName} created successfully`);
  };

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.displayName || newRole.permissions.length === 0) {
      toast.error('Please fill in all required fields and select permissions');
      return;
    }

    const role: Role = {
      id: newRole.name.toLowerCase().replace(/\s+/g, '_'),
      name: newRole.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: newRole.displayName,
      description: newRole.description,
      level: newRole.level,
      permissions: newRole.permissions,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setRoles(prev => [...prev, role]);
    setNewRole({ name: '', displayName: '', description: '', level: 100, permissions: [] });
    setIsCreateRoleOpen(false);

    toast.success(`Role ${role.displayName} created successfully`);
  };

  const handleAssignRole = (userId: string, roleId: string) => {
    rbac.assignRole(userId, roleId, currentUser?.uid || 'admin');

    // Update user's effective permissions
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? {
            ...user,
            assignedRoles: rbac.getUserRoles(userId),
            effectivePermissions: rbac.getUserPermissions(userId).map(p => p.id)
          }
        : user
    ));

    const role = roles.find(r => r.id === roleId);
    toast.success(`Role ${role?.displayName} assigned successfully`);
  };

  const handleRemoveRole = (userId: string, roleId: string) => {
    rbac.removeRole(userId, roleId);

    setUsers(prev => prev.map(user =>
      user.id === userId
        ? {
            ...user,
            assignedRoles: rbac.getUserRoles(userId),
            effectivePermissions: rbac.getUserPermissions(userId).map(p => p.id)
          }
        : user
    ));

    const role = roles.find(r => r.id === roleId);
    toast.success(`Role ${role?.displayName} removed successfully`);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? { ...user, isActive: !user.isActive }
        : user
    ));

    const user = users.find(u => u.id === userId);
    toast.success(`User ${user?.displayName} ${user?.isActive ? 'deactivated' : 'activated'}`);
  };

  const getModuleIcon = (iconName: string) => {
    const icons = {
      UserPlus: <UserPlus className="w-4 h-4" />,
      Users: <Users className="w-4 h-4" />,
      Vote: <Vote className="w-4 h-4" />,
      Globe: <Globe className="w-4 h-4" />,
      BarChart3: <Database className="w-4 h-4" />,
      Crown: <Crown className="w-4 h-4" />,
      Smartphone: <Smartphone className="w-4 h-4" />,
      Zap: <Zap className="w-4 h-4" />,
      Settings: <Settings className="w-4 h-4" />,
      Shield: <Shield className="w-4 h-4" />
    };
    return icons[iconName as keyof typeof icons] || <Settings className="w-4 h-4" />;
  };

  const canUserAccessModule = (user: SystemUser, module: ModuleAccess) => {
    return module.permissions.some(permission =>
      user.effectivePermissions.includes(permission.id)
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' ||
                       user.assignedRoles.some(role => role.roleId === filterRole);

    const targetModule = modules.find(m => m.module === filterModule);
    const matchesModule = filterModule === 'all' ||
                         (targetModule && canUserAccessModule(user, targetModule));

    return matchesSearch && matchesRole && matchesModule;
  });

  if (!authService.hasRole('system_administrator')) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. System administrator privileges required to manage user roles and permissions.
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
          <h1 className="text-3xl font-bold">Role-Based Access Control</h1>
          <p className="text-gray-600 mt-2">
            Manage user roles, permissions, and module access across the electoral system
          </p>
        </div>

        <div className="flex gap-3">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the electoral system with initial role assignment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@electoral.png.gov"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={newUser.displayName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={newUser.province}
                    onChange={(e) => setNewUser(prev => ({ ...prev, province: e.target.value }))}
                    placeholder="Province assignment"
                  />
                </div>
                <div>
                  <Label htmlFor="constituency">Constituency</Label>
                  <Input
                    id="constituency"
                    value={newUser.constituency}
                    onChange={(e) => setNewUser(prev => ({ ...prev, constituency: e.target.value }))}
                    placeholder="Constituency assignment"
                  />
                </div>
                <div>
                  <Label htmlFor="initialRole">Initial Role *</Label>
                  <Select value={newUser.initialRole} onValueChange={(value) => setNewUser(prev => ({ ...prev, initialRole: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select initial role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsCreateUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleCreateUser}>
                    Create User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Role</DialogTitle>
                <DialogDescription>
                  Define a new role with specific permissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label htmlFor="roleName">Role Name *</Label>
                  <Input
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="role_name"
                  />
                </div>
                <div>
                  <Label htmlFor="roleDisplayName">Display Name *</Label>
                  <Input
                    id="roleDisplayName"
                    value={newRole.displayName}
                    onChange={(e) => setNewRole(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Role Display Name"
                  />
                </div>
                <div>
                  <Label htmlFor="roleDescription">Description</Label>
                  <Textarea
                    id="roleDescription"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Role description and responsibilities"
                  />
                </div>
                <div>
                  <Label htmlFor="roleLevel">Access Level (1-1000)</Label>
                  <Input
                    id="roleLevel"
                    type="number"
                    min="1"
                    max="1000"
                    value={newRole.level}
                    onChange={(e) => setNewRole(prev => ({ ...prev, level: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Permissions *</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3 mt-2">
                    {permissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={newRole.permissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewRole(prev => ({
                                ...prev,
                                permissions: [...prev.permissions, permission.id]
                              }));
                            } else {
                              setNewRole(prev => ({
                                ...prev,
                                permissions: prev.permissions.filter(p => p !== permission.id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={permission.id} className="text-xs">
                          {permission.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsCreateRoleOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleCreateRole}>
                    Create Role
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Roles</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter(r => r.isSystem).length} system, {roles.filter(r => !r.isSystem).length} custom
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {modules.length} modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Modules</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground">
              Electoral system modules
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="modules">Module Access</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>User Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="filterRole">Filter by Role</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filterModule">Filter by Module Access</Label>
                  <Select value={filterModule} onValueChange={setFilterModule}>
                    <SelectTrigger>
                      <SelectValue placeholder="All modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {modules.map(module => (
                        <SelectItem key={module.module} value={module.module}>
                          {module.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Info</TableHead>
                      <TableHead>Assigned Roles</TableHead>
                      <TableHead>Module Access</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{user.displayName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">
                              Joined: {user.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.assignedRoles.map((roleAssignment) => {
                              const role = roles.find(r => r.id === roleAssignment.roleId);
                              return (
                                <Badge
                                  key={roleAssignment.roleId}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {role?.displayName}
                                </Badge>
                              );
                            })}
                            {user.assignedRoles.length === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                No roles assigned
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {modules.filter(module => canUserAccessModule(user, module)).map(module => (
                              <Badge
                                key={module.module}
                                className="text-xs bg-green-100 text-green-800"
                              >
                                {getModuleIcon(module.icon)}
                                <span className="ml-1">{module.displayName}</span>
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.province && <div>{user.province}</div>}
                            {user.constituency && <div className="text-gray-500">{user.constituency}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Manage User: {user.displayName}</DialogTitle>
                                  <DialogDescription>
                                    Assign or remove roles and manage permissions
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedUser && (
                                  <div className="space-y-6">
                                    {/* Current Roles */}
                                    <div>
                                      <h4 className="font-semibold mb-3">Current Roles</h4>
                                      <div className="space-y-2">
                                        {selectedUser.assignedRoles.map((roleAssignment) => {
                                          const role = roles.find(r => r.id === roleAssignment.roleId);
                                          return (
                                            <div key={roleAssignment.roleId} className="flex items-center justify-between p-3 border rounded">
                                              <div>
                                                <span className="font-medium">{role?.displayName}</span>
                                                <p className="text-sm text-gray-600">{role?.description}</p>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveRole(selectedUser.id, roleAssignment.roleId)}
                                                className="text-red-600"
                                              >
                                                <UserMinus className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Assign New Role */}
                                    <div>
                                      <h4 className="font-semibold mb-3">Assign New Role</h4>
                                      <div className="grid grid-cols-2 gap-3">
                                        {roles
                                          .filter(role => !selectedUser.assignedRoles.some(ur => ur.roleId === role.id))
                                          .map(role => (
                                            <Card key={role.id} className="cursor-pointer hover:bg-blue-50" onClick={() => handleAssignRole(selectedUser.id, role.id)}>
                                              <CardContent className="p-3">
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <div className="font-medium">{role.displayName}</div>
                                                    <div className="text-xs text-gray-600">{role.permissions.length} permissions</div>
                                                  </div>
                                                  <Plus className="w-4 h-4 text-blue-600" />
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                      </div>
                                    </div>

                                    {/* Effective Permissions */}
                                    <div>
                                      <h4 className="font-semibold mb-3">Effective Permissions</h4>
                                      <div className="max-h-48 overflow-y-auto border rounded p-3">
                                        <div className="grid grid-cols-2 gap-1">
                                          {selectedUser.effectivePermissions.map(permissionId => {
                                            const permission = permissions.find(p => p.id === permissionId);
                                            return (
                                              <Badge key={permissionId} variant="outline" className="text-xs">
                                                {permission?.name}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={user.isActive ? "text-red-600" : "text-green-600"}
                            >
                              {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                Manage role definitions and their associated permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {roles.map(role => (
                  <Card key={role.id} className={role.isSystem ? "border-blue-200 bg-blue-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{role.displayName}</h3>
                            <Badge variant={role.isSystem ? "default" : "secondary"}>
                              {role.isSystem ? "System" : "Custom"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Level {role.level}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Permissions ({role.permissions.length}):
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.permissions.slice(0, 5).map(permissionId => {
                                const permission = permissions.find(p => p.id === permissionId);
                                return (
                                  <Badge key={permissionId} variant="outline" className="text-xs">
                                    {permission?.name}
                                  </Badge>
                                );
                              })}
                              {role.permissions.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.permissions.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Role Details: {role.displayName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Description</Label>
                                  <p className="text-sm">{role.description}</p>
                                </div>
                                <div>
                                  <Label>Access Level</Label>
                                  <p className="text-sm">{role.level} / 1000</p>
                                </div>
                                <div>
                                  <Label>Permissions ({role.permissions.length})</Label>
                                  <div className="max-h-48 overflow-y-auto border rounded p-3 mt-2">
                                    <div className="grid grid-cols-1 gap-1">
                                      {role.permissions.map(permissionId => {
                                        const permission = permissions.find(p => p.id === permissionId);
                                        return (
                                          <div key={permissionId} className="text-sm flex items-center gap-2">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            {permission?.name}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {!role.isSystem && (
                            <Button variant="outline" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
              <CardDescription>
                All available permissions organized by module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {modules.map(module => (
                  <div key={module.module}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      {getModuleIcon(module.icon)}
                      {module.displayName}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {module.permissions.map(permission => (
                        <Card key={permission.id} className="border border-gray-200">
                          <CardContent className="p-3">
                            <div className="font-medium text-sm">{permission.name}</div>
                            <div className="text-xs text-gray-600 mt-1">{permission.description}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {permission.action}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {permission.resource}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Access Tab */}
        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Access Overview</CardTitle>
              <CardDescription>
                See which users have access to each system module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {modules.map(module => (
                  <Card key={module.module}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getModuleIcon(module.icon)}
                        {module.displayName}
                      </CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Required Roles:</h4>
                          <div className="flex flex-wrap gap-2">
                            {module.requiredRoles.map(roleId => {
                              const role = roles.find(r => r.id === roleId);
                              return (
                                <Badge key={roleId} variant="outline">
                                  {role?.displayName}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Users with Access:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {users
                              .filter(user => canUserAccessModule(user, module))
                              .map(user => (
                                <div key={user.id} className="flex items-center gap-2 p-2 border rounded">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-sm">{user.displayName}</span>
                                </div>
                              ))}
                          </div>
                          {users.filter(user => canUserAccessModule(user, module)).length === 0 && (
                            <p className="text-sm text-gray-500">No users currently have access to this module</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRBACManager;
