import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import type { Record, MonthlySummary, CategoryStat, DailyStat, ComparisonData } from '../types';
import { getMonthRange } from '../utils/formatters';
import { parseCategory } from '../utils/constants';

class DatabaseService {
  private db: SQLiteDatabase | null = null;
  private initialized = false;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initialized && this.db) {
      return;
    }

    try {
      this.db = await openDatabaseAsync('qingbu.db');
      
      // 创建 records 表
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
          category TEXT NOT NULL,
          date INTEGER NOT NULL,
          note TEXT
        );
      `);

      this.initialized = true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * 获取数据库实例
   */
  private getDb(): SQLiteDatabase {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * 添加记录
   */
  async addRecord(record: Omit<Record, 'id'>): Promise<number> {
    const db = this.getDb();
    const result = await db.runAsync(
      'INSERT INTO records (amount, type, category, date, note) VALUES (?, ?, ?, ?, ?)',
      [record.amount, record.type, record.category, record.date, record.note || null]
    );
    return result.lastInsertRowId;
  }

  /**
   * 删除记录
   */
  async deleteRecord(id: number): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM records WHERE id = ?', [id]);
  }

  /**
   * 更新记录
   */
  async updateRecord(id: number, record: Partial<Omit<Record, 'id'>>): Promise<void> {
    const db = this.getDb();
    const updates: string[] = [];
    const values: any[] = [];

    if (record.amount !== undefined) {
      updates.push('amount = ?');
      values.push(record.amount);
    }
    if (record.type !== undefined) {
      updates.push('type = ?');
      values.push(record.type);
    }
    if (record.category !== undefined) {
      updates.push('category = ?');
      values.push(record.category);
    }
    if (record.date !== undefined) {
      updates.push('date = ?');
      values.push(record.date);
    }
    if (record.note !== undefined) {
      updates.push('note = ?');
      values.push(record.note);
    }

    if (updates.length === 0) {
      return;
    }

    values.push(id);
    await db.runAsync(
      `UPDATE records SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * 根据 ID 获取记录
   */
  async getRecordById(id: number): Promise<Record | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<Record>(
      'SELECT * FROM records WHERE id = ?',
      [id]
    );
    return result || null;
  }

  /**
   * 获取指定月份的所有记录（按时间倒序）
   */
  async getRecordsByMonth(year: number, month: number): Promise<Record[]> {
    const db = this.getDb();
    const { start, end } = getMonthRange(year, month);
    const records = await db.getAllAsync<Record>(
      'SELECT * FROM records WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC',
      [start, end]
    );
    return records;
  }

  /**
   * 获取所有记录（按时间倒序）
   */
  async getAllRecords(): Promise<Record[]> {
    const db = this.getDb();
    const records = await db.getAllAsync<Record>(
      'SELECT * FROM records ORDER BY date DESC, id DESC'
    );
    return records;
  }

  /**
   * 获取月度汇总
   */
  async getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const db = this.getDb();
    const { start, end } = getMonthRange(year, month);

    const incomeResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM records WHERE type = ? AND date >= ? AND date <= ?',
      ['income', start, end]
    );

    const expenseResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM records WHERE type = ? AND date >= ? AND date <= ?',
      ['expense', start, end]
    );

    const income = incomeResult?.total || 0;
    const expense = expenseResult?.total || 0;
    const balance = income - expense;

    return { income, expense, balance };
  }

  /**
   * 获取指定时间范围的记录
   */
  async getRecordsByDateRange(startDate: number, endDate: number): Promise<Record[]> {
    const db = this.getDb();
    const records = await db.getAllAsync<Record>(
      'SELECT * FROM records WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC',
      [startDate, endDate]
    );
    return records;
  }

  /**
   * 按分类统计支出
   */
  async getExpenseByCategory(startDate: number, endDate: number): Promise<CategoryStat[]> {
    const db = this.getDb();
    const results = await db.getAllAsync<{ category: string; total: number; count: number }>(
      `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
       FROM records 
       WHERE type = 'expense' AND date >= ? AND date <= ? 
       GROUP BY category`,
      [startDate, endDate]
    );

    if (results.length === 0) {
      return [];
    }

    // 按父分类合并
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    results.forEach((item) => {
      const { parent } = parseCategory(item.category);
      if (categoryMap.has(parent)) {
        const existing = categoryMap.get(parent)!;
        existing.amount += item.total;
        existing.count += item.count;
      } else {
        categoryMap.set(parent, { amount: item.total, count: item.count });
      }
    });

    const total = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.amount, 0);
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * 按分类统计收入
   */
  async getIncomeByCategory(startDate: number, endDate: number): Promise<CategoryStat[]> {
    const db = this.getDb();
    const results = await db.getAllAsync<{ category: string; total: number; count: number }>(
      `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
       FROM records 
       WHERE type = 'income' AND date >= ? AND date <= ? 
       GROUP BY category`,
      [startDate, endDate]
    );

    if (results.length === 0) {
      return [];
    }

    // 按父分类合并
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    results.forEach((item) => {
      const { parent } = parseCategory(item.category);
      if (categoryMap.has(parent)) {
        const existing = categoryMap.get(parent)!;
        existing.amount += item.total;
        existing.count += item.count;
      } else {
        categoryMap.set(parent, { amount: item.total, count: item.count });
      }
    });

    const total = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.amount, 0);
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * 按日统计收支
   */
  async getDailyStats(startDate: number, endDate: number): Promise<DailyStat[]> {
    const db = this.getDb();
    
    // 获取所有记录，然后在应用层按天分组
    // 因为 SQLite 的日期函数可能不准确处理毫秒时间戳
    const records = await db.getAllAsync<{
      date: number;
      type: string;
      amount: number;
    }>(
      `SELECT date, type, amount
       FROM records 
       WHERE date >= ? AND date <= ? 
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    // 按日期分组（按天，忽略时分秒）
    const dateMap = new Map<number, { income: number; expense: number }>();
    
    records.forEach((record) => {
      // 将时间戳转换为日期，然后重置为当天的 00:00:00
      const dayStart = new Date(record.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayKey = dayStart.getTime();
      
      if (!dateMap.has(dayKey)) {
        dateMap.set(dayKey, { income: 0, expense: 0 });
      }
      
      const dayData = dateMap.get(dayKey)!;
      if (record.type === 'income') {
        dayData.income += record.amount;
      } else {
        dayData.expense += record.amount;
      }
    });

    // 转换为数组并计算结余
    const stats: DailyStat[] = [];
    dateMap.forEach((data, date) => {
      stats.push({
        date,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      });
    });

    return stats.sort((a, b) => a.date - b.date);
  }

  /**
   * 获取对比数据（同比/环比）
   */
  async getComparisonStats(
    year: number,
    month: number,
    compareType: 'month' | 'year'
  ): Promise<ComparisonData> {
    const current = await this.getMonthlySummary(year, month);
    
    let previousYear = year;
    let previousMonth = month;
    
    if (compareType === 'month') {
      previousMonth = month - 1;
      if (previousMonth < 1) {
        previousMonth = 12;
        previousYear = year - 1;
      }
    } else {
      previousYear = year - 1;
    }
    
    const previous = await this.getMonthlySummary(previousYear, previousMonth);
    
    const incomeChange = current.income - previous.income;
    const expenseChange = current.expense - previous.expense;
    const balanceChange = current.balance - previous.balance;
    
    const incomeChangePercent = previous.income > 0 
      ? (incomeChange / previous.income) * 100 
      : (current.income > 0 ? 100 : 0);
    const expenseChangePercent = previous.expense > 0 
      ? (expenseChange / previous.expense) * 100 
      : (current.expense > 0 ? 100 : 0);
    const balanceChangePercent = previous.balance !== 0 
      ? (balanceChange / Math.abs(previous.balance)) * 100 
      : (current.balance !== 0 ? 100 : 0);
    
    return {
      current,
      previous,
      incomeChange,
      expenseChange,
      balanceChange,
      incomeChangePercent,
      expenseChangePercent,
      balanceChangePercent,
    };
  }

  /**
   * 导出数据为 CSV（预留方法）
   * TODO: 实现 CSV 导出功能
   */
  async exportToCSV(): Promise<string> {
    // 预留接口，当前返回空字符串
    return Promise.resolve('');
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }
}

// 导出单例实例
export const databaseService = new DatabaseService();

