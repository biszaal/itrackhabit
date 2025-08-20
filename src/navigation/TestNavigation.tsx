import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BasicHomeScreen } from '../screens/BasicHomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ChallengesScreen } from '../screens/ChallengesScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HabitDetailsScreen } from '../screens/HabitDetailsScreen';
import { CreateEditHabitScreen } from '../screens/CreateEditHabitScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SimpleTabNavigator() {
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
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#F8F9FA',
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: '#1F2937',
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

export function TestNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#F8F9FA',
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: '#1F2937',
          },
          headerTintColor: '#1F2937',
        }}
      >
        <Stack.Screen
          name="Main"
          component={SimpleTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HabitDetails"
          component={HabitDetailsScreen}
          options={{
            title: 'Habit Details',
          }}
        />
        <Stack.Screen
          name="CreateHabit"
          component={CreateEditHabitScreen}
          options={{
            title: 'Create Habit',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}