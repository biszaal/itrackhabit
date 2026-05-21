import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  rows?: number;
  cols?: number;
  data?: number[]; // intensity 0..4 per cell
  todayIdx?: number;
  color?: string;
  cellGap?: number;
}

const tint = (hex: string, ratio: number, bg: string): string => {
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

export const Heat: React.FC<Props> = ({
  rows = 6,
  cols = 7,
  data,
  todayIdx,
  color,
  cellGap = 4,
}) => {
  const t = useTheme();
  const accent = color ?? t.colors.primary;
  const total = rows * cols;
  const cells =
    data ??
    Array.from({ length: total }, (_, i) => {
      const v = (Math.sin(i * 0.7) + 1) * 2.2;
      return Math.max(0, Math.min(4, Math.floor(v)));
    });

  const levelColors = [
    t.colors.bgPaper,
    tint(accent, 0.18, t.colors.bgPaper),
    tint(accent, 0.4, t.colors.bgPaper),
    tint(accent, 0.7, t.colors.bgPaper),
    accent,
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: cellGap }}>
      {cells.map((lvl, i) => (
        <View
          key={i}
          style={{
            width: `${100 / cols}%`,
            // approximate flex for aspect square via percentage trick; easier with fixed gap
          }}
        >
          <View
            style={{
              aspectRatio: 1,
              marginRight: cellGap,
              marginBottom: cellGap,
              borderRadius: 6,
              backgroundColor: levelColors[lvl],
              borderWidth: i === todayIdx ? 1.5 : 0,
              borderColor: t.colors.ink,
            }}
          />
        </View>
      ))}
    </View>
  );
};

// Simpler grid using a row/col layout — more reliable in RN
export const HeatGrid: React.FC<Props> = ({
  rows = 8,
  cols = 7,
  data,
  todayIdx,
  color,
  cellGap = 4,
}) => {
  const t = useTheme();
  const accent = color ?? t.colors.primary;
  const total = rows * cols;
  const cells =
    data ??
    Array.from({ length: total }, (_, i) => {
      const v = (Math.sin(i * 0.7) + 1) * 2.2;
      return Math.max(0, Math.min(4, Math.floor(v)));
    });

  const levelColors = [
    t.colors.bgPaper,
    tint(accent, 0.18, t.colors.bgPaper),
    tint(accent, 0.4, t.colors.bgPaper),
    tint(accent, 0.7, t.colors.bgPaper),
    accent,
  ];

  return (
    <View style={{ gap: cellGap }}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: cellGap }}>
          {Array.from({ length: cols }).map((_, c) => {
            const i = r * cols + c;
            if (i >= total) return null;
            const lvl = cells[i] ?? 0;
            return (
              <View
                key={c}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 6,
                  backgroundColor: levelColors[lvl],
                  borderWidth: i === todayIdx ? 1.5 : 0,
                  borderColor: t.colors.ink,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};
