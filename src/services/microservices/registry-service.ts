// PNG Digital Electoral System - Registry Microservice
// Voter and Candidate Registry with Deduplication and Identity Verification

import crypto from 'crypto';
import { EventStoreFactory, type DomainEvent } from '../../lib/event-store';

// Registry Types
export interface VoterRecord {
  voterId: string;
  nationalId: string;
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: VoterAddress;
  contactInfo: ContactInfo;
  biometricData: BiometricData;
  eligibilityStatus: EligibilityStatus;
  registrationInfo: RegistrationInfo;
  verificationHistory: VerificationRecord[];
  votingHistory: VotingRecord[];
  status: 'active' | 'suspended' | 'deceased' | 'disqualified';
}

export interface VoterAddress {
  province: string;
  district: string;
  constituency: string;
  ward: string;
  village: string;
  pollingStation?: string;
  gpsCoordinates?: { latitude: number; longitude: number };
}

export interface ContactInfo {
  phoneNumber?: string;
  email?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}

export interface BiometricData {
  photoHash: string;
  fingerprintHash?: string;
  biometricTemplateHash?: string;
  captureDate: Date;
  captureDevice: string;
  qualityScore: number;
  verificationAttempts: number;
}

export interface EligibilityStatus {
  isEligible: boolean;
  ageEligible: boolean;
  citizenshipVerified: boolean;
  mentalCapacityVerified: boolean;
  criminalRecordClear: boolean;
  registrationComplete: boolean;
  lastVerified: Date;
  verifiedBy: string;
}

export interface RegistrationInfo {
  registrationDate: Date;
  registeredBy: string;
  registrationLocation: string;
  documentsSeen: string[];
  witnessInfo?: {
    name: string;
    nationalId: string;
    signature: string;
  };
  qrCode?: string;
}

export interface VerificationRecord {
  verificationId: string;
  verificationType: 'initial' | 'periodic' | 'challenge' | 'update' | 'biometric';
  verifiedBy: string;
  verificationDate: Date;
  documentsChecked: string[];
  biometricMatch: boolean;
  result: 'verified' | 'failed' | 'pending';
  notes?: string;
}

export interface VotingRecord {
  electionId: string;
  constituencyId: string;
  votingDate: Date;
  pollingStation: string;
  verificationMethod: 'biometric' | 'document' | 'witness';
  deviceId: string;
}

export interface CandidateRecord {
  candidateId: string;
  citizenId: string; // Links to voter record
  personalInfo: CandidatePersonalInfo;
  politicalInfo: PoliticalInfo;
  eligibilityChecks: CandidateEligibility;
  nominationInfo: NominationInfo;
  verificationStatus: CandidateVerificationStatus;
  campaignInfo: CampaignInfo;
  status: 'registered' | 'verified' | 'approved' | 'disqualified' | 'withdrawn';
}

export interface CandidatePersonalInfo {
  fullName: string;
  dateOfBirth: Date;
  nationalId: string;
  profession: string;
  education: string;
  residenceHistory: ResidenceRecord[];
  criminalRecordCheck: CriminalRecordCheck;
}

export interface PoliticalInfo {
  constituency: string;
  position: string; // MP, Governor, etc.
  partyAffiliation?: string;
  previousPositions: PoliticalPosition[];
  endorsements: Endorsement[];
}

export interface CandidateEligibility {
  ageRequirementMet: boolean;
  citizenshipRequirementMet: boolean;
  residencyRequirementMet: boolean;
  educationRequirementMet: boolean;
  criminalRecordClear: boolean;
  mentalCapacityVerified: boolean;
  financialRequirementsMet: boolean;
  nominationFeesPaid: boolean;
  lastChecked: Date;
  checkedBy: string;
}

export interface NominationInfo {
  nominatedBy: string;
  nominationDate: Date;
  supportingSignatures: NominationSignature[];
  requiredSignatures: number;
  validSignatures: number;
  nominationFee: {
    amount: number;
    currency: string;
    paidDate?: Date;
    receiptNumber?: string;
  };
}

