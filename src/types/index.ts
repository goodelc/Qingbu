export type RecordType = 'income' | 'expense';

export type Category = string;

export interface Record {
  id?: number;
  amount: number;
  type: RecordType;
  category: Category;
  date: number; // Unix timestamp in milliseconds
  note?: string;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

// 统计相关类型
export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailyStat {
  date: number; // Unix timestamp in milliseconds
  income: number;
  expense: number;
  balance: number;
}

export interface ComparisonData {
  current: MonthlySummary;
  previous: MonthlySummary;
  incomeChange: number; // 变化金额
  expenseChange: number;
  balanceChange: number;
  incomeChangePercent: number; // 变化百分比
  expenseChangePercent: number;
  balanceChangePercent: number;
}

// 固定收支相关类型
export type PeriodType = 'monthly' | 'weekly' | 'daily';

export interface RecurringItem {
  id?: number;
  name: string;
  amount: number;
  type: RecordType;
  category: Category;
  periodType: PeriodType;
  periodDay?: number; // 每月几号（1-31），仅用于 monthly 类型
  note?: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RecurringRecord {
  id?: number;
  recurringItemId: number;
  recordId: number;
  targetDate: number; // 目标日期（年月日，用于判断是否已创建）
  createdAt: number;
}
