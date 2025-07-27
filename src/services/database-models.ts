// PNG Digital Electoral System - Production Database Models
// Enterprise-grade schemas with advanced indexing, relationships, and optimization

// Core Entity Models
export interface CitizenEntity {
  // Primary identifiers
  citizen_id: string; // Primary key
  national_id: string; // Unique constraint

  // Personal information
  full_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: Date;
  gender: 'male' | 'female' | 'other';

  // Address information
  province: string;
  district: string;
  llg: string; // Local Level Government
  ward: string;
  village?: string;
  address_line_1: string;
  address_line_2?: string;
  postal_code?: string;

  // Contact information
  phone_number?: string;
  email_address?: string;
  emergency_contact?: string;

  // Biometric data (encrypted)
  biometric_hash: string;
  fingerprint_template: string; // Encrypted
  photo_url: string;
  photo_hash: string;

  // Electoral information
  constituency_id: string; // Foreign key
  polling_station_id?: string; // Foreign key
  voter_registration_number?: string;
  electoral_status: 'eligible' | 'suspended' | 'deceased' | 'relocated';

  // Verification and audit
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: string; // Foreign key to verifier
  verified_at?: Date;
  verification_method?: 'community' | 'biometric' | 'document' | 'witness';

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by: string;
  last_modified_by: string;
  data_source: 'field_registration' | 'civil_registry' | 'migration' | 'correction';
  data_quality_score: number; // 0-100

  // Security and privacy
  encryption_key_id: string;
  data_classification: 'public' | 'restricted' | 'confidential' | 'secret';
  retention_period: number; // Years

  // Soft delete and versioning
  is_deleted: boolean;
  deleted_at?: Date;
  version: number;

  // Indexes (PostgreSQL)
  // CREATE INDEX CONCURRENTLY idx_citizen_national_id ON citizens(national_id);
  // CREATE INDEX CONCURRENTLY idx_citizen_constituency ON citizens(constituency_id);
  // CREATE INDEX CONCURRENTLY idx_citizen_verification_status ON citizens(verification_status);
  // CREATE INDEX CONCURRENTLY idx_citizen_electoral_status ON citizens(electoral_status);
  // CREATE INDEX CONCURRENTLY idx_citizen_created_at ON citizens(created_at);
  // CREATE INDEX CONCURRENTLY idx_citizen_province_district ON citizens(province, district);
  // CREATE INDEX CONCURRENTLY idx_citizen_biometric_hash ON citizens(biometric_hash);
  // CREATE INDEX CONCURRENTLY idx_citizen_full_name_gin ON citizens USING gin(to_tsvector('english', full_name));
}

export interface ConstituencyEntity {
  // Primary identifiers
  constituency_id: string; // Primary key
  constituency_code: string; // Unique constraint

  // Basic information
  name: string;
  type: 'open' | 'regional' | 'provincial' | 'local';

  // Geographic information
  province: string;
  district: string;
  region: 'highlands' | 'mainland' | 'islands' | 'ncd';

  // Electoral boundaries
  boundary_coordinates: any; // GeoJSON
  boundary_area_km2: number;
  boundary_file_url?: string;
  boundary_last_updated: Date;

  // Population and demographics
  total_population: number;
  eligible_population: number;
  registered_voters: number;
  projected_turnout: number;
  urban_percentage: number;

  // Infrastructure
  polling_stations_count: number;
  accessibility_level: 'high' | 'medium' | 'low' | 'remote';
  internet_connectivity: 'excellent' | 'good' | 'poor' | 'none';
  transport_access: 'road' | 'air' | 'sea' | 'foot' | 'mixed';

  // Administrative
  returning_officer: string;
  assistant_returning_officers: string[];
  electoral_office_address: string;
  contact_information: string;

  // Election configuration
  lpv_enabled: boolean;
  candidate_nomination_deadline: Date;
  special_voting_provisions: string[];

  // Metadata
  created_at: Date;
  updated_at: Date;
  last_boundary_review: Date;
  next_boundary_review: Date;

  // Status and validation
  status: 'active' | 'inactive' | 'suspended' | 'under_review';
  validation_status: 'validated' | 'pending' | 'disputed';

