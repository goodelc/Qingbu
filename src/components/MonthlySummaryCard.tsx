import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../utils/formatters';
import type { MonthlySummary } from '../types';

interface MonthlySummaryCardProps {
  summary: MonthlySummary;
  year: number;
  month: number;
}

export function MonthlySummaryCard({ summary, year, month }: MonthlySummaryCardProps) {
  const theme = useTheme();

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.primaryContainer,
          marginHorizontal: 16,
          marginVertical: 8,
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
    elevation: 2,
  },
  title: {
    marginBottom: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    marginBottom: 4,
    opacity: 0.8,
  },
  amount: {
    fontWeight: 'bold',
  },
});

