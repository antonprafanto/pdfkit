/**
 * Performance Utilities
 * Memory management, caching, and optimization helpers
 */

// Memory usage tracking
export const MemoryManager = {
  // Track current memory usage
  getMemoryUsage(): { used: number; limit: number; percentage: number } | null {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  },

  // Format bytes to human readable
  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  },

  // Log memory status
  logMemoryStatus(): void {
    const usage = this.getMemoryUsage();
    if (usage) {
      console.log(`[Memory] ${this.formatBytes(usage.used)} / ${this.formatBytes(usage.limit)} (${usage.percentage.toFixed(1)}%)`);
    }
  },

  // Check if memory is getting high (above 80%)
  isMemoryHigh(): boolean {
    const usage = this.getMemoryUsage();
    return usage ? usage.percentage > 80 : false;
  },
};

// Simple LRU Cache for page renders
export class LRUCache<T> {
  private cache: Map<string, T> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Page render cache
export const pageRenderCache = new LRUCache<string>(30); // Cache 30 page renders

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lazy loading helper for images/pages
export function lazyLoad(
  element: HTMLElement,
  callback: () => void,
  options: IntersectionObserverInit = {}
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, {
    rootMargin: '100px',
    threshold: 0,
    ...options,
  });

  observer.observe(element);

  return () => observer.disconnect();
}

// Request idle callback polyfill
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (window as any).requestIdleCallback
    : (cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) =>
        setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 1);

// Cancel idle callback polyfill
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? (window as any).cancelIdleCallback
    : clearTimeout;

// Run task when browser is idle
export function runWhenIdle(task: () => void): void {
  requestIdleCallback(() => task());
}

// Batch DOM updates
export function batchUpdate(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

// Performance measurement
export const PerfMeasure = {
  marks: new Map<string, number>(),

  start(name: string): void {
    this.marks.set(name, performance.now());
  },

  end(name: string): number {
    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      console.warn(`[Perf] No start mark found for: ${name}`);
      return 0;
    }
    const duration = performance.now() - startTime;
    this.marks.delete(name);
    console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  },
};

// Startup time tracker
export const StartupTimer = {
  startTime: Date.now(),

  markReady(): void {
    const duration = Date.now() - this.startTime;
    console.log(`[Startup] App ready in ${duration}ms`);
  },

  getDuration(): number {
    return Date.now() - this.startTime;
  },
};