  // Indexes (PostgreSQL)
  // CREATE INDEX CONCURRENTLY idx_constituency_code ON constituencies(constituency_code);
  // CREATE INDEX CONCURRENTLY idx_constituency_province ON constituencies(province);
  // CREATE INDEX CONCURRENTLY idx_constituency_type ON constituencies(type);
  // CREATE INDEX CONCURRENTLY idx_constituency_status ON constituencies(status);
  // CREATE INDEX CONCURRENTLY idx_constituency_boundary_gist ON constituencies USING gist(boundary_coordinates);
}

export interface ElectionEntity {
  // Primary identifiers
  election_id: string; // Primary key
  election_code: string; // Unique constraint

  // Basic information
  name: string;
  description: string;
  type: 'national' | 'provincial' | 'local' | 'by_election' | 'referendum';

  // Timeline
  nomination_start_date: Date;
  nomination_end_date: Date;
  campaign_start_date: Date;
  campaign_end_date: Date;
  voting_start_date: Date;
  voting_end_date: Date;
  counting_start_date: Date;
  results_declaration_date: Date;

  // Configuration
  voting_method: 'lpv' | 'fptp' | 'proportional' | 'mixed';
  max_preferences: number;
  allow_informal_votes: boolean;
  require_full_preferences: boolean;

  // Security settings
  encryption_enabled: boolean;
  encryption_algorithm: string;
  digital_signatures_required: boolean;
  audit_level: 'minimal' | 'standard' | 'comprehensive';

  // Constituency coverage
  constituencies: string[]; // Array of constituency IDs
  total_constituencies: number;
  total_polling_stations: number;
  estimated_eligible_voters: number;

  // Status and workflow
  status: 'draft' | 'configured' | 'nominations_open' | 'campaigning' | 'voting' | 'counting' | 'completed' | 'archived';
  workflow_stage: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: Date;

  // Results and statistics
  total_votes_cast?: number;
  voter_turnout_percentage?: number;
  informal_votes?: number;
  disputed_results?: boolean;

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by: string;
  last_modified_by: string;

  // Legal and compliance
  legal_framework: string;
  regulatory_approval: string;
  international_observers: string[];

  // Indexes (PostgreSQL)
  // CREATE INDEX CONCURRENTLY idx_election_type_status ON elections(type, status);
  // CREATE INDEX CONCURRENTLY idx_election_voting_dates ON elections(voting_start_date, voting_end_date);
  // CREATE INDEX CONCURRENTLY idx_election_created_at ON elections(created_at);
  // CREATE INDEX CONCURRENTLY idx_election_constituencies_gin ON elections USING gin(constituencies);
}

export interface CandidateEntity {
  // Primary identifiers
  candidate_id: string; // Primary key
  nomination_number: string; // Unique per constituency

  // Candidate information
  citizen_id: string; // Foreign key to citizens
  full_name: string;
  display_name: string;
  date_of_birth: Date;

  // Electoral information
  election_id: string; // Foreign key
  constituency_id: string; // Foreign key
  party_affiliation?: string;
  independent_candidate: boolean;
  coalition_member?: string;

  // Nomination details
  nomination_date: Date;
  nominated_by: string[]; // Array of nominator citizen IDs
  proposer_citizen_id: string;
  seconder_citizen_id: string;

  // Documents and verification
  nomination_form_url: string;
  identity_document_url: string;
  qualification_documents: string[];
  declaration_documents: string[];
  photo_url: string;

  // Verification and approval
  verification_status: 'pending' | 'documents_verified' | 'approved' | 'rejected' | 'withdrawn';
  verified_by?: string;
  verified_at?: Date;
  rejection_reason?: string;

  // Campaign information
  campaign_contact_person: string;
  campaign_phone: string;
  campaign_email: string;
  campaign_address: string;
  campaign_website?: string;

  // Financial declarations
  nomination_fee_paid: boolean;
  deposit_amount: number;
  deposit_paid_at?: Date;
  financial_declaration_url?: string;

  // Ballot information
  ballot_position: number;
  ballot_name: string;
  ballot_description?: string;

  // Results (if applicable)
  votes_received?: number;
  vote_percentage?: number;
  preference_flows?: any; // JSON data for LPV
  final_position?: number;
  elected: boolean;

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by: string;
  last_modified_by: string;

  // Status tracking
  status: 'nominated' | 'approved' | 'campaigning' | 'election_day' | 'results_declared' | 'elected' | 'defeated';
  withdrawal_date?: Date;
  withdrawal_reason?: string;

