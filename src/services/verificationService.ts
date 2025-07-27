// PNG Digital Electoral System - Community Verification Service
// Manages community leaders (Pastors/Councilors) and verification settings

import type { VerifierData, VerificationSettings, VerificationSession, VerifierRole } from '../types/citizen';

class VerificationService {
  private static instance: VerificationService;
  private settings: VerificationSettings = {
    verificationRequired: true,
    allowUnverifiedRegistration: true,
    requireVerifierFingerprint: true,
    verifierRoles: ['Pastor', 'Councilor', 'Admin']
  };

  public static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  constructor() {
    this.loadSettings();
  }

  // Settings Management
  public getSettings(): VerificationSettings {
    return { ...this.settings };
  }

  public async updateSettings(newSettings: Partial<VerificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    console.log('Verification settings updated:', this.settings);
  }

  public isVerificationRequired(): boolean {
    return this.settings.verificationRequired;
  }

  public canRegisterWithoutVerification(): boolean {
    return this.settings.allowUnverifiedRegistration;
  }

  public isVerifierFingerprintRequired(): boolean {
    return this.settings.requireVerifierFingerprint;
  }

  // Verifier Management
  public async registerVerifier(verifierData: Omit<VerifierData, 'id' | 'createdAt' | 'updatedAt' | 'synced' | 'verificationsPerformed'>): Promise<string> {
    const id = `verifier-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const verifier: VerifierData = {
      ...verifierData,
      id,
      verificationsPerformed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    await this.saveVerifier(verifier);
    console.log(`Verifier registered: ${verifier.fullName} (${verifier.role})`);
    return id;
  }

  public async getVerifiers(): Promise<VerifierData[]> {
    try {
      const stored = localStorage.getItem('png-verifiers');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading verifiers:', error);
      return [];
    }
  }

  public async getActiveVerifiers(): Promise<VerifierData[]> {
    const verifiers = await this.getVerifiers();
    return verifiers.filter(v => v.isActive);
  }

  public async getVerifiersByRole(role: VerifierRole): Promise<VerifierData[]> {
    const verifiers = await this.getActiveVerifiers();
    return verifiers.filter(v => v.role === role);
  }

  public async getVerifierById(id: string): Promise<VerifierData | null> {
    const verifiers = await this.getVerifiers();
    return verifiers.find(v => v.id === id) || null;
  }

  public async verifyVerifierFingerprint(verifierId: string, fingerprint: string): Promise<boolean> {
    const verifier = await this.getVerifierById(verifierId);
    if (!verifier || !verifier.fingerprint) {
      return false;
    }

    // Simple fingerprint comparison (in production, use proper biometric matching)
    return verifier.fingerprint === fingerprint;
  }

  // Verification Process
  public async performVerification(
    citizenId: string,
    verifierId: string,
    verifierFingerprint?: string
  ): Promise<VerificationSession> {
    const verifier = await this.getVerifierById(verifierId);
    if (!verifier) {
      throw new Error('Verifier not found');
    }

    if (!verifier.isActive) {
      throw new Error('Verifier is not active');
    }

    // Check fingerprint if required
    if (this.settings.requireVerifierFingerprint && verifierFingerprint) {
      const fingerprintValid = await this.verifyVerifierFingerprint(verifierId, verifierFingerprint);
      if (!fingerprintValid) {
        throw new Error('Verifier fingerprint does not match');
      }
    }

    // Create verification session
    const session: VerificationSession = {
      citizenId,
      verifierId,
      verifierName: verifier.fullName,
      verifierRole: verifier.role,
      verifierFingerprint,
      verifiedAt: new Date().toISOString()
    };

    // Update verifier statistics
    verifier.verificationsPerformed += 1;
    verifier.updatedAt = new Date().toISOString();
    await this.saveVerifier(verifier);

    // Log verification
    await this.logVerification(session);

    console.log(`Verification performed by ${verifier.fullName} for citizen ${citizenId}`);
    return session;
  }

  // Storage Methods
  private async saveSettings(): Promise<void> {
    try {
      localStorage.setItem('png-verification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving verification settings:', error);
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('png-verification-settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading verification settings:', error);
    }
  }

  private async saveVerifier(verifier: VerifierData): Promise<void> {
    try {
      const verifiers = await this.getVerifiers();
      const index = verifiers.findIndex(v => v.id === verifier.id);

      if (index >= 0) {
        verifiers[index] = verifier;
      } else {
        verifiers.push(verifier);
      }

      localStorage.setItem('png-verifiers', JSON.stringify(verifiers));
    } catch (error) {
      console.error('Error saving verifier:', error);
      throw error;
    }
  }

  private async logVerification(session: VerificationSession): Promise<void> {
    try {
      const logs = this.getVerificationLogs();
      logs.push(session);
      localStorage.setItem('png-verification-logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging verification:', error);
    }
  }

  public getVerificationLogs(): VerificationSession[] {
    try {
      const stored = localStorage.getItem('png-verification-logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading verification logs:', error);
      return [];
    }
  }

  // Utility Methods
  public async getVerificationStats(): Promise<{
    totalVerifiers: number;
    activeVerifiers: number;
    totalVerifications: number;
    verificationsByRole: Record<VerifierRole, number>;
  }> {
    const verifiers = await this.getVerifiers();
    const logs = this.getVerificationLogs();

    const verificationsByRole = logs.reduce((acc, log) => {
      acc[log.verifierRole] = (acc[log.verifierRole] || 0) + 1;
      return acc;
    }, {} as Record<VerifierRole, number>);

    return {
      totalVerifiers: verifiers.length,
      activeVerifiers: verifiers.filter(v => v.isActive).length,
      totalVerifications: logs.length,
      verificationsByRole
    };
  }

  public async deactivateVerifier(verifierId: string): Promise<void> {
    const verifier = await this.getVerifierById(verifierId);
    if (verifier) {
      verifier.isActive = false;
      verifier.updatedAt = new Date().toISOString();
      await this.saveVerifier(verifier);
    }
  }

  public async reactivateVerifier(verifierId: string): Promise<void> {
    const verifier = await this.getVerifierById(verifierId);
    if (verifier) {
      verifier.isActive = true;
      verifier.updatedAt = new Date().toISOString();
      await this.saveVerifier(verifier);
    }
  }
}

export const verificationService = VerificationService.getInstance();
export default verificationService;
