import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';
registerTranslation('en', en);
import { CustomLightTheme, CustomDarkTheme } from './src/theme/customTheme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/useAppStore';
import { databaseService } from './src/services/DatabaseService';
import { checkAndRequestFilePermissions } from './src/utils/permissions';
// import {
//   checkAndCreateRecurringRecords,
//   shouldCheckToday,
//   markCheckedToday,
// } from './src/services/RecurringRecordService';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';

export default function App() {
  const { theme } = useAppStore();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // 初始化数据库
        await databaseService.init();
        
        // 请求文件系统权限（Android）
        // 在启动时静默请求，不阻塞应用加载
        checkAndRequestFilePermissions().then((hasPermission) => {
          if (hasPermission) {
            console.log('文件系统权限已授予');
          } else {
            console.log('文件系统权限未授予，将在导出时提示用户');
          }
        }).catch((error) => {
          console.error('权限请求出错:', error);
        });

        // 检查并创建固定收支记录
        // 每天首次打开应用时自动检查
        // const shouldCheck = await shouldCheckToday();
        // if (shouldCheck) {
        //   console.log('开始检查固定收支记录...');
        //   
        //   // 静默执行，不阻塞应用加载
        //   checkAndCreateRecurringRecords(async (item, existingRecordId) => {
        //     // 如果发现重复记录，返回用户选择
        //     // 这里使用 Promise 来等待用户选择
        //     return new Promise<'skip' | 'create' | 'replace'>((resolve) => {
        //       // 延迟显示对话框，确保应用已加载
        //       setTimeout(() => {
        //         Alert.alert(
        //           '发现重复记录',
        //           `固定项目"${item.name}"在本月已存在记录。如何处理？`,
        //           [
        //             {
        //               text: '跳过',
        //               style: 'cancel',
        //               onPress: () => resolve('skip'),
        //             },
        //             {
        //               text: '创建新的',
        //               onPress: () => resolve('create'),
        //             },
        //             {
        //               text: '覆盖',
        //               style: 'destructive',
        //               onPress: () => resolve('replace'),
        //             },
        //           ],
        //           { cancelable: false }
        //         );
        //       }, 1000);
        //     });
        //   })
        //     .then((stats) => {
        //       console.log('固定收支检查完成:', stats);
        //       if (stats.created > 0) {
        //         console.log(`已自动创建 ${stats.created} 条记录`);
        //       }
        //       markCheckedToday();
        //     })
        //     .catch((error) => {
        //       console.error('固定收支检查失败:', error);
        //     });
        // }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // 即使数据库初始化失败，也继续加载应用
      } finally {
        setDbReady(true);
      }
    };

    initApp();
  }, []);

  const paperTheme = theme === 'dark' ? CustomDarkTheme : CustomLightTheme;

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

