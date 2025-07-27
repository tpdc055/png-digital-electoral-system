import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  Fingerprint,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  MapPin,
  Phone,
  Users,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

import type { VerifierData, VerificationSession, VerifierRole } from '../types/citizen';
import { verificationService } from '../services/verificationService';
import { FingerprintCapture } from './FingerprintCapture';

interface VerificationComponentProps {
  citizenId?: string;
  citizenName?: string;
  onVerificationComplete?: (session: VerificationSession) => void;
  onSkipVerification?: () => void;
  disabled?: boolean;
}

export const VerificationComponent: React.FC<VerificationComponentProps> = ({
  citizenId,
  citizenName,
  onVerificationComplete,
  onSkipVerification,
  disabled = false
}) => {
  const [verifiers, setVerifiers] = useState<VerifierData[]>([]);
  const [selectedVerifier, setSelectedVerifier] = useState<string>('');
  const [verifierFingerprint, setVerifierFingerprint] = useState<string>('');
  const [showFingerprintCapture, setShowFingerprintCapture] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
  const [settings, setSettings] = useState(verificationService.getSettings());
  const [skipVerification, setSkipVerification] = useState(false);

  // Enhanced verification options
  const [verificationMethod, setVerificationMethod] = useState<'checkbox' | 'fingerprint'>('checkbox');
  const [verifierConfirmation, setVerifierConfirmation] = useState(false);
  const [verifierStatement, setVerifierStatement] = useState('');
  const [verifierPhone, setVerifierPhone] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [verificationReason, setVerificationReason] = useState('');

  useEffect(() => {
    loadVerifiers();
  }, []);

  const loadVerifiers = async () => {
    try {
      const registeredVerifiers = await verificationService.getActiveVerifiers();

      // Enhanced mock verifiers for PNG with pastors and councillors
      const mockVerifiers: VerifierData[] = [
        {
          id: 'PASTOR-001',
          fullName: 'Rev. John Namaliu',
          role: 'Pastor' as VerifierRole,
          community: 'Hanuabada Village, Port Moresby South',
          province: 'National Capital District',
          district: 'Port Moresby',
          llg: 'Port Moresby South',
          phoneNumber: '+675 7123 4567',
          email: 'pastor.john@pngchurch.org',
          verificationsPerformed: 45,
          isActive: true,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
          synced: true,
          fingerprint: 'PASTOR_001_FP_HASH'
        },
        {
          id: 'COUNCILOR-001',
          fullName: 'Mary Kila',
          role: 'Councilor' as VerifierRole,
          community: 'Ward 5, Port Moresby South',
          province: 'National Capital District',
          district: 'Port Moresby',
          llg: 'Port Moresby South',
          phoneNumber: '+675 7234 5678',
          email: 'mary.kila@pom.gov.pg',
          verificationsPerformed: 67,
          isActive: true,
          createdAt: '2024-01-08T00:00:00Z',
          updatedAt: '2024-01-08T00:00:00Z',
          synced: true,
          fingerprint: 'COUNCILOR_001_FP_HASH'
        },
        {
          id: 'PASTOR-002',
          fullName: 'Rev. Peter Wambi',
          role: 'Pastor' as VerifierRole,
          community: 'Sabama Village, Port Moresby South',
          province: 'National Capital District',
          district: 'Port Moresby',
          llg: 'Port Moresby South',
          phoneNumber: '+675 7345 6789',
          email: 'peter.wambi@unitedchurch.pg',
          verificationsPerformed: 38,
          isActive: true,
          createdAt: '2024-01-12T00:00:00Z',
          updatedAt: '2024-01-12T00:00:00Z',
          synced: true,
          fingerprint: 'PASTOR_002_FP_HASH'
        },
        {
          id: 'COUNCILOR-002',
          fullName: 'Elizabeth Kaupa',
          role: 'Councilor' as VerifierRole,
          community: 'Ward 3, Port Moresby South',
          province: 'National Capital District',
          district: 'Port Moresby',
          llg: 'Port Moresby South',
          phoneNumber: '+675 7456 7890',
          email: 'elizabeth.kaupa@pom.gov.pg',
          verificationsPerformed: 52,
          isActive: true,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          synced: true,
          fingerprint: 'COUNCILOR_002_FP_HASH'
        }
      ];

      setVerifiers([...registeredVerifiers, ...mockVerifiers]);
    } catch (error) {
      console.error('Failed to load verifiers:', error);
      toast.error('Failed to load community verifiers');
    }
  };

  const handleVerifierSelect = (verifierId: string) => {
    setSelectedVerifier(verifierId);
    const verifier = verifiers.find(v => v.id === verifierId);
    if (verifier) {
      setVerifierPhone(verifier.phoneNumber || '');
    }
    // Reset verification states when changing verifier
    setVerifierFingerprint('');
    setVerifierConfirmation(false);
    setVerifierStatement('');
  };

  const handleFingerprintCapture = (fingerprintData: string) => {
    setVerifierFingerprint(fingerprintData);
    setShowFingerprintCapture(false);
    toast.success('Verifier fingerprint captured successfully');
  };

  const performVerification = async () => {
    if (!selectedVerifier) {
      toast.error('Please select a community leader to verify this person');
      return;
    }

    if (!citizenName) {
      toast.error('Citizen name is required for verification');
      return;
    }

    // Validate verification method requirements
    if (verificationMethod === 'fingerprint') {
      if (!verifierFingerprint) {
        toast.error('Verifier fingerprint is required for verification');
        return;
      }
    } else {
      if (!verifierConfirmation) {
        toast.error('Verifier must confirm that this person is genuine and not a ghost name');
        return;
      }
      if (!verifierStatement.trim()) {
        toast.error('Verifier statement is required');
        return;
      }
    }

    if (!verificationReason.trim()) {
      toast.error('Please provide a reason for verification');
      return;
    }

    setIsVerifying(true);

    try {
      const session = await verificationService.performVerification(
        citizenId || 'TEMP_ID',
        selectedVerifier,
        verificationMethod === 'fingerprint' ? verifierFingerprint : undefined
      );

      setVerificationSession(session);
      setVerified(true);

      const verifierData = verifiers.find(v => v.id === selectedVerifier);
      toast.success(`✅ Identity verified by ${verifierData?.fullName} (${verifierData?.role})`);

      if (onVerificationComplete) {
        onVerificationComplete(session);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error(`Verification failed: ${(error as Error).message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkip = () => {
    if (onSkipVerification) {
      onSkipVerification();
    }
    setSkipVerification(true);
    toast.warning('⚠️ Registration will proceed without community verification');
  };

  const selectedVerifierData = verifiers.find(v => v.id === selectedVerifier);

  if (!settings.verificationRequired) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            Community Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Community verification is currently disabled. Citizens will be registered without verification.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (verified && verificationSession) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            ✅ Identity Verified by Community Leader
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Verified by:</span>
              <p className="text-green-700 font-semibold">{verificationSession.verifierName}</p>
            </div>
            <div>
              <span className="font-medium">Role:</span>
              <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">
                {verificationSession.verifierRole}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Method:</span>
              <p className="text-green-700">
                {verificationMethod === 'fingerprint' ? '👆 Fingerprint' : '☑️ Confirmation'}
              </p>
            </div>
            <div>
              <span className="font-medium">Verified at:</span>
              <p className="text-green-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(verificationSession.verifiedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {verifierStatement && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <span className="font-medium text-green-800">Verifier Statement:</span>
              <p className="text-green-700 text-sm mt-1">"{verifierStatement}"</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (skipVerification) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            ⚠️ Verification Skipped
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This registration was completed without community verification.
              The person's identity has not been confirmed by a Pastor or Ward Councilor.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Users className="h-5 w-5" />
          🛡️ Community Verification Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>ANTI-GHOST NAME VERIFICATION:</strong> A community leader (Pastor or Ward Councilor)
            must verify that <strong>{citizenName || 'this person'}</strong> is a genuine person and not a fake identity.
            This verification is mandatory to prevent electoral fraud.
          </AlertDescription>
        </Alert>

        {verifiers.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No authorized verifiers are available. Please contact an administrator
              to register community leaders first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Verifier Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Select Community Leader *
              </Label>
              <Select
                value={selectedVerifier}
                onValueChange={handleVerifierSelect}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a Pastor or Ward Councilor" />
                </SelectTrigger>
                <SelectContent>
                  {verifiers.map((verifier) => (
                    <SelectItem key={verifier.id} value={verifier.id!}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {verifier.role}
                        </Badge>
                        <span className="font-medium">{verifier.fullName}</span>
                        <span className="text-gray-500 text-xs">
                          - {verifier.community}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Verifier Info */}
            {selectedVerifierData && (
              <Card className="bg-white border-blue-200">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p className="font-semibold">{selectedVerifierData.fullName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Role:</span>
                      <Badge className="bg-blue-100 text-blue-800">{selectedVerifierData.role}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Community:</span>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedVerifierData.community}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedVerifierData.phoneNumber}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Previous Verifications:</span>
                      <p className="text-blue-700 font-semibold">{selectedVerifierData.verificationsPerformed} citizens verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Verification Method Selection */}
            {selectedVerifier && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Choose Verification Method *
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card
                      className={`cursor-pointer transition-all ${
                        verificationMethod === 'checkbox' ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setVerificationMethod('checkbox')}
                    >
                      <CardContent className="p-4 text-center">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h3 className="font-semibold">Checkbox Verification</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Verifier confirms with statement and checkbox
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all ${
                        verificationMethod === 'fingerprint' ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setVerificationMethod('fingerprint')}
                    >
                      <CardContent className="p-4 text-center">
                        <Fingerprint className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h3 className="font-semibold">Fingerprint Verification</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Biometric verification with fingerprint
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Checkbox Verification Method */}
                {verificationMethod === 'checkbox' && (
                  <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-blue-800">☑️ Checkbox Verification Process</h4>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="verifier-statement" className="text-sm font-medium">
                          Verifier Statement *
                        </Label>
                        <Textarea
                          id="verifier-statement"
                          value={verifierStatement}
                          onChange={(e) => setVerifierStatement(e.target.value)}
                          placeholder="I confirm that I personally know this person and can verify their identity..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="verification-reason" className="text-sm font-medium">
                          Reason for Verification *
                        </Label>
                        <Input
                          id="verification-reason"
                          value={verificationReason}
                          onChange={(e) => setVerificationReason(e.target.value)}
                          placeholder="e.g., Known community member for 5 years, family member, etc."
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="witness-name" className="text-sm font-medium">
                          Witness Name (Optional)
                        </Label>
                        <Input
                          id="witness-name"
                          value={witnessName}
                          onChange={(e) => setWitnessName(e.target.value)}
                          placeholder="Name of witness present during verification"
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-start space-x-3 p-3 border border-red-200 rounded bg-red-50">
                        <Checkbox
                          id="verifier-confirmation"
                          checked={verifierConfirmation}
                          onCheckedChange={(checked) => setVerifierConfirmation(checked as boolean)}
                        />
                        <Label htmlFor="verifier-confirmation" className="text-sm font-medium text-red-800 leading-tight">
                          I confirm that <strong>{citizenName || 'this person'}</strong> is a genuine person and NOT a ghost name.
                          I personally know this individual and can verify their identity in the community.
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fingerprint Verification Method */}
                {verificationMethod === 'fingerprint' && (
                  <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-blue-800">👆 Fingerprint Verification Process</h4>

                    <div>
                      <Label htmlFor="verification-reason-fp" className="text-sm font-medium">
                        Reason for Verification *
                      </Label>
                      <Input
                        id="verification-reason-fp"
                        value={verificationReason}
                        onChange={(e) => setVerificationReason(e.target.value)}
                        placeholder="e.g., Known community member for 5 years, family member, etc."
                        className="mt-1"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Verifier Fingerprint Required *
                        </Label>
                        {verifierFingerprint ? (
                          <Badge className="bg-green-100 text-green-800">
                            ✅ Fingerprint Captured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            ⚠️ Fingerprint Required
                          </Badge>
                        )}
                      </div>

                      {!verifierFingerprint && (
                        <Button
                          variant="outline"
                          onClick={() => setShowFingerprintCapture(true)}
                          disabled={disabled}
                          className="w-full"
                        >
                          <Fingerprint className="h-4 w-4 mr-2" />
                          Capture Verifier Fingerprint
                        </Button>
                      )}

                      {showFingerprintCapture && (
                        <FingerprintCapture
                          onCapture={handleFingerprintCapture}
                          onCancel={() => setShowFingerprintCapture(false)}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Verification Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={performVerification}
                    disabled={
                      disabled ||
                      !selectedVerifier ||
                      isVerifying ||
                      !verificationReason.trim() ||
                      (verificationMethod === 'fingerprint' && !verifierFingerprint) ||
                      (verificationMethod === 'checkbox' && (!verifierConfirmation || !verifierStatement.trim()))
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isVerifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Verifying Identity...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Identity
                      </>
                    )}
                  </Button>

                  {settings.allowUnverifiedRegistration && (
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      disabled={disabled || isVerifying}
                      className="text-orange-600 border-orange-300"
                    >
                      Skip Verification
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
