// PNG Digital Electoral System - Enhanced Electoral Service
// Supports candidate-citizen verification and Limited Preferential Voting (LPV)

import type {
  Candidate,
  Election,
  DigitalBallot,
  VoteRecord,
  VoterEligibility,
  EnhancedCandidate,
  CandidateCitizenLink,
  LPVBallot,
  LPVVote,
  LPVVoteRecord
} from '../types/electoral';
import type { CitizenData } from '../types/citizen';

class ElectoralService {
  private static instance: ElectoralService;

  public static getInstance(): ElectoralService {
    if (!ElectoralService.instance) {
      ElectoralService.instance = new ElectoralService();
    }
    return ElectoralService.instance;
  }

  // Enhanced Candidate Management with Citizen Verification
  async registerCandidate(candidate: EnhancedCandidate): Promise<string> {
    try {
      // Save candidate to localStorage (in production, would be cloud database)
      const candidates = await this.getCandidates();
      candidates.push(candidate);
      localStorage.setItem('png-candidates', JSON.stringify(candidates));

      console.log(`Enhanced candidate registered: ${candidate.fullName} with citizen verification`);
      return candidate.candidateId;
    } catch (error) {
      console.error('Error registering enhanced candidate:', error);
      throw new Error('Failed to register candidate');
    }
  }

  async getCandidates(): Promise<EnhancedCandidate[]> {
    try {
      const stored = localStorage.getItem('png-candidates');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading candidates:', error);
      return [];
    }
  }

  async getCandidateById(candidateId: string): Promise<EnhancedCandidate | null> {
    const candidates = await this.getCandidates();
    return candidates.find(c => c.candidateId === candidateId) || null;
  }

  async getCandidatesByConstituency(constituency: string, electionId?: string): Promise<EnhancedCandidate[]> {
    const candidates = await this.getCandidates();
    return candidates.filter(c =>
      c.constituency === constituency &&
      (!electionId || c.electionId === electionId) &&
      c.status === 'approved'
    );
  }

  // Citizen-Candidate Verification
  async verifyCandidateCitizenLink(candidateId: string, citizenId: string): Promise<boolean> {
    const candidate = await this.getCandidateById(candidateId);
    if (!candidate?.citizenLink) return false;

    return candidate.citizenLink.citizenId === citizenId &&
           candidate.citizenLink.verificationStatus === 'verified';
  }

  async updateCandidateVerificationStatus(
    candidateId: string,
    status: 'pending' | 'verified' | 'rejected',
    verifiedBy?: string
  ): Promise<void> {
    const candidates = await this.getCandidates();
    const candidateIndex = candidates.findIndex(c => c.candidateId === candidateId);

    if (candidateIndex >= 0) {
      const candidate = candidates[candidateIndex];
      if (candidate.citizenLink) {
        candidate.citizenLink.verificationStatus = status;
        candidate.citizenLink.verifiedBy = verifiedBy;
        candidate.citizenLink.verifiedAt = status === 'verified' ? new Date() : undefined;
      }

      localStorage.setItem('png-candidates', JSON.stringify(candidates));
    }
  }

