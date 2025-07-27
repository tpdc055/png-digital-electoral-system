import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import {
  MapPin,
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  Lock,
  Unlock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Shield,
  Map,
  Navigation,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ElectoralDevice {
  id: string;
  deviceType: 'smartphone' | 'tablet' | 'biometric_scanner' | 'fingerprint_reader';
  serialNumber: string;
  assignedConstituency: string;
  assignedProvince: string;
  pollingStation: string;
  currentLocation: {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: Date;
  };
  status: 'active' | 'offline' | 'locked' | 'stolen' | 'maintenance';
  batteryLevel: number;
  lastSeen: Date;
  assignedOperator: string;
  operatorPhone: string;
  isGPSEnabled: boolean;
  lockStatus: 'unlocked' | 'admin_locked' | 'security_locked';
  deploymentDate: Date;
  firmwareVersion: string;
  auditLog: DeviceAuditEntry[];
}

interface DeviceAuditEntry {
  timestamp: Date;
  action: string;
  operator: string;
  details: string;
  location?: { lat: number; lng: number };
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<ElectoralDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<ElectoralDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ElectoralDevice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [mapView, setMapView] = useState<'list' | 'map'>('list');

  // Simulate device data - In production, this would come from your device management API
  useEffect(() => {
    const mockDevices: ElectoralDevice[] = [
      {
        id: 'DEV-001-PNG',
        deviceType: 'smartphone',
        serialNumber: 'SM-G996B-001',
        assignedConstituency: 'Port Moresby South',
        assignedProvince: 'National Capital District',
        pollingStation: 'Boroko Primary School',
        currentLocation: {
          lat: -9.4438,
          lng: 147.1803,
          accuracy: 5,
          timestamp: new Date()
        },
        status: 'active',
        batteryLevel: 85,
        lastSeen: new Date(),
        assignedOperator: 'John Kila',
        operatorPhone: '+675 7123 4567',
        isGPSEnabled: true,
        lockStatus: 'unlocked',
        deploymentDate: new Date('2024-01-15'),
        firmwareVersion: 'PNG-Electoral-v2.1.0',
        auditLog: [
          {
            timestamp: new Date(),
            action: 'Device Online',
            operator: 'System',
            details: 'Device connected and reporting normal status'
          }
        ]
      },
      {
        id: 'DEV-002-PNG',
        deviceType: 'tablet',
        serialNumber: 'SM-T870-002',
        assignedConstituency: 'Lae Open',
        assignedProvince: 'Morobe',
        pollingStation: 'Lae Secondary School',
        currentLocation: {
          lat: -6.7398,
          lng: 147.0186,
          accuracy: 8,
          timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        },
        status: 'offline',
        batteryLevel: 23,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        assignedOperator: 'Mary Wambi',
        operatorPhone: '+675 7234 5678',
        isGPSEnabled: true,
        lockStatus: 'unlocked',
        deploymentDate: new Date('2024-01-18'),
        firmwareVersion: 'PNG-Electoral-v2.1.0',
        auditLog: [
          {
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            action: 'Connection Lost',
            operator: 'System',
            details: 'Device went offline - low battery suspected'
          }
        ]
      },
      {
        id: 'DEV-003-PNG',
        deviceType: 'biometric_scanner',
        serialNumber: 'BIO-FP-003',
        assignedConstituency: 'Mount Hagen Open',
        assignedProvince: 'Western Highlands',
        pollingStation: 'Mount Hagen Community Center',
        currentLocation: {
          lat: -5.8614,
          lng: 144.2296,
          accuracy: 3,
          timestamp: new Date()
        },
        status: 'locked',
        batteryLevel: 67,
        lastSeen: new Date(),
        assignedOperator: 'Peter Konga',
        operatorPhone: '+675 7345 6789',
        isGPSEnabled: true,
        lockStatus: 'admin_locked',
        deploymentDate: new Date('2024-01-20'),
        firmwareVersion: 'PNG-Electoral-v2.0.5',
        auditLog: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            action: 'Admin Lock Applied',
            operator: 'Administrator',
            details: 'Device locked due to security protocol activation',
            location: { lat: -5.8614, lng: 144.2296 }
          }
        ]
      }
    ];

    setDevices(mockDevices);
    setFilteredDevices(mockDevices);
  }, []);

  // Filter devices based on search and filters
  useEffect(() => {
    let filtered = devices;

    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.assignedOperator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.pollingStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.assignedConstituency.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(device => device.status === filterStatus);
    }

    if (filterProvince !== 'all') {
      filtered = filtered.filter(device => device.assignedProvince === filterProvince);
    }

    setFilteredDevices(filtered);
  }, [devices, searchTerm, filterStatus, filterProvince]);

  const handleLockDevice = async (deviceId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call to lock device
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDevices(prev => prev.map(device =>
        device.id === deviceId
          ? {
              ...device,
              lockStatus: 'admin_locked',
              status: 'locked',
              auditLog: [
                {
                  timestamp: new Date(),
                  action: 'Remote Lock Applied',
                  operator: 'Administrator',
                  details: 'Device remotely locked via admin dashboard'
                },
                ...device.auditLog
              ]
            }
          : device
      ));

      toast.success(`Device ${deviceId} has been locked remotely`);
    } catch (error) {
      toast.error('Failed to lock device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockDevice = async (deviceId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call to unlock device
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDevices(prev => prev.map(device =>
        device.id === deviceId
          ? {
              ...device,
              lockStatus: 'unlocked',
              status: 'active',
              auditLog: [
                {
                  timestamp: new Date(),
                  action: 'Remote Unlock Applied',
                  operator: 'Administrator',
                  details: 'Device remotely unlocked via admin dashboard'
                },
                ...device.auditLog
              ]
            }
          : device
      ));

      toast.success(`Device ${deviceId} has been unlocked`);
    } catch (error) {
      toast.error('Failed to unlock device');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'locked':
        return <Lock className="w-4 h-4 text-orange-500" />;
      case 'stolen':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      offline: 'destructive',
      locked: 'secondary',
      stolen: 'destructive',
      maintenance: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-orange-500';
    return 'text-red-500';
  };

  const exportDeviceData = () => {
    const csvData = filteredDevices.map(device => ({
      'Device ID': device.id,
      'Type': device.deviceType,
      'Province': device.assignedProvince,
      'Constituency': device.assignedConstituency,
      'Polling Station': device.pollingStation,
      'Operator': device.assignedOperator,
      'Status': device.status,
      'Battery': `${device.batteryLevel}%`,
      'Last Seen': device.lastSeen.toLocaleString(),
      'GPS': `${device.currentLocation.lat}, ${device.currentLocation.lng}`
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `png-electoral-devices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Electoral Device Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and control all electoral hardware deployed across PNG
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={exportDeviceData}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <Button
            onClick={() => setMapView(mapView === 'list' ? 'map' : 'list')}
            variant="outline"
          >
            {mapView === 'list' ? (
              <>
                <Map className="w-4 h-4 mr-2" />
                Map View
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                List View
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">Deployed nationwide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devices.filter(d => d.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Online and operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Devices</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {devices.filter(d => d.status === 'offline').length}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {devices.filter(d => d.status === 'locked' || d.status === 'stolen').length}
            </div>
            <p className="text-xs text-muted-foreground">Locked or compromised</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Device Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Devices</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Device ID, operator, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="stolen">Stolen</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="province">Filter by Province</Label>
              <Select value={filterProvince} onValueChange={setFilterProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="All provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  <SelectItem value="National Capital District">National Capital District</SelectItem>
                  <SelectItem value="Morobe">Morobe</SelectItem>
                  <SelectItem value="Western Highlands">Western Highlands</SelectItem>
                  <SelectItem value="Central">Central</SelectItem>
                  <SelectItem value="Western">Western</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterProvince('all');
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device List/Map View */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mapView === 'list' ? 'Device List' : 'Device Map'}
            ({filteredDevices.length} devices)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mapView === 'list' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Info</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{device.id}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {device.deviceType.replace('_', ' ')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{device.pollingStation}</div>
                          <div className="text-sm text-gray-500">{device.assignedConstituency}</div>
                          <div className="text-xs text-gray-400">{device.assignedProvince}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{device.assignedOperator}</div>
                          <div className="text-sm text-gray-500">{device.operatorPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(device.status)}
                          {getStatusBadge(device.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${getBatteryColor(device.batteryLevel)}`}>
                          <Battery className="w-4 h-4" />
                          {device.batteryLevel}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {device.lastSeen.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDevice(device)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Device Details: {device.id}</DialogTitle>
                              </DialogHeader>
                              {selectedDevice && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Device Type</Label>
                                      <p className="capitalize">{selectedDevice.deviceType.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                      <Label>Serial Number</Label>
                                      <p>{selectedDevice.serialNumber}</p>
                                    </div>
                                    <div>
                                      <Label>GPS Coordinates</Label>
                                      <p>{selectedDevice.currentLocation.lat.toFixed(4)}, {selectedDevice.currentLocation.lng.toFixed(4)}</p>
                                    </div>
                                    <div>
                                      <Label>Firmware Version</Label>
                                      <p>{selectedDevice.firmwareVersion}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Recent Audit Log</Label>
                                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                      {selectedDevice.auditLog.slice(0, 5).map((entry, index) => (
                                        <div key={index} className="text-sm border-l-2 border-blue-200 pl-3">
                                          <div className="font-medium">{entry.action}</div>
                                          <div className="text-gray-500">{entry.details}</div>
                                          <div className="text-xs text-gray-400">
                                            {entry.timestamp.toLocaleString()} by {entry.operator}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {device.lockStatus === 'unlocked' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLockDevice(device.id)}
                              disabled={isLoading}
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlockDevice(device.id)}
                              disabled={isLoading}
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Interactive Map</h3>
                <p className="text-gray-500">
                  Google Maps integration showing {filteredDevices.length} devices across PNG
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Map implementation would display real-time device locations
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {devices.some(d => d.status === 'stolen' || (d.status === 'offline' && d.batteryLevel < 20)) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Alert:</strong> {devices.filter(d => d.status === 'stolen').length} device(s) reported stolen,
            {devices.filter(d => d.status === 'offline' && d.batteryLevel < 20).length} device(s) offline with low battery.
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DeviceManagement;
