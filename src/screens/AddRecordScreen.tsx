import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  SegmentedButtons,
  Chip,
  Portal,
  Dialog,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatePickerModal } from 'react-native-paper-dates';
import { useRecords } from '../hooks/useRecords';
import { databaseService } from '../services/DatabaseService';
import { logService } from '../services/LogService';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_ICONS,
  getSubcategories,
  parseCategory,
  formatCategory,
  type CategoryName,
} from '../utils/constants';
import { formatDate, formatAmount } from '../utils/formatters';
import spacing from '../theme/spacing';
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
  const [showNote, setShowNote] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
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
      await logService.logError(
        'AddRecordScreen',
        '加载记录失败',
        error instanceof Error ? error.stack || error.message : String(error)
      );
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
        setShowContinueDialog(true);
      }
    } catch (error) {
      console.error('Failed to save record:', error);
      await logService.logError(
        'AddRecordScreen',
        '保存记录失败',
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          amount,
          type,
          category: formatCategory(parentCategory, subcategory),
        })
      );
      setErrors({ submit: '保存失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const onConfirmDate = React.useCallback(
    (params: any) => {
      setShowDatePicker(false);
      if (params.date) {
        setDate(params.date);
      }
    },
    [setShowDatePicker, setDate]
  );

  // 日期快捷选择
  const setQuickDate = (daysAgo: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - daysAgo);
    setDate(newDate);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.surface || '#FFFFFF' }]}
      edges={['top']}
    >
      {/* 拖拽指示器 */}
      <View style={styles.dragIndicatorContainer}>
        <View style={[styles.dragIndicator, { backgroundColor: theme.colors.onSurfaceVariant || '#CAC4D0', opacity: 0.3 }]} />
      </View>
      
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
              paddingBottom: Math.max(insets.bottom, 24) 
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* 类型选择 */}
            <View style={styles.typeSelectorContainer}>
              <View style={[styles.typeSelectorBackground, { backgroundColor: theme.colors.surfaceVariant || '#F1F3F4' }]}>
                <TouchableOpacity
                  onPress={() => setType('expense')}
                  style={[
                    styles.typeOption,
                    type === 'expense' && { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
                  ]}
                >
                  <Text style={[styles.typeText, type === 'expense' ? { color: theme.colors.error, fontWeight: '800' } : { color: theme.colors.onSurfaceVariant, opacity: 0.6 }]}>支出</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setType('income')}
                  style={[
                    styles.typeOption,
                    type === 'income' && { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
                  ]}
                >
                  <Text style={[styles.typeText, type === 'income' ? { color: theme.colors.primary, fontWeight: '800' } : { color: theme.colors.onSurfaceVariant, opacity: 0.6 }]}>收入</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 金额输入 */}
            <View style={styles.amountContainer}>
              <TouchableOpacity
                style={styles.amountInputWrapper}
                onPress={() => amountInputRef.current?.focus()}
                activeOpacity={0.7}
              >
                <View style={styles.amountRow}>
                  <Text style={[styles.currencySymbol, { color: theme.colors.onSurfaceVariant, opacity: 0.3 }]}>¥</Text>
                  {amount ? (
                    <Text style={[styles.amountText, { color: theme.colors.onSurface }]}>
                      {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  ) : (
                    <Text style={[styles.amountPlaceholder, { color: theme.colors.onSurfaceVariant, opacity: 0.2 }]}>0.00</Text>
                  )}
                </View>
                <TextInput
                  ref={amountInputRef}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  style={styles.amountInputHidden}
                  underlineColorAndroid="transparent"
                />
              </TouchableOpacity>
              {errors.amount && (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.amount}
                </Text>
              )}
            </View>

            {/* 分类网格 */}
            <View style={styles.categoryContainer}>
              <View style={styles.categoryGrid}>
                {currentCategories.map((cat) => {
                  const isSelected = parentCategory === cat;
                  const iconEmoji = CATEGORY_ICONS[cat] || '✨';
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={styles.categoryItem}
                      onPress={() => {
                        setParentCategory(cat);
                        setSubcategory(undefined);
                        setShowSubcategories(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.categoryIconCircle,
                          { backgroundColor: isSelected ? (type === 'expense' ? '#FFEBEE' : '#E0F2F1') : '#F8F9FA' },
                          isSelected && { transform: [{ scale: 1.1 }] }
                        ]}
                      >
                        <Text style={styles.categoryIconEmoji}>{iconEmoji}</Text>
                      </View>
                      <Text
                        style={[
                          styles.categoryLabel,
                          {
                            color: isSelected ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                            fontWeight: isSelected ? '800' : '500',
                            opacity: isSelected ? 1 : 0.6,
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 子分类 */}
              {showSubcategories && currentSubcategories.length > 0 && (
                <Animated.View
                  style={[
                    styles.subcategoryList,
                    {
                      opacity: subcategoryAnimation,
                      transform: [
                        {
                          translateY: subcategoryAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcategoryScroll}>
                    {currentSubcategories.map((sub) => {
                      const isSelected = subcategory === sub;
                      return (
                        <TouchableOpacity
                          key={sub}
                          style={[
                            styles.subcategoryPill,
                            { backgroundColor: isSelected ? (type === 'expense' ? '#FFEBEE' : '#E0F2F1') : '#F1F3F4' },
                          ]}
                          onPress={() => setSubcategory(isSelected ? undefined : sub)}
                        >
                          <Text
                            style={[
                              styles.subcategoryText,
                              {
                                color: isSelected ? (type === 'expense' ? theme.colors.error : theme.colors.primary) : theme.colors.onSurfaceVariant,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </Animated.View>
              )}
            </View>

            {/* 其他输入 */}
            <View style={styles.inputsSection}>
              <TouchableOpacity
                style={[styles.inputRow, { backgroundColor: '#F8F9FA' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar-outline" size={20} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
                <Text style={styles.inputRowText}>{formatDate(date.getTime())}</Text>
                <View style={styles.quickDates}>
                  <TouchableOpacity onPress={() => setQuickDate(0)}><Text style={styles.quickDateText}>今天</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setQuickDate(1)}><Text style={styles.quickDateText}>昨天</Text></TouchableOpacity>
                </View>
              </TouchableOpacity>

              {!showNote && (
                <TouchableOpacity
                  style={[styles.inputRow, { backgroundColor: '#F8F9FA' }]}
                  onPress={() => setShowNote(true)}
                >
                  <Icon name="pencil-outline" size={20} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
                  <Text style={[styles.inputRowText, { opacity: 0.4 }]}>添加备注（可选）</Text>
                </TouchableOpacity>
              )}

              {showNote && (
                <View style={[styles.inputRow, { backgroundColor: '#F8F9FA' }]}>
                  <Icon name="pencil-outline" size={20} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="添加备注..."
                    placeholderTextColor="rgba(0,0,0,0.2)"
                    style={styles.noteInput}
                    underlineColorAndroid="transparent"
                  />
                  <TouchableOpacity onPress={() => {
                    setShowNote(false);
                    setNote('');
                  }}>
                    <Icon name="close" size={18} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: type === 'expense' ? theme.colors.error : theme.colors.primary },
                  loading && { opacity: 0.7 }
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>{recordId ? '更新记录' : '保存账单'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        date={date}
        onConfirm={onConfirmDate}
        label="选择日期"
        animationType="slide"
      />

      <Portal>
        <Dialog
          visible={showContinueDialog}
          onDismiss={() => {
            setShowContinueDialog(false);
            navigation.goBack();
          }}
          style={{ backgroundColor: theme.colors.surface, borderRadius: 28 }}
        >
          <Dialog.Title style={{ fontWeight: '800', fontSize: 20 }}>保存成功</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
              是否继续记一笔？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowContinueDialog(false);
                navigation.goBack();
              }}
              textColor={theme.colors.onSurfaceVariant}
            >
              完成
            </Button>
            <Button
              onPress={() => {
                setShowContinueDialog(false);
                // 保留类型和分类，清空金额和备注
                setAmount('');
                setNote('');
                setShowNote(false);
                setDate(new Date());
                // 重新聚焦金额输入框
                setTimeout(() => {
                  amountInputRef.current?.focus();
                }, 100);
              }}
              mode="contained"
              style={{ borderRadius: 12 }}
            >
              继续
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragIndicator: {
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
  },
  form: {
    gap: 40,
  },
  typeSelectorContainer: {
    alignItems: 'center',
  },
  typeSelectorBackground: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    width: '100%',
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  typeText: {
    fontSize: 14,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  amountInputWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  amountPlaceholder: {
    fontSize: 48,
    fontWeight: '900',
  },
  amountInputHidden: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  categoryContainer: {
    width: '100%',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  categoryItem: {
    width: '18%', // 5-6 per row to fit all categories
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconEmoji: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 11,
  },
  subcategoryList: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  subcategoryScroll: {
    gap: 8,
    paddingRight: 20,
  },
  subcategoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  subcategoryText: {
    fontSize: 12,
  },
  inputsSection: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  inputRowText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  quickDates: {
    flexDirection: 'row',
    gap: 12,
  },
  quickDateText: {
    fontSize: 12,
    color: '#4DB6AC',
    fontWeight: '700',
    opacity: 0.8,
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
    color: '#000',
  },
  buttonContainer: {
    marginTop: 10,
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

