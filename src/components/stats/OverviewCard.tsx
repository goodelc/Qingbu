import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../../utils/formatters';
import type { MonthlySummary, ComparisonData } from '../../types';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface OverviewCardProps {
  summary: MonthlySummary;
  comparison?: ComparisonData | null;
}

export function OverviewCard({ summary, comparison }: OverviewCardProps) {
  const theme = useTheme();

  const renderChangeIndicator = (change: number, changePercent: number) => {
    if (change === 0) {
      return (
        <View style={styles.changeContainer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            无变化
          </Text>
        </View>
      );
    }

    const isPositive = change > 0;
    const color = isPositive ? theme.colors.primary : theme.colors.error;
    const icon = isPositive ? 'arrow-up' : 'arrow-down';

    return (
      <View style={styles.changeContainer}>
        <Icon name={icon} size={16} color={color} />
        <Text variant="bodySmall" style={{ color, marginLeft: 4 }}>
          {Math.abs(changePercent).toFixed(1)}%
        </Text>
      </View>
    );
  };

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
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <View style={[styles.item, styles.incomeItem]}>
            <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              总收入
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.amount, { color: theme.colors.primary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatAmount(summary.income)}
            </Text>
            {comparison && renderChangeIndicator(
              comparison.incomeChange,
              comparison.incomeChangePercent
            )}
          </View>

          <View style={[styles.item, styles.expenseItem]}>
            <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              总支出
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.amount, { color: theme.colors.error }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatAmount(summary.expense)}
            </Text>
            {comparison && renderChangeIndicator(
              comparison.expenseChange,
              comparison.expenseChangePercent
            )}
          </View>
        </View>

        <View style={[styles.item, styles.balanceItem]}>
          <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            结余
          </Text>
          <Text
            variant="headlineLarge"
            style={[
              styles.amount,
              {
                color: summary.balance >= 0 ? theme.colors.primary : theme.colors.error,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatAmount(summary.balance)}
          </Text>
          {comparison && renderChangeIndicator(
            comparison.balanceChange,
            comparison.balanceChangePercent
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
  content: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  incomeItem: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(0,0,0,0.08)',
  },
  expenseItem: {
    // 右侧项
  },
  balanceItem: {
    alignItems: 'center',
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    opacity: 0.7,
  },
  amount: {
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 20,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});

