import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { formatDate, formatDateTime } from '../utils/formatters';
import { parseCategory } from '../utils/constants';
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

  // 解析分类显示
  const { parent, subcategory } = parseCategory(record.category);

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={handlePress}
      mode="outlined"
      contentStyle={styles.cardContent}
    >
      <Card.Content>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.header}>
              <View style={styles.categoryContainer}>
                <View style={styles.categoryRow}>
                  <Text variant="titleMedium" style={styles.category}>
                    {parent}
                  </Text>
                  {subcategory && (
                    <>
                      <Text variant="bodySmall" style={[styles.separator, { color: theme.colors.onSurfaceVariant }]}>
                        {' > '}
                      </Text>
                      <Text variant="bodyMedium" style={[styles.subcategory, { color: theme.colors.primary }]}>
                        {subcategory}
                      </Text>
                    </>
                  )}
                </View>
              </View>
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
    marginVertical: 3,
    elevation: 0,
  },
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  leftSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryContainer: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  category: {
    fontWeight: '500',
    fontSize: 15,
  },
  separator: {
    marginHorizontal: 4,
    opacity: 0.5,
  },
  subcategory: {
    fontWeight: '400',
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    opacity: 0.6,
  },
  note: {
    fontSize: 11,
    flex: 1,
    opacity: 0.6,
  },
  deleteButton: {
    margin: 0,
  },
});

