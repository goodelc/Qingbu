import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { formatAmount } from '../utils/formatters';
import type { RecordType } from '../types';

interface AmountBadgeProps {
  amount: number;
  type: RecordType;
  size?: 'small' | 'medium' | 'large';
}

export function AmountBadge({ amount, type, size = 'medium' }: AmountBadgeProps) {
  const theme = useTheme();
  const isIncome = type === 'income';
  const color = isIncome ? theme.colors.primary : theme.colors.error;

  const fontSize = size === 'small' ? 12 : size === 'large' ? 24 : 16;
  const fontWeight = '800'; // 更粗的字体

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.amount,
          { color, fontSize, fontWeight },
        ]}
      >
        {isIncome ? '+' : '-'}{formatAmount(amount).replace('¥', '')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: 'System',
  },
});

