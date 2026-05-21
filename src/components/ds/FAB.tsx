import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  bottom?: number;
  style?: ViewStyle;
}

export const FAB: React.FC<Props> = ({ onPress, icon = 'add', bottom, style }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const b = bottom ?? insets.bottom + 88; // sit above tab bar

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          position: 'absolute',
          right: 20,
          bottom: b,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: t.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: t.colors.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.45,
          shadowRadius: 28,
          elevation: 10,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={26} color="#FFFFFF" />
    </Pressable>
  );
};
