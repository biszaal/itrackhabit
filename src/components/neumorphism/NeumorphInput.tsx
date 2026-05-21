// Compatibility shim — preserves NeumorphInput API but renders a flat input
// styled with the new design tokens.
import React from 'react';
import { TextInput, TextInputProps, StyleProp, TextStyle } from 'react-native';
import { lightPalette } from '../../theme/tokens';

interface NeumorphInputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
  size?: 'small' | 'medium' | 'large';
  glassIntensity?: string;
}

export const NeumorphInput: React.FC<NeumorphInputProps> = ({
  style,
  size = 'medium',
  glassIntensity,
  ...props
}) => {
  const padV = size === 'small' ? 10 : size === 'large' ? 18 : 14;
  const padH = 16;
  const minH = size === 'small' ? 40 : size === 'large' ? 56 : 48;

  return (
    <TextInput
      {...props}
      placeholderTextColor={lightPalette.ink3}
      style={[
        {
          backgroundColor: lightPalette.bgPaper,
          borderRadius: 14,
          paddingHorizontal: padH,
          paddingVertical: padV,
          minHeight: minH,
          color: lightPalette.ink,
          fontSize: size === 'small' ? 13 : size === 'large' ? 17 : 15,
        },
        style,
      ]}
    />
  );
};
