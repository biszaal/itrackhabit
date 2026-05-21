// Compatibility shim — preserves ColorPicker API but renders with the new
// 8-color habit palette + design tokens.
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  title?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect, title }) => {
  const t = useTheme();
  const colors = t.habitColors;

  return (
    <View style={{ padding: 12 }}>
      {title && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: t.colors.ink3,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {title}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
        {colors.map((c) => {
          const sel = selectedColor === c;
          return (
            <Pressable
              key={c}
              onPress={() => onColorSelect(c)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: sel ? 2 : 0,
                borderColor: t.colors.ink,
                padding: sel ? 2 : 0,
              }}
            >
              <View style={{ flex: 1, alignSelf: 'stretch', borderRadius: 999, backgroundColor: c }} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
