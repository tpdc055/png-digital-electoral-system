import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, MapPin, User, CheckCircle, Search, Edit, Trash2, Users, Download, RefreshCw } from 'lucide-react';

import {
  type CitizenData,
  PNG_PROVINCES,
  SEX_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  EDUCATION_LEVELS,
  type VerificationSession
} from '../types/citizen';
import { CameraCapture } from './CameraCapture';
import { FingerprintCapture } from './FingerprintCapture';
import { VerificationComponent } from './VerificationComponent';
import { db } from '../services/database';
import { gpsService } from '../services/gps';
import { verificationService } from '../services/verificationService';
import { authService } from '../services/authService';

// Validation schema
const citizenSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  sex: z.enum(['Male', 'Female', 'Other']),
  province: z.string().min(1, 'Province is required'),
  district: z.string().min(1, 'District is required'),
  llg: z.string().min(1, 'LLG is required'),
  village: z.string().min(1, 'Village is required'),
  nationalIdNumber: z.string().min(1, 'National ID is required'),
  phoneNumber: z.string().optional(),
  maritalStatus: z.string().min(1, 'Marital status is required'),
  educationLevel: z.string().min(1, 'Education level is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  tribe: z.string().min(1, 'Tribe/Clan name is required'),
  landOwnership: z.string().min(1, 'Land ownership status is required'),
  disabilityStatus: z.boolean(),
  voterStatus: z.boolean(),
  biometricConsent: z.boolean()
});

type CitizenFormData = z.infer<typeof citizenSchema>;

