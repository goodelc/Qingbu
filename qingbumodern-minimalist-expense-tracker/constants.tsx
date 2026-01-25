
import React from 'react';

export const COLORS = {
  primary: '#4DB6AC',
  primaryLight: '#E0F2F1',
  error: '#EF5350',
  errorLight: '#FFEBEE',
  background: '#FBFBFC',
  text: '#1D1D1F',
  textMuted: '#86868B',
};

export const EXPENSE_CATEGORIES = [
  { name: '餐饮', icon: '🍽️' },
  { name: '交通', icon: '🚗' },
  { name: '购物', icon: '🛍️' },
  { name: '娱乐', icon: '🎮' },
  { name: '医疗', icon: '🏥' },
  { name: '教育', icon: '📚' },
  { name: '住房', icon: '🏠' },
  { name: '通讯', icon: '📱' },
  { name: '日用品', icon: '🧻' },
  { name: '还款', icon: '💳' },
  { name: '其他', icon: '✨' },
];

export const INCOME_CATEGORIES = [
  { name: '工资', icon: '💰' },
  { name: '奖金', icon: '🎁' },
  { name: '投资', icon: '📈' },
  { name: '兼职', icon: '💼' },
  { name: '理财', icon: '🏦' },
  { name: '其他', icon: '✨' },
];

export const CATEGORY_MAP: Record<string, string> = {
  ...Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.name, c.icon])),
  ...Object.fromEntries(INCOME_CATEGORIES.map(c => [c.name, c.icon])),
};
