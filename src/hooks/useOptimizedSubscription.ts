import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../config/api';

interface UseOptimizedSubscriptionOptions {
  endpoint: string;
  filter?: Record<string, any>;
  pollInterval?: number;
  enabled?: boolean;
}

interface UpdateBatch {
  eventType: 'UPDATE' | 'REFRESH';
  data?: any;
  timestamp: number;
}

// Note: This hook now uses polling instead of real-time subscriptions
// Real-time subscriptions would be implemented via WebSockets in the backend
export const useOptimizedSubscription = <T>({
  endpoint,
  filter = {},
  pollInterval = 30000, // 30 seconds by default
  enabled = true,
}: UseOptimizedSubscriptionOptions) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const updateBatchRef = useRef<UpdateBatch[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Build query parameters from filter
      const queryParams = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const result = await apiClient.get<T[]>(fullEndpoint);
      
      setData(result);
      lastFetchRef.current = Date.now();
      
      // Add to update batch for change tracking
      updateBatchRef.current.push({
        eventType: 'REFRESH',
        data: result,
        timestamp: Date.now(),
      });
      
    } catch (err) {
      console.error(`Error fetching data from ${endpoint}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (enabled) {
        fetchData();
      }
    }, pollInterval);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Manual refresh function
  const refresh = () => {
    fetchData();
  };

  // Get recent updates (for debugging/monitoring)
  const getRecentUpdates = () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    return updateBatchRef.current.filter(
      update => update.timestamp >= fiveMinutesAgo
    );
  };

  // Clear update history
  const clearUpdateHistory = () => {
    updateBatchRef.current = [];
  };

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    // Initial fetch
    fetchData();
    
    // Start polling if interval is set
    if (pollInterval > 0) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [endpoint, enabled, pollInterval, JSON.stringify(filter)]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    getRecentUpdates,
    clearUpdateHistory,
    lastFetch: lastFetchRef.current,
    isPolling: intervalRef.current !== null,
  };
};

// Specialized hooks for common use cases
export const useHabitsSubscription = (userId?: string) => {
  return useOptimizedSubscription<any>({
    endpoint: '/habits',
    filter: userId ? { userId } : {},
    pollInterval: 30000,
    enabled: !!userId,
  });
};

export const useFriendsSubscription = () => {
  return useOptimizedSubscription<any>({
    endpoint: '/friends',
    pollInterval: 60000, // Less frequent for friends
  });
};

export const useChallengesSubscription = () => {
  return useOptimizedSubscription<any>({
    endpoint: '/challenges',
    pollInterval: 45000,
  });
};

// Hook for real-time notifications (if WebSocket is implemented)
export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  // This would connect to WebSocket for real-time notifications
  // For now, it's just a placeholder that returns empty notifications
  useEffect(() => {
    // TODO: Implement WebSocket connection to backend
    // const ws = new WebSocket('ws://localhost:3001/notifications');
    // ws.onopen = () => setConnected(true);
    // ws.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   setNotifications(prev => [notification, ...prev.slice(0, 99)]);
    // };
    // ws.onclose = () => setConnected(false);
    // return () => ws.close();
    
    console.log('Real-time notifications would be implemented via WebSocket');
  }, []);

  return {
    notifications,
    connected,
    clearNotifications: () => setNotifications([]),
  };
};