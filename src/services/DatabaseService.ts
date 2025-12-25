import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import type { Record, MonthlySummary } from '../types';
import { getMonthRange } from '../utils/formatters';

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

