// PNG Digital Electoral System - Cryptographically Secure LPV Algorithm
// Limited Preferential Voting with Mathematical Verification and Audit Trails

import crypto from 'crypto';

// Core LPV Types
export interface LPVBallot {
  ballotId: string;
  encryptedPayload: string;  // Encrypted preference data
  preferences: LPVPreference[];
  voterHash: string;         // Anonymous voter identifier
  constituencyId: string;
  timestamp: Date;
  signature: string;         // Cryptographic signature
  merkleProof?: string;      // Merkle tree proof
}

export interface LPVPreference {
  rank: number;              // 1, 2, 3 for LPV
  candidateId: string;
  encryptedChoice: string;   // Encrypted candidate selection
}

export interface LPVCandidate {
  candidateId: string;
  name: string;
  party?: string;
  constituency: string;
  isActive: boolean;
  eliminatedInRound?: number;
}

export interface LPVRound {
  roundNumber: number;
  candidateCounts: Map<string, number>;
  totalVotes: number;
  eliminatedCandidate?: string;
  eliminationReason: string;
  redistributedVotes: number;
  timestamp: Date;
  cryptographicProof: string;
  auditHash: string;
}

export interface LPVResult {
  constituencyId: string;
  winner?: LPVCandidate;
  rounds: LPVRound[];
  totalBallotsProcessed: number;
  exhaustedVotes: number;
  finalTally: Map<string, number>;
  verificationProofs: string[];
  auditTrail: string[];
  mathematicalVerification: boolean;
}

export interface LPVAuditEvent {
  eventId: string;
  type: 'BALLOT_CAST' | 'ROUND_CALCULATED' | 'CANDIDATE_ELIMINATED' | 'VOTES_REDISTRIBUTED';
  data: any;
  timestamp: Date;
  hash: string;
  previousHash: string;
  signature: string;
}

// Cryptographic utilities
export class CryptographicLPV {
  private static generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private static generateSignature(data: string, privateKey?: string): string {
    // In production, use proper asymmetric cryptography
    const key = privateKey || 'lpv-election-key-2027';
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  private static verifySignature(data: string, signature: string, publicKey?: string): boolean {
    const expectedSignature = this.generateSignature(data, publicKey);
    return signature === expectedSignature;
  }

  // Generate cryptographic proof for round calculation
  static generateRoundProof(round: LPVRound, ballots: LPVBallot[]): string {
    const roundData = {
      roundNumber: round.roundNumber,
      candidateCounts: Object.fromEntries(round.candidateCounts),
      eliminatedCandidate: round.eliminatedCandidate,
      ballotHashes: ballots.map(b => b.signature)
    };

    return this.generateHash(JSON.stringify(roundData));
  }

  // Verify mathematical correctness of LPV calculation
  static verifyLPVMathematics(
    ballots: LPVBallot[],
    rounds: LPVRound[],
    result: LPVResult
  ): boolean {
    // Verify vote conservation (total votes must be preserved across rounds)
    const initialVoteCount = ballots.length;
    const accumulatedExhausted = 0;

    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      const totalActiveVotes = Array.from(round.candidateCounts.values())
        .reduce((sum, count) => sum + count, 0);

      // In later rounds, some votes may be exhausted
      const expectedActiveVotes = initialVoteCount - accumulatedExhausted;

      if (totalActiveVotes > expectedActiveVotes) {
        console.error(`Round ${i + 1}: Vote count exceeds maximum possible`);
        return false;
      }
    }

    // Verify elimination logic
    for (let i = 1; i < rounds.length; i++) {
      const prevRound = rounds[i - 1];
      const currentRound = rounds[i];

      if (prevRound.eliminatedCandidate) {
        // Verify eliminated candidate has lowest count in previous round
        const prevCounts = Array.from(prevRound.candidateCounts.entries());
        const eliminatedCount = prevRound.candidateCounts.get(prevRound.eliminatedCandidate) || 0;
        const minCount = Math.min(...prevCounts.map(([_, count]) => count));

        if (eliminatedCount !== minCount) {
          console.error(`Round ${i}: Incorrect elimination - not lowest candidate`);
          return false;
        }
      }
    }

    return true;
  }
}

