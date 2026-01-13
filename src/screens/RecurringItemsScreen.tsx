import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  List,
  Text,
  useTheme,
  FAB,
  Switch,
  SegmentedButtons,
  Card,
  Button,
  IconButton,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRecurringItems } from '../hooks/useRecurringItems';
import { formatAmount } from '../utils/formatters';
import type { RecurringItem, RecordType, PeriodType } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type RecurringItemsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RecurringItems'
>;

interface RecurringItemsScreenProps {
  navigation: RecurringItemsScreenNavigationProp;
}

export function RecurringItemsScreen({ navigation }: RecurringItemsScreenProps) {
  const theme = useTheme();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const { items, loading, refreshItems, deleteItem, toggleItem, createRecord } = useRecurringItems({
    autoLoad: true,
  });

  useFocusEffect(
    useCallback(() => {
      refreshItems();
    }, [refreshItems])
  );

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const handleAdd = () => {
    navigation.navigate('AddRecurringItem');
  };

  const handleEdit = (item: RecurringItem) => {
    navigation.navigate('AddRecurringItem', { itemId: item.id });
  };

  const handleDelete = (item: RecurringItem) => {
    Alert.alert('确认删除', `确定要删除固定项目"${item.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(item.id!);
          } catch (error) {
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ]);
  };

  const handleToggle = async (item: RecurringItem) => {
    try {
      await toggleItem(item.id!, !item.enabled);
    } catch (error) {
      Alert.alert('错误', '操作失败，请重试');
    }
  };

  const handleQuickAdd = async (item: RecurringItem) => {
    try {
      // 计算目标日期
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      let targetDate = today;
      
      if (item.periodType === 'monthly' && item.periodDay) {
        // 每月X号：如果今天已过X号，计算下月X号；否则计算当月X号
        const day = item.periodDay;
        const currentDay = today.getDate();
        
        if (currentDay >= day) {
          // 已过，计算下月
          targetDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
        } else {
          // 未过，计算当月
          targetDate = new Date(today.getFullYear(), today.getMonth(), day);
        }
        
        // 处理月份天数不同的情况
        const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        if (day > lastDayOfMonth) {
          targetDate.setDate(lastDayOfMonth);
        }
      }
      
      await createRecord(item, targetDate.getTime());
      Alert.alert('成功', '记录已创建');
      // 刷新首页数据（通过导航参数或事件）
      navigation.goBack();
    } catch (error) {
      Alert.alert('错误', '创建记录失败，请重试');
    }
  };

  const getPeriodText = (item: RecurringItem): string => {
    if (item.periodType === 'daily') {
      return '每天';
    } else if (item.periodType === 'weekly') {
      return '每周';
    } else if (item.periodType === 'monthly' && item.periodDay) {
      return `每月${item.periodDay}号`;
    }
    return '未知';
  };

  if (loading && items.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          固定收支
        </Text>
      </View>

      <SegmentedButtons
        value={filterType}
        onValueChange={(value) => setFilterType(value as 'all' | 'income' | 'expense')}
        buttons={[
          { value: 'all', label: '全部' },
          { value: 'income', label: '收入' },
          { value: 'expense', label: '支出' },
        ]}
        style={styles.segmentedButtons}
      />

      <ScrollView style={styles.scrollView}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text
              variant="bodyLarge"
              style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
            >
              {filterType === 'all' ? '暂无固定收支项目' : `暂无${filterType === 'income' ? '收入' : '支出'}项目`}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.emptyHint, { color: theme.colors.onSurfaceVariant }]}
            >
              点击右下角 + 按钮添加
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                      {item.name}
                    </Text>
                    <Switch
                      value={item.enabled}
                      onValueChange={() => handleToggle(item)}
                      style={styles.switch}
                    />
                  </View>
                  <Text
                    variant="headlineSmall"
                    style={{
                      color: item.type === 'income' ? theme.colors.primary : theme.colors.error,
                    }}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatAmount(item.amount)}
                  </Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.cardInfo}>
                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      分类：
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      周期：
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                      {getPeriodText(item)}
                    </Text>
                  </View>
                  {item.note && (
                    <View style={styles.infoRow}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        备注：
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                        {item.note}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <Button
                    mode="outlined"
                    onPress={() => handleQuickAdd(item)}
                    disabled={!item.enabled}
                    compact
                  >
                    快速添加
                  </Button>
                  <View style={styles.actionButtons}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleEdit(item)}
                      iconColor={theme.colors.primary}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDelete(item)}
                      iconColor={theme.colors.error}
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={handleAdd} />
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
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 8,
    opacity: 0.7,
  },
  emptyHint: {
    opacity: 0.5,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switch: {
    marginLeft: 8,
  },
  divider: {
    marginVertical: 12,
  },
  cardInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