export interface CandidateVerificationStatus {
  documentsVerified: boolean;
  biometricVerified: boolean;
  backgroundCheckComplete: boolean;
  eligibilityConfirmed: boolean;
  nominationValidated: boolean;
  approvalDate?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface CampaignInfo {
  campaignSlogan?: string;
  manifesto?: string;
  keyPolicies: string[];
  campaignManager?: string;
  campaignFinance: CampaignFinance;
}

export interface ResidenceRecord {
  address: string;
  startDate: Date;
  endDate?: Date;
  verified: boolean;
}

export interface CriminalRecordCheck {
  checkDate: Date;
  checkingAuthority: string;
  hasCriminalRecord: boolean;
  disqualifyingOffenses: string[];
  clearanceNumber?: string;
}

export interface PoliticalPosition {
  position: string;
  organization: string;
  startDate: Date;
  endDate?: Date;
  constituency?: string;
}

export interface Endorsement {
  endorsedBy: string;
  organization: string;
  endorsementDate: Date;
  endorsementType: 'party' | 'organization' | 'individual';
}

export interface NominationSignature {
  signatoryName: string;
  nationalId: string;
  signature: string;
  signatureDate: Date;
  witnessed: boolean;
  verified: boolean;
}

export interface CampaignFinance {
  budgetDeclared: number;
  fundsRaised: number;
  expenditure: number;
  lastUpdated: Date;
  auditRequired: boolean;
}

// Deduplication and Verification
export interface DeduplicationResult {
  isPotentialDuplicate: boolean;
  matchedRecords: VoterRecord[];
  matchingCriteria: string[];
  confidenceScore: number;
  recommendedAction: 'approve' | 'review' | 'merge' | 'reject';
}

export interface VerificationRequest {
  requestId: string;
  recordType: 'voter' | 'candidate';
  recordId: string;
  verificationType: string;
  requestedBy: string;
  requestDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  additionalChecks: string[];
}

// Registry Service Implementation
export class RegistryService {
  private static instance: RegistryService;
  private eventStore = EventStoreFactory.create();

  private voterRecords: Map<string, VoterRecord> = new Map();
  private candidateRecords: Map<string, CandidateRecord> = new Map();
  private nationalIdIndex: Map<string, string> = new Map(); // NID -> VoterID
  private biometricIndex: Map<string, string> = new Map(); // BiometricHash -> VoterID

  public static getInstance(): RegistryService {
    if (!RegistryService.instance) {
      RegistryService.instance = new RegistryService();
    }
    return RegistryService.instance;
  }

  constructor() {
    this.initializeIndexes();
  }

  // Voter Registration with Deduplication
  async registerVoter(voterData: Omit<VoterRecord, 'voterId' | 'verificationHistory' | 'votingHistory'>): Promise<{
    success: boolean;
    voterId?: string;
    deduplicationResult?: DeduplicationResult;
    errors?: string[];
  }> {
    console.log(`📝 Registering voter: ${voterData.fullName}`);

    try {
      // 1. Validate input data
      const validationErrors = this.validateVoterData(voterData);
      if (validationErrors.length > 0) {
        return { success: false, errors: validationErrors };
      }

      // 2. Check for duplicates
      const deduplicationResult = await this.checkForDuplicateVoter(voterData);

      if (deduplicationResult.isPotentialDuplicate) {
        console.log(`⚠️ Potential duplicate found for ${voterData.fullName}`);

        if (deduplicationResult.recommendedAction === 'reject') {
          return { success: false, deduplicationResult };
        }

        if (deduplicationResult.recommendedAction === 'review') {
          // Queue for manual review
          await this.queueForReview('voter', voterData, deduplicationResult);
          return { success: false, deduplicationResult };
        }
      }

      // 3. Generate voter ID and create record
      const voterId = this.generateVoterId(voterData.nationalId, voterData.address.constituency);

      const voterRecord: VoterRecord = {
        ...voterData,
        voterId,
        verificationHistory: [],
        votingHistory: [],
        status: 'active'
      };

      // 4. Store in registry
      this.voterRecords.set(voterId, voterRecord);
      this.nationalIdIndex.set(voterData.nationalId, voterId);
      this.biometricIndex.set(voterData.biometricData.photoHash, voterId);

      // 5. Create domain event
      const event: DomainEvent = {
        eventId: crypto.randomUUID(),
        aggregateId: voterId,
        aggregateType: 'Voter',
        eventType: 'VoterRegistered',
        eventData: {
          voterId,
          nationalId: voterData.nationalId,
          constituencyId: voterData.address.constituency,
          biometricHash: voterData.biometricData.photoHash,
          verificationMethod: 'initial_registration'
        },
        eventVersion: 1,
        timestamp: new Date(),
        metadata: {
          cryptographicSignature: '',
          auditHash: ''
        }
      };

      await this.eventStore.appendToStream(voterId, 0, [event]);

      console.log(`✅ Voter registered successfully: ${voterId}`);
      return { success: true, voterId, deduplicationResult };

    } catch (error) {
      console.error('Voter registration error:', error);
      return { success: false, errors: ['Registration failed due to system error'] };
    }
  }

