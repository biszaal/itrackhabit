import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  large?: boolean;
  style?: ViewStyle;
}

export const AppHeader: React.FC<Props> = ({
  title,
  subtitle,
  back,
  onBack,
  action,
  large = true,
  style,
}) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + 12;

  return (
    <View
      style={[
        {
          paddingTop: topPad,
          paddingHorizontal: t.spacing.screen,
          paddingBottom: 12,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 36,
          marginBottom: title ? 14 : 0,
        }}
      >
        {back ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={20} color={t.colors.ink} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        {action ?? <View style={{ width: 36 }} />}
      </View>

      {title && (
        <Text
          accessibilityRole="header"
          style={{
            color: t.colors.ink,
            fontSize: large ? 28 : 20,
            fontWeight: '700',
            letterSpacing: large ? -0.7 : -0.4,
            lineHeight: large ? 32 : 24,
          }}
        >
          {title}
        </Text>
      )}
      {subtitle && (
        <Text style={{ color: t.colors.ink2, fontSize: 14, marginTop: 4 }}>{subtitle}</Text>
      )}
    </View>
  );
};
