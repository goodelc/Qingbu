import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../../utils/formatters';
import spacing from '../../theme/spacing';
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

  const isDark = theme.dark;
  const balanceColor = summary.balance >= 0 
    ? theme.colors.primary 
    : theme.colors.error;

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
      <Card.Content style={styles.content}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryItem, { backgroundColor: theme.colors.primaryContainer + '40' }]}>
            <Text variant="bodySmall" style={[styles.label, { color: theme.colors.primary, fontWeight: '800' }]}>
              月收入
            </Text>
            <Text
              variant="headlineSmall"
              style={[styles.amount, { color: theme.colors.primary, fontWeight: '900' }]}
              numberOfLines={1}
            >
              {formatAmount(summary.income)}
            </Text>
            {comparison && renderChangeIndicator(
              comparison.incomeChange,
              comparison.incomeChangePercent
            )}
          </View>

          <View style={[styles.summaryItem, { backgroundColor: theme.colors.errorContainer + '40' }]}>
            <Text variant="bodySmall" style={[styles.label, { color: theme.colors.error, fontWeight: '800' }]}>
              月支出
            </Text>
            <Text
              variant="headlineSmall"
              style={[styles.amount, { color: theme.colors.error, fontWeight: '900' }]}
              numberOfLines={1}
            >
              {formatAmount(summary.expense)}
            </Text>
            {comparison && renderChangeIndicator(
              comparison.expenseChange,
              comparison.expenseChangePercent
            )}
          </View>
        </View>

        <View style={[styles.balanceItem, { backgroundColor: balanceColor + '10' }]}>
          <View>
            <Text variant="bodySmall" style={[styles.label, { color: balanceColor, fontWeight: '800' }]}>
              本月结余
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.balanceAmount, { color: balanceColor, fontWeight: '900' }]}
            >
              {formatAmount(summary.balance)}
            </Text>
          </View>
          {comparison && (
            <View style={styles.balanceComparison}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.onSurfaceVariant, opacity: 0.5, marginBottom: 4 }}>较上月</Text>
              {renderChangeIndicator(
                comparison.balanceChange,
                comparison.balanceChangePercent
              )}
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
  content: {
    padding: 20,
    gap: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    justifyContent: 'center',
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
  label: {
    fontSize: 11,
    marginBottom: 4,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 18,
  },
  balanceAmount: {
    fontSize: 26,
  },
  balanceComparison: {
    alignItems: 'flex-end',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

