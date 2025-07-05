import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  Users,
  Image,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

import { electoralService } from '../services/electoralService';
import type { Candidate, Election, CandidateStatus, PartyType } from '../types/electoral';
import { PNG_PROVINCES } from '../types/citizen';

export const CandidateManagement: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');

  // Form state for new candidate registration
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    fullName: '',
    dateOfBirth: '',
    nationalIdNumber: '',
    party: '',
    partyType: 'independent' as PartyType,
    constituency: '',
    biography: '',
    policyPlatform: [''],
    campaignSlogan: '',
    photo: '',
    audioIntroduction: ''
  });

  useEffect(() => {
    loadElections();
    loadCandidates();

    // Create demo elections if none exist
    createDemoElections();
  }, []);

  useEffect(() => {
    if (selectedElection && selectedConstituency) {
      loadCandidatesByConstituency();
    }
  }, [selectedElection, selectedConstituency]);

  const loadElections = async () => {
    try {
      const electionsData = await electoralService.getActiveElections();
      setElections(electionsData);
    } catch (error) {
      console.error('Error loading elections:', error);
      toast.error('Failed to load elections');
    }
  };

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      // Load all candidates for overview
      const allCandidates: Candidate[] = []; // Would come from electoralService
      setCandidates(allCandidates);
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCandidatesByConstituency = async () => {
    if (!selectedElection || !selectedConstituency) return;

    try {
      setIsLoading(true);
      const constituencyCandidates = await electoralService.getCandidatesByConstituency(
        selectedConstituency,
        selectedElection
      );
      setCandidates(constituencyCandidates);
    } catch (error) {
      console.error('Error loading constituency candidates:', error);
      toast.error('Failed to load constituency candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoElections = async () => {
    try {
      // Check if elections already exist
      const existingElections = await electoralService.getActiveElections();
      if (existingElections.length > 0) {
        return; // Elections already exist
      }

      // Create demo elections for testing
      const demoElections = [
        {
          electionName: '2027 PNG National General Election',
          electionType: 'national' as const,
          description: 'National Parliament and Provincial Governor Elections',
          registrationStartDate: new Date('2026-10-01'),
          registrationEndDate: new Date('2027-02-01'),
          votingStartDate: new Date('2027-06-01'),
          votingEndDate: new Date('2027-06-07'),
          constituencies: [...PNG_PROVINCES],
          provinces: [...PNG_PROVINCES],
          maxCandidatesPerConstituency: 50,
          requiresRunningMate: false,
          allowsIndependentCandidates: true,
          votingMethod: 'single_choice' as const,
          requiresBiometricVerification: true,
          allowsProxyVoting: false,
          lastModified: new Date()
        },
        {
          electionName: '2027 Provincial Governor Elections',
          electionType: 'provincial' as const,
          description: 'Provincial Governor Positions',
          registrationStartDate: new Date('2026-10-01'),
          registrationEndDate: new Date('2027-02-01'),
          votingStartDate: new Date('2027-06-01'),
          votingEndDate: new Date('2027-06-07'),
          constituencies: [...PNG_PROVINCES],
          provinces: [...PNG_PROVINCES],
          maxCandidatesPerConstituency: 20,
          requiresRunningMate: false,
          allowsIndependentCandidates: true,
          votingMethod: 'single_choice' as const,
          requiresBiometricVerification: true,
          allowsProxyVoting: false,
          lastModified: new Date()
        }
      ];

      for (const electionData of demoElections) {
        await electoralService.createElection(electionData);
      }

      console.log('Demo elections created successfully');
      await loadElections(); // Reload elections
    } catch (error) {
      console.error('Error creating demo elections:', error);
    }
  };

  const handleRegisterCandidate = async () => {
    try {
      setIsLoading(true);

      // Validate form
      if (!candidateForm.fullName || !candidateForm.nationalIdNumber || !candidateForm.constituency) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!selectedElection) {
        toast.error('Please select an election');
        return;
      }

      const candidateData = {
        ...candidateForm,
        electionId: selectedElection,
        policyPlatform: candidateForm.policyPlatform.filter(policy => policy.trim()),
        isEligible: true,
        documentsVerified: true,
        backgroundCheckPassed: true,
        nominationFeesPaid: true
      };

      await electoralService.registerCandidate(candidateData);

      // Reset form and reload candidates
      setCandidateForm({
        fullName: '',
        dateOfBirth: '',
        nationalIdNumber: '',
        party: '',
        partyType: 'independent',
        constituency: '',
        biography: '',
        policyPlatform: [''],
        campaignSlogan: '',
        photo: '',
        audioIntroduction: ''
      });

      setShowRegistrationForm(false);
      await loadCandidatesByConstituency();

      toast.success('Candidate registered successfully');
    } catch (error) {
      console.error('Error registering candidate:', error);
      toast.error('Failed to register candidate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCandidateStatus = async (candidateId: string, newStatus: CandidateStatus) => {
    try {
      await electoralService.updateCandidateStatus(candidateId, newStatus);
      await loadCandidatesByConstituency();
    } catch (error) {
      console.error('Error updating candidate status:', error);
      toast.error('Failed to update candidate status');
    }
  };

  const getStatusIcon = (status: CandidateStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'registered':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'disqualified':
      case 'withdrawn':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: CandidateStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'registered':
        return 'bg-yellow-100 text-yellow-800';
      case 'disqualified':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.constituency.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🗳️ Candidate Management</h1>
          <p className="text-gray-600">Manage candidate registrations for PNG elections</p>
        </div>

        <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Register New Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Candidate</DialogTitle>
            </DialogHeader>
            <CandidateRegistrationForm
              candidateForm={candidateForm}
              setCandidateForm={setCandidateForm}
              elections={elections}
              selectedElection={selectedElection}
              setSelectedElection={setSelectedElection}
              onSubmit={handleRegisterCandidate}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Election & Constituency Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Election & Constituency Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="election-select">Select Election</Label>
              <Select value={selectedElection} onValueChange={setSelectedElection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an election..." />
                </SelectTrigger>
                <SelectContent>
                  {elections.map(election => (
                    <SelectItem key={election.electionId} value={election.electionId}>
                      {election.electionName} ({election.electionType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="constituency-select">Select Constituency</Label>
              <Select value={selectedConstituency} onValueChange={setSelectedConstituency}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a constituency..." />
                </SelectTrigger>
                <SelectContent>
                  {PNG_PROVINCES.map(province => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search candidates by name, party, or constituency..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CandidateStatus | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disqualified">Disqualified</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidates ({filteredCandidates.length})
            </span>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading candidates...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600 mb-4">
                {selectedElection && selectedConstituency
                  ? 'No candidates registered for this election and constituency yet.'
                  : 'Please select an election and constituency to view candidates.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map(candidate => (
                    <TableRow key={candidate.candidateId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {candidate.photo ? (
                            <img
                              src={candidate.photo}
                              alt={candidate.fullName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{candidate.fullName}</div>
                            <div className="text-sm text-gray-600">{candidate.nationalIdNumber}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium">{candidate.party || 'Independent'}</div>
                          <Badge variant="outline" className="mt-1">
                            {candidate.partyType}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>{candidate.constituency}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(candidate.status)}
                          <Badge className={getStatusBadgeColor(candidate.status)}>
                            {candidate.status}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        {new Date(candidate.registrationDate).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>

                          {candidate.status === 'registered' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateCandidateStatus(candidate.candidateId, 'approved')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateCandidateStatus(candidate.candidateId, 'disqualified')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Card */}
      {filteredCandidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredCandidates.filter(c => c.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredCandidates.filter(c => c.status === 'registered').length}
                </div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredCandidates.filter(c => c.party && c.party !== '').length}
                </div>
                <div className="text-sm text-gray-600">Party Candidates</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredCandidates.filter(c => c.partyType === 'independent').length}
                </div>
                <div className="text-sm text-gray-600">Independent</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Candidate Registration Form Component
const CandidateRegistrationForm: React.FC<{
  candidateForm: any;
  setCandidateForm: (form: any) => void;
  elections: Election[];
  selectedElection: string;
  setSelectedElection: (id: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ candidateForm, setCandidateForm, elections, selectedElection, setSelectedElection, onSubmit, isLoading }) => {

  const updateForm = (field: string, value: string | string[]) => {
    setCandidateForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const addPolicyPlatform = () => {
    setCandidateForm((prev: any) => ({
      ...prev,
      policyPlatform: [...prev.policyPlatform, '']
    }));
  };

  const updatePolicyPlatform = (index: number, value: string) => {
    setCandidateForm((prev: any) => ({
      ...prev,
      policyPlatform: prev.policyPlatform.map((policy: string, i: number) => i === index ? value : policy)
    }));
  };

  const removePolicyPlatform = (index: number) => {
    setCandidateForm((prev: any) => ({
      ...prev,
      policyPlatform: prev.policyPlatform.filter((_: string, i: number) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="political">Political Info</TabsTrigger>
          <TabsTrigger value="media">Media & Bio</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={candidateForm.fullName}
                onChange={(e) => updateForm('fullName', e.target.value)}
                placeholder="Enter candidate's full name"
              />
            </div>

            <div>
              <Label htmlFor="nationalId">National ID Number *</Label>
              <Input
                id="nationalId"
                value={candidateForm.nationalIdNumber}
                onChange={(e) => updateForm('nationalIdNumber', e.target.value)}
                placeholder="PNG National ID"
              />
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={candidateForm.dateOfBirth}
                onChange={(e) => updateForm('dateOfBirth', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="constituency">Constituency *</Label>
              <Select value={candidateForm.constituency} onValueChange={(value) => updateForm('constituency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select constituency" />
                </SelectTrigger>
                <SelectContent>
                  {PNG_PROVINCES.map(province => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="election">Election *</Label>
            <Select value={selectedElection} onValueChange={setSelectedElection}>
              <SelectTrigger>
                <SelectValue placeholder="Select election" />
              </SelectTrigger>
              <SelectContent>
                {elections.map(election => (
                  <SelectItem key={election.electionId} value={election.electionId}>
                    {election.electionName} ({election.electionType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="political" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="party">Political Party</Label>
              <Input
                id="party"
                value={candidateForm.party}
                onChange={(e) => updateForm('party', e.target.value)}
                placeholder="Party name (leave blank for independent)"
              />
            </div>

            <div>
              <Label htmlFor="partyType">Party Type</Label>
              <Select value={candidateForm.partyType} onValueChange={(value) => updateForm('partyType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="political_party">Political Party</SelectItem>
                  <SelectItem value="independent">Independent</SelectItem>
                  <SelectItem value="coalition">Coalition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="campaignSlogan">Campaign Slogan</Label>
            <Input
              id="campaignSlogan"
              value={candidateForm.campaignSlogan}
              onChange={(e) => updateForm('campaignSlogan', e.target.value)}
              placeholder="Enter campaign slogan"
            />
          </div>

          <div>
            <Label>Policy Platform</Label>
            {candidateForm.policyPlatform.map((policy: string, index: number) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={policy}
                  onChange={(e) => updatePolicyPlatform(index, e.target.value)}
                  placeholder={`Policy point ${index + 1}`}
                />
                {candidateForm.policyPlatform.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePolicyPlatform(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPolicyPlatform}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Policy Point
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <div>
            <Label htmlFor="biography">Biography</Label>
            <Textarea
              id="biography"
              value={candidateForm.biography}
              onChange={(e) => updateForm('biography', e.target.value)}
              placeholder="Enter candidate biography (max 500 words)"
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="photo">Candidate Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle file upload and conversion to base64
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    updateForm('photo', reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="audio">Audio Introduction (Optional)</Label>
            <Input
              id="audio"
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    updateForm('audioIntroduction', reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ensure all documents are verified before approving the candidate registration.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Identity Documents</h4>
                <p className="text-sm text-gray-600">Birth certificate, National ID verified</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Eligibility Requirements</h4>
                <p className="text-sm text-gray-600">Age, citizenship, mental soundness verified</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Nomination Fees</h4>
                <p className="text-sm text-gray-600">Required fees paid and verified</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700"
        >
          {isLoading ? 'Registering...' : 'Register Candidate'}
        </Button>
      </div>
    </div>
  );
};
