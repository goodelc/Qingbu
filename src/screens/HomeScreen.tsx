import React, { useCallback, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Animated } from 'react-native';
import { FAB, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRecords } from '../hooks/useRecords';
import { RecordItem } from '../components/RecordItem';
import { MonthlySummaryCard } from '../components/MonthlySummaryCard';
import { MonthNavigator } from '../components/MonthNavigator';
import { formatDateGroup } from '../utils/formatters';
import type { Record } from '../types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

type GroupedRecord = {
  date: string;
  dateKey: string;
  records: Record[];
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  const { records, summary, loading, refreshRecords, deleteRecord, year, month } =
    useRecords({ year: selectedYear, month: selectedMonth });
  const [fabVisible, setFabVisible] = useState(true);
  const fabAnimation = useState(new Animated.Value(1))[0];

  // 当页面获得焦点时（从其他页面返回时）自动刷新数据
  useFocusEffect(
    useCallback(() => {
      refreshRecords();
    }, [refreshRecords])
  );

  // 按日期分组记录
  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: GroupedRecord } = {};
    
    records.forEach((record) => {
      const dateKey = formatDateGroup(record.date);
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: formatDateGroup(record.date),
          dateKey,
          records: [],
        };
      }
      groups[dateKey].records.push(record);
    });

    // 对每个分组内的记录按时间倒序排列
    Object.values(groups).forEach((group) => {
      group.records.sort((a, b) => b.date - a.date);
    });

    // 转换为数组并按日期倒序排列
    return Object.values(groups).sort((a, b) => {
      // 今天和昨天排在前面
      if (a.date === '今天') return -1;
      if (b.date === '今天') return 1;
      if (a.date === '昨天') return -1;
      if (b.date === '昨天') return 1;
      // 其他按日期倒序
      return b.records[0].date - a.records[0].date;
    });
  }, [records]);

  // 扁平化分组数据用于 FlatList
  const flatListData = useMemo(() => {
    const result: Array<{ type: 'header' | 'item'; data: any }> = [];
    groupedRecords.forEach((group) => {
      result.push({ type: 'header', data: group });
      group.records.forEach((record) => {
        result.push({ type: 'item', data: record });
      });
    });
    return result;
  }, [groupedRecords]);

  const handleAddPress = () => {
    navigation.navigate('AddRecord');
  };

  const handlePreviousMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    // 不能超过当前月份
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
      return;
    }
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
  };

  const handleMonthChange = (year: number, month: number) => {
    // 不能超过当前月份
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return;
    }
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleTodayPress = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
  };

  const handleRecordPress = (record: Record) => {
    navigation.navigate('AddRecord', { recordId: record.id });
  };

  const handleDelete = useCallback(
    async (id: number) => {
      Alert.alert(
        '确认删除',
        '确定要删除这条记录吗？此操作无法撤销。',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecord(id);
              } catch (error) {
                console.error('Failed to delete record:', error);
                Alert.alert('错误', '删除失败，请重试');
              }
            },
          },
        ]
      );
    },
    [deleteRecord]
  );

  // 处理滚动事件，隐藏/显示 FAB
  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const shouldShow = currentOffset <= 10 || event.nativeEvent.contentOffset.y < 0;
    
    if (shouldShow !== fabVisible) {
      setFabVisible(shouldShow);
      Animated.timing(fabAnimation, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderItem = ({ item }: { item: { type: 'header' | 'item'; data: any } }) => {
    if (item.type === 'header') {
      return (
        <View style={[styles.dateHeader, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleSmall" style={[styles.dateHeaderText, { color: theme.colors.primary }]}>
            {item.data.date}
          </Text>
        </View>
      );
    }
    return (
      <RecordItem
        record={item.data}
        onPress={handleRecordPress}
        onDelete={handleDelete}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text
        variant="bodyLarge"
        style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
      >
        暂无记录
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.emptyHint, { color: theme.colors.onSurfaceVariant }]}
      >
        点击右下角按钮添加第一条记录
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <MonthNavigator
        year={selectedYear}
        month={selectedMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onMonthChange={handleMonthChange}
        onTodayPress={handleTodayPress}
      />
      <View style={styles.content}>
        <MonthlySummaryCard summary={summary} year={year} month={month} />
        {loading && records.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={flatListData}
            renderItem={renderItem}
            keyExtractor={(item, index) => 
              item.type === 'header' 
                ? `header-${item.data.dateKey}` 
                : item.data.id?.toString() || `record-${item.data.date}-${index}`
            }
            contentContainerStyle={
              records.length === 0 ? styles.emptyList : undefined
            }
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refreshRecords}
                colors={[theme.colors.primary]}
              />
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        )}
      </View>
      <Animated.View
        style={[
          styles.fabContainer,
          {
            opacity: fabAnimation,
            transform: [
              {
                scale: fabAnimation,
              },
            ],
          },
        ]}
        pointerEvents={fabVisible ? 'auto' : 'none'}
      >
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddPress}
          color={theme.colors.onPrimary}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginBottom: 6,
    fontSize: 15,
    opacity: 0.6,
  },
  emptyHint: {
    fontSize: 13,
    opacity: 0.5,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  fab: {
    margin: 0,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  dateHeaderText: {
    fontWeight: '500',
    fontSize: 13,
    opacity: 0.8,
  },
});

