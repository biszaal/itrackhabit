import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from './Card';

interface Props {
  title?: string;
  message?: string;
}

// Shown on screens whose features depend on a backend that is currently
// disabled (LOCAL_ONLY mode). Renders as a centered empty state.
export const OfflineNotice: React.FC<Props> = ({
  title = 'Available when online',
  message = 'This area syncs with the cloud and is paused while running locally. Your habits and progress still work.',
}) => {
  const t = useTheme();
  return (
    <Card variant="flat" padding={28} style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: t.colors.bgElev,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="cloud-offline-outline" size={28} color={t.colors.ink2} />
      </View>
      <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>{title}</Text>
      <Text style={{ color: t.colors.ink2, fontSize: 13, textAlign: 'center', maxWidth: 300 }}>{message}</Text>
    </Card>
  );
};
