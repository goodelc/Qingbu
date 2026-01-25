import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../utils/formatters';
import spacing from '../theme/spacing';
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
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.primaryContainer || '#E0F2F1',
            borderRadius: 32, // 超大圆角
            elevation: 0,
          },
        ]}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text
              variant="labelSmall"
              style={[styles.label, { color: theme.colors.primary, opacity: 0.8, letterSpacing: 2, textTransform: 'uppercase' }]}
            >
              本月结余
            </Text>
            <Text
              variant="displaySmall"
              style={[styles.balanceAmount, { color: theme.colors.onPrimaryContainer || '#004D40' }]}
            >
              {formatAmount(summary.balance)}
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.colors.primary, opacity: 0.1 }]} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text
                variant="labelSmall"
                style={[styles.subLabel, { color: theme.colors.primary, opacity: 0.6 }]}
              >
                收入
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.amount, { color: theme.colors.primary }]}
              >
                {formatAmount(summary.income)}
              </Text>
            </View>
            
            <View style={[styles.verticalDivider, { backgroundColor: theme.colors.primary, opacity: 0.2 }]} />

            <View style={styles.summaryItem}>
              <Text
                variant="labelSmall"
                style={[styles.subLabel, { color: theme.colors.error, opacity: 0.6 }]}
              >
                支出
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.amount, { color: theme.colors.error }]}
              >
                {formatAmount(summary.expense)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    borderWidth: 0,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontWeight: '800',
    marginBottom: 4,
  },
  balanceAmount: {
    fontWeight: '900',
    fontSize: 32,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 30,
  },
  subLabel: {
    marginBottom: 4,
    fontWeight: '700',
    fontSize: 10,
  },
  amount: {
    fontWeight: '800',
    fontSize: 16,
  },
});

