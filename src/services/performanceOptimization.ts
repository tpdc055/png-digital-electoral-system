// Performance Optimization Service for PNG Citizen Registration System
// Optimized for tablet devices and large datasets

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  storageUsage: number;
  batteryLevel?: number;
  connectionType: string;
}

interface OptimizationConfig {
  enableImageCompression: boolean;
  maxImageQuality: number;
  enableLazyLoading: boolean;
  batchSize: number;
  cacheSize: number;
  enableVirtualization: boolean;
  debounceDelay: number;
  enableOfflineOptimization: boolean;
}

class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private config: OptimizationConfig;
  private performanceObserver?: PerformanceObserver;
  private memoryCheckInterval?: NodeJS.Timeout;
  private metrics: PerformanceMetrics[] = [];

  public static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  constructor() {
    this.config = this.getOptimizationConfig();
    this.initializePerformanceMonitoring();
    this.optimizeForTabletDevice();
  }

  private getOptimizationConfig(): OptimizationConfig {
    return {
      enableImageCompression: import.meta.env.VITE_ENABLE_IMAGE_OPTIMIZATION !== 'false',
      maxImageQuality: Number(import.meta.env.VITE_IMAGE_COMPRESSION_QUALITY) || 0.8,
      enableLazyLoading: true,
      batchSize: Number(import.meta.env.VITE_SYNC_BATCH_SIZE) || 25,
      cacheSize: this.parseCacheSize(import.meta.env.VITE_MAX_CACHE_SIZE) || 100 * 1024 * 1024, // 100MB
      enableVirtualization: true,
      debounceDelay: 300,
      enableOfflineOptimization: import.meta.env.VITE_ENABLE_OFFLINE_CACHE !== 'false'
    };
  }

  private parseCacheSize(sizeStr: string): number {
    if (!sizeStr) return 100 * 1024 * 1024; // Default 100MB

    const match = sizeStr.match(/^(\d+)(MB|GB|KB)?$/i);
    if (!match) return 100 * 1024 * 1024;

    const value = Number.parseInt(match[1]);
    const unit = (match[2] || 'MB').toUpperCase();

    switch (unit) {
      case 'KB': return value * 1024;
      case 'MB': return value * 1024 * 1024;
      case 'GB': return value * 1024 * 1024 * 1024;
      default: return value;
    }
  }

  private initializePerformanceMonitoring(): void {
    // Monitor rendering performance
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            this.recordMetric({
              renderTime: entry.duration,
              memoryUsage: this.getMemoryUsage(),
              networkLatency: this.getNetworkLatency(),
              storageUsage: this.getStorageUsage(),
              batteryLevel: this.getBatteryLevel(),
              connectionType: this.getConnectionType()
            });
          }
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Monitor memory usage periodically
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  private optimizeForTabletDevice(): void {
    // Detect if running on a tablet
    if (this.isTabletDevice()) {
      console.log('🏪 Tablet device detected - applying optimizations');

      // Enable touch optimizations
      this.enableTouchOptimizations();

      // Optimize for larger screens
      this.optimizeForLargeScreens();

      // Enable battery-aware optimizations
      this.enableBatteryOptimizations();

      // Optimize network usage
      this.optimizeNetworkUsage();
    }
  }

  private isTabletDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenSize = window.screen.width >= 768 && window.screen.height >= 1024;

    return hasTouch && screenSize && (
      userAgent.includes('ipad') ||
      userAgent.includes('android') ||
      userAgent.includes('tablet')
    );
  }

  private enableTouchOptimizations(): void {
    if (import.meta.env.VITE_ENABLE_TOUCH_OPTIMIZATION !== 'false') {
      // Add touch-friendly CSS classes
      document.body.classList.add('touch-optimized');

      // Increase touch target sizes
      const style = document.createElement('style');
      style.textContent = `
        .touch-optimized button,
        .touch-optimized input,
        .touch-optimized select {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }

        .touch-optimized .card {
          margin-bottom: 16px;
        }

        .touch-optimized .form-field {
          margin-bottom: 12px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private optimizeForLargeScreens(): void {
    // Adjust layout for tablets
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const handleScreenSize = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.body.classList.add('large-screen');
        // Enable virtualization for large lists
        this.enableVirtualization();
      } else {
        document.body.classList.remove('large-screen');
      }
    };

    mediaQuery.addListener(handleScreenSize);
    handleScreenSize(mediaQuery);
  }

  private enableBatteryOptimizations(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const optimizeBattery = () => {
          if (battery.level < 0.2) {
            // Low battery mode
            console.log('🔋 Low battery detected - enabling power saving mode');
            this.enablePowerSavingMode();
          } else if (battery.level > 0.8) {
            // High battery mode
            this.disablePowerSavingMode();
          }
        };

        battery.addEventListener('levelchange', optimizeBattery);
        battery.addEventListener('chargingchange', optimizeBattery);
        optimizeBattery();
      });
    }
  }

  private enablePowerSavingMode(): void {
    document.body.classList.add('power-saving-mode');

    // Reduce animation duration
    const style = document.createElement('style');
    style.id = 'power-saving-styles';
    style.textContent = `
      .power-saving-mode * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }

      .power-saving-mode .traditional-pattern-bg {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  private disablePowerSavingMode(): void {
    document.body.classList.remove('power-saving-mode');
    const existingStyle = document.getElementById('power-saving-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  private optimizeNetworkUsage(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      const optimizeForConnection = () => {
        const effectiveType = connection.effectiveType;

        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            this.enableLowBandwidthMode();
            break;
          case '3g':
            this.enableModerateBandwidthMode();
            break;
          default:
            this.enableHighBandwidthMode();
            break;
        }
      };

      connection.addEventListener('change', optimizeForConnection);
      optimizeForConnection();
    }
  }

  private enableLowBandwidthMode(): void {
    console.log('📶 Low bandwidth detected - optimizing for 2G');
    this.config.enableImageCompression = true;
    this.config.maxImageQuality = 0.5;
    this.config.batchSize = 5;
  }

  private enableModerateBandwidthMode(): void {
    console.log('📶 Moderate bandwidth detected - optimizing for 3G');
    this.config.enableImageCompression = true;
    this.config.maxImageQuality = 0.7;
    this.config.batchSize = 15;
  }

  private enableHighBandwidthMode(): void {
    console.log('📶 High bandwidth detected - full optimization');
    this.config.maxImageQuality = 0.9;
    this.config.batchSize = 25;
  }

  // Image optimization methods
  public async optimizeImage(file: File, maxWidth = 1024, maxHeight = 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', this.config.maxImageQuality);
          resolve(compressedDataUrl);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Virtualization for large lists
  private enableVirtualization(): void {
    if (this.config.enableVirtualization) {
      // Add intersection observer for lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              element.classList.add('visible');
              observer.unobserve(element);
            }
          }
        },
        { rootMargin: '100px' }
      );

      // Observe all virtualized elements
      for (const el of document.querySelectorAll('[data-virtualized]')) {
        observer.observe(el);
      }
    }
  }

  // Debounced operations
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = this.config.debounceDelay
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Batch processing for large datasets
  public async processInBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = this.config.batchSize
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);

      // Allow browser to breathe between batches
      await this.nextTick();
    }

    return results;
  }

  private nextTick(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  // Memory management
  private checkMemoryUsage(): void {
    const memoryUsage = this.getMemoryUsage();
    const threshold = 0.8; // 80% of available memory

    if (memoryUsage > threshold) {
      console.warn('🧠 High memory usage detected - cleaning up');
      this.performMemoryCleanup();
    }
  }

  private performMemoryCleanup(): void {
    // Clear image caches
    const images = document.querySelectorAll('img');
    for (const img of images) {
      if (!this.isElementVisible(img)) {
        img.src = '';
      }
    }

    // Clear IndexedDB cache if needed
    this.cleanupIndexedDBCache();

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  private async cleanupIndexedDBCache(): Promise<void> {
    try {
      const cacheUsage = await this.getCacheUsage();
      if (cacheUsage > this.config.cacheSize) {
        // Implement cache cleanup logic
        console.log('🧹 Cleaning up IndexedDB cache');
        // This would be implemented based on your specific caching strategy
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  // Performance metrics
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
    return 0;
  }

  private getNetworkLatency(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
  }

  private getStorageUsage(): number {
    let totalSize = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
    } catch (error) {
      console.warn('Failed to calculate storage usage:', error);
    }
    return totalSize;
  }

  private getBatteryLevel(): number | undefined {
    // This would be set by the battery API when available
    return undefined;
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection;
    return connection ? connection.effectiveType : 'unknown';
  }

  private async getCacheUsage(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Public API
  public getPerformanceReport(): any {
    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length;
    const avgMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;

    return {
      averageRenderTime: avgRenderTime || 0,
      averageMemoryUsage: avgMemoryUsage || 0,
      currentConfig: this.config,
      isTabletOptimized: this.isTabletDevice(),
      connectionType: this.getConnectionType(),
      recommendations: this.getPerformanceRecommendations()
    };
  }

  private getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.getMemoryUsage() > 0.7) {
      recommendations.push('Consider clearing browser cache to improve memory usage');
    }

    if (this.getConnectionType() === '2g' || this.getConnectionType() === 'slow-2g') {
      recommendations.push('Slow connection detected - image quality has been reduced automatically');
    }

    if (!this.isTabletDevice()) {
      recommendations.push('For optimal experience, use a tablet device with touch support');
    }

    return recommendations;
  }

  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

export const performanceOptimizationService = PerformanceOptimizationService.getInstance();
