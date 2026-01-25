import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../../utils/formatters';
import type { DailyStat } from '../../types';

interface WeeklyChartProps {
  dailyStats: DailyStat[];
}

const PRIMARY_COLOR = '#4DB6AC';
const ERROR_COLOR = '#EF5350';

export function WeeklyChart({ dailyStats }: WeeklyChartProps) {
  const theme = useTheme();

  const weeklyData = useMemo(() => {
    const weeks: { week: number; income: number; expense: number }[] = [];
    if (dailyStats.length === 0) return weeks;

    // Group daily stats into weeks
    let currentWeekIncome = 0;
    let currentWeekExpense = 0;
    let weekCount = 1;

    dailyStats.forEach((stat, index) => {
      currentWeekIncome += stat.income;
      currentWeekExpense += stat.expense;

      // Every 7 days or at the end of the data, push a week
      if ((index + 1) % 7 === 0 || index === dailyStats.length - 1) {
        weeks.push({
          week: weekCount++,
          income: currentWeekIncome,
          expense: currentWeekExpense,
        });
        currentWeekIncome = 0;
        currentWeekExpense = 0;
      }
    });

    return weeks;
  }, [dailyStats]);

  const maxWeeklyValue = useMemo(() => {
    if (weeklyData.length === 0) return 1;
    return Math.max(...weeklyData.map(w => Math.max(w.income, w.expense)), 1);
  }, [weeklyData]);

  if (weeklyData.length === 0) return null;

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          marginHorizontal: 24,
          marginVertical: 12,
          borderRadius: 32,
          elevation: 0,
          borderWidth: 1,
          borderColor: theme.colors.outline + '20' || '#F1F3F4',
        },
      ]}
    >
      <Card.Content style={{ padding: 20 }}>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface, fontWeight: '800' }]}>
          周度分布
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.5, fontWeight: '600', marginBottom: 20 }}>
          平均每周支出 {formatAmount(weeklyData.reduce((sum, w) => sum + w.expense, 0) / weeklyData.length)}
        </Text>

        <View style={styles.chartArea}>
          {weeklyData.map((week, index) => {
            const incomeH = (week.income / maxWeeklyValue) * 120;
            const expenseH = (week.expense / maxWeeklyValue) * 120;
            
            return (
              <View key={index} style={styles.weekColumn}>
                <View style={styles.barsRow}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: Math.max(incomeH, 4), 
                        backgroundColor: PRIMARY_COLOR + '40',
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: Math.max(expenseH, 4), 
                        backgroundColor: ERROR_COLOR + 'CC',
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.weekLabel, { color: theme.colors.onSurfaceVariant }]}>
                  第{week.week}周
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: PRIMARY_COLOR + '40' }]} />
            <Text style={styles.legendText}>收入</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: ERROR_COLOR + 'CC' }]} />
            <Text style={styles.legendText}>支出</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    marginBottom: 2,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    marginBottom: 16,
  },
  weekColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 8,
  },
  bar: {
    width: 12,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.6,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.5,
  },
});
