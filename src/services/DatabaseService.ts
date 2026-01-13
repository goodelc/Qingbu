import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import type { Record, MonthlySummary, CategoryStat, DailyStat, ComparisonData, RecurringItem, RecurringRecord } from '../types';
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

      // 创建 recurring_items 表（固定收支项目）
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS recurring_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
          category TEXT NOT NULL,
          period_type TEXT NOT NULL,
          period_day INTEGER,
          note TEXT,
          enabled INTEGER DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      // 创建 recurring_records 表（追踪已创建的记录）
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS recurring_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recurring_item_id INTEGER NOT NULL,
          record_id INTEGER NOT NULL,
          target_date INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          UNIQUE(recurring_item_id, target_date)
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
   * 导出数据为 CSV
   * @param startDate 开始日期（可选，Unix 时间戳毫秒）
   * @param endDate 结束日期（可选，Unix 时间戳毫秒）
   * @returns CSV 格式的字符串
   */
  async exportToCSV(startDate?: number, endDate?: number): Promise<string> {
    const db = this.getDb();
    
    let records: Record[];
    if (startDate && endDate) {
      records = await this.getRecordsByDateRange(startDate, endDate);
    } else {
      records = await this.getAllRecords();
    }

    // CSV 表头
    const headers = ['ID', '类型', '金额', '分类', '日期', '备注'];
    const csvRows: string[] = [headers.join(',')];

    // 转义 CSV 字段（处理包含逗号、引号、换行符的内容）
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      // 如果包含逗号、引号或换行符，需要用引号包裹并转义引号
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // 格式化日期
    const formatDateForCSV = (timestamp: number): string => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    // 添加数据行
    records.forEach((record) => {
      const row = [
        record.id?.toString() || '',
        record.type === 'income' ? '收入' : '支出',
        record.amount.toFixed(2),
        escapeCSV(record.category),
        formatDateForCSV(record.date),
        escapeCSV(record.note || ''),
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // ==================== 固定收支相关方法 ====================

  /**
   * 添加固定收支项目
   */
  async addRecurringItem(item: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = this.getDb();
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO recurring_items (name, amount, type, category, period_type, period_day, note, enabled, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.name,
        item.amount,
        item.type,
        item.category,
        item.periodType,
        item.periodDay || null,
        item.note || null,
        item.enabled ? 1 : 0,
        now,
        now,
      ]
    );
    return result.lastInsertRowId;
  }

  /**
   * 获取所有固定收支项目
   */
  async getRecurringItems(type?: 'income' | 'expense'): Promise<RecurringItem[]> {
    const db = this.getDb();
    let query = 'SELECT * FROM recurring_items';
    const params: any[] = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const items = await db.getAllAsync<any>(query, params);
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      category: item.category,
      periodType: item.period_type,
      periodDay: item.period_day,
      note: item.note,
      enabled: item.enabled === 1,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  /**
   * 获取启用的固定收支项目
   */
  async getEnabledRecurringItems(): Promise<RecurringItem[]> {
    const db = this.getDb();
    const items = await db.getAllAsync<any>(
      'SELECT * FROM recurring_items WHERE enabled = 1 ORDER BY created_at DESC'
    );
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      category: item.category,
      periodType: item.period_type,
      periodDay: item.period_day,
      note: item.note,
      enabled: item.enabled === 1,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  /**
   * 根据 ID 获取固定收支项目
   */
  async getRecurringItemById(id: number): Promise<RecurringItem | null> {
    const db = this.getDb();
    const item = await db.getFirstAsync<any>(
      'SELECT * FROM recurring_items WHERE id = ?',
      [id]
    );
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      category: item.category,
      periodType: item.period_type,
      periodDay: item.period_day,
      note: item.note,
      enabled: item.enabled === 1,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  /**
   * 更新固定收支项目
   */
  async updateRecurringItem(id: number, item: Partial<Omit<RecurringItem, 'id' | 'createdAt'>>): Promise<void> {
    const db = this.getDb();
    const updates: string[] = [];
    const values: any[] = [];

    if (item.name !== undefined) {
      updates.push('name = ?');
      values.push(item.name);
    }
    if (item.amount !== undefined) {
      updates.push('amount = ?');
      values.push(item.amount);
    }
    if (item.type !== undefined) {
      updates.push('type = ?');
      values.push(item.type);
    }
    if (item.category !== undefined) {
      updates.push('category = ?');
      values.push(item.category);
    }
    if (item.periodType !== undefined) {
      updates.push('period_type = ?');
      values.push(item.periodType);
    }
    if (item.periodDay !== undefined) {
      updates.push('period_day = ?');
      values.push(item.periodDay || null);
    }
    if (item.note !== undefined) {
      updates.push('note = ?');
      values.push(item.note || null);
    }
    if (item.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(item.enabled ? 1 : 0);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    await db.runAsync(
      `UPDATE recurring_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * 删除固定收支项目
   */
  async deleteRecurringItem(id: number): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM recurring_items WHERE id = ?', [id]);
    // 同时删除关联的 recurring_records（通过 CASCADE 或手动删除）
    await db.runAsync('DELETE FROM recurring_records WHERE recurring_item_id = ?', [id]);
  }

  /**
   * 切换固定收支项目的启用状态
   */
  async toggleRecurringItem(id: number, enabled: boolean): Promise<void> {
    await this.updateRecurringItem(id, { enabled, updatedAt: Date.now() });
  }

  /**
   * 根据固定项目创建记录
   */
  async createRecordFromRecurringItem(item: RecurringItem, targetDate: number): Promise<number> {
    const db = this.getDb();
    
    // 创建记录
    const record: Omit<Record, 'id'> = {
      amount: item.amount,
      type: item.type,
      category: item.category,
      date: targetDate,
      note: item.note || `${item.name}（固定收支）`,
    };
    
    const recordId = await this.addRecord(record);
    
    // 记录到 recurring_records 表
    const now = Date.now();
    // 计算目标日期的年月日（用于唯一性检查）
    const targetDateKey = new Date(targetDate);
    targetDateKey.setHours(0, 0, 0, 0);
    const targetDateTimestamp = targetDateKey.getTime();
    
    await db.runAsync(
      `INSERT OR IGNORE INTO recurring_records (recurring_item_id, record_id, target_date, created_at) 
       VALUES (?, ?, ?, ?)`,
      [item.id!, recordId, targetDateTimestamp, now]
    );
    
    return recordId;
  }

  /**
   * 检查指定日期是否已创建记录
   */
  async hasRecurringRecordForDate(itemId: number, targetDate: number): Promise<boolean> {
    const db = this.getDb();
    const targetDateKey = new Date(targetDate);
    targetDateKey.setHours(0, 0, 0, 0);
    const targetDateTimestamp = targetDateKey.getTime();
    
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM recurring_records WHERE recurring_item_id = ? AND target_date = ?',
      [itemId, targetDateTimestamp]
    );
    
    return (result?.count || 0) > 0;
  }

  /**
   * 获取指定固定项目已创建的记录
   */
  async getRecurringRecordsByItem(itemId: number): Promise<RecurringRecord[]> {
    const db = this.getDb();
    const records = await db.getAllAsync<any>(
      'SELECT * FROM recurring_records WHERE recurring_item_id = ? ORDER BY target_date DESC',
      [itemId]
    );
    return records.map((r) => ({
      id: r.id,
      recurringItemId: r.recurring_item_id,
      recordId: r.record_id,
      targetDate: r.target_date,
      createdAt: r.created_at,
    }));
  }

  /**
   * 获取指定日期范围内已创建的记录
   */
  async getRecurringRecordsByDateRange(startDate: number, endDate: number): Promise<RecurringRecord[]> {
    const db = this.getDb();
    const startDateKey = new Date(startDate);
    startDateKey.setHours(0, 0, 0, 0);
    const endDateKey = new Date(endDate);
    endDateKey.setHours(23, 59, 59, 999);
    
    const records = await db.getAllAsync<any>(
      'SELECT * FROM recurring_records WHERE target_date >= ? AND target_date <= ? ORDER BY target_date DESC',
      [startDateKey.getTime(), endDateKey.getTime()]
    );
    return records.map((r) => ({
      id: r.id,
      recurringItemId: r.recurring_item_id,
      recordId: r.record_id,
      targetDate: r.target_date,
      createdAt: r.created_at,
    }));
  }

  /**
   * 删除 recurring_record（当用户删除记录时）
   */
  async deleteRecurringRecord(recordId: number): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM recurring_records WHERE record_id = ?', [recordId]);
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

