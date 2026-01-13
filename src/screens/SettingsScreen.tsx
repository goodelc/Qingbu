import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Linking } from 'react-native';
import { List, Switch, Text, useTheme, Divider, Button, Dialog, Portal, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { databaseService } from '../services/DatabaseService';
import { checkAndRequestFilePermissions } from '../utils/permissions';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

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
  const [exportRange, setExportRange] = useState<ExportRange>('all');
  const [isExporting, setIsExporting] = useState(false);

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
      let baseDirectory = FileSystem.documentDirectory;
      if (!baseDirectory) {
        baseDirectory = FileSystem.cacheDirectory;
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
          encoding: FileSystem.EncodingType.UTF8,
        });
        console.log('文件写入成功（带 BOM）');
      } catch (writeError) {
        // 如果带 BOM 写入失败，尝试不带 BOM
        console.warn('带 BOM 写入失败，尝试不带 BOM:', writeError);
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
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
            title="固定收支"
            description="管理固定收入和支出项目"
            left={(props) => <List.Icon {...props} icon="repeat" />}
            onPress={() => navigation.navigate('RecurringItems')}
          />
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

