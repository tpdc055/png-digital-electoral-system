// PNG Electoral System Types
// For 2027 National General Election Digital Voting System

export type ElectionType = 'national' | 'provincial' | 'local' | 'referendum';
export type CandidateStatus = 'registered' | 'approved' | 'disqualified' | 'withdrawn';
export type ElectionStatus = 'planned' | 'registration_open' | 'voting_open' | 'voting_closed' | 'results_declared';
export type VoteStatus = 'not_voted' | 'vote_cast' | 'vote_confirmed' | 'vote_rejected';
export type PartyType = 'political_party' | 'independent' | 'coalition';

// Candidate Information
export interface Candidate {
  candidateId: string;
  electionId: string;
  constituency: string;

  // Personal Information
  fullName: string;
  dateOfBirth: string;
  nationalIdNumber: string;

  // Political Information
  party?: string;
  partyType: PartyType;
  partyLogo?: string;
  runningMate?: string;              // For positions requiring running mates

  // Media & Presentation
  photo: string;                     // Professional candidate photo
  biography: string;                 // Candidate background (max 500 words)
  policyPlatform: string[];          // Key policy positions
  audioIntroduction?: string;        // Voice introduction (base64 audio)
  campaignSlogan?: string;

  // Eligibility & Registration
  isEligible: boolean;
  registrationDate: Date;
  status: CandidateStatus;
  registeredBy: string;              // Electoral officer ID

  // Verification
  documentsVerified: boolean;
  backgroundCheckPassed: boolean;
  nominationFeesPaid: boolean;

  // Statistics (populated during election)
  voteCount?: number;
  votePercentage?: number;
  ranking?: number;
}

// Election Configuration
export interface Election {
  electionId: string;
  electionName: string;
  electionType: ElectionType;
  description: string;

  // Timing
  registrationStartDate: Date;
  registrationEndDate: Date;
  votingStartDate: Date;
  votingEndDate: Date;
  resultsAnnouncementDate?: Date;

  // Geographic Scope
  constituencies: string[];          // List of constituencies participating
  provinces: string[];               // Provinces involved

  // Configuration
  maxCandidatesPerConstituency: number;
  requiresRunningMate: boolean;      // For Governor, Prime Minister positions
  allowsIndependentCandidates: boolean;

  // Voting Rules
  votingMethod: 'single_choice' | 'preferential' | 'multiple_choice';
  requiresBiometricVerification: boolean;
  allowsProxyVoting: boolean;

  // Status & Management
  status: ElectionStatus;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;

  // Results
  totalRegisteredVoters?: number;
  totalVotesCast?: number;
  turnoutPercentage?: number;
  isResultsPublished?: boolean;
}

// Digital Ballot
export interface DigitalBallot {
  ballotId: string;
  electionId: string;
  constituency: string;
  voterId: string;

  // Ballot Configuration
  ballotTitle: string;
  ballotInstructions: {
    text: string;
    audio?: string;                  // Audio instructions in multiple languages
    languages: {
      english: string;
      tokPisin?: string;
      hiriMotu?: string;
    };
  };

  // Candidates for this ballot
  candidates: Candidate[];

  // Voting Configuration
  maxSelections: number;             // Usually 1, but could be more for multi-seat
  requiresRanking: boolean;          // For preferential voting

  // Accessibility
  accessibilityFeatures: {
    largeText: boolean;
    highContrast: boolean;
    audioAssistance: boolean;
    touchOptimized: boolean;
    screenReader: boolean;
  };

  // Security
  ballotHash: string;                // Cryptographic hash for integrity
  generatedAt: Date;
  expiresAt: Date;
}

// Vote Record
export interface VoteRecord {
  voteId: string;
  ballotId: string;
  electionId: string;
  constituency: string;

  // Voter Information (anonymized after voting)
  voterIdHash: string;               // Hashed voter ID for privacy
  voterConstituency: string;
  voterProvince: string;

  // Vote Details
  selectedCandidateId: string;
  candidateRankings?: number[];      // For preferential voting
  voteTimestamp: Date;

  // Verification & Security
  biometricVerified: boolean;
  deviceFingerprint: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };

  // Blockchain & Integrity
  blockchainTxId?: string;
  voteHash: string;
  previousVoteHash?: string;         // Chain of votes for integrity

  // Status & Processing
  status: VoteStatus;
  processedAt?: Date;
  verifiedAt?: Date;

  // Audit Trail (anonymized)
  castingDevice: string;
  networkInfo: string;
  auditHash: string;
}

// Voter Eligibility & Registration
export interface VoterEligibility {
  voterId: string;
  electionId: string;

  // Identity Verification
  nationalIdNumber: string;
  birthRegistryId: string;
  biometricVerified: boolean;

