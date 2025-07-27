import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Shield,
  User,
  MapPin,
  Phone,
  Mail,
  Camera,
  Fingerprint,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import type { VerifierData, VerifierRole } from '../types/citizen';
import { PNG_PROVINCES } from '../types/citizen';
import { verificationService } from '../services/verificationService';
import { CameraCapture } from './CameraCapture';
import { FingerprintCapture } from './FingerprintCapture';

interface VerifierRegistrationProps {
  onRegistrationComplete?: (verifier: VerifierData) => void;
  onCancel?: () => void;
}

export const VerifierRegistration: React.FC<VerifierRegistrationProps> = ({
  onRegistrationComplete,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    role: '' as VerifierRole,
    community: '',
    province: '',
    district: '',
    llg: '',
    phoneNumber: '',
    email: ''
  });

  const [photo, setPhoto] = useState<string>('');
  const [fingerprint, setFingerprint] = useState<string>('');
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showFingerprintCapture, setShowFingerprintCapture] = useState(false);
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.community.trim()) {
      newErrors.community = 'Community/Ward is required';
    }

    if (!formData.province) {
      newErrors.province = 'Province is required';
    }

    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }

    if (!formData.llg.trim()) {
      newErrors.llg = 'Local Level Government is required';
    }

    if (!photo) {
      newErrors.photo = 'Photo is required for verification';
    }

    if (!fingerprint) {
      newErrors.fingerprint = 'Fingerprint is required for verification';
    }

    if (!biometricConsent) {
      newErrors.consent = 'Biometric consent is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoCapture = (photoData: string) => {
    setPhoto(photoData);
    setShowCameraCapture(false);
    toast.success('Photo captured successfully');
  };

  const handleFingerprintCapture = (fingerprintData: string) => {
    setFingerprint(fingerprintData);
    setShowFingerprintCapture(false);
    toast.success('Fingerprint captured successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors and try again');
      return;
    }

    setIsRegistering(true);

    try {
      const verifierData = {
        ...formData,
        photo,
        fingerprint,
        isActive: true,
        authorizedAt: new Date().toISOString()
      };

      const verifierId = await verificationService.registerVerifier(verifierData);

      const registeredVerifier = await verificationService.getVerifierById(verifierId);

      toast.success(`${formData.role} ${formData.fullName} registered successfully as a community verifier`);

      if (onRegistrationComplete && registeredVerifier) {
        onRegistrationComplete(registeredVerifier);
      }

    } catch (error) {
      console.error('Verifier registration failed:', error);
      toast.error(`Registration failed: ${(error as Error).message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Shield className="h-6 w-6" />
          Community Leader Registration
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Register as a Pastor or Councilor to verify community members' identities
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role">Community Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pastor">Pastor</SelectItem>
                    <SelectItem value="Councilor">Councilor</SelectItem>
                    <SelectItem value="Admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+675 XXX XXXX"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Community Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="community">Community/Ward *</Label>
                <Input
                  id="community"
                  value={formData.community}
                  onChange={(e) => handleInputChange('community', e.target.value)}
                  placeholder="Village, Ward, or Community name"
                  className={errors.community ? 'border-red-500' : ''}
                />
                {errors.community && (
                  <p className="text-red-500 text-xs mt-1">{errors.community}</p>
                )}
              </div>

              <div>
                <Label htmlFor="province">Province *</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => handleInputChange('province', value)}
                >
                  <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PNG_PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province && (
                  <p className="text-red-500 text-xs mt-1">{errors.province}</p>
                )}
              </div>

              <div>
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="Electoral district"
                  className={errors.district ? 'border-red-500' : ''}
                />
                {errors.district && (
                  <p className="text-red-500 text-xs mt-1">{errors.district}</p>
                )}
              </div>

              <div>
                <Label htmlFor="llg">Local Level Government *</Label>
                <Input
                  id="llg"
                  value={formData.llg}
                  onChange={(e) => handleInputChange('llg', e.target.value)}
                  placeholder="LLG area"
                  className={errors.llg ? 'border-red-500' : ''}
                />
                {errors.llg && (
                  <p className="text-red-500 text-xs mt-1">{errors.llg}</p>
                )}
              </div>
            </div>
          </div>

          {/* Biometric Data */}
          <div className="space-y-4">
            <h3 className="font-medium">Biometric Verification</h3>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                As a community leader, your photo and fingerprint are required for secure verification when approving citizen registrations.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo Capture */}
              <div className="space-y-2">
                <Label>Photo *</Label>
                {photo ? (
                  <div className="relative">
                    <img
                      src={photo}
                      alt="Verifier photo"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCameraCapture(true)}
                      className="mt-2 w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Retake Photo
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCameraCapture(true)}
                    className={`w-full h-32 ${errors.photo ? 'border-red-500' : ''}`}
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    Capture Photo
                  </Button>
                )}
                {errors.photo && (
                  <p className="text-red-500 text-xs">{errors.photo}</p>
                )}
              </div>

              {/* Fingerprint Capture */}
              <div className="space-y-2">
                <Label>Fingerprint *</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFingerprintCapture(true)}
                  className={`w-full h-32 ${errors.fingerprint ? 'border-red-500' : ''} ${
                    fingerprint ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <Fingerprint className="h-6 w-6 mr-2" />
                  {fingerprint ? (
                    <span className="text-green-700">Fingerprint Captured</span>
                  ) : (
                    'Capture Fingerprint'
                  )}
                </Button>
                {errors.fingerprint && (
                  <p className="text-red-500 text-xs">{errors.fingerprint}</p>
                )}
              </div>
            </div>

            {/* Biometric Consent */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="biometricConsent"
                checked={biometricConsent}
                onCheckedChange={(checked) => setBiometricConsent(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="biometricConsent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Biometric Data Consent *
                </label>
                <p className="text-xs text-muted-foreground">
                  I consent to the collection and storage of my biometric data for community verification purposes.
                </p>
                {errors.consent && (
                  <p className="text-red-500 text-xs">{errors.consent}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isRegistering}
              className="flex-1"
            >
              {isRegistering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Register as Community Verifier
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isRegistering}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Camera Capture Modal */}
        {showCameraCapture && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <CameraCapture
              onCapture={handlePhotoCapture}
              onCancel={() => setShowCameraCapture(false)}
            />
          </div>
        )}

        {/* Fingerprint Capture Modal */}
        {showFingerprintCapture && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <FingerprintCapture
              onCapture={handleFingerprintCapture}
              onCancel={() => setShowFingerprintCapture(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
