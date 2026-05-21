import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  label?: string;
}

export const OfflinePill: React.FC<Props> = ({ label = 'Offline' }) => {
  const t = useTheme();
  return (
    <View
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
          backgroundColor: t.colors.amber,
        }}
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: t.colors.ink3,
        }}
      >
        {label}
      </Text>
    </View>
  );
};
