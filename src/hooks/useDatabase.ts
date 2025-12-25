import { useEffect, useState } from 'react';
import { databaseService } from '../services/DatabaseService';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initDatabase = async () => {
      try {
        await databaseService.init();
        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Database initialization failed'));
        }
      }
    };

    initDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}

