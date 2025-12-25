import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/DatabaseService';
import { getMonthRange } from '../utils/formatters';
import type { CategoryStat, DailyStat, ComparisonData, MonthlySummary } from '../types';

interface UseStatsOptions {
  year?: number;
  month?: number;
  startDate?: number;
  endDate?: number;
  autoLoad?: boolean;
}

export function useStats(options: UseStatsOptions = {}) {
  const { year, month, startDate, endDate, autoLoad = true } = options;
  
  const currentDate = new Date();
  const currentYear = year ?? currentDate.getFullYear();
  const currentMonth = month ?? currentDate.getMonth() + 1;

  // 计算日期范围
  const getDateRange = useCallback(() => {
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    const { start, end } = getMonthRange(currentYear, currentMonth);
    return { start, end };
  }, [currentYear, currentMonth, startDate, endDate]);

  const [summary, setSummary] = useState<MonthlySummary>({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [expenseCategories, setExpenseCategories] = useState<CategoryStat[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryStat[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getDateRange();
      
      // 并行加载所有统计数据
      const [
        records,
        expenseCats,
        incomeCats,
        daily,
      ] = await Promise.all([
        databaseService.getRecordsByDateRange(start, end),
        databaseService.getExpenseByCategory(start, end),
        databaseService.getIncomeByCategory(start, end),
        databaseService.getDailyStats(start, end),
      ]);

      // 对比数据只在按月查看时加载
      let comparisonData: ComparisonData | null = null;
      if (!startDate || !endDate) {
        // 只有在使用月份选择时才加载对比数据
        try {
          comparisonData = await databaseService.getComparisonStats(currentYear, currentMonth, 'month');
        } catch (err) {
          console.warn('Failed to load comparison data:', err);
        }
      }

      // 计算汇总
      const income = records
        .filter((r) => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);
      const expense = records
        .filter((r) => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);

      setSummary({
        income,
        expense,
        balance: income - expense,
      });
      setExpenseCategories(expenseCats);
      setIncomeCategories(incomeCats);
      setDailyStats(daily);
      setComparison(comparisonData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load stats'));
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, currentYear, currentMonth]);

  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
  }, [autoLoad, loadStats]);

  const refreshStats = useCallback(() => {
    return loadStats();
  }, [loadStats]);

  return {
    summary,
    expenseCategories,
    incomeCategories,
    dailyStats,
    comparison,
    loading,
    error,
    refreshStats,
    year: currentYear,
    month: currentMonth,
  };
}

