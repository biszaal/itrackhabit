import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  baseDate?: Date;
  selectedDate?: Date;
  onSelect?: (date: Date) => void;
  count?: number; // total days shown
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const DateStrip: React.FC<Props> = ({
  baseDate = new Date(),
  selectedDate,
  onSelect,
  count = 7,
}) => {
  const t = useTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Window of days ending on baseDate
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - (count - 1));

  const days = Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {days.map((d, i) => {
        const isActive =
          selectedDate && d.toDateString() === selectedDate.toDateString();
        const isToday = d.toDateString() === today.toDateString();
        return (
          <Pressable
            key={i}
            onPress={() => onSelect?.(d)}
            accessibilityRole="button"
            // The visible label is a single letter and a number; spell the
            // date out so it is unambiguous when read aloud.
            accessibilityLabel={
              d.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }) + (isToday ? ', today' : '')
            }
            accessibilityState={{ selected: !!isActive }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: isActive ? t.colors.ink : 'transparent',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: isActive ? t.colors.bg : t.colors.ink3,
                letterSpacing: 0.8,
              }}
            >
              {DOW[d.getDay()]}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isActive ? t.colors.bg : t.colors.ink,
              }}
            >
              {d.getDate()}
            </Text>
            {isToday && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 4,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isActive ? t.colors.bg : t.colors.primary,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};
