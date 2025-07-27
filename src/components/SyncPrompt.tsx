import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CloudDownload,
  CloudUpload,
  RefreshCw,
  CheckCircle,
  X,
  AlertTriangle,
  Wifi
} from 'lucide-react';
import { toast } from 'sonner';

import { networkService, type NetworkStatus } from '../services/network';
import { db } from '../services/database';

interface SyncPromptProps {
  onSyncComplete?: () => void;
}

export const SyncPrompt: React.FC<SyncPromptProps> = ({ onSyncComplete }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    networkService.getNetworkStatus()
  );
  const [showPrompt, setShowPrompt] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [hasCloudUpdates, setHasCloudUpdates] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkForSyncNeeds = useCallback(async () => {
    try {
      // Check unsynced local records
      const count = await db.getUnsyncedCount();
      setUnsyncedCount(count);

      // Check for cloud updates
      const hasUpdates = await networkService.checkForCloudUpdates();
      setHasCloudUpdates(hasUpdates);

      // Show prompt if there are unsynced records or cloud updates
      setShowPrompt(count > 0 || hasUpdates);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error checking sync needs:', error);
    }
  }, []);

  useEffect(() => {
    const handleNetworkChange = async (status: NetworkStatus) => {
      setNetworkStatus(status);

      if (status.isOnline && status.cloudConnected) {
        await checkForSyncNeeds();
      } else {
        setShowPrompt(false);
      }
    };

    // Listen for network changes
    networkService.addNetworkListener(handleNetworkChange);

    // Initial check
    if (networkStatus.isOnline && networkStatus.cloudConnected) {
      checkForSyncNeeds();
    }

    return () => {
      networkService.removeNetworkListener(handleNetworkChange);
    };
  }, [checkForSyncNeeds, networkStatus.isOnline, networkStatus.cloudConnected]);

  const handleSyncUp = async () => {
    setIsSyncing(true);
    try {
      const result = await networkService.syncUnsyncedData();

      if (result.success > 0) {
        toast.success(`Successfully uploaded ${result.success} records to cloud`);
        setUnsyncedCount(0);
        onSyncComplete?.();
      }

      if (result.failed > 0) {
        toast.error(`Failed to upload ${result.failed} records`);
      }
    } catch (error) {
      toast.error(`Upload failed: ${(error as Error).message}`);
    } finally {
      setIsSyncing(false);
      await checkForSyncNeeds();
    }
  };

  const handleSyncDown = async () => {
    setIsSyncing(true);
    try {
      const result = await networkService.performCloudSync();

      if (result.success > 0) {
        toast.success(`Successfully synced ${result.success} records`);
        setHasCloudUpdates(false);
        onSyncComplete?.();
      }

      if (result.failed > 0) {
        toast.warning(`${result.failed} records had sync issues`);
      }
    } catch (error) {
      toast.error(`Sync failed: ${(error as Error).message}`);
    } finally {
      setIsSyncing(false);
      await checkForSyncNeeds();
    }
  };

  const handleFullSync = async () => {
    setIsSyncing(true);
    try {
      const result = await networkService.performCloudSync();

      toast.success(`Sync completed: ${result.success} records processed`);

      if (result.errors.length > 0) {
        console.error('Sync errors:', result.errors);
        toast.warning(`Some records had sync issues (${result.errors.length})`);
      }

      setUnsyncedCount(0);
      setHasCloudUpdates(false);
      onSyncComplete?.();
    } catch (error) {
      toast.error(`Full sync failed: ${(error as Error).message}`);
    } finally {
      setIsSyncing(false);
      await checkForSyncNeeds();
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  // Don't show if offline or no cloud connection
  if (!networkStatus.isOnline || !networkStatus.cloudConnected || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 right-4 z-40 max-w-lg mx-auto">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-800">
              <Wifi className="h-5 w-5" />
              Cloud Sync Available
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissPrompt}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Status Information */}
          <div className="text-sm text-blue-700">
            {unsyncedCount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{unsyncedCount} local records need uploading</span>
              </div>
            )}
            {hasCloudUpdates && (
              <div className="flex items-center gap-2 mb-2">
                <CloudDownload className="h-4 w-4" />
                <span>New updates available from cloud</span>
              </div>
            )}
            {lastCheck && (
              <div className="text-xs text-blue-600">
                Last checked: {lastCheck.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {unsyncedCount > 0 && (
              <Button
                onClick={handleSyncUp}
                disabled={isSyncing}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudUpload className="h-4 w-4 mr-2" />
                )}
                Upload ({unsyncedCount})
              </Button>
            )}

            {hasCloudUpdates && (
              <Button
                onClick={handleSyncDown}
                disabled={isSyncing}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudDownload className="h-4 w-4 mr-2" />
                )}
                Download
              </Button>
            )}

            <Button
              onClick={handleFullSync}
              disabled={isSyncing}
              size="sm"
              className="flex-1"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync All
            </Button>
          </div>

          {/* Auto-sync note */}
          <div className="text-xs text-blue-600 text-center">
            Sync happens automatically when online. This prompt appears when updates are detected.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
