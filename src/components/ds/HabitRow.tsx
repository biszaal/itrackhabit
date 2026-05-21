import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  emoji?: string;
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

// Mix a color with another (background) by ratio 0..1
const tint = (hex: string, ratio: number, bg = '#FFFFFF'): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const bh = bg.replace('#', '');
  const br = parseInt(bh.slice(0, 2), 16);
  const bg2 = parseInt(bh.slice(2, 4), 16);
  const bb = parseInt(bh.slice(4, 6), 16);
  const mr = Math.round(r * ratio + br * (1 - ratio));
  const mg = Math.round(g * ratio + bg2 * (1 - ratio));
  const mb = Math.round(b * ratio + bb * (1 - ratio));
  return `#${mr.toString(16).padStart(2, '0')}${mg.toString(16).padStart(2, '0')}${mb.toString(16).padStart(2, '0')}`;
};

export const HabitRow: React.FC<Props> = ({
  emoji = '🎯',
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

  const iconBg = tint(accent, 0.14, t.colors.bgPaper);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }, style]}>
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
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 22, lineHeight: 26 }}>{emoji}</Text>
        </View>

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
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: accent }}>
              {done}
              <Text style={{ color: t.colors.ink3, fontWeight: '500' }}>/{total}</Text>
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={onToggle}
            hitSlop={8}
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