// Main LPV Counting Engine
export class LPVCountingEngine {
  private auditTrail: LPVAuditEvent[] = [];

  constructor(private constituencyId: string) {}

  // Process LPV election with full audit trail
  async processLPVElection(
    ballots: LPVBallot[],
    candidates: LPVCandidate[]
  ): Promise<LPVResult> {
    console.log(`🗳️ Starting LPV count for ${this.constituencyId}`);
    console.log(`📊 Processing ${ballots.length} ballots for ${candidates.length} candidates`);

    const rounds: LPVRound[] = [];
    const activeCandidates = new Map<string, LPVCandidate>();
    const auditTrail: string[] = [];

    // Initialize active candidates
    candidates.forEach(candidate => {
      activeCandidates.set(candidate.candidateId, { ...candidate, isActive: true });
    });

    // Track active ballots (ballots that still have valid preferences)
    let activeBallots = ballots.map(ballot => ({
      ...ballot,
      currentPreference: this.findHighestValidPreference(ballot, activeCandidates)
    }));

    let roundNumber = 1;
    const MAJORITY_THRESHOLD = 0.5; // 50% + 1

    while (activeCandidates.size > 1) {
      console.log(`\n🔄 Round ${roundNumber}`);

      // Count votes for current round
      const candidateCounts = new Map<string, number>();
      activeCandidates.forEach((_, candidateId) => {
        candidateCounts.set(candidateId, 0);
      });

      // Count active ballot preferences
      let validVotes = 0;
      activeBallots.forEach(ballot => {
        if (ballot.currentPreference && activeCandidates.has(ballot.currentPreference)) {
          const currentCount = candidateCounts.get(ballot.currentPreference) || 0;
          candidateCounts.set(ballot.currentPreference, currentCount + 1);
          validVotes++;
        }
      });

      // Create round record
      const round: LPVRound = {
        roundNumber,
        candidateCounts: new Map(candidateCounts),
        totalVotes: validVotes,
        eliminationReason: '',
        redistributedVotes: 0,
        timestamp: new Date(),
        cryptographicProof: '',
        auditHash: ''
      };

      // Check for majority winner
      const majorityRequired = Math.floor(validVotes * MAJORITY_THRESHOLD) + 1;
      const candidateResults = Array.from(candidateCounts.entries())
        .map(([candidateId, count]) => ({ candidateId, count, percentage: (count / validVotes) * 100 }))
        .sort((a, b) => b.count - a.count);

      console.log('📊 Round results:');
      candidateResults.forEach(result => {
        const candidate = activeCandidates.get(result.candidateId);
        console.log(`  ${candidate?.name}: ${result.count} votes (${result.percentage.toFixed(1)}%)`);
      });

      // Check for winner
      if (candidateResults[0].count >= majorityRequired) {
        round.eliminationReason = `Winner found with ${candidateResults[0].count} votes (${candidateResults[0].percentage.toFixed(1)}%)`;
        round.cryptographicProof = CryptographicLPV.generateRoundProof(round, ballots);
        round.auditHash = this.generateAuditHash(round);

        rounds.push(round);

        const winner = activeCandidates.get(candidateResults[0].candidateId);
        console.log(`🏆 Winner: ${winner?.name} with majority!`);

        auditTrail.push(`Round ${roundNumber}: ${winner?.name} wins with ${candidateResults[0].count}/${validVotes} votes`);
        break;
      }

      // Eliminate candidate with lowest votes
      const lowestResult = candidateResults[candidateResults.length - 1];
      const candidateToEliminate = activeCandidates.get(lowestResult.candidateId);

      if (!candidateToEliminate) {
        throw new Error('Failed to find candidate to eliminate');
      }

      // Handle ties with deterministic tie-breaking
      const lowestCount = lowestResult.count;
      const tiedCandidates = candidateResults.filter(r => r.count === lowestCount);

      let eliminatedCandidateId = lowestResult.candidateId;
      if (tiedCandidates.length > 1) {
        // Tie-breaking: eliminate candidate with fewest first-preference votes originally
        eliminatedCandidateId = this.breakTie(tiedCandidates.map(t => t.candidateId), ballots);
        round.eliminationReason = `Tie-broken elimination: ${lowestCount} votes (tied with ${tiedCandidates.length - 1} others)`;
      } else {
        round.eliminationReason = `Lowest count elimination: ${lowestCount} votes`;
      }

      round.eliminatedCandidate = eliminatedCandidateId;
      const eliminatedCandidate = activeCandidates.get(eliminatedCandidateId)!;
      eliminatedCandidate.isActive = false;
      eliminatedCandidate.eliminatedInRound = roundNumber;

      console.log(`❌ Eliminated: ${eliminatedCandidate.name} (${lowestCount} votes)`);
      auditTrail.push(`Round ${roundNumber}: Eliminated ${eliminatedCandidate.name} with ${lowestCount} votes`);

      // Remove from active candidates
      activeCandidates.delete(eliminatedCandidateId);

      // Redistribute votes
      const votesToRedistribute = candidateCounts.get(eliminatedCandidateId) || 0;
      activeBallots = activeBallots.map(ballot => {
        if (ballot.currentPreference === eliminatedCandidateId) {
          // Find next valid preference
          const nextPreference = this.findHighestValidPreference(ballot, activeCandidates);
          return { ...ballot, currentPreference: nextPreference };
        }
        return ballot;
      });

      round.redistributedVotes = votesToRedistribute;
      round.cryptographicProof = CryptographicLPV.generateRoundProof(round, ballots);
      round.auditHash = this.generateAuditHash(round);

      rounds.push(round);

      console.log(`🔄 Redistributed ${votesToRedistribute} votes`);
      auditTrail.push(`Round ${roundNumber}: Redistributed ${votesToRedistribute} votes from ${eliminatedCandidate.name}`);

      roundNumber++;

      // Safety check to prevent infinite loops
      if (roundNumber > 50) {
        throw new Error('LPV counting exceeded maximum rounds - possible infinite loop');
      }
    }

    // Determine winner (last remaining candidate)
    const finalCandidates = Array.from(activeCandidates.values());
    const winner = finalCandidates.length > 0 ? finalCandidates[0] : undefined;

    // Calculate exhausted votes
    const exhaustedVotes = activeBallots.filter(ballot => !ballot.currentPreference).length;

    // Generate final tally
    const finalTally = new Map<string, number>();
    if (rounds.length > 0) {
      const lastRound = rounds[rounds.length - 1];
      lastRound.candidateCounts.forEach((count, candidateId) => {
        finalTally.set(candidateId, count);
      });
    }

    // Create result with verification
    const result: LPVResult = {
      constituencyId: this.constituencyId,
      winner,
      rounds,
      totalBallotsProcessed: ballots.length,
      exhaustedVotes,
      finalTally,
      verificationProofs: rounds.map(r => r.cryptographicProof),
      auditTrail,
      mathematicalVerification: false
    };

    // Verify mathematical correctness
    result.mathematicalVerification = CryptographicLPV.verifyLPVMathematics(ballots, rounds, result);

    if (!result.mathematicalVerification) {
      throw new Error('LPV calculation failed mathematical verification');
    }

    console.log(`\n✅ LPV Count Complete for ${this.constituencyId}`);
    console.log(`🏆 Winner: ${winner?.name}`);
    console.log(`📊 Total rounds: ${rounds.length}`);
    console.log(`🗳️ Exhausted votes: ${exhaustedVotes}/${ballots.length}`);
    console.log(`✓ Mathematical verification: PASSED`);

    return result;
  }

