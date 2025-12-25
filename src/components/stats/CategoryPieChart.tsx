import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../../utils/formatters';
import type { CategoryStat } from '../../types';
import { CATEGORY_ICONS } from '../../utils/constants';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface CategoryPieChartProps {
  title: string;
  categories: CategoryStat[];
  type: 'income' | 'expense';
  maxDisplayItems?: number;
}

// 简单的饼图颜色方案
const CHART_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
  '#00BCD4', '#FFC107', '#795548', '#607D8B', '#E91E63',
];

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
            marginHorizontal: 16,
            marginVertical: 8,
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

        {/* 简化的饼图可视化 - 使用进度条表示 */}
        <View style={styles.chartContainer}>
          {displayCategories.map((item, index) => {
            const iconName = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || 'dots-horizontal';
            const chartColor = CHART_COLORS[index % CHART_COLORS.length];
            
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

        <View style={styles.totalContainer}>
          <Text variant="bodyMedium" style={[styles.totalLabel, { color: theme.colors.onSurfaceVariant }]}>
            合计
          </Text>
          <Text variant="titleLarge" style={[styles.totalAmount, { color }]}>
            {formatAmount(totalAmount)}
          </Text>
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
  chartContainer: {
    marginBottom: 16,
  },
  chartItem: {
    marginBottom: 12,
  },
  chartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
  },
  chartItemRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '600',
    marginBottom: 2,
  },
  percentage: {
    opacity: 0.7,
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    opacity: 0.8,
  },
  totalAmount: {
    fontWeight: 'bold',
  },
});

