import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../../utils/formatters';
import { spacing } from '../../theme/spacing';
import type { CategoryStat } from '../../types';
import { CATEGORY_ICONS } from '../../utils/constants';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface CategoryPieChartProps {
  title: string;
  categories: CategoryStat[];
  type: 'income' | 'expense';
  maxDisplayItems?: number;
}

// 浅色模式颜色方案（高饱和度）
const LIGHT_CHART_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
  '#00BCD4', '#FFC107', '#795548', '#607D8B', '#E91E63',
];

// 深色模式颜色方案（高饱和度但低亮度）
const DARK_CHART_COLORS = [
  '#66BB6A', '#42A5F5', '#FFA726', '#AB47BC', '#EF5350',
  '#26C6DA', '#FFCA28', '#8D6E63', '#78909C', '#EC407A',
];

export function CategoryPieChart({
  title,
  categories,
  type,
  maxDisplayItems = 6,
}: CategoryPieChartProps) {
  const theme = useTheme();
  const chartColors = theme.dark ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

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
            marginHorizontal: spacing.lg,
            marginVertical: spacing.sm,
            borderRadius: 16,
            ...(theme.dark
              ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 1,
                }
              : {
                  elevation: 1,
                }),
          },
        ]}
      >
        <Card.Content>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
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

  const totalAmount = categories.reduce((sum, item) => sum + item.amount, 0);
  const color = type === 'income' ? theme.colors.primary : theme.colors.error;

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
          {title}
        </Text>

        {/* 中心总金额标签 */}
        <View style={styles.centerLabelContainer}>
          <Text variant="bodySmall" style={[styles.centerLabelText, { color: theme.colors.onSurfaceVariant }]}>
            总金额
          </Text>
          <Text variant="headlineMedium" style={[styles.centerLabelAmount, { color }]}>
            {formatAmount(totalAmount)}
          </Text>
        </View>

        {/* 简化的饼图可视化 - 使用进度条表示 */}
        <View style={styles.chartContainer}>
          {displayCategories.map((item, index) => {
            const iconName = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || 'dots-horizontal';
            const chartColor = chartColors[index % chartColors.length];
            
            return (
              <View key={item.category} style={styles.chartItem}>
                <View style={styles.chartItemHeader}>
                  <View style={styles.chartItemLeft}>
                    <View style={[styles.colorIndicator, { backgroundColor: chartColor }]} />
                    <Icon
                      name={iconName as any}
                      size={20}
                      color={theme.colors.onSurface}
                      style={styles.icon}
                    />
                    <Text variant="bodyMedium" style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={styles.chartItemRight}>
                    <Text variant="bodyMedium" style={[styles.amount, { color }]}>
                      {formatAmount(item.amount)}
                    </Text>
                    <Text variant="bodySmall" style={[styles.percentage, { color: theme.colors.onSurfaceVariant }]}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <View style={styles.progressContainer}>
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
                  <Icon
                    name="dots-horizontal"
                    size={20}
                    color={theme.colors.onSurface}
                    style={styles.icon}
                  />
                  <Text variant="bodyMedium" style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                    其他
                  </Text>
                </View>
                <View style={styles.chartItemRight}>
                  <Text variant="bodyMedium" style={[styles.amount, { color }]}>
                    {formatAmount(others.amount)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.percentage, { color: theme.colors.onSurfaceVariant }]}>
                    {others.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
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
    elevation: 0,
    borderWidth: 0,
  },
  title: {
    fontWeight: '500',
    marginBottom: spacing.md,
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontSize: 13,
    opacity: 0.6,
  },
  centerLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  centerLabelText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  centerLabelAmount: {
    fontWeight: '600',
    fontSize: 24,
  },
  chartContainer: {
    marginBottom: spacing.md,
  },
  chartItem: {
    marginBottom: 10,
  },
  chartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  chartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
  },
  chartItemRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 14,
  },
  percentage: {
    fontSize: 11,
    opacity: 0.6,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});

