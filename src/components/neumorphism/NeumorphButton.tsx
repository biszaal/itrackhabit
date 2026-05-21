// Compatibility shim — preserves NeumorphButton API, renders DS Button.
import React from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Button } from '../ds/Button';

interface NeumorphButtonProps {
  children?: React.ReactNode;
  title?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  glassIntensity?: string;
}

export const NeumorphButton: React.FC<NeumorphButtonProps> = ({
  children,
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
  disabled,
}) => {
  const dsSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md';
  const dsVariant = variant === 'secondary' ? 'secondary' : 'primary';

  return (
    <Button
      title={typeof children === 'string' ? children : title}
      onPress={onPress}
      variant={dsVariant}
      size={dsSize}
      disabled={disabled}
      style={style as ViewStyle | undefined}
      textStyle={textStyle as TextStyle | undefined}
    >
      {typeof children === 'string' ? undefined : (children as any)}
    </Button>
  );
};
