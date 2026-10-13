import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import socket from '../api/socket';
import { runBackgroundAutoSync } from '../utils/offlineSync';
import { dbGetSyncQueue, syncAllMongoDBDataToIndexedDB } from '../db/indexedDB';

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

  const triggerAutoSync = async () => {
    const hasToken =
      localStorage.getItem('student_token') || sessionStorage.getItem('student_token');
    if (!navigator.onLine || isSyncing || !hasToken) return;
    setIsSyncing(true);
    try {
      await runBackgroundAutoSync();
      await syncAllMongoDBDataToIndexedDB(api);
      await checkPendingQueue();
    } catch (e) {
      console.warn('Auto-sync execution notice:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    checkPendingQueue();

    // 1. Connection state listeners
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

    // 2. Visibility change & Focus checks (User unlocks phone or returns to app)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        triggerAutoSync();
      }
    };
    const handleFocus = () => {
      if (navigator.onLine) {
        triggerAutoSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // 3. Socket.IO Real-Time Cross-Device User Sync
    const joinUserRoom = () => {
      try {
        const rawUser = localStorage.getItem('student_user') || sessionStorage.getItem('student_user');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u && u._id) {
            socket.emit('join_user_room', u._id);
          }
        }
      } catch (_) {}
    };

    joinUserRoom();
    socket.on('connect', joinUserRoom);

    // Live sync event received from another device (e.g. PC uploaded something)
    const handleSocketDataChanged = async (payload) => {
      console.log('[Live Device Sync Received]:', payload);
      try {
        await syncAllMongoDBDataToIndexedDB(api);
        await checkPendingQueue();
        window.dispatchEvent(
          new CustomEvent('student-planner-data-updated', { detail: payload })
        );
      } catch (err) {
        console.warn('Real-time sync ingestion notice:', err);
      }
    };

    socket.on('sync_data_changed', handleSocketDataChanged);

    // 4. Periodic background sync: checks every 15 seconds while online
    const interval = setInterval(() => {
      const token = localStorage.getItem('student_token') || sessionStorage.getItem('student_token');
      if (navigator.onLine && token && !isSyncing) {
        syncAllMongoDBDataToIndexedDB(api).catch(() => {});
      }
    }, 15000);

    // Initial sync
    if (navigator.onLine) {
      triggerAutoSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('student-planner-sync-complete', handleSyncComplete);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      socket.off('connect', joinUserRoom);
      socket.off('sync_data_changed', handleSocketDataChanged);
      clearInterval(interval);
    };
  }, []);

  const getCachedTasks = () => {
    try {
      const raw = localStorage.getItem('student_cached_tasks');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
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
        getCachedTasks,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};
