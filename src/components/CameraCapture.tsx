import type React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, RotateCcw, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  disabled = false
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setCameraError(null);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('Camera access error:', error);
    setCameraError('Unable to access camera. Please check permissions.');
  }, []);

  if (disabled) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Capture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Photo capture disabled - biometric consent required
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Photo Capture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cameraError ? (
          <div className="text-center text-red-600 p-4 border border-red-200 rounded">
            {cameraError}
          </div>
        ) : capturedImage ? (
          <div className="space-y-4">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-lg border"
            />
            <div className="flex gap-2">
              <Button
                onClick={retake}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={() => {}}
                className="flex-1"
                disabled
              >
                <Check className="h-4 w-4 mr-2" />
                Saved
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                onUserMediaError={handleUserMediaError}
                mirrored={true}
              />
            </div>
            <Button
              onClick={capture}
              className="w-full"
              disabled={isCapturing}
            >
              <Camera className="h-4 w-4 mr-2" />
              {isCapturing ? 'Capturing...' : 'Take Photo'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
