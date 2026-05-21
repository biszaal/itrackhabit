import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: string;
}

export const Stat: React.FC<Props> = ({ label, value, suffix, accent }) => {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.6,
          color: accent ?? t.colors.ink,
        }}
      >
        {value}
        {suffix && (
          <Text style={{ fontSize: 14, fontWeight: '500', color: t.colors.ink3 }}>{suffix}</Text>
        )}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: t.colors.ink3,
          textTransform: 'uppercase',
          letterSpacing: 0.7,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
};
