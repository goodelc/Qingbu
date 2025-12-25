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

