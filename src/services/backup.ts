import {
  collection,
  doc,
  getDocs,
  addDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db as firestore } from './firebase';
import { db as localDb } from './database';
import type { CitizenData } from '../types/citizen';

export interface BackupMetadata {
  id?: string;
  createdAt: string;
  createdBy: string;
  totalRecords: number;
  provinces: string[];
  fileSize: number;
  version: string;
  checksum: string;
  description?: string;
  type?: string;
  timestamp?: any;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  recordsBackedUp: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  recordsRestored: number;
  duplicatesSkipped: number;
  errors: string[];
}

export class BackupService {
  private static instance: BackupService;

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // Create full system backup
  async createFullBackup(description?: string): Promise<BackupResult> {
    try {
      console.log('Starting full system backup...');

      // Get all citizen records from local database
      const citizens = await localDb.getAllCitizens();

      if (citizens.length === 0) {
        return {
          success: false,
          recordsBackedUp: 0,
          error: 'No citizen records found to backup'
        };
      }

      // Prepare backup data
      const backupData = {
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          createdBy: 'system', // In production, use authenticated user ID
          totalRecords: citizens.length,
          provinces: [...new Set(citizens.map(c => c.province))],
          description: description || `Full backup - ${citizens.length} records`,
          timestamp: serverTimestamp()
        },
        citizens: citizens.map(citizen => ({
          ...citizen,
          // Remove local-only fields for backup
          id: citizen.id,
          localId: citizen.id, // Keep original local ID for reference
          backupTimestamp: new Date().toISOString()
        }))
      };

      // Calculate checksum for data integrity
      const dataString = JSON.stringify(backupData.citizens);
      const checksum = await this.calculateChecksum(dataString);
      (backupData.metadata as any).checksum = checksum;
      (backupData.metadata as any).fileSize = new Blob([dataString]).size;

      // Save backup to Firestore
      const backupsRef = collection(firestore as any, 'backups');
      const backupDoc = await addDoc(backupsRef, backupData);

      console.log(`Backup completed: ${backupDoc.id}`);

      return {
        success: true,
        backupId: backupDoc.id,
        recordsBackedUp: citizens.length
      };

    } catch (error) {
      console.error('Backup failed:', error);
      return {
        success: false,
        recordsBackedUp: 0,
        error: (error as Error).message
      };
    }
  }

  // Create incremental backup (only unsynced records)
  async createIncrementalBackup(description?: string): Promise<BackupResult> {
    try {
      console.log('Starting incremental backup...');

      const unsyncedCitizens = await localDb.getUnsyncedCitizens();

      if (unsyncedCitizens.length === 0) {
        return {
          success: true,
          recordsBackedUp: 0,
          error: 'No unsynced records to backup'
        };
      }

      const backupData = {
        metadata: {
          version: '1.0.0',
          type: 'incremental',
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          totalRecords: unsyncedCitizens.length,
          provinces: [...new Set(unsyncedCitizens.map(c => c.province))],
          description: description || `Incremental backup - ${unsyncedCitizens.length} unsynced records`,
          timestamp: serverTimestamp()
        },
        citizens: unsyncedCitizens
      };

      const dataString = JSON.stringify(backupData.citizens);
      const checksum = await this.calculateChecksum(dataString);
      (backupData.metadata as any).checksum = checksum;
      (backupData.metadata as any).fileSize = new Blob([dataString]).size;

      const backupsRef = collection(firestore as any, 'backups');
      const backupDoc = await addDoc(backupsRef, backupData);

      return {
        success: true,
        backupId: backupDoc.id,
        recordsBackedUp: unsyncedCitizens.length
      };

    } catch (error) {
      console.error('Incremental backup failed:', error);
      return {
        success: false,
        recordsBackedUp: 0,
        error: (error as Error).message
      };
    }
  }

  // Get list of available backups
  async getBackupList(): Promise<BackupMetadata[]> {
    try {
      const backupsRef = collection(firestore as any, 'backups');
      const q = query(backupsRef, orderBy('metadata.createdAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data().metadata
      })) as BackupMetadata[];

    } catch (error) {
      console.error('Failed to get backup list:', error);
      return [];
    }
  }

  // Restore from backup
  async restoreFromBackup(backupId: string, replaceExisting = false): Promise<RestoreResult> {
    try {
      console.log(`Starting restore from backup: ${backupId}`);

      // Get backup data
      const backupRef = doc(firestore as any, 'backups', backupId);
      const backupSnap = await getDocs(query(collection(firestore as any, 'backups')));
      const backupDoc = backupSnap.docs.find(doc => doc.id === backupId);

      if (!backupDoc) {
        throw new Error('Backup not found');
      }

      const backupData = backupDoc.data();
      const citizens: CitizenData[] = backupData.citizens || [];

      if (citizens.length === 0) {
        throw new Error('No citizen data found in backup');
      }

      // Verify checksum
      const dataString = JSON.stringify(citizens);
      const calculatedChecksum = await this.calculateChecksum(dataString);

      if (calculatedChecksum !== backupData.metadata.checksum) {
        throw new Error('Backup data integrity check failed - checksum mismatch');
      }

      let recordsRestored = 0;
      let duplicatesSkipped = 0;
      const errors: string[] = [];

      // Restore each citizen record
      for (const citizen of citizens) {
        try {
          // Check for existing record by National ID
          const existingCitizens = await localDb.searchCitizens(citizen.nationalIdNumber);
          const existingCitizen = existingCitizens.find(c =>
            c.nationalIdNumber === citizen.nationalIdNumber
          );

          if (existingCitizen) {
            if (replaceExisting && existingCitizen.id) {
              // Update existing record
              await localDb.updateCitizen(existingCitizen.id, {
                ...citizen,
                id: existingCitizen.id, // Keep local ID
                restoredAt: new Date().toISOString(),
                restoredFromBackup: backupId
              });
              recordsRestored++;
            } else {
              duplicatesSkipped++;
            }
          } else {
            // Create new record
            const cleanCitizen = {
              ...citizen,
              restoredAt: new Date().toISOString(),
              restoredFromBackup: backupId,
              synced: false // Mark as unsynced since it's restored locally
            };

            // Remove backup-specific fields
            cleanCitizen.localId = undefined;
            cleanCitizen.backupTimestamp = undefined;

            await localDb.addCitizen(cleanCitizen);
            recordsRestored++;
          }
        } catch (error) {
          errors.push(`Failed to restore citizen ${citizen.fullName}: ${(error as Error).message}`);
        }
      }

      console.log(`Restore completed: ${recordsRestored} restored, ${duplicatesSkipped} skipped`);

      return {
        success: true,
        recordsRestored,
        duplicatesSkipped,
        errors
      };

    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        recordsRestored: 0,
        duplicatesSkipped: 0,
        errors: [(error as Error).message]
      };
    }
  }

  // Export backup to downloadable file
  async exportBackupToFile(backupId: string): Promise<void> {
    try {
      const backupRef = doc(firestore as any, 'backups', backupId);
      const backupSnap = await getDocs(query(collection(firestore as any, 'backups')));
      const backupDoc = backupSnap.docs.find(doc => doc.id === backupId);

      if (!backupDoc) {
        throw new Error('Backup not found');
      }

      const backupData = backupDoc.data();

      // Create downloadable file
      const dataBlob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `png-census-backup-${backupId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // Import backup from uploaded file
  async importBackupFromFile(file: File): Promise<RestoreResult> {
    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);

      if (!backupData.citizens || !Array.isArray(backupData.citizens)) {
        throw new Error('Invalid backup file format');
      }

      const citizens: CitizenData[] = backupData.citizens;

      let recordsRestored = 0;
      let duplicatesSkipped = 0;
      const errors: string[] = [];

      for (const citizen of citizens) {
        try {
          const existingCitizens = await localDb.searchCitizens(citizen.nationalIdNumber);
          const existingCitizen = existingCitizens.find(c =>
            c.nationalIdNumber === citizen.nationalIdNumber
          );

          if (!existingCitizen) {
            const cleanCitizen = {
              ...citizen,
              importedAt: new Date().toISOString(),
              importedFromFile: file.name,
              synced: false
            };

            cleanCitizen.id = undefined;
            cleanCitizen.localId = undefined;
            cleanCitizen.backupTimestamp = undefined;

            await localDb.addCitizen(cleanCitizen);
            recordsRestored++;
          } else {
            duplicatesSkipped++;
          }
        } catch (error) {
          errors.push(`Failed to import citizen ${citizen.fullName}: ${(error as Error).message}`);
        }
      }

      return {
        success: true,
        recordsRestored,
        duplicatesSkipped,
        errors
      };

    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        recordsRestored: 0,
        duplicatesSkipped: 0,
        errors: [(error as Error).message]
      };
    }
  }

  // Delete old backups (cleanup)
  async cleanupOldBackups(keepCount = 10): Promise<number> {
    try {
      const backupsRef = collection(firestore as any, 'backups');
      const q = query(backupsRef, orderBy('metadata.createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length <= keepCount) {
        return 0; // No cleanup needed
      }

      const batch = writeBatch(firestore as any);
      const docsToDelete = querySnapshot.docs.slice(keepCount);

      for (const doc of docsToDelete) {
        batch.delete(doc.ref);
      }

      await batch.commit();
      return docsToDelete.length;

    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }

  // Calculate checksum for data integrity
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Schedule automatic backups
  startAutomaticBackup(intervalHours = 24): void {
    setInterval(async () => {
      console.log('Running automatic backup...');
      const result = await this.createIncrementalBackup('Automatic backup');

      if (result.success) {
        console.log(`Automatic backup completed: ${result.recordsBackedUp} records`);
      } else {
        console.error('Automatic backup failed:', result.error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }
}

export const backupService = BackupService.getInstance();
