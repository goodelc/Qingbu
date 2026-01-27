import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Linking, TouchableOpacity } from 'react-native';
import { List, Switch, Text, useTheme, Divider, Button, Dialog, Portal, RadioButton, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAppStore } from '../store/useAppStore';
import { databaseService } from '../services/DatabaseService';
import { updateService, UpdateInfo } from '../services/UpdateService';
import { checkAndRequestFilePermissions } from '../utils/permissions';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { logService } from '../services/LogService';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Settings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ExportRange = 'all' | 'month' | 'year' | 'custom';

export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { theme: appTheme, toggleTheme } = useAppStore();
  const isDark = appTheme === 'dark';
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [aboutDialogVisible, setAboutDialogVisible] = useState(false);
  const [exportRange, setExportRange] = useState<ExportRange>('all');
  const [isExporting, setIsExporting] = useState(false);

  // 更新相关状态
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentVersion = `v${Constants.expoConfig?.version || '1.0.0'}`;

  const checkUpdate = async (manual = true) => {
    if (isCheckingUpdate) {
      console.log('[SettingsScreen] 检查更新已在进行中，跳过');
      return;
    }
    console.log('[SettingsScreen] 开始检查更新，手动触发:', manual);
    setIsCheckingUpdate(true);
    try {
      console.log('[SettingsScreen] 调用updateService.checkUpdate()...');
      await logService.logInfo('SettingsScreen', '开始检查更新', `manual=${manual}`);
      const info = await updateService.checkUpdate();
      console.log('[SettingsScreen] 检查更新完成，结果:', info ? `发现新版本 ${info.version}` : '已是最新版本');
      
      if (info) {
        setUpdateInfo(info);
        setUpdateDialogVisible(true);
        console.log('[SettingsScreen] 显示更新对话框');
        await logService.logInfo('SettingsScreen', '发现新版本', info.version);
      } else if (manual) {
        console.log('[SettingsScreen] 显示"已是最新版本"提示');
        Alert.alert('提示', '当前已是最新版本');
        await logService.logInfo('SettingsScreen', '当前已是最新版本');
      }
    } catch (error) {
      console.error('[SettingsScreen] 检查更新异常:', error);
      if (error instanceof Error) {
        console.error('[SettingsScreen] 错误详情:', error.message, error.stack);
      }
      await logService.logError(
        'SettingsScreen',
        '检查更新失败',
        error instanceof Error ? error.stack || error.message : String(error)
      );
      if (manual) {
        // 检查是否是速率限制错误
        if (error instanceof Error && (error as any).isRateLimit) {
          console.log('[SettingsScreen] 检测到速率限制错误');
          Alert.alert(
            '请求过于频繁',
            'GitHub API 请求频率过高，请稍后再试。\n\n建议：\n• 等待几分钟后重试\n• 或联系开发者配置 API 认证以提高速率限制'
          );
        } else {
          const errorMsg = error instanceof Error ? error.message : '检查更新失败，请重试';
          console.log('[SettingsScreen] 显示错误提示:', errorMsg);
          Alert.alert('错误', errorMsg);
        }
      }
    } finally {
      console.log('[SettingsScreen] 检查更新流程结束');
      setIsCheckingUpdate(false);
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      await updateService.downloadAndInstall(updateInfo.downloadUrl, (progress) => {
        setDownloadProgress(progress);
      });
    } catch (error) {
      await logService.logError(
        'SettingsScreen',
        '下载更新失败',
        error instanceof Error ? error.stack || error.message : String(error)
      );
      Alert.alert('错误', '下载失败，请稍后重试');
      setIsDownloading(false);
    }
  };

  // 检查并请求文件系统权限（Android）
  const checkAndRequestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS 不需要这些权限
    }

    try {
      const hasPermission = await checkAndRequestFilePermissions();
      
      if (!hasPermission) {
        // 权限被拒绝，显示提示
        Alert.alert(
          '需要文件权限',
          '导出功能需要文件访问权限才能保存文件。请在系统设置中授予权限。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '打开设置',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
      }
      
      return hasPermission;
    } catch (error) {
      console.error('权限检查失败:', error);
      await logService.logError(
        'SettingsScreen',
        '文件权限检查失败',
        error instanceof Error ? error.stack || error.message : String(error)
      );
      return false;
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      console.log('开始导出数据，范围:', exportRange);

      // 检查并请求权限（Android）
      if (Platform.OS === 'android') {
        console.log('检查 Android 权限...');
        const hasPermission = await checkAndRequestPermissions();
        if (!hasPermission) {
          console.log('权限检查失败，取消导出');
          setIsExporting(false);
          setExportDialogVisible(false);
          return;
        }
        console.log('权限检查通过');
      }

      // 计算日期范围
      let startDate: number | undefined;
      let endDate: number | undefined;
      const now = new Date();

      if (exportRange === 'month') {
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        startDate = new Date(year, month - 1, 1).getTime();
        endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      } else if (exportRange === 'year') {
        const year = now.getFullYear();
        startDate = new Date(year, 0, 1).getTime();
        endDate = new Date(year, 11, 31, 23, 59, 59, 999).getTime();
      }

      // 导出 CSV
      console.log('开始从数据库导出 CSV...');
      const csvContent = await databaseService.exportToCSV(startDate, endDate);
      console.log('CSV 导出完成，长度:', csvContent.length);

      if (!csvContent || csvContent.trim().length === 0) {
        console.log('没有可导出的数据');
        Alert.alert('提示', '没有可导出的数据');
        setIsExporting(false);
        setExportDialogVisible(false);
        return;
      }

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const rangeText = exportRange === 'all' ? '全部' : exportRange === 'month' ? '本月' : '本年';
      const fileName = `轻簿记账_${rangeText}_${timestamp}.csv`;

      // 选择可用的目录（优先使用 documentDirectory，如果不可用则使用 cacheDirectory）
      let baseDirectory = (FileSystem as any).documentDirectory;
      if (!baseDirectory) {
        baseDirectory = (FileSystem as any).cacheDirectory;
      }
      
      if (!baseDirectory) {
        throw new Error('文件系统不可用，无法保存文件。请确保应用有文件访问权限。');
      }

      // 保存文件
      const fileUri = `${baseDirectory}${fileName}`;
      console.log('准备保存文件到:', fileUri);
      
      // 确保目录存在
      console.log('检查目录是否存在...');
      const dirInfo = await FileSystem.getInfoAsync(baseDirectory);
      if (!dirInfo || !dirInfo.exists) {
        throw new Error('文件目录不存在或无法访问');
      }
      console.log('目录检查通过');

      // 添加 UTF-8 BOM 以确保 Excel 等软件能正确识别中文编码
      // BOM (Byte Order Mark) 是 UTF-8 编码的标识符
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      console.log('开始写入文件...');
      try {
        await FileSystem.writeAsStringAsync(fileUri, csvWithBOM, {
          encoding: (FileSystem as any).EncodingType.UTF8,
        });
        console.log('文件写入成功（带 BOM）');
      } catch (writeError) {
        // 如果带 BOM 写入失败，尝试不带 BOM
        console.warn('带 BOM 写入失败，尝试不带 BOM:', writeError);
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: (FileSystem as any).EncodingType.UTF8,
        });
        console.log('文件写入成功（不带 BOM）');
      }

      // 验证文件是否成功创建
      console.log('验证文件是否创建成功...');
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('文件创建失败');
      }
      console.log('文件验证通过，大小:', fileInfo.size);

      // 分享文件
      console.log('检查分享功能是否可用...');
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('分享功能可用:', isAvailable);

      if (isAvailable) {
        console.log('开始分享文件...');
        try {
          // 添加超时保护，避免分享对话框一直等待
          const sharePromise = Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: '导出记账数据',
          });

          const shareTimeoutPromise = new Promise<{ action: string }>((_, reject) => {
            setTimeout(() => reject(new Error('分享操作超时')), 30000); // 30秒超时
          });

          await Promise.race([sharePromise, shareTimeoutPromise]);
          console.log('分享成功');
          Alert.alert('成功', '数据已导出并准备分享');
        } catch (shareError: any) {
          console.warn('分享失败，尝试备用方式:', shareError);
          
          // 如果分享失败或超时，尝试使用备用 MIME 类型
          if (!shareError.message?.includes('超时')) {
            try {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'text/comma-separated-values',
                dialogTitle: '导出记账数据',
              });
              console.log('备用分享方式成功');
              Alert.alert('成功', '数据已导出并准备分享');
            } catch (shareError2) {
              console.error('备用分享方式也失败:', shareError2);
              // 如果分享完全失败，显示文件路径
              Alert.alert('成功', `数据已导出到：\n${fileUri}\n\n如果无法分享，请手动复制文件。`);
            }
          } else {
            // 超时情况，直接显示文件路径
            console.log('分享超时，显示文件路径');
            Alert.alert('成功', `数据已导出到：\n${fileUri}\n\n分享操作超时，请手动访问文件。`);
          }
        }
      } else {
        // 如果不支持分享，显示文件路径
        console.log('分享功能不可用，显示文件路径');
        Alert.alert('成功', `数据已导出到：\n${fileUri}`);
      }

      console.log('导出流程完成');
      setExportDialogVisible(false);
    } catch (error) {
      console.error('导出失败:', error);
      await logService.logError(
        'SettingsScreen',
        '导出数据失败',
        error instanceof Error ? error.stack || error.message : String(error)
      );
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 提供更详细的错误信息和解决方案
      let userMessage = `导出失败：${errorMessage}`;
      let showSettingsButton = false;

      if (errorMessage.includes('权限') || errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        userMessage = '导出失败：缺少文件访问权限。\n\n请在系统设置中授予应用存储权限。';
        showSettingsButton = true;
      } else if (errorMessage.includes('utf-8') || errorMessage.includes('undefined') || errorMessage.includes('文件系统不可用')) {
        userMessage = '导出失败：文件系统不可用。\n\n可能的原因：\n• 应用缺少文件访问权限\n• 设备存储空间不足\n• 文件系统异常\n\n请检查权限设置或重启应用后重试。';
        showSettingsButton = Platform.OS === 'android';
      } else if (errorMessage.includes('documentDirectory') || errorMessage.includes('无法访问')) {
        userMessage = '导出失败：无法访问文件目录。\n\n请检查应用权限设置，确保已授予存储权限。';
        showSettingsButton = Platform.OS === 'android';
      } else if (errorMessage.includes('没有可导出的数据')) {
        userMessage = '没有可导出的数据';
      }

      if (showSettingsButton && Platform.OS === 'android') {
        Alert.alert(
          '导出失败',
          userMessage,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '打开设置',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
      } else {
        Alert.alert('错误', userMessage);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const settingsItems = [
    { label: '主题设置', emoji: '🎨', action: toggleTheme, right: <Switch value={isDark} onValueChange={toggleTheme} /> },
    { label: '固定收支', emoji: '🔄', action: () => navigation.navigate('RecurringItems') },
    { label: '数据导出', emoji: '📊', action: () => setExportDialogVisible(true) },
    { 
      label: '检查更新', 
      emoji: '🚀', 
      action: () => checkUpdate(true), 
      right: <Text style={{ color: theme.colors.onSurfaceVariant, opacity: 0.5, fontSize: 13 }}>{currentVersion}</Text> 
    },
    { label: '查看日志', emoji: '📜', action: () => navigation.navigate('Logs') },
    { label: '关于轻簿', emoji: 'ℹ️', action: () => setAboutDialogVisible(true) },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background || '#FBFBFC' }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface, fontWeight: '800' }]}>
          我的
        </Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuContainer}>
          {settingsItems.map((item) => (
            <TouchableOpacity 
              key={item.label} 
              style={[
                styles.menuItem, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline + '20' || 'rgba(0,0,0,0.05)',
                }
              ]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
                <Text style={[styles.menuLabel, { color: theme.colors.onSurface }]}>{item.label}</Text>
              </View>
              {item.right || <Text style={[styles.chevron, { color: theme.colors.onSurfaceVariant, opacity: 0.3 }]}>›</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Portal>
          <Dialog
            visible={exportDialogVisible}
            onDismiss={() => !isExporting && setExportDialogVisible(false)}
            style={{ backgroundColor: theme.colors.surface, borderRadius: 28 }}
          >
            <Dialog.Title style={{ fontWeight: '800' }}>导出数据</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={{ marginBottom: 16, opacity: 0.7 }}>
                选择要导出的数据范围：
              </Text>
              <RadioButton.Group
                onValueChange={(value) => setExportRange(value as ExportRange)}
                value={exportRange}
              >
                <RadioButton.Item
                  label="全部数据"
                  value="all"
                  disabled={isExporting}
                  labelStyle={{ fontSize: 14 }}
                />
                <RadioButton.Item
                  label="本月数据"
                  value="month"
                  disabled={isExporting}
                  labelStyle={{ fontSize: 14 }}
                />
                <RadioButton.Item
                  label="本年数据"
                  value="year"
                  disabled={isExporting}
                  labelStyle={{ fontSize: 14 }}
                />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setExportDialogVisible(false)}
                disabled={isExporting}
                textColor={theme.colors.onSurfaceVariant}
              >
                取消
              </Button>
              <Button
                onPress={handleExport}
                loading={isExporting}
                disabled={isExporting}
                mode="contained"
                style={{ borderRadius: 12 }}
              >
                开始导出
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            visible={isCheckingUpdate}
            dismissable={false}
            style={{ backgroundColor: theme.colors.surface, borderRadius: 28 }}
          >
            <Dialog.Title style={{ fontWeight: '800' }}>检查更新中</Dialog.Title>
            <Dialog.Content>
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ProgressBar indeterminate color={theme.colors.primary} style={{ width: '100%', height: 4 }} />
                <Text variant="bodyMedium" style={{ marginTop: 16, opacity: 0.7 }}>
                  正在检查新版本...
                </Text>
              </View>
            </Dialog.Content>
          </Dialog>

          <Dialog
            visible={updateDialogVisible}
            onDismiss={() => !isDownloading && setUpdateDialogVisible(false)}
            style={{ backgroundColor: theme.colors.surface, borderRadius: 28 }}
          >
            <Dialog.Title style={{ fontWeight: '800' }}>发现新版本 {updateInfo?.version}</Dialog.Title>
            <Dialog.Content>
              <ScrollView style={{ maxHeight: 200 }}>
                <Text variant="bodyMedium" style={{ marginBottom: 16, opacity: 0.7, lineHeight: 22 }}>
                  {updateInfo?.description || '暂无更新日志'}
                </Text>
              </ScrollView>
              
              {isDownloading && (
                <View style={{ marginTop: 16 }}>
                  <Text variant="bodySmall" style={{ marginBottom: 8, textAlign: 'right', fontWeight: '700' }}>
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                  <ProgressBar progress={downloadProgress} color={theme.colors.primary} style={{ height: 8, borderRadius: 4 }} />
                  <Text variant="bodySmall" style={{ marginTop: 8, opacity: 0.5, textAlign: 'center' }}>
                    正在下载更新包，请勿关闭应用...
                  </Text>
                </View>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setUpdateDialogVisible(false)}
                disabled={isDownloading}
                textColor={theme.colors.onSurfaceVariant}
              >
                稍后再说
              </Button>
              <Button
                onPress={handleUpdate}
                loading={isDownloading}
                disabled={isDownloading}
                mode="contained"
                style={{ borderRadius: 12 }}
              >
                立即更新
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            visible={aboutDialogVisible}
            onDismiss={() => setAboutDialogVisible(false)}
            style={{ backgroundColor: theme.colors.surface, borderRadius: 28 }}
          >
            <Dialog.Title style={{ fontWeight: '800', fontSize: 20 }}>关于轻簿</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={{ opacity: 0.7, lineHeight: 24 }}>
                Qingbu v1.0.0{'\n'}极简、高效、纯净的记账应用。
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setAboutDialogVisible(false)}
                mode="contained"
                style={{ borderRadius: 12 }}
              >
                知道了
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <View style={styles.footer}>
          <Text
            variant="bodySmall"
            style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}
          >
            Qingbu v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  menuContainer: {
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuEmoji: {
    fontSize: 22,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.4,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

