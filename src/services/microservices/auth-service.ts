// PNG Digital Electoral System - Authentication Microservice
// Enterprise-grade authentication with MFA, device binding, and risk assessment

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Authentication Types
export interface User {
  userId: string;
  email: string;
  roles: UserRole[];
  permissions: Permission[];
  profile: UserProfile;
  securitySettings: SecuritySettings;
  deviceBindings: DeviceBinding[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  position: string;
  organization: string;
  phoneNumber?: string;
  constituency?: string;
  province?: string;
  verificationLevel: 'basic' | 'enhanced' | 'biometric';
}

export interface UserRole {
  roleId: string;
  name: string;
  description: string;
  permissions: Permission[];
  context?: RoleContext;
}

export interface Permission {
  permissionId: string;
  resource: string;
  action: string;
  conditions?: string[];
}

export interface RoleContext {
  constituency?: string;
  province?: string;
  electionId?: string;
  deviceId?: string;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  allowedIpRanges?: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  biometricEnabled: boolean;
}

export interface MFAMethod {
  methodId: string;
  type: 'sms' | 'email' | 'totp' | 'hardware_token' | 'biometric';
  identifier: string; // phone number, email, device id
  verified: boolean;
  createdAt: Date;
}

export interface DeviceBinding {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'kiosk';
  fingerprint: string;
  certificate: string;
  trustLevel: 'trusted' | 'verified' | 'unknown';
  firstSeen: Date;
  lastUsed: Date;
  location?: GeoLocation;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  constituency?: string;
}

export interface AuthenticationRequest {
  email: string;
  password: string;
  deviceFingerprint: string;
  geoLocation?: GeoLocation;
  clientInfo: ClientInfo;
}

export interface ClientInfo {
  userAgent: string;
  ipAddress: string;
  sessionId: string;
}

export interface AuthenticationResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  mfaRequired?: boolean;
  mfaChallenge?: MFAChallenge;
  user?: User;
  sessionInfo?: SessionInfo;
  riskAssessment?: RiskAssessment;
}

export interface MFAChallenge {
  challengeId: string;
  method: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  riskScore: number;
}

export interface RiskAssessment {
  score: number; // 0-100, higher = riskier
  factors: RiskFactor[];
  recommendation: 'allow' | 'challenge' | 'deny';
  requiresAdditionalVerification: boolean;
}

export interface RiskFactor {
  type: 'geo_location' | 'device_change' | 'time_pattern' | 'velocity' | 'ip_reputation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  score: number;
}

// Authentication Service Implementation
export class AuthService {
  private static instance: AuthService;
  private users: Map<string, User> = new Map();
  private sessions: Map<string, SessionInfo> = new Map();
  private mfaChallenges: Map<string, MFAChallenge> = new Map();
  private deviceRegistry: Map<string, DeviceBinding> = new Map();