  // Indexes (PostgreSQL)
  // CREATE INDEX CONCURRENTLY idx_candidate_election_constituency ON candidates(election_id, constituency_id);
  // CREATE INDEX CONCURRENTLY idx_candidate_citizen ON candidates(citizen_id);
  // CREATE INDEX CONCURRENTLY idx_candidate_verification_status ON candidates(verification_status);
  // CREATE INDEX CONCURRENTLY idx_candidate_ballot_position ON candidates(constituency_id, ballot_position);
  // CREATE INDEX CONCURRENTLY idx_candidate_status ON candidates(status);
}

export interface BallotEntity {
  // Primary identifiers
  ballot_id: string; // Primary key
  ballot_serial_number: string; // Unique constraint

  // Election context
  election_id: string; // Foreign key
  constituency_id: string; // Foreign key
  polling_station_id: string; // Foreign key

  // Voter information (anonymized)
  voter_id_hash: string; // One-way hash of voter ID
  voter_sequence_number: number; // Sequential number for the polling station

  // Voting data (encrypted)
  vote_data_encrypted: string; // Encrypted LPV preferences
  encryption_key_id: string;
  encryption_algorithm: string;

  // LPV preferences (for counting - decrypted temporarily)
  first_preference?: string; // Candidate ID
  second_preference?: string;
  third_preference?: string;
  informal_vote: boolean;

  // Digital signatures and verification
  ballot_signature: string;
  device_signature: string;
  voter_receipt_hash: string;

  // Casting information
  cast_timestamp: Date;
  device_id: string;
  device_fingerprint: string;
  polling_official_id?: string;

  // Network and location
  ip_address_hash: string; // Hashed for privacy
  geolocation?: string; // If captured
  network_fingerprint: string;

  // Verification and integrity
  verification_proofs: string; // JSON array of cryptographic proofs
  merkle_tree_position?: number;
  blockchain_hash?: string;

  // Processing status
  processing_status: 'cast' | 'verified' | 'counted' | 'disputed' | 'invalidated';
  counted_in_round?: number; // For LPV counting
  exhausted_at_round?: number;

  // Audit trail
  audit_hash: string;
  previous_ballot_hash?: string; // Chain linking

  // Quality and validation
  validation_errors: string[]; // JSON array
  data_quality_flags: string[]; // Any issues identified

  // Metadata
  created_at: Date;
  last_processed_at: Date;
  processed_by: string;

  // Privacy and security
  retention_period_years: number;
  anonymization_date?: Date;

  // Indexes (PostgreSQL)
  // CREATE INDEX CONCURRENTLY idx_ballot_election_constituency ON ballots(election_id, constituency_id);
  // CREATE INDEX CONCURRENTLY idx_ballot_cast_timestamp ON ballots(cast_timestamp);
  // CREATE INDEX CONCURRENTLY idx_ballot_processing_status ON ballots(processing_status);
  // CREATE INDEX CONCURRENTLY idx_ballot_polling_station ON ballots(polling_station_id);
  // CREATE INDEX CONCURRENTLY idx_ballot_voter_hash ON ballots(voter_id_hash);
  // CREATE UNIQUE INDEX CONCURRENTLY idx_ballot_serial_unique ON ballots(ballot_serial_number);
}

export interface PollingStationEntity {
  // Primary identifiers
  polling_station_id: string; // Primary key
  station_code: string; // Unique constraint

  // Basic information
  name: string;
  type: 'regular' | 'mobile' | 'special' | 'pre_poll' | 'postal';

  // Location
  constituency_id: string; // Foreign key
  address: string;
  suburb_village: string;
  coordinates: { lat: number; lng: number };

  // Capacity and logistics
  capacity: number;
  estimated_voters: number;
  expected_turnout: number;
  booth_count: number;

  // Accessibility
  wheelchair_accessible: boolean;
  public_transport_access: boolean;
  parking_available: boolean;
  accessibility_features: string[];

  // Staffing
  presiding_officer_id?: string;
  deputy_presiding_officer_id?: string;
  polling_assistants: string[]; // Array of staff IDs
  security_personnel: string[];

  // Equipment and technology
  voting_machines: string[]; // Array of equipment IDs
  backup_equipment: string[];
  internet_connectivity: boolean;
  power_backup: boolean;

  // Operating hours
  opening_time: string;
  closing_time: string;
  timezone: string;
  extended_hours: boolean;

  // Security measures
  security_level: 'standard' | 'enhanced' | 'maximum';
  security_cameras: boolean;
  armed_security: boolean;

