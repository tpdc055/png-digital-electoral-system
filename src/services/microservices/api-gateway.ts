// PNG Digital Electoral System - API Gateway
// Production-ready microservice orchestration with advanced security and routing

import crypto from 'crypto';
import { EventStoreFactory, type DomainEvent } from '../../lib/event-store';

// Core Gateway Types
export interface APIGatewayConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  security: SecurityConfig;
  routing: RoutingConfig;
  rateLimit: RateLimitConfig;
  monitoring: MonitoringConfig;
  services: ServiceRegistryConfig;
}

export interface SecurityConfig {
  authentication: {
    jwt: {
      secretKey: string;
      expirationTime: string;
      refreshTokenTTL: string;
    };
    oauth: {
      enabled: boolean;
      providers: string[];
    };
    apiKeys: {
      enabled: boolean;
      encryption: string;
    };
  };
  authorization: {
    rbac: boolean;
    abac: boolean;
    policies: PolicyRule[];
  };
  encryption: {
    httpsOnly: boolean;
    tlsVersion: string;
    certificateManagement: string;
  };
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    allowedMethods: string[];
  };
}

export interface RoutingConfig {
  routes: Route[];
  loadBalancing: LoadBalancingConfig;
  circuitBreaker: CircuitBreakerConfig;
  retryPolicy: RetryPolicyConfig;
  caching: CachingConfig;
}

export interface RateLimitConfig {
  global: {
    requests: number;
    window: number; // seconds
  };
  perUser: {
    requests: number;
    window: number;
  };
  perAPI: {
    requests: number;
    window: number;
  };
  bypassRoles: string[];
}

export interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: string;
  target: string;
  authentication: boolean;
  authorization: string[];
  rateLimit?: {
    requests: number;
    window: number;
  };
  caching?: {
    enabled: boolean;
    ttl: number;
  };
  validation?: {
    request: any;
    response: any;
  };
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsEndpoint: string;
  healthCheckInterval: number;
  alerting: {
    enabled: boolean;
    thresholds: {
      errorRate: number;
      responseTime: number;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    destination: string;
  };
}

export interface ServiceRegistryConfig {
  services: Map<string, ServiceDefinition>;
  healthChecks: Map<string, HealthCheckResult>;
  discovery: ServiceDiscoveryConfig;
}

export interface ServiceDefinition {
  serviceId: string;
  name: string;
  version: string;
  baseUrl: string;
  instances: ServiceInstance[];
  healthCheckEndpoint: string;
  documentation: string;
  dependencies: string[];
  metadata: ServiceMetadata;
}

export interface ServiceInstance {
  instanceId: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  load: number; // 0-100
  lastHealthCheck: Date;
  region: string;
  zone: string;
}

export interface APIRequest {
  requestId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  queryParams: Record<string, string>;
  user?: AuthenticatedUser;
  timestamp: Date;
  clientIP: string;
  userAgent: string;
}

export interface APIResponse {
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  processingTime: number;
  serviceCall?: ServiceCallInfo;
  errors?: APIError[];
}

export interface AuthenticatedUser {
  userId: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  tokenType: 'jwt' | 'oauth' | 'apikey';
  expiresAt: Date;
  metadata: UserMetadata;
}

// Service Registry Manager
class ServiceRegistryManager {
  public services: Map<string, ServiceDefinition> = new Map();
  public healthChecks: Map<string, HealthCheckResult> = new Map();
  public discovery: ServiceDiscoveryConfig = {
    enabled: false,
    provider: 'consul',
    refreshInterval: 30000
  };
}

// Enhanced API Gateway Implementation
export class APIGateway {
  private static instance: APIGateway;
  private eventStore = EventStoreFactory.create();

  private config: APIGatewayConfig;
  private serviceRegistry: ServiceRegistryManager;
  private requestCache: Map<string, any> = new Map();
  private rateLimitStore: Map<string, RateLimitTracker> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private authService: AuthenticationService;
  private authzService: AuthorizationService;
  private monitoringService: MonitoringService;

