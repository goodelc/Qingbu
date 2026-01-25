
export type RecordType = 'income' | 'expense';

export interface TransactionRecord {
  id: string;
  amount: number;
  type: RecordType;
  category: string;
  date: number;
  note?: string;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailyStat {
  date: string;
  income: number;
  expense: number;
}
