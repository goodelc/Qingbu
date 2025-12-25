// TODO: 待替换为动态分类（从数据库读取）
export const CATEGORIES = [
  '餐饮',
  '交通',
  '购物',
  '娱乐',
  '医疗',
  '教育',
  '工资',
  '奖金',
  '投资',
  '其他',
] as const;

export type CategoryName = typeof CATEGORIES[number];

