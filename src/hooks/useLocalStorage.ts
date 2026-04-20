import { useState, useEffect, useCallback } from 'react';
import { LocalStorageData, PelayananValues } from '../types';

const STORAGE_KEY = 'stok_opname_data';

export function useLocalStorage() {
  const [data, setData] = useState<LocalStorageData | null>(null);

  // Load data on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LocalStorageData;
        // Check if data is not older than 7 days
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          setData(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveData = useCallback((newData: Omit<LocalStorageData, 'timestamp'>) => {
    const dataWithTimestamp: LocalStorageData = {
      ...newData,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp));
    setData(dataWithTimestamp);
  }, []);

  const updateEntry = useCallback((row: number, values: PelayananValues) => {
    if (!data) return;
    const newEntries = { ...data.entries, [row]: values };
    saveData({ ...data, entries: newEntries });
  }, [data, saveData]);

  const clearData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(null);
  }, []);

  const initData = useCallback((nama: string, ruangan: string, bulan: string, sheet: string) => {
    // If same session, keep entries; otherwise start fresh
    if (data && data.nama === nama && data.ruangan === ruangan && data.bulan === bulan && data.sheet === sheet) {
      return data.entries;
    }
    saveData({ nama, ruangan, bulan, sheet, entries: {} });
    return {};
  }, [data, saveData]);

  return { data, saveData, updateEntry, clearData, initData };
}
