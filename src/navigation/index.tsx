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

// Screens
import { BasicHomeScreen as HomeScreen } from '../screens/BasicHomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ChallengesScreen } from '../screens/ChallengesScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreateEditHabitScreen } from '../screens/CreateEditHabitScreen';
import { HabitDetailsScreen } from '../screens/HabitDetailsScreen';
import { HabitTimerScreen } from '../screens/HabitTimerScreen';
import { HabitConfigScreen } from '../screens/HabitConfigScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { PremiumScreen } from '../screens/PremiumScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderSoft,
          paddingBottom: insets.bottom + theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          height: (theme.fontSize.xl * 3) + insets.bottom,
          paddingHorizontal: theme.spacing.lg,
          ...theme.shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium,
          marginTop: theme.spacing.xs,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          ...theme.shadows.none,
        },
        headerTitleStyle: {
          fontWeight: theme.fontWeight.semibold,
          fontSize: theme.fontSize.lg,
          color: theme.colors.text,
        },
      })}
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
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTitleStyle: {
            fontWeight: theme.fontWeight.semibold,
            fontSize: theme.fontSize.lg,
            color: theme.colors.text,
          },
          headerTintColor: theme.colors.text,
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
              fontWeight: theme.fontWeight.semibold,
              fontSize: theme.fontSize.lg,
              color: theme.colors.text,
            },
          }}
        />
        <Stack.Screen
          name="HabitConfig"
          component={HabitConfigScreen}
          options={{
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
          component={ChallengesScreen as any} // TODO: Create dedicated ChallengeDetailsScreen
          options={{
            title: 'Challenge Details',
          }}
        />
        <Stack.Screen
          name="CreateChallenge"
          component={ChallengesScreen as any} // TODO: Create dedicated CreateChallengeScreen
          options={{
            title: 'Create Challenge',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="FriendProfile"
          component={ProfileScreen as any} // TODO: Create dedicated FriendProfileScreen
          options={{
            title: 'Friend Profile',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={ProfileScreen as any} // TODO: Create dedicated SettingsScreen
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}