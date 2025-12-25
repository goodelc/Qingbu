import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, useTheme, SegmentedButtons } from 'react-native-paper';
import { formatAmount, formatDate } from '../../utils/formatters';
import type { DailyStat } from '../../types';

interface TrendChartProps {
  dailyStats: DailyStat[];
}

type ChartType = 'income' | 'expense' | 'all';

export function TrendChart({ dailyStats }: TrendChartProps) {
  const theme = useTheme();
  const [chartType, setChartType] = React.useState<ChartType>('all');
  const screenWidth = Dimensions.get('window').width;

  const maxValue = useMemo(() => {
    if (dailyStats.length === 0) return 1;
    return Math.max(
      ...dailyStats.map((stat) => Math.max(stat.income, stat.expense))
    );
  }, [dailyStats]);

  if (dailyStats.length === 0) {
    return (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            marginHorizontal: 16,
            marginVertical: 8,
          },
        ]}
      >
        <Card.Content>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            收支趋势
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            暂无数据
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const chartHeight = 200;
  const chartWidth = screenWidth - 64; // 减去 padding
  const barWidth = Math.max(4, (chartWidth - (dailyStats.length - 1) * 4) / dailyStats.length);

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          marginHorizontal: 16,
          marginVertical: 8,
        },
      ]}
    >
      <Card.Content>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          收支趋势
        </Text>

        <SegmentedButtons
          value={chartType}
          onValueChange={(value) => setChartType(value as ChartType)}
          buttons={[
            { value: 'income', label: '收入' },
            { value: 'expense', label: '支出' },
            { value: 'all', label: '全部' },
          ]}
          style={styles.segmentedButtons}
        />

        <View style={styles.chartContainer}>
          <View style={[styles.chart, { height: chartHeight, width: chartWidth }]}>
            {dailyStats.map((stat, index) => {
              const incomeHeight = (stat.income / maxValue) * chartHeight;
              const expenseHeight = (stat.expense / maxValue) * chartHeight;
              
              return (
                <View key={stat.date} style={styles.barContainer}>
                  {(chartType === 'income' || chartType === 'all') && (
                    <View
                      style={[
                        styles.bar,
                        {
                          height: incomeHeight,
                          backgroundColor: theme.colors.primary,
                          width: barWidth,
                          marginRight: chartType === 'all' ? 2 : 0,
                        },
                      ]}
                    />
                  )}
                  {(chartType === 'expense' || chartType === 'all') && (
                    <View
                      style={[
                        styles.bar,
                        {
                          height: expenseHeight,
                          backgroundColor: theme.colors.error,
                          width: barWidth,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* X 轴标签 */}
          <View style={styles.xAxis}>
            {dailyStats
              .filter((_, index) => index % Math.ceil(dailyStats.length / 5) === 0 || index === dailyStats.length - 1)
              .map((stat) => (
                <Text
                  key={stat.date}
                  variant="bodySmall"
                  style={[styles.xAxisLabel, { color: theme.colors.onSurfaceVariant }]}
                >
                  {formatDate(stat.date).split('-').slice(1).join('/')}
                </Text>
              ))}
          </View>
        </View>

        {/* 图例 */}
        <View style={styles.legend}>
          {(chartType === 'income' || chartType === 'all') && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                收入
              </Text>
            </View>
          )}
          {(chartType === 'expense' || chartType === 'all') && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.colors.error }]} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                支出
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    elevation: 2,
  },
  title: {
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
    opacity: 0.7,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 2,
    minHeight: 2,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    opacity: 0.7,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});

