export interface GPSCoordinates {
  lat: number;
  lng: number;
}

export interface CitizenData {
  id?: string;
  cloudId?: string; // Firebase document ID
  fullName: string;
  dateOfBirth: string;
  sex: 'Male' | 'Female' | 'Other';
  province: string;
  district: string;
  llg: string;
  village: string;
  nationalIdNumber: string;
  phoneNumber?: string;
  maritalStatus: string;
  educationLevel: string;
  occupation: string;
  tribe: string;
  landOwnership: string;
  disabilityStatus: boolean;
  voterStatus: boolean;
  biometricConsent: boolean;
  photo?: string; // base64 encoded image
  fingerprint?: string; // base64 encoded fingerprint data
  gpsCoordinates?: GPSCoordinates;

  // Community Verification
  verified: boolean; // Whether identity has been verified by community leader
  verifiedBy?: string; // ID of verifier (Pastor/Councilor)
  verifierName?: string; // Name of verifier
  verifierRole?: 'Pastor' | 'Councilor' | 'Admin'; // Role of verifier
  verifiedAt?: string; // When verification was done (ISO timestamp)
  verifierFingerprint?: string; // Verifier's fingerprint (base64) for audit trail

  synced: boolean;
  createdAt: string;
  updatedAt: string;
  cloudSyncedAt?: string; // When last synced to cloud
  lastUpdated?: string; // Cloud timestamp

  // Backup and restore properties
  localId?: string;
  backupTimestamp?: string;
  restoredAt?: string;
  restoredFromBackup?: string;
  importedAt?: string;
  importedFromFile?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTime?: string;
}

// Dropdown options
export const SEX_OPTIONS = ['Male', 'Female', 'Other'] as const;

export const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Separated'
] as const;

export const EDUCATION_LEVELS = [
  'No formal education',
  'Primary incomplete',
  'Primary complete',
  'Secondary incomplete',
  'Secondary complete',
  'Vocational training',
  'University incomplete',
  'University complete',
  'Postgraduate'
] as const;

// PNG Provinces
export const PNG_PROVINCES = [
  'Central',
  'Chimbu',
  'Eastern Highlands',
  'East New Britain',
  'East Sepik',
  'Enga',
  'Gulf',
  'Hela',
  'Jiwaka',
  'Madang',
  'Manus',
  'Milne Bay',
  'Morobe',
  'National Capital District',
  'New Ireland',
  'Northern',
  'Southern Highlands',
  'Western',
  'Western Highlands',
  'West New Britain',
  'West Sepik'
] as const;

// Community Verification System
export type VerifierRole = 'Pastor' | 'Councilor' | 'Admin';

export interface VerifierData {
  id?: string;
  cloudId?: string;
  fullName: string;
  role: VerifierRole;
  community: string; // Village/Ward they serve
  province: string;
  district: string;
  llg: string;
  phoneNumber?: string;
  email?: string;

  // Biometric Data
  photo?: string; // base64 encoded image
  fingerprint?: string; // base64 encoded fingerprint template

  // Verification Stats
  verificationsPerformed: number;

  // Status
  isActive: boolean;
  authorizedBy?: string; // Admin who authorized this verifier
  authorizedAt?: string;

  // System Metadata
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  cloudSyncedAt?: string;
}

export interface VerificationSettings {
  verificationRequired: boolean; // Toggle verification requirement
  allowUnverifiedRegistration: boolean; // Allow saving without verification
  requireVerifierFingerprint: boolean; // Require fingerprint for verification
  verifierRoles: VerifierRole[]; // Which roles can verify
  maxVerificationsPerDay?: number; // Limit verifications per verifier per day
}

export interface VerificationSession {
  citizenId: string;
  verifierId: string;
  verifierName: string;
  verifierRole: VerifierRole;
  verifierFingerprint?: string;
  verifiedAt: string;
  location?: GPSCoordinates;
}

export const VERIFIER_ROLES = ['Pastor', 'Councilor', 'Admin'] as const;
