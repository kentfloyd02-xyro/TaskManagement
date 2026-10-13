// Student Planner - Pure IndexedDB Engine
// High-performance, offline-first client storage for CP & Desktop localhost.

const DB_NAME = 'StudentPlanner_IndexedDB';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Pre-seeded existing accounts to guarantee instant offline access
 * even on brand new mobile phone / localhost runs with zero internet.
 */
export const SEED_EXISTING_ACCOUNTS = [
  {
    _id: '6aca7f3babef42f61303a276', // Real MongoDB ObjectId of kentfloyd02@gmail.com
    name: 'Kent Floyd (Admin)',
    email: 'kentfloyd02@gmail.com',
    role: 'admin',
    course: 'BS Information Technology',
    yearLevel: '4th Year',
    gender: 'male',
    avatar: 'male-wolf',
    themePreference: 'dark',
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Seeds known offline user accounts only (to allow offline login),
 * and strictly purges ANY legacy dummy/seed data from previous versions
 * so ONLY real MongoDB data is present in IndexedDB.
 */
const seedInitialAccountsAndPurgeDummies = (db) => {
  try {
    const tx = db.transaction(['users', 'subjects', 'tasks', 'schedules', 'reviewers'], 'readwrite');
    const userStore = tx.objectStore('users');
    const subjectStore = tx.objectStore('subjects');
    const taskStore = tx.objectStore('tasks');
    const scheduleStore = tx.objectStore('schedules');
    const reviewerStore = tx.objectStore('reviewers');

    // 1. Seed admin account for offline authentication if not present
    SEED_EXISTING_ACCOUNTS.forEach((account) => {
      const getReq = userStore.get(account.email);
      getReq.onsuccess = () => {
        if (!getReq.result) {
          userStore.put(account);
        } else if (account.email === 'kentfloyd02@gmail.com' && getReq.result._id === 'seed_admin_kentfloyd') {
          userStore.put({
            ...getReq.result,
            _id: account._id,
          });
        }
      };
    });

    // 2. PURGE ANY DUMMY / SEED DATA from all stores!
    const purgeStore = (store, isUserStore = false) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.forEach((item) => {
          if (!item) return;
          const isDummy =
            item.isSeed ||
            String(item._id).startsWith('seed_') ||
            item._id === 'seed_rev_1' ||
            item._id === 'seed_demo_student' ||
            item.email === 'student@example.com' ||
            ['CS301', 'IT305', 'MATH204', 'IT401'].includes(item.code) ||
            ['CS301', 'IT305', 'MATH204', 'IT401'].includes(item.subjectCode) ||
            (item.title && typeof item.title === 'string' && (
              item.title.includes('Prelim Quiz 1') ||
              item.title.includes('Laboratory Activity 1') ||
              item.title.includes('UML Class Diagram') ||
              item.title.includes('REST API Integration') ||
              item.title.includes('Combinatorics & Permutations') ||
              item.title.includes('Final Capstone Project Defense') ||
              item.title.includes('Web & Mobile Systems QUIZ')
            ));

          if (isDummy) {
            const key = isUserStore ? item.email : item._id;
            store.delete(key);
          }
        });
      };
    };

    purgeStore(userStore, true);
    purgeStore(subjectStore);
    purgeStore(taskStore);
    purgeStore(scheduleStore);
    purgeStore(reviewerStore);

    // 3. Clean legacy localStorage cached tasks if they contained dummy items
    try {
      const cached = localStorage.getItem('student_cached_tasks');
      if (cached && (cached.includes('CS301') || cached.includes('seed_'))) {
        localStorage.removeItem('student_cached_tasks');
      }
    } catch (e) {}

    // 4. Migrate active user from localStorage if present
    const rawLocalUser = localStorage.getItem('student_user') || sessionStorage.getItem('student_user');
    if (rawLocalUser) {
      try {
        const parsed = JSON.parse(rawLocalUser);
        if (parsed && parsed.email) {
          const cleanEmail = parsed.email.trim().toLowerCase();
          const getReq = userStore.get(cleanEmail);
          getReq.onsuccess = () => {
            if (!getReq.result) {
              userStore.put({
                ...parsed,
                email: cleanEmail,
                updatedAt: new Date().toISOString(),
              });
            }
          };
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Initial accounts/purge error:', err);
  }
};

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
            const db = event.target.result;
            seedInitialAccountsAndPurgeDummies(db);
            resolve(db);
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

export const dbGetAll = async(storeName, filterFn = null) => {
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

export const dbGetById = async(storeName, id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

export const dbPut = async(storeName, item) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
    });
};

export const dbPutMany = async(storeName, items) => {
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

export const dbDelete = async(storeName, id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
};

export const dbClear = async(storeName) => {
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

export const dbSaveUser = async(user, password = null) => {
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

export const dbGetUserByEmail = async(email) => {
    if (!email) return null;
    return dbGetById('users', email.trim().toLowerCase());
};

export const dbVerifyOfflineCredentials = async(email, password) => {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const user = await dbGetUserByEmail(cleanEmail);
    if (!user) return null;

    // 1. Kung may saved password sa IndexedDB, i-compare
    if (user.password) {
        if (user.password === password) {
            return user;
        }
        return null;
    }

    // 2. Kung pre-seeded o cloud-synced account na wala pang saved password sa client:
    // I-record ang nilagay na password para sa account na ito upang magamit sa future logins
    if (password) {
        user.password = password;
        await dbPut('users', user);
    }

    return user;
};

/**
 * Silently fetches existing accounts from MongoDB/server
 * and populates them into IndexedDB users store so all current
 * users become immediately available offline on mobile/desktop localhost.
 */
export const syncExistingAccountsFromCloud = async(apiClient) => {
    if (!navigator.onLine || !apiClient) return [];
    try {
        const res = await apiClient.get('/auth/offline-accounts');
        if (res.data?.success && Array.isArray(res.data.accounts)) {
            const accounts = res.data.accounts;
            for (const acc of accounts) {
                if (!acc.email) continue;
                const cleanEmail = acc.email.trim().toLowerCase();
                const existing = await dbGetUserByEmail(cleanEmail);
                await dbPut('users', {
                    ...existing,
                    ...acc,
                    email: cleanEmail,
                    password: existing?.password || '',
                    updatedAt: acc.updatedAt || new Date().toISOString(),
                });
            }
            return accounts;
        }
    } catch (err) {
        console.warn('Silent cloud accounts sync note (offline or network fallback):', err.message);
    }
    return [];
};

// ==========================================
// OFFLINE SYNC QUEUE OPERATIONS
// ==========================================

export const dbAddToSyncQueue = async(action) => {
    const item = {
        ...action,
        timestamp: Date.now(),
        retryCount: 0,
    };
    return dbPut('syncQueue', item);
};

export const dbGetSyncQueue = async() => {
    return dbGetAll('syncQueue');
};

export const dbRemoveFromSyncQueue = async(id) => {
    return dbDelete('syncQueue', id);
};

// ==========================================
// META & DIAGNOSTICS
// ==========================================

export const dbSetMeta = async(key, value) => {
    return dbPut('meta', { key, value, updatedAt: Date.now() });
};

export const dbGetMeta = async(key) => {
    const res = await dbGetById('meta', key);
    return res ? res.value : null;
};

// ==========================================
// DEDUPLICATION & FULL MONGODB DATA SYNC
// ==========================================

/**
 * Upsert items and eliminate any temporary offline duplicates
 * or duplicate entries matching the natural key.
 */
export const dbUpsertAndDeduplicate = async(storeName, incomingItems, naturalKeyFn) => {
    if (!Array.isArray(incomingItems) || incomingItems.length === 0) return [];
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
            const existingItems = getAllReq.result || [];
            const toDeleteIds = new Set();

            incomingItems.forEach((incoming) => {
                if (!incoming || !incoming._id) return;

                const incomingNaturalKey = naturalKeyFn ? naturalKeyFn(incoming) : null;

                // Check for matching offline temporary items or duplicate natural keys
                existingItems.forEach((existing) => {
                    if (!existing || !existing._id) return;
                    if (existing._id === incoming._id) return;

                    const isTemp = String(existing._id).startsWith('offline_');
                    if (incomingNaturalKey && naturalKeyFn) {
                        const existingNaturalKey = naturalKeyFn(existing);
                        if (existingNaturalKey && existingNaturalKey === incomingNaturalKey) {
                            toDeleteIds.add(existing._id);
                        }
                    } else if (isTemp && incoming._id) {
                        if (existing.title && incoming.title && existing.title.trim().toLowerCase() === incoming.title.trim().toLowerCase()) {
                            toDeleteIds.add(existing._id);
                        }
                    }
                });

                // Save official MongoDB record
                store.put(incoming);
            });

            // Delete old redundant temporary drafts
            toDeleteIds.forEach((id) => {
                store.delete(id);
            });
        };

        tx.oncomplete = () => resolve(incomingItems);
        tx.onerror = () => reject(tx.error);
    });
};

/**
 * Synchronizes ALL user data from MongoDB to IndexedDB
 * (Tasks, Schedules, Subjects, Reviewers, Users)
 * with automatic de-duplication to guarantee no duplicated records.
 */
export const syncAllMongoDBDataToIndexedDB = async(apiClient, currentUser = null) => {
    const token = localStorage.getItem('student_token') || sessionStorage.getItem('student_token');
    if (!navigator.onLine || !apiClient || !token) return null;

    try {
        let tasks = [];
        let schedules = [];
        let subjects = [];
        let reviewers = [];

        // 1. Try dedicated full sync endpoint first
        try {
            const fullRes = await apiClient.get('/sync/full-data');
            if (fullRes.data?.success && fullRes.data.data) {
                tasks = fullRes.data.data.tasks || [];
                schedules = fullRes.data.data.schedules || [];
                subjects = fullRes.data.data.subjects || [];
                reviewers = fullRes.data.data.reviewers || [];
            }
        } catch (fullErr) {
            // Fallback: Parallel individual collection endpoints
            const [tRes, sRes, subRes, rRes] = await Promise.allSettled([
                apiClient.get('/tasks'),
                apiClient.get('/schedule'),
                apiClient.get('/subjects'),
                apiClient.get('/reviewer/materials'),
            ]);

            if (tRes.status === 'fulfilled' && tRes.value.data) {
                tasks = tRes.value.data.data || tRes.value.data.tasks || [];
            }
            if (sRes.status === 'fulfilled' && sRes.value.data) {
                schedules = sRes.value.data.schedules || sRes.value.data.data || [];
            }
            if (subRes.status === 'fulfilled' && subRes.value.data) {
                subjects = subRes.value.data.data || subRes.value.data.subjects || [];
            }
            if (rRes.status === 'fulfilled' && rRes.value.data) {
                reviewers = rRes.value.data.data || rRes.value.data.materials || [];
            }
        }

        // Filter out any legacy dummy/seed items if any
        const isRealItem = (item) => item && !item.isSeed && !String(item._id).startsWith('seed_');
        tasks = tasks.filter(isRealItem);
        schedules = schedules.filter(isRealItem);
        subjects = subjects.filter(isRealItem);
        reviewers = reviewers.filter(isRealItem);

        // 2. Define natural keys for each collection to ensure exact deduplication
        const taskNaturalKey = (t) => `${(t.title || '').trim().toLowerCase()}_${t.academicPeriod || ''}`;
        const schedNaturalKey = (s) =>
            `${(s.subjectCode || s.subjectName || '').trim().toLowerCase()}_${(s.days || []).join('-')}_${s.startTime || ''}`;
        const subNaturalKey = (s) => `${(s.code || s.name || '').trim().toLowerCase()}`;
        const revNaturalKey = (r) => `${(r.title || r.subject || '').trim().toLowerCase()}_${r.category || ''}`;

        const activeEmail = (currentUser?.email || '').trim().toLowerCase();
        const activeUserId = currentUser?._id ? String(currentUser._id) : '';
        const tagOwner = (items) =>
            items.map((item) => ({
                ...item,
                user: item.user || activeUserId,
                userEmail: item.userEmail || activeEmail || (item.user?.email ? item.user.email.toLowerCase() : ''),
            }));

        await Promise.all([
            dbUpsertAndDeduplicate('tasks', tagOwner(tasks), taskNaturalKey),
            dbUpsertAndDeduplicate('schedules', tagOwner(schedules), schedNaturalKey),
            dbUpsertAndDeduplicate('subjects', tagOwner(subjects), subNaturalKey),
            dbUpsertAndDeduplicate('reviewers', tagOwner(reviewers), revNaturalKey),
            syncExistingAccountsFromCloud(apiClient),
        ]);

        // Update localStorage cache as well for immediate page loads
        try {
            localStorage.setItem('student_cached_tasks', JSON.stringify(tagOwner(tasks)));
        } catch (e) {}

        // 3. Dispatch global sync event
        window.dispatchEvent(
            new CustomEvent('student-planner-full-sync-complete', {
                detail: {
                    timestamp: new Date().toISOString(),
                    counts: {
                        tasks: tasks.length,
                        schedules: schedules.length,
                        subjects: subjects.length,
                        reviewers: reviewers.length,
                    },
                },
            })
        );

        return {
            success: true,
            counts: {
                tasks: tasks.length,
                schedules: schedules.length,
                subjects: subjects.length,
                reviewers: reviewers.length,
            },
        };
    } catch (err) {
        console.warn('syncAllMongoDBDataToIndexedDB notice:', err);
        return null;
    }
};