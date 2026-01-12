import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Linking, PermissionsAndroid } from 'react-native';
import { List, Switch, Text, useTheme, Divider, Button, Dialog, Portal, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { databaseService } from '../services/DatabaseService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type ExportRange = 'all' | 'month' | 'year' | 'custom';

export function SettingsScreen() {
  const theme = useTheme();
  const { theme: appTheme, toggleTheme } = useAppStore();
  const isDark = appTheme === 'dark';
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportRange, setExportRange] = useState<ExportRange>('all');
  const [isExporting, setIsExporting] = useState(false);

  // 检查并请求文件系统权限（Android）
  const checkAndRequestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS 不需要这些权限
    }

    try {
      // 检查权限状态
      const hasReadPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      const hasWritePermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );

      if (hasReadPermission && hasWritePermission) {
        return true;
      }

      // 请求权限
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      const readGranted = granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
      const writeGranted = granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

      if (readGranted && writeGranted) {
        return true;
      }

      // 权限被拒绝
      if (granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          '需要文件权限',
          '导出功能需要文件访问权限。请在系统设置中手动授予权限。',
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
        Alert.alert(
          '需要文件权限',
          '导出功能需要文件访问权限才能保存文件。',
          [{ text: '确定' }]
        );
      }

      return false;
    } catch (error) {
      console.error('权限请求失败:', error);
      return false;
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // 检查并请求权限（Android）
      if (Platform.OS === 'android') {
        const hasPermission = await checkAndRequestPermissions();
        if (!hasPermission) {
          setIsExporting(false);
          setExportDialogVisible(false);
          return;
        }
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
      const csvContent = await databaseService.exportToCSV(startDate, endDate);

      if (!csvContent || csvContent.trim().length === 0) {
        Alert.alert('提示', '没有可导出的数据');
        setExportDialogVisible(false);
        return;
      }

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const rangeText = exportRange === 'all' ? '全部' : exportRange === 'month' ? '本月' : '本年';
      const fileName = `轻簿记账_${rangeText}_${timestamp}.csv`;

      // 选择可用的目录（优先使用 documentDirectory，如果不可用则使用 cacheDirectory）
      let baseDirectory = FileSystem.documentDirectory;
      if (!baseDirectory) {
        baseDirectory = FileSystem.cacheDirectory;
      }
      
      if (!baseDirectory) {
        throw new Error('文件系统不可用，无法保存文件。请确保应用有文件访问权限。');
      }

      // 保存文件
      const fileUri = `${baseDirectory}${fileName}`;
      
      // 确保目录存在
      const dirInfo = await FileSystem.getInfoAsync(baseDirectory);
      if (!dirInfo || !dirInfo.exists) {
        throw new Error('文件目录不存在或无法访问');
      }

      // 添加 UTF-8 BOM 以确保 Excel 等软件能正确识别中文编码
      // BOM (Byte Order Mark) 是 UTF-8 编码的标识符
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      try {
        await FileSystem.writeAsStringAsync(fileUri, csvWithBOM, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch (writeError) {
        // 如果带 BOM 写入失败，尝试不带 BOM
        console.warn('带 BOM 写入失败，尝试不带 BOM:', writeError);
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      // 验证文件是否成功创建
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('文件创建失败');
      }

      // 分享文件
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: '导出记账数据',
          });
          Alert.alert('成功', '数据已导出并准备分享');
        } catch (shareError) {
          // 如果分享失败，尝试使用 UTI
          try {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'text/comma-separated-values',
              dialogTitle: '导出记账数据',
            });
            Alert.alert('成功', '数据已导出并准备分享');
          } catch (shareError2) {
            // 如果分享完全失败，显示文件路径
            Alert.alert('成功', `数据已导出到：\n${fileUri}\n\n如果无法分享，请手动复制文件。`);
          }
        }
      } else {
        // 如果不支持分享，显示文件路径
        Alert.alert('成功', `数据已导出到：\n${fileUri}`);
      }

      setExportDialogVisible(false);
    } catch (error) {
      console.error('导出失败:', error);
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          我的
        </Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <List.Section>
          <List.Subheader>外观</List.Subheader>
          <List.Item
            title="深色模式"
            description="切换深色/浅色主题"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch value={isDark} onValueChange={toggleTheme} />
            )}
          />
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>数据</List.Subheader>
          <List.Item
            title="数据导出"
            description="导出记账数据为 CSV 文件"
            left={(props) => <List.Icon {...props} icon="export" />}
            onPress={() => setExportDialogVisible(true)}
          />
        </List.Section>

        <Portal>
          <Dialog
            visible={exportDialogVisible}
            onDismiss={() => !isExporting && setExportDialogVisible(false)}
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Dialog.Title>导出数据</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
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
                />
                <RadioButton.Item
                  label="本月数据"
                  value="month"
                  disabled={isExporting}
                />
                <RadioButton.Item
                  label="本年数据"
                  value="year"
                  disabled={isExporting}
                />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setExportDialogVisible(false)}
                disabled={isExporting}
              >
                取消
              </Button>
              <Button
                onPress={handleExport}
                loading={isExporting}
                disabled={isExporting}
              >
                导出
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Divider style={styles.divider} />

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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  divider: {
    marginVertical: 8,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.6,
  },
});

