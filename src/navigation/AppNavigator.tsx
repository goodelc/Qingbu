import React from 'react';
import { StyleSheet, Platform, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { CustomLightTheme, CustomDarkTheme } from '../theme/customTheme';
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
      borderTopWidth: 0,
      elevation: 20, // 更强的阴影效果
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 15,
      height: Platform.OS === 'ios' ? 88 : 70, // 适配 iOS 安全区域
      paddingBottom: Platform.OS === 'ios' ? 30 : 12,
      paddingTop: 12,
      borderTopLeftRadius: 32, // 超大圆角
      borderTopRightRadius: 32,
      position: 'absolute', // 让内容可以透过去（如果背景透明）
      bottom: 0,
      left: 0,
      right: 0,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '700',
      marginTop: 2,
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
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: '统计',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>👤</Text>
          ),
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
            animation: 'slide_from_bottom',
            contentStyle: {
              backgroundColor: 'transparent',
            },
            gestureEnabled: true,
            gestureDirection: 'vertical',
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

