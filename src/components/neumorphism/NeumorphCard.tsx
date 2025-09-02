import React from 'react';
import { View, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { createNeumorphismStyle, NeumorphismVariant, NeumorphismSize } from '../../theme/neumorphism';

interface NeumorphCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: NeumorphismVariant | 'subtle' | 'light' | 'medium' | 'strong'; // Glass compatibility
  intensity?: NeumorphismVariant; // Glass compatibility
  size?: NeumorphismSize;
  color?: string;
  colorType?: string; // Glass compatibility - ignored
  animated?: boolean; // Ignored but accepted for compatibility
  padding?: number; // Custom padding
  onPress?: () => void; // Added onPress support
}

export const NeumorphCard: React.FC<NeumorphCardProps> = ({
  children,
  style,
  variant,
  intensity,
  size = 'medium',
  color,
  colorType, // Ignored
  animated, // Ignored
  padding,
  onPress
}) => {
  // Convert glass variant names to neumorphism variants
  const getNeumorphVariant = (): NeumorphismVariant => {
    if (intensity) return intensity;
    if (variant === 'subtle' || variant === 'light') return 'flat';
    if (variant === 'medium') return 'convex';
    if (variant === 'strong') return 'convex';
    return (variant as NeumorphismVariant) || 'convex';
  };

  const neumorphStyle = createNeumorphismStyle(getNeumorphVariant(), size, color);
  
  const defaultPadding = padding !== undefined ? padding : 
    (size === 'small' ? 12 : size === 'large' ? 24 : 16);

  const cardStyle = [
    neumorphStyle, 
    { 
      padding: defaultPadding,
      margin: 8,
    }, 
    style
  ];

  // If onPress is provided, use TouchableOpacity, otherwise use View
  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};