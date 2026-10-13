// Student Planner - Pure IndexedDB Engine
// High-performance, offline-first client storage for CP & Desktop localhost.

const DB_NAME = 'StudentPlanner_IndexedDB';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Open or upgrade IndexedDB database
 */
export const openDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('IndexedDB is not supported on this browser/environment.');
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Users Store (for Offline Login & Register)
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'email' });
        userStore.createIndex('id', '_id', { unique: false });
        userStore.createIndex('role', 'role', { unique: false });
      }

      // 2. Tasks Store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: '_id' });
        taskStore.createIndex('userId', 'user', { unique: false });
        taskStore.createIndex('status', 'status', { unique: false });
        taskStore.createIndex('period', 'academicPeriod', { unique: false });
        taskStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 3. Class Schedules Store
      if (!db.objectStoreNames.contains('schedules')) {
        const scheduleStore = db.createObjectStore('schedules', { keyPath: '_id' });
        scheduleStore.createIndex('userId', 'user', { unique: false });
        scheduleStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 4. Academic Subjects Store
      if (!db.objectStoreNames.contains('subjects')) {
        const subjectStore = db.createObjectStore('subjects', { keyPath: '_id' });
        subjectStore.createIndex('userId', 'user', { unique: false });
        subjectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 5. Exam Reviewers & Quiz Questions Store
      if (!db.objectStoreNames.contains('reviewers')) {
        const reviewerStore = db.createObjectStore('reviewers', { keyPath: '_id' });
        reviewerStore.createIndex('userId', 'user', { unique: false });
        reviewerStore.createIndex('category', 'category', { unique: false });
        reviewerStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 6. Offline Sync Queue Store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // 7. General App Metadata & Local Session Store
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
};

// ==========================================
// GENERIC STORE OPERATIONS
// ==========================================

export const dbGetAll = async (storeName, filterFn = null) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result || [];
      if (filterFn && typeof filterFn === 'function') {
        resolve(items.filter(filterFn));
      } else {
        resolve(items);
      }
    };

    request.onerror = () => reject(request.error);
  });
};

export const dbGetById = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const dbPut = async (storeName, item) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
};

export const dbPutMany = async (storeName, items) => {
  if (!items || items.length === 0) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    items.forEach((item) => {
      store.put(item);
    });

    tx.oncomplete = () => resolve(items);
    tx.onerror = () => reject(tx.error);
  });
};

export const dbDelete = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

export const dbClear = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// ==========================================
// USER & OFFLINE AUTH OPERATIONS
// ==========================================

export const dbSaveUser = async (user, password = null) => {
  if (!user || !user.email) return null;
  const cleanEmail = user.email.trim().toLowerCase();

  const existing = await dbGetUserByEmail(cleanEmail);
  const userRecord = {
    ...existing,
    ...user,
    email: cleanEmail,
    password: password || existing?.password || '',
    updatedAt: new Date().toISOString(),
  };

  return dbPut('users', userRecord);
};

export const dbGetUserByEmail = async (email) => {
  if (!email) return null;
  return dbGetById('users', email.trim().toLowerCase());
};

export const dbVerifyOfflineCredentials = async (email, password) => {
  const user = await dbGetUserByEmail(email);
  if (!user) return null;

  // If user has saved password, compare
  if (user.password && password && user.password !== password) {
    return null;
  }

  return user;
};

// ==========================================
// OFFLINE SYNC QUEUE OPERATIONS
// ==========================================

export const dbAddToSyncQueue = async (action) => {
  const item = {
    ...action,
    timestamp: Date.now(),
    retryCount: 0,
  };
  return dbPut('syncQueue', item);
};

export const dbGetSyncQueue = async () => {
  return dbGetAll('syncQueue');
};

export const dbRemoveFromSyncQueue = async (id) => {
  return dbDelete('syncQueue', id);
};

// ==========================================
// META & DIAGNOSTICS
// ==========================================

export const dbSetMeta = async (key, value) => {
  return dbPut('meta', { key, value, updatedAt: Date.now() });
};

export const dbGetMeta = async (key) => {
  const res = await dbGetById('meta', key);
  return res ? res.value : null;
};
