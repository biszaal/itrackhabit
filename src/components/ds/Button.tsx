import React from 'react';
import { Pressable, Text, View, ActivityIndicator, ViewStyle, TextStyle, GestureResponderEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title?: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
  iconOnly?: boolean;
  /**
   * Screen-reader name. Required in practice for `iconOnly` buttons, which
   * have no text to fall back on.
   */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth,
  style,
  textStyle,
  children,
  iconOnly,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const t = useTheme();

  const height = size === 'lg' ? 56 : size === 'sm' ? 38 : 52;
  const padH = iconOnly ? 0 : size === 'sm' ? 16 : 20;
  const width = iconOnly ? height : undefined;

  let bg = t.colors.primary;
  let fg = '#FFFFFF';
  let borderColor: string | undefined;
  let shadow: any = t.shadow.pill;

  if (variant === 'secondary') {
    bg = t.colors.bgPaper;
    fg = t.colors.ink;
    shadow = undefined;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    fg = t.colors.ink2;
    borderColor = t.colors.line;
    shadow = undefined;
  } else if (variant === 'danger') {
    bg = t.colors.danger;
    fg = '#FFFFFF';
    shadow = undefined;
  }

  const base: ViewStyle = {
    height,
    paddingHorizontal: padH,
    width: fullWidth ? '100%' : width,
    borderRadius: t.radius.pill,
    backgroundColor: bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    borderWidth: borderColor ? 1 : 0,
    borderColor,
  };

  const txt: TextStyle = {
    color: fg,
    fontSize: size === 'sm' ? 14 : 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [base, shadow, pressed && { opacity: 0.85 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {leftIcon && <View>{leftIcon}</View>}
          {(title || children) && <Text style={[txt, textStyle]}>{title ?? children}</Text>}
          {rightIcon && <View>{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
};
