import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db as firestore } from './firebase';
import type { CitizenData } from '../types/citizen';
import { db as localDb } from './database';

export interface CloudSyncResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface SyncConflict {
  localCitizen: CitizenData;
  cloudCitizen: Partial<CitizenData>;
  conflictType: 'UPDATE_CONFLICT' | 'DELETE_CONFLICT';
}

export class CloudSyncService {
  private static instance: CloudSyncService;
  private syncInProgress = false;
  private conflictResolver: ((conflicts: SyncConflict[]) => Promise<void>) | null = null;

  public static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  // Set up real-time listener for cloud changes
  setupRealtimeSync(onDataChanged: (action: string, data: Partial<CitizenData>) => void) {
    const citizensRef = collection(firestore as any, 'citizens');

    return onSnapshot(citizensRef, (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const data = { id: change.doc.id, ...change.doc.data() };

        if (change.type === 'added') {
          onDataChanged('added', data);
        } else if (change.type === 'modified') {
          onDataChanged('modified', data);
        } else if (change.type === 'removed') {
          onDataChanged('removed', data);
        }
      }
    });
  }

  // Upload unsynced citizens to Firestore
  async syncToCloud(): Promise<CloudSyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    const result: CloudSyncResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      const unsyncedCitizens = await localDb.getUnsyncedCitizens();

      if (unsyncedCitizens.length === 0) {
        return result;
      }

      const batch = writeBatch(firestore as any);
      const citizensRef = collection(firestore as any, 'citizens');

      for (const citizen of unsyncedCitizens) {
        try {
          // Prepare data for Firestore (remove local-only fields)
          const cloudData = {
            ...citizen,
            cloudSyncedAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          };

          // Remove local-only fields
          const { id, synced, ...cleanCloudData } = cloudData;

          // Check if citizen already exists in cloud (by nationalIdNumber)
          const existingQuery = query(
            citizensRef,
            where('nationalIdNumber', '==', citizen.nationalIdNumber)
          );
          const existingDocs = await getDocs(existingQuery);

          if (existingDocs.empty) {
            // Create new document
            const newDocRef = doc(citizensRef);
            batch.set(newDocRef, cleanCloudData);

            // Update local record with cloud ID
            if (citizen.id) {
              await localDb.updateCitizen(citizen.id, {
                cloudId: newDocRef.id,
                synced: true
              });
            }
          } else {
            // Update existing document
            const existingDoc = existingDocs.docs[0];
            batch.update(existingDoc.ref, cleanCloudData);

            // Update local record
            if (citizen.id) {
              await localDb.updateCitizen(citizen.id, {
                cloudId: existingDoc.id,
                synced: true
              });
            }
          }

          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to sync ${citizen.fullName}: ${(error as Error).message}`);
          console.error('Error syncing citizen:', error);
        }
      }

      // Commit the batch
      await batch.commit();

    } catch (error) {
      result.errors.push(`Batch sync failed: ${(error as Error).message}`);
      console.error('Cloud sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  // Download citizens from cloud and merge with local data
  async syncFromCloud(): Promise<CloudSyncResult> {
    const result: CloudSyncResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      const citizensRef = collection(firestore as any, 'citizens');
      const q = query(citizensRef, orderBy('lastUpdated', 'desc'));
      const querySnapshot = await getDocs(q);

      for (const docSnapshot of querySnapshot.docs) {
        try {
          const cloudData = { id: docSnapshot.id, ...docSnapshot.data() } as any;

          // Convert Firestore timestamps to ISO strings
          if (cloudData.cloudSyncedAt instanceof Timestamp) {
            cloudData.cloudSyncedAt = cloudData.cloudSyncedAt.toDate().toISOString();
          }
          if (cloudData.lastUpdated instanceof Timestamp) {
            cloudData.lastUpdated = cloudData.lastUpdated.toDate().toISOString();
          }

          // Check if citizen exists locally
          const existingCitizens = await localDb.searchCitizens(cloudData.nationalIdNumber);
          const existingCitizen = existingCitizens.find(c => c.nationalIdNumber === cloudData.nationalIdNumber);

          if (existingCitizen?.id) {
            // Update existing local record
            await localDb.updateCitizen(existingCitizen.id, {
              ...cloudData,
              id: existingCitizen.id,
              cloudId: docSnapshot.id,
              synced: true
            });
          } else {
            // Create new local record
            await localDb.addCitizen({
              ...cloudData,
              cloudId: docSnapshot.id,
              synced: true
            });
          }

          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to sync citizen from cloud: ${(error as Error).message}`);
          console.error('Error syncing from cloud:', error);
        }
      }
    } catch (error) {
      result.errors.push(`Cloud download failed: ${(error as Error).message}`);
      console.error('Cloud sync from failed:', error);
    }

    return result;
  }

  // Bidirectional sync
  async performFullSync(): Promise<CloudSyncResult> {
    const uploadResult = await this.syncToCloud();
    const downloadResult = await this.syncFromCloud();

    return {
      success: uploadResult.success + downloadResult.success,
      failed: uploadResult.failed + downloadResult.failed,
      errors: [...uploadResult.errors, ...downloadResult.errors]
    };
  }

  // Check if cloud has newer data
  async hasCloudUpdates(): Promise<boolean> {
    try {
      const citizensRef = collection(firestore as any, 'citizens');
      const q = query(citizensRef, orderBy('lastUpdated', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return false;

      // Get latest cloud timestamp
      const latestDoc = snapshot.docs[0];
      const latestCloudUpdate = latestDoc.data().lastUpdated;

      // Compare with local sync timestamp
      const lastSyncTime = localStorage.getItem('lastCloudSyncTime');
      if (!lastSyncTime) return true;

      const cloudTime = latestCloudUpdate instanceof Timestamp
        ? latestCloudUpdate.toDate().getTime()
        : new Date(latestCloudUpdate).getTime();

      return cloudTime > new Date(lastSyncTime).getTime();
    } catch (error) {
      console.error('Error checking cloud updates:', error);
      return false;
    }
  }

  // Update last sync timestamp
  updateLastSyncTime(): void {
    localStorage.setItem('lastCloudSyncTime', new Date().toISOString());
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  // Test cloud connection
  async testConnection(): Promise<boolean> {
    try {
      const testRef = collection(firestore as any, 'connection-test');
      await getDocs(testRef);
      return true;
    } catch (error) {
      console.error('Cloud connection test failed:', error);
      return false;
    }
  }
}

export const cloudSyncService = CloudSyncService.getInstance();
