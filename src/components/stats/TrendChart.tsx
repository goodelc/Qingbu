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
  const gap = 2;
  const maxBars = 30; // 最多显示30个柱子，超过则采样
  const shouldSample = dailyStats.length > maxBars;
  const sampledStats = shouldSample 
    ? dailyStats.filter((_, index) => index % Math.ceil(dailyStats.length / maxBars) === 0 || index === dailyStats.length - 1)
    : dailyStats;
  
  const barWidth = chartType === 'all' 
    ? Math.max(3, (chartWidth - (sampledStats.length - 1) * gap - sampledStats.length * gap) / (sampledStats.length * 2))
    : Math.max(6, (chartWidth - (sampledStats.length - 1) * gap) / sampledStats.length);

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
          {/* Y轴标签 */}
          <View style={styles.yAxisContainer}>
            <Text variant="bodySmall" style={[styles.yAxisLabel, { color: theme.colors.onSurfaceVariant }]}>
              {formatAmount(maxValue)}
            </Text>
            <Text variant="bodySmall" style={[styles.yAxisLabel, { color: theme.colors.onSurfaceVariant }]}>
              {formatAmount(maxValue / 2)}
            </Text>
            <Text variant="bodySmall" style={[styles.yAxisLabel, { color: theme.colors.onSurfaceVariant }]}>
              0
            </Text>
          </View>

          <View style={styles.chartWrapper}>
            <View style={[styles.chart, { height: chartHeight, width: chartWidth }]}>
              {sampledStats.map((stat, index) => {
                const incomeHeight = maxValue > 0 ? (stat.income / maxValue) * chartHeight : 0;
                const expenseHeight = maxValue > 0 ? (stat.expense / maxValue) * chartHeight : 0;
                
                return (
                  <View key={`${stat.date}-${index}`} style={styles.barContainer}>
                    {(chartType === 'income' || chartType === 'all') && (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(incomeHeight, 1),
                            backgroundColor: theme.colors.primary,
                            width: barWidth,
                            marginRight: chartType === 'all' ? gap : 0,
                          },
                        ]}
                      />
                    )}
                    {(chartType === 'expense' || chartType === 'all') && (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(expenseHeight, 1),
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
              {sampledStats.map((stat, index) => {
                const step = Math.max(1, Math.floor(sampledStats.length / 5));
                const shouldShow = index % step === 0 || index === sampledStats.length - 1;
                const itemWidth = chartType === 'all' ? barWidth * 2 + gap : barWidth + gap;
                
                if (!shouldShow) {
                  return <View key={`${stat.date}-spacer-${index}`} style={{ width: itemWidth }} />;
                }
                
                return (
                  <Text
                    key={`${stat.date}-label-${index}`}
                    variant="bodySmall"
                    style={[
                      styles.xAxisLabel,
                      { color: theme.colors.onSurfaceVariant, width: itemWidth },
                    ]}
                  >
                    {formatDate(stat.date).split('-').slice(1).join('/')}
                  </Text>
                );
              })}
            </View>
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
    flexDirection: 'row',
    marginBottom: 16,
  },
  yAxisContainer: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingBottom: 20,
    height: 200,
  },
  yAxisLabel: {
    fontSize: 10,
    opacity: 0.7,
  },
  chartWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 8,
    paddingLeft: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 2,
  },
  bar: {
    borderRadius: 2,
    minHeight: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    marginTop: 8,
    paddingLeft: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
    minWidth: 40,
  },
  xAxisSpacer: {
    minWidth: 40,
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