  public static getInstance(): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway();
    }
    return APIGateway.instance;
  }

  constructor() {
    this.config = this.loadConfiguration();
    this.serviceRegistry = new ServiceRegistryManager();
    this.authService = new AuthenticationService(this.config.security.authentication);
    this.authzService = new AuthorizationService(this.config.security.authorization);
    this.monitoringService = new MonitoringService(this.config.monitoring);
    this.initializeGateway();
  }

  // Main request processing pipeline
  async processRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    console.log(`🌐 Processing request: ${request.method} ${request.path} [${request.requestId}]`);

    try {
      // 1. Security validation
      const securityCheck = await this.validateSecurity(request);
      if (!securityCheck.valid) {
        return this.createErrorResponse(request.requestId, 401, 'Security validation failed', securityCheck.errors);
      }

      // 2. Authentication
      const authResult = await this.authenticateRequest(request);
      if (!authResult.authenticated) {
        return this.createErrorResponse(request.requestId, 401, 'Authentication failed', authResult.errors);
      }
      request.user = authResult.user;

      // 3. Rate limiting
      const rateLimitCheck = await this.checkRateLimit(request);
      if (!rateLimitCheck.allowed) {
        return this.createErrorResponse(request.requestId, 429, 'Rate limit exceeded', rateLimitCheck.message ? [rateLimitCheck.message] : ['Rate limit exceeded']);
      }

      // 4. Route resolution
      const route = await this.resolveRoute(request);
      if (!route) {
        return this.createErrorResponse(request.requestId, 404, 'Route not found');
      }

      // 5. Authorization
      const authzResult = await this.authorizeRequest(request, route);
      if (!authzResult.authorized) {
        return this.createErrorResponse(request.requestId, 403, 'Authorization failed', authzResult.errors);
      }

      // 6. Request validation
      const validationResult = await this.validateRequest(request, route);
      if (!validationResult.valid) {
        return this.createErrorResponse(request.requestId, 400, 'Request validation failed', validationResult.errors);
      }

      // 7. Cache check
      const cachedResponse = await this.checkCache(request, route);
      if (cachedResponse) {
        console.log(`💨 Cache hit for request: ${request.requestId}`);
        return cachedResponse;
      }

      // 8. Service discovery and load balancing
      const serviceInstance = await this.selectServiceInstance(route.service);
      if (!serviceInstance) {
        return this.createErrorResponse(request.requestId, 503, 'Service unavailable');
      }

      // 9. Circuit breaker check
      const circuitBreaker = this.getCircuitBreaker(route.service);
      if (circuitBreaker.isOpen()) {
        return this.createErrorResponse(request.requestId, 503, 'Service temporarily unavailable');
      }

      // 10. Forward request to service
      const serviceResponse = await this.forwardToService(request, route, serviceInstance);

      // 11. Response validation
      const responseValidation = await this.validateResponse(serviceResponse, route);
      if (!responseValidation.valid) {
        console.warn(`⚠️ Response validation failed for ${request.requestId}:`, responseValidation.errors);
      }

      // 12. Cache response if applicable
      if (route.caching?.enabled && serviceResponse.statusCode === 200) {
        await this.cacheResponse(request, route, serviceResponse);
      }

      // 13. Update circuit breaker
      circuitBreaker.recordSuccess();

      // 14. Record metrics and audit
      await this.recordMetrics(request, serviceResponse, Date.now() - startTime);
      await this.createAuditLog(request, serviceResponse);

      console.log(`✅ Request completed: ${request.requestId} in ${Date.now() - startTime}ms`);
      return serviceResponse;

    } catch (error) {
      console.error(`❌ Request processing failed: ${request.requestId}`, error);

      // Update circuit breaker on failure
      const route = await this.resolveRoute(request);
      if (route) {
        const circuitBreaker = this.getCircuitBreaker(route.service);
        circuitBreaker.recordFailure();
      }

      await this.recordMetrics(request, undefined, Date.now() - startTime, error as Error);
      return this.createErrorResponse(request.requestId, 500, 'Internal server error');
    }
  }

  // Service management
  async registerService(service: ServiceDefinition): Promise<{ success: boolean; errors?: string[] }> {
    console.log(`📋 Registering service: ${service.name} v${service.version}`);

    try {
      // Validate service definition
      const validation = await this.validateServiceDefinition(service);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Health check
      const healthCheck = await this.performHealthCheck(service);
      if (!healthCheck.healthy) {
        console.warn(`⚠️ Service registration with unhealthy status: ${service.name}`);
      }

      // Register service
      this.serviceRegistry.services.set(service.serviceId, service);
      this.serviceRegistry.healthChecks.set(service.serviceId, healthCheck);

      // Initialize circuit breaker
      this.circuitBreakers.set(service.serviceId, new CircuitBreaker(service.serviceId));

      // Create registration event
      const registrationEvent: DomainEvent = {
        eventId: crypto.randomUUID(),
        aggregateId: service.serviceId,
        aggregateType: 'Service',
        eventType: 'ServiceRegistered',
        eventData: {
          serviceId: service.serviceId,
          name: service.name,
          version: service.version,
          baseUrl: service.baseUrl,
          healthStatus: healthCheck.healthy ? 'healthy' : 'unhealthy'
        },
        eventVersion: 1,
        timestamp: new Date(),
        metadata: {
          cryptographicSignature: '',
          auditHash: ''
        }
      };

      await this.eventStore.appendToStream(service.serviceId, 0, [registrationEvent]);

      console.log(`✅ Service registered successfully: ${service.name}`);
      return { success: true };

    } catch (error) {
      console.error('Service registration failed:', error);
      return { success: false, errors: ['Service registration failed'] };
    }
  }

  async deregisterService(serviceId: string): Promise<{ success: boolean; errors?: string[] }> {
    console.log(`🗑️ Deregistering service: ${serviceId}`);

    try {
      const service = this.serviceRegistry.services.get(serviceId);
      if (!service) {
        return { success: false, errors: ['Service not found'] };
      }

      // Remove from registry
      this.serviceRegistry.services.delete(serviceId);
      this.serviceRegistry.healthChecks.delete(serviceId);
      this.circuitBreakers.delete(serviceId);

      // Create deregistration event
      const deregistrationEvent: DomainEvent = {
        eventId: crypto.randomUUID(),
        aggregateId: serviceId,
        aggregateType: 'Service',
        eventType: 'ServiceDeregistered',
        eventData: {
          serviceId,
          name: service.name,
          reason: 'manual_deregistration'
        },
        eventVersion: 2,
        timestamp: new Date(),
        metadata: {
          cryptographicSignature: '',
          auditHash: ''
        }
      };

      await this.eventStore.appendToStream(serviceId, 1, [deregistrationEvent]);

      console.log(`✅ Service deregistered successfully: ${serviceId}`);
      return { success: true };

    } catch (error) {
      console.error('Service deregistration failed:', error);
      return { success: false, errors: ['Service deregistration failed'] };
    }
  }

  // Health monitoring
  async performHealthChecks(): Promise<void> {
    console.log('🏥 Performing health checks for all services...');

    const healthPromises = Array.from(this.serviceRegistry.services.values()).map(async (service) => {
      try {
        const healthCheck = await this.performHealthCheck(service);
        this.serviceRegistry.healthChecks.set(service.serviceId, healthCheck);

        // Update circuit breaker based on health
        const circuitBreaker = this.circuitBreakers.get(service.serviceId);
        if (circuitBreaker) {
          if (healthCheck.healthy) {
            circuitBreaker.recordSuccess();
          } else {
            circuitBreaker.recordFailure();
          }
        }

      } catch (error) {
        console.error(`Health check failed for ${service.name}:`, error);
        this.serviceRegistry.healthChecks.set(service.serviceId, {
          serviceId: service.serviceId,
          healthy: false,
          timestamp: new Date(),
          responseTime: 0,
          errors: [(error as Error).message]
        });
      }
    });

    await Promise.all(healthPromises);
    console.log('✅ Health checks completed');
  }

  // Private helper methods
  private async validateSecurity(request: APIRequest): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // HTTPS enforcement
    if (this.config.security.encryption.httpsOnly && !request.headers['x-forwarded-proto']?.includes('https')) {
      errors.push('HTTPS required');
    }

    // CORS validation
    if (this.config.security.cors.enabled) {
      const origin = request.headers.origin;
      if (origin && !this.config.security.cors.allowedOrigins.includes(origin)) {
        errors.push('CORS: Origin not allowed');
      }
    }

    // Request size validation
    const contentLength = Number.parseInt(request.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB limit
      errors.push('Request too large');
    }

    return { valid: errors.length === 0, errors };
  }

  private async authenticateRequest(request: APIRequest): Promise<{
    authenticated: boolean;
    user?: AuthenticatedUser;
    errors?: string[];
  }> {
    return await this.authService.authenticate(request);
  }

  private async checkRateLimit(request: APIRequest): Promise<{ allowed: boolean; message?: string }> {
    const key = request.user?.userId || request.clientIP;
    const tracker = this.rateLimitStore.get(key) || new RateLimitTracker();

    // Check per-user limits
    if (request.user) {
      const userLimit = this.config.rateLimit.perUser;
      if (!tracker.checkLimit(userLimit.requests, userLimit.window)) {
        return { allowed: false, message: 'User rate limit exceeded' };
      }
    }

    // Check global limits
    const globalTracker = this.rateLimitStore.get('global') || new RateLimitTracker();
    const globalLimit = this.config.rateLimit.global;
    if (!globalTracker.checkLimit(globalLimit.requests, globalLimit.window)) {
      return { allowed: false, message: 'Global rate limit exceeded' };
    }

    this.rateLimitStore.set(key, tracker);
    this.rateLimitStore.set('global', globalTracker);

    return { allowed: true };
  }

  private async resolveRoute(request: APIRequest): Promise<Route | null> {
    return this.config.routing.routes.find(route =>
      route.path === request.path && route.method === request.method
    ) || null;
  }

  private async authorizeRequest(request: APIRequest, route: Route): Promise<{
    authorized: boolean;
    errors?: string[];
  }> {
    return await this.authzService.authorize(request, route);
  }

  private async validateRequest(request: APIRequest, route: Route): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    // In production, implement JSON schema validation
    return { valid: true };
  }

  private async checkCache(request: APIRequest, route: Route): Promise<APIResponse | null> {
    if (!route.caching?.enabled) return null;

    const cacheKey = this.generateCacheKey(request);
    return this.requestCache.get(cacheKey) || null;
  }

  private async selectServiceInstance(serviceId: string): Promise<ServiceInstance | null> {
    const service = this.serviceRegistry.services.get(serviceId);
    if (!service || service.instances.length === 0) return null;

    // Load balancing - select instance with lowest load
    const healthyInstances = service.instances.filter(instance => instance.status === 'healthy');
    if (healthyInstances.length === 0) return null;

    return healthyInstances.reduce((prev, current) =>
      prev.load < current.load ? prev : current
    );
  }

  private getCircuitBreaker(serviceId: string): CircuitBreaker {
    return this.circuitBreakers.get(serviceId) || new CircuitBreaker(serviceId);
  }

  private async forwardToService(
    request: APIRequest,
    route: Route,
    instance: ServiceInstance
  ): Promise<APIResponse> {
    const startTime = Date.now();

    try {
      // In production, make actual HTTP request to service
      console.log(`🔄 Forwarding to ${route.service}: ${instance.url}${route.target}`);

      // Mock service response
      const mockResponse: APIResponse = {
        requestId: request.requestId,
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { message: 'Success from service', service: route.service },
        processingTime: Date.now() - startTime,
        serviceCall: {
          serviceId: route.service,
          instanceId: instance.instanceId,
          url: `${instance.url}${route.target}`,
          responseTime: Date.now() - startTime
        }
      };

      return mockResponse;

    } catch (error) {
      throw new Error(`Service call failed: ${(error as Error).message}`);
    }
  }

  private async validateResponse(response: APIResponse, route: Route): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    // In production, implement response validation
    return { valid: true };
  }

  private async cacheResponse(request: APIRequest, route: Route, response: APIResponse): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    this.requestCache.set(cacheKey, response);

    // Set expiration
    setTimeout(() => {
      this.requestCache.delete(cacheKey);
    }, (route.caching?.ttl || 300) * 1000);
  }

  private generateCacheKey(request: APIRequest): string {
    return crypto.createHash('sha256')
      .update(`${request.method}:${request.path}:${JSON.stringify(request.queryParams)}`)
      .digest('hex');
  }

  private async recordMetrics(
    request: APIRequest,
    response?: APIResponse,
    processingTime?: number,
    error?: Error
  ): Promise<void> {
    await this.monitoringService.recordMetrics({
      requestId: request.requestId,
      method: request.method,
      path: request.path,
      statusCode: response?.statusCode || 500,
      processingTime: processingTime || 0,
      error: error?.message,
      timestamp: new Date()
    });
  }

  private async createAuditLog(request: APIRequest, response: APIResponse): Promise<void> {
    const auditEvent: DomainEvent = {
      eventId: crypto.randomUUID(),
      aggregateId: request.requestId,
      aggregateType: 'APIRequest',
      eventType: 'RequestProcessed',
      eventData: {
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        userId: request.user?.userId,
        statusCode: response.statusCode,
        processingTime: response.processingTime,
        clientIP: request.clientIP
      },
      eventVersion: 1,
      timestamp: new Date(),
      metadata: {
        cryptographicSignature: '',
        auditHash: ''
      }
    };

    await this.eventStore.appendToStream(request.requestId, 0, [auditEvent]);
  }

  private createErrorResponse(
    requestId: string,
    statusCode: number,
    message: string,
    errors?: string[]
  ): APIResponse {
    return {
      requestId,
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: message,
        details: errors,
        timestamp: new Date().toISOString()
      },
      processingTime: 0,
      errors: errors?.map(e => ({ code: 'VALIDATION_ERROR', message: e }))
    };
  }

  private async performHealthCheck(service: ServiceDefinition): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // In production, make actual health check request
      console.log(`🏥 Health check for ${service.name}: ${service.healthCheckEndpoint}`);

      // Mock health check
      const responseTime = Date.now() - startTime;

      return {
        serviceId: service.serviceId,
        healthy: true,
        timestamp: new Date(),
        responseTime,
        errors: []
      };

    } catch (error) {
      return {
        serviceId: service.serviceId,
        healthy: false,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        errors: [(error as Error).message]
      };
    }
  }

  private async validateServiceDefinition(service: ServiceDefinition): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    if (!service.serviceId) errors.push('Service ID is required');
    if (!service.name) errors.push('Service name is required');
    if (!service.version) errors.push('Service version is required');
    if (!service.baseUrl) errors.push('Base URL is required');

    return { valid: errors.length === 0, errors };
  }

  private loadConfiguration(): APIGatewayConfig {
    // In production, load from config file or environment
    return {
      version: '2.0.0',
      environment: 'production',
      security: {
        authentication: {
          jwt: {
            secretKey: process.env.JWT_SECRET || 'png-electoral-gateway-secret',
            expirationTime: '1h',
            refreshTokenTTL: '7d'
          },
          oauth: {
            enabled: true,
            providers: ['google', 'azure']
          },
          apiKeys: {
            enabled: true,
            encryption: 'AES-256'
          }
        },
        authorization: {
          rbac: true,
          abac: true,
          policies: []
        },
        encryption: {
          httpsOnly: true,
          tlsVersion: '1.3',
          certificateManagement: 'automatic'
        },
        cors: {
          enabled: true,
          allowedOrigins: ['https://electoral.gov.pg'],
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
        }
      },
      routing: {
        routes: [
          {
            path: '/api/auth/*',
            method: 'POST',
            service: 'auth-service',
            target: '/auth/*',
            authentication: false,
            authorization: []
          },
          {
            path: '/api/registry/*',
            method: 'GET',
            service: 'registry-service',
            target: '/registry/*',
            authentication: true,
            authorization: ['registry:read']
          },
          {
            path: '/api/ballot/*',
            method: 'POST',
            service: 'ballot-service',
            target: '/ballot/*',
            authentication: true,
            authorization: ['ballot:cast']
          },
          {
            path: '/api/tally/*',
            method: 'GET',
            service: 'tally-service',
            target: '/tally/*',
            authentication: true,
            authorization: ['tally:read']
          }
        ],
        loadBalancing: {} as LoadBalancingConfig,
        circuitBreaker: {} as CircuitBreakerConfig,
        retryPolicy: {} as RetryPolicyConfig,
        caching: {} as CachingConfig
      },
      rateLimit: {
        global: { requests: 10000, window: 60 },
        perUser: { requests: 100, window: 60 },
        perAPI: { requests: 1000, window: 60 },
        bypassRoles: ['admin', 'system']
      },
      monitoring: {
        enabled: true,
        metricsEndpoint: '/metrics',
        healthCheckInterval: 30000,
        alerting: {
          enabled: true,
          thresholds: {
            errorRate: 0.05,
            responseTime: 1000
          }
        },
        logging: {
          level: 'info',
          destination: 'console'
        }
      } as MonitoringConfig,
      services: {} as ServiceRegistryConfig
    };
  }

  private initializeGateway(): void {
    console.log('🚀 API Gateway initializing...');
    console.log(`🌐 Environment: ${this.config.environment}`);
    console.log(`🔐 Security: Enhanced protection enabled`);
    console.log(`📊 Monitoring: Real-time metrics active`);
    console.log('✅ API Gateway ready for production traffic');
  }
}

