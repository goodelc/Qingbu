import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useStats } from '../hooks/useStats';
import { DateRangeSelector } from '../components/stats/DateRangeSelector';
import { OverviewCard } from '../components/stats/OverviewCard';
import { TrendChart } from '../components/stats/TrendChart';
import { CategoryPieChart } from '../components/stats/CategoryPieChart';
import { CategoryRanking } from '../components/stats/CategoryRanking';

export function StatsScreen() {
  const theme = useTheme();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [startDate, setStartDate] = useState<number | undefined>(undefined);
  const [endDate, setEndDate] = useState<number | undefined>(undefined);

  const {
    summary,
    expenseCategories,
    incomeCategories,
    dailyStats,
    comparison,
    loading,
    refreshStats,
  } = useStats({
    year: selectedYear,
    month: selectedMonth,
    startDate,
    endDate,
  });

  useFocusEffect(
    useCallback(() => {
      refreshStats();
    }, [refreshStats])
  );

  const handleDateChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleRangeChange = (start: number, end: number) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <DateRangeSelector
        year={selectedYear}
        month={selectedMonth}
        onDateChange={handleDateChange}
        onRangeChange={handleRangeChange}
      />
      {loading && summary.income === 0 && summary.expense === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshStats}
              colors={[theme.colors.primary]}
            />
          }
        >
          <OverviewCard summary={summary} comparison={comparison} />
          
          {dailyStats.length > 0 && (
            <TrendChart dailyStats={dailyStats} />
          )}

          {expenseCategories.length > 0 && (
            <>
              <CategoryPieChart
                title="支出分类统计"
                categories={expenseCategories}
                type="expense"
              />
              <CategoryRanking
                title="支出排行榜"
                categories={expenseCategories}
                type="expense"
                maxItems={5}
              />
            </>
          )}

          {incomeCategories.length > 0 && (
            <>
              <CategoryPieChart
                title="收入分类统计"
                categories={incomeCategories}
                type="income"
              />
              <CategoryRanking
                title="收入排行榜"
                categories={incomeCategories}
                type="income"
                maxItems={5}
              />
            </>
          )}

          {expenseCategories.length === 0 && incomeCategories.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text
                variant="bodyLarge"
                style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
              >
                暂无统计数据
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.emptyHint, { color: theme.colors.onSurfaceVariant }]}
              >
                添加一些记账记录后即可查看统计
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
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
});

