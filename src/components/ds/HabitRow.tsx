import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { HabitIcon } from '../art';

interface Props {
  /** Glyph name, or a legacy emoji from an older record. */
  icon?: string | null;
  name: string;
  target?: string;
  color?: string;
  done?: number;
  total?: number;
  synced?: boolean;
  partial?: boolean;
  onPress?: () => void;
  onToggle?: () => void;
  style?: ViewStyle;
}

export const HabitRow: React.FC<Props> = ({
  icon,
  name,
  target,
  color,
  done = 0,
  total = 1,
  synced,
  partial,
  onPress,
  onToggle,
  style,
}) => {
  const t = useTheme();
  const accent = color ?? t.colors.primary;
  const pct = Math.min(1, total > 0 ? done / total : 0);
  const isDone = pct >= 1;

  // Screen readers get the habit, its target and where it stands — the visual
  // row conveys all three at a glance, so the label should too.
  const progressLabel = isDone
    ? 'completed'
    : partial
    ? `${done} of ${total} done`
    : 'not done yet';
  const rowLabel = [name, target, progressLabel].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rowLabel}
      accessibilityHint="Opens habit details"
      style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }, style]}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            backgroundColor: t.colors.bgElev,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.lineSoft,
            position: 'relative',
          },
          t.shadow.sh1,
        ]}
      >
        {/* color stripe */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 14,
            bottom: 14,
            width: 3,
            backgroundColor: accent,
            borderTopRightRadius: 3,
            borderBottomRightRadius: 3,
          }}
        />

        {/* icon */}
        <HabitIcon icon={icon} name={name} color={accent} size={44} />

        {/* meta */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.colors.ink,
              letterSpacing: -0.2,
            }}
          >
            {name}
          </Text>
          {(target || synced) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              {target ? (
                <Text style={{ fontSize: 12, color: t.colors.ink3 }} numberOfLines={1}>
                  {target}
                </Text>
              ) : null}
              {synced && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="pulse" size={12} color={accent} />
                  <Text style={{ fontSize: 12, color: accent, fontWeight: '600' }}>Synced</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* trailing — check or partial */}
        {partial ? (
          // Partially complete: still show the count, but keep it tappable —
          // otherwise a half-finished habit can't be completed from the list.
          <Pressable
            onPress={onToggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${name} as done, currently ${done} of ${total}`}
            style={{
              minWidth: 44,
              minHeight: 32,
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: accent }}>
              {done}
              <Text style={{ color: t.colors.ink3, fontWeight: '500' }}>/{total}</Text>
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onToggle}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityLabel={`Mark ${name} as ${isDone ? 'not done' : 'done'}`}
            accessibilityState={{ checked: isDone }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: isDone ? accent : t.colors.line,
              backgroundColor: isDone ? accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDone && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
          </Pressable>
        )}

        {/* progress bar */}
        <View
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 8,
            height: 3,
            borderRadius: 999,
            backgroundColor: t.colors.lineSoft,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${pct * 100}%`,
              backgroundColor: accent,
              borderRadius: 999,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
};
