import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../theme/ThemeContext';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Calendar: 'calendar',
  Analytics: 'stats-chart',
  Achievements: 'trophy',
  Profile: 'person',
};

const LABELS: Record<string, string> = {
  Home: 'Today',
  Calendar: 'Calendar',
  Analytics: 'Insights',
  Achievements: 'Awards',
  Profile: 'You',
};

const BAR_HEIGHT = 64;
const BAR_PADDING_TOP = 8;
const BAR_MIN_BOTTOM = 16;

/**
 * Space a tab screen must reserve at the bottom of its scroll content so the
 * last row clears the floating tab bar. The bar is absolutely positioned, so
 * it does not shrink the scroll viewport on its own — screens that hardcode a
 * guess here end up with unreachable content.
 */
export const useTabBarHeight = (): number => {
  const insets = useSafeAreaInsets();
  return (
    BAR_PADDING_TOP +
    BAR_HEIGHT +
    (insets.bottom > 0 ? insets.bottom : BAR_MIN_BOTTOM)
  );
};

export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: BAR_PADDING_TOP,
        paddingBottom: insets.bottom > 0 ? insets.bottom : BAR_MIN_BOTTOM,
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            height: BAR_HEIGHT,
            paddingHorizontal: 4,
            backgroundColor: t.colors.bgElev,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: t.colors.lineSoft,
          },
          t.shadow.sh2,
        ]}
      >
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key];
          const iconName = ICONS[route.name] ?? 'ellipse';
          const label = LABELS[route.name] ?? (options.title ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              style={{
                flex: 1,
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={focused ? t.colors.primary : t.colors.ink3}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: focused ? t.colors.primary : t.colors.ink3,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
