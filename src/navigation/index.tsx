import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TabBar } from '../components/ds';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/analytics/CalendarScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { CreateEditHabitScreen } from '../screens/habits/CreateEditHabitScreen';
import { HabitTemplatesScreen } from '../screens/habits/HabitTemplatesScreen';
import { HabitDetailsScreen } from '../screens/habits/HabitDetailsScreen';
import { HabitTimerScreen } from '../screens/habits/HabitTimerScreen';
import { HabitConfigScreen } from '../screens/habits/HabitConfigScreen';
import { HabitEditScreen } from '../screens/habits/HabitEditScreen';
import HabitNotificationSettingsScreen from '../screens/habits/HabitNotificationSettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import Analytics from '../screens/analytics/Analytics';
import { AIInsightsScreen } from '../screens/analytics/AIInsightsScreen';
import AchievementsScreen from '../screens/premium/AchievementsScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import { DataManagement } from '../screens/settings/DataManagement';
import { PrivacySecurity } from '../screens/settings/PrivacySecurity';
import DeveloperToolsScreen from '../screens/settings/DeveloperToolsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Habits' }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen
        name="Analytics"
        component={Analytics}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Awards' }}
      />
      <Tab.Screen
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}


export function RootNavigator() {
  const { loading } = useAuth();
  const t = useTheme();

  // Keep the navigator's own chrome (card backgrounds, transition scenes) on
  // the same palette the screens use, so switching to dark mode doesn't flash
  // a light background between screens.
  const navTheme: NavTheme = {
    ...(t.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(t.isDark ? DarkTheme : DefaultTheme).colors,
      background: t.colors.bg,
      card: t.colors.bgElev,
      text: t.colors.ink,
      border: t.colors.line,
      primary: t.colors.primary,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          // Every redesigned screen renders its own in-page AppHeader,
          // so we suppress the native stack header globally to avoid a
          // duplicated title strip on top.
          headerShown: false,
          contentStyle: { backgroundColor: t.colors.bg },
        }}
      >
        {/* Main App - Always accessible */}
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateHabit"
          component={CreateEditHabitScreen}
          options={{
            title: 'Create Habit',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="CreateEditHabit"
          component={CreateEditHabitScreen}
          options={{
            title: 'Create Habit',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="HabitTemplates"
          component={HabitTemplatesScreen}
          options={{
            title: 'Choose Template',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="EditHabit"
          component={CreateEditHabitScreen}
          options={{
            title: 'Edit Habit',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="HabitDetails"
          component={HabitDetailsScreen}
          options={{
            title: 'Habit Details',
          }}
        />
        <Stack.Screen
          name="HabitTimer"
          component={HabitTimerScreen}
          options={{ title: 'Timer' }}
        />
        <Stack.Screen
          name="HabitConfig"
          component={HabitConfigScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HabitEdit"
          component={HabitEditScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HabitNotificationSettings"
          component={HabitNotificationSettingsScreen}
          options={{
            title: 'Smart Notifications',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="AIInsights"
          component={AIInsightsScreen}
          options={{
            title: 'AI Insights',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            title: 'Get Started',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={ProfileScreen as any}
          options={{
            title: 'Settings',
          }}
        />

        {/* Settings Screens */}
        <Stack.Screen
          name="NotificationSettingsNew"
          component={NotificationSettingsScreen}
          options={{
            title: 'Notifications',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="DataManagement"
          component={DataManagement}
          options={{
            title: 'Data Management',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PrivacySecurity"
          component={PrivacySecurity}
          options={{
            title: 'Privacy & Security',
            headerShown: false,
          }}
        />
        {__DEV__ && (
          <Stack.Screen
            name="DeveloperTools"
            component={DeveloperToolsScreen}
            options={{
              title: 'Developer Tools',
              headerShown: false,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}