  // Candidate Registration with Citizen Verification
  async registerCandidate(candidateData: Omit<CandidateRecord, 'candidateId'>): Promise<{
    success: boolean;
    candidateId?: string;
    errors?: string[];
  }> {
    console.log(`🗳️ Registering candidate: ${candidateData.personalInfo.fullName}`);

    try {
      // 1. Verify citizen record exists
      const citizenRecord = await this.getVoterByNationalId(candidateData.personalInfo.nationalId);
      if (!citizenRecord) {
        return { success: false, errors: ['Candidate must be a registered citizen first'] };
      }

      // 2. Validate candidate eligibility
      const eligibilityErrors = await this.validateCandidateEligibility(candidateData, citizenRecord);
      if (eligibilityErrors.length > 0) {
        return { success: false, errors: eligibilityErrors };
      }

      // 3. Check for existing candidacy
      const existingCandidate = await this.findExistingCandidacy(
        candidateData.personalInfo.nationalId,
        candidateData.politicalInfo.constituency
      );

      if (existingCandidate) {
        return { success: false, errors: ['Person already registered as candidate in this constituency'] };
      }

      // 4. Generate candidate ID and create record
      const candidateId = this.generateCandidateId(
        candidateData.personalInfo.nationalId,
        candidateData.politicalInfo.constituency
      );

      const candidateRecord: CandidateRecord = {
        ...candidateData,
        candidateId,
        citizenId: citizenRecord.voterId,
        status: 'registered'
      };

      // 5. Store in registry
      this.candidateRecords.set(candidateId, candidateRecord);

      // 6. Create domain event
      const event: DomainEvent = {
        eventId: crypto.randomUUID(),
        aggregateId: candidateId,
        aggregateType: 'Candidate',
        eventType: 'CandidateRegistered',
        eventData: {
          candidateId,
          citizenId: citizenRecord.voterId,
          constituencyId: candidateData.politicalInfo.constituency,
          partyAffiliation: candidateData.politicalInfo.partyAffiliation,
          verificationStatus: 'pending'
        },
        eventVersion: 1,
        timestamp: new Date(),
        metadata: {
          cryptographicSignature: '',
          auditHash: ''
        }
      };

      await this.eventStore.appendToStream(candidateId, 0, [event]);

      console.log(`✅ Candidate registered successfully: ${candidateId}`);
      return { success: true, candidateId };

    } catch (error) {
      console.error('Candidate registration error:', error);
      return { success: false, errors: ['Registration failed due to system error'] };
    }
  }