  // Status and operations
  status: 'setup' | 'testing' | 'ready' | 'open' | 'closed' | 'sealed' | 'disputed';
  last_status_update: Date;

  // Election day operations
  opening_checklist_completed: boolean;
  closing_checklist_completed: boolean;
  ballots_issued: number;
  ballots_unused: number;
  informal_votes: number;

  // Results summary
  total_votes_cast: number;
  voter_turnout_percentage: number;
  incidents_reported: number;

  // Metadata
  created_at: Date;
  updated_at: Date;
  last_inspection_date: Date;
  next_inspection_due: Date;

  // Indexes (PostgreSQL)
  // CREATE INDEX CONCURRENTLY idx_polling_station_constituency ON polling_stations(constituency_id);
  // CREATE INDEX CONCURRENTLY idx_polling_station_status ON polling_stations(status);
  // CREATE INDEX CONCURRENTLY idx_polling_station_coordinates ON polling_stations USING gist(coordinates);
  // CREATE INDEX CONCURRENTLY idx_polling_station_type ON polling_stations(type);
}

export interface AuditLogEntity {
  // Primary identifiers
  audit_id: string; // Primary key
  correlation_id: string; // Groups related events

  // Event information
  event_type: string;
  event_category: 'security' | 'data' | 'system' | 'user' | 'election' | 'audit';
  event_severity: 'info' | 'warning' | 'error' | 'critical';

  // Actor information
  user_id?: string;
  user_type: 'citizen' | 'official' | 'administrator' | 'system' | 'observer';
  user_role?: string;

  // Target information
  target_type: 'citizen' | 'candidate' | 'ballot' | 'election' | 'system' | 'data';
  target_id?: string;

  // Action details
  action: string;
  description: string;
  before_state?: string; // JSON
  after_state?: string; // JSON

  // Context information
  session_id?: string;
  device_id?: string;
  ip_address_hash: string;
  user_agent_hash: string;
  geolocation?: string;

  // Technical details
  system_component: string;
  api_endpoint?: string;
  http_method?: string;
  response_code?: number;
  processing_time_ms?: number;

  // Security and integrity
  digital_signature: string;
  hash_chain_position: number;
  previous_audit_hash: string;
  tamper_seal: string;

  // Compliance and legal
  legal_basis: string;
  retention_period_years: number;
  data_classification: 'public' | 'internal' | 'confidential' | 'restricted';

  // Timing
  event_timestamp: Date;
  created_at: Date;
  timezone: string;

  // Additional metadata
  additional_data: string; // JSON for flexible fields
  tags: string[]; // For categorization and search

  // Investigation and follow-up
  investigation_status?: 'none' | 'pending' | 'in_progress' | 'completed' | 'closed';
  assigned_investigator?: string;
  investigation_notes?: string;

  // Indexes (PostgreSQL)
  // CREATE INDEX CONCURRENTLY idx_audit_timestamp ON audit_logs(event_timestamp);
  // CREATE INDEX CONCURRENTLY idx_audit_user_id ON audit_logs(user_id);
  // CREATE INDEX CONCURRENTLY idx_audit_event_type ON audit_logs(event_type);
  // CREATE INDEX CONCURRENTLY idx_audit_severity ON audit_logs(event_severity);
  // CREATE INDEX CONCURRENTLY idx_audit_target ON audit_logs(target_type, target_id);
  // CREATE INDEX CONCURRENTLY idx_audit_correlation ON audit_logs(correlation_id);
  // CREATE INDEX CONCURRENTLY idx_audit_hash_chain ON audit_logs(hash_chain_position);
}

export interface VerifierEntity {
  // Primary identifiers
  verifier_id: string; // Primary key

  // Personal information
  citizen_id: string; // Foreign key
  full_name: string;
  role: 'pastor' | 'councilor' | 'chief' | 'administrator' | 'observer';
  organization?: string;

  // Authorization
  authorization_level: number; // 1-5 scale
  authorized_constituencies: string[]; // Array of constituency IDs
  authority_document_url: string;

  // Contact information
  phone_number: string;
  email_address?: string;
  office_address?: string;

  // Biometric verification
  biometric_template: string; // Encrypted
  photo_url: string;
  fingerprint_hash: string;

  // Verification capabilities
  can_verify_citizens: boolean;
  can_verify_candidates: boolean;
  can_witness_elections: boolean;
  max_verifications_per_day: number;

