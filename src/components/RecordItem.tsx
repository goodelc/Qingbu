import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatDate, formatDateTime } from '../utils/formatters';
import { parseCategory, CATEGORY_ICONS } from '../utils/constants';
import { AmountBadge } from './AmountBadge';
import spacing from '../theme/spacing';
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

  const handleLongPress = () => {
    if (record.id && onDelete) {
      onDelete(record.id);
    }
  };

  // 解析分类显示
  const { parent, subcategory } = parseCategory(record.category);
  const iconEmoji = CATEGORY_ICONS[parent as keyof typeof CATEGORY_ICONS] || '✨';

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 20, // 更大的圆角
          borderWidth: 0, // 去掉边框
          elevation: 1, // 极其微妙的阴影
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
      ]}
      onPress={handlePress}
      onLongPress={onDelete ? handleLongPress : undefined}
      mode="elevated"
      contentStyle={styles.cardContent}
    >
      <Card.Content>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceVariant || '#F8F9FA' }]}>
              <Text style={styles.iconEmoji}>{iconEmoji}</Text>
            </View>
            <View style={styles.infoSection}>
              <Text variant="titleSmall" style={[styles.category, { color: theme.colors.onSurface }]}>
                {parent}
                {subcategory && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '400' }}>
                    {' · '}{subcategory}
                  </Text>
                )}
              </Text>
              <Text variant="bodySmall" style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                {record.note || (showTime ? formatDateTime(record.date) : formatDate(record.date))}
              </Text>
            </View>
          </View>
          
          <View style={styles.rightSection}>
            <AmountBadge amount={record.amount} type={record.type} size="medium" />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginVertical: 6, // 稍微紧凑一点
  },
  cardContent: {
    padding: 0, // 使用内部 padding
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  category: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
});

