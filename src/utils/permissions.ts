import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';

/**
 * 检查是否在 Expo Go 中运行
 */
export const isExpoGo = (): boolean => {
  try {
    // 多种方式检测 Expo Go
    if (Constants.executionEnvironment === 'storeClient') {
      return true;
    }
    // 检查是否有 Expo Go 的特征
    if (Constants.appOwnership === 'expo') {
      return true;
    }
    return false;
  } catch {
    // 如果无法检测，假设不在 Expo Go 中
    return false;
  }
};

/**
 * 检查并请求文件系统权限（Android）
 * @returns Promise<boolean> 是否已授予权限
 */
export const checkAndRequestFilePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // iOS 不需要这些权限
  }

  // 在 Expo Go 中，跳过权限检查（Expo Go 有自己的权限管理）
  if (isExpoGo()) {
    console.log('在 Expo Go 中运行，跳过权限检查');
    return true;
  }

  try {
    console.log('开始检查文件系统权限...');
    
    // 添加超时保护
    const permissionCheckPromise = Promise.all([
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE),
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE),
    ]);

    const timeoutPromise = new Promise<[boolean, boolean]>((_, reject) => {
      setTimeout(() => reject(new Error('权限检查超时')), 3000);
    });

    const [hasReadPermission, hasWritePermission] = await Promise.race([
      permissionCheckPromise,
      timeoutPromise,
    ]);

    console.log('权限检查结果:', { hasReadPermission, hasWritePermission });

    if (hasReadPermission && hasWritePermission) {
      return true;
    }

    console.log('请求文件系统权限...');
    
    // 请求权限（带超时）
    const requestPromise = PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ]);

    const requestTimeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error('权限请求超时')), 10000);
    });

    const granted = await Promise.race([requestPromise, requestTimeoutPromise]);

    const readGranted = granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
    const writeGranted = granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

    console.log('权限请求结果:', { readGranted, writeGranted });

    if (readGranted && writeGranted) {
      return true;
    }

    // 权限被拒绝，但不显示弹窗（在启动时静默处理）
    // 如果权限被永久拒绝，用户可以在导出时手动打开设置
    return false;
  } catch (error) {
    console.error('权限请求失败:', error);
    // 如果权限检查失败，在 Expo Go 中允许继续（因为 Expo Go 有自己的权限管理）
    if (isExpoGo()) {
      console.log('权限检查失败，但在 Expo Go 中，允许继续');
      return true;
    }
    return false;
  }
};
