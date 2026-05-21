import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Chip: React.FC<Props> = ({ label, icon, active, onPress, color, style, textStyle }) => {
  const t = useTheme();

  const bg = active ? t.colors.ink : t.colors.bgPaper;
  const fg = active ? t.colors.bg : color ?? t.colors.ink2;

  const base: ViewStyle = {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: t.radius.chip,
    backgroundColor: bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  };

  const txt: TextStyle = {
    color: fg,
    fontSize: 12,
    fontWeight: '600',
  };

  const inner = (
    <View style={[base, style]}>
      {icon}
      <Text style={[txt, textStyle]}>{label}</Text>
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
};
