import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type Status = 'done' | 'partial' | 'missed';

interface Props {
  week?: Status[]; // 7 entries
  size?: number;
  color?: string;
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

export const WeekDots: React.FC<Props> = ({
  week = ['done', 'done', 'done', 'partial', 'done', 'missed', 'partial'],
  size = 10,
  color,
}) => {
  const t = useTheme();
  const accent = color ?? t.colors.primary;
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {week.map((s, i) => {
        const bg =
          s === 'done'
            ? accent
            : s === 'partial'
            ? tint(accent, 0.5, t.colors.bgPaper)
            : t.colors.line;
        return (
          <View
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bg,
            }}
          />
        );
      })}
    </View>
  );
};