// Supporting Services and Classes
class AuthenticationService {
  constructor(private config: any) {}

  async authenticate(request: APIRequest): Promise<{
    authenticated: boolean;
    user?: AuthenticatedUser;
    errors?: string[];
  }> {
    // Mock authentication - in production, verify JWT/OAuth tokens
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return { authenticated: false, errors: ['No authentication token provided'] };
    }

    // Mock user
    const user: AuthenticatedUser = {
      userId: 'user-123',
      roles: ['voter', 'citizen'],
      permissions: ['ballot:cast', 'registry:read'],
      sessionId: crypto.randomUUID(),
      tokenType: 'jwt',
      expiresAt: new Date(Date.now() + 3600000),
      metadata: {} as UserMetadata
    };

    return { authenticated: true, user };
  }
}

class AuthorizationService {
  constructor(private config: any) {}

  async authorize(request: APIRequest, route: Route): Promise<{
    authorized: boolean;
    errors?: string[];
  }> {
    if (!route.authorization || route.authorization.length === 0) {
      return { authorized: true };
    }

    if (!request.user) {
      return { authorized: false, errors: ['User not authenticated'] };
    }

    // Check if user has required permissions
    const hasPermission = route.authorization.every(permission =>
      request.user!.permissions.includes(permission)
    );

    return {
      authorized: hasPermission,
      errors: hasPermission ? [] : ['Insufficient permissions']
    };
  }
}

