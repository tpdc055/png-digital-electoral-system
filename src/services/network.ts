import { CitizenData } from '../types/citizen';
import { db } from './database';
import { cloudSyncService, type CloudSyncResult } from './cloudSync';

export interface NetworkStatus {
  isOnline: boolean;
  lastOnlineTime?: Date;
  cloudConnected?: boolean;
}

export class NetworkService {
  private static instance: NetworkService;
  private networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    cloudConnected: false
  };
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private syncInProgress = false;
  private cloudConnectionCheckInterval: NodeJS.Timeout | null = null;

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  constructor() {
    this.setupEventListeners();
    this.startCloudConnectionCheck();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private async handleOnline(): Promise<void> {
    this.networkStatus = {
      isOnline: true,
      lastOnlineTime: new Date()
    };

    // Test cloud connection
    const cloudConnected = await cloudSyncService.testConnection();
    this.networkStatus.cloudConnected = cloudConnected;

    this.notifyListeners();

    // Auto-sync when coming back online (if cloud is available)
    if (cloudConnected) {
      this.performCloudSync();
    }
  }

  private handleOffline(): void {
    this.networkStatus = {
      ...this.networkStatus,
      isOnline: false,
      cloudConnected: false
    };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.networkStatus);
    }
  }

  private startCloudConnectionCheck(): void {
    // Check cloud connection every 30 seconds when online
    this.cloudConnectionCheckInterval = setInterval(async () => {
      if (this.networkStatus.isOnline) {
        const cloudConnected = await cloudSyncService.testConnection();
        if (cloudConnected !== this.networkStatus.cloudConnected) {
          this.networkStatus.cloudConnected = cloudConnected;
          this.notifyListeners();
        }
      }
    }, 30000);
  }

  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  public addNetworkListener(listener: (status: NetworkStatus) => void): void {
    this.listeners.push(listener);
  }

  public removeNetworkListener(listener: (status: NetworkStatus) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Enhanced sync with real cloud database
  public async syncUnsyncedData(): Promise<CloudSyncResult> {
    if (!this.networkStatus.isOnline || !this.networkStatus.cloudConnected || this.syncInProgress) {
      throw new Error('Cannot sync: offline or cloud unavailable');
    }

    this.syncInProgress = true;

    try {
      const result = await cloudSyncService.syncToCloud();

      if (result.success > 0) {
        cloudSyncService.updateLastSyncTime();
        console.log(`Successfully synced ${result.success} citizens to cloud`);
      }

      if (result.errors.length > 0) {
        console.error('Sync errors:', result.errors);
      }

      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Perform full bidirectional sync
  public async performCloudSync(): Promise<CloudSyncResult> {
    if (!this.networkStatus.isOnline || !this.networkStatus.cloudConnected || this.syncInProgress) {
      throw new Error('Cannot sync: offline or cloud unavailable');
    }

    this.syncInProgress = true;

    try {
      const result = await cloudSyncService.performFullSync();

      if (result.success > 0) {
        cloudSyncService.updateLastSyncTime();
        console.log(`Cloud sync completed: ${result.success} records processed`);
      }

      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Check if cloud has updates and prompt user
  public async checkForCloudUpdates(): Promise<boolean> {
    if (!this.networkStatus.isOnline || !this.networkStatus.cloudConnected) {
      return false;
    }

    try {
      return await cloudSyncService.hasCloudUpdates();
    } catch (error) {
      console.error('Error checking cloud updates:', error);
      return false;
    }
  }

  // Legacy method for backward compatibility (now uses real cloud sync)
  public async forceSyncAll(): Promise<{ success: number; failed: number }> {
    try {
      const result = await this.performCloudSync();
      return {
        success: result.success,
        failed: result.failed
      };
    } catch (error) {
      console.error('Force sync failed:', error);
      return { success: 0, failed: 0 };
    }
  }

  public isSyncInProgress(): boolean {
    return this.syncInProgress || cloudSyncService.isSyncInProgress();
  }

  public isCloudAvailable(): boolean {
    return this.networkStatus.isOnline && this.networkStatus.cloudConnected === true;
  }

  public cleanup(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));

    if (this.cloudConnectionCheckInterval) {
      clearInterval(this.cloudConnectionCheckInterval);
    }

    this.listeners = [];
  }
}

export const networkService = NetworkService.getInstance();
