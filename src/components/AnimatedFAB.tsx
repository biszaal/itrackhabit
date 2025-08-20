import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FABMenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress: () => void;
}

interface AnimatedFABProps {
  items: FABMenuItem[];
  primaryIcon?: keyof typeof Ionicons.glyphMap;
  primaryColor?: string;
  style?: any;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedFAB: React.FC<AnimatedFABProps> = ({
  items,
  primaryIcon = 'add',
  primaryColor = theme.colors.primary,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const menuOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Toggle menu
  const toggleMenu = () => {
    const newExpandedState = !isExpanded;
    
    if (newExpandedState) {
      // Opening animation
      rotation.value = withSpring(45);
      menuOpacity.value = withTiming(1, { duration: theme.animation.duration.normal });
      backdropOpacity.value = withTiming(0.3, { duration: theme.animation.duration.normal });
    } else {
      // Closing animation
      rotation.value = withSpring(0);
      menuOpacity.value = withTiming(0, { duration: theme.animation.duration.fast });
      backdropOpacity.value = withTiming(0, { duration: theme.animation.duration.fast });
    }
    
    setIsExpanded(newExpandedState);
  };

  // Main FAB animated styles
  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  // Backdrop animated style
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
      pointerEvents: backdropOpacity.value > 0 ? 'auto' : 'none',
    };
  });

  // Menu container animated style
  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: menuOpacity.value,
      transform: [
        { 
          scale: interpolate(
            menuOpacity.value,
            [0, 1],
            [0.8, 1]
          )
        },
      ],
    };
  });

  // Handle FAB press
  const handleFABPress = () => {
    scale.value = withSpring(0.95);
    
    setTimeout(() => {
      scale.value = withSpring(1);
      runOnJS(toggleMenu)();
    }, 100);
  };

  // Handle menu item press
  const handleMenuItemPress = (item: FABMenuItem) => {
    // Close menu first
    rotation.value = withSpring(0);
    menuOpacity.value = withTiming(0, { duration: theme.animation.duration.fast });
    backdropOpacity.value = withTiming(0, { duration: theme.animation.duration.fast });
    
    setIsExpanded(false);
    
    // Execute callback
    setTimeout(() => {
      item.onPress();
    }, theme.animation.duration.fast);
  };

  // Render menu item
  const renderMenuItem = (item: FABMenuItem, index: number) => {
    const itemScale = useSharedValue(0);
    const itemTranslateY = useSharedValue(20);

    // Animate item entrance
    React.useEffect(() => {
      if (isExpanded) {
        const delay = index * 50;
        itemScale.value = withDelay(delay, withSpring(1));
        itemTranslateY.value = withDelay(delay, withSpring(0));
      } else {
        itemScale.value = withTiming(0, { duration: theme.animation.duration.fast });
        itemTranslateY.value = withTiming(20, { duration: theme.animation.duration.fast });
      }
    }, [isExpanded, index]);

    const itemAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: itemScale.value },
          { translateY: itemTranslateY.value },
        ],
      };
    });

    return (
      <Animated.View key={item.id} style={[styles.menuItem, itemAnimatedStyle]}>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemLabel}>{item.label}</Text>
          <TouchableOpacity
            style={[
              styles.menuItemButton,
              { backgroundColor: item.color || theme.colors.primary }
            ]}
            onPress={() => handleMenuItemPress(item)}
          >
            <Ionicons 
              name={item.icon} 
              size={20} 
              color={theme.colors.white} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatedTouchableOpacity
        style={[styles.backdrop, backdropAnimatedStyle]}
        onPress={toggleMenu}
        activeOpacity={1}
      />
      
      {/* Menu items */}
      <Animated.View 
        style={[styles.menuContainer, menuAnimatedStyle]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        {items.map((item, index) => renderMenuItem(item, index))}
      </Animated.View>
      
      {/* Main FAB */}
      <AnimatedTouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: primaryColor },
          fabAnimatedStyle,
          style
        ]}
        onPress={handleFABPress}
      >
        <Ionicons 
          name={primaryIcon} 
          size={28} 
          color={theme.colors.white} 
        />
      </AnimatedTouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.backdrop,
    zIndex: 1,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 100,
    right: theme.spacing.lg,
    zIndex: 2,
  },
  menuItem: {
    marginBottom: theme.spacing.md,
    alignItems: 'flex-end',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    ...theme.shadows.sm,
    minWidth: 100,
    textAlign: 'center',
  },
  menuItemButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    ...theme.shadows.floating,
  },
});