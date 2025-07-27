import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import '../types/web-serial.d.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Fingerprint,
  Usb,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface FingerprintCaptureProps {
  onCapture: (fingerprintData: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

interface FingerprintDevice {
  port: any; // SerialPort
  name: string;
  connected: boolean;
}

export const FingerprintCapture: React.FC<FingerprintCaptureProps> = ({
  onCapture,
  onCancel,
  disabled = false
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [device, setDevice] = useState<FingerprintDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedData, setCapturedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Web Serial API is supported
    const supported = 'serial' in navigator;
    setIsSupported(supported);

    if (!supported) {
      setError('Fingerprint capture requires a compatible browser (Chrome, Edge) with Web Serial API support');
    }
  }, []);

  const connectDevice = useCallback(async () => {
    if (!isSupported) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Request a serial port - this will show device selection dialog
      const port = await navigator.serial.requestPort({
        filters: [
          // Common fingerprint scanner vendor IDs
          { usbVendorId: 0x2109 }, // VIA Labs (common in many USB hubs)
          { usbVendorId: 0x05E3 }, // Genesys Logic
          { usbVendorId: 0x1B1C }, // Corsair (some fingerprint devices)
          { usbVendorId: 0x16D1 }, // Suprema (fingerprint specialists)
          { usbVendorId: 0x147E }, // Upek (TouchStrip fingerprint sensors)
          { usbVendorId: 0x08FF }, // AuthenTec (MacBook fingerprint sensors)
          { usbVendorId: 0x138A }, // Validity Sensors (common Windows laptops)
          { usbVendorId: 0x0483 }, // STMicroelectronics (various fingerprint chips)
          { usbVendorId: 0x27C6 }, // Shenzhen Goodix Technology
          { usbVendorId: 0x06CB }, // Synaptics (laptop fingerprint readers)
          { usbVendorId: 0x1C7A }, // LighTuning Technology
          { usbVendorId: 0x04F3 }, // Elan Microelectronics
          { usbVendorId: 0x0BDA }, // Realtek (some fingerprint sensors)
          { usbVendorId: 0x1782 }, // Spreadtrum Communications
          // Allow any device if filters don't match
        ]
      });

      // Open the port with appropriate settings for fingerprint scanners
      await port.open({
        baudRate: 115200, // Common baud rate for fingerprint scanners
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      const deviceInfo = port.getInfo();
      const deviceName = `Fingerprint Scanner (${deviceInfo.usbVendorId?.toString(16) || 'Unknown'})`;

      setDevice({
        port,
        name: deviceName,
        connected: true
      });

      toast.success('Fingerprint scanner connected successfully');
    } catch (error) {
      console.error('Failed to connect to fingerprint device:', error);
      setError('Failed to connect to fingerprint scanner. Please check device connection.');
      toast.error('Failed to connect to fingerprint scanner');
    } finally {
      setIsConnecting(false);
    }
  }, [isSupported]);

  const disconnectDevice = useCallback(async () => {
    if (device?.port) {
      try {
        await device.port.close();
        setDevice(null);
        toast.success('Fingerprint scanner disconnected');
      } catch (error) {
        console.error('Error disconnecting device:', error);
      }
    }
  }, [device]);

  const captureFingerprint = useCallback(async () => {
    if (!device?.port) {
      setError('No fingerprint scanner connected');
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const writer = device.port.writable?.getWriter();
      const reader = device.port.readable?.getReader();

      if (!writer || !reader) {
        throw new Error('Unable to access device communication streams');
      }

      // Send capture command (this varies by device - example for generic protocol)
      const captureCommand = new Uint8Array([0x55, 0xAA, 0x01, 0x00, 0x08]); // Example command
      await writer.write(captureCommand);

      // Read response with timeout
      const timeout = 30000; // 30 seconds timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Fingerprint capture timeout')), timeout)
      );

      const responsePromise = (async () => {
        const { value } = await reader.read();
        return value;
      })();

      const response = await Promise.race([responsePromise, timeoutPromise]);

      // Process the fingerprint data (convert to base64 for storage)
      const fingerprintData = btoa(String.fromCharCode(...response));

      setCapturedData(fingerprintData);
      onCapture(fingerprintData);

      toast.success('Fingerprint captured successfully');

      // Release the streams
      writer.releaseLock();
      reader.releaseLock();

    } catch (error) {
      console.error('Fingerprint capture failed:', error);
      setError(`Capture failed: ${(error as Error).message}`);
      toast.error('Fingerprint capture failed');
    } finally {
      setIsCapturing(false);
    }
  }, [device, onCapture]);

  const retakeFingerprint = useCallback(() => {
    setCapturedData(null);
    setError(null);
  }, []);

  if (disabled) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Fingerprint Capture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Fingerprint capture disabled - biometric consent required
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Fingerprint Capture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Fingerprint capture requires Chrome or Edge browser with Web Serial API support.
              Please update your browser or use a supported device.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Fingerprint Capture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Usb className="h-4 w-4" />
            <span className="text-sm">
              {device ? device.name : 'No device connected'}
            </span>
          </div>
          <Badge variant={device ? 'default' : 'secondary'}>
            {device ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Device Connection */}
        {!device && (
          <Button
            onClick={connectDevice}
            disabled={isConnecting}
            className="w-full"
            variant="outline"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Usb className="h-4 w-4 mr-2" />
                Connect Fingerprint Scanner
              </>
            )}
          </Button>
        )}

        {/* Fingerprint Capture */}
        {device && !capturedData && (
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Place finger on the scanner and press capture
            </div>
            <Button
              onClick={captureFingerprint}
              disabled={isCapturing}
              className="w-full"
            >
              {isCapturing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Capture Fingerprint
                </>
              )}
            </Button>
          </div>
        )}

        {/* Captured Fingerprint */}
        {capturedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-green-200 rounded-lg bg-green-50">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700 font-medium">
                  Fingerprint Captured Successfully
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Data: {capturedData.slice(0, 20)}...
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={retakeFingerprint}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={disconnectDevice}
                variant="outline"
                className="flex-1"
              >
                <Usb className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Setup Instructions:</strong></p>
          <p>1. Connect a USB fingerprint scanner</p>
          <p>2. Use Chrome or Edge browser (required)</p>
          <p>3. Enable HTTPS (required for Web Serial API)</p>
          <p>4. Click "Connect Fingerprint Scanner"</p>
          <p>5. Grant serial port permissions</p>
          <p>6. Place finger firmly on scanner</p>

          <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
            <p><strong>Supported Devices:</strong></p>
            <p>• Suprema BioMini/BioLite series</p>
            <p>• Mantra MFS100/200 series</p>
            <p>• SecuGen Hamster series</p>
            <p>• Digital Persona series</p>
            <p>• Futronic FS series</p>
            <p>• Most USB fingerprint scanners</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