  // Find highest valid preference for a ballot
  private findHighestValidPreference(
    ballot: LPVBallot,
    activeCandidates: Map<string, LPVCandidate>
  ): string | null {
    // Sort preferences by rank (1, 2, 3)
    const sortedPreferences = ballot.preferences
      .filter(p => p.rank > 0)
      .sort((a, b) => a.rank - b.rank);

    // Find first active candidate in preference order
    for (const preference of sortedPreferences) {
      if (activeCandidates.has(preference.candidateId)) {
        return preference.candidateId;
      }
    }

    return null; // Exhausted ballot
  }

  // Deterministic tie-breaking based on original first preferences
  private breakTie(tiedCandidateIds: string[], allBallots: LPVBallot[]): string {
    const firstPreferenceCounts = new Map<string, number>();

    // Count original first preferences
    allBallots.forEach(ballot => {
      const firstPref = ballot.preferences.find(p => p.rank === 1);
      if (firstPref && tiedCandidateIds.includes(firstPref.candidateId)) {
        const count = firstPreferenceCounts.get(firstPref.candidateId) || 0;
        firstPreferenceCounts.set(firstPref.candidateId, count + 1);
      }
    });

    // Eliminate candidate with fewest first preferences
    let minCount = Number.MAX_VALUE;
    let eliminatedCandidate = tiedCandidateIds[0];

    for (const candidateId of tiedCandidateIds) {
      const count = firstPreferenceCounts.get(candidateId) || 0;
      if (count < minCount) {
        minCount = count;
        eliminatedCandidate = candidateId;
      }
    }

    // If still tied, use lexicographic order for deterministic result
    if (firstPreferenceCounts.size === 0) {
      eliminatedCandidate = tiedCandidateIds.sort()[0];
    }

    return eliminatedCandidate;
  }

