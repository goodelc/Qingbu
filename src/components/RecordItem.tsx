import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { formatDate, formatDateTime } from '../utils/formatters';
import { AmountBadge } from './AmountBadge';
import type { Record } from '../types';

interface RecordItemProps {
  record: Record;
  onPress?: (record: Record) => void;
  onDelete?: (id: number) => void;
  showTime?: boolean;
}

export function RecordItem({
  record,
  onPress,
  onDelete,
  showTime = false,
}: RecordItemProps) {
  const theme = useTheme();

  const handlePress = () => {
    onPress?.(record);
  };

  const handleDelete = () => {
    if (record.id && onDelete) {
      onDelete(record.id);
    }
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={handlePress}
    >
      <Card.Content>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.category}>
                {record.category}
              </Text>
              <AmountBadge amount={record.amount} type={record.type} size="medium" />
            </View>
            <View style={styles.meta}>
              <Text variant="bodySmall" style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                {showTime ? formatDateTime(record.date) : formatDate(record.date)}
              </Text>
              {record.note && (
                <Text
                  variant="bodySmall"
                  style={[styles.note, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {record.note}
                </Text>
              )}
            </View>
          </View>
          {onDelete && record.id && (
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={handleDelete}
              style={styles.deleteButton}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 12,
  },
  note: {
    fontSize: 12,
    flex: 1,
  },
  deleteButton: {
    margin: 0,
  },
});