  // LPV Ballot Generation
  async generateLPVBallot(
    electionId: string,
    constituency: string,
    voterId: string
  ): Promise<LPVBallot> {
    try {
      const candidates = await this.getCandidatesByConstituency(constituency, electionId);
      const election = await this.getElectionById(electionId);

      if (!election) {
        throw new Error('Election not found');
      }

      if (candidates.length === 0) {
        throw new Error('No approved candidates found for this constituency');
      }

      const ballot: LPVBallot = {
        ballotId: `lpv-ballot-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        electionId,
        constituency,
        voterId,
        ballotTitle: `${election.electionName} - ${constituency}`,
        ballotInstructions: {
          text: 'Select your 1st, 2nd, and 3rd choice candidates using Limited Preferential Voting',
          languages: {
            english: 'Select your 1st, 2nd, and 3rd choice candidates using Limited Preferential Voting',
            tokPisin: 'Makim namba 1, namba 2, na namba 3 kandidet bilong yu long LPV sistem',
            hiriMotu: 'Gagarai-na namba tanu, namba rua, na namba toru kandideti-na LPV sistema-hamo'
          }
        },
        candidates,
        votingMethod: 'lpv',
        maxPreferences: 3,
        requiresAllPreferences: false,
        accessibilityFeatures: {
          largeText: true,
          highContrast: true,
          audioAssistance: true,
          touchOptimized: true,
          screenReader: true
        },
        ballotHash: this.generateBallotHash(candidates, voterId),
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };

      return ballot;
    } catch (error) {
      console.error('Error generating LPV ballot:', error);
      throw error;
    }
  }

  // LPV Vote Processing
  async castLPVVote(
    ballotId: string,
    lpvVote: LPVVote,
    voterData: {
      voterIdHash: string;
      constituency: string;
      province: string;
      biometricVerified?: boolean;
      gpsLocation?: { latitude: number; longitude: number; accuracy: number };
    }
  ): Promise<LPVVoteRecord> {
    try {
      // Validate LPV vote
      if (!lpvVote.firstChoice) {
        throw new Error('First choice is required for LPV voting');
      }

      // Ensure no duplicate choices
      const choices = Object.values(lpvVote).filter(Boolean);
      if (new Set(choices).size !== choices.length) {
        throw new Error('Duplicate candidate selections are not allowed');
      }

      // Create vote record
      const voteRecord: LPVVoteRecord = {
        voteId: `lpv-vote-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        ballotId,
        electionId: 'election-2027', // Would come from ballot
        constituency: voterData.constituency,
        voterIdHash: voterData.voterIdHash,
        voterConstituency: voterData.constituency,
        voterProvince: voterData.province,
        lpvVote,
        preferencesCount: Object.values(lpvVote).filter(Boolean).length,
        voteTimestamp: new Date(),
        biometricVerified: voterData.biometricVerified || false,
        deviceFingerprint: `device-${Date.now()}`,
        gpsLocation: voterData.gpsLocation,
        voteHash: this.generateVoteHash(lpvVote, voterData.voterIdHash),
        status: 'vote_cast',
        castingDevice: 'digital-voting-booth',
        networkInfo: navigator.userAgent,
        auditHash: this.generateAuditHash(ballotId, lpvVote)
      };

      // Store vote record
      await this.saveVoteRecord(voteRecord);

      // Update candidate vote counts
      await this.updateCandidateVoteCounts(lpvVote);

      console.log(`LPV vote cast successfully: ${voteRecord.voteId}`);
      return voteRecord;

    } catch (error) {
      console.error('Error casting LPV vote:', error);
      throw error;
    }
  }

  // LPV Results Calculation
  async calculateLPVResults(electionId: string, constituency: string): Promise<{
    candidates: EnhancedCandidate[];
    rounds: Array<{
      round: number;
      candidates: Array<{
        candidateId: string;
        name: string;
        votes: number;
        percentage: number;
        eliminated?: boolean;
      }>;
      eliminated?: string;
    }>;
    winner?: EnhancedCandidate;
  }> {
    try {
      const votes = await this.getLPVVotes(electionId, constituency);
      const candidates = await this.getCandidatesByConstituency(constituency, electionId);

      // LPV counting algorithm
      const results = this.processLPVCount(votes, candidates);
      return results;

    } catch (error) {
      console.error('Error calculating LPV results:', error);
      throw error;
    }
  }

  private processLPVCount(
    votes: LPVVoteRecord[],
    candidates: EnhancedCandidate[]
  ): {
    candidates: EnhancedCandidate[];
    rounds: Array<{
      round: number;
      candidates: Array<{
        candidateId: string;
        name: string;
        votes: number;
        percentage: number;
        eliminated?: boolean;
      }>;
      eliminated?: string;
    }>;
    winner?: EnhancedCandidate;
  } {
    const rounds: any[] = [];
    let remainingCandidates = [...candidates];
    let activeVotes = votes.map(vote => ({ ...vote, currentChoice: vote.lpvVote.firstChoice }));

    let round = 1;

    while (remainingCandidates.length > 1) {
      // Count votes for current round
      const voteCounts = new Map<string, number>();
      remainingCandidates.forEach(c => voteCounts.set(c.candidateId, 0));

      activeVotes.forEach(vote => {
        if (vote.currentChoice && voteCounts.has(vote.currentChoice)) {
          voteCounts.set(vote.currentChoice, (voteCounts.get(vote.currentChoice) || 0) + 1);
        }
      });

      const totalVotes = Array.from(voteCounts.values()).reduce((sum, count) => sum + count, 0);

      // Check for absolute majority (>50%)
      const candidateResults = remainingCandidates.map(candidate => ({
        candidateId: candidate.candidateId,
        name: candidate.fullName,
        votes: voteCounts.get(candidate.candidateId) || 0,
        percentage: totalVotes > 0 ? ((voteCounts.get(candidate.candidateId) || 0) / totalVotes) * 100 : 0
      }));

      const majorityWinner = candidateResults.find(c => c.percentage > 50);

      rounds.push({
        round,
        candidates: candidateResults
      });

      if (majorityWinner) {
        // Winner found
        const winner = remainingCandidates.find(c => c.candidateId === majorityWinner.candidateId);
        return {
          candidates,
          rounds,
          winner
        };
      }

      // Eliminate candidate with lowest votes
      const lowestVoteCount = Math.min(...candidateResults.map(c => c.votes));
      const candidateToEliminate = candidateResults.find(c => c.votes === lowestVoteCount);

      if (candidateToEliminate) {
        // Remove eliminated candidate
        remainingCandidates = remainingCandidates.filter(c => c.candidateId !== candidateToEliminate.candidateId);

        // Transfer votes to next preference
        activeVotes = activeVotes.map(vote => {
          if (vote.currentChoice === candidateToEliminate.candidateId) {
            // Find next valid preference
            if (vote.lpvVote.secondChoice && remainingCandidates.some(c => c.candidateId === vote.lpvVote.secondChoice)) {
              return { ...vote, currentChoice: vote.lpvVote.secondChoice };
            } else if (vote.lpvVote.thirdChoice && remainingCandidates.some(c => c.candidateId === vote.lpvVote.thirdChoice)) {
              return { ...vote, currentChoice: vote.lpvVote.thirdChoice };
            } else {
              return { ...vote, currentChoice: '' }; // Exhausted vote
            }
          }
          return vote;
        });

        rounds[rounds.length - 1].eliminated = candidateToEliminate.candidateId;
      }

      round++;
    }

    // Last remaining candidate wins
    const winner = remainingCandidates[0];
    return {
      candidates,
      rounds,
      winner
    };
  }

