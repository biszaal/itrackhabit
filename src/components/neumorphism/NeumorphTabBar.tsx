import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNeumorphismStyle, NeumorphismColors } from '../../theme/neumorphism';
import { theme } from '../../theme';

export const NeumorphTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Home':
        return focused ? 'home' : 'home-outline';
      case 'Calendar':
        return focused ? 'calendar' : 'calendar-outline';
      case 'Challenges':
        return focused ? 'trophy' : 'trophy-outline';
      case 'Friends':
        return focused ? 'people' : 'people-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'help-outline';
    }
  };

  return (
    <View style={[
      styles.container,
      { paddingBottom: insets.bottom + 20 }
    ]}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Create neumorphism style based on focus state
          const neumorphStyle = createNeumorphismStyle(
            isFocused ? 'pressed' : 'convex',
            'medium',
            NeumorphismColors.surface
          );

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                neumorphStyle,
                isFocused && styles.activeTab
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={26}
                color={isFocused ? '#667eea' : NeumorphismColors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingTop: 20,
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: NeumorphismColors.background,
    marginHorizontal: theme.spacing.md,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    // Enhanced neumorphism container
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    // Light shadow for dual effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    // Individual button styling handled by createNeumorphismStyle
    margin: 2,
  },
  activeTab: {
    // Additional styling for active tab if needed
    transform: [{ scale: 0.95 }], // Pressed effect
  },
});