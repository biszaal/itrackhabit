import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../theme/ThemeContext';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Calendar: 'calendar',
  Challenges: 'trophy',
  Friends: 'people',
  Profile: 'person',
};

const LABELS: Record<string, string> = {
  Home: 'Today',
  Calendar: 'Calendar',
  Challenges: 'Challenges',
  Friends: 'Friends',
  Profile: 'You',
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
        paddingTop: 8,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            height: 64,
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