  // Utility methods
  private generateBallotHash(candidates: EnhancedCandidate[], voterId: string): string {
    const data = candidates.map(c => c.candidateId).join(',') + voterId + Date.now();
    return btoa(data).substring(0, 16);
  }

  private generateVoteHash(lpvVote: LPVVote, voterIdHash: string): string {
    const data = Object.values(lpvVote).filter(Boolean).join(',') + voterIdHash + Date.now();
    return btoa(data).substring(0, 16);
  }

  private generateAuditHash(ballotId: string, lpvVote: LPVVote): string {
    const data = ballotId + JSON.stringify(lpvVote) + Date.now();
    return btoa(data).substring(0, 16);
  }

  private async saveVoteRecord(voteRecord: LPVVoteRecord): Promise<void> {
    try {
      const votes = this.getStoredVotes();
      votes.push(voteRecord);
      localStorage.setItem('png-lpv-votes', JSON.stringify(votes));
    } catch (error) {
      console.error('Error saving vote record:', error);
      throw error;
    }
  }

  private getStoredVotes(): LPVVoteRecord[] {
    try {
      const stored = localStorage.getItem('png-lpv-votes');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading stored votes:', error);
      return [];
    }
  }

  private async getLPVVotes(electionId: string, constituency: string): Promise<LPVVoteRecord[]> {
    const allVotes = this.getStoredVotes();
    return allVotes.filter(vote =>
      vote.electionId === electionId &&
      vote.constituency === constituency
    );
  }

  private async updateCandidateVoteCounts(lpvVote: LPVVote): Promise<void> {
    // Update first preference counts for candidates
    const candidates = await this.getCandidates();
    const candidateIndex = candidates.findIndex(c => c.candidateId === lpvVote.firstChoice);

    if (candidateIndex >= 0) {
      candidates[candidateIndex].voteCount = (candidates[candidateIndex].voteCount || 0) + 1;
      localStorage.setItem('png-candidates', JSON.stringify(candidates));
    }
  }

  // Election Management
  async getActiveElections(): Promise<Election[]> {
    try {
      const stored = localStorage.getItem('png-elections');
      const elections = stored ? JSON.parse(stored) : [];
      return elections.filter((e: Election) => e.status === 'registration_open' || e.status === 'voting_open');
    } catch (error) {
      console.error('Error loading elections:', error);
      return [];
    }
  }

  async getElectionById(electionId: string): Promise<Election | null> {
    try {
      const stored = localStorage.getItem('png-elections');
      const elections = stored ? JSON.parse(stored) : [];
      return elections.find((e: Election) => e.electionId === electionId) || null;
    } catch (error) {
      console.error('Error loading election:', error);
      return null;
    }
  }

  async checkVoterEligibility(voterId: string, electionId: string, constituency: string): Promise<VoterEligibility> {
    // Mock implementation for demo
    return {
      voterId,
      electionId,
      nationalIdNumber: `PNG${voterId.slice(-6)}`,
      birthRegistryId: `BR${voterId.slice(-6)}`,
      biometricVerified: false,
      isEligible: true,
      ageEligible: true,
      citizenshipVerified: true,
      mentallySoundCertified: true,
      notDisqualified: true,
      constituencyOfOrigin: constituency,
      canVoteAtCurrentLocation: true,
      hasVotedInThisElection: false,
      voteHistory: [],
      registrationStatus: 'verified',
      registrationDate: new Date(),
      verifiedBy: 'system',
      documentsProvided: ['nationalId', 'photo', 'fingerprint']
    };
  }
}

export const electoralService = ElectoralService.getInstance();
export default electoralService;
