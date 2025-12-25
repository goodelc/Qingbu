import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  SegmentedButtons,
  RadioButton,
  Card,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRecords } from '../hooks/useRecords';
import { databaseService } from '../services/DatabaseService';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_ICONS,
  getSubcategories,
  parseCategory,
  formatCategory,
  type CategoryName,
} from '../utils/constants';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
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
  const insets = useSafeAreaInsets();
  const { addRecord, updateRecord } = useRecords({ autoLoad: false });
  const recordId = route.params?.recordId;

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<RecordType>('expense');
  const [parentCategory, setParentCategory] = useState<CategoryName>(EXPENSE_CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState<string | undefined>(undefined);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (recordId) {
      loadRecord();
    }
  }, [recordId]);

  // 获取当前类型对应的分类列表
  const currentCategories = useMemo(() => {
    return type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  }, [type]);

  // 获取当前父分类的子分类列表
  const currentSubcategories = useMemo(() => {
    return getSubcategories(parentCategory, type);
  }, [parentCategory, type]);

  // 当类型改变时，重置父分类和子分类
  useEffect(() => {
    const newCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!(newCategories as readonly string[]).includes(parentCategory)) {
      setParentCategory(newCategories[0] as CategoryName);
      setSubcategory(undefined);
      setShowSubcategories(false);
    }
  }, [type, parentCategory]);

  const loadRecord = async () => {
    try {
      const record = await databaseService.getRecordById(recordId!);
      if (record) {
        setAmount(record.amount.toString());
        setType(record.type);
        // 解析分类（可能是 "父分类/子分类" 格式）
        const { parent, subcategory: sub } = parseCategory(record.category);
        const validCategories =
          record.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        const validParent = (validCategories as readonly string[]).includes(parent)
          ? (parent as CategoryName)
          : (validCategories[0] as CategoryName);
        setParentCategory(validParent);
        // 验证子分类是否有效
        const validSubcategories = getSubcategories(validParent, record.type);
        if (sub && validSubcategories.includes(sub)) {
          setSubcategory(sub);
        } else {
          setSubcategory(undefined);
        }
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

    if (!parentCategory) {
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
        category: formatCategory(parentCategory, subcategory),
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
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 40) 
            },
          ]}
        >
          <View style={styles.form}>
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
                onValueChange={(value) => {
                  const newType = value as RecordType;
                  setType(newType);
                  const newCategories =
                    newType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
                  if (!(newCategories as readonly string[]).includes(parentCategory)) {
                    setParentCategory(newCategories[0] as CategoryName);
                    setSubcategory(undefined);
                    setShowSubcategories(false);
                  }
                }}
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
                {subcategory && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {' '}({parentCategory}/{subcategory})
                  </Text>
                )}
              </Text>
              {!showSubcategories ? (
                <View style={styles.categoryGrid} key={type}>
                  {currentCategories.map((cat) => {
                    const hasSubcategories = getSubcategories(cat, type).length > 0;
                    const isSelected = parentCategory === cat && !subcategory;
                    return (
                      <Card
                        key={cat}
                        style={[
                          styles.categoryCard,
                          isSelected && {
                            backgroundColor: theme.colors.primaryContainer,
                            borderColor: theme.colors.primary,
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => {
                          if (hasSubcategories) {
                            setParentCategory(cat);
                            setShowSubcategories(true);
                            setSubcategory(undefined);
                          } else {
                            setParentCategory(cat);
                            setSubcategory(undefined);
                            setShowSubcategories(false);
                          }
                        }}
                      >
                        <Card.Content style={styles.categoryCardContent}>
                          <RadioButton
                            value={cat}
                            status={isSelected ? 'checked' : 'unchecked'}
                            onPress={() => {
                              if (hasSubcategories) {
                                setParentCategory(cat);
                                setShowSubcategories(true);
                                setSubcategory(undefined);
                              } else {
                                setParentCategory(cat);
                                setSubcategory(undefined);
                                setShowSubcategories(false);
                              }
                            }}
                          />
                          <View style={styles.categoryInfo}>
                            <Icon
                              name={CATEGORY_ICONS[cat] as any}
                              size={24}
                              color={
                                isSelected
                                  ? theme.colors.primary
                                  : theme.colors.onSurface
                              }
                            />
                            <Text
                              variant="bodyMedium"
                              style={[
                                styles.categoryText,
                                isSelected && {
                                  color: theme.colors.primary,
                                  fontWeight: '600',
                                },
                              ]}
                            >
                              {cat}
                            </Text>
                            {hasSubcategories && (
                              <Icon
                                name="chevron-right"
                                size={20}
                                color={theme.colors.onSurfaceVariant}
                              />
                            )}
                          </View>
                        </Card.Content>
                      </Card>
                    );
                  })}
                </View>
              ) : (
                <View>
                  <Button
                    mode="text"
                    icon="arrow-left"
                    onPress={() => {
                      setShowSubcategories(false);
                      setSubcategory(undefined);
                    }}
                    style={styles.backButton}
                  >
                    返回
                  </Button>
                  <Text variant="bodyMedium" style={[styles.label, { marginTop: 8 }]}>
                    选择 {parentCategory} 的子分类
                  </Text>
                  <View style={styles.categoryGrid}>
                    {currentSubcategories.map((sub) => {
                      const isSelected = subcategory === sub;
                      return (
                        <Card
                          key={sub}
                          style={[
                            styles.categoryCard,
                            isSelected && {
                              backgroundColor: theme.colors.primaryContainer,
                              borderColor: theme.colors.primary,
                              borderWidth: 2,
                            },
                          ]}
                          onPress={() => {
                            setSubcategory(sub);
                            setShowSubcategories(false);
                          }}
                        >
                          <Card.Content style={styles.categoryCardContent}>
                            <RadioButton
                              value={sub}
                              status={isSelected ? 'checked' : 'unchecked'}
                              onPress={() => {
                                setSubcategory(sub);
                                setShowSubcategories(false);
                              }}
                            />
                            <View style={styles.categoryInfo}>
                              <Text
                                variant="bodyMedium"
                                style={[
                                  styles.categoryText,
                                  isSelected && {
                                    color: theme.colors.primary,
                                    fontWeight: '600',
                                  },
                                ]}
                              >
                                {sub}
                              </Text>
                            </View>
                          </Card.Content>
                        </Card>
                      );
                    })}
                  </View>
                </View>
              )}
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
    paddingBottom: 50,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryCard: {
    width: '48%',
    marginBottom: 8,
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 4,
  },
  categoryText: {
    flex: 1,
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
});

