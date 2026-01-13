import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme, Portal, Dialog, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setPickerDate(selectedDate);
      if (Platform.OS === 'ios') {
        // iOS 需要确认按钮
        return;
      }
      // Android 直接应用
      onMonthChange(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    }
  };

  const handleConfirm = () => {
    setShowPicker(false);
    onMonthChange(pickerDate.getFullYear(), pickerDate.getMonth() + 1);
  };

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
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={onPreviousMonth}
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
          onPress={onNextMonth}
          iconColor={theme.colors.onSurface}
        />
        {!isCurrentMonth() && onTodayPress && (
          <IconButton
            icon="calendar-today"
            size={20}
            onPress={onTodayPress}
            iconColor={theme.colors.primary}
            style={styles.todayButton}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
});

