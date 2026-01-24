import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { CustomLightTheme, CustomDarkTheme } from '../theme/customTheme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { HomeScreen } from '../screens/HomeScreen';
import { AddRecordScreen } from '../screens/AddRecordScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RecurringItemsScreen } from '../screens/RecurringItemsScreen';
import { AddRecurringItemScreen } from '../screens/AddRecurringItemScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  AddRecord: { recordId?: number } | undefined;
  RecurringItems: undefined;
  AddRecurringItem: { itemId?: number } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Stats: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.outline,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="home" color={color} size={24} />
          ),
          tabBarLabelStyle: ({ focused }) => ({
            fontSize: 12,
            fontWeight: focused ? '600' : '500',
          }),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: '统计',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="chart-bar" color={color} size={24} />
          ),
          tabBarLabelStyle: ({ focused }) => ({
            fontSize: 12,
            fontWeight: focused ? '600' : '500',
          }),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="account" color={color} size={24} />
          ),
          tabBarLabelStyle: ({ focused }) => ({
            fontSize: 12,
            fontWeight: focused ? '600' : '500',
          }),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { theme } = useAppStore();
  const paperTheme = theme === 'dark' ? CustomDarkTheme : CustomLightTheme;
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer
      theme={{
        dark: theme === 'dark',
        colors: {
          primary: paperTheme.colors.primary,
          background: paperTheme.colors.background,
          card: paperTheme.colors.surface,
          text: paperTheme.colors.onSurface,
          border: paperTheme.colors.outline,
          notification: paperTheme.colors.error,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="AddRecord"
          component={AddRecordScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
            contentStyle: {
              backgroundColor: paperTheme.colors.background,
            },
          }}
        />
        <Stack.Screen
          name="RecurringItems"
          component={RecurringItemsScreen}
          options={{
            headerShown: false,
            contentStyle: {
              backgroundColor: paperTheme.colors.background,
            },
          }}
        />
        <Stack.Screen
          name="AddRecurringItem"
          component={AddRecurringItemScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
            contentStyle: {
              backgroundColor: paperTheme.colors.background,
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

