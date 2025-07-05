import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { toast } from 'sonner';

// Web Authentication API types
interface CredentialCreationOptions {
  publicKey: PublicKeyCredentialCreationOptions;
}

interface CredentialRequestOptions {
  publicKey: PublicKeyCredentialRequestOptions;
}

// Mock biometric auth types for consistent interface
interface BiometricAuthResponse {
  isSuccessful: boolean;
  errorMessage?: string;
}

interface BiometricAuthOptions {
  reason: string;
  title: string;
  subtitle?: string;
  description?: string;
  fallbackTitle?: string;
  negativeButtonTitle?: string;
}

// Types for PNG Electoral Biometric System
export interface BiometricData {
  fingerprints: FingerprintData[];
  faceData?: FaceData;
  voiceprint?: VoiceprintData;
  createdAt: Date;
  lastVerified: Date;
  deviceInfo: DeviceInfo;
  encryptionKey: string;
}

export interface FingerprintData {
  id: string;
  finger: FingerType;
  template: string; // Encrypted biometric template
  quality: number; // 0-100 quality score
  minutiae: MinutiaePoint[];
  capturedAt: Date;
  deviceId: string;
  verificationCount: number;
}

export interface MinutiaePoint {
  x: number;
  y: number;
  angle: number;
  type: 'ridge_ending' | 'bifurcation';
  quality: number;
}

export type FingerType =
  | 'right_thumb' | 'right_index' | 'right_middle' | 'right_ring' | 'right_little'
  | 'left_thumb' | 'left_index' | 'left_middle' | 'left_ring' | 'left_little';

export interface FaceData {
  id: string;
  template: string;
  landmarks: FaceLandmark[];
  quality: number;
  capturedAt: Date;
}

export interface FaceLandmark {
  point: string;
  x: number;
  y: number;
  confidence: number;
}

export interface VoiceprintData {
  id: string;
  template: string;
  features: number[];
  quality: number;
  capturedAt: Date;
}

export interface DeviceInfo {
  deviceId: string;
  model: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  sensorCapabilities: string[];
}

export interface BiometricVerificationResult {
  success: boolean;
  confidence: number;
  matchedTemplates: string[];
  verificationTime: number;
  deviceInfo: DeviceInfo;
  timestamp: Date;
  errorMessage?: string;
}

export interface ElectoralBiometricConfig {
  minQualityScore: number;
  maxAttempts: number;
  duplicateThreshold: number;
  encryptionEnabled: boolean;
  offlineCapable: boolean;
  auditTrailEnabled: boolean;
  pngComplianceMode: boolean;
}

class BiometricService {
  private static instance: BiometricService;
  private config: ElectoralBiometricConfig;
  private deviceInfo: DeviceInfo | null = null;
  private encryptionKey: string | null = null;

  private constructor() {
    this.config = {
      minQualityScore: 75, // PNG Electoral Commission standard
      maxAttempts: 3,
      duplicateThreshold: 85, // 85% similarity = duplicate
      encryptionEnabled: true,
      offlineCapable: true,
      auditTrailEnabled: true,
      pngComplianceMode: true
    };
  }

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  // Initialize biometric system
  async initialize(): Promise<boolean> {
    try {
      console.log('🔍 Initializing PNG Electoral Biometric System...');

      // Get device information
      this.deviceInfo = await this.getDeviceInfo();

      // Initialize encryption
      await this.initializeEncryption();

      // Check biometric capabilities
      const capabilities = await this.checkBiometricCapabilities();

      if (!capabilities.available) {
        throw new Error('Biometric authentication not available on this device');
      }

      console.log('✅ PNG Electoral Biometric System initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize biometric system:', error);
      return false;
    }
  }

  // Check device biometric capabilities
  async checkBiometricCapabilities(): Promise<{
    available: boolean;
    fingerprint: boolean;
    face: boolean;
    voice: boolean;
    sensors: string[];
    strongBiometric: boolean;
  }> {
    try {
      // Check for Web Authentication API (WebAuthn) support
      const webAuthnSupported = 'credentials' in navigator && 'create' in navigator.credentials;

      let result;
      if (webAuthnSupported) {
        // Check if platform authenticator is available (built-in biometrics)
        const platformAuthenticatorAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        result = {
          isAvailable: platformAuthenticatorAvailable,
          biometryType: 'biometricAuthentication',
          strongBiometryIsAvailable: platformAuthenticatorAvailable
        };
      } else {
        // Fallback for non-WebAuthn environments
        const deviceInfo = await Device.getInfo();
        const isMobile = deviceInfo.platform === 'android' || deviceInfo.platform === 'ios';
        result = {
          isAvailable: isMobile,
          biometryType: 'fingerprintAuthentication',
          strongBiometryIsAvailable: isMobile
        };
      }

      return {
        available: result.isAvailable,
        fingerprint: result.biometryType === 'fingerprintAuthentication' || result.biometryType === 'biometricAuthentication',
        face: result.biometryType === 'faceAuthentication' || result.biometryType === 'biometricAuthentication',
        voice: false, // Not supported by current plugin
        sensors: result.biometryType ? [result.biometryType] : [],
        strongBiometric: result.strongBiometryIsAvailable || false
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        available: false,
        fingerprint: false,
        face: false,
        voice: false,
        sensors: [],
        strongBiometric: false
      };
    }
  }

