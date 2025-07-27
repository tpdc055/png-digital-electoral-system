import type { GPSCoordinates } from '../types/citizen';

export interface LocationResult {
  success: boolean;
  coordinates?: GPSCoordinates;
  error?: string;
}

export class GPSService {
  private static instance: GPSService;

  public static getInstance(): GPSService {
    if (!GPSService.instance) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  async getCurrentPosition(): Promise<LocationResult> {
    if (!navigator.geolocation) {
      return {
        success: false,
        error: 'Geolocation is not supported by this browser'
      };
    }

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }

          resolve({
            success: false,
            error: errorMessage
          });
        },
        options
      );
    });
  }

  async watchPosition(
    onPositionUpdate: (coordinates: GPSCoordinates) => void,
    onError?: (error: string) => void
  ): Promise<number> {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported by this browser');
      return -1;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30 seconds
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        onPositionUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        onError?.(errorMessage);
      },
      options
    );
  }

  clearWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  // Helper method to format coordinates for display
  formatCoordinates(coordinates: GPSCoordinates): string {
    return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
  }

  // Helper method to calculate distance between two points (in km)
  calculateDistance(coord1: GPSCoordinates, coord2: GPSCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degree: number): number {
    return degree * (Math.PI / 180);
  }
}

export const gpsService = GPSService.getInstance();
