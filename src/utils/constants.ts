// TODO: 待替换为动态分类（从数据库读取）

// 支出分类及其子分类
export const EXPENSE_CATEGORIES_WITH_SUBCATEGORIES = {
  餐饮: ['早餐', '午餐', '晚餐', '大餐', '饮料', '其他'],
  交通: ['油费', '停车费', '洗车费', '过路费', '打车', '公交', '地铁', '其他'],
  购物: ['服装', '鞋子', '电子产品', '日用品', '化妆品', '书籍', '其他'],
  娱乐: ['电影', 'KTV', '游戏', '旅游', '运动', '其他'],
  医疗: ['挂号', '药品', '检查', '治疗', '其他'],
  教育: ['学费', '培训', '书籍', '文具', '其他'],
  住房: ['房租', '物业', '装修', '家具', '其他'],
  通讯: ['话费', '网费', '其他'],
  水电: ['电费', '水费', '燃气费', '其他'],
  服饰: ['衣服', '鞋子', '配饰', '其他'],
  日用品: ['洗漱', '清洁', '纸巾', '其他'],
  零食: [],
  烟酒: [],
  育儿: ['奶粉', '纸尿裤', '辅食零食', '衣服', '玩具', '疫苗', '医疗', '保险', '其他'],
  其他: [],
} as const;

// 收入分类及其子分类
export const INCOME_CATEGORIES_WITH_SUBCATEGORIES = {
  工资: [],
  奖金: ['年终奖', '绩效奖', '项目奖', '其他'],
  投资: ['股票', '基金', '理财', '其他'],
  兼职: [],
  理财: ['利息', '分红', '其他'],
  礼金: ['红包', '礼物', '其他'],
  退款: [],
  其他: [],
} as const;

// 父分类列表
export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORIES_WITH_SUBCATEGORIES) as Array<keyof typeof EXPENSE_CATEGORIES_WITH_SUBCATEGORIES>;
export const INCOME_CATEGORIES = Object.keys(INCOME_CATEGORIES_WITH_SUBCATEGORIES) as Array<keyof typeof INCOME_CATEGORIES_WITH_SUBCATEGORIES>;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type CategoryName = ExpenseCategory | IncomeCategory;

// 分类图标映射（使用 MaterialCommunityIcons）
export const CATEGORY_ICONS: Record<CategoryName, string> = {
  // 支出分类图标
  '餐饮': 'food-fork-drink',
  '交通': 'car',
  '购物': 'shopping',
  '娱乐': 'movie-open',
  '医疗': 'hospital-building',
  '教育': 'school',
  '住房': 'home',
  '通讯': 'phone',
  '水电': 'lightning-bolt',
  '服饰': 'tshirt-crew',
  '日用品': 'basket',
  '育儿': 'baby-face-outline',
  '零食': 'cookie',
  '烟酒': 'glass-wine',
  // 收入分类图标
  '工资': 'cash-multiple',
  '奖金': 'gift',
  '投资': 'chart-line',
  '兼职': 'briefcase',
  '理财': 'bank',
  '礼金': 'gift-outline',
  '退款': 'cash-refund',
  // 共用分类（支出和收入都有）
  '其他': 'dots-horizontal',
};

// 获取子分类
export function getSubcategories(
  parentCategory: CategoryName,
  type: 'income' | 'expense'
): readonly string[] {
  if (type === 'expense') {
    return EXPENSE_CATEGORIES_WITH_SUBCATEGORIES[parentCategory as ExpenseCategory] || [];
  } else {
    return INCOME_CATEGORIES_WITH_SUBCATEGORIES[parentCategory as IncomeCategory] || [];
  }
}

// 解析分类字符串（格式：父分类/子分类 或 父分类）
export function parseCategory(category: string): { parent: string; subcategory?: string } {
  const parts = category.split('/');
  if (parts.length === 2) {
    return { parent: parts[0], subcategory: parts[1] };
  }
  return { parent: category };
}

// 格式化分类字符串
export function formatCategory(parent: string, subcategory?: string): string {
  return subcategory ? `${parent}/${subcategory}` : parent;
}

