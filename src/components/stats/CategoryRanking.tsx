import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, ProgressBar } from 'react-native-paper';
import { formatAmount } from '../../utils/formatters';
import type { CategoryStat } from '../../types';
import { CATEGORY_ICONS } from '../../utils/constants';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface CategoryRankingProps {
  title: string;
  categories: CategoryStat[];
  maxItems?: number;
  type: 'income' | 'expense';
}

export function CategoryRanking({
  title,
  categories,
  maxItems = 5,
  type,
}: CategoryRankingProps) {
  const theme = useTheme();

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

  const topCategories = categories.slice(0, maxItems);
  const maxAmount = topCategories[0]?.amount || 1;

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
        {topCategories.map((item, index) => {
          const iconName = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || 'dots-horizontal';
          const color = type === 'income' ? theme.colors.primary : theme.colors.error;
          
          return (
            <View key={item.category} style={styles.rankingItem}>
              <View style={styles.rankHeader}>
                <View style={styles.rankLeft}>
                  <View style={[styles.rankNumber, { backgroundColor: color }]}>
                    <Text variant="labelSmall" style={styles.rankNumberText}>
                      {index + 1}
                    </Text>
                  </View>
                  <Icon
                    name={iconName as any}
                    size={24}
                    color={color}
                    style={styles.icon}
                  />
                  <View style={styles.categoryInfo}>
                    <Text variant="bodyLarge" style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                      {item.category}
                    </Text>
                    <Text variant="bodySmall" style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>
                      {item.count}笔
                    </Text>
                  </View>
                </View>
                <View style={styles.amountContainer}>
                  <Text variant="titleMedium" style={[styles.amount, { color }]}>
                    {formatAmount(item.amount)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.percentage, { color: theme.colors.onSurfaceVariant }]}>
                    {item.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={item.amount / maxAmount}
                color={color}
                style={styles.progressBar}
              />
            </View>
          );
        })}
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
    marginBottom: 12,
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 13,
    opacity: 0.6,
  },
  rankingItem: {
    marginBottom: 12,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankNumberText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
  },
  icon: {
    marginRight: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontWeight: '500',
    marginBottom: 2,
    fontSize: 14,
  },
  count: {
    fontSize: 11,
    opacity: 0.6,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 15,
  },
  percentage: {
    fontSize: 11,
    opacity: 0.6,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
});

