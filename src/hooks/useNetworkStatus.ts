import { useEffect, useState } from 'react';
import { networkService } from '../services/core';

/**
 * Live online/offline state from NetworkService.
 *
 * Seeds from the service's current value so the first paint is already
 * correct, then follows change events for as long as the caller is mounted.
 */
export const useNetworkStatus = (): boolean => {
  const [online, setOnline] = useState<boolean>(() =>
    networkService.getConnectionStatus()
  );

  useEffect(() => {
    // Re-sync on mount: the service may have connected between render and
    // effect, or been initialised after this component first mounted.
    setOnline(networkService.getConnectionStatus());
    const unsubscribe = networkService.addNetworkListener(setOnline);
    return unsubscribe;
  }, []);

  return online;
};
