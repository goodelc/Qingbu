import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useStats } from '../hooks/useStats';
import { DateRangeSelector } from '../components/stats/DateRangeSelector';
import { OverviewCard } from '../components/stats/OverviewCard';
import { TrendChart } from '../components/stats/TrendChart';
import { WeeklyChart } from '../components/stats/WeeklyChart';
import { CategoryPieChart } from '../components/stats/CategoryPieChart';
import { CategoryRanking } from '../components/stats/CategoryRanking';
import spacing from '../theme/spacing';

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
      style={[styles.container, { backgroundColor: theme.colors.background || '#FBFBFC' }]}
      edges={['top']}
    >
      <View style={{ backgroundColor: theme.colors.surface }}>
        <DateRangeSelector
          year={selectedYear}
          month={selectedMonth}
          onDateChange={handleDateChange}
          onRangeChange={handleRangeChange}
        />
      </View>
      {loading && summary.income === 0 && summary.expense === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
          showsVerticalScrollIndicator={false}
        >
          <OverviewCard summary={summary} comparison={comparison} />
          
          {dailyStats.length > 0 && (
            <>
              <TrendChart dailyStats={dailyStats} />
              <WeeklyChart dailyStats={dailyStats} />
            </>
          )}

          {expenseCategories.length > 0 && (
            <>
              <CategoryPieChart
                title="支出占比"
                categories={expenseCategories}
                type="expense"
              />
              <CategoryRanking
                title="支出排行"
                categories={expenseCategories}
                type="expense"
                maxItems={5}
              />
            </>
          )}

          {incomeCategories.length > 0 && (
            <>
              <CategoryPieChart
                title="收入占比"
                categories={incomeCategories}
                type="income"
              />
              <CategoryRanking
                title="收入排行"
                categories={incomeCategories}
                type="income"
                maxItems={5}
              />
            </>
          )}

          {expenseCategories.length === 0 && incomeCategories.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text variant="displaySmall" style={{ fontSize: 40, marginBottom: 16 }}>🍃</Text>
              <Text
                variant="titleSmall"
                style={[styles.emptyText, { color: theme.colors.onSurfaceVariant, opacity: 0.5 }]}
              >
                暂时没有统计数据哦
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
    paddingBottom: 40,
    paddingTop: 12,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontWeight: '700',
  },
});