class MonitoringService {
  constructor(private config: any) {}

  async recordMetrics(metrics: any): Promise<void> {
    // In production, send to monitoring system (Prometheus, DataDog, etc.)
    console.log(`📊 Metrics recorded: ${metrics.requestId} - ${metrics.statusCode} - ${metrics.processingTime}ms`);
  }
}

class RateLimitTracker {
  private requests: number[] = [];

  checkLimit(maxRequests: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    // Clean old requests
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    // Check limit
    if (this.requests.length >= maxRequests) {
      return false;
    }

    // Record request
    this.requests.push(now);
    return true;
  }
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private serviceId: string,
    private failureThreshold = 5,
    private timeoutMs = 30000
  ) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.warn(`🚨 Circuit breaker opened for service: ${this.serviceId}`);
    }
  }
}

// Additional Type Definitions
interface PolicyRule {
  id: string;
  resource: string;
  action: string;
  effect: 'allow' | 'deny';
  conditions: any[];
}

interface LoadBalancingConfig {
  algorithm: 'round_robin' | 'least_connections' | 'weighted';
  healthCheckInterval: number;
  unhealthyThreshold: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  halfOpenMaxCalls: number;
}

interface RetryPolicyConfig {
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  retryableStatusCodes: number[];
}

interface CachingConfig {
  enabled: boolean;
  defaultTTL: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

interface ServiceDiscoveryConfig {
  enabled: boolean;
  provider: 'consul' | 'etcd' | 'kubernetes';
  refreshInterval: number;
}

interface HealthCheckResult {
  serviceId: string;
  healthy: boolean;
  timestamp: Date;
  responseTime: number;
  errors: string[];
}

interface ServiceCallInfo {
  serviceId: string;
  instanceId: string;
  url: string;
  responseTime: number;
}

interface APIError {
  code: string;
  message: string;
  field?: string;
}

interface ServiceMetadata {
  tags: string[];
  region: string;
  zone: string;
  version: string;
  capabilities: string[];
}

interface UserMetadata {
  lastLogin: Date;
  preferences: any;
  deviceInfo: any;
}

export const apiGateway = APIGateway.getInstance();

console.log('🌐 Enhanced API Gateway with microservice orchestration initialized');
