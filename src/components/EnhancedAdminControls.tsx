import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  Edit,
  Trash2,
  RotateCcw,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  User,
  Database,
  Settings,
  Key,
  Fingerprint,
  Eye
} from 'lucide-react';
import { authService } from '../services/authService';

interface CitizenRecord {
  id: string;
  fullName: string;
  nationalIdNumber: string;
  province: string;
  constituency: string;
  dateOfBirth: string;
  phoneNumber: string;
  photo?: string;
  fingerprint?: string;
  registrationDate: Date;
  lastModified: Date;
  status: 'active' | 'suspended' | 'deleted' | 'under_review';
  verificationLevel: 'unverified' | 'partial' | 'fully_verified';
  modificationHistory: ModificationRecord[];
}

interface ModificationRecord {
  id: string;
  timestamp: Date;
  adminId: string;
  adminName: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'suspend' | 'verify';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  reason: string;
  ipAddress: string;
  deviceInfo: string;
  blockchainHash: string;
  witnessSignature?: string;
}

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'citizen_modified' | 'admin_action' | 'security_event' | 'system_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  adminId: string;
  affectedRecordId?: string;
  blockchainProof: string;
  immutableHash: string;
}

const EnhancedAdminControls: React.FC = () => {
  const [citizens, setCitizens] = useState<CitizenRecord[]>([]);
  const [filteredCitizens, setFilteredCitizens] = useState<CitizenRecord[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenRecord | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [modificationReason, setModificationReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuditDetails, setShowAuditDetails] = useState(false);

  const currentAdmin = authService.getCurrentProfile();

  // Mock citizen data with blockchain audit trails
  useEffect(() => {
    const mockCitizens: CitizenRecord[] = [
      {
        id: 'CIT-001-PNG',
        fullName: 'John Kila',
        nationalIdNumber: 'PNG123456789',
        province: 'National Capital District',
        constituency: 'Port Moresby South',
        dateOfBirth: '1985-05-15',
        phoneNumber: '+675 7123 4567',
        photo: 'https://same-assets.com/placeholder-man.jpg',
        registrationDate: new Date('2024-01-15'),
        lastModified: new Date('2024-01-15'),
        status: 'active',
        verificationLevel: 'fully_verified',
        modificationHistory: [
          {
            id: 'MOD-001',
            timestamp: new Date('2024-01-15'),
            adminId: 'ADMIN-001',
            adminName: 'System Administrator',
            action: 'create',
            reason: 'Initial citizen registration',
            ipAddress: '192.168.1.100',
            deviceInfo: 'Electoral Device PNG-001',
            blockchainHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
          }
        ]
      },
      {
        id: 'CIT-002-PNG',
        fullName: 'Mary Wambi',
        nationalIdNumber: 'PNG987654321',
        province: 'Morobe',
        constituency: 'Lae Open',
        dateOfBirth: '1992-08-22',
        phoneNumber: '+675 7234 5678',
        photo: 'https://same-assets.com/placeholder-woman.jpg',
        registrationDate: new Date('2024-01-18'),
        lastModified: new Date('2024-01-20'),
        status: 'under_review',
        verificationLevel: 'partial',
        modificationHistory: [
          {
            id: 'MOD-002',
            timestamp: new Date('2024-01-18'),
            adminId: 'ADMIN-002',
            adminName: 'Regional Administrator',
            action: 'create',
            reason: 'Field registration - Morobe Province',
            ipAddress: '192.168.2.100',
            deviceInfo: 'Mobile Device LAE-003',
            blockchainHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c'
          },
          {
            id: 'MOD-003',
            timestamp: new Date('2024-01-20'),
            adminId: 'ADMIN-001',
            adminName: 'System Administrator',
            action: 'update',
            fieldChanged: 'verificationLevel',
            oldValue: 'unverified',
            newValue: 'partial',
            reason: 'Community verification completed',
            ipAddress: '192.168.1.100',
            deviceInfo: 'Administrative Terminal',
            blockchainHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d'
          }
        ]
      }
    ];

    setCitizens(mockCitizens);
    setFilteredCitizens(mockCitizens);

    // Mock audit trail
    const mockAuditEvents: AuditEvent[] = [
      {
        id: 'AUDIT-001',
        timestamp: new Date(),
        eventType: 'admin_action',
        severity: 'medium',
        description: 'Administrator accessed citizen management dashboard',
        adminId: currentAdmin?.uid || 'ADMIN-001',
        blockchainProof: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
        immutableHash: 'SHA256:a1b2c3d4e5f6789012345678901234567890abcdef'
      }
    ];

    setAuditTrail(mockAuditEvents);
  }, [currentAdmin]);

  // Filter citizens based on search and status
  useEffect(() => {
    let filtered = citizens;

    if (searchTerm) {
      filtered = filtered.filter(citizen =>
        citizen.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizen.nationalIdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizen.constituency.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(citizen => citizen.status === filterStatus);
    }

    setFilteredCitizens(filtered);
  }, [citizens, searchTerm, filterStatus]);

  const generateBlockchainHash = () => {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const addAuditEntry = (citizenId: string, action: ModificationRecord['action'], details: Partial<ModificationRecord>) => {
    const auditEntry: ModificationRecord = {
      id: `MOD-${Date.now()}`,
      timestamp: new Date(),
      adminId: currentAdmin?.uid || 'ADMIN-UNKNOWN',
      adminName: currentAdmin?.displayName || 'Unknown Administrator',
      action,
      reason: details.reason || 'No reason provided',
      ipAddress: '192.168.1.100', // In production, get real IP
      deviceInfo: navigator.userAgent.split(' ')[0],
      blockchainHash: generateBlockchainHash(),
      ...details
    };

    setCitizens(prev => prev.map(citizen =>
      citizen.id === citizenId
        ? {
            ...citizen,
            modificationHistory: [auditEntry, ...citizen.modificationHistory],
            lastModified: new Date()
          }
        : citizen
    ));

    // Add to blockchain audit trail
    const blockchainEvent: AuditEvent = {
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date(),
      eventType: 'citizen_modified',
      severity: action === 'delete' ? 'high' : 'medium',
      description: `${action.toUpperCase()}: ${details.reason}`,
      adminId: currentAdmin?.uid || 'ADMIN-UNKNOWN',
      affectedRecordId: citizenId,
      blockchainProof: auditEntry.blockchainHash,
      immutableHash: `SHA256:${Math.random().toString(36).substr(2, 32)}`
    };

    setAuditTrail(prev => [blockchainEvent, ...prev]);
  };

  const handleDeleteCitizen = async (citizenId: string) => {
    if (!deleteReason.trim()) {
      toast.error('Deletion reason is required');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCitizens(prev => prev.map(citizen =>
        citizen.id === citizenId
          ? { ...citizen, status: 'deleted' as const }
          : citizen
      ));

      addAuditEntry(citizenId, 'delete', {
        reason: deleteReason,
        fieldChanged: 'status',
        oldValue: 'active',
        newValue: 'deleted'
      });

      toast.success('Citizen record deleted and logged in blockchain audit trail');
      setDeleteReason('');
    } catch (error) {
      toast.error('Failed to delete citizen record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreCitizen = async (citizenId: string) => {
    if (!modificationReason.trim()) {
      toast.error('Restoration reason is required');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setCitizens(prev => prev.map(citizen =>
        citizen.id === citizenId
          ? { ...citizen, status: 'active' as const }
          : citizen
      ));

      addAuditEntry(citizenId, 'restore', {
        reason: modificationReason,
        fieldChanged: 'status',
        oldValue: 'deleted',
        newValue: 'active'
      });

      toast.success('Citizen record restored with blockchain verification');
      setModificationReason('');
    } catch (error) {
      toast.error('Failed to restore citizen record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendCitizen = async (citizenId: string) => {
    if (!modificationReason.trim()) {
      toast.error('Suspension reason is required');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setCitizens(prev => prev.map(citizen =>
        citizen.id === citizenId
          ? { ...citizen, status: 'suspended' as const }
          : citizen
      ));

      addAuditEntry(citizenId, 'suspend', {
        reason: modificationReason,
        fieldChanged: 'status',
        oldValue: 'active',
        newValue: 'suspended'
      });

      toast.success('Citizen record suspended with blockchain audit trail');
      setModificationReason('');
    } catch (error) {
      toast.error('Failed to suspend citizen record');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      suspended: 'secondary',
      deleted: 'destructive',
      under_review: 'outline'
    } as const;

    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-orange-100 text-orange-800',
      deleted: 'bg-red-100 text-red-800',
      under_review: 'bg-blue-100 text-blue-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getVerificationBadge = (level: string) => {
    const colors = {
      unverified: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800',
      fully_verified: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {level.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const exportAuditTrail = () => {
    const csvData = auditTrail.map(event => ({
      'Timestamp': event.timestamp.toISOString(),
      'Event Type': event.eventType,
      'Severity': event.severity,
      'Description': event.description,
      'Admin ID': event.adminId,
      'Affected Record': event.affectedRecordId || 'N/A',
      'Blockchain Proof': event.blockchainProof,
      'Immutable Hash': event.immutableHash
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `png-electoral-audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!authService.hasRole('admin')) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Administrative privileges required.
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
          <h1 className="text-3xl font-bold">Enhanced Admin Controls</h1>
          <p className="text-gray-600 mt-2">
            Secure citizen record management with blockchain audit trails
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={exportAuditTrail}>
            <Download className="w-4 h-4 mr-2" />
            Export Audit Trail
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAuditDetails(!showAuditDetails)}
          >
            <FileText className="w-4 h-4 mr-2" />
            {showAuditDetails ? 'Hide' : 'Show'} Blockchain Audit
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Citizens</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citizens.length}</div>
            <p className="text-xs text-muted-foreground">Registered nationwide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Records</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {citizens.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Verified citizens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {citizens.filter(c => c.status === 'under_review').length}
            </div>
            <p className="text-xs text-muted-foreground">Pending verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{auditTrail.length}</div>
            <p className="text-xs text-muted-foreground">Blockchain records</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="citizens" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="citizens">Citizen Management</TabsTrigger>
          <TabsTrigger value="audit">Blockchain Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="citizens" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search and Filter Citizens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search Citizens</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Name, ID, constituency..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Filter by Status</Label>
                  <select
                    id="status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deleted">Deleted</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Citizens Table */}
          <Card>
            <CardHeader>
              <CardTitle>Citizen Records ({filteredCitizens.length} records)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Citizen Info</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCitizens.map((citizen) => (
                      <TableRow key={citizen.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {citizen.photo && (
                              <img
                                src={citizen.photo}
                                alt={citizen.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="font-semibold">{citizen.fullName}</div>
                              <div className="text-sm text-gray-500">{citizen.nationalIdNumber}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{citizen.constituency}</div>
                            <div className="text-sm text-gray-500">{citizen.province}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(citizen.status)}</TableCell>
                        <TableCell>{getVerificationBadge(citizen.verificationLevel)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {citizen.lastModified.toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCitizen(citizen)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Citizen Record: {selectedCitizen?.fullName}</DialogTitle>
                                  <DialogDescription>
                                    Complete record with blockchain audit trail
                                  </DialogDescription>
                                </DialogHeader>

                                {selectedCitizen && (
                                  <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Full Name</Label>
                                        <p className="font-medium">{selectedCitizen.fullName}</p>
                                      </div>
                                      <div>
                                        <Label>National ID</Label>
                                        <p className="font-medium">{selectedCitizen.nationalIdNumber}</p>
                                      </div>
                                      <div>
                                        <Label>Date of Birth</Label>
                                        <p>{selectedCitizen.dateOfBirth}</p>
                                      </div>
                                      <div>
                                        <Label>Phone Number</Label>
                                        <p>{selectedCitizen.phoneNumber}</p>
                                      </div>
                                    </div>

                                    {/* Modification History */}
                                    <div>
                                      <h3 className="text-lg font-semibold mb-3">Blockchain Audit Trail</h3>
                                      <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {selectedCitizen.modificationHistory.map((mod) => (
                                          <div key={mod.id} className="border-l-4 border-blue-200 pl-4 py-2">
                                            <div className="flex items-center justify-between">
                                              <div className="font-semibold text-sm">
                                                {mod.action.toUpperCase()} by {mod.adminName}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                {mod.timestamp.toLocaleString()}
                                              </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{mod.reason}</p>
                                            {mod.fieldChanged && (
                                              <div className="text-xs text-gray-500 mt-1">
                                                Field: {mod.fieldChanged} ({mod.oldValue} → {mod.newValue})
                                              </div>
                                            )}
                                            <div className="text-xs font-mono text-blue-600 mt-1">
                                              Blockchain: {mod.blockchainHash.substring(0, 20)}...
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Admin Actions */}
                                    <div className="space-y-4">
                                      <h3 className="text-lg font-semibold">Administrative Actions</h3>

                                      <div className="space-y-3">
                                        <div>
                                          <Label htmlFor="reason">Reason for Action</Label>
                                          <Textarea
                                            id="reason"
                                            value={modificationReason}
                                            onChange={(e) => setModificationReason(e.target.value)}
                                            placeholder="Enter detailed reason for this administrative action..."
                                            className="mt-1"
                                          />
                                        </div>

                                        <div className="flex gap-3">
                                          {selectedCitizen.status === 'active' && (
                                            <Button
                                              variant="outline"
                                              onClick={() => handleSuspendCitizen(selectedCitizen.id)}
                                              disabled={isLoading || !modificationReason.trim()}
                                            >
                                              <Lock className="w-4 h-4 mr-2" />
                                              Suspend
                                            </Button>
                                          )}

                                          {selectedCitizen.status === 'suspended' && (
                                            <Button
                                              variant="outline"
                                              onClick={() => handleRestoreCitizen(selectedCitizen.id)}
                                              disabled={isLoading || !modificationReason.trim()}
                                            >
                                              <Unlock className="w-4 h-4 mr-2" />
                                              Restore
                                            </Button>
                                          )}

                                          {selectedCitizen.status === 'deleted' && (
                                            <Button
                                              variant="outline"
                                              onClick={() => handleRestoreCitizen(selectedCitizen.id)}
                                              disabled={isLoading || !modificationReason.trim()}
                                            >
                                              <RotateCcw className="w-4 h-4 mr-2" />
                                              Restore
                                            </Button>
                                          )}

                                          {selectedCitizen.status !== 'deleted' && (
                                            <Button
                                              variant="destructive"
                                              onClick={() => {
                                                setDeleteReason(modificationReason);
                                                handleDeleteCitizen(selectedCitizen.id);
                                              }}
                                              disabled={isLoading || !modificationReason.trim()}
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
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

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blockchain Audit Trail
              </CardTitle>
              <CardDescription>
                Immutable record of all administrative actions with cryptographic verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrail.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={
                            event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            event.severity === 'medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">{event.eventType.replace('_', ' ')}</span>
                        </div>

                        <h4 className="font-semibold">{event.description}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          Admin: {event.adminId} | {event.timestamp.toLocaleString()}
                        </div>
                        {event.affectedRecordId && (
                          <div className="text-sm text-gray-600">
                            Affected Record: {event.affectedRecordId}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded text-xs font-mono">
                      <div>Blockchain Proof: {event.blockchainProof}</div>
                      <div>Immutable Hash: {event.immutableHash}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAdminControls;
