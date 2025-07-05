import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  UserPlus,
  Users,
  Edit,
  Trash2,
  Shield,
  Key,
  Mail,
  MapPin,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

import { authService, type UserProfile, type RegisterUserData, type UserRole } from '../services/authService';
import { PNG_PROVINCES } from '../types/citizen';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState<RegisterUserData>({
    email: '',
    password: '',
    displayName: '',
    role: 'viewer',
    province: '',
    district: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (authService.hasRole('admin')) {
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from Firestore users collection
      // For now, we'll show a placeholder implementation
      const mockUsers: UserProfile[] = [
        {
          uid: '1',
          email: 'admin@census.gov.pg',
          displayName: 'System Administrator',
          role: 'admin',
          province: 'National Capital District',
          permissions: ['read:all_citizens', 'write:all_citizens', 'manage:users'],
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          lastLoginAt: '2025-01-22T10:30:00Z'
        },
        {
          uid: '2',
          email: 'enumerator.morobe@census.gov.pg',
          displayName: 'John Kambu',
          role: 'enumerator',
          province: 'Morobe',
          district: 'Lae Urban',
          permissions: ['read:province_citizens', 'write:province_citizens'],
          isActive: true,
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-20T00:00:00Z',
          lastLoginAt: '2025-01-22T08:45:00Z'
        },
        {
          uid: '3',
          email: 'viewer.hela@census.gov.pg',
          displayName: 'Mary Temu',
          role: 'viewer',
          province: 'Hela',
          permissions: ['read:province_citizens'],
          isActive: true,
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-18T00:00:00Z',
          lastLoginAt: '2025-01-21T14:20:00Z'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load user list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.displayName || !newUser.province) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreatingUser(true);
    try {
      await authService.registerUser(newUser, authService.getCurrentUser()?.uid);
      toast.success(`User ${newUser.displayName} created successfully`);

      // Reset form
      setNewUser({
        email: '',
        password: '',
        displayName: '',
        role: 'viewer',
        province: '',
        district: ''
      });
      setShowCreateDialog(false);

      // Reload users
      await loadUsers();
    } catch (error) {
      toast.error(`Failed to create user: ${(error as Error).message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.province.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesProvince = filterProvince === 'all' || user.province === filterProvince;

    return matchesSearch && matchesRole && matchesProvince;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-300';
      case 'enumerator': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'viewer': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' ' +
           new Date(dateString).toLocaleTimeString();
  };

  if (!authService.hasRole('admin')) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You need administrator privileges to access user management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="png-stat-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
            <Badge variant="outline" className="ml-auto">
              {users.length} Total Users
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>User Accounts</span>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="png-button-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-email">Email Address *</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="user@census.gov.pg"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="png-form-field"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Secure password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="png-form-field pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-name">Full Name *</Label>
                    <Input
                      id="new-name"
                      placeholder="John Doe"
                      value={newUser.displayName}
                      onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                      className="png-form-field"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-role">Role *</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}
                    >
                      <SelectTrigger className="png-form-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                        <SelectItem value="enumerator">Enumerator - Data entry</SelectItem>
                        <SelectItem value="admin">Administrator - Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="new-province">Province *</Label>
                    <Select
                      value={newUser.province}
                      onValueChange={(value) => setNewUser({...newUser, province: value})}
                    >
                      <SelectTrigger className="png-form-field">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PNG_PROVINCES.map(province => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="new-district">District</Label>
                    <Input
                      id="new-district"
                      placeholder="Optional district assignment"
                      value={newUser.district || ''}
                      onChange={(e) => setNewUser({...newUser, district: e.target.value})}
                      className="png-form-field"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={isCreatingUser}
                      className="flex-1 png-button-primary"
                    >
                      {isCreatingUser ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create User
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="enumerator">Enumerators</SelectItem>
                <SelectItem value="viewer">Viewers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProvince} onValueChange={setFilterProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {PNG_PROVINCES.map(province => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{user.province}</span>
                          </div>
                          {user.district && (
                            <div className="text-xs text-gray-500">{user.district}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-700 border-red-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatLastLogin(user.lastLoginAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="png-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Administrators</p>
                <p className="text-2xl font-bold text-red-800">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="png-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Enumerators</p>
                <p className="text-2xl font-bold text-orange-800">
                  {users.filter(u => u.role === 'enumerator').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="png-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Viewers</p>
                <p className="text-2xl font-bold text-green-800">
                  {users.filter(u => u.role === 'viewer').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="png-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Active Users</p>
                <p className="text-2xl font-bold text-blue-800">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
