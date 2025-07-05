import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { electoralService } from '../services/electoralService';
import type { Candidate, DigitalBallot, VoteRecord, VoterEligibility } from '../types/electoral';
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
  const [ballot, setBallot] = useState<DigitalBallot | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [voterEligibility, setVoterEligibility] = useState<VoterEligibility | null>(null);
  const [biometricResult, setBiometricResult] = useState<BiometricVerificationResult | null>(null);
  const [biometricInitialized, setBiometricInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [voteRecord, setVoteRecord] = useState<VoteRecord | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
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
      title: 'Review Ballot',
      description: 'Review the candidates for your constituency',
      completed: false
    },
    {
      id: 'selection',
      title: 'Make Selection',
      description: 'Select your preferred candidate',
      completed: false
    },
    {
      id: 'confirmation',
      title: 'Confirm Vote',
      description: 'Review and confirm your vote',
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

      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        toast.error('Please log in to vote');
        return;
      }

      // Initialize biometric system
      toast.info('🔍 Initializing biometric verification...');
      const biometricInit = await biometricService.initialize();
      setBiometricInitialized(biometricInit);

      if (biometricInit) {
        const capabilities = await biometricService.checkBiometricCapabilities();
        if (capabilities.available) {
          toast.success('✅ Biometric verification ready');
        } else {
          toast.warning('⚠️ Biometric verification not available - using standard authentication');
        }
      }

      // For demo purposes, we'll use a mock election and constituency
      const mockElectionId = 'ELEC_2027_NATIONAL';
      const mockConstituency = 'National Capital District';

      // Create mock citizen record for demo users if they don't exist
      if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
        const mockCitizen = {
          citizenId: currentUser.uid,
          nationalIdNumber: `PNG${currentUser.uid.slice(-6)}`,
          fullName: authService.getUserDisplayName(),
          dateOfBirth: '1985-01-01', // Mock age 38+ (eligible)
          province: 'National Capital District',
          district: 'National Capital District',
          voterStatus: true,
          createdAt: new Date().toISOString(),
          photo: '', // Would have biometric photo
          fingerprint: '' // Would have fingerprint data
        };

        // Store mock citizen record for voting eligibility
        try {
          const { db } = await import('../services/database');
          await db.addRecord('citizens', mockCitizen);
        } catch (error) {
          console.log('Mock citizen record creation (demo mode):', error);
        }
      }

      // Check voter eligibility
      const eligibility = await electoralService.checkVoterEligibility(
        currentUser.uid,
        mockElectionId,
        mockConstituency
      );

      setVoterEligibility(eligibility);

      if (!eligibility.isEligible) {
        // In demo mode, show more helpful message
        if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
          toast.success('Demo mode: Creating voter eligibility record...');
          // Force eligibility for demo
          const demoEligibility = {
            ...eligibility,
            isEligible: true,
            ageEligible: true,
            citizenshipVerified: true,
            hasVotedInThisElection: false,
            canVoteAtCurrentLocation: true,
            constituencyOfOrigin: mockConstituency,
            registrationStatus: 'verified' as const
          };
          setVoterEligibility(demoEligibility);
        } else {
          toast.error('You are not eligible to vote in this election');
          return;
        }
      }

      // Check if already voted
      if (eligibility.hasVotedInThisElection && !import.meta.env.DEV) {
        toast.error('You have already voted in this election');
        return;
      }

      // Generate ballot - create mock candidates for demo
      let generatedBallot;
      try {
        generatedBallot = await electoralService.generateBallot(
          mockElectionId,
          mockConstituency,
          currentUser.uid
        );
      } catch (error) {
        // Create mock ballot for demo mode
        if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
          console.log('Creating mock ballot for demo mode');
          generatedBallot = {
            ballotId: `BALLOT_${Date.now()}`,
            electionId: mockElectionId,
            constituency: mockConstituency,
            voterId: currentUser.uid,
            ballotTitle: '2027 PNG National General Election - National Capital District',
            ballotInstructions: {
              text: 'Select one candidate to represent your constituency',
              languages: {
                english: 'Select one candidate to represent your constituency',
                tokPisin: 'Makim wanpela kandidet bilong representim konstituensi bilong yu',
                hiriMotu: 'Gagarai ta gauna kandideti tauna-na constituency-mu hamo representative-na'
              }
            },
            candidates: [
              {
                candidateId: 'DEMO_CAND_001',
                fullName: 'James Marape',
                party: 'Pangu Pati',
                partyType: 'political_party' as const,
                constituency: mockConstituency,
                photo: '',
                biography: 'Current Prime Minister of Papua New Guinea',
                campaignSlogan: 'Take Back PNG',
                policyPlatform: ['Economic Growth', 'Education Reform', 'Healthcare'],
                status: 'approved' as const,
                electionId: mockElectionId,
                nationalIdNumber: 'PNG001',
                dateOfBirth: '1971-04-04',
                registrationDate: new Date(),
                registeredBy: 'system',
                voteCount: 0,
                votePercentage: 0,
                isEligible: true,
                documentsVerified: true,
                backgroundCheckPassed: true,
                nominationFeesPaid: true
              },
              {
                candidateId: 'DEMO_CAND_002',
                fullName: 'Peter O\'Neill',
                party: 'People\'s National Congress',
                partyType: 'political_party' as const,
                constituency: mockConstituency,
                photo: '',
                biography: 'Former Prime Minister of Papua New Guinea',
                campaignSlogan: 'Progress for All',
                policyPlatform: ['Infrastructure', 'Employment', 'Agriculture'],
                status: 'approved' as const,
                electionId: mockElectionId,
                nationalIdNumber: 'PNG002',
                dateOfBirth: '1965-02-13',
                registrationDate: new Date(),
                registeredBy: 'system',
                voteCount: 0,
                votePercentage: 0,
                isEligible: true,
                documentsVerified: true,
                backgroundCheckPassed: true,
                nominationFeesPaid: true
              },
              {
                candidateId: 'DEMO_CAND_003',
                fullName: 'Belden Namah',
                party: 'Independent',
                partyType: 'independent' as const,
                constituency: mockConstituency,
                photo: '',
                biography: 'Opposition Leader and Former Deputy PM',
                campaignSlogan: 'Unity and Progress',
                policyPlatform: ['Good Governance', 'Anti-Corruption', 'Development'],
                status: 'approved' as const,
                electionId: mockElectionId,
                nationalIdNumber: 'PNG003',
                dateOfBirth: '1968-11-15',
                registrationDate: new Date(),
                registeredBy: 'system',
                voteCount: 0,
                votePercentage: 0,
                isEligible: true,
                documentsVerified: true,
                backgroundCheckPassed: true,
                nominationFeesPaid: true
              }
            ],
            maxSelections: 1,
            requiresRanking: false,
            accessibilityFeatures: {
              largeText: true,
              highContrast: true,
              audioAssistance: true,
              touchOptimized: true,
              screenReader: true
            },
            ballotHash: 'DEMO_HASH_123',
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
          };
        } else {
          throw error;
        }
      }

      setBallot(generatedBallot);
      setCurrentStep(1); // Move to ballot review

      toast.success('Voting session initialized successfully!');

    } catch (error) {
      console.error('Error initializing voting session:', error);
      toast.error('Failed to initialize voting session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCandidateSelection = (candidateId: string) => {
    setSelectedCandidate(candidateId);

    // Auto-advance to confirmation if single selection
    if (ballot?.maxSelections === 1) {
      setTimeout(() => {
        setCurrentStep(3); // Move to confirmation
      }, 500);
    }
  };

  const handleVoteSubmission = async () => {
    if (!ballot || !selectedCandidate) {
      toast.error('Please select a candidate before submitting');
      return;
    }

    try {
      setIsLoading(true);

      // Cast vote
      const vote = await electoralService.castVote(
        ballot.ballotId,
        selectedCandidate,
        { /* biometric data would go here */ }
      );

      setVoteRecord(vote);
      setCurrentStep(4); // Move to completion
      setShowConfirmation(false);

      toast.success('Your vote has been cast successfully!');

    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Failed to cast vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionTimeout = () => {
    toast.error('Voting session has expired. Please start again.');
    // Reset to initial state
    setBallot(null);
    setSelectedCandidate(null);
    setCurrentStep(0);
  };

  const handleBiometricVerification = async () => {
    try {
      setIsLoading(true);
      toast.info('🔍 Starting biometric verification...');

      const currentUser = authService.getCurrentUser();
      const result = await biometricService.verifyVoterIdentity(currentUser?.uid);

      setBiometricResult(result);

      if (result.success) {
        toast.success('✅ Biometric verification successful!');
        // Audit the biometric access
        await biometricService.auditBiometricAccess('voter_verification', currentUser?.uid);
      } else {
        toast.error('❌ Biometric verification failed');
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      toast.error('Biometric verification encountered an error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const getSelectedCandidateInfo = () => {
    if (!ballot || !selectedCandidate) return null;
    return ballot.candidates.find(c => c.candidateId === selectedCandidate);
  };

  if (isLoading && !ballot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Initializing Voting Session</h3>
              <p className="text-gray-600">Please wait while we verify your eligibility...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-green-50 p-4 ${
      accessibilityMode.largeText ? 'text-lg' : ''
    } ${accessibilityMode.highContrast ? 'high-contrast' : ''}`}>

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="border-2 border-yellow-400">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">🗳️ PNG Digital Voting Booth</CardTitle>
                <p className="text-red-100">2027 National General Election</p>
              </div>

              {timeRemaining > 0 && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                  <Clock className="h-5 w-5" />
                  <span className="font-mono text-lg">{formatTimeRemaining(timeRemaining)}</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {votingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  <div className="ml-3 hidden md:block">
                    <div className={`font-semibold ${index <= currentStep ? 'text-red-600' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-sm text-gray-500">{step.description}</div>
                  </div>

                  {index < votingSteps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-red-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Controls */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Accessibility Options</h3>
              <div className="flex gap-2">
                <Button
                  variant={accessibilityMode.largeText ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAccessibilityMode(prev => ({ ...prev, largeText: !prev.largeText }))}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Large Text
                </Button>
                <Button
                  variant={accessibilityMode.audioEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAccessibilityMode(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }))}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Audio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === 0 && (
          <VoterVerificationStep
            voterEligibility={voterEligibility}
            biometricResult={biometricResult}
            onBiometricVerify={handleBiometricVerification}
            biometricInitialized={biometricInitialized}
          />
        )}
        {currentStep === 1 && ballot && <BallotReviewStep ballot={ballot} onNext={() => setCurrentStep(2)} />}
        {currentStep === 2 && ballot && (
          <CandidateSelectionStep
            ballot={ballot}
            selectedCandidate={selectedCandidate}
            onCandidateSelect={handleCandidateSelection}
            accessibilityMode={accessibilityMode}
            onPlayAudio={playAudio}
          />
        )}
        {currentStep === 3 && ballot && selectedCandidate && (
          <VoteConfirmationStep
            ballot={ballot}
            selectedCandidate={getSelectedCandidateInfo()}
            onConfirm={() => setShowConfirmation(true)}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && voteRecord && <VoteCompletionStep voteRecord={voteRecord} />}
      </div>

      {/* Navigation */}
      {currentStep > 0 && currentStep < 4 && (
        <div className="max-w-4xl mx-auto mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={() => {
                    if (currentStep === 2 && selectedCandidate) {
                      setCurrentStep(3);
                    } else if (currentStep < 4) {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={currentStep === 2 && !selectedCandidate}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {currentStep === 3 ? 'Cast Vote' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🗳️ Final Vote Confirmation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Once you submit your vote, it cannot be changed.
                Please review your selection carefully.
              </AlertDescription>
            </Alert>

            {selectedCandidate && ballot && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">Your Selected Candidate:</h4>
                <div className="flex items-center gap-3">
                  {getSelectedCandidateInfo()?.photo && (
                    <img
                      src={getSelectedCandidateInfo()?.photo}
                      alt={getSelectedCandidateInfo()?.fullName}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="text-lg font-bold">{getSelectedCandidateInfo()?.fullName}</div>
                    <div className="text-gray-600">{getSelectedCandidateInfo()?.party || 'Independent'}</div>
                    <div className="text-sm text-gray-500">{ballot.constituency}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Review Again
              </Button>
              <Button
                onClick={handleVoteSubmission}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Submitting Vote...' : 'Submit My Vote'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Individual Step Components
const VoterVerificationStep: React.FC<{
  voterEligibility: VoterEligibility | null;
  biometricResult: BiometricVerificationResult | null;
  onBiometricVerify: () => void;
  biometricInitialized: boolean;
}> = ({ voterEligibility, biometricResult, onBiometricVerify, biometricInitialized }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <User className="h-5 w-5" />
        Voter Verification
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Biometric Verification Section */}
        <div className="p-4 border rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-blue-600" />
            🔒 Biometric Identity Verification
          </h3>

          {biometricInitialized ? (
            <div className="space-y-4">
              {!biometricResult ? (
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    Verify your identity using your device's biometric authentication
                  </p>
                  <Button
                    onClick={onBiometricVerify}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Start Biometric Verification
                  </Button>
                </div>
              ) : biometricResult.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Biometric verification successful!
                    Confidence: {biometricResult.confidence}%
                    Time: {biometricResult.verificationTime}ms
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    ❌ Biometric verification failed: {biometricResult.errorMessage}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                ⚠️ Biometric system not initialized. Using standard verification.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Standard Eligibility Check */}
        {voterEligibility?.isEligible ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Your electoral eligibility has been verified. You are authorized to vote in this election.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-semibold">Voter Information</div>
                <div>National ID: {voterEligibility.nationalIdNumber}</div>
                <div>Constituency: {voterEligibility.constituencyOfOrigin}</div>
                <div>Registration: {voterEligibility.registrationStatus}</div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold">Verification Status</div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Age Eligible: {voterEligibility.ageEligible ? 'Yes' : 'No'}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Citizenship Verified
                </div>
                <div className="flex items-center gap-2">
                  {biometricResult?.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  Biometric: {biometricResult?.success ? 'Verified' : 'Pending'}
                </div>
                <div className="flex items-center gap-2">
                  {voterEligibility.hasVotedInThisElection ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  Vote Status: {voterEligibility.hasVotedInThisElection ? 'Already Voted' : 'Can Vote'}
                </div>
              </div>
            </div>

            {/* PNG Electoral Commission Compliance */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🇵🇬 PNG Electoral Commission Verified</h4>
              <div className="text-sm text-green-700 space-y-1">
                <div>✓ Meets PNG constitutional voting requirements</div>
                <div>✓ Verified against national voter registry</div>
                <div>✓ Compliant with Election Organic Law</div>
                {biometricResult?.success && <div>✓ Biometric authentication completed</div>}
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to verify voter eligibility. Please contact a PNG Electoral Commission officer.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </CardContent>
  </Card>
);

const BallotReviewStep: React.FC<{ ballot: DigitalBallot; onNext: () => void }> = ({ ballot, onNext }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Vote className="h-5 w-5" />
        Your Ballot
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">{ballot.ballotTitle}</h3>
          <p className="text-gray-600">{ballot.ballotInstructions.text}</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Constituency: {ballot.constituency}
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Candidates: {ballot.candidates.length}
          </div>
          <div className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Select: {ballot.maxSelections} candidate{ballot.maxSelections > 1 ? 's' : ''}
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please review the ballot information above. Click "Next" to proceed to candidate selection.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button onClick={onNext} className="bg-red-600 hover:bg-red-700">
            Proceed to Candidate Selection
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CandidateSelectionStep: React.FC<{
  ballot: DigitalBallot;
  selectedCandidate: string | null;
  onCandidateSelect: (candidateId: string) => void;
  accessibilityMode: any;
  onPlayAudio: (text: string) => void;
}> = ({ ballot, selectedCandidate, onCandidateSelect, accessibilityMode, onPlayAudio }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Vote className="h-5 w-5" />
        Select Your Candidate
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Choose ONE candidate to represent your constituency. Click on a candidate card to select them.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ballot.candidates.map(candidate => (
            <CandidateCard
              key={candidate.candidateId}
              candidate={candidate}
              isSelected={selectedCandidate === candidate.candidateId}
              onSelect={() => onCandidateSelect(candidate.candidateId)}
              accessibilityMode={accessibilityMode}
              onPlayAudio={onPlayAudio}
            />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const CandidateCard: React.FC<{
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
  accessibilityMode: any;
  onPlayAudio: (text: string) => void;
}> = ({ candidate, isSelected, onSelect, accessibilityMode, onPlayAudio }) => (
  <Card
    className={`cursor-pointer transition-all duration-200 ${
      isSelected
        ? 'border-red-600 border-2 bg-red-50 shadow-lg'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}
    onClick={onSelect}
  >
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        {candidate.photo ? (
          <img
            src={candidate.photo}
            alt={candidate.fullName}
            className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2">
            <User className="h-8 w-8 text-gray-500" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{candidate.fullName}</h3>
              <div className="text-sm text-gray-600 mb-2">
                {candidate.party ? (
                  <Badge variant="outline">{candidate.party}</Badge>
                ) : (
                  <Badge variant="outline">Independent</Badge>
                )}
              </div>
            </div>

            {isSelected && (
              <CheckCircle className="h-6 w-6 text-red-600" />
            )}
          </div>

          {candidate.campaignSlogan && (
            <p className="text-sm text-gray-700 italic mb-2">"{candidate.campaignSlogan}"</p>
          )}

          {candidate.policyPlatform && candidate.policyPlatform.length > 0 && (
            <div className="text-sm text-gray-600">
              <strong>Key Policies:</strong>
              <ul className="list-disc list-inside mt-1">
                {candidate.policyPlatform.slice(0, 2).map((policy, index) => (
                  <li key={index}>{policy}</li>
                ))}
              </ul>
            </div>
          )}

          {accessibilityMode.audioEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAudio(`Candidate ${candidate.fullName}, ${candidate.party || 'Independent'}. ${candidate.biography}`);
              }}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Play Audio
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const VoteConfirmationStep: React.FC<{
  ballot: DigitalBallot;
  selectedCandidate: Candidate | undefined | null;
  onConfirm: () => void;
  onBack: () => void;
}> = ({ ballot, selectedCandidate, onConfirm, onBack }) => (
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
            Please review your selection below. Once confirmed, your vote cannot be changed.
          </AlertDescription>
        </Alert>

        {selectedCandidate && (
          <div className="p-6 border-2 border-red-200 rounded-lg bg-red-50">
            <h3 className="text-lg font-semibold mb-4">Your Selected Candidate:</h3>

            <div className="flex items-center gap-4">
              {selectedCandidate.photo && (
                <img
                  src={selectedCandidate.photo}
                  alt={selectedCandidate.fullName}
                  className="h-24 w-24 rounded-full object-cover border-2 border-red-300"
                />
              )}

              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedCandidate.fullName}</h4>
                <p className="text-gray-600">{selectedCandidate.party || 'Independent Candidate'}</p>
                <p className="text-sm text-gray-500">{ballot.constituency}</p>
                {selectedCandidate.campaignSlogan && (
                  <p className="text-sm text-gray-700 italic mt-2">"{selectedCandidate.campaignSlogan}"</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Selection
          </Button>

          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            <Lock className="h-4 w-4 mr-2" />
            Confirm & Cast Vote
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const VoteCompletionStep: React.FC<{ voteRecord: VoteRecord }> = ({ voteRecord }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        Vote Successfully Cast!
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6 text-center">
        <div className="text-6xl">🗳️</div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You for Voting!</h3>
          <p className="text-gray-600">
            Your vote has been recorded and will be counted in the election results.
          </p>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <div><strong>Vote ID:</strong> {voteRecord.voteId}</div>
            <div><strong>Constituency:</strong> {voteRecord.constituency}</div>
            <div><strong>Time Cast:</strong> {new Date(voteRecord.voteTimestamp).toLocaleString()}</div>
            <div><strong>Status:</strong> {voteRecord.status}</div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your vote is anonymous and secure. This vote ID is for verification purposes only
            and cannot be used to identify how you voted.
          </AlertDescription>
        </Alert>

        <div className="pt-4">
          <p className="text-sm text-gray-600">
            🇵🇬 Thank you for participating in Papua New Guinea's democratic process!
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