  // Eligibility Criteria
  isEligible: boolean;
  ageEligible: boolean;              // 18+ years
  citizenshipVerified: boolean;
  mentallySoundCertified: boolean;
  notDisqualified: boolean;          // No criminal disqualifications

  // Geographic Restrictions
  constituencyOfOrigin: string;      // Where they can vote (immutable)
  currentLocation?: string;          // Current GPS location
  canVoteAtCurrentLocation: boolean;

  // Voting History
  hasVotedInThisElection: boolean;
  lastVotedElection?: string;
  voteHistory: string[];             // List of elections voted in

  // Registration Status
  registrationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  registrationDate: Date;
  verificationDate?: Date;

  // Verification Details
  verifiedBy: string;                // Electoral officer ID
  verificationNotes?: string;
  documentsProvided: string[];
}

// Constituency Information
export interface Constituency {
  constituencyId: string;
  constituencyName: string;
  constituencyCode: string;          // Official electoral code

  // Geographic Information
  province: string;
  district: string;
  llg: string;                       // Local Level Government
  boundaries: string;                // Geographic description

  // Electoral Information
  electionType: ElectionType;
  seatType: 'open' | 'provincial' | 'regional';
  totalRegisteredVoters: number;
  expectedTurnout: number;

  // Candidates
  registeredCandidates: string[];    // Array of candidate IDs
  maxCandidates: number;

  // Voting Infrastructure
  pollingStations: PollingStation[];
  digitalVotingEnabled: boolean;
  backupSystemsAvailable: boolean;

  // Results
  votesCast?: number;
  turnoutPercentage?: number;
  winningCandidateId?: string;
  isResultsDeclared?: boolean;
}

// Polling Station (Physical or Digital)
export interface PollingStation {
  stationId: string;
  stationName: string;
  stationType: 'physical' | 'digital' | 'mobile' | 'remote';

  // Location
  province: string;
  district: string;
  constituency: string;
  address: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };

  // Capacity & Staffing
  maxVotersPerHour: number;
  operatingHours: {
    openTime: string;
    closeTime: string;
  };
  staffAssigned: string[];           // Electoral officer IDs

  // Equipment & Technology
  votingDevices: VotingDevice[];
  backupSystems: boolean;
  internetConnectivity: 'reliable' | 'intermittent' | 'offline';

  // Status
  isOperational: boolean;
  currentVoterQueue: number;
  totalVotesProcessed: number;

  // Security
  securityOfficers: string[];
  independentObservers: string[];
  cctvMonitoring: boolean;

  // Accessibility
  wheelchairAccessible: boolean;
  assistiveDevicesAvailable: boolean;
  multiLanguageSupport: boolean;
}

// Voting Device/Terminal
export interface VotingDevice {
  deviceId: string;
  deviceType: 'tablet' | 'kiosk' | 'mobile' | 'desktop';
  serialNumber: string;

  // Technical Specifications
  operatingSystem: string;
  softwareVersion: string;
  hardwareSpecs: {
    screen: string;
    processor: string;
    memory: string;
    storage: string;
  };

  // Biometric Capabilities
  hasCameraForPhotos: boolean;
  hasFingerprintScanner: boolean;
  hasAudioCapability: boolean;

  // Status & Health
  isOnline: boolean;
  batteryLevel?: number;
  lastHealthCheck: Date;
  systemErrors: string[];

  // Usage Statistics
  totalVotesProcessed: number;
  averageVotingTime: number;        // In seconds
  errorCount: number;

  // Security
  encryptionEnabled: boolean;
  tamperSealIntact: boolean;
  lastSecurityAudit: Date;

  // Assignment
  assignedPollingStation: string;
  assignedOperator: string;
  deploymentDate: Date;
}

// Election Results
export interface ElectionResults {
  electionId: string;
  constituency: string;

  // Vote Counts
  totalVotesCast: number;
  validVotes: number;
  invalidVotes: number;
  blankVotes: number;

  // Candidate Results
  candidateResults: CandidateResult[];

  // Winner Information
  winningCandidateId: string;
  winningMargin: number;
  isDecisive: boolean;               // Clear winner or requires runoff

  // Turnout Information
  totalRegisteredVoters: number;
  turnoutPercentage: number;

  // Timing
  votingStarted: Date;
  votingEnded: Date;
  resultsCalculatedAt: Date;
  resultsPublishedAt?: Date;

  // Verification & Audit
  isVerified: boolean;
  auditCompleted: boolean;
  disputesRaised: number;
  anomaliesDetected: string[];

  // Publication Status
  isPublished: boolean;
  publishedBy: string;
  certifiedBy?: string;              // Electoral Commission certification
}

export interface CandidateResult {
  candidateId: string;
  candidateName: string;
  party?: string;
  voteCount: number;
  votePercentage: number;
  ranking: number;
  isWinner: boolean;

