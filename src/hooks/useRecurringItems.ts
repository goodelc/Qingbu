import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/DatabaseService';
import type { RecurringItem, RecordType } from '../types';

interface UseRecurringItemsOptions {
  type?: RecordType;
  autoLoad?: boolean;
}

export function useRecurringItems(options: UseRecurringItemsOptions = {}) {
  const { type, autoLoad = true } = options;
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getRecurringItems(type);
      setItems(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load recurring items');
      setError(error);
      console.error('Failed to load recurring items:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (autoLoad) {
      loadItems();
    }
  }, [autoLoad, loadItems]);

  const addItem = useCallback(
    async (item: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        await databaseService.addRecurringItem(item);
        await loadItems();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to add recurring item'));
        throw err;
      }
    },
    [loadItems]
  );

  const updateItem = useCallback(
    async (id: number, item: Partial<Omit<RecurringItem, 'id' | 'createdAt'>>) => {
      try {
        await databaseService.updateRecurringItem(id, item);
        await loadItems();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update recurring item'));
        throw err;
      }
    },
    [loadItems]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        await databaseService.deleteRecurringItem(id);
        await loadItems();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete recurring item'));
        throw err;
      }
    },
    [loadItems]
  );

  const toggleItem = useCallback(
    async (id: number, enabled: boolean) => {
      try {
        await databaseService.toggleRecurringItem(id, enabled);
        await loadItems();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to toggle recurring item'));
        throw err;
      }
    },
    [loadItems]
  );

  const createRecord = useCallback(
    async (item: RecurringItem, targetDate: number) => {
      try {
        const recordId = await databaseService.createRecordFromRecurringItem(item, targetDate);
        return recordId;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create record from recurring item'));
        throw err;
      }
    },
    []
  );

  return {
    items,
    loading,
    error,
    refreshItems: loadItems,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    createRecord,
  };
}
