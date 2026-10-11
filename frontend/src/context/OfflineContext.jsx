import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const OfflineContext = createContext();

const LOCAL_STORAGE_TASKS_KEY = 'offline_cached_tasks';
const LOCAL_STORAGE_QUEUE_KEY = 'offline_sync_queue';

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(''); // e.g., 'Synced 2 offline tasks!'

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check & sync if queue has items
    if (navigator.onLine) {
      triggerAutoSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline queue storage helpers
  const getQueue = () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const setQueue = (q) => {
    localStorage.setItem(LOCAL_STORAGE_QUEUE_KEY, JSON.stringify(q));
  };

  // Cached tasks helpers
  const getCachedTasks = () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_TASKS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const setCachedTasks = (tasks) => {
    localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(tasks));
  };

  // Auto-sync offline mutations when connection resumes
  const triggerAutoSync = async () => {
    const queue = getQueue();
    if (queue.length === 0 || !navigator.onLine) return;

    setIsSyncing(true);
    setSyncStatus(`Nag-si-sync ang ${queue.length} offline changes...`);

    let remainingQueue = [];
    let syncedCount = 0;

    for (const action of queue) {
      try {
        if (action.type === 'CREATE_TASK') {
          await client.post('/tasks', action.payload);
          syncedCount++;
        } else if (action.type === 'UPDATE_TASK') {
          await client.put(`/tasks/${action.id}`, action.payload);
          syncedCount++;
        } else if (action.type === 'DELETE_TASK') {
          await client.delete(`/tasks/${action.id}`);
          syncedCount++;
        }
      } catch (err) {
        console.error('Failed syncing action:', action, err);
        // keep failed action in queue
        remainingQueue.push(action);
      }
    }

    setQueue(remainingQueue);
    setIsSyncing(false);

    if (syncedCount > 0) {
      setSyncStatus(`Matagumpay na na-sync ang ${syncedCount} offline tasks sa database!`);
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  // Add mutation to offline queue
  const enqueueAction = (type, payload, id = null) => {
    const queue = getQueue();
    queue.push({
      id,
      type,
      payload,
      timestamp: Date.now(),
    });
    setQueue(queue);
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        syncStatus,
        triggerAutoSync,
        enqueueAction,
        getCachedTasks,
        setCachedTasks,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