  // Biometric Verification
  async verifyBiometric(recordId: string, biometricData: string, verificationType: 'fingerprint' | 'photo'): Promise<{
    verified: boolean;
    confidenceScore: number;
    matchingRecords?: string[];
  }> {
    console.log(`🔍 Performing biometric verification for: ${recordId}`);

    const record = this.voterRecords.get(recordId);
    if (!record) {
      return { verified: false, confidenceScore: 0 };
    }

    // Simulate biometric matching
    const hash = crypto.createHash('sha256').update(biometricData).digest('hex');

    let storedHash: string;
    if (verificationType === 'photo') {
      storedHash = record.biometricData.photoHash;
    } else {
      storedHash = record.biometricData.fingerprintHash || '';
    }

    // Simple hash comparison (in production, use proper biometric matching)
    const matches = hash === storedHash;
    const confidenceScore = matches ? 95 : 0;

    // Update verification history
    const verificationRecord: VerificationRecord = {
      verificationId: crypto.randomUUID(),
      verificationType: 'biometric',
      verifiedBy: 'system',
      verificationDate: new Date(),
      documentsChecked: [],
      biometricMatch: matches,
      result: matches ? 'verified' : 'failed'
    };

    record.verificationHistory.push(verificationRecord);
    record.biometricData.verificationAttempts++;

    console.log(`${matches ? '✅' : '❌'} Biometric verification: ${confidenceScore}% confidence`);

    return {
      verified: matches,
      confidenceScore,
      matchingRecords: matches ? [recordId] : []
    };
  }

  // Duplicate Detection Algorithm
  private async checkForDuplicateVoter(voterData: Omit<VoterRecord, 'voterId' | 'verificationHistory' | 'votingHistory'>): Promise<DeduplicationResult> {
    const potentialDuplicates: VoterRecord[] = [];
    const matchingCriteria: string[] = [];
    let confidenceScore = 0;

    // Check National ID
    const existingByNID = this.nationalIdIndex.get(voterData.nationalId);
    if (existingByNID) {
      const record = this.voterRecords.get(existingByNID);
      if (record) {
        potentialDuplicates.push(record);
        matchingCriteria.push('National ID');
        confidenceScore += 90; // High confidence for NID match
      }
    }

    // Check biometric hash
    const existingByBiometric = this.biometricIndex.get(voterData.biometricData.photoHash);
    if (existingByBiometric && !potentialDuplicates.find(d => d.voterId === existingByBiometric)) {
      const record = this.voterRecords.get(existingByBiometric);
      if (record) {
        potentialDuplicates.push(record);
        matchingCriteria.push('Biometric');
        confidenceScore += 85; // High confidence for biometric match
      }
    }

    // Check name and date of birth
    for (const [_, record] of this.voterRecords) {
      if (potentialDuplicates.find(d => d.voterId === record.voterId)) continue;

      const nameMatch = this.calculateNameSimilarity(voterData.fullName, record.fullName);
      const dobMatch = voterData.dateOfBirth.getTime() === record.dateOfBirth.getTime();

      if (nameMatch > 0.85 && dobMatch) {
        potentialDuplicates.push(record);
        matchingCriteria.push('Name and Date of Birth');
        confidenceScore += 60;
      }
    }

    // Determine recommended action
    let recommendedAction: 'approve' | 'review' | 'merge' | 'reject' = 'approve';

    if (confidenceScore >= 80) {
      recommendedAction = 'reject'; // Very likely duplicate
    } else if (confidenceScore >= 50) {
      recommendedAction = 'review'; // Possible duplicate, needs manual review
    } else if (confidenceScore >= 30) {
      recommendedAction = 'review'; // Low confidence, but worth checking
    }

    return {
      isPotentialDuplicate: potentialDuplicates.length > 0,
      matchedRecords: potentialDuplicates,
      matchingCriteria,
      confidenceScore,
      recommendedAction
    };
  }

  // Query Methods
  async getVoterById(voterId: string): Promise<VoterRecord | null> {
    return this.voterRecords.get(voterId) || null;
  }

  async getVoterByNationalId(nationalId: string): Promise<VoterRecord | null> {
    const voterId = this.nationalIdIndex.get(nationalId);
    return voterId ? this.voterRecords.get(voterId) || null : null;
  }

