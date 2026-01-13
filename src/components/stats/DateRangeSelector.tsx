import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme, Portal, Dialog, Button, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setPickerDate(selectedDate);
      if (Platform.OS === 'ios') {
        return;
      }
      onDateChange(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    }
  };

  const handleConfirm = () => {
    setShowPicker(false);
    onDateChange(pickerDate.getFullYear(), pickerDate.getMonth() + 1);
  };

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
            borderBottomColor: theme.colors.outline,
          },
        ]}
      >
        <View style={styles.rangeTypeContainer}>
          <SegmentedButtons
            value={rangeType}
            onValueChange={(value) => setRangeType(value as DateRangeType)}
            buttons={[
              { value: 'month', label: '按月' },
              { value: 'year', label: '按年' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
        {rangeType === 'month' && (
          <View style={styles.monthNavigator}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={handlePreviousMonth}
              iconColor={theme.colors.onSurface}
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
              size={24}
              onPress={handleNextMonth}
              iconColor={theme.colors.onSurface}
            />
            {!isCurrentMonth() && (
              <IconButton
                icon="calendar-today"
                size={20}
                onPress={handleTodayPress}
                iconColor={theme.colors.primary}
                style={styles.todayButton}
              />
            )}
          </View>
        )}
        {rangeType === 'year' && (
          <View style={styles.yearContainer}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={() => onDateChange(year - 1, month)}
              iconColor={theme.colors.onSurface}
            />
            <Text
              variant="titleMedium"
              style={[styles.yearText, { color: theme.colors.onSurface }]}
            >
              {year}年
            </Text>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => {
                const currentYear = new Date().getFullYear();
                if (year < currentYear) {
                  onDateChange(year + 1, month);
                }
              }}
              iconColor={theme.colors.onSurface}
            />
          </View>
        )}
      </View>

      {Platform.OS === 'ios' && showPicker && (
        <Portal>
          <Dialog visible={showPicker} onDismiss={() => setShowPicker(false)}>
            <Dialog.Title>选择年月</Dialog.Title>
            <Dialog.Content>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                locale="zh_CN"
                maximumDate={new Date()}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowPicker(false)}>取消</Button>
              <Button onPress={handleConfirm}>确定</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rangeTypeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  segmentedButtons: {
    marginVertical: 0,
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontWeight: '500',
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  todayButton: {
    marginLeft: -4,
  },
  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  yearText: {
    fontWeight: '500',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
  },
});

