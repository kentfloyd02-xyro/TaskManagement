import React, { createContext, useContext, useState, useEffect } from 'react';
import { runBackgroundAutoSync } from '../utils/offlineSync';
import { dbGetSyncQueue } from '../db/indexedDB';

const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  // Check pending offline queue count
  const checkPendingQueue = async () => {
    try {
      const q = await dbGetSyncQueue();
      setPendingQueueCount(q ? q.length : 0);
    } catch (e) {
      setPendingQueueCount(0);
    }
  };

  useEffect(() => {
    checkPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPendingQueue();
    };

    const handleSyncComplete = (e) => {
      const count = e.detail?.count || 1;
      setSyncStatus(`Matagumpay na na-sync ang ${count} offline updates sa cloud!`);
      checkPendingQueue();
      window.dispatchEvent(
        new CustomEvent('student-planner-island-notif', {
          detail: {
            id: 'sync_' + Date.now(),
            type: 'success',
            title: 'Cloud Sync Complete! ☁️',
            subtitle: `Na-sync ang ${count} offline item(s) mula sa IndexedDB.`,
            target: 'sync',
          },
        })
      );
      setTimeout(() => setSyncStatus(''), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('student-planner-sync-complete', handleSyncComplete);

    // Visibility change check (when user reopens phone screen / browser tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        triggerAutoSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Initial sync if online
    if (navigator.onLine) {
      triggerAutoSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('student-planner-sync-complete', handleSyncComplete);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const triggerAutoSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await runBackgroundAutoSync();
      await checkPendingQueue();
    } catch (e) {
      console.warn('Auto-sync execution error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        syncStatus,
        pendingQueueCount,
        triggerAutoSync,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
