import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RoomsListScreen from '../screens/client/RoomsListScreen';
import MyBookingsScreen from '../screens/client/MyBookingsScreen';
import { theme } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function ClientTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { 
          backgroundColor: theme.colors.backgroundSecondary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          ...theme.typography.h3,
          fontWeight: '600',
          color: theme.colors.textPrimary,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundSecondary,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          paddingHorizontal: 0,
          height: 60 + (bottomPadding > 8 ? bottomPadding - 8 : 0),
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Minhas Reservas"
        component={MyBookingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Salas"
        component={RoomsListScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

