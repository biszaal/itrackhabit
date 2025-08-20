import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface SimpleFABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: any;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const SimpleFAB: React.FC<SimpleFABProps> = ({
  onPress,
  icon = 'add',
  color = theme.colors.primary,
  style,
}) => {
  const scale = useSharedValue(1);

  // Handle press with simple scale animation
  const handlePress = () => {
    scale.value = withTiming(0.9, { duration: 100 });
    
    setTimeout(() => {
      scale.value = withSpring(1);
      onPress();
    }, 100);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedTouchableOpacity
      style={[styles.fab, { backgroundColor: color }, animatedStyle, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={28} color={theme.colors.white} />
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.floating,
  },
});