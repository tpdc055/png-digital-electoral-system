import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Wifi, WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showOfflineAlert) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline && (
        <Alert className="bg-red-50 border-red-200 max-w-sm">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                Offline
              </Badge>
              <span className="text-sm">
                Working in offline mode. Data will sync when connection is restored.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isOnline && showOfflineAlert && (
        <Alert className="bg-green-50 border-green-200 max-w-sm">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600 text-xs">
                Online
              </Badge>
              <span className="text-sm">
                Connection restored. Syncing data...
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
