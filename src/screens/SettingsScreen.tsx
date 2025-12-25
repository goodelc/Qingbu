import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Switch, Text, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';

export function SettingsScreen() {
  const theme = useTheme();
  const { theme: appTheme, toggleTheme } = useAppStore();
  const isDark = appTheme === 'dark';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
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
            onPress={() => {
              // TODO: 实现数据导出功能
              console.log('数据导出功能开发中');
            }}
          />
        </List.Section>

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

