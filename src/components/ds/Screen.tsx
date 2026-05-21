import React from 'react';
import { View, StatusBar, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  background?: string;
}

// Root container for a screen. Sets bg color + status bar style.
export const Screen: React.FC<Props> = ({ children, style, background }) => {
  const t = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: background ?? t.colors.bg,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle={t.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </View>
  );
};
