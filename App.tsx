import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/useAppStore';
import { databaseService } from './src/services/DatabaseService';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function App() {
  const { theme } = useAppStore();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await databaseService.init();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // 即使数据库初始化失败，也继续加载应用
      } finally {
        setDbReady(true);
      }
    };

    initApp();
  }, []);

  const paperTheme = theme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

