import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onMonthChange: (year: number, month: number) => void;
  onTodayPress?: () => void;
}

export function MonthNavigator({
  year,
  month,
  onPreviousMonth,
  onNextMonth,
  onMonthChange,
  onTodayPress,
}: MonthNavigatorProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(year, month - 1, 1));

  // 当年月改变时，更新 pickerDate
  useEffect(() => {
    setPickerDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const handleMonthPress = () => {
    setPickerDate(new Date(year, month - 1, 1));
    setShowPicker(true);
  };

  const onConfirm = React.useCallback(
    (params: any) => {
      setShowPicker(false);
      if (params.date) {
        onMonthChange(params.date.getFullYear(), params.date.getMonth() + 1);
      }
    },
    [onMonthChange]
  );

  const monthNames = [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
  ];

  const isCurrentMonth = () => {
    const today = new Date();
    return year === today.getFullYear() && month === today.getMonth() + 1;
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outline,
          },
        ]}
      >
        <View style={styles.leftSection}>
          <IconButton
            icon="chevron-left"
            size={22}
            onPress={onPreviousMonth}
            iconColor={theme.colors.onSurface}
            style={styles.navButton}
          />
          <TouchableOpacity
            style={styles.monthContainer}
            onPress={handleMonthPress}
            activeOpacity={0.7}
          >
            <Text
              variant="titleMedium"
              style={[styles.monthText, { color: theme.colors.onSurface }]}
            >
              {year}年 {monthNames[month - 1]}
            </Text>
          </TouchableOpacity>
          <IconButton
            icon="chevron-right"
            size={22}
            onPress={onNextMonth}
            iconColor={theme.colors.onSurface}
            style={styles.navButton}
          />
        </View>
        <View style={styles.rightSection}>
          {!isCurrentMonth() && onTodayPress && (
            <TouchableOpacity
              onPress={onTodayPress}
              style={[styles.todayButton, { backgroundColor: theme.colors.surfaceVariant || '#F1F3F4' }]}
              activeOpacity={0.7}
            >
              <Text style={styles.todayButtonText}>今天</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleMonthPress}
            style={[styles.calendarButton, { backgroundColor: theme.colors.surfaceVariant || '#F1F3F4' }]}
            activeOpacity={0.7}
          >
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={showPicker}
        onDismiss={() => setShowPicker(false)}
        date={pickerDate}
        onConfirm={onConfirm}
        label="选择月份"
        animationType="slide"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    margin: 0,
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  monthText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4DB6AC',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 18,
  },
});

