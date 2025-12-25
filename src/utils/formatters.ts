import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化金额显示
 * 使用 Intl.NumberFormat 支持多语言/货币扩展
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 格式化日期显示
 * @param timestamp Unix timestamp in milliseconds
 */
export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd', { locale: zhCN });
}

/**
 * 格式化日期为分组标题（如"今天"、"昨天"、"2024-01-15"）
 */
export function formatDateGroup(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return '今天';
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return '昨天';
  } else {
    return format(date, 'yyyy年MM月dd日', { locale: zhCN });
  }
}

/**
 * 格式化日期时间显示
 */
export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

/**
 * 格式化相对时间（如"2小时前"）
 */
export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: zhCN,
  });
}

/**
 * 获取月份的开始和结束时间戳
 */
export function getMonthRange(year: number, month: number): {
  start: number;
  end: number;
} {
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

