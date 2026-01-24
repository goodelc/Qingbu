import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  SegmentedButtons,
  Card,
  Appbar,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecurringItems } from '../hooks/useRecurringItems';
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
import type { RecordType, PeriodType, RecurringItem } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type AddRecurringItemScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddRecurringItem'
>;

interface AddRecurringItemScreenProps {
  navigation: AddRecurringItemScreenNavigationProp;
  route: {
    params?: {
      itemId?: number;
    };
  };
}

export function AddRecurringItemScreen({ navigation, route }: AddRecurringItemScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addItem, updateItem } = useRecurringItems({ autoLoad: false });
  const itemId = route.params?.itemId;
  const nameInputRef = useRef<any>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<RecordType>('expense');
  const [amount, setAmount] = useState('');
  const [parentCategory, setParentCategory] = useState<CategoryName>(EXPENSE_CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState<string | undefined>(undefined);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [periodDay, setPeriodDay] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (itemId) {
      loadItem();
    } else {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    }
  }, [itemId]);

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

  const loadItem = async () => {
    try {
      const item = await databaseService.getRecurringItemById(itemId!);
      if (item) {
        setName(item.name);
        setType(item.type);
        setAmount(item.amount.toString());
        const { parent, subcategory: sub } = parseCategory(item.category);
        const validCategories =
          item.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        const validParent = (validCategories as readonly string[]).includes(parent)
          ? (parent as CategoryName)
          : (validCategories[0] as CategoryName);
        setParentCategory(validParent);
        const validSubcategories = getSubcategories(validParent, item.type);
        if (sub && validSubcategories.includes(sub)) {
          setSubcategory(sub);
        } else {
          setSubcategory(undefined);
        }
        setPeriodType(item.periodType);
        if (item.periodDay) {
          setPeriodDay(item.periodDay.toString());
        }
        setNote(item.note || '');
      }
    } catch (error) {
      console.error('Failed to load item:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = '请输入项目名称';
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = '请输入有效的金额';
    }

    if (!parentCategory) {
      newErrors.category = '请选择分类';
    }

    if (periodType === 'monthly') {
      const day = parseInt(periodDay);
      if (isNaN(day) || day < 1 || day > 31) {
        newErrors.periodDay = '请输入1-31之间的数字';
      }
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
      const itemData: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        amount: parseFloat(amount),
        type,
        category: formatCategory(parentCategory, subcategory),
        periodType,
        periodDay: periodType === 'monthly' ? parseInt(periodDay) : undefined,
        note: note.trim() || undefined,
        enabled: true,
      };

      if (itemId) {
        await updateItem(itemId, itemData);
        navigation.goBack();
      } else {
        await addItem(itemData);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      setErrors({ submit: '保存失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={itemId ? '编辑固定收支' : '添加固定收支'}
          titleStyle={{ fontSize: 18 }}
        />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 项目名称 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                项目名称 *
              </Text>
              <TextInput
                ref={nameInputRef}
                value={name}
                onChangeText={setName}
                placeholder="如：工资、房贷"
                mode="outlined"
                error={!!errors.name}
                style={styles.input}
              />
              {errors.name && (
                <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                  {errors.name}
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* 类型 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                类型 *
              </Text>
              <SegmentedButtons
                value={type}
                onValueChange={(value) => setType(value as RecordType)}
                buttons={[
                  { value: 'expense', label: '支出' },
                  { value: 'income', label: '收入' },
                ]}
              />
            </Card.Content>
          </Card>

          {/* 金额 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                金额 *
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                mode="outlined"
                keyboardType="decimal-pad"
                error={!!errors.amount}
                style={styles.input}
                left={<TextInput.Icon icon="currency-cny" />}
              />
              {errors.amount && (
                <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                  {errors.amount}
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* 分类 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                分类 *
              </Text>
              <View style={styles.categoryContainer}>
                {currentCategories.map((category) => {
                  const icon = CATEGORY_ICONS[category] as any;
                  const isSelected = parentCategory === category;
                  return (
                    <Button
                      key={category}
                      mode={isSelected ? 'contained' : 'outlined'}
                      onPress={() => {
                        setParentCategory(category);
                        setShowSubcategories(true);
                        setSubcategory(undefined);
                      }}
                      style={styles.categoryButton}
                      icon={() => <Icon name={icon} size={20} />}
                    >
                      {category}
                    </Button>
                  );
                })}
              </View>
              {showSubcategories && currentSubcategories.length > 0 && (
                <View style={styles.subcategoryContainer}>
                  {currentSubcategories.map((sub) => {
                    const isSelected = subcategory === sub;
                    return (
                      <Button
                        key={sub}
                        mode={isSelected ? 'contained' : 'outlined'}
                        onPress={() => {
                          setSubcategory(isSelected ? undefined : sub);
                        }}
                        style={styles.subcategoryButton}
                        compact
                      >
                        {sub}
                      </Button>
                    );
                  })}
                </View>
              )}
              {errors.category && (
                <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                  {errors.category}
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* 周期类型 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                周期 *
              </Text>
              <SegmentedButtons
                value={periodType}
                onValueChange={(value) => setPeriodType(value as PeriodType)}
                buttons={[
                  { value: 'daily', label: '每天' },
                  { value: 'weekly', label: '每周' },
                  { value: 'monthly', label: '每月' },
                ]}
              />
              {periodType === 'monthly' && (
                <View style={styles.periodDayContainer}>
                  <Text variant="bodyMedium" style={{ marginTop: 16, marginBottom: 8 }}>
                    每月几号
                  </Text>
                  <TextInput
                    value={periodDay}
                    onChangeText={setPeriodDay}
                    placeholder="1-31"
                    mode="outlined"
                    keyboardType="number-pad"
                    error={!!errors.periodDay}
                    style={styles.input}
                  />
                  {errors.periodDay && (
                    <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                      {errors.periodDay}
                    </Text>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* 备注 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                备注
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="可选"
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            </Card.Content>
          </Card>

          {errors.submit && (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginHorizontal: 16 }}>
              {errors.submit}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            {itemId ? '更新' : '保存'}
          </Button>
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
    paddingBottom: 32,
    paddingTop: 12,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  subcategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  subcategoryButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  periodDayContainer: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 16,
    marginHorizontal: 16,
  },
});
