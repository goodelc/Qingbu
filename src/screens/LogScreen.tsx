import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme, IconButton, Button, Dialog, Portal, Chip } from 'react-native-paper';
import type { AppLog } from '../services/LogService';
import { logService } from '../services/LogService';

type FilterLevel = 'all' | 'info' | 'warn' | 'error';

export function LogScreen() {
  const theme = useTheme();
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const allLogs = await logService.getLogs();
      setLogs(allLogs);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const allLogs = await logService.getLogs();
      setLogs(allLogs);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearLogs = async () => {
    await logService.clearLogs();
    setLogs([]);
    setClearDialogVisible(false);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleString();
  };

  const levelLabel: Record<FilterLevel, string> = {
    all: '全部',
    info: '信息',
    warn: '警告',
    error: '错误',
  };

  const levelColor = (level: AppLog['level']) => {
    switch (level) {
      case 'error':
        return theme.colors.error;
      case 'warn':
        return '#F9A825';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const filteredLogs =
    filterLevel === 'all' ? logs : logs.filter((log) => log.level === filterLevel);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onSurface, fontWeight: '800' }]}
        >
          日志
        </Text>
        <View style={styles.headerRight}>
          <Chip
            mode="outlined"
            style={styles.filterChip}
            textStyle={{ fontSize: 12 }}
            onPress={() => {
              const order: FilterLevel[] = ['all', 'info', 'warn', 'error'];
              const index = order.indexOf(filterLevel);
              const next = order[(index + 1) % order.length];
              setFilterLevel(next);
            }}
          >
            {levelLabel[filterLevel]}
          </Chip>
          <IconButton
            icon="delete-outline"
            size={22}
            onPress={() => setClearDialogVisible(true)}
            disabled={logs.length === 0}
          />
        </View>
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 24 },
          filteredLogs.length === 0 && { flex: 1, justifyContent: 'center' },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshLogs}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7 }}
            >
              暂无日志记录
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.logItem,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline + '20',
              },
            ]}
          >
            <View style={styles.logHeader}>
              <Text
                style={[
                  styles.levelText,
                  { color: levelColor(item.level) },
                ]}
              >
                {item.level.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.timeText,
                  { color: theme.colors.onSurfaceVariant, opacity: 0.6 },
                ]}
              >
                {formatTime(item.timestamp)}
              </Text>
            </View>
            {item.tag ? (
              <Text
                style={[
                  styles.tagText,
                  { color: theme.colors.onSurfaceVariant, opacity: 0.7 },
                ]}
              >
                [{item.tag}]
              </Text>
            ) : null}
            <Text style={[styles.messageText, { color: theme.colors.onSurface }]}>
              {item.message}
            </Text>
            {item.details ? (
              <Text
                style={[
                  styles.detailsText,
                  { color: theme.colors.onSurfaceVariant, opacity: 0.7 },
                ]}
                numberOfLines={6}
              >
                {item.details}
              </Text>
            ) : null}
          </View>
        )}
      />

      <Portal>
        <Dialog
          visible={clearDialogVisible}
          onDismiss={() => setClearDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface, borderRadius: 24 }}
        >
          <Dialog.Title style={{ fontWeight: '800' }}>清空日志</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
              确定要清空所有日志吗？此操作不可撤销。
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>取消</Button>
            <Button
              onPress={handleClearLogs}
              textColor={theme.colors.error}
            >
              清空
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  logItem: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timeText: {
    fontSize: 11,
  },
  tagText: {
    fontSize: 12,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 4,
    fontWeight: '600',
  },
  detailsText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
  },
});

