import type React from 'react';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, Database } from 'lucide-react';
import { toast } from 'sonner';

import { networkService, type NetworkStatus } from '../services/network';
import { db } from '../services/database';

export const OfflineIndicator: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    networkService.getNetworkStatus()
  );
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isForceSync, setIsForceSync] = useState(false);

  useEffect(() => {
    const updateUnsyncedCount = async () => {
      const count = await db.getUnsyncedCount();
      setUnsyncedCount(count);
    };

    const handleNetworkChange = (status: NetworkStatus) => {
      setNetworkStatus(status);
      updateUnsyncedCount();
    };

    // Initial count
    updateUnsyncedCount();

    // Listen for network changes
    networkService.addNetworkListener(handleNetworkChange);

    // Periodic update of unsynced count
    const interval = setInterval(updateUnsyncedCount, 5000);

    return () => {
      networkService.removeNetworkListener(handleNetworkChange);
      clearInterval(interval);
    };
  }, []);

  const handleForceSync = async () => {
    if (!networkStatus.isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setIsForceSync(true);
    try {
      const result = await networkService.forceSyncAll();
      toast.success(`Sync completed: ${result.success} synced, ${result.failed} failed`);

      // Update unsynced count
      const count = await db.getUnsyncedCount();
      setUnsyncedCount(count);
    } catch (error) {
      toast.error(`Sync failed: ${(error as Error).message}`);
    } finally {
      setIsForceSync(false);
    }
  };

  if (networkStatus.isOnline && networkStatus.cloudConnected && unsyncedCount === 0) {
    return null; // Don't show anything when online with cloud and fully synced
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert className={`${
        networkStatus.isOnline
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {networkStatus.isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <AlertDescription className="font-medium">
              {networkStatus.isOnline
                ? networkStatus.cloudConnected
                  ? `Cloud Connected - ${unsyncedCount} records pending sync`
                  : `Online (No Cloud) - ${unsyncedCount} records stored locally`
                : `Offline Mode - ${unsyncedCount} records stored locally`
              }
            </AlertDescription>
          </div>

          {networkStatus.isOnline && networkStatus.cloudConnected && unsyncedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceSync}
              disabled={isForceSync || networkService.isSyncInProgress()}
              className="ml-2 h-7 px-2 text-xs"
            >
              {isForceSync || networkService.isSyncInProgress() ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Database className="h-3 w-3 mr-1" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
};
