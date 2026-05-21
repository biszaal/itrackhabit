// Compatibility shim — preserves the NeumorphCard API but renders the new
// design-system Card. No more neumorphic shadows.
import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Card } from '../ds/Card';

interface NeumorphCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: string;
  intensity?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  colorType?: string;
  animated?: boolean;
  padding?: number;
  onPress?: () => void;
}

export const NeumorphCard: React.FC<NeumorphCardProps> = ({
  children,
  style,
  variant,
  size = 'medium',
  padding,
  onPress,
}) => {
  const defaultPadding = padding ?? (size === 'small' ? 12 : size === 'large' ? 24 : 16);

  // Map variants → Card variants. Old "concave"/"flat"/"pressed" all fall to flat paper.
  const cardVariant =
    variant === 'flat' || variant === 'concave' || variant === 'pressed' || variant === 'subtle'
      ? 'flat'
      : 'elevated';

  const content = (
    <Card variant={cardVariant} padding={defaultPadding} style={[{ margin: 8 } as ViewStyle, style]}>
      {children}
    </Card>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
        {content}
      </Pressable>
    );
  }
  return content;
};
