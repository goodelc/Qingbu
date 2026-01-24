import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../utils/formatters';
import { spacing } from '../theme/spacing';
import type { MonthlySummary } from '../types';

interface MonthlySummaryCardProps {
  summary: MonthlySummary;
  year: number;
  month: number;
}

export function MonthlySummaryCard({ summary, year, month }: MonthlySummaryCardProps) {
  const theme = useTheme();

  const isDark = theme.dark;
  
  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.primaryContainer,
          marginHorizontal: spacing.lg,
          marginVertical: spacing.md,
          borderRadius: 16,
          ...(isDark
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
        <Text
          variant="titleMedium"
          style={[styles.title, { color: theme.colors.onPrimaryContainer }]}
        >
          {year}年{month}月汇总
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text
              variant="bodyMedium"
              style={[styles.label, { color: theme.colors.onPrimaryContainer }]}
            >
              收入
            </Text>
            <Text
              variant="headlineSmall"
              style={[styles.amount, { color: theme.colors.primary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatAmount(summary.income)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text
              variant="bodyMedium"
              style={[styles.label, { color: theme.colors.onPrimaryContainer }]}
            >
              支出
            </Text>
            <Text
              variant="headlineSmall"
              style={[styles.amount, { color: theme.colors.error }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatAmount(summary.expense)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text
              variant="bodyMedium"
              style={[styles.label, { color: theme.colors.onPrimaryContainer }]}
            >
              结余
            </Text>
            <Text
              variant="headlineSmall"
              style={[
                styles.amount,
                {
                  color:
                    summary.balance >= 0
                      ? theme.colors.primary
                      : theme.colors.error,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatAmount(summary.balance)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0,
  },
  title: {
    marginBottom: 12,
    fontWeight: '500',
    fontSize: 14,
    opacity: 0.7,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    opacity: 0.7,
  },
  amount: {
    fontWeight: '600',
    fontSize: 18,
  },
});

