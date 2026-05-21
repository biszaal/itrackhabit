import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import { RootStackParamList, MainTabParamList, AuthStackParamList } from '../types/navigation';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { NeumorphismColors, NeumorphTabBar } from '../components/neumorphism';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/analytics/CalendarScreen';
import { ChallengesScreen } from '../screens/social/ChallengesScreen';
import { FriendsScreen } from '../screens/social/FriendsScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { CreateEditHabitScreen } from '../screens/habits/CreateEditHabitScreen';
import { HabitTemplatesScreen } from '../screens/habits/HabitTemplatesScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { HabitDetailsScreen } from '../screens/habits/HabitDetailsScreen';
import { HabitTimerScreen } from '../screens/habits/HabitTimerScreen';
import { HabitConfigScreen } from '../screens/habits/HabitConfigScreen';
import { HabitEditScreen } from '../screens/habits/HabitEditScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import HabitNotificationSettingsScreen from '../screens/habits/HabitNotificationSettingsScreen';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { ContactSelectionScreen } from '../screens/social/ContactSelectionScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import Analytics from '../screens/analytics/Analytics';
import AchievementsScreen from '../screens/premium/AchievementsScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import { DataManagement } from '../screens/settings/DataManagement';
import { PrivacySecurity } from '../screens/settings/PrivacySecurity';
import DeveloperToolsScreen from '../screens/settings/DeveloperToolsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <NeumorphTabBar {...props} />}
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
        name="Challenges" 
        component={ChallengesScreen}
        options={{ title: 'Challenges' }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{ title: 'Friends' }}
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
  const { loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: NeumorphismColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          // Every redesigned screen renders its own in-page AppHeader,
          // so we suppress the native stack header globally to avoid a
          // duplicated title strip on top.
          headerShown: false,
          contentStyle: { backgroundColor: NeumorphismColors.background },
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
          name="Analytics"
          component={Analytics}
          options={{
            title: 'Analytics',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{
            title: 'Achievements',
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
          name="Premium"
          component={PremiumScreen}
          options={{
            title: 'Premium',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="ChallengeDetails"
          component={ChallengesScreen as any}
          options={{
            title: 'Challenge Details',
          }}
        />
        <Stack.Screen
          name="CreateChallenge"
          component={ChallengesScreen as any}
          options={{
            title: 'Create Challenge',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="FriendProfile"
          component={ProfileScreen as any}
          options={{
            title: 'Friend Profile',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={ProfileScreen as any}
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="ContactSelection"
          component={ContactSelectionScreen}
          options={{
            title: 'Invite Friends',
            headerShown: false,
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
        <Stack.Screen
          name="DeveloperTools"
          component={DeveloperToolsScreen}
          options={{
            title: 'Developer Tools',
            headerShown: false,
          }}
        />
        
        {/* Optional Auth Screens */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{
            title: 'Welcome',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Sign In',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            title: 'Create Account',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            title: 'Reset Password',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}