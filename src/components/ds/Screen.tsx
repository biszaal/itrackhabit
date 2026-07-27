import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  background?: string;
}

// Root container for a screen. Sets the background color only — the status bar
// is owned globally by <ThemedStatusBar /> in App.tsx. Screens that mount and
// unmount (modals, stack pushes) must not each re-assert a bar style, or the
// resolved style becomes mount-order dependent.
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
      {children}
    </View>
  );
};