  // Performance tracking
  verifications_performed: number;
  successful_verifications: number;
  disputed_verifications: number;
  average_verification_time: number;

  // Status and validity
  status: 'active' | 'suspended' | 'revoked' | 'expired';
  authorized_from: Date;
  authorized_until: Date;
  last_active_date: Date;

  // Training and certification
  training_completed: boolean;
  training_completion_date?: Date;
  certification_number?: string;
  recertification_due?: Date;

  // Security
  security_clearance_level: number;
  background_check_completed: boolean;
  background_check_date?: Date;

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by: string;
  last_modified_by: string;

  // Indexes (PostgreSQL)
  // CREATE INDEX CONCURRENTLY idx_verifier_citizen ON verifiers(citizen_id);
  // CREATE INDEX CONCURRENTLY idx_verifier_role_status ON verifiers(role, status);
  // CREATE INDEX CONCURRENTLY idx_verifier_constituencies ON verifiers USING gin(authorized_constituencies);
  // CREATE INDEX CONCURRENTLY idx_verifier_authorized_period ON verifiers(authorized_from, authorized_until);
}

// Database Schema Creation Scripts
export const DatabaseSchemas = {
  // PostgreSQL schema with advanced features
  createPostgreSQLSchema: () => `
    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "postgis";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Citizens table with full-text search and GIS support
    CREATE TABLE citizens (
      citizen_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      national_id VARCHAR(20) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      last_name VARCHAR(100) NOT NULL,
      date_of_birth DATE NOT NULL,
      gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),

      province VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      llg VARCHAR(100) NOT NULL,
      ward VARCHAR(100) NOT NULL,
      village VARCHAR(100),
      address_line_1 TEXT NOT NULL,
      address_line_2 TEXT,
      postal_code VARCHAR(10),

      phone_number VARCHAR(20),
      email_address VARCHAR(255),
      emergency_contact VARCHAR(255),

      biometric_hash VARCHAR(128) NOT NULL,
      fingerprint_template TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      photo_hash VARCHAR(64) NOT NULL,

      constituency_id UUID,
      polling_station_id UUID,
      voter_registration_number VARCHAR(50),
      electoral_status VARCHAR(20) DEFAULT 'eligible'
        CHECK (electoral_status IN ('eligible', 'suspended', 'deceased', 'relocated')),

      verification_status VARCHAR(20) DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
      verified_by UUID,
      verified_at TIMESTAMPTZ,
      verification_method VARCHAR(20),

      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by VARCHAR(255) NOT NULL,
      last_modified_by VARCHAR(255) NOT NULL,
      data_source VARCHAR(50) NOT NULL,
      data_quality_score INTEGER DEFAULT 100 CHECK (data_quality_score BETWEEN 0 AND 100),

      encryption_key_id VARCHAR(100),
      data_classification VARCHAR(20) DEFAULT 'restricted',
      retention_period INTEGER DEFAULT 50,

      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMPTZ,
      version INTEGER DEFAULT 1,

      -- Search vector for full-text search
      search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', full_name || ' ' || COALESCE(national_id, '') || ' ' ||
        COALESCE(phone_number, '') || ' ' || COALESCE(email_address, ''))
      ) STORED
    );

    -- Comprehensive indexing strategy for citizens
    CREATE INDEX CONCURRENTLY idx_citizens_national_id ON citizens(national_id) WHERE NOT is_deleted;
    CREATE INDEX CONCURRENTLY idx_citizens_constituency ON citizens(constituency_id) WHERE NOT is_deleted;
    CREATE INDEX CONCURRENTLY idx_citizens_verification_status ON citizens(verification_status) WHERE NOT is_deleted;
    CREATE INDEX CONCURRENTLY idx_citizens_electoral_status ON citizens(electoral_status) WHERE NOT is_deleted;
    CREATE INDEX CONCURRENTLY idx_citizens_created_at ON citizens(created_at);
    CREATE INDEX CONCURRENTLY idx_citizens_province_district ON citizens(province, district) WHERE NOT is_deleted;
    CREATE INDEX CONCURRENTLY idx_citizens_biometric_hash ON citizens(biometric_hash);
    CREATE INDEX CONCURRENTLY idx_citizens_search_vector ON citizens USING gin(search_vector);
    CREATE INDEX CONCURRENTLY idx_citizens_location_compound ON citizens(province, district, llg, ward) WHERE NOT is_deleted;

    -- Constituencies table with GIS support
    CREATE TABLE constituencies (
      constituency_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      constituency_code VARCHAR(20) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('open', 'regional', 'provincial', 'local')),

      province VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      region VARCHAR(20) NOT NULL CHECK (region IN ('highlands', 'mainland', 'islands', 'ncd')),

      boundary_coordinates JSONB,
      boundary_geography GEOGRAPHY(POLYGON),
      boundary_area_km2 DECIMAL(10,2),
      boundary_file_url TEXT,
      boundary_last_updated TIMESTAMPTZ DEFAULT NOW(),

      total_population INTEGER DEFAULT 0,
      eligible_population INTEGER DEFAULT 0,
      registered_voters INTEGER DEFAULT 0,
      projected_turnout DECIMAL(5,2) DEFAULT 0.00,
      urban_percentage DECIMAL(5,2) DEFAULT 0.00,

      polling_stations_count INTEGER DEFAULT 0,
      accessibility_level VARCHAR(20) DEFAULT 'medium',
      internet_connectivity VARCHAR(20) DEFAULT 'poor',
      transport_access VARCHAR(20) DEFAULT 'mixed',

      returning_officer VARCHAR(255),
      assistant_returning_officers TEXT[],
      electoral_office_address TEXT,
      contact_information TEXT,

      lpv_enabled BOOLEAN DEFAULT TRUE,
      candidate_nomination_deadline TIMESTAMPTZ,
      special_voting_provisions TEXT[],

      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      last_boundary_review TIMESTAMPTZ,
      next_boundary_review TIMESTAMPTZ,

      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'under_review')),
      validation_status VARCHAR(20) DEFAULT 'validated' CHECK (validation_status IN ('validated', 'pending', 'disputed'))
    );

    -- Indexes for constituencies
    CREATE INDEX CONCURRENTLY idx_constituencies_code ON constituencies(constituency_code);
    CREATE INDEX CONCURRENTLY idx_constituencies_province ON constituencies(province);
    CREATE INDEX CONCURRENTLY idx_constituencies_type ON constituencies(type);
    CREATE INDEX CONCURRENTLY idx_constituencies_status ON constituencies(status);
    CREATE INDEX CONCURRENTLY idx_constituencies_boundary ON constituencies USING gist(boundary_geography);

    -- Foreign key constraints
    ALTER TABLE citizens ADD CONSTRAINT fk_citizens_constituency
      FOREIGN KEY (constituency_id) REFERENCES constituencies(constituency_id);

    -- Triggers for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_citizens_updated_at BEFORE UPDATE ON citizens
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_constituencies_updated_at BEFORE UPDATE ON constituencies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `,

  // Performance optimization queries
  optimizationQueries: () => `
    -- Table statistics update
    ANALYZE citizens;
    ANALYZE constituencies;

    -- Vacuum for maintenance
    VACUUM (ANALYZE) citizens;
    VACUUM (ANALYZE) constituencies;

    -- Partitioning for large tables (audit logs)
    CREATE TABLE audit_logs_y2027 PARTITION OF audit_logs
      FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

    -- Materialized views for performance
    CREATE MATERIALIZED VIEW mv_constituency_statistics AS
    SELECT
      c.constituency_id,
      c.name,
      c.province,
      COUNT(cit.citizen_id) as total_citizens,
      COUNT(CASE WHEN cit.electoral_status = 'eligible' THEN 1 END) as eligible_voters,
      COUNT(CASE WHEN cit.verification_status = 'verified' THEN 1 END) as verified_citizens,
      AVG(cit.data_quality_score) as avg_data_quality
    FROM constituencies c
    LEFT JOIN citizens cit ON c.constituency_id = cit.constituency_id
    WHERE NOT cit.is_deleted
    GROUP BY c.constituency_id, c.name, c.province;

    CREATE UNIQUE INDEX ON mv_constituency_statistics(constituency_id);

    -- Refresh materialized view periodically
    CREATE OR REPLACE FUNCTION refresh_constituency_stats()
    RETURNS void AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_constituency_statistics;
    END;
    $$ LANGUAGE plpgsql;
  `,

  // Data validation rules
  validationRules: () => `
    -- Add data validation constraints
    ALTER TABLE citizens ADD CONSTRAINT chk_date_of_birth
      CHECK (date_of_birth >= '1900-01-01' AND date_of_birth <= CURRENT_DATE - INTERVAL '18 years');

    ALTER TABLE citizens ADD CONSTRAINT chk_phone_format
      CHECK (phone_number IS NULL OR phone_number ~ '^\\+?[0-9\\-\\s\\(\\)]+$');

    ALTER TABLE citizens ADD CONSTRAINT chk_email_format
      CHECK (email_address IS NULL OR email_address ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$');

    -- Data integrity functions
    CREATE OR REPLACE FUNCTION validate_national_id(id TEXT)
    RETURNS BOOLEAN AS $$
    BEGIN
      -- PNG National ID validation logic
      RETURN LENGTH(id) >= 8 AND LENGTH(id) <= 20 AND id ~ '^[A-Z0-9]+$';
    END;
    $$ LANGUAGE plpgsql;

    ALTER TABLE citizens ADD CONSTRAINT chk_national_id_format
      CHECK (validate_national_id(national_id));
  `,

  // Security and encryption setup
  securitySetup: () => `
    -- Row Level Security (RLS)
    ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
    ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

    -- Create security roles
    CREATE ROLE electoral_admin;
    CREATE ROLE electoral_officer;
    CREATE ROLE field_registrar;
    CREATE ROLE read_only_observer;

    -- Grant appropriate permissions
    GRANT SELECT, INSERT, UPDATE ON citizens TO electoral_officer;
    GRANT SELECT ON citizens TO read_only_observer;
    GRANT ALL ON citizens TO electoral_admin;

    -- RLS policies
    CREATE POLICY citizen_access_policy ON citizens
      FOR ALL TO electoral_officer
      USING (constituency_id IN (
        SELECT constituency_id FROM user_constituencies
        WHERE user_id = current_setting('app.current_user_id')
      ));

    -- Encryption functions
    CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT, key_id TEXT)
    RETURNS TEXT AS $$
    BEGIN
      -- Use pgcrypto for field-level encryption
      RETURN encode(pgp_sym_encrypt(data, key_id), 'base64');
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data TEXT, key_id TEXT)
    RETURNS TEXT AS $$
    BEGIN
      RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), key_id);
    END;
    $$ LANGUAGE plpgsql;
  `,

  // Backup and maintenance procedures
  maintenanceProcedures: () => `
    -- Regular maintenance procedures
    CREATE OR REPLACE FUNCTION perform_daily_maintenance()
    RETURNS void AS $$
    BEGIN
      -- Update statistics
      ANALYZE;

      -- Refresh materialized views
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_constituency_statistics;

      -- Clean up old sessions
      DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '1 day';

      -- Archive old audit logs
      INSERT INTO audit_logs_archive
      SELECT * FROM audit_logs
      WHERE event_timestamp < NOW() - INTERVAL '1 year';

      DELETE FROM audit_logs
      WHERE event_timestamp < NOW() - INTERVAL '1 year';

      -- Log maintenance completion
      INSERT INTO system_logs (event_type, message, timestamp)
      VALUES ('maintenance', 'Daily maintenance completed', NOW());
    END;
    $$ LANGUAGE plpgsql;

    -- Schedule daily maintenance
    SELECT cron.schedule('daily-maintenance', '0 2 * * *', 'SELECT perform_daily_maintenance();');
  `
};

// Migration management
export interface DatabaseMigration {
  version: string;
  description: string;
  up: string;
  down: string;
  checksum: string;
  appliedAt?: Date;
}

export const migrations: DatabaseMigration[] = [
  {
    version: '001',
    description: 'Initial schema creation',
    up: DatabaseSchemas.createPostgreSQLSchema(),
    down: 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;',
    checksum: 'initial_schema_v1'
  },
  {
    version: '002',
    description: 'Add performance optimizations',
    up: DatabaseSchemas.optimizationQueries(),
    down: 'DROP MATERIALIZED VIEW mv_constituency_statistics;',
    checksum: 'optimization_v1'
  },
  {
    version: '003',
    description: 'Add validation rules',
    up: DatabaseSchemas.validationRules(),
    down: '-- Remove validation constraints',
    checksum: 'validation_v1'
  },
  {
    version: '004',
    description: 'Setup security and encryption',
    up: DatabaseSchemas.securitySetup(),
    down: 'ALTER TABLE citizens DISABLE ROW LEVEL SECURITY;',
    checksum: 'security_v1'
  }
];

console.log('🗄️ Production database models and schemas initialized with advanced optimization');
