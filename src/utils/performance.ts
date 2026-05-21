/**
 * Performance monitoring and optimization utilities
 */
import React from 'react';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private timers: Map<string, number> = new Map();
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  /**
   * End timing and record the duration
   */
  endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer "${label}" was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    // Store metric for analysis
    const existing = this.metrics.get(label) || [];
    existing.push(duration);
    this.metrics.set(label, existing);

    console.log(`⏱️  ${label}: ${duration}ms`);
    return duration;
  }

  /**
   * Get performance statistics for a label
   */
  getStats(label: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const durations = this.metrics.get(label);
    if (!durations || durations.length === 0) {
      return null;
    }

    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return { avg, min, max, count: durations.length };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.timers.clear();
    this.metrics.clear();
  }

  /**
   * Get all metrics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [label] of this.metrics) {
      stats[label] = this.getStats(label);
    }

    return stats;
  }
}

/**
 * HOC for measuring component render time
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const ComponentWithMonitoring = (props: P) => {
    const monitor = PerformanceMonitor.getInstance();
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name;

    React.useEffect(() => {
      monitor.startTimer(`${name}_render`);
      return () => {
        monitor.endTimer(`${name}_render`);
      };
    });

    return React.createElement(WrappedComponent, props);
  };

  ComponentWithMonitoring.displayName = `withPerformanceMonitoring(${
    componentName || WrappedComponent.displayName || WrappedComponent.name
  })`;

  return ComponentWithMonitoring;
};

/**
 * Hook for measuring function execution time
 */
export const usePerformanceTimer = (label: string) => {
  const monitor = PerformanceMonitor.getInstance();

  return {
    start: () => monitor.startTimer(label),
    end: () => monitor.endTimer(label),
    getStats: () => monitor.getStats(label)
  };
};

/**
 * Debounce utility function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T => {
  let timeout: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  }) as T;
};

/**
 * Throttle utility function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

/**
 * Memoization utility
 */
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Batch processor for reducing API calls
 */
export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly delay: number;
  private readonly processor: (items: T[]) => Promise<R[]>;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item);

      // Clear existing timer
      if (this.timer) {
        clearTimeout(this.timer);
      }

      // Process if batch is full
      if (this.queue.length >= this.batchSize) {
        this.processBatch().then(results => {
          const index = this.queue.length - results.length;
          resolve(results[index]);
        }).catch(reject);
      } else {
        // Set timer for delayed processing
        this.timer = setTimeout(() => {
          this.processBatch().then(results => {
            const index = this.queue.findIndex(i => i === item);
            if (index !== -1) {
              resolve(results[index]);
            }
          }).catch(reject);
        }, this.delay);
      }
    });
  }

  private async processBatch(): Promise<R[]> {
    if (this.queue.length === 0) return [];

    const batch = [...this.queue];
    this.queue = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    return await this.processor(batch);
  }
}

/**
 * Memory usage monitor (React Native specific)
 */
export const getMemoryUsage = async (): Promise<{
  used: number;
  total: number;
  percentage: number;
}> => {
  try {
    // This would need react-native-device-info package
    // const DeviceInfo = require('react-native-device-info');
    // const totalMemory = await DeviceInfo.getTotalMemory();
    // const usedMemory = await DeviceInfo.getUsedMemory();
    
    // Mock implementation for now
    const totalMemory = 4 * 1024 * 1024 * 1024; // 4GB
    const usedMemory = 2 * 1024 * 1024 * 1024; // 2GB
    
    return {
      used: usedMemory,
      total: totalMemory,
      percentage: (usedMemory / totalMemory) * 100
    };
  } catch (error) {
    console.warn('Memory usage monitoring not available:', error);
    return { used: 0, total: 0, percentage: 0 };
  }
};

/**
 * Network performance monitor
 */
export class NetworkMonitor {
  private static requestTimes: Map<string, number> = new Map();

  static startRequest(requestId: string): void {
    this.requestTimes.set(requestId, Date.now());
  }

  static endRequest(requestId: string, url: string): void {
    const startTime = this.requestTimes.get(requestId);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`🌐 Network request to ${url}: ${duration}ms`);
      this.requestTimes.delete(requestId);
    }
  }
}