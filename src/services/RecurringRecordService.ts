import { databaseService } from './DatabaseService';
import type { RecurringItem } from '../types';

const LAST_CHECK_DATE_KEY = 'recurring_records_last_check_date';

/**
 * 计算目标日期
 */
function calculateTargetDate(item: RecurringItem, baseDate: Date, daysAhead: number = 0): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(baseDate);
  currentDate.setHours(0, 0, 0, 0);

  if (item.periodType === 'daily') {
    // 每天：当天及未来几天
    for (let i = 0; i <= daysAhead; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
  } else if (item.periodType === 'weekly') {
    // 每周：计算本周及未来几周内对应的星期几
    // 使用创建日期或当前日期作为基准（简化处理：使用当前日期）
    const dayOfWeek = currentDate.getDay();
    for (let week = 0; week <= Math.ceil(daysAhead / 7) + 1; week++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + week * 7);
      // 如果日期在未来范围内，添加到列表
      const daysDiff = Math.floor((date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff <= daysAhead) {
        dates.push(date);
      }
    }
  } else if (item.periodType === 'monthly' && item.periodDay) {
    // 每月X号：计算当月及未来几个月内的X号
    const targetDay = item.periodDay;
    const today = currentDate.getDate();
    
    // 如果今天的日期小于等于目标日期，计算当月的目标日期
    if (today <= targetDay) {
      const thisMonthDate = new Date(currentDate);
      thisMonthDate.setDate(targetDay);
      dates.push(thisMonthDate);
    }
    
    // 计算未来几个月内的目标日期
    for (let month = 1; month <= Math.ceil(daysAhead / 30) + 1; month++) {
      const nextMonthDate = new Date(currentDate);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + month);
      
      // 处理月份天数不同的情况（如2月没有30号）
      const lastDayOfMonth = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(targetDay, lastDayOfMonth);
      nextMonthDate.setDate(actualDay);
      
      // 检查是否在未来范围内
      const daysDiff = Math.floor((nextMonthDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff <= daysAhead) {
        dates.push(nextMonthDate);
      }
    }
  }

  return dates;
}

/**
 * 获取日期的时间戳（当天0点）
 */
function getDateTimestamp(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// 使用内存缓存存储上次检查日期（应用重启后会重新检查）
let lastCheckDate: number | null = null;

/**
 * 检查今天是否已检查过
 */
export async function shouldCheckToday(): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  if (lastCheckDate === null || lastCheckDate < todayTimestamp) {
    return true;
  }
  
  return false;
}

/**
 * 记录今天的检查日期
 */
export async function markCheckedToday(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastCheckDate = today.getTime();
}

/**
 * 自动检查并创建固定收支记录
 * @param onDuplicateFound 当发现重复记录时的回调，返回用户的选择：'skip' | 'create' | 'replace'
 */
export async function checkAndCreateRecurringRecords(
  onDuplicateFound?: (item: RecurringItem, existingRecordId: number) => Promise<'skip' | 'create' | 'replace'>
): Promise<{ created: number; skipped: number; errors: number }> {
  const stats = { created: 0, skipped: 0, errors: 0 };
  
  try {
    // 获取所有启用的固定项目
    const items = await databaseService.getEnabledRecurringItems();
    if (items.length === 0) {
      return stats;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDays = 3; // 提前创建未来3天的记录

    for (const item of items) {
      try {
        // 计算目标日期
        const targetDates = calculateTargetDate(item, today, futureDays);
        
        for (const targetDate of targetDates) {
          const targetTimestamp = getDateTimestamp(targetDate);
          
          // 检查是否已创建
          const hasRecord = await databaseService.hasRecurringRecordForDate(item.id!, targetTimestamp);
          
          if (hasRecord) {
            // 如果已存在，检查是否需要处理
            if (onDuplicateFound) {
              // 获取已存在的记录ID
              const existingRecords = await databaseService.getRecurringRecordsByItem(item.id!);
              const existingRecord = existingRecords.find(
                (r) => r.targetDate === targetTimestamp
              );
              
              if (existingRecord) {
                const action = await onDuplicateFound(item, existingRecord.recordId);
                
                if (action === 'skip') {
                  stats.skipped++;
                  continue;
                } else if (action === 'replace') {
                  // 删除旧记录
                  await databaseService.deleteRecord(existingRecord.recordId);
                  await databaseService.deleteRecurringRecord(existingRecord.recordId);
                }
                // action === 'create' 继续创建新记录
              } else {
                stats.skipped++;
                continue;
              }
            } else {
              stats.skipped++;
              continue;
            }
          }
          
          // 创建记录
          try {
            // 设置时间为当天的中午12点
            const recordDate = new Date(targetDate);
            recordDate.setHours(12, 0, 0, 0);
            
            await databaseService.createRecordFromRecurringItem(item, recordDate.getTime());
            stats.created++;
          } catch (error) {
            console.error(`Failed to create record for item ${item.id} on ${targetDate}:`, error);
            stats.errors++;
          }
        }
      } catch (error) {
        console.error(`Error processing recurring item ${item.id}:`, error);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('Failed to check and create recurring records:', error);
    stats.errors++;
  }
  
  return stats;
}
