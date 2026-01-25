import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { getMonthRange } from '../../utils/formatters';

type DateRangeType = 'month' | 'year' | 'custom';

interface DateRangeSelectorProps {
  year: number;
  month: number;
  onDateChange: (year: number, month: number) => void;
  onRangeChange?: (startDate: number, endDate: number) => void;
}

export function DateRangeSelector({
  year,
  month,
  onDateChange,
  onRangeChange,
}: DateRangeSelectorProps) {
  const theme = useTheme();
  const [rangeType, setRangeType] = useState<DateRangeType>('month');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(year, month - 1, 1));

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
        onDateChange(params.date.getFullYear(), params.date.getMonth() + 1);
      }
    },
    [onDateChange]
  );

  const handlePreviousMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onDateChange(newYear, newMonth);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
      return;
    }
    onDateChange(newYear, newMonth);
  };

  const handleTodayPress = () => {
    const today = new Date();
    onDateChange(today.getFullYear(), today.getMonth() + 1);
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return year === today.getFullYear() && month === today.getMonth() + 1;
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ];

  // 当范围类型改变时，更新日期范围
  useEffect(() => {
    if (onRangeChange) {
      if (rangeType === 'month') {
        const { start, end } = getMonthRange(year, month);
        onRangeChange(start, end);
      } else if (rangeType === 'year') {
        const start = new Date(year, 0, 1).getTime();
        const end = new Date(year, 11, 31, 23, 59, 59, 999).getTime();
        onRangeChange(start, end);
      }
    }
  }, [rangeType, year, month, onRangeChange]);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outline + '15',
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={[styles.typeToggle, { backgroundColor: theme.colors.surfaceVariant || '#F1F3F4' }]}>
            <TouchableOpacity 
              onPress={() => setRangeType('month')} 
              style={[
                styles.toggleBtn, 
                rangeType === 'month' && { 
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }
              ]}
            >
              <Text style={[styles.toggleText, { color: rangeType === 'month' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>按月</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setRangeType('year')} 
              style={[
                styles.toggleBtn, 
                rangeType === 'year' && { 
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }
              ]}
            >
              <Text style={[styles.toggleText, { color: rangeType === 'year' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>按年</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rightActions}>
            {rangeType === 'month' && !isCurrentMonth() && (
              <TouchableOpacity
                onPress={handleTodayPress}
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

        <View style={styles.navigatorRow}>
          <IconButton
            icon="chevron-left"
            size={22}
            onPress={rangeType === 'month' ? handlePreviousMonth : () => onDateChange(year - 1, month)}
            iconColor={theme.colors.onSurface}
            style={styles.navButton}
          />
          <TouchableOpacity
            style={styles.dateDisplay}
            onPress={handleMonthPress}
            activeOpacity={0.7}
          >
            <Text
              variant="titleMedium"
              style={[styles.dateText, { color: theme.colors.onSurface }]}
            >
              {rangeType === 'month' ? `${year}年 ${monthNames[month - 1]}` : `${year}年`}
            </Text>
          </TouchableOpacity>
          <IconButton
            icon="chevron-right"
            size={22}
            onPress={rangeType === 'month' ? handleNextMonth : () => {
              const currentYear = new Date().getFullYear();
              if (year < currentYear) onDateChange(year + 1, month);
            }}
            iconColor={theme.colors.onSurface}
            style={styles.navButton}
          />
        </View>
      </View>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={showPicker}
        onDismiss={() => setShowPicker(false)}
        date={pickerDate}
        onConfirm={onConfirm}
        label="选择时间"
        animationType="slide"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  typeToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 16,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4DB6AC',
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 16,
  },
  navigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navButton: {
    margin: 0,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

