import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount, formatDate } from '../../utils/formatters';
import spacing from '../../theme/spacing';
import type { DailyStat } from '../../types';

interface TrendChartProps {
  dailyStats: DailyStat[];
}

type ChartType = 'income' | 'expense';

// 核心颜色（参考项目）
const PRIMARY_COLOR = '#4DB6AC';
const ERROR_COLOR = '#EF5350';

export function TrendChart({ dailyStats }: TrendChartProps) {
  const theme = useTheme();
  const [chartType, setChartType] = React.useState<ChartType>('expense');
  const screenWidth = Dimensions.get('window').width;

  const maxValue = useMemo(() => {
    if (dailyStats.length === 0) return 1;
    if (chartType === 'income') return Math.max(...dailyStats.map(s => s.income), 1);
    return Math.max(...dailyStats.map(s => s.expense), 1);
  }, [dailyStats, chartType]);

  // 显示最近的数据（参考项目显示最近10条）
  const maxBars = 10;
  const sampledStats = dailyStats.length > maxBars 
    ? dailyStats.slice(-maxBars) 
    : dailyStats;
  
  const barWidth = (Dimensions.get('window').width - 48 - 48) / sampledStats.length - 4; // 减去 padding 和间距

  if (dailyStats.length === 0) {
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
        <Card.Content style={{ padding: 16 }}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface, fontWeight: '800' }]}>
            收支趋势
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 20 }]}
          >
            暂无趋势数据
          </Text>
        </Card.Content>
      </Card>
    );
  }

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
      <Card.Content style={{ padding: 16 }}>
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface, fontWeight: '800' }]}>
            收支趋势
          </Text>
          <View style={[styles.typeToggle, { backgroundColor: theme.colors.surfaceVariant || '#F1F3F4' }]}>
            <TouchableOpacity 
              onPress={() => setChartType('expense')} 
              style={[
                styles.toggleBtn, 
                chartType === 'expense' && { 
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }
              ]}
            >
              <Text style={[styles.toggleText, { color: chartType === 'expense' ? ERROR_COLOR : theme.colors.onSurfaceVariant }]}>支出</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setChartType('income')} 
              style={[
                styles.toggleBtn, 
                chartType === 'income' && { 
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }
              ]}
            >
              <Text style={[styles.toggleText, { color: chartType === 'income' ? PRIMARY_COLOR : theme.colors.onSurfaceVariant }]}>收入</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartArea}>
          <View style={styles.barsContainer}>
            {sampledStats.map((stat, index) => {
              const val = chartType === 'income' ? stat.income : stat.expense;
              const h = maxValue > 0 ? (val / maxValue) * 140 : 0;
              const barColor = chartType === 'income' ? PRIMARY_COLOR : ERROR_COLOR;
              
              return (
                <View key={index} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.barItem, 
                      { 
                        height: Math.max(h, 4), 
                        backgroundColor: barColor, 
                        width: Math.max(barWidth, 6),
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }
                    ]} 
                  />
                  <Text style={[styles.xAxisText, { color: theme.colors.onSurfaceVariant || '#86868B' }]}>
                    {new Date(stat.date).getDate()}
                  </Text>
                </View>
              );
            })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
  },
  typeToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 16,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chartArea: {
    height: 256, // 参考项目的 h-64 (256px)
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 240,
    paddingHorizontal: 0,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 8,
  },
  barItem: {
    minHeight: 4,
  },
  xAxisText: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.6,
  },
  emptyText: {
    opacity: 0.5,
  },
});
