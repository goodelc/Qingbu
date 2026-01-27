import AsyncStorage from '@react-native-async-storage/async-storage';

export type LogLevel = 'info' | 'warn' | 'error';

export interface AppLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  tag?: string;
  message: string;
  details?: string;
}

const LOG_STORAGE_KEY = 'qingbu_logs';
const MAX_LOGS = 500;

async function loadLogs(): Promise<AppLog[]> {
  try {
    const raw = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppLog[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error('[LogService] 读取日志失败:', error);
    return [];
  }
}

async function saveLogs(logs: AppLog[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('[LogService] 保存日志失败:', error);
  }
}

class LogService {
  private createLog(
    level: LogLevel,
    tag: string | undefined,
    message: string,
    details?: string
  ): AppLog {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      tag,
      message,
      details,
    };
  }

  private async appendLog(log: AppLog): Promise<void> {
    const logs = await loadLogs();
    const merged = [log, ...logs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_LOGS);
    await saveLogs(merged);
  }

  async log(
    level: LogLevel,
    tag: string | undefined,
    message: string,
    details?: string
  ): Promise<void> {
    const log = this.createLog(level, tag, message, details);
    await this.appendLog(log);
  }

  async logInfo(tag: string | undefined, message: string, details?: string): Promise<void> {
    await this.log('info', tag, message, details);
  }

  async logWarn(tag: string | undefined, message: string, details?: string): Promise<void> {
    await this.log('warn', tag, message, details);
  }

  async logError(tag: string | undefined, message: string, details?: string): Promise<void> {
    await this.log('error', tag, message, details);
  }

  async getLogs(): Promise<AppLog[]> {
    const logs = await loadLogs();
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  async clearLogs(): Promise<void> {
    await saveLogs([]);
  }
}

export const logService = new LogService();