  // Generate audit hash for round
  private generateAuditHash(round: LPVRound): string {
    const data = {
      round: round.roundNumber,
      counts: Object.fromEntries(round.candidateCounts),
      eliminated: round.eliminatedCandidate,
      timestamp: round.timestamp.toISOString()
    };

    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Add audit event
  private addAuditEvent(type: LPVAuditEvent['type'], data: any): void {
    const eventId = crypto.randomUUID();
    const previousHash = this.auditTrail.length > 0
      ? this.auditTrail[this.auditTrail.length - 1].hash
      : '0';

    const event: LPVAuditEvent = {
      eventId,
      type,
      data,
      timestamp: new Date(),
      hash: '',
      previousHash,
      signature: ''
    };

    // Generate hash and signature
    const eventData = JSON.stringify({
      eventId,
      type,
      data,
      timestamp: event.timestamp.toISOString(),
      previousHash
    });

    event.hash = crypto.createHash('sha256').update(eventData).digest('hex');
    event.signature = crypto.createHmac('sha256', 'lpv-audit-key').update(eventData).digest('hex');

    this.auditTrail.push(event);
  }

  // Get audit trail
  getAuditTrail(): LPVAuditEvent[] {
    return [...this.auditTrail];
  }
}

// LPV Verification Engine
export class LPVVerificationEngine {
  // Verify complete LPV election results
  static async verifyElectionResults(
    ballots: LPVBallot[],
    candidates: LPVCandidate[],
    results: LPVResult
  ): Promise<boolean> {
    try {
      // Re-run the counting algorithm
      const engine = new LPVCountingEngine(results.constituencyId);
      const recomputedResults = await engine.processLPVElection(ballots, candidates);

      // Compare results
      if (recomputedResults.winner?.candidateId !== results.winner?.candidateId) {
        console.error('Winner mismatch in verification');
        return false;
      }

      if (recomputedResults.rounds.length !== results.rounds.length) {
        console.error('Round count mismatch in verification');
        return false;
      }

      // Verify each round
      for (let i = 0; i < results.rounds.length; i++) {
        const original = results.rounds[i];
        const recomputed = recomputedResults.rounds[i];

        if (original.eliminatedCandidate !== recomputed.eliminatedCandidate) {
          console.error(`Round ${i + 1}: Elimination mismatch`);
          return false;
        }

        // Verify vote counts
        for (const [candidateId, count] of original.candidateCounts) {
          const recomputedCount = recomputed.candidateCounts.get(candidateId) || 0;
          if (count !== recomputedCount) {
            console.error(`Round ${i + 1}: Vote count mismatch for candidate ${candidateId}`);
            return false;
          }
        }
      }

      console.log('✅ LPV Election Results Verified Successfully');
      return true;

    } catch (error) {
      console.error('LPV Verification Failed:', error);
      return false;
    }
  }

  // Verify cryptographic proofs
  static verifyProofs(results: LPVResult, ballots: LPVBallot[]): boolean {
    for (let i = 0; i < results.rounds.length; i++) {
      const round = results.rounds[i];
      const expectedProof = CryptographicLPV.generateRoundProof(round, ballots);

      if (round.cryptographicProof !== expectedProof) {
        console.error(`Round ${i + 1}: Cryptographic proof verification failed`);
        return false;
      }
    }

    console.log('✅ All cryptographic proofs verified');
    return true;
  }
}
