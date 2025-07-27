import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Download,
  Search,
  Users,
  FileText,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Fingerprint,
  Shield,
  Settings
} from 'lucide-react';

import { type CitizenData, PNG_PROVINCES } from '../types/citizen';
import { VerificationSettingsComponent } from './VerificationSettings';
import { VerifierRegistration } from './VerifierRegistration';
import { db } from '../services/database';
import { networkService } from '../services/network';

export const AdminDashboard: React.FC = () => {
  const [citizens, setCitizens] = useState<CitizenData[]>([]);
  const [filteredCitizens, setFilteredCitizens] = useState<CitizenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterVoterStatus, setFilterVoterStatus] = useState<string>('all');
  const [filterSyncStatus, setFilterSyncStatus] = useState<string>('all');

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    synced: 0,
    unsynced: 0,
    voters: 0,
    withPhotos: 0,
    withFingerprints: 0
  });

  useEffect(() => {
    loadCitizens();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...citizens];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(citizen =>
        citizen.fullName.toLowerCase().includes(query) ||
        citizen.nationalIdNumber.toLowerCase().includes(query) ||
        citizen.village.toLowerCase().includes(query) ||
        citizen.district.toLowerCase().includes(query)
      );
    }

    // Province filter
    if (filterProvince !== 'all') {
      filtered = filtered.filter(citizen => citizen.province === filterProvince);
    }

    // Voter status filter
    if (filterVoterStatus !== 'all') {
      const isVoter = filterVoterStatus === 'voter';
      filtered = filtered.filter(citizen => citizen.voterStatus === isVoter);
    }

    // Sync status filter
    if (filterSyncStatus !== 'all') {
      const isSynced = filterSyncStatus === 'synced';
      filtered = filtered.filter(citizen => citizen.synced === isSynced);
    }

    setFilteredCitizens(filtered);
  }, [citizens, searchQuery, filterProvince, filterVoterStatus, filterSyncStatus]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadCitizens = async () => {
    setLoading(true);
    try {
      const allCitizens = await db.getAllCitizens();
      setCitizens(allCitizens);

      // Calculate statistics
      const stats = {
        total: allCitizens.length,
        synced: allCitizens.filter(c => c.synced).length,
        unsynced: allCitizens.filter(c => !c.synced).length,
        voters: allCitizens.filter(c => c.voterStatus).length,
        withPhotos: allCitizens.filter(c => c.photo && c.photo.length > 0).length,
        withFingerprints: allCitizens.filter(c => c.fingerprint && c.fingerprint.length > 0).length
      };
      setStats(stats);

    } catch (error) {
      console.error('Failed to load citizens:', error);
      toast.error('Failed to load citizen records');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Full Name', 'Date of Birth', 'Sex', 'Province', 'District', 'LLG', 'Village',
        'National ID', 'Phone', 'Marital Status', 'Education', 'Occupation', 'Tribe',
        'Land Ownership', 'Disability', 'Voter Status', 'Biometric Consent', 'Has Photo', 'Has Fingerprint', 'Synced',
        'GPS Lat', 'GPS Lng', 'Created At'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredCitizens.map(citizen => [
          `"${citizen.fullName}"`,
          citizen.dateOfBirth,
          citizen.sex,
          `"${citizen.province}"`,
          `"${citizen.district}"`,
          `"${citizen.llg}"`,
          `"${citizen.village}"`,
          citizen.nationalIdNumber,
          citizen.phoneNumber || '',
          `"${citizen.maritalStatus}"`,
          `"${citizen.educationLevel}"`,
          `"${citizen.occupation}"`,
          `"${citizen.tribe}"`,
          `"${citizen.landOwnership}"`,
          citizen.disabilityStatus ? 'Yes' : 'No',
          citizen.voterStatus ? 'Yes' : 'No',
          citizen.biometricConsent ? 'Yes' : 'No',
          citizen.photo ? 'Yes' : 'No',
          citizen.fingerprint ? 'Yes' : 'No',
          citizen.synced ? 'Yes' : 'No',
          citizen.gpsCoordinates?.lat || '',
          citizen.gpsCoordinates?.lng || '',
          citizen.createdAt
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `citizens_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${filteredCitizens.length} citizen records`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  const forceSyncAll = async () => {
    try {
      const result = await networkService.forceSyncAll();
      toast.success(`Sync completed: ${result.success} synced, ${result.failed} failed`);
      loadCitizens(); // Refresh data
    } catch (error) {
      toast.error(`Sync failed: ${(error as Error).message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading citizen records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PNG-Themed Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="png-stat-card shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Total Citizens</p>
                <p className="text-3xl font-bold text-blue-800">{stats.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="png-stat-card shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Cloud Synced</p>
                <p className="text-3xl font-bold text-green-800">{stats.synced.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="png-stat-card shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Pending Sync</p>
                <p className="text-3xl font-bold text-yellow-800">{stats.unsynced.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="png-stat-card shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Eligible Voters</p>
                <p className="text-3xl font-bold text-purple-800">{stats.voters.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="png-stat-card shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">With Photos</p>
                <p className="text-3xl font-bold text-indigo-800">{stats.withPhotos.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="png-stat-card shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-6 w-6 bird-accent" />
              <div>
                <p className="text-sm font-semibold text-gray-700">With Fingerprints</p>
                <p className="text-3xl font-bold bird-accent">{stats.withFingerprints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Actions
            </span>
            <div className="flex gap-2">
              <Button
                onClick={forceSyncAll}
                variant="outline"
                size="sm"
                disabled={networkService.isSyncInProgress()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, ID, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterProvince} onValueChange={setFilterProvince}>
              <SelectTrigger>
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {PNG_PROVINCES.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterVoterStatus} onValueChange={setFilterVoterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Voter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Citizens</SelectItem>
                <SelectItem value="voter">Eligible Voters</SelectItem>
                <SelectItem value="non-voter">Non-Voters</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSyncStatus} onValueChange={setFilterSyncStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Sync Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="synced">Synced Only</SelectItem>
                <SelectItem value="unsynced">Pending Sync</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Citizens Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Citizen Records ({filteredCitizens.length} of {stats.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCitizens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No citizen records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCitizens.map((citizen) => (
                    <TableRow key={citizen.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{citizen.fullName}</div>
                          <div className="text-sm text-gray-500">
                            {citizen.sex}, {new Date().getFullYear() - new Date(citizen.dateOfBirth).getFullYear()} years
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{citizen.nationalIdNumber}</TableCell>
                      <TableCell>{citizen.province}</TableCell>
                      <TableCell>{citizen.district}</TableCell>
                      <TableCell>{citizen.village}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {citizen.voterStatus && (
                            <Badge variant="outline" className="text-xs">
                              Voter
                            </Badge>
                          )}
                          {citizen.photo && (
                            <Badge variant="outline" className="text-xs">
                              Photo
                            </Badge>
                          )}
                          {citizen.fingerprint && (
                            <Badge variant="outline" className="text-xs">
                              Fingerprint
                            </Badge>
                          )}
                          {citizen.disabilityStatus && (
                            <Badge variant="outline" className="text-xs">
                              Disability
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {citizen.synced ? (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Synced
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(citizen.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
