import React from 'react';
import { TextInput, TextInputProps, StyleProp, TextStyle } from 'react-native';
import { createNeumorphismStyle, NeumorphismSize, NeumorphismColors } from '../../theme/neumorphism';
import { theme } from '../../theme';

interface NeumorphInputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
  size?: NeumorphismSize;
  glassIntensity?: 'subtle' | 'light' | 'medium' | 'strong'; // Glass compatibility - ignored
}

export const NeumorphInput: React.FC<NeumorphInputProps> = ({
  style,
  size = 'medium',
  glassIntensity, // Ignored but accepted for compatibility
  ...props
}) => {
  const neumorphStyle = createNeumorphismStyle('concave', size, NeumorphismColors.surface);
  
  const paddingSize = size === 'small' ? 8 : size === 'large' ? 16 : 12;
  
  return (
    <TextInput
      style={[
        neumorphStyle,
        {
          paddingHorizontal: paddingSize,
          paddingVertical: paddingSize,
          fontSize: size === 'small' ? theme.fontSize.sm : size === 'large' ? theme.fontSize.lg : theme.fontSize.md,
          color: NeumorphismColors.text,
          minHeight: paddingSize * 3.5,
        },
        style,
      ]}
      placeholderTextColor={NeumorphismColors.textMuted}
      {...props}
    />
  );
};