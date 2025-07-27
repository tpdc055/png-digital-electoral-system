import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  UserPlus,
  Users,
  Shield,
  Settings,
  LogOut,
  User as UserIcon,
  MapPin,
  Clock,
  Vote,
  UsersIcon,
  BarChart3,
  AlertCircle,
  Globe,
  TestTube,
  Smartphone,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

import { CitizenRegistrationForm } from './CitizenRegistrationForm';
import { OfflineIndicator } from './OfflineIndicator';
import EnhancedAdminControls from './EnhancedAdminControls';
import AdminRBACManager from './AdminRBACManager';
import EnhancedRBACDashboard from './EnhancedRBACDashboard';
import { SyncPrompt } from './SyncPrompt';
import { BackupManager } from './BackupManager';
import UserManagement from './UserManagement';
import { CandidateManagement } from './CandidateManagement';
import ConstituencyBasedVoting from './ConstituencyBasedVoting';
import ElectionConfigurationConsole from './ElectionConfigurationConsole';
import ElectionTestingDashboard from './ElectionTestingDashboard';
import DeviceManagement from './DeviceManagement';
import { authService } from '../services/authService';

export const AuthenticatedApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('register');
  const currentUser = authService.getCurrentUser();
  const currentProfile = authService.getCurrentProfile();

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
      console.error('Sign out error:', error);
    }
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'First login';
    return `${new Date(dateString).toLocaleDateString()} at ${new Date(dateString).toLocaleTimeString()}`;
  };

  const getAvailableTabs = () => {
    const tabs = [];

    // Register tab - available to registration officers and admins
    if (authService.hasPermission('citizen.create') || authService.hasRole('system_administrator') || authService.hasRole('registration_officer') || authService.hasRole('field_enumerator')) {
      tabs.push('register');
    }

    // Electoral tabs - available to appropriate roles
    if (authService.hasRole('system_administrator') || authService.hasRole('electoral_commissioner')) {
      tabs.push('candidates');
      tabs.push('elections'); // New elections configuration tab
      tabs.push('testing'); // Election testing dashboard
      tabs.push('devices'); // Device management
    }

    // Voting tab - available to all authenticated users who are eligible voters
    tabs.push('voting');

    // Admin dashboard - available to all authenticated users (read access varies by role)
    tabs.push('admin');

    // Backup tab - available to all users (functionality varies by role)
    tabs.push('backup');

    // User management - only for admins
    if (authService.hasRole('system_administrator')) {
      tabs.push('users');
      tabs.push('rbac'); // Role-Based Access Control
      tabs.push('enhanced-rbac'); // Enhanced RBAC Dashboard
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();

  // Set default tab - respect user's current selection
  React.useEffect(() => {
    // Only switch tabs if current tab is not available
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 relative">
      {/* Traditional PNG Pattern Background */}
      <div className="traditional-pattern-bg" />

      <OfflineIndicator />
      <SyncPrompt />

      {/* Enhanced PNG Header with Electoral System Branding */}
      <header className="png-header shadow-lg border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* PNG Bird of Paradise Logo */}
              <div className="png-logo rounded-full border-4 border-yellow-400 shadow-lg" />
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  🇵🇬 PNG Digital Electoral System
                </h1>
                <p className="text-lg text-yellow-100 font-semibold">
                  Citizen Registration & Digital Voting Platform
                </p>
                <div className="flex items-center gap-4 text-sm text-yellow-200 italic">
                  <span>🗳️ 2027 Election Ready</span>
                  <span>•</span>
                  <span>21 Provinces</span>
                  <span>•</span>
                  <span>Secure & Transparent</span>
                </div>
              </div>
            </div>

            {/* System Status and User Profile */}
            <div className="flex items-center gap-4">
              {/* Electoral System Status Badges */}
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-semibold">
                  ✓ Electoral Ready
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-semibold">
                  🗳️ Voting Enabled
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">
                  📱 Offline Capable
                </Badge>
              </div>

              {/* Current User Info */}
              <Card className="bg-white/10 border-yellow-300">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 text-white">
                    <UserIcon className="h-8 w-8 bg-yellow-400 text-green-800 rounded-full p-1" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-yellow-100">
                          {authService.getUserDisplayName()}
                        </span>
                        <Badge variant="outline" className={`text-xs ${
                          currentProfile?.role === 'admin'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : currentProfile?.role === 'enumerator'
                            ? 'bg-orange-100 text-orange-800 border-orange-300'
                            : 'bg-green-100 text-green-800 border-green-300'
                        }`}>
                          {authService.getUserRoleDisplayName()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-yellow-200">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {currentProfile?.province}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastLogin(currentProfile?.lastLoginAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      size="sm"
                      className="bg-white/20 border-yellow-300 text-yellow-100 hover:bg-white/30"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Enhanced Tab Navigation */}
          <TabsList className={`png-tabs grid w-full max-w-7xl mx-auto mb-8 shadow-lg border-2 border-yellow-400 ${
            availableTabs.length >= 11 ? 'grid-cols-11' :
            availableTabs.length === 10 ? 'grid-cols-10' :
            availableTabs.length === 9 ? 'grid-cols-9' :
            availableTabs.length === 8 ? 'grid-cols-8' :
            availableTabs.length === 7 ? 'grid-cols-7' :
            availableTabs.length === 6 ? 'grid-cols-6' :
            availableTabs.length === 5 ? 'grid-cols-5' :
            availableTabs.length === 4 ? 'grid-cols-4' :
            availableTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          }`}>
            {availableTabs.includes('register') && (
              <TabsTrigger
                value="register"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <UserPlus className="h-5 w-5" />
                <span className="text-sm">Register</span>
                <span className="text-xs opacity-75">Citizens</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('candidates') && (
              <TabsTrigger
                value="candidates"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <UsersIcon className="h-5 w-5" />
                <span className="text-sm">Candidates</span>
                <span className="text-xs opacity-75">Management</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('elections') && (
              <TabsTrigger
                value="elections"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm">Elections</span>
                <span className="text-xs opacity-75">Configuration</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('testing') && (
              <TabsTrigger
                value="testing"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <TestTube className="h-5 w-5" />
                <span className="text-sm">Testing</span>
                <span className="text-xs opacity-75">System</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('devices') && (
              <TabsTrigger
                value="devices"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-sm">Devices</span>
                <span className="text-xs opacity-75">Hardware</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('voting') && (
              <TabsTrigger
                value="voting"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <Vote className="h-5 w-5" />
                <span className="text-sm">Digital</span>
                <span className="text-xs opacity-75">Voting</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('admin') && (
              <TabsTrigger
                value="admin"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm">Dashboard</span>
                <span className="text-xs opacity-75">Analytics</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('backup') && (
              <TabsTrigger
                value="backup"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm">Backup</span>
                <span className="text-xs opacity-75">Security</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('users') && (
              <TabsTrigger
                value="users"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm">Users</span>
                <span className="text-xs opacity-75">Management</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('rbac') && (
              <TabsTrigger
                value="rbac"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm">RBAC</span>
                <span className="text-xs opacity-75">Access Control</span>
              </TabsTrigger>
            )}

            {availableTabs.includes('enhanced-rbac') && (
              <TabsTrigger
                value="enhanced-rbac"
                className="flex flex-col items-center gap-1 p-4 data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900 font-semibold transition-all duration-300"
              >
                <Zap className="h-5 w-5" />
                <span className="text-sm">Enhanced</span>
                <span className="text-xs opacity-75">RBAC</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Content */}
          {availableTabs.includes('register') && (
            <TabsContent value="register" className="mt-0">
              <CitizenRegistrationForm />
            </TabsContent>
          )}

          {availableTabs.includes('candidates') && (
            <TabsContent value="candidates" className="mt-0">
              <CandidateManagement />
            </TabsContent>
          )}

          {availableTabs.includes('elections') && (
            <TabsContent value="elections" className="mt-0">
              <ElectionConfigurationConsole />
            </TabsContent>
          )}

          {availableTabs.includes('testing') && (
            <TabsContent value="testing" className="mt-0">
              <ElectionTestingDashboard />
            </TabsContent>
          )}

          {availableTabs.includes('devices') && (
            <TabsContent value="devices" className="mt-0">
              <DeviceManagement />
            </TabsContent>
          )}

          {availableTabs.includes('voting') && (
            <TabsContent value="voting" className="mt-0">
              <ConstituencyBasedVoting />
            </TabsContent>
          )}

          {availableTabs.includes('admin') && (
            <TabsContent value="admin" className="mt-0">
              <EnhancedAdminControls />
            </TabsContent>
          )}

          {availableTabs.includes('backup') && (
            <TabsContent value="backup" className="mt-0">
              <BackupManager />
            </TabsContent>
          )}

          {availableTabs.includes('users') && (
            <TabsContent value="users" className="mt-0">
              <UserManagement />
            </TabsContent>
          )}

          {availableTabs.includes('rbac') && (
            <TabsContent value="rbac" className="mt-0">
              <AdminRBACManager />
            </TabsContent>
          )}

          {availableTabs.includes('enhanced-rbac') && (
            <TabsContent value="enhanced-rbac" className="mt-0">
              <EnhancedRBACDashboard />
            </TabsContent>
          )}
        </Tabs>

        {/* Enhanced Role-based Access Notice */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Current Access Level: {authService.getUserRoleDisplayName()}
                  </h3>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    {currentProfile?.province}
                  </Badge>
                </div>

                <div className="text-sm text-blue-800 space-y-2">
                  <p>
                    {currentProfile?.role === 'admin'
                      ? 'You have full system access including user management, candidate management, election configuration, and all 21 provinces.'
                      : currentProfile?.role === 'enumerator'
                      ? `You can register citizens, view records for ${currentProfile.province} province, and participate in the electoral process.`
                      : `You have read-only access to records for ${currentProfile?.province} province and can participate in voting.`
                    }
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                    <span className="flex items-center gap-2">
                      <Vote className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">Electoral System Active</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-700 font-medium">Multi-Role Support</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      <span className="text-red-700 font-medium">Secure & Audited</span>
                    </span>
                    {authService.hasRole('admin') && (
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700 font-medium">Election Configuration</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Electoral System Status Card */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  🇵🇬 PNG 2027 Election System Status
                </h3>
                <p className="text-green-700 text-sm mb-3">
                  Digital voting system operational • Candidate registration active • Biometric verification enabled
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-800">21/21</div>
                    <div className="text-green-600">Provinces</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-800">Active</div>
                    <div className="text-green-600">Registration</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-800">Secure</div>
                    <div className="text-green-600">Voting</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-800">Ready</div>
                    <div className="text-green-600">2027 Election</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Enhanced PNG Footer */}
      <footer className="png-secondary border-t-4 border-yellow-400 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-white">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-lg font-semibold">
                © 2025 Independent State of Papua New Guinea
              </p>
              <p className="text-yellow-200">
                Digital Electoral System - Census & Electoral Commission
              </p>
              <p className="text-sm text-green-200 mt-1">
                Logged in as: {authService.getUserDisplayName()} • {currentProfile?.province} • {authService.getUserRoleDisplayName()}
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-yellow-100 font-medium">
                Electoral System v4.0 - 2027 Election Ready
              </p>
              <p className="text-sm text-green-200">
                🗳️ Digital Voting • 👤 Biometric ID • 🔒 Blockchain Security • 📱 Offline Capable
              </p>
              <div className="flex items-center justify-center md:justify-end gap-3 mt-2">
                <span className="text-xs bg-yellow-400 text-green-900 px-2 py-1 rounded-full font-bold">
                  🏛️ Electoral Commission Certified
                </span>
                <span className="text-xs bg-green-400 text-green-900 px-2 py-1 rounded-full font-bold">
                  🔒 PNG Data Protected
                </span>
                <span className="text-xs bg-red-400 text-red-900 px-2 py-1 rounded-full font-bold">
                  🗳️ {currentProfile?.role?.toUpperCase()} ACCESS
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
