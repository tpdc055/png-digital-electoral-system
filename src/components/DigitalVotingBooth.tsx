import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Vote,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Volume2,
  Eye,
  Fingerprint,
  Lock,
  Shield,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  XCircle,
  Camera,
  Users,
  Grid3X3,
  List,
  Image as ImageIcon,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

import { electoralService } from '../services/electoralService';
import type {
  Candidate,
  LPVBallot,
  LPVVote,
  LPVVoteRecord,
  VoterEligibility,
  BallotDisplayOption,
  EnhancedCandidate
} from '../types/electoral';
import { authService } from '../services/authService';
import { biometricService, type BiometricVerificationResult } from '../services/biometricService';

interface VotingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const DigitalVotingBooth: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [ballot, setBallot] = useState<LPVBallot | null>(null);
  const [lpvVote, setLpvVote] = useState<LPVVote>({
    firstChoice: '',
    secondChoice: '',
    thirdChoice: ''
  });
  const [candidates, setCandidates] = useState<EnhancedCandidate[]>([]);
  const [voterEligibility, setVoterEligibility] = useState<VoterEligibility | null>(null);
  const [biometricResult, setBiometricResult] = useState<BiometricVerificationResult | null>(null);
  const [biometricInitialized, setBiometricInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [voteRecord, setVoteRecord] = useState<LPVVoteRecord | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // LPV Specific State
  const [displayMode, setDisplayMode] = useState<'gallery' | 'sequential' | 'box_selection'>('gallery');
  const [selectedCandidate, setSelectedCandidate] = useState<EnhancedCandidate | null>(null);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [currentCandidateIndex, setCCurrentCandidateIndex] = useState(0);
  const [accessibilityMode, setAccessibilityMode] = useState({
    largeText: false,
    highContrast: false,
    audioEnabled: false
  });

  const votingSteps: VotingStep[] = [
    {
      id: 'verification',
      title: 'Voter Verification',
      description: 'Verify your identity and eligibility to vote',
      completed: false
    },
    {
      id: 'ballot',
      title: 'Review Candidates',
      description: 'Review all candidates for your constituency',
      completed: false
    },
    {
      id: 'lpv_selection',
      title: 'Make Your Choices',
      description: 'Select your 1st, 2nd, and 3rd preference candidates',
      completed: false
    },
    {
      id: 'confirmation',
      title: 'Confirm Your Vote',
      description: 'Review and confirm your preferential vote',
      completed: false
    },
    {
      id: 'completion',
      title: 'Vote Cast',
      description: 'Your vote has been recorded',
      completed: false
    }
  ];

  useEffect(() => {
    initializeVotingSession();
  }, []);

  useEffect(() => {
    if (ballot && ballot.expiresAt) {
      const timer = setInterval(() => {
        const remaining = new Date(ballot.expiresAt).getTime() - new Date().getTime();
        setTimeRemaining(Math.max(0, Math.floor(remaining / 1000)));

        if (remaining <= 0) {
          handleSessionTimeout();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [ballot]);

  const initializeVotingSession = async () => {
    try {
      setIsLoading(true);

      // Load demo candidates for testing
      const demoCandidates: EnhancedCandidate[] = [
        {
          candidateId: 'candidate-1',
          electionId: 'election-2027',
          constituency: 'National Capital District',
          fullName: 'James Marape',
          dateOfBirth: '1971-04-24',
          nationalIdNumber: 'PNG123456',
          party: 'PANGU Party',
          partyType: 'political_party',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
          biography: 'Experienced political leader focused on economic development and good governance.',
          policyPlatform: ['Economic Growth', 'Infrastructure Development', 'Education Reform'],
          campaignSlogan: 'Building a Better PNG',
          isEligible: true,
          registrationDate: new Date(),
          status: 'approved',
          registeredBy: 'system',
          documentsVerified: true,
          backgroundCheckPassed: true,
          nominationFeesPaid: true,
          citizenRecord: {
            fullName: 'James Marape',
            dateOfBirth: '1971-04-24',
            province: 'National Capital District',
            district: 'NCD Central',
            llg: 'NCD LLG',
            village: 'Port Moresby',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
          }
        },
        {
          candidateId: 'candidate-2',
          electionId: 'election-2027',
          constituency: 'National Capital District',
          fullName: 'Peter O\'Neill',
          dateOfBirth: '1965-07-13',
          nationalIdNumber: 'PNG234567',
          party: 'PNC',
          partyType: 'political_party',
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
          biography: 'Former Prime Minister with extensive experience in public administration.',
          policyPlatform: ['Healthcare Improvement', 'Job Creation', 'Anti-Corruption'],
          campaignSlogan: 'Experience for Progress',
          isEligible: true,
          registrationDate: new Date(),
          status: 'approved',
          registeredBy: 'system',
          documentsVerified: true,
          backgroundCheckPassed: true,
          nominationFeesPaid: true,
          citizenRecord: {
            fullName: 'Peter O\'Neill',
            dateOfBirth: '1965-07-13',
            province: 'National Capital District',
            district: 'NCD Central',
            llg: 'NCD LLG',
            village: 'Port Moresby',
            photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
          }
        },
        {
          candidateId: 'candidate-3',
          electionId: 'election-2027',
          constituency: 'National Capital District',
          fullName: 'Michael Somare Jr.',
          dateOfBirth: '1980-03-15',
          nationalIdNumber: 'PNG345678',
          party: 'NAP',
          partyType: 'political_party',
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
          biography: 'Young leader committed to digital transformation and youth empowerment.',
          policyPlatform: ['Digital Innovation', 'Youth Employment', 'Environmental Protection'],
          campaignSlogan: 'Innovation for Tomorrow',
          isEligible: true,
          registrationDate: new Date(),
          status: 'approved',
          registeredBy: 'system',
          documentsVerified: true,
          backgroundCheckPassed: true,
          nominationFeesPaid: true,
          citizenRecord: {
            fullName: 'Michael Somare Jr.',
            dateOfBirth: '1980-03-15',
            province: 'National Capital District',
            district: 'NCD Central',
            llg: 'NCD LLG',
            village: 'Port Moresby',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face'
          }
        },
        {
          candidateId: 'candidate-4',
          electionId: 'election-2027',
          constituency: 'National Capital District',
          fullName: 'Sarah Tabuai',
          dateOfBirth: '1975-09-22',
          nationalIdNumber: 'PNG456789',
          party: 'Independent',
          partyType: 'independent',
          photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e8?w=200&h=200&fit=crop&crop=face',
          biography: 'Community leader advocating for women\'s rights and rural development.',
          policyPlatform: ['Women Empowerment', 'Rural Development', 'Education Access'],
          campaignSlogan: 'Voice for All',
          isEligible: true,
          registrationDate: new Date(),
          status: 'approved',
          registeredBy: 'system',
          documentsVerified: true,
          backgroundCheckPassed: true,
          nominationFeesPaid: true,
          citizenRecord: {
            fullName: 'Sarah Tabuai',
            dateOfBirth: '1975-09-22',
            province: 'National Capital District',
            district: 'NCD Central',
            llg: 'NCD LLG',
            village: 'Port Moresby',
            photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e8?w=200&h=200&fit=crop&crop=face'
          }
        }
      ];

      setCandidates(demoCandidates);

      // Create LPV ballot
      const lpvBallot: LPVBallot = {
        ballotId: 'ballot-lpv-' + Date.now(),
        electionId: 'election-2027',
        constituency: 'National Capital District',
        voterId: 'voter-demo',
        ballotTitle: '2027 PNG National Election - NCD Constituency',
        ballotInstructions: {
          text: 'Select your 1st, 2nd, and 3rd choice candidates by clicking on their boxes.',
          languages: {
            english: 'Select your 1st, 2nd, and 3rd choice candidates by clicking on their boxes.'
          }
        },
        candidates: demoCandidates,
        votingMethod: 'lpv',
        maxPreferences: 3,
        requiresAllPreferences: false,
        accessibilityFeatures: {
          largeText: accessibilityMode.largeText,
          highContrast: accessibilityMode.highContrast,
          audioAssistance: accessibilityMode.audioEnabled,
          touchOptimized: true,
          screenReader: false
        },
        ballotHash: 'hash-' + Date.now(),
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };

      setBallot(lpvBallot);
      setCurrentStep(1); // Skip verification for demo, go to ballot review

    } catch (error) {
      console.error('Error initializing voting session:', error);
      toast.error('Failed to initialize voting session');
    } finally {
      setIsLoading(false);
    }
  };

  // LPV Selection Functions
  const selectCandidate = (candidateId: string, preference: 'firstChoice' | 'secondChoice' | 'thirdChoice') => {
    // Clear existing selection if same candidate chosen for different preference
    const currentVote = { ...lpvVote };
    Object.keys(currentVote).forEach(key => {
      if (currentVote[key as keyof LPVVote] === candidateId && key !== preference) {
        currentVote[key as keyof LPVVote] = '';
      }
    });

    setLpvVote({
      ...currentVote,
      [preference]: candidateId === lpvVote[preference] ? '' : candidateId
    });

    const candidate = candidates.find(c => c.candidateId === candidateId);
    if (candidate) {
      toast.success(`${candidate.fullName} selected as ${preference.replace('Choice', ' choice')}`);
    }
  };

  const getCandidatePreference = (candidateId: string): number | null => {
    if (lpvVote.firstChoice === candidateId) return 1;
    if (lpvVote.secondChoice === candidateId) return 2;
    if (lpvVote.thirdChoice === candidateId) return 3;
    return null;
  };

  const handleCandidateClick = (candidate: EnhancedCandidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetail(true);
  };

  const playAudioIntroduction = (candidate: EnhancedCandidate) => {
    if (candidate.audioIntroduction) {
      // Play audio introduction
      toast.info(`Playing introduction for ${candidate.fullName}`);
    } else {
      toast.info(`No audio introduction available for ${candidate.fullName}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSessionTimeout = () => {
    toast.error('Voting session has expired. Please restart.');
    setCurrentStep(0);
  };

  const proceedToConfirmation = () => {
    if (!lpvVote.firstChoice) {
      toast.error('Please select at least your first choice candidate');
      return;
    }
    setCurrentStep(3);
  };

  const castVote = async () => {
    if (!ballot || !lpvVote.firstChoice) {
      toast.error('Invalid vote data');
      return;
    }

    try {
      setIsLoading(true);

      const voteRecord: LPVVoteRecord = {
        voteId: 'vote-' + Date.now(),
        ballotId: ballot.ballotId,
        electionId: ballot.electionId,
        constituency: ballot.constituency,
        voterIdHash: 'hash-voter-demo',
        voterConstituency: ballot.constituency,
        voterProvince: 'National Capital District',
        lpvVote,
        preferencesCount: Object.values(lpvVote).filter(Boolean).length,
        voteTimestamp: new Date(),
        biometricVerified: !!biometricResult,
        deviceFingerprint: 'device-' + Date.now(),
        voteHash: 'hash-' + Date.now(),
        status: 'vote_cast',
        castingDevice: 'digital-booth',
        networkInfo: 'demo-network',
        auditHash: 'audit-' + Date.now()
      };

      setVoteRecord(voteRecord);
      setCurrentStep(4);
      toast.success('Your vote has been cast successfully!');

    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Failed to cast vote');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Functions
  const renderGalleryView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {candidates.map((candidate, index) => {
        const preference = getCandidatePreference(candidate.candidateId);
        return (
          <Card
            key={candidate.candidateId}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              preference ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handleCandidateClick(candidate)}
          >
            <CardContent className="p-4">
              {/* Candidate Box Number */}
              <div className="flex justify-between items-start mb-3">
                <div className="bg-gray-800 text-white rounded-lg px-3 py-1 text-lg font-bold">
                  {index + 1}
                </div>
                {preference && (
                  <Badge className={`
                    ${preference === 1 ? 'bg-gold-500' : ''}
                    ${preference === 2 ? 'bg-silver-500' : ''}
                    ${preference === 3 ? 'bg-bronze-500' : ''}
                  `}>
                    {preference === 1 ? '1st Choice' : preference === 2 ? '2nd Choice' : '3rd Choice'}
                  </Badge>
                )}
              </div>

              {/* Candidate Photo */}
              <div className="text-center mb-4">
                <img
                  src={candidate.photo || candidate.citizenRecord?.photo || '/api/placeholder/150/150'}
                  alt={candidate.fullName}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-200"
                />
              </div>

              {/* Candidate Info */}
              <div className="text-center">
                <h3 className="font-bold text-lg mb-1">{candidate.fullName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {candidate.party} ({candidate.partyType})
                </p>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {candidate.campaignSlogan}
                </p>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={lpvVote.firstChoice === candidate.candidateId ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCandidate(candidate.candidateId, 'firstChoice');
                      }}
                      className="flex-1 text-xs"
                    >
                      1st
                    </Button>
                    <Button
                      size="sm"
                      variant={lpvVote.secondChoice === candidate.candidateId ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCandidate(candidate.candidateId, 'secondChoice');
                      }}
                      className="flex-1 text-xs"
                    >
                      2nd
                    </Button>
                    <Button
                      size="sm"
                      variant={lpvVote.thirdChoice === candidate.candidateId ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCandidate(candidate.candidateId, 'thirdChoice');
                      }}
                      className="flex-1 text-xs"
                    >
                      3rd
                    </Button>
                  </div>

                  {candidate.audioIntroduction && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudioIntroduction(candidate);
                      }}
                      className="w-full text-xs"
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Listen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderBoxSelectionView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {candidates.map((candidate, index) => (
          <Card
            key={candidate.candidateId}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => {
              setSelectedCandidate(candidate);
              setShowCandidateDetail(true);
            }}
          >
            <CardContent className="p-6 text-center">
              <div className="bg-gray-800 text-white rounded-lg px-4 py-3 text-2xl font-bold mb-2">
                {index + 1}
              </div>
              <p className="text-sm font-medium">{candidate.fullName}</p>
              <p className="text-xs text-gray-500">{candidate.party}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCandidate && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <img
                src={selectedCandidate.photo || selectedCandidate.citizenRecord?.photo || '/api/placeholder/150/150'}
                alt={selectedCandidate.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-800">{selectedCandidate.fullName}</h3>
                <p className="text-blue-600 mb-2">{selectedCandidate.party} ({selectedCandidate.partyType})</p>
                <p className="text-sm text-blue-700 mb-3">"{selectedCandidate.campaignSlogan}"</p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => selectCandidate(selectedCandidate.candidateId, 'firstChoice')}
                    variant={lpvVote.firstChoice === selectedCandidate.candidateId ? 'default' : 'outline'}
                  >
                    1st Choice
                  </Button>
                  <Button
                    onClick={() => selectCandidate(selectedCandidate.candidateId, 'secondChoice')}
                    variant={lpvVote.secondChoice === selectedCandidate.candidateId ? 'default' : 'outline'}
                  >
                    2nd Choice
                  </Button>
                  <Button
                    onClick={() => selectCandidate(selectedCandidate.candidateId, 'thirdChoice')}
                    variant={lpvVote.thirdChoice === selectedCandidate.candidateId ? 'default' : 'outline'}
                  >
                    3rd Choice
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing voting session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Vote className="h-6 w-6 text-blue-600" />
                  PNG Digital Voting Booth - LPV System
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Limited Preferential Voting - Select your 1st, 2nd, and 3rd choice candidates
                </p>
              </div>
              {timeRemaining > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-lg font-mono">
                    <Clock className="h-5 w-5 text-red-600" />
                    <span className={timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Time remaining</p>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Progress Steps */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {votingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < votingSteps.length - 1 && (
                    <div className={`h-0.5 w-8 mx-4 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Voting Interface */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Review Candidates - {ballot?.constituency}
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={displayMode === 'gallery' ? 'default' : 'outline'}
                    onClick={() => setDisplayMode('gallery')}
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Gallery
                  </Button>
                  <Button
                    size="sm"
                    variant={displayMode === 'box_selection' ? 'default' : 'outline'}
                    onClick={() => setDisplayMode('box_selection')}
                  >
                    <List className="h-4 w-4 mr-1" />
                    Box Selection
                  </Button>
                </div>
                <Button onClick={() => setCurrentStep(2)}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Start Voting
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {displayMode === 'gallery' ? renderGalleryView() : renderBoxSelectionView()}
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Make Your Preferential Choices
              </CardTitle>
              <p className="text-gray-600">
                Click the 1st, 2nd, or 3rd buttons to select your preference order
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>LPV Instructions:</strong> You must select at least your 1st choice.
                    You may also select 2nd and 3rd choices. Your vote will be counted using Limited Preferential Voting.
                  </AlertDescription>
                </Alert>
              </div>

              {renderGalleryView()}

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Review
                </Button>
                <Button onClick={proceedToConfirmation} disabled={!lpvVote.firstChoice}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Confirm Choices
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Confirm Your Vote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Please review your choices carefully. Once you cast your vote, it cannot be changed.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  {[lpvVote.firstChoice, lpvVote.secondChoice, lpvVote.thirdChoice].map((candidateId, index) => {
                    if (!candidateId) return null;
                    const candidate = candidates.find(c => c.candidateId === candidateId);
                    if (!candidate) return null;

                    return (
                      <div key={candidateId} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
                          ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}
                        `}>
                          {index + 1}
                        </div>
                        <img
                          src={candidate.photo || candidate.citizenRecord?.photo || '/api/placeholder/50/50'}
                          alt={candidate.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold">{candidate.fullName}</h4>
                          <p className="text-sm text-gray-600">{candidate.party}</p>
                        </div>
                        <Badge className={`ml-auto ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {index === 0 ? '1st Choice' : index === 1 ? '2nd Choice' : '3rd Choice'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Change Choices
                  </Button>
                  <Button onClick={castVote} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                    {isLoading ? 'Casting Vote...' : 'Cast My Vote'}
                    <Vote className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && voteRecord && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-6 w-6" />
                Vote Successfully Cast!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">
                    Your Limited Preferential Vote has been recorded. Thank you for participating in the democratic process.
                  </AlertDescription>
                </Alert>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Vote Receipt</h4>
                  <p className="text-sm text-gray-600">Vote ID: {voteRecord.voteId}</p>
                  <p className="text-sm text-gray-600">
                    Cast at: {new Date(voteRecord.voteTimestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Preferences: {voteRecord.preferencesCount} selected
                  </p>
                </div>

                <Button onClick={() => window.location.reload()} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start New Voting Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Candidate Detail Modal */}
        <Dialog open={showCandidateDetail} onOpenChange={setShowCandidateDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Candidate Information</DialogTitle>
            </DialogHeader>
            {selectedCandidate && (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={selectedCandidate.photo || selectedCandidate.citizenRecord?.photo || '/api/placeholder/150/150'}
                    alt={selectedCandidate.fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{selectedCandidate.fullName}</h3>
                    <p className="text-gray-600">{selectedCandidate.party} ({selectedCandidate.partyType})</p>
                    <p className="text-lg italic text-blue-600 mt-2">"{selectedCandidate.campaignSlogan}"</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Biography</h4>
                  <p className="text-gray-700">{selectedCandidate.biography}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Policy Platform</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCandidate.policyPlatform.map((policy, index) => (
                      <li key={index} className="text-gray-700">{policy}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      selectCandidate(selectedCandidate.candidateId, 'firstChoice');
                      setShowCandidateDetail(false);
                    }}
                    variant={lpvVote.firstChoice === selectedCandidate.candidateId ? 'default' : 'outline'}
                  >
                    Select as 1st Choice
                  </Button>
                  <Button
                    onClick={() => {
                      selectCandidate(selectedCandidate.candidateId, 'secondChoice');
                      setShowCandidateDetail(false);
                    }}
                    variant={lpvVote.secondChoice === selectedCandidate.candidateId ? 'default' : 'outline'}
                  >
                    Select as 2nd Choice
                  </Button>
                  <Button
                    onClick={() => {
                      selectCandidate(selectedCandidate.candidateId, 'thirdChoice');
                      setShowCandidateDetail(false);
                    }}
                    variant={lpvVote.thirdChoice === selectedCandidate.candidateId ? 'default' : 'outline'}
                  >
                    Select as 3rd Choice
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
