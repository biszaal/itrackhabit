import 'react-native-get-random-values'; // Must be first import for UUID support
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { feedbackService } from './src/services/feedback/FeedbackService';
import { reviewPromptService } from './src/services/feedback/ReviewPromptService';

// Single source of truth for the status bar. `style="auto"` follows the OS
// scheme, which is wrong whenever the user has overridden the theme in-app
// (system light + app set to dark would render dark-on-dark text).
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} translucent />;
}

// Feedback written offline waits in an outbox. Give it a chance to go out on
// every launch and on every return to the foreground.
function useAppLifecycle() {
  useEffect(() => {
    reviewPromptService.recordFirstOpen().catch(() => {});
    feedbackService.flushOutbox().catch(() => {});
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') feedbackService.flushOutbox().catch(() => {});
    });
    return () => sub.remove();
  }, []);
}

export default function App() {
  useAppLifecycle();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <RootNavigator />
              <ThemedStatusBar />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
