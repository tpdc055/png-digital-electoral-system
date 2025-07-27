// PNG Digital Electoral System - Performance Optimization Service
// Advanced caching, query optimization, and mobile performance enhancements

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  userInteractionDelay: number;
  timestamp: Date;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface QueryOptimizationConfig {
  enableIndexing: boolean;
  maxQueryTime: number;
  cacheQueryResults: boolean;
  batchSize: number;
  enablePagination: boolean;
  prefetchStrategy: 'lazy' | 'eager' | 'smart';
}

interface MobileOptimizationConfig {
  enableOfflineMode: boolean;
  compressImages: boolean;
  enableServiceWorker: boolean;
  maxImageSize: number;
  touchOptimization: boolean;
  batteryOptimization: boolean;
}

interface PerformanceOptimizationConfig {
  cacheSize: number;
  cacheTTL: number;
  debounceDelay: number;
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  query: QueryOptimizationConfig;
  mobile: MobileOptimizationConfig;
}

class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private metrics: PerformanceMetrics[] = [];
  private queryCache: Map<string, CacheEntry<unknown>> = new Map();
  private indexedQueries: Set<string> = new Set();
  private performanceObserver?: PerformanceObserver;

  private config: PerformanceOptimizationConfig = {
    cacheSize: 1000,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    debounceDelay: 300,
    enableVirtualization: true,
    enableLazyLoading: true,
    query: {
      enableIndexing: true,
      maxQueryTime: 2000,
      cacheQueryResults: true,
      batchSize: 50,
      enablePagination: true,
      prefetchStrategy: 'smart'
    },
    mobile: {
      enableOfflineMode: true,
      compressImages: true,
      enableServiceWorker: true,
      maxImageSize: 500 * 1024, // 500KB
      touchOptimization: true,
      batteryOptimization: true
    }
  };

  public static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  constructor() {
    this.initializePerformanceMonitoring();
    this.setupMobileOptimizations();
  }

  private enableQueryOptimizations(): void {
    // Initialize query optimization indexes
    this.createIndex('citizens', 'nationalIdNumber');
    this.createIndex('citizens', 'province');
    this.createIndex('citizens', 'constituency');
    console.log('📊 Query optimizations enabled');
  }

  // Core Performance Monitoring
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric({
            renderTime: entry.duration,
            memoryUsage: this.getMemoryUsage(),
            networkLatency: this.getNetworkLatency(),
            databaseQueryTime: this.getAverageQueryTime(),
            cacheHitRate: this.getCacheHitRate(),
            userInteractionDelay: 0,
            timestamp: new Date()
          });
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    }

    // Monitor user interactions
    this.setupUserInteractionMonitoring();
  }

  private setupUserInteractionMonitoring(): void {
    const interactionStart = new Map<string, number>();

    for (const eventType of ['click', 'touchstart', 'keydown']) {
      document.addEventListener(eventType, (event) => {
        const target = event.target as Element;
        const elementId = target.id || target.className || 'unknown';
        interactionStart.set(elementId, performance.now());
      });
    }

    for (const eventType of ['clickend', 'touchend', 'keyup']) {
      document.addEventListener(eventType, (event) => {
        const target = event.target as Element;
        const elementId = target.id || target.className || 'unknown';
        const startTime = interactionStart.get(elementId);

        if (startTime) {
          const delay = performance.now() - startTime;
          this.recordInteractionDelay(delay);
          interactionStart.delete(elementId);
        }
      });
    }
  }

  // Advanced Caching System
  public setCache<T>(key: string, data: T, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.config.cacheTTL;

    // Clean cache if size limit exceeded
    if (this.cache.size >= this.config.cacheSize) {
      this.cleanCache();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
  }

  public getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  public invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries first
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // If still over limit, remove least recently used
    if (this.cache.size >= this.config.cacheSize) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      const toRemove = sortedEntries.slice(0, Math.floor(this.config.cacheSize * 0.2));
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  // Query Optimization
  public optimizeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: Partial<QueryOptimizationConfig> = {}
  ): Promise<T> {
    const config = { ...this.config.query, ...options };

    // Check cache first
    if (config.cacheQueryResults) {
      const cached = this.getCache<T>(queryKey);
      if (cached) {
        return Promise.resolve(cached);
      }
    }

    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      // Set timeout for query
      const timeout = setTimeout(() => {
        reject(new Error(`Query timeout: ${queryKey} exceeded ${config.maxQueryTime}ms`));
      }, config.maxQueryTime);

      queryFn()
        .then((result) => {
          clearTimeout(timeout);
          const queryTime = performance.now() - startTime;

          // Cache result if enabled
          if (config.cacheQueryResults) {
            this.setCache(queryKey, result);
          }

          // Record performance metric
          this.recordQueryPerformance(queryKey, queryTime);

          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  // Database Optimization
  public createIndex(collectionName: string, fieldName: string): void {
    const indexKey = `${collectionName}_${fieldName}`;
    this.indexedQueries.add(indexKey);
    console.log(`🔍 Created index for ${collectionName}.${fieldName}`);
  }

  public paginateQuery<T>(
    items: T[],
    page: number,
    pageSize: number = this.config.query.batchSize
  ): { items: T[]; totalPages: number; currentPage: number; hasMore: boolean } {
    const totalPages = Math.ceil(items.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages
    };
  }

  // Mobile Optimizations
  private setupMobileOptimizations(): void {
    if (this.isMobileDevice()) {
      this.enableTouchOptimizations();
      this.enableBatteryOptimizations();
      this.optimizeNetworkUsage();
    }

    if (this.config.mobile.enableServiceWorker) {
      this.registerServiceWorker();
    }
  }

  private enableTouchOptimizations(): void {
    // Add touch-friendly CSS classes
    document.body.classList.add('touch-optimized');

    // Optimize touch events
    const style = document.createElement('style');
    style.textContent = `
      .touch-optimized button,
      .touch-optimized input,
      .touch-optimized select {
        min-height: 44px;
        min-width: 44px;
      }

      .touch-optimized .clickable {
        cursor: pointer;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  private enableBatteryOptimizations(): void {
    if ('getBattery' in navigator) {
      const navigatorWithBattery = navigator as Navigator & {
        getBattery?: () => Promise<{
          level: number;
          addEventListener?: (event: string, handler: () => void) => void;
        }>;
      };

      navigatorWithBattery.getBattery?.().then((battery) => {
        const optimizeBattery = () => {
          if (battery.level < 0.2) {
            // Enable power saving mode
            this.enablePowerSavingMode();
          }
        };

        if (battery.addEventListener) {
          battery.addEventListener('levelchange', optimizeBattery);
          battery.addEventListener('chargingchange', optimizeBattery);
        }
        optimizeBattery();
      });
    }
  }

  private enablePowerSavingMode(): void {
    // Reduce animation frequency
    document.body.classList.add('power-saving');

    // Disable non-essential features
    this.config.enableVirtualization = false;
    this.config.cacheTTL = 10 * 60 * 1000; // Increase cache time

    console.log('🔋 Power saving mode enabled');
  }

  private optimizeNetworkUsage(): void {
    const connection = (navigator as { connection?: { effectiveType: string } }).connection;
    if (connection) {
      const optimizeForConnection = () => {
        const connectionType = connection.effectiveType;

        switch (connectionType) {
          case 'slow-2g':
          case '2g':
            this.config.query.batchSize = 10;
            this.config.mobile.maxImageSize = 100 * 1024;
            break;
          case '3g':
            this.config.query.batchSize = 25;
            this.config.mobile.maxImageSize = 250 * 1024;
            break;
          default:
            this.config.query.batchSize = 50;
            this.config.mobile.maxImageSize = 500 * 1024;
        }
      };

      optimizeForConnection();
    }
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('🔧 Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    }
  }

  // Image Optimization
  public optimizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size <= this.config.mobile.maxImageSize) {
        // File is already optimized
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataURL);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Utility Functions
  public debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number = this.config.debounceDelay
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  public throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }

  // Virtual Scrolling for Large Lists
  public createVirtualList<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number
  ): { visibleItems: T[]; startIndex: number; endIndex: number } {
    if (!this.config.enableVirtualization) {
      return {
        visibleItems: items,
        startIndex: 0,
        endIndex: items.length - 1
      };
    }

    const scrollTop = window.scrollY;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 5, items.length - 1); // 5 item buffer

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex
    };
  }

  // Memory Management
  public forceGarbageCollection(): void {
    // Clear unused cache entries
    this.cleanCache();

    // Clear metrics older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);

    // Force garbage collection if available
    if ('gc' in window) {
      (window as { gc?(): void }).gc?.();
    }
  }

  // Performance Metrics
  private recordPerformanceMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private recordInteractionDelay(delay: number): void {
    const metric: PerformanceMetrics = {
      renderTime: 0,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: 0,
      databaseQueryTime: 0,
      cacheHitRate: this.getCacheHitRate(),
      userInteractionDelay: delay,
      timestamp: new Date()
    };

    this.recordPerformanceMetric(metric);
  }

  private recordQueryPerformance(queryKey: string, queryTime: number): void {
    const metric: PerformanceMetrics = {
      renderTime: 0,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: 0,
      databaseQueryTime: queryTime,
      cacheHitRate: this.getCacheHitRate(),
      userInteractionDelay: 0,
      timestamp: new Date()
    };

    this.recordPerformanceMetric(metric);
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      return memory ? memory.usedJSHeapSize / memory.totalJSHeapSize : 0;
    }
    return 0;
  }

  private getNetworkLatency(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation ? navigation.responseStart - navigation.requestStart : 0;
  }

  private getAverageQueryTime(): number {
    const queryMetrics = this.metrics.filter(m => m.databaseQueryTime > 0);
    if (queryMetrics.length === 0) return 0;

    const total = queryMetrics.reduce((sum, m) => sum + m.databaseQueryTime, 0);
    return total / queryMetrics.length;
  }

  private getCacheHitRate(): number {
    const totalCacheRequests = this.cache.size;
    if (totalCacheRequests === 0) return 0;

    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
    return totalHits / totalCacheRequests;
  }

  private getStorageUsage(): number {
    let totalSize = 0;
    try {
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          totalSize += localStorage[key].length;
        }
      }
    } catch (error) {
      console.warn('Could not calculate storage usage:', error);
    }
    return totalSize;
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private getConnectionType(): string {
    const connection = (navigator as { connection?: { effectiveType?: string } }).connection;
    return connection?.effectiveType || 'unknown';
  }

  // Performance Monitoring
  public startPerformanceProfile(label: string): string {
    const profileId = `${label}_${Date.now()}`;
    performance.mark(`${profileId}_start`);
    return profileId;
  }

  public endPerformanceProfile(profileId: string): number {
    performance.mark(`${profileId}_end`);
    performance.measure(profileId, `${profileId}_start`, `${profileId}_end`);

    const measures = performance.getEntriesByName(profileId);
    return measures.length > 0 ? measures[0].duration : 0;
  }

  // Public API
  public getPerformanceReport(): {
    averageRenderTime: number;
    averageMemoryUsage: number;
    averageNetworkLatency: number;
    averageDatabaseQueryTime: number;
    cacheHitRate: number;
    averageInteractionDelay: number;
    totalMetrics: number;
    storageUsage: number;
    connectionType: string;
    isMobile: boolean;
  } {
    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length;
    const avgMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;
    const avgNetworkLatency = this.metrics.reduce((sum, m) => sum + m.networkLatency, 0) / this.metrics.length;
    const avgDatabaseQueryTime = this.metrics.reduce((sum, m) => sum + m.databaseQueryTime, 0) / this.metrics.length;
    const avgInteractionDelay = this.metrics.reduce((sum, m) => sum + m.userInteractionDelay, 0) / this.metrics.length;

    return {
      averageRenderTime: avgRenderTime || 0,
      averageMemoryUsage: avgMemoryUsage || 0,
      averageNetworkLatency: avgNetworkLatency || 0,
      averageDatabaseQueryTime: avgDatabaseQueryTime || 0,
      cacheHitRate: this.getCacheHitRate(),
      averageInteractionDelay: avgInteractionDelay || 0,
      totalMetrics: this.metrics.length,
      storageUsage: this.getStorageUsage(),
      connectionType: this.getConnectionType(),
      isMobile: this.isMobileDevice()
    };
  }

  public updateConfig(newConfig: Partial<PerformanceOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚡ Performance configuration updated:', this.config);
  }

  public clearAllCache(): void {
    this.cache.clear();
    this.queryCache.clear();
    console.log('🧹 All caches cleared');
  }

  public getConfig(): PerformanceOptimizationConfig {
    return { ...this.config };
  }
}

export const performanceService = PerformanceOptimizationService.getInstance();
export default performanceService;
