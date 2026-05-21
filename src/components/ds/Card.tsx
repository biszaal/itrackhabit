import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type Variant = 'elevated' | 'flat' | 'sunken';

interface Props extends ViewProps {
  variant?: Variant;
  padding?: number;
  radius?: number;
}

export const Card: React.FC<Props> = ({
  variant = 'elevated',
  padding,
  radius,
  style,
  children,
  ...rest
}) => {
  const t = useTheme();
  const bg =
    variant === 'flat'
      ? t.colors.bgPaper
      : variant === 'sunken'
      ? t.colors.bgSunken
      : t.colors.bgElev;

  const base: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius ?? t.radius.card,
    padding,
  };

  const shadow = variant === 'elevated' ? t.shadow.sh2 : undefined;
  const border = variant !== 'elevated' ? { borderWidth: 0 } : undefined;

  return (
    <View {...rest} style={[base, shadow, border, style]}>
      {children}
    </View>
  );
};

export const HR: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const t = useTheme();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: t.colors.lineSoft, marginVertical: 16 },
        style,
      ]}
    />
  );
};