  // Capture voter fingerprints for registration
  async captureVoterFingerprints(
    citizenId: string,
    requiredFingers: FingerType[] = ['right_index', 'right_thumb']
  ): Promise<FingerprintData[]> {
    try {
      console.log('🔍 Starting fingerprint capture for voter:', citizenId);

      const fingerprints: FingerprintData[] = [];

      for (const finger of requiredFingers) {
        toast.info(`Place your ${finger.replace('_', ' ')} on the sensor`);

        // Haptic feedback
        await this.hapticFeedback('light');

        const fingerprintData = await this.captureSingleFingerprint(finger);

        if (fingerprintData.quality >= this.config.minQualityScore) {
          fingerprints.push(fingerprintData);
          toast.success(`${finger.replace('_', ' ')} captured successfully`);
        } else {
          toast.error(`${finger.replace('_', ' ')} quality too low, please retry`);
          throw new Error(`Fingerprint quality below threshold: ${fingerprintData.quality}`);
        }
      }

      // Store fingerprints securely
      await this.storeBiometricData(citizenId, { fingerprints });

      console.log('✅ Voter fingerprints captured successfully');
      return fingerprints;

    } catch (error) {
      console.error('❌ Failed to capture voter fingerprints:', error);
      throw error;
    }
  }

  // Verify voter identity using fingerprint
  async verifyVoterIdentity(citizenId?: string): Promise<BiometricVerificationResult> {
    const startTime = Date.now();

    try {
      console.log('🔍 Starting voter verification...');

      // Haptic feedback
      await this.hapticFeedback('medium');

      const options: BiometricAuthOptions = {
        reason: 'Verify your identity to access the PNG Digital Voting Booth',
        title: 'PNG Electoral Verification',
        subtitle: 'Place your finger on the sensor',
        description: 'This biometric verification is required for secure voting in PNG elections',
        fallbackTitle: 'Use PIN',
        negativeButtonTitle: 'Cancel'
      };

      const result: BiometricAuthResponse = await this.performBiometricAuthentication(options);

      if (result.isSuccessful) {
        // If specific citizen ID provided, verify against stored biometrics
        if (citizenId) {
          const storedBiometric = await this.getBiometricData(citizenId);
          if (storedBiometric) {
            // Perform template matching (simulated for demo)
            const confidence = await this.matchBiometricTemplates(result, storedBiometric);

            if (confidence >= this.config.duplicateThreshold) {
              await this.hapticFeedback('success');
              return {
                success: true,
                confidence,
                matchedTemplates: storedBiometric.fingerprints.map(f => f.id),
                verificationTime: Date.now() - startTime,
                deviceInfo: this.deviceInfo!,
                timestamp: new Date()
              };
            }
          }
        }

        // Generic verification successful
        await this.hapticFeedback('success');
        return {
          success: true,
          confidence: 95, // High confidence for demo
          matchedTemplates: ['demo_template'],
          verificationTime: Date.now() - startTime,
          deviceInfo: this.deviceInfo!,
          timestamp: new Date()
        };
      } else {
        await this.hapticFeedback('error');
        return {
          success: false,
          confidence: 0,
          matchedTemplates: [],
          verificationTime: Date.now() - startTime,
          deviceInfo: this.deviceInfo!,
          timestamp: new Date(),
          errorMessage: result.errorMessage || 'Biometric verification failed'
        };
      }

    } catch (error) {
      console.error('❌ Biometric verification failed:', error);
      await this.hapticFeedback('error');

      return {
        success: false,
        confidence: 0,
        matchedTemplates: [],
        verificationTime: Date.now() - startTime,
        deviceInfo: this.deviceInfo!,
        timestamp: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check for duplicate voter registration
  async checkDuplicateVoter(newFingerprints: FingerprintData[]): Promise<{
    isDuplicate: boolean;
    matchedCitizenId?: string;
    confidence: number;
  }> {
    try {
      console.log('🔍 Checking for duplicate voter registration...');

      // Get all stored biometric data
      const allVoters = await this.getAllBiometricData();

      for (const [citizenId, biometricData] of allVoters.entries()) {
        for (const storedFingerprint of biometricData.fingerprints) {
          for (const newFingerprint of newFingerprints) {
            const similarity = await this.compareFingerprints(storedFingerprint, newFingerprint);

            if (similarity >= this.config.duplicateThreshold) {
              return {
                isDuplicate: true,
                matchedCitizenId: citizenId,
                confidence: similarity
              };
            }
          }
        }
      }

      return {
        isDuplicate: false,
        confidence: 0
      };

    } catch (error) {
      console.error('Error checking duplicate voter:', error);
      return {
        isDuplicate: false,
        confidence: 0
      };
    }
  }

  // Private helper methods

  private async performBiometricAuthentication(options: BiometricAuthOptions): Promise<BiometricAuthResponse> {
    try {
      // Check for Web Authentication API support
      const webAuthnSupported = 'credentials' in navigator && 'create' in navigator.credentials;

      if (webAuthnSupported) {
        return await this.performWebAuthnAuthentication(options);
      } else {
        // Fallback for demo/development mode
        return await this.performFallbackAuthentication(options);
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        isSuccessful: false,
        errorMessage: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private async performWebAuthnAuthentication(options: BiometricAuthOptions): Promise<BiometricAuthResponse> {
    try {
      // Create a credential request for biometric authentication
      const credentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: new Uint8Array(32), // Random challenge
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required', // Require biometric verification
          timeout: 60000
        }
      };

      // Show user-friendly prompt
      toast.info(options.reason || 'Please authenticate using your device biometrics');

      const credential = await navigator.credentials.get(credentialRequestOptions);

      if (credential) {
        return {
          isSuccessful: true
        };
      } else {
        return {
          isSuccessful: false,
          errorMessage: 'Authentication cancelled or failed'
        };
      }
    } catch (error) {
      console.error('WebAuthn authentication failed:', error);

      // If WebAuthn fails, fall back to demo mode
      if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
        return await this.performFallbackAuthentication(options);
      }

      return {
        isSuccessful: false,
        errorMessage: 'Biometric authentication not available'
      };
    }
  }

  private async performFallbackAuthentication(options: BiometricAuthOptions): Promise<BiometricAuthResponse> {
    // Demo/fallback authentication - simulate user interaction
    return new Promise((resolve) => {
      const userConfirmed = confirm(`${options.title}\n\n${options.reason}\n\nSimulated biometric authentication - Click OK to proceed or Cancel to abort.`);

      setTimeout(() => {
        resolve({
          isSuccessful: userConfirmed
        });
      }, 1000); // Simulate authentication delay
    });
  }

  private async captureSingleFingerprint(finger: FingerType): Promise<FingerprintData> {
    // In a real implementation, this would interface with the fingerprint sensor
    // For demo, we simulate fingerprint capture

    const options: BiometricAuthOptions = {
      reason: `Capture your ${finger.replace('_', ' ')} for voter registration`,
      title: 'PNG Voter Registration',
      subtitle: `Place your ${finger.replace('_', ' ')} on the sensor`,
      description: 'Hold steady until capture is complete',
      fallbackTitle: 'Skip',
      negativeButtonTitle: 'Cancel'
    };

    const result = await this.performBiometricAuthentication(options);

    if (!result.isSuccessful) {
      throw new Error('Fingerprint capture failed or cancelled');
    }

    // Generate mock fingerprint data (in production, this would be real biometric data)
    return {
      id: `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      finger,
      template: await this.encryptData(`mock_template_${finger}_${Date.now()}`),
      quality: Math.floor(Math.random() * 25) + 75, // 75-100 quality
      minutiae: this.generateMockMinutiae(),
      capturedAt: new Date(),
      deviceId: this.deviceInfo?.deviceId || 'unknown',
      verificationCount: 0
    };
  }

  private generateMockMinutiae(): MinutiaePoint[] {
    const minutiae: MinutiaePoint[] = [];
    const count = Math.floor(Math.random() * 20) + 30; // 30-50 minutiae points

    for (let i = 0; i < count; i++) {
      minutiae.push({
        x: Math.floor(Math.random() * 300),
        y: Math.floor(Math.random() * 400),
        angle: Math.floor(Math.random() * 360),
        type: Math.random() > 0.5 ? 'ridge_ending' : 'bifurcation',
        quality: Math.floor(Math.random() * 30) + 70
      });
    }

    return minutiae;
  }

  private async compareFingerprints(fp1: FingerprintData, fp2: FingerprintData): Promise<number> {
    // In a real implementation, this would perform actual biometric template matching
    // For demo, we simulate similarity based on finger type and timing

    if (fp1.finger !== fp2.finger) {
      return 0; // Different fingers can't match
    }

    // Simulate template matching algorithm
    const timeDiff = Math.abs(fp1.capturedAt.getTime() - fp2.capturedAt.getTime());
    const baseScore = 80;
    const penalty = Math.min(timeDiff / (1000 * 60 * 60), 10); // Penalty for time difference

    return Math.max(0, baseScore - penalty + Math.random() * 10);
  }

  private async matchBiometricTemplates(
    authResult: BiometricAuthResponse,
    storedBiometric: BiometricData
  ): Promise<number> {
    // Simulate biometric template matching
    // In production, this would use the actual biometric templates
    return Math.floor(Math.random() * 20) + 80; // 80-100% confidence
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceInfo = await Device.getInfo();

    return {
      deviceId: (deviceInfo as any).webViewVersion || `${deviceInfo.platform}_${Date.now()}`,
      model: deviceInfo.model,
      platform: deviceInfo.platform,
      osVersion: deviceInfo.osVersion,
      appVersion: '1.0.0',
      sensorCapabilities: ['fingerprint', 'face'] // Would be detected dynamically
    };
  }

  private async initializeEncryption(): Promise<void> {
    // Initialize encryption key for biometric data
    let storedKey = await Preferences.get({ key: 'biometric_encryption_key' });

    if (!storedKey.value) {
      // Generate new encryption key
      this.encryptionKey = await this.generateEncryptionKey();
      await Preferences.set({
        key: 'biometric_encryption_key',
        value: this.encryptionKey
      });
    } else {
      this.encryptionKey = storedKey.value;
    }
  }

  private async generateEncryptionKey(): Promise<string> {
    // Generate a secure encryption key
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async encryptData(data: string): Promise<string> {
    // Simple encryption for demo (use proper encryption in production)
    if (!this.config.encryptionEnabled || !this.encryptionKey) {
      return data;
    }

    return btoa(data + this.encryptionKey);
  }

  private async decryptData(encryptedData: string): Promise<string> {
    // Simple decryption for demo
    if (!this.config.encryptionEnabled || !this.encryptionKey) {
      return encryptedData;
    }

    const decrypted = atob(encryptedData);
    return decrypted.replace(this.encryptionKey, '');
  }

  private async storeBiometricData(citizenId: string, biometricData: Partial<BiometricData>): Promise<void> {
    const key = `biometric_${citizenId}`;
    const data = {
      ...biometricData,
      createdAt: new Date(),
      lastVerified: new Date(),
      deviceInfo: this.deviceInfo,
      encryptionKey: this.encryptionKey
    };

    await Preferences.set({
      key,
      value: JSON.stringify(data)
    });
  }

  private async getBiometricData(citizenId: string): Promise<BiometricData | null> {
    const key = `biometric_${citizenId}`;
    const result = await Preferences.get({ key });

    if (result.value) {
      return JSON.parse(result.value);
    }

    return null;
  }

  private async getAllBiometricData(): Promise<Map<string, BiometricData>> {
    const allData = new Map<string, BiometricData>();

    // In a real implementation, this would query the secure storage
    // For demo, we return empty map
    return allData;
  }

  private async hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): Promise<void> {
    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
        case 'error':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          // Double tap for success
          await Haptics.impact({ style: ImpactStyle.Light });
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 100);
          break;
      }
    } catch (error) {
      // Haptics not available, silently fail
    }
  }

  // Public utility methods

  public async clearAllBiometricData(): Promise<void> {
    // Only allow in demo mode
    if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
      console.log('🧹 Clearing all biometric data (demo mode)');
      // Implementation would clear all stored biometric data
    }
  }

  public getConfig(): ElectoralBiometricConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ElectoralBiometricConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // PNG Electoral Commission compliance methods

  public async generateComplianceReport(): Promise<{
    totalVotersRegistered: number;
    biometricDataIntegrity: boolean;
    encryptionStatus: boolean;
    lastAuditDate: Date;
    deviceCompliance: boolean;
  }> {
    return {
      totalVotersRegistered: 0, // Would count actual registrations
      biometricDataIntegrity: true,
      encryptionStatus: this.config.encryptionEnabled,
      lastAuditDate: new Date(),
      deviceCompliance: true
    };
  }

  public async auditBiometricAccess(action: string, citizenId?: string): Promise<void> {
    if (this.config.auditTrailEnabled) {
      const auditEntry = {
        timestamp: new Date(),
        action,
        citizenId,
        deviceInfo: this.deviceInfo,
        success: true
      };

      console.log('📋 Biometric audit:', auditEntry);
      // In production, this would be stored securely
    }
  }
}

export const biometricService = BiometricService.getInstance();
