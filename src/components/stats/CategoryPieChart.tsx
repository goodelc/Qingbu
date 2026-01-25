import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../../utils/formatters';
import spacing from '../../theme/spacing';
import type { CategoryStat } from '../../types';
import { CATEGORY_ICONS } from '../../utils/constants';

interface CategoryPieChartProps {
  title: string;
  categories: CategoryStat[];
  type: 'income' | 'expense';
  maxDisplayItems?: number;
}

// 核心配色 (参考 Google AI Studio)
const CHART_COLORS = ['#4DB6AC', '#80CBC4', '#B2DFDB', '#E0F2F1', '#26A69A'];

export function CategoryPieChart({
  title,
  categories,
  type,
  maxDisplayItems = 6,
}: CategoryPieChartProps) {
  const theme = useTheme();

  const { displayCategories, others } = useMemo(() => {
    if (categories.length <= maxDisplayItems) {
      return { displayCategories: categories, others: null };
    }
    
    const display = categories.slice(0, maxDisplayItems - 1);
    const othersAmount = categories
      .slice(maxDisplayItems - 1)
      .reduce((sum, item) => sum + item.amount, 0);
    const othersPercentage = categories
      .slice(maxDisplayItems - 1)
      .reduce((sum, item) => sum + item.percentage, 0);
    
    return {
      displayCategories: display,
      others: {
        category: '其他',
        amount: othersAmount,
        percentage: othersPercentage,
        count: categories.slice(maxDisplayItems - 1).reduce((sum, item) => sum + item.count, 0),
      },
    };
  }, [categories, maxDisplayItems]);

  if (categories.length === 0) {
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
        <Card.Content style={{ padding: 24 }}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface, fontWeight: '800' }]}>
            {title}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 20 }]}
          >
            暂无占比数据
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const totalAmount = categories.reduce((sum, item) => sum + item.amount, 0);
  const accentColor = type === 'income' ? '#4DB6AC' : '#EF5350';

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
      <Card.Content style={{ padding: 24 }}>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface, fontWeight: '800' }]}>
          {title}
        </Text>

        {/* 中心总金额标签 */}
        <View style={[styles.centerLabelContainer, { backgroundColor: accentColor + '08' }]}>
          <Text variant="bodySmall" style={[styles.centerLabelText, { color: theme.colors.onSurfaceVariant, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }]}>
            总金额
          </Text>
          <Text variant="headlineMedium" style={[styles.centerLabelAmount, { color: accentColor, fontWeight: '900' }]}>
            {formatAmount(totalAmount)}
          </Text>
        </View>

        {/* 简化的饼图可视化 - 使用进度条表示 */}
        <View style={styles.chartContainer}>
          {displayCategories.map((item, index) => {
            const iconEmoji = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || '✨';
            const chartColor = CHART_COLORS[index % CHART_COLORS.length];
            
            return (
              <View key={item.category} style={styles.chartItem}>
                <View style={styles.chartItemHeader}>
                  <View style={styles.chartItemLeft}>
                    <View style={[styles.colorIndicator, { backgroundColor: chartColor }]} />
                    <Text style={styles.iconEmoji}>{iconEmoji}</Text>
                    <Text variant="bodyMedium" style={[styles.categoryName, { color: theme.colors.onSurface, fontWeight: '700' }]}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={styles.chartItemRight}>
                    <Text variant="bodyMedium" style={[styles.amount, { color: theme.colors.onSurface, fontWeight: '800' }]}>
                      {formatAmount(item.amount)}
                    </Text>
                    <Text variant="bodySmall" style={[styles.percentage, { color: theme.colors.onSurfaceVariant, fontWeight: '600' }]}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressContainer, { backgroundColor: chartColor + '15' }]}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: chartColor,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
          
          {others && (
            <View style={styles.chartItem}>
              <View style={styles.chartItemHeader}>
                <View style={styles.chartItemLeft}>
                  <View style={[styles.colorIndicator, { backgroundColor: theme.colors.onSurfaceVariant }]} />
                  <Text style={styles.iconEmoji}>✨</Text>
                  <Text variant="bodyMedium" style={[styles.categoryName, { color: theme.colors.onSurface, fontWeight: '700' }]}>
                    其他
                  </Text>
                </View>
                <View style={styles.chartItemRight}>
                  <Text variant="bodyMedium" style={[styles.amount, { color: theme.colors.onSurface, fontWeight: '800' }]}>
                    {formatAmount(others.amount)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.percentage, { color: theme.colors.onSurfaceVariant, fontWeight: '600' }]}>
                    {others.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={[styles.progressContainer, { backgroundColor: theme.colors.onSurfaceVariant + '15' }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${others.percentage}%`,
                      backgroundColor: theme.colors.onSurfaceVariant,
                    },
                  ]}
                />
              </View>
            </View>
          )}
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
    fontSize: 16,
    marginBottom: 24,
  },
  emptyText: {
    opacity: 0.5,
  },
  centerLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 24,
    borderRadius: 20,
  },
  centerLabelText: {
    fontSize: 10,
    marginBottom: 4,
  },
  centerLabelAmount: {
    fontSize: 28,
  },
  chartContainer: {
    gap: 16,
  },
  chartItem: {
    gap: 8,
  },
  chartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
  },
  chartItemRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
  },
  percentage: {
    fontSize: 11,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
