import Dexie, { type Table } from 'dexie';
import type { CitizenData } from '../types/citizen';
import type { Candidate, Election, VoteRecord, DigitalBallot } from '../types/electoral';
import { v4 as uuidv4 } from 'uuid';

export class CitizenDatabase extends Dexie {
  citizens!: Table<CitizenData, string>;
  candidates!: Table<Candidate, string>;
  elections!: Table<Election, string>;
  votes!: Table<VoteRecord, string>;
  ballots!: Table<DigitalBallot, string>;
  vote_tracking!: Table<any, string>;

  constructor() {
    super('PNGElectoralSystemDB');
    this.version(1).stores({
      citizens: '++id, fullName, nationalIdNumber, province, district, synced, createdAt, biometricConsent',
      candidates: '++candidateId, electionId, constituency, fullName, party, status, registrationDate',
      elections: '++electionId, electionName, electionType, status, votingStartDate, votingEndDate',
      votes: '++voteId, ballotId, electionId, constituency, selectedCandidateId, voteTimestamp',
      ballots: '++ballotId, electionId, constituency, voterId, generatedAt, expiresAt',
      vote_tracking: '++id, voterId, electionId, hasVoted, votedAt'
    });
  }

  async addCitizen(citizenData: Omit<CitizenData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const citizen: CitizenData = {
      ...citizenData,
      id,
      createdAt: now,
      updatedAt: now,
      synced: false
    };

    await this.citizens.add(citizen);
    return id;
  }

  async updateCitizen(id: string, updates: Partial<CitizenData>): Promise<void> {
    await this.citizens.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
      synced: false
    });
  }

  async getCitizen(id: string): Promise<CitizenData | undefined> {
    return await this.citizens.get(id);
  }

  async getAllCitizens(): Promise<CitizenData[]> {
    return await this.citizens.orderBy('createdAt').reverse().toArray();
  }

  async getUnsyncedCitizens(): Promise<CitizenData[]> {
    return await this.citizens.filter(citizen => !citizen.synced).toArray();
  }

  async markAsSynced(id: string): Promise<void> {
    await this.citizens.update(id, { synced: true });
  }

  async deleteCitizen(id: string): Promise<void> {
    await this.citizens.delete(id);
  }

  async getCount(): Promise<number> {
    return await this.citizens.count();
  }

  async getUnsyncedCount(): Promise<number> {
    return await this.citizens.filter(citizen => !citizen.synced).count();
  }

  async searchCitizens(query: string): Promise<CitizenData[]> {
    return await this.citizens
      .filter(citizen =>
        citizen.fullName.toLowerCase().includes(query.toLowerCase()) ||
        citizen.nationalIdNumber.includes(query) ||
        citizen.village.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
  }

  async getCitizensByProvince(province: string): Promise<CitizenData[]> {
    return await this.citizens.where('province').equals(province).toArray();
  }

  async getCitizensByDistrict(district: string): Promise<CitizenData[]> {
    return await this.citizens.where('district').equals(district).toArray();
  }

  // Generic methods for electoral data
  async addRecord(tableName: string, record: any): Promise<string> {
    const table = this.table(tableName);
    const id = record.id || record.candidateId || record.electionId || record.voteId || record.ballotId || uuidv4();

    const recordWithId = {
      ...record,
      id,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || new Date().toISOString()
    };

    await table.add(recordWithId);
    return id;
  }

  async updateRecord(tableName: string, id: string, updates: any): Promise<void> {
    const table = this.table(tableName);
    await table.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async getRecord(tableName: string, id: string): Promise<any> {
    const table = this.table(tableName);
    return await table.get(id);
  }

  async getAllRecords(tableName: string): Promise<any[]> {
    const table = this.table(tableName);
    return await table.orderBy('createdAt').reverse().toArray();
  }

  async deleteRecord(tableName: string, id: string): Promise<void> {
    const table = this.table(tableName);
    await table.delete(id);
  }

  async getRecordsByField(tableName: string, field: string, value: any): Promise<any[]> {
    const table = this.table(tableName);
    return await table.where(field).equals(value).toArray();
  }

  async getRecordsCount(tableName: string): Promise<number> {
    const table = this.table(tableName);
    return await table.count();
  }

  // Electoral-specific helper methods
  async getCandidatesByElection(electionId: string): Promise<Candidate[]> {
    return await this.candidates.where('electionId').equals(electionId).toArray();
  }

  async getCandidatesByConstituency(constituency: string, electionId: string): Promise<Candidate[]> {
    return await this.candidates
      .where('constituency').equals(constituency)
      .and(candidate => candidate.electionId === electionId)
      .toArray();
  }

  async getVotesByElection(electionId: string): Promise<VoteRecord[]> {
    return await this.votes.where('electionId').equals(electionId).toArray();
  }

  async getVotesByConstituency(constituency: string, electionId: string): Promise<VoteRecord[]> {
    return await this.votes
      .where('constituency').equals(constituency)
      .and(vote => vote.electionId === electionId)
      .toArray();
  }

  async hasVoterVoted(voterId: string, electionId: string): Promise<boolean> {
    const voteTracking = await this.vote_tracking
      .where('voterId').equals(voterId)
      .and(tracking => tracking.electionId === electionId)
      .first();

    return voteTracking?.hasVoted || false;
  }
}

// Singleton instance
export const db = new CitizenDatabase();
