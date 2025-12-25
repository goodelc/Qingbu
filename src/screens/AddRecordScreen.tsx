import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  SegmentedButtons,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRecords } from '../hooks/useRecords';
import { databaseService } from '../services/DatabaseService';
import { CATEGORIES } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import type { Record, RecordType } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type AddRecordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddRecord'
>;

interface AddRecordScreenProps {
  navigation: AddRecordScreenNavigationProp;
  route: {
    params?: {
      recordId?: number;
    };
  };
}

export function AddRecordScreen({ navigation, route }: AddRecordScreenProps) {
  const theme = useTheme();
  const { addRecord, updateRecord } = useRecords({ autoLoad: false });
  const recordId = route.params?.recordId;

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<RecordType>('expense');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (recordId) {
      loadRecord();
    }
  }, [recordId]);

  const loadRecord = async () => {
    try {
      const record = await databaseService.getRecordById(recordId!);
      if (record) {
        setAmount(record.amount.toString());
        setType(record.type);
        setCategory(record.category);
        setDate(new Date(record.date));
        setNote(record.note || '');
      }
    } catch (error) {
      console.error('Failed to load record:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = '请输入有效的金额';
    }

    if (!category) {
      newErrors.category = '请选择分类';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const recordData: Omit<Record, 'id'> = {
        amount: parseFloat(amount),
        type,
        category,
        date: date.getTime(),
        note: note.trim() || undefined,
      };

      if (recordId) {
        await updateRecord(recordId, recordData);
      } else {
        await addRecord(recordData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save record:', error);
      setErrors({ submit: '保存失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.form}>
            <Text variant="headlineSmall" style={styles.title}>
              {recordId ? '编辑记录' : '新增记录'}
            </Text>

            <TextInput
              label="金额"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              error={!!errors.amount}
              style={styles.input}
              left={<TextInput.Icon icon="currency-cny" />}
            />
            {errors.amount && (
              <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
                {errors.amount}
              </Text>
            )}

            <View style={styles.typeContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                类型
              </Text>
              <SegmentedButtons
                value={type}
                onValueChange={(value) => setType(value as RecordType)}
                buttons={[
                  {
                    value: 'expense',
                    label: '支出',
                    icon: 'arrow-down',
                  },
                  {
                    value: 'income',
                    label: '收入',
                    icon: 'arrow-up',
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <View style={styles.categoryContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                分类
              </Text>
              <Menu
                visible={showCategoryMenu}
                onDismiss={() => setShowCategoryMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowCategoryMenu(true)}
                    style={styles.categoryButton}
                    icon="chevron-down"
                  >
                    {category}
                  </Button>
                }
              >
                {CATEGORIES.map((cat) => (
                  <Menu.Item
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryMenu(false);
                    }}
                    title={cat}
                  />
                ))}
              </Menu>
            </View>

            <View style={styles.dateContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                日期
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                {formatDate(date.getTime())}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}
            </View>

            <TextInput
              label="备注（可选）"
              value={note}
              onChangeText={setNote}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              left={<TextInput.Icon icon="note-text" />}
            />

            {errors.submit && (
              <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
                {errors.submit}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.button}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                {recordId ? '更新' : '保存'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    gap: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 4,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  typeContainer: {
    marginVertical: 8,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  categoryContainer: {
    marginVertical: 8,
  },
  categoryButton: {
    marginTop: 8,
  },
  dateContainer: {
    marginVertical: 8,
  },
  dateButton: {
    marginTop: 8,
  },
  error: {
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});

