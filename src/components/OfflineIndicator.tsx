// Simplified Offline Indicator Component
// Shows minimal network status indicator

import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

interface OfflineIndicatorProps {
  style?: any;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ style }) => {
  const { isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  // Only show when offline or not authenticated
  if (isOnline && isAuthenticated) {
    return null;
  }

  const getStatusColor = (): string => {
    if (!isOnline) return theme.colors.error;
    if (!isAuthenticated) return theme.colors.warning;
    return theme.colors.success;
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!isOnline) return 'cloud-offline';
    if (!isAuthenticated) return 'person-outline';
    return 'cloud-done';
  };

  return (
    <TouchableOpacity style={[styles.container, style]}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]}>
        <Ionicons name={getStatusIcon()} size={14} color={theme.colors.white} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});