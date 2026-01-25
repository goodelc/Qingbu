import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../../utils/formatters';
import spacing from '../../theme/spacing';
import type { CategoryStat } from '../../types';

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
            暂无排行数据
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const topCategories = categories.slice(0, maxItems);
  const maxAmount = topCategories[0]?.amount || 1;
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
        {topCategories.map((item, index) => {
          return (
            <View key={item.category} style={styles.rankingItem}>
              <View style={styles.rankHeader}>
                <View style={styles.rankLeft}>
                  <View style={[styles.rankNumber, { backgroundColor: accentColor + '15' }]}>
                    <Text style={[styles.rankNumberText, { color: accentColor }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text variant="bodyMedium" style={[styles.categoryName, { color: theme.colors.onSurface, fontWeight: '700' }]}>
                      {item.category}
                    </Text>
                    <Text variant="bodySmall" style={[styles.count, { color: theme.colors.onSurfaceVariant, fontWeight: '600' }]}>
                      {item.count} 笔
                    </Text>
                  </View>
                </View>
                <View style={styles.amountContainer}>
                  <Text variant="bodyMedium" style={[styles.amount, { color: theme.colors.onSurface, fontWeight: '800' }]}>
                    {formatAmount(item.amount)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.percentage, { color: theme.colors.onSurfaceVariant, fontWeight: '600' }]}>
                    {item.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={[styles.progressContainer, { backgroundColor: accentColor + '10' }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${(item.amount / maxAmount) * 100}%`,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
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
  rankingItem: {
    marginBottom: 20,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberText: {
    fontWeight: '800',
    fontSize: 13,
  },
  categoryInfo: {
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
  },
  count: {
    fontSize: 11,
    opacity: 0.5,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
  },
  percentage: {
    fontSize: 11,
    opacity: 0.5,
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
