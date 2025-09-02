import React, { useState } from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { createNeumorphismStyle, NeumorphismSize, NeumorphismColors } from '../../theme/neumorphism';
import { theme } from '../../theme';

interface NeumorphButtonProps {
  children?: React.ReactNode;
  title?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary';
  size?: NeumorphismSize;
  disabled?: boolean;
  glassIntensity?: 'subtle' | 'light' | 'medium' | 'strong'; // Glass compatibility - ignored
}

export const NeumorphButton: React.FC<NeumorphButtonProps> = ({
  children,
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  glassIntensity, // Ignored but accepted for compatibility
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const neumorphStyle = createNeumorphismStyle(
    isPressed ? 'pressed' : 'convex', 
    size,
    variant === 'primary' ? NeumorphismColors.primary : NeumorphismColors.surface
  );
  
  const paddingSize = size === 'small' ? 8 : size === 'large' ? 16 : 12;
  
  return (
    <TouchableOpacity 
      style={[
        neumorphStyle, 
        { 
          paddingHorizontal: paddingSize * 1.5,
          paddingVertical: paddingSize,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.6 : 1,
        }, 
        style
      ]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      activeOpacity={1}
    >
      {children || (
        <Text style={[
          { 
            color: variant === 'primary' ? NeumorphismColors.lightShadow : NeumorphismColors.text,
            fontSize: size === 'small' ? theme.fontSize.sm : size === 'large' ? theme.fontSize.lg : theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold
          }, 
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};