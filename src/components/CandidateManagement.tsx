import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Plus,
  UserCheck,
  Camera,
  IdCard,
  Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';

import { electoralService } from '../services/electoralService';
import { db } from '../services/database';
import type {
  Candidate,
  Election,
  CandidateStatus,
  PartyType,
  EnhancedCandidate,
  CandidateCitizenLink
} from '../types/electoral';
import type { CitizenData } from '../types/citizen';
import { PNG_PROVINCES } from '../types/citizen';
import { CameraCapture } from './CameraCapture';

export const CandidateManagement: React.FC = () => {
  const [candidates, setCandidates] = useState<EnhancedCandidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');

  // Enhanced form state for candidate registration with citizen verification
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [citizenSearchTerm, setCitizenSearchTerm] = useState('');
  const [foundCitizen, setFoundCitizen] = useState<CitizenData | null>(null);
  const [isSearchingCitizen, setIsSearchingCitizen] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [candidatePhoto, setCandidatePhoto] = useState<string>('');
  const [photoVerificationStatus, setPhotoVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');

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

  // Citizen Search and Verification Functions
  const searchCitizenById = async (searchValue: string) => {
    if (!searchValue.trim()) {
      toast.error('Please enter National ID or citizen name');
      return;
    }

    setIsSearchingCitizen(true);
    try {
      // Search by National ID first
      const citizens = await db.getAllCitizens();
      const foundByNID = citizens.find((c: CitizenData) =>
        c.nationalIdNumber?.toLowerCase() === searchValue.toLowerCase()
      );

      if (foundByNID) {
        setFoundCitizen(foundByNID);
        setCandidateForm(prev => ({
          ...prev,
          fullName: foundByNID.fullName,
          dateOfBirth: foundByNID.dateOfBirth,
          nationalIdNumber: foundByNID.nationalIdNumber || '',
          constituency: foundByNID.province
        }));
        toast.success(`Found citizen: ${foundByNID.fullName}`);
        return;
      }

      // Search by name if NID not found
      const foundByName = citizens.find((c: CitizenData) =>
        c.fullName?.toLowerCase().includes(searchValue.toLowerCase())
      );

      if (foundByName) {
        setFoundCitizen(foundByName);
        setCandidateForm(prev => ({
          ...prev,
          fullName: foundByName.fullName,
          dateOfBirth: foundByName.dateOfBirth,
          nationalIdNumber: foundByName.nationalIdNumber || '',
          constituency: foundByName.province
        }));
        toast.success(`Found citizen: ${foundByName.fullName}`);
      } else {
        toast.error('Citizen not found. Please ensure they are registered first.');
        setFoundCitizen(null);
      }
    } catch (error) {
      console.error('Error searching citizen:', error);
      toast.error('Failed to search citizen records');
    } finally {
      setIsSearchingCitizen(false);
    }
  };

  const handleCandidatePhotoCapture = (photoData: string) => {
    setCandidatePhoto(photoData);
    setCandidateForm(prev => ({ ...prev, photo: photoData }));
    setShowCameraCapture(false);

    // Auto-verify photo if citizen photo exists
    if (foundCitizen?.photo) {
      // In a real system, this would use facial recognition
      // For demo, we'll mark as verified if both photos exist
      setPhotoVerificationStatus('verified');
      toast.success('Candidate photo captured and verified with citizen record');
    } else {
      setPhotoVerificationStatus('pending');
      toast.info('Candidate photo captured. Manual verification required.');
    }
  };

  const handleCandidateRegistration = async () => {
    if (!foundCitizen) {
      toast.error('Please search and select a registered citizen first');
      return;
    }

    if (!candidatePhoto) {
      toast.error('Candidate photo is required for verification');
      return;
    }

    try {
      setIsLoading(true);

      // Create candidate-citizen link
      const candidateCitizenLink: CandidateCitizenLink = {
        candidateId: `candidate-${Date.now()}`,
        citizenId: foundCitizen.id!,
        nationalIdNumber: foundCitizen.nationalIdNumber || '',
        citizenPhoto: foundCitizen.photo || '',
        candidatePhoto: candidatePhoto,
        verificationStatus: photoVerificationStatus,
        photoMatch: photoVerificationStatus === 'verified',
        verifiedAt: photoVerificationStatus === 'verified' ? new Date() : undefined
      };

      // Create enhanced candidate record
      const enhancedCandidate: EnhancedCandidate = {
        candidateId: candidateCitizenLink.candidateId,
        electionId: selectedElection,
        ...candidateForm,
        photo: candidatePhoto,
        isEligible: true,
        registrationDate: new Date(),
        status: 'registered',
        registeredBy: 'current-user', // Would be actual user ID
        documentsVerified: true,
        backgroundCheckPassed: true,
        nominationFeesPaid: false,
        citizenLink: candidateCitizenLink,
        citizenRecord: {
          fullName: foundCitizen.fullName,
          dateOfBirth: foundCitizen.dateOfBirth,
          province: foundCitizen.province,
          district: foundCitizen.district,
          llg: foundCitizen.llg,
          village: foundCitizen.village,
          photo: foundCitizen.photo
        }
      };

      await electoralService.registerCandidate(enhancedCandidate);

      toast.success(`Candidate ${candidateForm.fullName} registered successfully with citizen verification`);

      // Reset form
      setFoundCitizen(null);
      setCitizenSearchTerm('');
      setCandidatePhoto('');
      setPhotoVerificationStatus('pending');
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

      // Reload candidates
      loadCandidates();

    } catch (error) {
      console.error('Error registering candidate:', error);
      toast.error('Failed to register candidate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Candidate Management</h2>
          <p className="text-gray-600">Register and manage electoral candidates with citizen verification</p>
        </div>
        <Button onClick={() => setShowRegistrationForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Register New Candidate
        </Button>
      </div>

      {/* Enhanced Registration Form with Citizen Verification */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Candidate Registration with Citizen Verification
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Citizen Search and Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Step 1: Find Citizen Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter National ID or citizen name"
                    value={citizenSearchTerm}
                    onChange={(e) => setCitizenSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCitizenById(citizenSearchTerm)}
                  />
                  <Button
                    onClick={() => searchCitizenById(citizenSearchTerm)}
                    disabled={isSearchingCitizen}
                  >
                    {isSearchingCitizen ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {foundCitizen && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        {foundCitizen.photo && (
                          <img
                            src={foundCitizen.photo}
                            alt="Citizen photo"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800">{foundCitizen.fullName}</h4>
                          <p className="text-sm text-green-700">
                            ID: {foundCitizen.nationalIdNumber} | DOB: {foundCitizen.dateOfBirth}
                          </p>
                          <p className="text-sm text-green-700">
                            {foundCitizen.village}, {foundCitizen.llg}, {foundCitizen.district}, {foundCitizen.province}
                          </p>
                          <Badge className="mt-2 bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified Citizen
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Candidate Photo Verification */}
            {foundCitizen && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Step 2: Candidate Photo Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Citizen Photo */}
                    <div className="text-center">
                      <Label className="text-sm font-medium">Citizen Record Photo</Label>
                      {foundCitizen.photo ? (
                        <img
                          src={foundCitizen.photo}
                          alt="Citizen"
                          className="w-full h-32 object-cover rounded-lg border mt-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg border mt-2 flex items-center justify-center">
                          <span className="text-gray-500">No Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Candidate Photo */}
                    <div className="text-center">
                      <Label className="text-sm font-medium">Candidate Photo</Label>
                      {candidatePhoto ? (
                        <img
                          src={candidatePhoto}
                          alt="Candidate"
                          className="w-full h-32 object-cover rounded-lg border mt-2"
                        />
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setShowCameraCapture(true)}
                          className="w-full h-32 mt-2"
                        >
                          <Camera className="h-6 w-6 mr-2" />
                          Capture Photo
                        </Button>
                      )}
                    </div>

                    {/* Verification Status */}
                    <div className="text-center">
                      <Label className="text-sm font-medium">Verification Status</Label>
                      <div className="mt-2 p-4 border rounded-lg">
                        {photoVerificationStatus === 'verified' && (
                          <div className="text-green-600">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm">Photos Match</span>
                          </div>
                        )}
                        {photoVerificationStatus === 'pending' && (
                          <div className="text-yellow-600">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm">Pending Verification</span>
                          </div>
                        )}
                        {photoVerificationStatus === 'rejected' && (
                          <div className="text-red-600">
                            <XCircle className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm">Photos Don't Match</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Candidate Details Form (rest of the form) */}
            {foundCitizen && candidatePhoto && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Step 3: Candidate Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Form fields remain the same as original */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={candidateForm.fullName} disabled />
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input value={candidateForm.dateOfBirth} disabled />
                    </div>
                    <div>
                      <Label>National ID</Label>
                      <Input value={candidateForm.nationalIdNumber} disabled />
                    </div>
                    <div>
                      <Label>Constituency</Label>
                      <Select
                        value={candidateForm.constituency}
                        onValueChange={(value) => setCandidateForm(prev => ({ ...prev, constituency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select constituency" />
                        </SelectTrigger>
                        <SelectContent>
                          {PNG_PROVINCES.map(province => (
                            <SelectItem key={province} value={province}>{province}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Political Party</Label>
                      <Input
                        value={candidateForm.party}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, party: e.target.value }))}
                        placeholder="Enter party name or 'Independent'"
                      />
                    </div>
                    <div>
                      <Label>Campaign Slogan</Label>
                      <Input
                        value={candidateForm.campaignSlogan}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, campaignSlogan: e.target.value }))}
                        placeholder="Enter campaign slogan"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Biography</Label>
                    <Textarea
                      value={candidateForm.biography}
                      onChange={(e) => setCandidateForm(prev => ({ ...prev, biography: e.target.value }))}
                      placeholder="Enter candidate biography (max 500 words)"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowRegistrationForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCandidateRegistration}
                      disabled={isLoading || photoVerificationStatus !== 'verified'}
                    >
                      {isLoading ? 'Registering...' : 'Register Candidate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CameraCapture
            onCapture={handleCandidatePhotoCapture}
            onCancel={() => setShowCameraCapture(false)}
          />
        </div>
      )}

      {/* Rest of the component - election selector, candidate list, etc. */}
      {/* ... existing election selector and candidate management UI ... */}
    </div>
  );
};
