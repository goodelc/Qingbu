import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, TouchableOpacity } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  SegmentedButtons,
  Appbar,
  Chip,
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
import { formatDate, formatAmount } from '../utils/formatters';
import { spacing } from '../theme/spacing';
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
  const amountInputRef = useRef<any>(null);

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
  const subcategoryAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (recordId) {
      loadRecord();
    } else {
      // 新增记录时，自动聚焦金额输入框
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 300);
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
      Animated.timing(subcategoryAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [type, parentCategory]);

  // 子分类展开动画
  useEffect(() => {
    Animated.timing(subcategoryAnimation, {
      toValue: showSubcategories ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSubcategories]);

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
        navigation.goBack();
      } else {
        await addRecord(recordData);
        // 新增记录后，询问是否继续记账
        Alert.alert(
          '保存成功',
          '是否继续记一笔？',
          [
            {
              text: '完成',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
            {
              text: '继续',
              onPress: () => {
                // 保留类型和分类，清空金额和备注
                setAmount('');
                setNote('');
                setDate(new Date());
                // 重新聚焦金额输入框
                setTimeout(() => {
                  amountInputRef.current?.focus();
                }, 100);
              },
            },
          ]
        );
      }
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

  // 日期快捷选择
  const setQuickDate = (daysAgo: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - daysAgo);
    setDate(newDate);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={recordId ? '编辑记录' : '记账'} />
      </Appbar.Header>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 20) 
            },
          ]}
        >
          <View style={styles.form}>
            <View style={styles.amountContainer}>
              <TouchableOpacity
                style={styles.amountInputWrapper}
                onPress={() => amountInputRef.current?.focus()}
                activeOpacity={0.7}
              >
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? (
                  <Text style={[styles.amountText, { color: theme.colors.onSurface }]}>
                    {formatAmount(parseFloat(amount))}
                  </Text>
                ) : (
                  <Text style={[styles.amountPlaceholder, { color: theme.colors.onSurfaceVariant }]}>
                    输入金额
                  </Text>
                )}
                <TextInput
                  ref={amountInputRef}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  style={styles.amountInputHidden}
                  underlineColorAndroid="transparent"
                />
              </TouchableOpacity>
              <View style={styles.typeBadgeContainer}>
                <Chip
                  selected={type === 'income'}
                  onPress={() => setType('income')}
                  style={[
                    styles.typeBadge,
                    type === 'income' && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  textStyle={[
                    styles.typeBadgeText,
                    type === 'income' && { color: theme.colors.primary },
                  ]}
                >
                  收入
                </Chip>
                <Chip
                  selected={type === 'expense'}
                  onPress={() => setType('expense')}
                  style={[
                    styles.typeBadge,
                    type === 'expense' && { backgroundColor: theme.colors.errorContainer || theme.colors.error + '20' },
                  ]}
                  textStyle={[
                    styles.typeBadgeText,
                    type === 'expense' && { color: theme.colors.error },
                  ]}
                >
                  支出
                </Chip>
              </View>
              {errors.amount && (
                <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
                  {errors.amount}
                </Text>
              )}
            </View>

            <View style={styles.typeContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                类型
              </Text>
              <SegmentedButtons
                value={type}
                onValueChange={(value) => setType(value as RecordType)}
                buttons={[
                  { value: 'expense', label: '支出' },
                  { value: 'income', label: '收入' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <View style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLabelRow}>
                  <Text variant="bodyLarge" style={styles.label}>
                    分类
                  </Text>
                  {parentCategory && (
                    <>
                      <Text variant="bodyLarge" style={[styles.categoryName, { color: theme.colors.primary }]}>
                        {' '}{parentCategory}
                      </Text>
                      {subcategory && (
                        <Text variant="bodyMedium" style={[styles.subcategoryName, { color: theme.colors.primary }]}>
                          {' > '}{subcategory}
                        </Text>
                      )}
                      <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.checkIcon} />
                    </>
                  )}
                </View>
              </View>
              <View style={styles.categoryGrid} key={type}>
                {currentCategories.map((cat) => {
                  const hasSubcategories = getSubcategories(cat, type).length > 0;
                  const isSelected = parentCategory === cat && !subcategory;
                  const iconName = CATEGORY_ICONS[cat] as any;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryCircleButton,
                        isSelected && {
                          backgroundColor: theme.colors.primaryContainer,
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
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={iconName}
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.onSurface}
                      />
                      <Text
                        style={[
                          styles.categoryCircleLabel,
                          {
                            color: isSelected ? theme.colors.primary : theme.colors.onSurface,
                            fontSize: 11,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {currentSubcategories.length > 0 && showSubcategories && (
                <Animated.View
                  style={[
                    styles.subcategoryContainer,
                    {
                      opacity: subcategoryAnimation,
                      transform: [
                        {
                          translateY: subcategoryAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {currentSubcategories.map((sub) => {
                    const isSelected = subcategory === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        style={[
                          styles.subcategoryCapsule,
                          isSelected && {
                            backgroundColor: theme.colors.primaryContainer,
                          },
                        ]}
                        onPress={() => {
                          setSubcategory(isSelected ? undefined : sub);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.subcategoryCapsuleText,
                            {
                              color: isSelected
                                ? theme.colors.primary
                                : theme.colors.onSurface,
                            },
                          ]}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              )}
              {errors.category && (
                <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
                  {errors.category}
                </Text>
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
              <View style={styles.quickDateContainer}>
                {['今天', '昨天', '前天'].map((label, index) => {
                  // 计算快捷选项对应的日期
                  const quickDate = new Date();
                  quickDate.setDate(quickDate.getDate() - index);
                  quickDate.setHours(0, 0, 0, 0);
                  
                  // 比较当前选择的日期
                  const currentDate = new Date(date);
                  currentDate.setHours(0, 0, 0, 0);
                  
                  const isActive = quickDate.getTime() === currentDate.getTime();
                  
                  return (
                    <Button
                      key={label}
                      mode={isActive ? 'contained-tonal' : 'text'}
                      onPress={() => setQuickDate(index)}
                      compact
                      style={styles.quickDateButton}
                    >
                      {label}
                    </Button>
                  );
                })}
              </View>
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
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
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
    padding: spacing.lg,
    paddingBottom: 50,
    paddingTop: spacing.md,
  },
  form: {
    gap: spacing.lg,
  },
  amountContainer: {
    marginBottom: spacing.md,
  },
  amountInputWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    paddingVertical: spacing.md,
  },
  amountInputHidden: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
  },
  amountPlaceholder: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.3,
  },
  typeBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  typeBadge: {
    height: 32,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 4,
  },
  label: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  typeContainer: {
    marginVertical: spacing.sm,
  },
  segmentedButtons: {
    marginTop: spacing.sm,
  },
  categoryContainer: {
    marginVertical: spacing.sm,
  },
  categoryHeader: {
    marginBottom: spacing.sm,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryName: {
    fontWeight: '600',
  },
  subcategoryName: {
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 6,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
    justifyContent: 'space-between',
  },
  categoryCircleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    marginBottom: spacing.sm,
  },
  categoryCircleLabel: {
    marginTop: spacing.xs,
    fontSize: 11,
    textAlign: 'center',
  },
  dateContainer: {
    marginVertical: spacing.sm,
  },
  dateButton: {
    marginTop: spacing.sm,
  },
  quickDateContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickDateButton: {
    minWidth: 60,
  },
  error: {
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 12,
  },
  buttonContainer: {
    marginTop: 24,
  },
  submitButton: {
    width: '100%',
  },
  subcategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingLeft: spacing.lg,
    overflow: 'hidden',
  },
  subcategoryCapsule: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    marginBottom: spacing.sm,
  },
  subcategoryCapsuleText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

