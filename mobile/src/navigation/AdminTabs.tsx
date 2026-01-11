import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import RoomsScreen from '../screens/admin/RoomsScreen';
import UsersScreen from '../screens/admin/UsersScreen';
import { theme } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
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
        name="Home"
        component={AdminDashboardScreen}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Salas"
        component={RoomsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Usuários"
        component={UsersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

