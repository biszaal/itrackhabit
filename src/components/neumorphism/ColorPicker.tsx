import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { NeumorphismColors, createNeumorphismStyle } from '../../theme/neumorphism';
import { theme } from '../../theme';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  title?: string;
}

// Get array of habit colors with names
const getHabitColors = () => {
  return Object.entries(NeumorphismColors.habitColors).map(([name, color]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: color,
  }));
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  title
}) => {
  const colors = getHabitColors();

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.colorGrid}>
        {colors.map((colorItem) => {
          const isSelected = selectedColor === colorItem.value;
          
          return (
            <TouchableOpacity
              key={colorItem.name}
              onPress={() => onColorSelect(colorItem.value)}
              style={[
                styles.colorButton,
                isSelected && styles.selectedColorButton
              ]}
              activeOpacity={0.7}
            >
              <View 
                style={[
                  styles.colorSwatch, 
                  { backgroundColor: colorItem.value },
                  isSelected && styles.selectedColorSwatch
                ]} 
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: NeumorphismColors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectedColorButton: {
    borderWidth: 3,
    borderColor: NeumorphismColors.text,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedColorSwatch: {
    borderWidth: 2,
    borderColor: 'white',
  },
});