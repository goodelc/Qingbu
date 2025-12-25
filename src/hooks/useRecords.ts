import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/DatabaseService';
import type { Record, MonthlySummary } from '../types';

interface UseRecordsOptions {
  year?: number;
  month?: number;
  autoLoad?: boolean;
}

export function useRecords(options: UseRecordsOptions = {}) {
  const { year, month, autoLoad = true } = options;
  
  const currentDate = new Date();
  const currentYear = year ?? currentDate.getFullYear();
  const currentMonth = month ?? currentDate.getMonth() + 1;

  const [records, setRecords] = useState<Record[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsData, summaryData] = await Promise.all([
        databaseService.getRecordsByMonth(currentYear, currentMonth),
        databaseService.getMonthlySummary(currentYear, currentMonth),
      ]);
      setRecords(recordsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load records'));
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (autoLoad) {
      loadRecords();
    }
  }, [autoLoad, loadRecords]);

  const refreshRecords = useCallback(() => {
    return loadRecords();
  }, [loadRecords]);

  const deleteRecord = useCallback(
    async (id: number) => {
      try {
        await databaseService.deleteRecord(id);
        await loadRecords();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete record'));
        throw err;
      }
    },
    [loadRecords]
  );

  const addRecord = useCallback(
    async (record: Omit<Record, 'id'>) => {
      try {
        await databaseService.addRecord(record);
        await loadRecords();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to add record'));
        throw err;
      }
    },
    [loadRecords]
  );

  const updateRecord = useCallback(
    async (id: number, record: Partial<Omit<Record, 'id'>>) => {
      try {
        await databaseService.updateRecord(id, record);
        await loadRecords();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update record'));
        throw err;
      }
    },
    [loadRecords]
  );

  return {
    records,
    summary,
    loading,
    error,
    refreshRecords,
    deleteRecord,
    addRecord,
    updateRecord,
    year: currentYear,
    month: currentMonth,
  };
}

