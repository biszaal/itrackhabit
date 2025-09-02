// Network Service for detecting online/offline state
// Manages network connectivity and triggers sync when online

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineStorage } from './OfflineStorage';

type NetworkChangeCallback = (isConnected: boolean) => void;
type SyncCallback = () => Promise<void>;

class NetworkService {
  private isConnected = false;
  private listeners: NetworkChangeCallback[] = [];
  private syncCallbacks: SyncCallback[] = [];
  private unsubscribe: (() => void) | null = null;

  async initialize(): Promise<void> {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;
    
    console.log('Network Service initialized. Connected:', this.isConnected);

    // Set up network state listener
    this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange.bind(this));
  }

  private handleNetworkChange(state: NetInfoState): void {
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected ?? false;

    console.log('Network state changed:', {
      wasConnected,
      nowConnected: this.isConnected,
      type: state.type,
      details: state.details
    });

    // Notify listeners
    this.listeners.forEach(callback => {
      try {
        callback(this.isConnected);
      } catch (error) {
        console.error('Error in network change callback:', error);
      }
    });

    // Trigger sync when coming back online
    if (!wasConnected && this.isConnected) {
      this.triggerSync();
    }
  }

  private async triggerSync(): Promise<void> {
    console.log('Triggering sync due to network reconnection');
    
    // Wait a bit for the connection to stabilize
    setTimeout(async () => {
      for (const callback of this.syncCallbacks) {
        try {
          await callback();
        } catch (error) {
          console.error('Error in sync callback:', error);
        }
      }
    }, 2000);
  }

  // Check if device is currently connected
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get detailed network information
  async getNetworkInfo(): Promise<NetInfoState> {
    return NetInfo.fetch();
  }

  // Add listener for network changes
  addNetworkListener(callback: NetworkChangeCallback): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Add callback for sync operations
  addSyncCallback(callback: SyncCallback): () => void {
    this.syncCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.syncCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncCallbacks.splice(index, 1);
      }
    };
  }

  // Force refresh network state
  async refresh(): Promise<boolean> {
    const state = await NetInfo.fetch();
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected ?? false;

    if (wasConnected !== this.isConnected) {
      this.listeners.forEach(callback => callback(this.isConnected));
    }

    return this.isConnected;
  }

  // Check if specific host is reachable
  async isHostReachable(url: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Host unreachable:', url, error);
      return false;
    }
  }

  // Get network quality/speed estimation
  async getNetworkQuality(): Promise<'excellent' | 'good' | 'fair' | 'poor' | 'unknown'> {
    const state = await NetInfo.fetch();
    
    if (!state.isConnected) return 'poor';

    if (state.type === 'wifi') {
      return 'excellent';
    } else if (state.type === 'cellular') {
      // Check cellular generation if available
      if (state.details && 'cellularGeneration' in state.details) {
        switch (state.details.cellularGeneration) {
          case '5g': return 'excellent';
          case '4g': return 'good';
          case '3g': return 'fair';
          case '2g': return 'poor';
          default: return 'good';
        }
      }
      return 'good'; // Default for cellular
    }

    return 'unknown';
  }

  // Wait for network connection
  async waitForConnection(timeout = 30000): Promise<boolean> {
    if (this.isConnected) return true;

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (this.isConnected) {
          resolve(true);
        } else if (Date.now() - startTime >= timeout) {
          resolve(false);
        } else {
          setTimeout(checkConnection, 1000);
        }
      };

      checkConnection();
    });
  }

  // Dispose of listeners
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.listeners = [];
    this.syncCallbacks = [];
  }
}

export const networkService = new NetworkService();