export const CitizenRegistrationForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedFingerprint, setCapturedFingerprint] = useState<string | null>(null);

  // Verification state
  const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
  const [verificationSkipped, setVerificationSkipped] = useState(false);
  const [verificationSettings] = useState(verificationService.getSettings());

  // Admin data management state
  const [activeTab, setActiveTab] = useState('register');
  const [registeredCitizens, setRegisteredCitizens] = useState<CitizenData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingCitizens, setIsLoadingCitizens] = useState(false);

  // Get current user role
  const currentUser = authService.getCurrentProfile();
  const isAdmin = authService.hasRole('admin');

  const form = useForm<CitizenFormData>({
    resolver: zodResolver(citizenSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      sex: 'Male',
      province: '',
      district: '',
      llg: '',
      village: '',
      nationalIdNumber: '',
      phoneNumber: '',
      maritalStatus: '',
      educationLevel: '',
      occupation: '',
      tribe: '',
      landOwnership: '',
      disabilityStatus: false,
      voterStatus: false,
      biometricConsent: false
    }
  });

  const biometricConsent = form.watch('biometricConsent');

  // Get GPS coordinates on component mount
  useEffect(() => {
    const getLocation = async () => {
      setGpsLoading(true);
      const result = await gpsService.getCurrentPosition();

      if (result.success && result.coordinates) {
        setGpsCoordinates(result.coordinates);
        toast.success('Location captured successfully');
      } else {
        toast.error(result.error || 'Failed to get location');
      }
      setGpsLoading(false);
    };

    getLocation();
  }, []);

  // Load registered citizens for admin view
  useEffect(() => {
    if (isAdmin && activeTab === 'manage') {
      loadRegisteredCitizens();
    }
  }, [isAdmin, activeTab]);

  const handlePhotoCapture = (imageSrc: string) => {
    setCapturedPhoto(imageSrc);
    toast.success('Photo captured successfully');
  };

  const handleFingerprintCapture = (fingerprintData: string) => {
    setCapturedFingerprint(fingerprintData);
    toast.success('Fingerprint captured successfully');
  };

  const handleVerificationComplete = (session: VerificationSession) => {
    setVerificationSession(session);
    setVerificationSkipped(false);
    console.log('Verification completed:', session);
  };

  const handleVerificationSkipped = () => {
    setVerificationSession(null);
    setVerificationSkipped(true);
    console.log('Verification skipped');
  };

  // Admin management functions
  const loadRegisteredCitizens = async () => {
    if (!isAdmin) return;

    setIsLoadingCitizens(true);
    try {
      const citizens = await db.getAllCitizens();
      setRegisteredCitizens(citizens);
      console.log(`Loaded ${citizens.length} registered citizens`);
    } catch (error) {
      console.error('Failed to load citizens:', error);
      toast.error('Failed to load citizen data');
    } finally {
      setIsLoadingCitizens(false);
    }
  };

  const handleEditCitizen = (citizen: CitizenData) => {
    setSelectedCitizen(citizen);
    setIsEditing(true);

    // Populate form with citizen data
    form.reset({
      fullName: citizen.fullName,
      dateOfBirth: citizen.dateOfBirth,
      sex: citizen.sex as 'Male' | 'Female' | 'Other',
      province: citizen.province,
      district: citizen.district,
      llg: citizen.llg,
      village: citizen.village,
      nationalIdNumber: citizen.nationalIdNumber,
      phoneNumber: citizen.phoneNumber || '',
      maritalStatus: citizen.maritalStatus,
      educationLevel: citizen.educationLevel,
      occupation: citizen.occupation,
      tribe: citizen.tribe,
      landOwnership: citizen.landOwnership,
      disabilityStatus: citizen.disabilityStatus,
      voterStatus: citizen.voterStatus,
      biometricConsent: !!citizen.photo || !!citizen.fingerprint
    });

    setCapturedPhoto(citizen.photo || null);
    setCapturedFingerprint(citizen.fingerprint || null);
    setActiveTab('register');
    toast.info(`Editing citizen: ${citizen.fullName}`);
  };

  const handleDeleteCitizen = async (citizen: CitizenData) => {
    if (!isAdmin || !citizen.id) return;

    if (!confirm(`Are you sure you want to delete citizen record for ${citizen.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await db.deleteCitizen(citizen.id);
      await loadRegisteredCitizens(); // Reload the list
      toast.success(`Citizen record for ${citizen.fullName} has been deleted`);
    } catch (error) {
      console.error('Failed to delete citizen:', error);
      toast.error('Failed to delete citizen record');
    }
  };

  const handleUpdateCitizen = async (data: CitizenFormData) => {
    if (!selectedCitizen?.id) return;

    try {
      const updatedData: Partial<CitizenData> = {
        ...data,
        photo: capturedPhoto || undefined,
        fingerprint: capturedFingerprint || undefined,
        gpsCoordinates: gpsCoordinates || selectedCitizen.gpsCoordinates,
        updatedAt: new Date().toISOString()
      };

      await db.updateCitizen(selectedCitizen.id, updatedData);
      await loadRegisteredCitizens(); // Reload the list

      toast.success(`Citizen record for ${data.fullName} has been updated`);

      // Reset editing state
      setIsEditing(false);
      setSelectedCitizen(null);
      form.reset();
      setCapturedPhoto(null);
      setCapturedFingerprint(null);
      setActiveTab('manage');

    } catch (error) {
      console.error('Failed to update citizen:', error);
      toast.error('Failed to update citizen record');
    }
  };

  const exportCitizenData = () => {
    if (!isAdmin) return;

    const csvData = registeredCitizens.map(citizen => ({
      'Full Name': citizen.fullName,
      'National ID': citizen.nationalIdNumber,
      'Date of Birth': citizen.dateOfBirth,
      'Sex': citizen.sex,
      'Province': citizen.province,
      'District': citizen.district,
      'Village': citizen.village,
      'Phone': citizen.phoneNumber || '',
      'Verified': citizen.verified ? 'Yes' : 'No',
      'Registered Date': citizen.createdAt ? new Date(citizen.createdAt).toLocaleDateString() : ''
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `png-citizens-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${registeredCitizens.length} citizen records`);
  };

  // Filter citizens based on search term
  const filteredCitizens = registeredCitizens.filter(citizen =>
    citizen.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.nationalIdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: CitizenFormData) => {
    setIsSubmitting(true);

    try {
      // Validate biometric requirements
      if (data.biometricConsent && !capturedPhoto) {
        toast.error('Photo is required when biometric consent is provided');
        setIsSubmitting(false);
        return;
      }

      // If editing existing citizen
      if (isEditing && selectedCitizen) {
        await handleUpdateCitizen(data);
        setIsSubmitting(false);
        return;
      }

      // Check verification requirements for new registrations
      if (verificationSettings.verificationRequired && !verificationSession && !verificationSkipped) {
        if (!verificationSettings.allowUnverifiedRegistration) {
          toast.error('Community verification is required before registration');
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare citizen data for new registration
      const citizenData: Omit<CitizenData, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        photo: capturedPhoto || undefined,
        fingerprint: capturedFingerprint || undefined,
        gpsCoordinates: gpsCoordinates || undefined,

        // Verification data
        verified: !!verificationSession,
        verifiedBy: verificationSession?.verifierId,
        verifierName: verificationSession?.verifierName,
        verifierRole: verificationSession?.verifierRole,
        verifiedAt: verificationSession?.verifiedAt,
        verifierFingerprint: verificationSession?.verifierFingerprint,

        synced: false
      };

      // Save to live database
      const citizenId = await db.addCitizen(citizenData);

      toast.success(`Citizen registered successfully! ID: ${citizenId.slice(0, 8)}...`);

      // Reset form
      form.reset();
      setCapturedPhoto(null);
      setCapturedFingerprint(null);
      setVerificationSession(null);
      setVerificationSkipped(false);

      // Reload citizen list if admin is viewing manage tab
      if (isAdmin && activeTab === 'manage') {
        await loadRegisteredCitizens();
      }

      // Try to get new GPS coordinates for next entry
      const result = await gpsService.getCurrentPosition();
      if (result.success && result.coordinates) {
        setGpsCoordinates(result.coordinates);
      }

    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Failed to register citizen. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshLocation = async () => {
    setGpsLoading(true);
    const result = await gpsService.getCurrentPosition();

    if (result.success && result.coordinates) {
      setGpsCoordinates(result.coordinates);
      toast.success('Location updated');
    } else {
      toast.error(result.error || 'Failed to get location');
    }
    setGpsLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Enhanced Header with Admin Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6" />
                {isEditing ? 'Edit Citizen Record' : 'Citizen Registration System'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing ? `Editing: ${selectedCitizen?.fullName}` : 'Register new citizens with live database capture'}
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {registeredCitizens.length} Registered
                </Badge>
                <Badge variant="outline">Admin Access</Badge>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Admin Tab Navigation */}
      {isAdmin ? (
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {isEditing ? 'Edit Citizen' : 'Register Citizen'}
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Citizens ({registeredCitizens.length})
                </TabsTrigger>
              </TabsList>

              {/* Registration Tab */}
              <TabsContent value="register" className="p-6">
                <div className="space-y-6">
                  {isEditing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-blue-800">Editing Citizen Record</h3>
                          <p className="text-sm text-blue-600">Make changes to {selectedCitizen?.fullName}'s information</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedCitizen(null);
                            form.reset();
                            setCapturedPhoto(null);
                            setCapturedFingerprint(null);
                          }}
                        >
                          Cancel Edit
                        </Button>
                      </div>
                    </div>
                  )}

                  <Card>
                    <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEX_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationalIdNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter National ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PNG_PROVINCES.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter district" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="llg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Level Government (LLG) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter LLG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter village" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact & Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MARITAL_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="educationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education Level *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EDUCATION_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tribe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tribe/Clan Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tribe or clan name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landOwnership"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land Ownership Status *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter land ownership status" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="disabilityStatus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Has Disability</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voterStatus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Eligible to Vote</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="biometricConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Biometric Consent</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Community Verification */}
              {verificationSettings.verificationRequired && (
                <VerificationComponent
                  citizenId={form.getValues('nationalIdNumber') || 'temp-citizen-id'}
                  citizenName={form.getValues('fullName')}
                  onVerificationComplete={handleVerificationComplete}
                  onSkipVerification={handleVerificationSkipped}
                  disabled={isSubmitting}
                />
              )}

              {/* GPS Coordinates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    GPS Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gpsCoordinates ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Coordinates: {gpsService.formatCoordinates(gpsCoordinates)}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={refreshLocation}
                        disabled={gpsLoading}
                      >
                        {gpsLoading ? 'Getting Location...' : 'Refresh Location'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      {gpsLoading ? 'Getting location...' : 'Location not available'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Biometric Capture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <CameraCapture
                    onCapture={handlePhotoCapture}
                    disabled={!biometricConsent}
                  />
                </div>
                <div className="flex justify-center">
                  <FingerprintCapture
                    onCapture={handleFingerprintCapture}
                    disabled={!biometricConsent}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Citizen
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Register Citizen
                  </>
                )}
              </Button>
            </form>
          </Form>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Data Management Tab */}
              <TabsContent value="manage" className="p-6">
                <div className="space-y-6">
                  {/* Search and Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search citizens..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={loadRegisteredCitizens}
                        disabled={isLoadingCitizens}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCitizens ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={exportCitizenData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                      <Badge variant="secondary">
                        {filteredCitizens.length} of {registeredCitizens.length} citizens
                      </Badge>
                    </div>
                  </div>

                  {/* Citizens Table */}
                  <Card>
                    <CardContent className="p-0">
                      {isLoadingCitizens ? (
                        <div className="flex items-center justify-center p-8">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Loading citizens...
                        </div>
                      ) : filteredCitizens.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                          {searchTerm ? 'No citizens found matching your search.' : 'No citizens registered yet.'}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Full Name</TableHead>
                              <TableHead>National ID</TableHead>
                              <TableHead>Province</TableHead>
                              <TableHead>District</TableHead>
                              <TableHead>Verified</TableHead>
                              <TableHead>Registered</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCitizens.map((citizen) => (
                              <TableRow key={citizen.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {citizen.photo && (
                                      <img
                                        src={citizen.photo}
                                        alt="Citizen"
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    )}
                                    {citizen.fullName}
                                  </div>
                                </TableCell>
                                <TableCell>{citizen.nationalIdNumber}</TableCell>
                                <TableCell>{citizen.province}</TableCell>
                                <TableCell>{citizen.district}</TableCell>
                                <TableCell>
                                  <Badge variant={citizen.verified ? "default" : "secondary"}>
                                    {citizen.verified ? 'Verified' : 'Unverified'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {citizen.createdAt ? new Date(citizen.createdAt).toLocaleDateString() : 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditCitizen(citizen)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteCitizen(citizen)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        // Non-admin view - just the registration form
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Same form content for non-admin users */}
                <div className="text-center p-8 text-gray-500">
                  Registration form available to enumerators and admins only.
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
