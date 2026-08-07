import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Glyph } from './Glyph';
import { mix } from './colors';
import { resolveGlyph } from './resolveGlyph';

interface Props {
  /** A stored glyph name, a legacy emoji, or nothing at all. */
  icon?: string | null;
  /** Habit title — used to infer a glyph when `icon` gives nothing. */
  name?: string;
  /** The habit's colour. Defaults to the theme primary. */
  color?: string;
  /** Edge length of the rounded tile. */
  size?: number;
  /** Draw the glyph bare, without the tinted tile behind it. */
  bare?: boolean;
  style?: ViewStyle;
}

/**
 * A habit's icon, tile and all. Every list row, chip and header that used to
 * render `<Text>{emoji}</Text>` goes through here, so the tile geometry and the
 * emoji→glyph fallback stay in one place.
 */
export const HabitIcon: React.FC<Props> = ({
  icon,
  name,
  color,
  size = 44,
  bare = false,
  style,
}) => {
  const t = useTheme();
  const accent = color ?? t.colors.primary;
  const glyph = resolveGlyph(icon, name);

  if (bare) {
    return <Glyph name={glyph} size={size} color={accent} surface={t.colors.bgElev} />;
  }

  const tile = mix(accent, 0.14, t.colors.bgPaper);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: tile,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        style,
      ]}
    >
      <Glyph name={glyph} size={size * 0.55} color={accent} surface={tile} />
    </View>
  );
};
