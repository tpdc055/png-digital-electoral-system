import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Globe,
  MapPin,
  Users,
  Calendar,
  Clock,
  Shield,
  Database,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Save,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// Enhanced Election Configuration Types
interface ElectionConfiguration {
  electionId: string;
  name: string;
  description: string;
  type: 'national' | 'provincial' | 'local' | 'by_election';
  status: 'draft' | 'configured' | 'active' | 'completed' | 'archived';
  startDate: Date;
  endDate: Date;
  votingMethod: 'lpv' | 'fptp' | 'mixed';
  constituencies: ConstituencyConfig[];
  securitySettings: SecuritySettings;
  technicalSettings: TechnicalSettings;
  auditSettings: AuditSettings;
  publicationSettings: PublicationSettings;
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
  modifiedBy: string;
}

interface ConstituencyConfig {
  constituencyId: string;
  name: string;
  code: string;
  province: string;
  district: string;
  type: 'open' | 'regional' | 'provincial' | 'local';
  registeredVoters: number;
  pollingStations: PollingStation[];
  candidates: CandidateRegistration[];
  boundaries: GeographicBoundary;
  status: 'configured' | 'active' | 'completed' | 'disputed';
  metadata: ConstituencyMetadata;
}

interface PollingStation {
  stationId: string;
  name: string;
  address: string;
  geoLocation: { lat: number; lng: number };
  capacity: number;
  accessibility: AccessibilityFeatures;
  equipment: EquipmentConfig[];
  staff: StaffAssignment[];
  operatingHours: OperatingHours;
  status: 'setup' | 'ready' | 'open' | 'closed' | 'sealed';
}

