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

