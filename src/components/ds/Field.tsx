import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props extends TextInputProps {
  label?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Field: React.FC<Props> = ({
  label,
  right,
  left,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: t.colors.ink3,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          // A multiline field grows with its text instead of clipping to one row.
          ...(rest.multiline
            ? { minHeight: 132, paddingVertical: 14, alignItems: 'flex-start' as const }
            : { height: 52, alignItems: 'center' as const }),
          borderRadius: t.radius.input,
          backgroundColor: focused ? t.colors.bgElev : t.colors.bgPaper,
          borderWidth: 1,
          borderColor: focused ? t.colors.primary : 'transparent',
          paddingHorizontal: 16,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        {left}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={t.colors.ink3}
          style={[
            {
              flex: 1,
              color: t.colors.ink,
              fontSize: 16,
              padding: 0,
              textAlignVertical: rest.multiline ? 'top' : 'center',
            },
            style,
          ]}
        />
        {right}
      </View>
    </View>
  );
};