interface CandidateRegistration {
  candidateId: string;
  citizenId: string;
  fullName: string;
  partyAffiliation?: string;
  independent: boolean;
  nominationNumber: number;
  photo: string;
  declarations: CandidateDeclaration[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  registrationDate: Date;
}

interface SecuritySettings {
  encryptionEnabled: boolean;
  encryptionAlgorithm: 'RSA-OAEP' | 'ElGamal' | 'Paillier';
  keyManagement: KeyManagementConfig;
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
  biometricVerification: boolean;
  multiFactorAuth: boolean;
  ipWhitelisting: boolean;
  deviceCertification: boolean;
  tamperDetection: boolean;
}

interface TechnicalSettings {
  databaseConfig: DatabaseConfig;
  networkConfig: NetworkConfig;
  backupConfig: BackupConfig;
  performanceConfig: PerformanceConfig;
  monitoringConfig: MonitoringConfig;
}

interface AuditSettings {
  realTimeAuditing: boolean;
  cryptographicProofs: boolean;
  observerAccess: boolean;
  publicBulletinBoard: boolean;
  eventSourcing: boolean;
  immutableLogs: boolean;
  retentionPeriod: number;
  complianceStandards: string[];
}

interface PublicationSettings {
  realTimeResults: boolean;
  preliminaryResults: boolean;
  detailedStatistics: boolean;
  publicAPI: boolean;
  exportFormats: string[];
  publicationDelay: number;
  witnessRequirements: WitnessConfig;
}

// Component Implementation
export const ElectionConfigurationConsole: React.FC = () => {
  const [elections, setElections] = useState<ElectionConfiguration[]>([]);
  const [selectedElection, setSelectedElection] = useState<ElectionConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    database: 'operational',
    network: 'operational',
    security: 'operational',
    monitoring: 'operational'
  });

  // New Election Creation Form
  const [newElection, setNewElection] = useState<Partial<ElectionConfiguration>>({
    name: '',
    description: '',
    type: 'national',
    votingMethod: 'lpv',
    constituencies: [],
    securitySettings: {
      encryptionEnabled: true,
      encryptionAlgorithm: 'RSA-OAEP',
      auditLevel: 'comprehensive',
      biometricVerification: true,
      multiFactorAuth: true,
      ipWhitelisting: true,
      deviceCertification: true,
      tamperDetection: true,
      keyManagement: {
        thresholdScheme: { totalShares: 7, requiredShares: 4 },
        rotationPolicy: 'quarterly',
        escrowPolicy: 'distributed'
      }
    }
  });

  useEffect(() => {
    loadElections();
    checkSystemStatus();
  }, []);

  const loadElections = async () => {
    // In production, load from election service
    const mockElections: ElectionConfiguration[] = [
      {
        electionId: 'PNG_NATIONAL_2027',
        name: 'Papua New Guinea National Election 2027',
        description: 'National Parliamentary Election featuring 111 constituencies across PNG',
        type: 'national',
        status: 'configured',
        startDate: new Date('2027-06-15'),
        endDate: new Date('2027-06-29'),
        votingMethod: 'lpv',
        constituencies: [],
        securitySettings: {} as SecuritySettings,
        technicalSettings: {} as TechnicalSettings,
        auditSettings: {} as AuditSettings,
        publicationSettings: {} as PublicationSettings,
        createdAt: new Date(),
        createdBy: 'Chief Electoral Officer',
        lastModified: new Date(),
        modifiedBy: 'System Administrator'
      }
    ];

    setElections(mockElections);
    if (mockElections.length > 0) {
      setSelectedElection(mockElections[0]);
    }
  };

  const checkSystemStatus = async () => {
    // In production, check actual system health
    setSystemStatus({
      database: 'operational',
      network: 'operational',
      security: 'operational',
      monitoring: 'operational'
    });
  };

  const createElection = async () => {
    if (!newElection.name || !newElection.startDate || !newElection.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      const election: ElectionConfiguration = {
        electionId: `PNG_${newElection.type?.toUpperCase()}_${Date.now()}`,
        name: newElection.name,
        description: newElection.description || '',
        type: newElection.type || 'national',
        status: 'draft',
        startDate: new Date(newElection.startDate),
        endDate: new Date(newElection.endDate),
        votingMethod: newElection.votingMethod || 'lpv',
        constituencies: [],
        securitySettings: newElection.securitySettings || {} as SecuritySettings,
        technicalSettings: {} as TechnicalSettings,
        auditSettings: {} as AuditSettings,
        publicationSettings: {} as PublicationSettings,
        createdAt: new Date(),
        createdBy: 'Current User',
        lastModified: new Date(),
        modifiedBy: 'Current User'
      };

      setElections(prev => [...prev, election]);
      setSelectedElection(election);
      setNewElection({});

      toast.success(`Election "${election.name}" created successfully`);

    } catch (error) {
      console.error('Election creation failed:', error);
      toast.error('Failed to create election');
    } finally {
      setIsCreating(false);
    }
  };

  const configureConstituencies = async () => {
    if (!selectedElection) return;

    // In production, integrate with constituency management service
    const constituencies: ConstituencyConfig[] = [
      {
        constituencyId: 'PNG_NCD_MORESBY_NORTH_EAST',
        name: 'Moresby North-East',
        code: 'NCD-01',
        province: 'National Capital District',
        district: 'Port Moresby',
        type: 'open',
        registeredVoters: 45230,
        pollingStations: [],
        candidates: [],
        boundaries: {} as GeographicBoundary,
        status: 'configured',
        metadata: {} as ConstituencyMetadata
      },
      {
        constituencyId: 'PNG_WPG_WESTERN',
        name: 'Western Provincial',
        code: 'WPG-REG',
        province: 'Western',
        district: 'Western',
        type: 'regional',
        registeredVoters: 89450,
        pollingStations: [],
        candidates: [],
        boundaries: {} as GeographicBoundary,
        status: 'configured',
        metadata: {} as ConstituencyMetadata
      }
    ];

    const updatedElection = {
      ...selectedElection,
      constituencies,
      lastModified: new Date()
    };

    setSelectedElection(updatedElection);
    setElections(prev => prev.map(e => e.electionId === selectedElection.electionId ? updatedElection : e));

    toast.success(`Configured ${constituencies.length} constituencies`);
  };

  const deployElection = async () => {
    if (!selectedElection) return;

    if (selectedElection.constituencies.length === 0) {
      toast.error('Cannot deploy election without constituencies');
      return;
    }

    try {
      const deployedElection = {
        ...selectedElection,
        status: 'active' as const,
        lastModified: new Date()
      };

      setSelectedElection(deployedElection);
      setElections(prev => prev.map(e => e.electionId === selectedElection.electionId ? deployedElection : e));

      toast.success('Election deployed successfully to production environment');

    } catch (error) {
      console.error('Election deployment failed:', error);
      toast.error('Failed to deploy election');
    }
  };

  const exportConfiguration = () => {
    if (!selectedElection) return;

    const config = {
      election: selectedElection,
      exportedAt: new Date(),
      version: '2.0',
      compliance: 'PNG_Electoral_Act_2017'
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedElection.electionId}_configuration.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Election configuration exported');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              PNG Electoral System - Configuration Console
            </h1>
            <p className="text-gray-600 mt-1">
              National-scale election management and configuration platform
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Election
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Election</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Election Name *</Label>
                      <Input
                        id="name"
                        value={newElection.name || ''}
                        onChange={(e) => setNewElection(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Papua New Guinea National Election 2027"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Election Type *</Label>
                      <Select
                        value={newElection.type}
                        onValueChange={(value) => setNewElection(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select election type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="national">National Election</SelectItem>
                          <SelectItem value="provincial">Provincial Election</SelectItem>
                          <SelectItem value="local">Local Election</SelectItem>
                          <SelectItem value="by_election">By-Election</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newElection.description || ''}
                      onChange={(e) => setNewElection(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Election description and objectives"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newElection.startDate ? new Date(newElection.startDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setNewElection(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newElection.endDate ? new Date(newElection.endDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setNewElection(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="votingMethod">Voting Method</Label>
                      <Select
                        value={newElection.votingMethod}
                        onValueChange={(value) => setNewElection(prev => ({ ...prev, votingMethod: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lpv">Limited Preferential Voting</SelectItem>
                          <SelectItem value="fptp">First Past the Post</SelectItem>
                          <SelectItem value="mixed">Mixed System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      onClick={createElection}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Election
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={exportConfiguration}>
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
          </div>
        </div>

        {/* System Status Dashboard */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(systemStatus).map(([system, status]) => (
            <Card key={system}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">{system}</p>
                    <p className={`text-lg font-semibold ${getStatusColor(status)} capitalize`}>
                      {status}
                    </p>
                  </div>
                  <div className={getStatusColor(status)}>
                    {getStatusIcon(status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Configuration Interface */}
        <div className="grid grid-cols-12 gap-6">
          {/* Election Selector */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Elections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {elections.map((election) => (
                    <div
                      key={election.electionId}
                      onClick={() => setSelectedElection(election)}
                      className={`p-3 cursor-pointer border-l-4 hover:bg-gray-50 ${
                        selectedElection?.electionId === election.electionId
                          ? 'border-l-blue-500 bg-blue-50'
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{election.name}</p>
                          <p className="text-xs text-gray-500">{election.type}</p>
                        </div>
                        <Badge
                          variant={election.status === 'active' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {election.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Tabs */}
          <div className="col-span-9">
            {selectedElection ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedElection.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedElection.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedElection.votingMethod.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={selectedElection.status === 'active' ? 'default' : 'outline'}
                      >
                        {selectedElection.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="constituencies">Constituencies</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                      <TabsTrigger value="technical">Technical</TabsTrigger>
                      <TabsTrigger value="audit">Audit</TabsTrigger>
                      <TabsTrigger value="deployment">Deployment</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>Election Period</Label>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              {selectedElection.startDate.toLocaleDateString()} - {selectedElection.endDate.toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <Label>Constituencies Configured</Label>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4" />
                              {selectedElection.constituencies.length} constituencies
                            </div>
                          </div>
                          <div>
                            <Label>Total Registered Voters</Label>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4" />
                              {selectedElection.constituencies.reduce((sum, c) => sum + c.registeredVoters, 0).toLocaleString()} voters
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Last Modified</Label>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4" />
                              {selectedElection.lastModified.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <Label>Modified By</Label>
                            <p className="text-sm">{selectedElection.modifiedBy}</p>
                          </div>
                          <div>
                            <Label>Election ID</Label>
                            <p className="text-sm font-mono">{selectedElection.electionId}</p>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This election is configured with {selectedElection.constituencies.length} constituencies.
                          {selectedElection.status === 'draft' && ' Complete configuration and deploy to activate.'}
                          {selectedElection.status === 'active' && ' Election is currently active and accepting votes.'}
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    <TabsContent value="constituencies" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Constituency Configuration</h3>
                        <Button onClick={configureConstituencies}>
                          <Plus className="h-4 w-4 mr-2" />
                          Configure All Constituencies
                        </Button>
                      </div>

                      {selectedElection.constituencies.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Code</TableHead>
                              <TableHead>Province</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Voters</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedElection.constituencies.map((constituency) => (
                              <TableRow key={constituency.constituencyId}>
                                <TableCell className="font-medium">{constituency.name}</TableCell>
                                <TableCell>{constituency.code}</TableCell>
                                <TableCell>{constituency.province}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{constituency.type}</Badge>
                                </TableCell>
                                <TableCell>{constituency.registeredVoters.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={constituency.status === 'configured' ? 'default' : 'outline'}
                                  >
                                    {constituency.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No constituencies configured yet. Click "Configure All Constituencies" to set up electoral boundaries.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6 mt-6">
                      <h3 className="text-lg font-semibold">Security Configuration</h3>

                      <div className="grid grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Shield className="h-5 w-5" />
                              Cryptographic Security
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>End-to-End Encryption</Label>
                              <Switch checked={selectedElection.securitySettings?.encryptionEnabled} />
                            </div>
                            <div>
                              <Label>Encryption Algorithm</Label>
                              <Select value={selectedElection.securitySettings?.encryptionAlgorithm}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="RSA-OAEP">RSA-OAEP (Recommended)</SelectItem>
                                  <SelectItem value="ElGamal">ElGamal Threshold</SelectItem>
                                  <SelectItem value="Paillier">Paillier Homomorphic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Biometric Verification</Label>
                              <Switch checked={selectedElection.securitySettings?.biometricVerification} />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Multi-Factor Authentication</Label>
                              <Switch checked={selectedElection.securitySettings?.multiFactorAuth} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Lock className="h-5 w-5" />
                              Access Control
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>IP Whitelisting</Label>
                              <Switch checked={selectedElection.securitySettings?.ipWhitelisting} />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Device Certification</Label>
                              <Switch checked={selectedElection.securitySettings?.deviceCertification} />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Tamper Detection</Label>
                              <Switch checked={selectedElection.securitySettings?.tamperDetection} />
                            </div>
                            <div>
                              <Label>Audit Level</Label>
                              <Select value={selectedElection.securitySettings?.auditLevel}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="minimal">Minimal</SelectItem>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="technical" className="space-y-6 mt-6">
                      <h3 className="text-lg font-semibold">Technical Configuration</h3>

                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Database className="h-5 w-5" />
                              Database
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Event Store</span>
                                <span className="text-sm text-green-600">PostgreSQL</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Read Models</span>
                                <span className="text-sm text-green-600">Optimized</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Replication</span>
                                <span className="text-sm text-green-600">Multi-Region</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <BarChart3 className="h-5 w-5" />
                              Performance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Load Balancing</span>
                                <span className="text-sm text-green-600">Active</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Caching</span>
                                <span className="text-sm text-green-600">Redis</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">CDN</span>
                                <span className="text-sm text-green-600">Global</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <RefreshCw className="h-5 w-5" />
                              Monitoring
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Real-time Metrics</span>
                                <span className="text-sm text-green-600">Active</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Alerting</span>
                                <span className="text-sm text-green-600">Configured</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Log Analysis</span>
                                <span className="text-sm text-green-600">ELK Stack</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-6 mt-6">
                      <h3 className="text-lg font-semibold">Audit & Compliance Configuration</h3>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Real-time Auditing</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Cryptographic Proofs</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Observer Access</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Public Bulletin Board</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Event Sourcing</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Immutable Logs</Label>
                            <Switch defaultChecked />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Retention Period (years)</Label>
                            <Input type="number" defaultValue="10" />
                          </div>
                          <div>
                            <Label>Compliance Standards</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox defaultChecked />
                                <Label className="text-sm">PNG Electoral Act 2017</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox defaultChecked />
                                <Label className="text-sm">International Election Standards</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox defaultChecked />
                                <Label className="text-sm">ISO 27001</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox />
                                <Label className="text-sm">Additional Certifications</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="deployment" className="space-y-6 mt-6">
                      <h3 className="text-lg font-semibold">Deployment Management</h3>

                      <div className="space-y-4">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {selectedElection.status === 'draft' && 'Election is in draft mode. Complete configuration before deployment.'}
                            {selectedElection.status === 'configured' && 'Election is ready for deployment to production environment.'}
                            {selectedElection.status === 'active' && 'Election is currently deployed and active.'}
                          </AlertDescription>
                        </Alert>

                        <div className="flex items-center gap-4">
                          {selectedElection.status === 'configured' && (
                            <Button onClick={deployElection} className="bg-green-600 hover:bg-green-700">
                              <Play className="h-4 w-4 mr-2" />
                              Deploy to Production
                            </Button>
                          )}

                          {selectedElection.status === 'active' && (
                            <Button variant="outline" className="border-yellow-500 text-yellow-600">
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Election
                            </Button>
                          )}

                          <Button variant="outline" onClick={exportConfiguration}>
                            <FileText className="h-4 w-4 mr-2" />
                            Export Configuration
                          </Button>
                        </div>

                        {selectedElection.status === 'active' && (
                          <div className="grid grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-green-600">89.2%</p>
                                  <p className="text-sm text-gray-600">System Uptime</p>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-600">1,247</p>
                                  <p className="text-sm text-gray-600">Votes Cast</p>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-purple-600">456ms</p>
                                  <p className="text-sm text-gray-600">Avg Response Time</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Election Selected</h3>
                  <p className="text-gray-500">
                    Select an election from the list or create a new one to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Additional Type Definitions
interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  visuallyImpairedSupport: boolean;
  hearingImpairedSupport: boolean;
  largeButtonInterface: boolean;
  audioInstructions: boolean;
}

interface EquipmentConfig {
  equipmentType: 'voting_machine' | 'scanner' | 'printer' | 'backup_power';
  serialNumber: string;
  model: string;
  lastCalibration: Date;
  status: 'operational' | 'maintenance' | 'offline';
}

interface StaffAssignment {
  staffId: string;
  name: string;
  role: 'presiding_officer' | 'assistant' | 'security' | 'technician';
  certification: string;
  contactInfo: string;
}

interface OperatingHours {
  openTime: string;
  closeTime: string;
  timezone: string;
  extendedHours: boolean;
}

interface GeographicBoundary {
  coordinates: number[][];
  area: number;
  boundaryFile: string;
}

interface ConstituencyMetadata {
  population: number;
  urbanRural: 'urban' | 'rural' | 'mixed';
  accessibilityLevel: 'high' | 'medium' | 'low';
  internetConnectivity: 'excellent' | 'good' | 'poor' | 'none';
  specialConsiderations: string[];
}

interface CandidateDeclaration {
  declarationType: 'financial' | 'criminal_record' | 'eligibility' | 'conflict_of_interest';
  documentUrl: string;
  submittedAt: Date;
  verifiedAt?: Date;
  status: 'submitted' | 'verified' | 'rejected';
}

interface KeyManagementConfig {
  thresholdScheme: {
    totalShares: number;
    requiredShares: number;
  };
  rotationPolicy: 'monthly' | 'quarterly' | 'annually';
  escrowPolicy: 'centralized' | 'distributed' | 'multi_party';
}

interface DatabaseConfig {
  provider: 'postgresql' | 'mysql' | 'mongodb';
  replicationMode: 'master_slave' | 'master_master' | 'cluster';
  backupFrequency: 'hourly' | 'daily' | 'weekly';
  encryptionAtRest: boolean;
}

interface NetworkConfig {
  loadBalancer: boolean;
  cdn: boolean;
  ddosProtection: boolean;
  bandwidth: string;
  redundancy: 'active_passive' | 'active_active';
}

interface BackupConfig {
  frequency: 'real_time' | 'hourly' | 'daily';
  retention: number;
  offlineBackup: boolean;
  geographicDistribution: boolean;
}

interface PerformanceConfig {
  maxConcurrentUsers: number;
  responseTimeTarget: number;
  throughputTarget: number;
  scalingPolicy: 'manual' | 'automatic';
}

interface MonitoringConfig {
  realTimeMetrics: boolean;
  alerting: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retentionPeriod: number;
}

interface WitnessConfig {
  required: boolean;
  minimumWitnesses: number;
  observerAccess: boolean;
  publicVerification: boolean;
}

export default ElectionConfigurationConsole;