  private readonly JWT_SECRET = process.env.JWT_SECRET || 'png-electoral-jwt-secret-2027';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'png-electoral-refresh-secret-2027';
  private readonly TOKEN_EXPIRY = '2h';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeDefaultUsers();
  }

  // Main authentication method
  async authenticate(request: AuthenticationRequest): Promise<AuthenticationResponse> {
    console.log(`🔐 Authentication attempt for: ${request.email}`);

    try {
      // 1. Validate credentials
      const user = await this.validateCredentials(request.email, request.password);
      if (!user) {
        await this.logSecurityEvent('FAILED_LOGIN', request.email, request.clientInfo);
        return { success: false };
      }

      // 2. Assess risk
      const riskAssessment = await this.assessRisk(user, request);
      console.log(`🔍 Risk assessment: ${riskAssessment.score}/100 (${riskAssessment.recommendation})`);

      // 3. Handle risk-based decisions
      if (riskAssessment.recommendation === 'deny') {
        await this.logSecurityEvent('HIGH_RISK_BLOCKED', user.email, request.clientInfo);
        return { success: false };
      }

      // 4. Check MFA requirements
      if (user.securitySettings.mfaEnabled || riskAssessment.requiresAdditionalVerification) {
        const mfaChallenge = await this.initiateMFA(user);
        return {
          success: false,
          mfaRequired: true,
          mfaChallenge,
          riskAssessment
        };
      }

      // 5. Create session and tokens
      const sessionInfo = await this.createSession(user, request);
      const tokens = await this.generateTokens(user, sessionInfo);

      // 6. Update device binding
      await this.updateDeviceBinding(user.userId, request.deviceFingerprint, request.geoLocation);

      await this.logSecurityEvent('SUCCESSFUL_LOGIN', user.email, request.clientInfo);

      return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
        sessionInfo,
        riskAssessment
      };

    } catch (error) {
      console.error('Authentication error:', error);
      await this.logSecurityEvent('AUTH_ERROR', request.email, request.clientInfo);
      return { success: false };
    }
  }

  // Verify MFA challenge
  async verifyMFA(challengeId: string, code: string, deviceFingerprint: string): Promise<AuthenticationResponse> {
    const challenge = this.mfaChallenges.get(challengeId);
    if (!challenge) {
      return { success: false };
    }

    if (new Date() > challenge.expiresAt) {
      this.mfaChallenges.delete(challengeId);
      return { success: false };
    }

    // Verify the MFA code (implementation depends on method)
    const isValid = await this.verifyMFACode(challenge, code);

    if (!isValid) {
      challenge.attempts++;
      if (challenge.attempts >= challenge.maxAttempts) {
        this.mfaChallenges.delete(challengeId);
      }
      return { success: false };
    }

    // MFA successful - complete authentication
    this.mfaChallenges.delete(challengeId);

    // Continue with session creation
    const user = await this.getUserById(challengeId); // Store user ID in challenge
    if (!user) return { success: false };

    const sessionInfo = await this.createSession(user, {
      deviceFingerprint,
      clientInfo: { userAgent: '', ipAddress: '', sessionId: '' }
    } as AuthenticationRequest);

    const tokens = await this.generateTokens(user, sessionInfo);

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      sessionInfo
    };
  }

  // Validate JWT token
  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      const session = this.sessions.get(decoded.sessionId);

      if (!session || new Date() > session.expiresAt) {
        return null;
      }

      // Update last activity
      session.lastActivity = new Date();

      return await this.getUserById(decoded.userId);
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ accessToken?: string; refreshToken?: string } | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      const user = await this.getUserById(decoded.userId);

      if (!user) return null;

      const session = this.sessions.get(decoded.sessionId);
      if (!session) return null;

      // Generate new tokens
      const tokens = await this.generateTokens(user, session);
      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  // Authorization check
  async authorize(token: string, resource: string, action: string, context?: any): Promise<boolean> {
    const user = await this.validateToken(token);
    if (!user) return false;

    // Check permissions
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if (permission.resource === resource && permission.action === action) {
          // Check context conditions if any
          if (this.checkConditions(permission.conditions, context, role.context)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // Risk assessment
  private async assessRisk(user: User, request: AuthenticationRequest): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // Check geographic location
    if (request.geoLocation && user.profile.constituency) {
      const geoRisk = await this.assessGeoRisk(user, request.geoLocation);
      if (geoRisk.score > 0) {
        factors.push(geoRisk);
        totalScore += geoRisk.score;
      }
    }

    // Check device fingerprint
    const deviceRisk = await this.assessDeviceRisk(user.userId, request.deviceFingerprint);
    if (deviceRisk.score > 0) {
      factors.push(deviceRisk);
      totalScore += deviceRisk.score;
    }

    // Check time patterns
    const timeRisk = await this.assessTimeRisk(user);
    if (timeRisk.score > 0) {
      factors.push(timeRisk);
      totalScore += timeRisk.score;
    }

    // Check IP reputation
    const ipRisk = await this.assessIPRisk(request.clientInfo.ipAddress);
    if (ipRisk.score > 0) {
      factors.push(ipRisk);
      totalScore += ipRisk.score;
    }

    // Determine recommendation
    let recommendation: 'allow' | 'challenge' | 'deny' = 'allow';
    let requiresAdditionalVerification = false;

    if (totalScore >= 70) {
      recommendation = 'deny';
    } else if (totalScore >= 40) {
      recommendation = 'challenge';
      requiresAdditionalVerification = true;
    } else if (totalScore >= 20) {
      requiresAdditionalVerification = true;
    }

    return {
      score: totalScore,
      factors,
      recommendation,
      requiresAdditionalVerification
    };
  }

  // Private helper methods
  private async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) return null;

    // In production, use proper password hashing (bcrypt, scrypt, etc.)
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const storedHash = this.getStoredPasswordHash(user.userId);

    return hashedPassword === storedHash ? user : null;
  }

  private async initiateMFA(user: User): Promise<MFAChallenge> {
    const challengeId = crypto.randomUUID();
    const challenge: MFAChallenge = {
      challengeId,
      method: user.securitySettings.mfaMethods[0]?.type || 'email',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      maxAttempts: 3
    };

    this.mfaChallenges.set(challengeId, challenge);

    // Send MFA code (implementation depends on method)
    await this.sendMFACode(user, challenge);

    return challenge;
  }

  private async createSession(user: User, request: AuthenticationRequest): Promise<SessionInfo> {
    const sessionId = crypto.randomUUID();
    const deviceId = this.generateDeviceId(request.deviceFingerprint);

    const session: SessionInfo = {
      sessionId,
      userId: user.userId,
      deviceId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + user.securitySettings.sessionTimeoutMinutes * 60 * 1000),
      lastActivity: new Date(),
      ipAddress: request.clientInfo.ipAddress,
      riskScore: 0
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  private async generateTokens(user: User, session: SessionInfo): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenPayload = {
      userId: user.userId,
      sessionId: session.sessionId,
      roles: user.roles.map(r => r.name),
      permissions: user.permissions.map(p => `${p.resource}:${p.action}`)
    };

    const accessToken = jwt.sign(tokenPayload, this.JWT_SECRET, {
      expiresIn: this.TOKEN_EXPIRY,
      issuer: 'png-electoral-system',
      audience: 'png-electoral-clients'
    });

    const refreshToken = jwt.sign(
      { userId: user.userId, sessionId: session.sessionId },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  private async assessGeoRisk(user: User, location: GeoLocation): Promise<RiskFactor> {
    // Simplified geo-risk assessment
    const userConstituency = user.profile.constituency;
    const currentConstituency = location.constituency;

    if (userConstituency && currentConstituency && userConstituency !== currentConstituency) {
      return {
        type: 'geo_location',
        severity: 'medium',
        description: 'Login from different constituency',
        score: 25
      };
    }

    return { type: 'geo_location', severity: 'low', description: 'Normal location', score: 0 };
  }

  private async assessDeviceRisk(userId: string, deviceFingerprint: string): Promise<RiskFactor> {
    const deviceBinding = this.deviceRegistry.get(`${userId}:${deviceFingerprint}`);

    if (!deviceBinding) {
      return {
        type: 'device_change',
        severity: 'high',
        description: 'Unknown device',
        score: 30
      };
    }

    if (deviceBinding.trustLevel === 'unknown') {
      return {
        type: 'device_change',
        severity: 'medium',
        description: 'Unverified device',
        score: 15
      };
    }

    return { type: 'device_change', severity: 'low', description: 'Trusted device', score: 0 };
  }

  private async assessTimeRisk(user: User): Promise<RiskFactor> {
    const now = new Date();
    const hour = now.getHours();

    // Flag unusual hours (night time voting might be suspicious)
    if (hour < 6 || hour > 22) {
      return {
        type: 'time_pattern',
        severity: 'low',
        description: 'Unusual time access',
        score: 10
      };
    }

    return { type: 'time_pattern', severity: 'low', description: 'Normal time', score: 0 };
  }

  private async assessIPRisk(ipAddress: string): Promise<RiskFactor> {
    // Simplified IP reputation check
    const suspiciousIPs = ['tor-exit-node', 'vpn-detected', 'proxy-detected'];

    // In production, integrate with IP reputation services
    const isReputationBad = Math.random() < 0.1; // 10% chance for demo

    if (isReputationBad) {
      return {
        type: 'ip_reputation',
        severity: 'high',
        description: 'Suspicious IP reputation',
        score: 40
      };
    }

    return { type: 'ip_reputation', severity: 'low', description: 'Clean IP', score: 0 };
  }

  private checkConditions(conditions: string[] | undefined, context: any, roleContext?: RoleContext): boolean {
    if (!conditions) return true;

    // Simple condition checking - in production, use policy engine
    for (const condition of conditions) {
      if (condition.includes('constituency') && roleContext?.constituency) {
        if (context?.constituency !== roleContext.constituency) {
          return false;
        }
      }
    }

    return true;
  }

  private async updateDeviceBinding(userId: string, deviceFingerprint: string, geoLocation?: GeoLocation): Promise<void> {
    const key = `${userId}:${deviceFingerprint}`;
    const existing = this.deviceRegistry.get(key);

    if (existing) {
      existing.lastUsed = new Date();
      existing.location = geoLocation;
    } else {
      const newBinding: DeviceBinding = {
        deviceId: this.generateDeviceId(deviceFingerprint),
        deviceName: 'Unknown Device',
        deviceType: 'desktop',
        fingerprint: deviceFingerprint,
        certificate: '',
        trustLevel: 'unknown',
        firstSeen: new Date(),
        lastUsed: new Date(),
        location: geoLocation
      };
      this.deviceRegistry.set(key, newBinding);
    }
  }

  private generateDeviceId(fingerprint: string): string {
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
  }

  private async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  private getStoredPasswordHash(userId: string): string {
    // In production, retrieve from secure storage
    // For demo, use predefined hashes
    const defaultHashes: Record<string, string> = {
      'admin-001': crypto.createHash('sha256').update('admin123').digest('hex'),
      'enum-001': crypto.createHash('sha256').update('enum123').digest('hex'),
      'viewer-001': crypto.createHash('sha256').update('viewer123').digest('hex')
    };
    return defaultHashes[userId] || '';
  }

  private async sendMFACode(user: User, challenge: MFAChallenge): Promise<void> {
    // In production, integrate with SMS/Email services
    console.log(`📱 MFA code sent to ${user.email} via ${challenge.method}`);
    console.log(`🔢 Demo MFA Code: 123456`); // For demo purposes
  }

  private async verifyMFACode(challenge: MFAChallenge, code: string): Promise<boolean> {
    // In production, verify against generated/sent code
    return code === '123456'; // Demo implementation
  }

  private async logSecurityEvent(eventType: string, email: string, clientInfo: ClientInfo): Promise<void> {
    console.log(`🛡️ Security Event: ${eventType} - ${email} from ${clientInfo.ipAddress}`);
    // In production, log to SIEM system
  }

  // Initialize default users for testing
  private initializeDefaultUsers(): void {
    const adminUser: User = {
      userId: 'admin-001',
      email: 'admin@electoral.gov.pg',
      roles: [{
        roleId: 'admin-role',
        name: 'Administrator',
        description: 'Full system administration',
        permissions: [
          { permissionId: 'perm-1', resource: '*', action: '*' }
        ]
      }],
      permissions: [
        { permissionId: 'perm-1', resource: '*', action: '*' }
      ],
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
        position: 'Chief Electoral Officer',
        organization: 'PNG Electoral Commission',
        verificationLevel: 'enhanced'
      },
      securitySettings: {
        mfaEnabled: true,
        mfaMethods: [
          { methodId: 'mfa-1', type: 'email', identifier: 'admin@electoral.gov.pg', verified: true, createdAt: new Date() }
        ],
        passwordExpiryDays: 90,
        sessionTimeoutMinutes: 120,
        riskTolerance: 'low',
        biometricEnabled: true
      },
      deviceBindings: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(adminUser.userId, adminUser);
    console.log('🔐 Authentication service initialized with default users');
  }
}

export const authService = AuthService.getInstance();
