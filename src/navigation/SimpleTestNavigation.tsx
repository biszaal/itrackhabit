import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { UltraBasicHomeScreen } from '../screens/UltraBasicHomeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SimpleTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? 'home' : 'home-outline';
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
        component={UltraBasicHomeScreen}
        options={{ title: 'Habits' }}
      />
    </Tab.Navigator>
  );
}

export function SimpleTestNavigator() {
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}