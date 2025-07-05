import type React from 'react';
import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { Save, MapPin, User, CheckCircle } from 'lucide-react';

import {
  type CitizenData,
  PNG_PROVINCES,
  SEX_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  EDUCATION_LEVELS
} from '../types/citizen';
import { CameraCapture } from './CameraCapture';
import { FingerprintCapture } from './FingerprintCapture';
import { db } from '../services/database';
import { gpsService } from '../services/gps';

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

  const handlePhotoCapture = (imageSrc: string) => {
    setCapturedPhoto(imageSrc);
    toast.success('Photo captured successfully');
  };

  const handleFingerprintCapture = (fingerprintData: string) => {
    setCapturedFingerprint(fingerprintData);
    toast.success('Fingerprint captured successfully');
  };

  const onSubmit = async (data: CitizenFormData) => {
    setIsSubmitting(true);

    try {
      // Validate biometric requirements
      if (data.biometricConsent && !capturedPhoto) {
        toast.error('Photo is required when biometric consent is provided');
        setIsSubmitting(false);
        return;
      }

      // Prepare citizen data
      const citizenData: Omit<CitizenData, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        photo: capturedPhoto || undefined,
        fingerprint: capturedFingerprint || undefined,
        gpsCoordinates: gpsCoordinates || undefined,
        synced: false
      };

      // Save to local database
      const citizenId = await db.addCitizen(citizenData);

      toast.success(`Citizen registered successfully! ID: ${citizenId.slice(0, 8)}...`);

      // Reset form
      form.reset();
      setCapturedPhoto(null);
      setCapturedFingerprint(null);

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Citizen Registration Form
          </CardTitle>
        </CardHeader>
        <CardContent>
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
  );
};
