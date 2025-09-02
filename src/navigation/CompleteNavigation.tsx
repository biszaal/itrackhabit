import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

// Screens - using the dynamic BasicHomeScreen and screens with minimal theme
import { HomeScreen as BasicHomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/analytics/CalendarScreen';
import { ChallengesScreen } from '../screens/social/ChallengesScreen';
import { CreateChallengeScreen } from '../screens/social/CreateChallengeScreen';
import { FriendsScreen } from '../screens/social/FriendsScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';

// Modal and Detail Screens
import { CreateEditHabitScreen } from '../screens/habits/CreateEditHabitScreen';
import { HabitDetailsScreen } from '../screens/habits/HabitDetailsScreen';
import { HabitTimerScreen } from '../screens/habits/HabitTimerScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { SocialFeedScreen } from '../screens/social/SocialFeedScreen';
import { HabitGroupsScreen } from '../screens/habits/HabitGroupsScreen';
import { MentorsScreen } from '../screens/premium/MentorsScreen';
import { AIInsightsScreen } from '../screens/analytics/AIInsightsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Theme colors (hardcoded to avoid theme import issues)
const colors = {
  primary: '#6366F1',
  text: '#18181B',
  textMuted: '#A1A1AA',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E4E4E7',
};

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Challenges':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Friends':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          height: 60 + insets.bottom,
          paddingHorizontal: 16,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: colors.text,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={BasicHomeScreen}
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

export function CompleteNavigator() {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: colors.text,
          },
          headerTintColor: colors.text,
        }}
      >
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
          options={{
            title: 'Timer',
            headerStyle: {
              backgroundColor: '#f8fafb',
            },
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 18,
              color: colors.text,
            },
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
          component={CreateChallengeScreen}
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
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Login',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            title: 'Register',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            title: 'Reset Password',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="SocialFeed"
          component={SocialFeedScreen}
          options={{
            title: 'Social Feed',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HabitGroups"
          component={HabitGroupsScreen}
          options={{
            title: 'Habit Groups',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Mentors"
          component={MentorsScreen}
          options={{
            title: 'Mentors',
            headerShown: false,
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
          name="GroupDetails"
          component={HabitGroupsScreen as any}
          options={{
            title: 'Group Details',
          }}
        />
        <Stack.Screen
          name="MentorProfile"
          component={MentorsScreen as any}
          options={{
            title: 'Mentor Profile',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}