  // Detailed Vote Breakdown
  votesByPollingStation?: { [stationId: string]: number };
  votesByTimeOfDay?: { [hour: string]: number };

  // Preferential Voting (if applicable)
  firstPreferenceVotes?: number;
  finalVotesAfterDistribution?: number;
  eliminationRound?: number;
}

// Limited Preferential Voting (LPV) Types
export interface LPVVote {
  firstChoice: string;    // Candidate ID for preference 1
  secondChoice?: string;  // Candidate ID for preference 2
  thirdChoice?: string;   // Candidate ID for preference 3
}

export interface LPVBallot extends Omit<DigitalBallot, 'maxSelections' | 'requiresRanking'> {
  votingMethod: 'lpv';
  maxPreferences: number;  // Usually 3 for LPV
  requiresAllPreferences: boolean;  // Whether all 3 choices are mandatory
}

export interface LPVVoteRecord extends Omit<VoteRecord, 'selectedCandidateId' | 'candidateRankings'> {
  lpvVote: LPVVote;
  preferencesCount: number;  // How many preferences the voter actually selected
}

// Candidate-Citizen Verification
export interface CandidateCitizenLink {
  candidateId: string;
  citizenId: string;
  nationalIdNumber: string;
  citizenPhoto: string;      // Photo from citizen registration
  candidatePhoto: string;    // Photo for candidate registration
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;       // Electoral officer who verified
  verifiedAt?: Date;
  photoMatch: boolean;       // Whether photos match for identity verification
  biometricMatch?: boolean;  // Optional biometric verification
}

// Enhanced Candidate with Citizen Link
export interface EnhancedCandidate extends Candidate {
  citizenLink?: CandidateCitizenLink;
  citizenRecord?: {
    fullName: string;
    dateOfBirth: string;
    province: string;
    district: string;
    llg: string;
    village: string;
    photo?: string;
  };
}

// Ballot Display Options for LPV
export interface BallotDisplayOption {
  displayMode: 'gallery' | 'sequential' | 'box_selection';
  showCandidatePhotos: boolean;
  showCandidateNames: boolean;
  showPartyLogos: boolean;
  enableAudioIntroductions: boolean;
}

// Real-time Election Monitoring
export interface ElectionMonitoring {
  monitoringId: string;
  electionId: string;
  timestamp: Date;

  // System Health
  systemStatus: 'healthy' | 'warning' | 'critical';
  onlineDevices: number;
  offlineDevices: number;
  networkLatency: number;

  // Voting Progress
  totalVotesCast: number;
  votesPerHour: number;
  projectedTurnout: number;

  // Geographic Distribution
  votesByProvince: { [province: string]: number };
  votesByConstituency: { [constituency: string]: number };

  // Anomaly Detection
  suspiciousActivities: AnomalyAlert[];
  performanceAlerts: PerformanceAlert[];
  securityAlerts: SecurityAlert[];

  // Observer Reports
  independentObserverReports: ObserverReport[];
  mediaReports: MediaReport[];
}

export interface AnomalyAlert {
  alertId: string;
  alertType: 'voting_pattern' | 'device_behavior' | 'network_anomaly' | 'biometric_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  constituency?: string;
  deviceId?: string;
  timestamp: Date;
  resolved: boolean;
  investigatedBy?: string;
}

export interface PerformanceAlert {
  alertId: string;
  metricType: 'response_time' | 'throughput' | 'error_rate' | 'queue_length';
  currentValue: number;
  thresholdValue: number;
  affectedSystems: string[];
  mitigationActions: string[];
  timestamp: Date;
}

export interface SecurityAlert {
  alertId: string;
  securityEvent: 'unauthorized_access' | 'tampering_detected' | 'unusual_login' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  responseActions: string[];
  investigationStatus: 'open' | 'investigating' | 'resolved' | 'false_positive';
  timestamp: Date;
}

export interface ObserverReport {
  reportId: string;
  observerName: string;
  organization: string;
  observerType: 'international' | 'domestic' | 'political_party' | 'civil_society';
  constituency: string;
  pollingStation?: string;

  observations: string;
  irregularitiesNoted: string[];
  recommendationsOffered: string[];
  overallAssessment: 'excellent' | 'good' | 'fair' | 'poor' | 'unacceptable';

  timestamp: Date;
  verifiedBy?: string;
}

export interface MediaReport {
  reportId: string;
  mediaOutlet: string;
  reporterName: string;
  headline: string;
  content: string;
  constituency?: string;

  reportType: 'news' | 'analysis' | 'editorial' | 'live_update';
  sentiment: 'positive' | 'neutral' | 'negative';

  timestamp: Date;
  sourceVerified: boolean;
  factChecked: boolean;
}
