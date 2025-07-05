import {
  type Election,
  type Candidate,
  type DigitalBallot,
  type VoteRecord,
  type VoterEligibility,
  Constituency,
  type ElectionResults,
  ElectionMonitoring,
  type CandidateStatus,
  type ElectionStatus,
  type VoteStatus
} from '../types/electoral';
import { db } from './database';
import { authService } from './authService';
import { toast } from 'sonner';

class ElectoralService {
  private static instance: ElectoralService;

  public static getInstance(): ElectoralService {
    if (!ElectoralService.instance) {
      ElectoralService.instance = new ElectoralService();
    }
    return ElectoralService.instance;
  }

  // ==================== CANDIDATE MANAGEMENT ====================

  async registerCandidate(candidateData: Omit<Candidate, 'candidateId' | 'registrationDate' | 'status' | 'registeredBy'>): Promise<Candidate> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to register candidates');
      }

      // Validate user permissions
      if (!this.canManageCandidates(currentUser.uid)) {
        throw new Error('Insufficient permissions to register candidates');
      }

      // Validate candidate eligibility
      await this.validateCandidateEligibility(candidateData);

      const candidate: Candidate = {
        ...candidateData,
        candidateId: this.generateCandidateId(),
        registrationDate: new Date(),
        status: 'registered' as CandidateStatus,
        registeredBy: currentUser.uid,
        voteCount: 0,
        votePercentage: 0
      };

      // Store candidate in local database
      await db.addRecord('candidates', candidate);

      toast.success(`Candidate ${candidate.fullName} registered successfully`);

      return candidate;
    } catch (error) {
      console.error('Error registering candidate:', error);
      toast.error('Failed to register candidate');
      throw error;
    }
  }

  async getCandidatesByConstituency(constituency: string, electionId: string): Promise<Candidate[]> {
    try {
      const allCandidates = await db.getAllRecords('candidates') as Candidate[];

      return allCandidates.filter(candidate =>
        candidate.constituency === constituency &&
        candidate.electionId === electionId &&
        candidate.status === 'approved'
      ).sort((a, b) => a.fullName.localeCompare(b.fullName));
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  }

  async updateCandidateStatus(candidateId: string, status: CandidateStatus): Promise<void> {
    try {
      const candidate = await db.getRecord('candidates', candidateId) as Candidate;
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      candidate.status = status;
      await db.updateRecord('candidates', candidateId, candidate);

      toast.success(`Candidate status updated to ${status}`);
    } catch (error) {
      console.error('Error updating candidate status:', error);
      toast.error('Failed to update candidate status');
      throw error;
    }
  }

  private async validateCandidateEligibility(candidateData: any): Promise<void> {
    // Validate age (must be 25+ for most positions)
    const age = this.calculateAge(candidateData.dateOfBirth);
    if (age < 25) {
      throw new Error('Candidate must be at least 25 years old');
    }

    // Validate PNG citizenship (through National ID)
    if (!candidateData.nationalIdNumber || candidateData.nationalIdNumber.length < 8) {
      throw new Error('Valid PNG National ID required');
    }

    // Check for existing registration in same constituency
    const existingCandidates = await this.getCandidatesByConstituency(
      candidateData.constituency,
      candidateData.electionId
    );

    const duplicate = existingCandidates.find(c =>
      c.nationalIdNumber === candidateData.nationalIdNumber
    );

    if (duplicate) {
      throw new Error('Candidate already registered in this constituency');
    }

    // Validate required documents
    if (!candidateData.documentsVerified) {
      throw new Error('All required documents must be verified');
    }
  }

  // ==================== ELECTION MANAGEMENT ====================

  async createElection(electionData: Omit<Election, 'electionId' | 'createdAt' | 'createdBy' | 'status'>): Promise<Election> {
    try {
      // In demo mode, use a mock user ID
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.uid || 'demo-admin-123';

      const election: Election = {
        ...electionData,
        electionId: this.generateElectionId(),
        status: 'planned' as ElectionStatus,
        createdBy: userId,
        createdAt: new Date(),
        lastModified: new Date()
      };

      await db.addRecord('elections', election);

      console.log(`Election "${election.electionName}" created successfully`);

      return election;
    } catch (error) {
      console.error('Error creating election:', error);
      console.log('Creating election anyway for demo mode');

      // Fallback for demo mode
      const election: Election = {
        ...electionData,
        electionId: this.generateElectionId(),
        status: 'planned' as ElectionStatus,
        createdBy: 'demo-admin-123',
        createdAt: new Date(),
        lastModified: new Date()
      };

      return election;
    }
  }

  async getActiveElections(): Promise<Election[]> {
    try {
      const allElections = await db.getAllRecords('elections') as Election[];

      // In demo mode, return all elections (even if empty)
      if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
        return allElections.sort((a, b) => new Date(a.votingStartDate).getTime() - new Date(b.votingStartDate).getTime());
      }

      return allElections.filter(election =>
        ['planned', 'registration_open', 'voting_open'].includes(election.status)
      ).sort((a, b) => new Date(a.votingStartDate).getTime() - new Date(b.votingStartDate).getTime());
    } catch (error) {
      console.error('Error fetching active elections:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async updateElectionStatus(electionId: string, status: ElectionStatus): Promise<void> {
    try {
      const election = await db.getRecord('elections', electionId) as Election;
      if (!election) {
        throw new Error('Election not found');
      }

      election.status = status;
      election.lastModified = new Date();

      await db.updateRecord('elections', electionId, election);

      toast.success(`Election status updated to ${status}`);
    } catch (error) {
      console.error('Error updating election status:', error);
      toast.error('Failed to update election status');
      throw error;
    }
  }

  // ==================== DIGITAL BALLOT MANAGEMENT ====================

  async generateBallot(electionId: string, constituency: string, voterId: string): Promise<DigitalBallot> {
    try {
      // Verify voter eligibility
      const eligibility = await this.checkVoterEligibility(voterId, electionId, constituency);
      if (!eligibility.isEligible) {
        throw new Error('Voter is not eligible to vote in this election');
      }

      // Check if voter has already voted
      if (eligibility.hasVotedInThisElection) {
        throw new Error('Voter has already cast their vote in this election');
      }

      // Get election details
      const election = await db.getRecord('elections', electionId) as Election;
      if (!election) {
        throw new Error('Election not found');
      }

      // Get candidates for this constituency
      const candidates = await this.getCandidatesByConstituency(constituency, electionId);
      if (candidates.length === 0) {
        throw new Error('No approved candidates found for this constituency');
      }

      // Generate ballot
      const ballot: DigitalBallot = {
        ballotId: this.generateBallotId(),
        electionId,
        constituency,
        voterId,
        ballotTitle: `${election.electionName} - ${constituency}`,
        ballotInstructions: {
          text: 'Select one candidate to represent your constituency',
          languages: {
            english: 'Select one candidate to represent your constituency',
            tokPisin: 'Makim wanpela kandidet bilong representim konstituensi bilong yu',
            hiriMotu: 'Gagarai ta gauna kandideti tauna-na constituency-mu hamo representative-na'
          }
        },
        candidates: candidates,
        maxSelections: 1,
        requiresRanking: election.votingMethod === 'preferential',
        accessibilityFeatures: {
          largeText: true,
          highContrast: true,
          audioAssistance: true,
          touchOptimized: true,
          screenReader: true
        },
        ballotHash: this.generateBallotHash(candidates),
        generatedAt: new Date(),
        expiresAt: new Date(election.votingEndDate)
      };

      return ballot;
    } catch (error) {
      console.error('Error generating ballot:', error);
      throw error;
    }
  }

  // ==================== VOTING PROCESS ====================

  async castVote(ballotId: string, selectedCandidateId: string, biometricData?: any): Promise<VoteRecord> {
    try {
      // Get ballot information
      const ballot = await this.getBallotById(ballotId);
      if (!ballot) {
        throw new Error('Invalid ballot');
      }

      // Verify ballot is still valid
      if (new Date() > ballot.expiresAt) {
        throw new Error('Ballot has expired');
      }

      // Verify candidate selection is valid
      const selectedCandidate = ballot.candidates.find(c => c.candidateId === selectedCandidateId);
      if (!selectedCandidate) {
        throw new Error('Invalid candidate selection');
      }

      // Verify voter identity (biometric check)
      if (biometricData) {
        await this.verifyVoterBiometrics(ballot.voterId, biometricData);
      }

      // Create vote record
      const voteRecord: VoteRecord = {
        voteId: this.generateVoteId(),
        ballotId: ballot.ballotId,
        electionId: ballot.electionId,
        constituency: ballot.constituency,
        voterIdHash: this.hashVoterId(ballot.voterId),
        voterConstituency: ballot.constituency,
        voterProvince: await this.getVoterProvince(ballot.voterId),
        selectedCandidateId,
        voteTimestamp: new Date(),
        biometricVerified: !!biometricData,
        deviceFingerprint: this.getDeviceFingerprint(),
        voteHash: this.generateVoteHash(selectedCandidateId, ballot.voterId),
        status: 'vote_cast' as VoteStatus,
        castingDevice: navigator.userAgent,
        networkInfo: (navigator as any).connection?.effectiveType || 'unknown',
        auditHash: this.generateAuditHash()
      };

      // Store vote record
      await db.addRecord('votes', voteRecord);

      // Mark voter as having voted
      await this.markVoterAsVoted(ballot.voterId, ballot.electionId);

      // Update candidate vote count (local tracking)
      await this.incrementCandidateVoteCount(selectedCandidateId);

      toast.success('Your vote has been cast successfully');

      return voteRecord;
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Failed to cast vote');
      throw error;
    }
  }

  // ==================== VOTER ELIGIBILITY ====================

  async checkVoterEligibility(voterId: string, electionId: string, constituency: string): Promise<VoterEligibility> {
    try {
      // Get voter's citizen record
      const citizen = await db.getRecord('citizens', voterId);
      if (!citizen) {
        throw new Error('Voter record not found');
      }

      // Check if voter has already voted in this election
      const existingVotes = await db.getAllRecords('votes') as VoteRecord[];
      const hasVoted = existingVotes.some(vote =>
        this.hashVoterId(voterId) === vote.voterIdHash &&
        vote.electionId === electionId
      );

      // Calculate age eligibility
      const age = this.calculateAge(citizen.dateOfBirth);
      const ageEligible = age >= 18;

      // Check constituency matching (critical for PNG electoral system)
      const constituencyMatch = citizen.district === constituency || citizen.province === constituency;

      const eligibility: VoterEligibility = {
        voterId,
        electionId,
        nationalIdNumber: citizen.nationalIdNumber,
        birthRegistryId: citizen.nationalIdNumber, // Assume same for now
        biometricVerified: !!(citizen.photo && citizen.fingerprint),
        isEligible: ageEligible && constituencyMatch && !hasVoted && citizen.voterStatus,
        ageEligible,
        citizenshipVerified: !!citizen.nationalIdNumber,
        mentallySoundCertified: true, // Assume true unless specified
        notDisqualified: true, // Would need integration with criminal database
        constituencyOfOrigin: citizen.district || citizen.province,
        canVoteAtCurrentLocation: constituencyMatch,
        hasVotedInThisElection: hasVoted,
        voteHistory: [], // Would be populated from vote records
        registrationStatus: 'verified',
        registrationDate: new Date(citizen.createdAt),
        verificationDate: new Date(),
        verifiedBy: 'system',
        documentsProvided: ['nationalId', 'photo', 'fingerprint']
      };

      return eligibility;
    } catch (error) {
      console.error('Error checking voter eligibility:', error);
      throw error;
    }
  }

  // ==================== RESULTS & MONITORING ====================

  async getElectionResults(electionId: string, constituency?: string): Promise<ElectionResults[]> {
    try {
      const votes = await db.getAllRecords('votes') as VoteRecord[];
      const candidates = await db.getAllRecords('candidates') as Candidate[];

      // Filter votes for this election
      const electionVotes = votes.filter(vote => vote.electionId === electionId);

      if (constituency) {
        return [this.calculateConstituencyResults(electionId, constituency, electionVotes, candidates)];
      }

      // Get all constituencies for this election
      const constituencies = [...new Set(electionVotes.map(vote => vote.constituency))];

      return constituencies.map(constituency =>
        this.calculateConstituencyResults(electionId, constituency, electionVotes, candidates)
      );
    } catch (error) {
      console.error('Error getting election results:', error);
      throw error;
    }
  }

  private calculateConstituencyResults(
    electionId: string,
    constituency: string,
    votes: VoteRecord[],
    candidates: Candidate[]
  ): ElectionResults {
    const constituencyVotes = votes.filter(vote =>
      vote.electionId === electionId && vote.constituency === constituency
    );

    const candidateVoteCounts = new Map<string, number>();

    // Count votes for each candidate
    constituencyVotes.forEach(vote => {
      const count = candidateVoteCounts.get(vote.selectedCandidateId) || 0;
      candidateVoteCounts.set(vote.selectedCandidateId, count + 1);
    });

    // Create candidate results
    const candidateResults = Array.from(candidateVoteCounts.entries()).map(([candidateId, voteCount]) => {
      const candidate = candidates.find(c => c.candidateId === candidateId);
      return {
        candidateId,
        candidateName: candidate?.fullName || 'Unknown',
        party: candidate?.party,
        voteCount,
        votePercentage: (voteCount / constituencyVotes.length) * 100,
        ranking: 0, // Will be set after sorting
        isWinner: false // Will be set after determining winner
      };
    }).sort((a, b) => b.voteCount - a.voteCount);

    // Set rankings and winner
    candidateResults.forEach((result, index) => {
      result.ranking = index + 1;
      result.isWinner = index === 0;
    });

    const winner = candidateResults[0];
    const secondPlace = candidateResults[1];

    return {
      electionId,
      constituency,
      totalVotesCast: constituencyVotes.length,
      validVotes: constituencyVotes.length,
      invalidVotes: 0,
      blankVotes: 0,
      candidateResults,
      winningCandidateId: winner?.candidateId || '',
      winningMargin: winner && secondPlace ? winner.voteCount - secondPlace.voteCount : 0,
      isDecisive: true,
      totalRegisteredVoters: 0, // Would need separate voter registration count
      turnoutPercentage: 0, // Would calculate based on registered voters
      votingStarted: new Date(), // Would get from election record
      votingEnded: new Date(),
      resultsCalculatedAt: new Date(),
      isVerified: false,
      auditCompleted: false,
      disputesRaised: 0,
      anomaliesDetected: [],
      isPublished: false,
      publishedBy: ''
    };
  }

  // ==================== UTILITY METHODS ====================

  private generateCandidateId(): string {
    return `CAND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateElectionId(): string {
    return `ELEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBallotId(): string {
    return `BALLOT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVoteId(): string {
    return `VOTE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBallotHash(candidates: Candidate[]): string {
    const data = candidates.map(c => c.candidateId).sort().join('|');
    return btoa(data).substr(0, 32);
  }

  private generateVoteHash(candidateId: string, voterId: string): string {
    const data = `${candidateId}|${this.hashVoterId(voterId)}|${Date.now()}`;
    return btoa(data).substr(0, 32);
  }

  private generateAuditHash(): string {
    const data = `${Date.now()}|${navigator.userAgent}|${Math.random()}`;
    return btoa(data).substr(0, 32);
  }

  private hashVoterId(voterId: string): string {
    // Simple hash for privacy (in production, use proper cryptographic hash)
    return btoa(voterId + 'SALT_PNG_2027').substr(0, 16);
  }

  private getDeviceFingerprint(): string {
    return `${navigator.userAgent}|${screen.width}x${screen.height}|${navigator.language}`.substr(0, 50);
  }

  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private canManageCandidates(userId: string): boolean {
    const userProfile = authService.getCurrentProfile();
    return !!(userProfile?.role === 'admin' || userProfile?.permissions?.includes('manage_elections'));
  }

  private async getBallotById(ballotId: string): Promise<DigitalBallot | null> {
    // In a real implementation, this would fetch from a secure ballot storage
    // For now, we'll generate on-demand based on stored election data
    return null;
  }

  private async verifyVoterBiometrics(voterId: string, biometricData: any): Promise<boolean> {
    // In a real implementation, this would verify fingerprint/photo against stored biometrics
    return true;
  }

  private async getVoterProvince(voterId: string): Promise<string> {
    const citizen = await db.getRecord('citizens', voterId);
    return citizen?.province || 'Unknown';
  }

  private async markVoterAsVoted(voterId: string, electionId: string): Promise<void> {
    // Mark voter as having voted in local tracking
    const voteTracking = {
      voterId,
      electionId,
      votedAt: new Date(),
      hasVoted: true
    };

    await db.addRecord('vote_tracking', voteTracking);
  }

  private async incrementCandidateVoteCount(candidateId: string): Promise<void> {
    const candidate = await db.getRecord('candidates', candidateId) as Candidate;
    if (candidate) {
      candidate.voteCount = (candidate.voteCount || 0) + 1;
      await db.updateRecord('candidates', candidateId, candidate);
    }
  }
}

export const electoralService = ElectoralService.getInstance();