  async getVotersByConstituency(constituency: string): Promise<VoterRecord[]> {
    return Array.from(this.voterRecords.values())
      .filter(voter => voter.address.constituency === constituency && voter.status === 'active');
  }

  async getCandidateById(candidateId: string): Promise<CandidateRecord | null> {
    return this.candidateRecords.get(candidateId) || null;
  }

  async getCandidatesByConstituency(constituency: string): Promise<CandidateRecord[]> {
    return Array.from(this.candidateRecords.values())
      .filter(candidate =>
        candidate.politicalInfo.constituency === constituency &&
        ['verified', 'approved'].includes(candidate.status)
      );
  }

  // Validation Methods
  private validateVoterData(voterData: any): string[] {
    const errors: string[] = [];

    if (!voterData.nationalId || voterData.nationalId.length < 8) {
      errors.push('Valid National ID is required');
    }

    if (!voterData.fullName || voterData.fullName.trim().length < 2) {
      errors.push('Full name is required');
    }

    if (!voterData.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const age = this.calculateAge(voterData.dateOfBirth);
      if (age < 18) {
        errors.push('Voter must be at least 18 years old');
      }
    }

    if (!voterData.address?.constituency) {
      errors.push('Constituency is required');
    }

    if (!voterData.biometricData?.photoHash) {
      errors.push('Biometric photo is required');
    }

    return errors;
  }

  private async validateCandidateEligibility(candidateData: any, citizenRecord: VoterRecord): Promise<string[]> {
    const errors: string[] = [];

    // Age requirement (usually 25+ for most positions)
    const age = this.calculateAge(candidateData.personalInfo.dateOfBirth);
    if (age < 25) {
      errors.push('Candidate must be at least 25 years old');
    }

    // Citizenship requirement
    if (!citizenRecord.eligibilityStatus.citizenshipVerified) {
      errors.push('Citizenship must be verified');
    }

    // Constituency residency (candidates must be from the constituency they represent)
    if (citizenRecord.address.constituency !== candidateData.politicalInfo.constituency) {
      errors.push('Candidate must be from the constituency they wish to represent');
    }

    // Criminal record check
    if (candidateData.personalInfo.criminalRecordCheck?.hasCriminalRecord) {
      if (candidateData.personalInfo.criminalRecordCheck.disqualifyingOffenses.length > 0) {
        errors.push('Candidate has disqualifying criminal offenses');
      }
    }

    // Mental capacity
    if (!citizenRecord.eligibilityStatus.mentalCapacityVerified) {
      errors.push('Mental capacity verification required');
    }

    return errors;
  }

  // Helper Methods
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(name1.toLowerCase(), name2.toLowerCase());
    const maxLength = Math.max(name1.length, name2.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private generateVoterId(nationalId: string, constituency: string): string {
    const hash = crypto.createHash('sha256')
      .update(`${nationalId}-${constituency}-${Date.now()}`)
      .digest('hex');
    return `V${hash.substring(0, 12).toUpperCase()}`;
  }

  private generateCandidateId(nationalId: string, constituency: string): string {
    const hash = crypto.createHash('sha256')
      .update(`${nationalId}-${constituency}-candidate-${Date.now()}`)
      .digest('hex');
    return `C${hash.substring(0, 12).toUpperCase()}`;
  }

  private async findExistingCandidacy(nationalId: string, constituency: string): Promise<CandidateRecord | null> {
    for (const [_, candidate] of this.candidateRecords) {
      if (candidate.personalInfo.nationalId === nationalId &&
          candidate.politicalInfo.constituency === constituency &&
          ['registered', 'verified', 'approved'].includes(candidate.status)) {
        return candidate;
      }
    }
    return null;
  }

  private async queueForReview(type: 'voter' | 'candidate', data: any, deduplicationResult: DeduplicationResult): Promise<void> {
    console.log(`📋 Queuing ${type} for manual review due to potential duplication`);
    // In production, add to review queue system
  }

  private initializeIndexes(): void {
    console.log('🗂️ Registry Service initialized with deduplication indexes');
  }
}

export const registryService = RegistryService.getInstance();
