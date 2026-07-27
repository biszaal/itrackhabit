import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface Props {
  /** Override the resolved label. Leave unset to reflect real network state. */
  label?: string;
  /** Override the resolved online state. Mainly for tests. */
  online?: boolean;
}

/**
 * Connection status pill. Reads live network state — an indicator that always
 * claims the same thing is worse than no indicator, since it trains the user
 * to ignore it.
 */
export const OfflinePill: React.FC<Props> = ({ label, online }) => {
  const t = useTheme();
  const detected = useNetworkStatus();
  const isOnline = online ?? detected;

  const text = label ?? (isOnline ? 'Synced' : 'Offline');
  // Amber reads as a warning, so it belongs to the offline case only.
  const dotColor = isOnline ? t.colors.success : t.colors.amber;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={isOnline ? 'Synced, you are online' : 'Offline, changes will sync later'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: t.colors.bgPaper,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: dotColor,
        }}
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: t.colors.ink3,
        }}
      >
        {text}
      </Text>
    </View>
  );
};
