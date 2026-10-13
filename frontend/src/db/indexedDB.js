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
    _id: 'seed_admin_kentfloyd',
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
  {
    _id: 'seed_demo_student',
    name: 'Demo Student',
    email: 'student@example.com',
    role: 'student',
    course: 'BS Computer Science',
    yearLevel: '1st Year',
    gender: 'male',
    avatar: 'male-ninja',
    themePreference: 'dark',
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_INITIAL_SUBJECTS = [
  {
    _id: 'seed_sub_cs301',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    code: 'CS301',
    name: 'Software Engineering & Design Patterns',
    color: '#3b82f6',
    instructor: 'Dr. Raymond Reyes',
    schedule: 'Mon/Wed 9:00 AM - 10:30 AM',
    room: 'Lab 402',
    isSeed: true,
  },
  {
    _id: 'seed_sub_it305',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    code: 'IT305',
    name: 'Web & Mobile Systems',
    color: '#10b981',
    instructor: 'Prof. Maria Santos',
    schedule: 'Tue/Thu 1:00 PM - 2:30 PM',
    room: 'Room 205',
    isSeed: true,
  },
  {
    _id: 'seed_sub_math204',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    code: 'MATH204',
    name: 'Discrete Mathematics & Probability',
    color: '#f59e0b',
    instructor: 'Engr. Daniel Cruz',
    schedule: 'Fri 8:00 AM - 11:00 AM',
    room: 'Lecture Hall B',
    isSeed: true,
  },
];

export const SEED_INITIAL_TASKS = [
  {
    _id: 'seed_task_1',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    title: 'Prelim Quiz 1: Object-Oriented Principles',
    description: 'Review SOLID principles and Gang of Four pattern concepts.',
    taskType: 'Exam/Quiz',
    academicPeriod: 'Prelim',
    priority: 'High',
    status: 'Completed',
    subject: { _id: 'seed_sub_cs301', code: 'CS301', name: 'Software Engineering', color: '#3b82f6' },
    deadline: new Date(Date.now() - 7 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    checklist: [
      { text: 'Review Single Responsibility Principle', isDone: true },
      { text: 'Review Factory & Singleton Patterns', isDone: true },
    ],
    isSeed: true,
  },
  {
    _id: 'seed_task_2',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    title: 'Laboratory Activity 1: Responsive Layout with Flexbox & Grid',
    description: 'Submit GitHub repository link and deployed live demo.',
    taskType: 'Activity',
    academicPeriod: 'Prelim',
    priority: 'Medium',
    status: 'Completed',
    subject: { _id: 'seed_sub_it305', code: 'IT305', name: 'Web & Mobile Systems', color: '#10b981' },
    deadline: new Date(Date.now() - 5 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    checklist: [
      { text: 'Mobile breakpoint styling', isDone: true },
      { text: 'Lighthouse accessibility check', isDone: true },
    ],
    isSeed: true,
  },
  {
    _id: 'seed_task_3',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    title: 'UML Class Diagram & ERD Modeling',
    description: 'Complete data modeling diagram for client approval.',
    taskType: 'Research',
    academicPeriod: 'Midterm',
    priority: 'Urgent',
    status: 'In Progress',
    subject: { _id: 'seed_sub_cs301', code: 'CS301', name: 'Software Engineering', color: '#3b82f6' },
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    estimatedMinutes: 90,
    checklist: [
      { text: 'Draft Entity Relationship Diagram (ERD)', isDone: true },
      { text: 'Review foreign key constraints', isDone: false },
    ],
    isSeed: true,
  },
  {
    _id: 'seed_task_4',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    title: 'REST API Integration & JWT Authentication Lab',
    description: 'Build Express authentication middleware with protected routes.',
    taskType: 'Assignment',
    academicPeriod: 'Midterm',
    priority: 'High',
    status: 'To Do',
    subject: { _id: 'seed_sub_it305', code: 'IT305', name: 'Web & Mobile Systems', color: '#10b981' },
    deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
    estimatedMinutes: 120,
    checklist: [
      { text: 'Implement bcrypt password hashing', isDone: false },
      { text: 'Verify Bearer token middleware', isDone: false },
    ],
    isSeed: true,
  },
  {
    _id: 'seed_task_5',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    title: 'Midterm Exam: Combinatorics & Permutations',
    description: 'Scheduled in Lecture Hall B at 8:00 AM sharp.',
    taskType: 'Exam/Quiz',
    academicPeriod: 'Midterm',
    priority: 'Urgent',
    status: 'Backlog',
    subject: { _id: 'seed_sub_math204', code: 'MATH204', name: 'Discrete Mathematics', color: '#f59e0b' },
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    estimatedMinutes: 180,
    checklist: [{ text: 'Review pigeonhole principle examples', isDone: false }],
    isSeed: true,
  },
  {
    _id: 'seed_task_6',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    title: 'Final Capstone Project Defense Documentation',
    description: 'Submit compiled technical manuscript and architecture specifications.',
    taskType: 'Project',
    academicPeriod: 'Finals',
    priority: 'High',
    status: 'To Do',
    subject: { _id: 'seed_sub_cs301', code: 'CS301', name: 'Software Engineering', color: '#3b82f6' },
    deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
    estimatedMinutes: 240,
    checklist: [{ text: 'Compile user manual and API docs', isDone: false }],
    isSeed: true,
  },
];

export const SEED_INITIAL_SCHEDULES = [
  {
    _id: 'seed_sched_1',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    subjectCode: 'CS301',
    subjectName: 'Software Engineering & Design Patterns',
    instructor: 'Dr. Raymond Reyes',
    room: 'Lab 402',
    days: ['Monday', 'Wednesday'],
    startTime: '09:00',
    endTime: '10:30',
    color: '#3b82f6',
    reminderMinutesBefore: 15,
    isReminderActive: true,
    isSeed: true,
  },
  {
    _id: 'seed_sched_2',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    subjectCode: 'IT305',
    subjectName: 'Web & Mobile Systems',
    instructor: 'Prof. Maria Santos',
    room: 'Room 205',
    days: ['Tuesday', 'Thursday'],
    startTime: '13:00',
    endTime: '14:30',
    color: '#10b981',
    reminderMinutesBefore: 15,
    isReminderActive: true,
    isSeed: true,
  },
  {
    _id: 'seed_sched_3',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    subjectCode: 'MATH204',
    subjectName: 'Discrete Mathematics & Probability',
    instructor: 'Engr. Daniel Cruz',
    room: 'Lecture Hall B',
    days: ['Friday'],
    startTime: '08:00',
    endTime: '11:00',
    color: '#f59e0b',
    reminderMinutesBefore: 15,
    isReminderActive: true,
    isSeed: true,
  },
];

export const SEED_INITIAL_REVIEWERS = [
  {
    _id: 'seed_rev_1',
    user: 'seed_admin_kentfloyd',
    userEmail: 'kentfloyd02@gmail.com',
    userRole: 'admin',
    title: 'Web & Mobile Systems QUIZ',
    subject: 'Web & Mobile Systems',
    category: 'quiz',
    questionTypePreference: 'multiple_choice',
    hasTimer: true,
    timerDurationSeconds: 600,
    questionCount: 3,
    questions: [
      {
        questionNumber: 1,
        questionText: 'What browser API provides high-performance offline client-side structured storage?',
        questionType: 'multiple_choice',
        options: ['IndexedDB', 'Cookie', 'SessionStorage', 'Flash Storage'],
        correctAnswer: 'IndexedDB',
        explanation: 'IndexedDB is the built-in browser standard for storing large amounts of structured data offline.',
      },
      {
        questionNumber: 2,
        questionText: 'Which HTTP method is idempotent and commonly used to update an existing resource?',
        questionType: 'multiple_choice',
        options: ['PUT', 'POST', 'CONNECT', 'TRACE'],
        correctAnswer: 'PUT',
        explanation: 'PUT replaces or updates an existing entity idempotently without creating duplicates.',
      },
      {
        questionNumber: 3,
        questionText: 'What is the primary role of a Service Worker in a Progressive Web App (PWA)?',
        questionType: 'multiple_choice',
        options: ['Proxy network requests and enable offline caching', 'Render 3D graphics', 'Manage CSS styles', 'Compile TypeScript'],
        correctAnswer: 'Proxy network requests and enable offline caching',
        explanation: 'Service Workers intercept network requests to serve cached assets when offline.',
      },
    ],
    isSeed: true,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Automatically seeds existing default accounts, subjects, tasks, schedules,
 * and reviewers into IndexedDB so that fresh offline phones immediately have full data!
 */
const seedInitialData = (db) => {
  try {
    const tx = db.transaction(['users', 'subjects', 'tasks', 'schedules', 'reviewers'], 'readwrite');
    const userStore = tx.objectStore('users');
    const subjectStore = tx.objectStore('subjects');
    const taskStore = tx.objectStore('tasks');
    const scheduleStore = tx.objectStore('schedules');
    const reviewerStore = tx.objectStore('reviewers');

    // 1. Seed Accounts
    SEED_EXISTING_ACCOUNTS.forEach((account) => {
      const getReq = userStore.get(account.email);
      getReq.onsuccess = () => {
        if (!getReq.result) {
          userStore.put(account);
        }
      };
    });

    // 2. Seed Subjects if empty
    const subReq = subjectStore.getAll();
    subReq.onsuccess = () => {
      if (!subReq.result || subReq.result.length === 0) {
        SEED_INITIAL_SUBJECTS.forEach((sub) => subjectStore.put(sub));
      }
    };

    // 3. Seed Tasks if empty
    const taskReq = taskStore.getAll();
    taskReq.onsuccess = () => {
      if (!taskReq.result || taskReq.result.length === 0) {
        SEED_INITIAL_TASKS.forEach((t) => taskStore.put(t));
      }
    };

    // 4. Seed Schedules if empty
    const schedReq = scheduleStore.getAll();
    schedReq.onsuccess = () => {
      if (!schedReq.result || schedReq.result.length === 0) {
        SEED_INITIAL_SCHEDULES.forEach((s) => scheduleStore.put(s));
      }
    };

    // 5. Seed Reviewers if empty
    const revReq = reviewerStore.getAll();
    revReq.onsuccess = () => {
      if (!revReq.result || revReq.result.length === 0) {
        SEED_INITIAL_REVIEWERS.forEach((r) => reviewerStore.put(r));
      }
    };

    // 6. Migrate current active user from localStorage if present
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
    console.warn('Initial data seed error:', err);
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
      seedInitialData(db);
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
export const syncExistingAccountsFromCloud = async (apiClient) => {
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

// ==========================================
// DEDUPLICATION & FULL MONGODB DATA SYNC
// ==========================================

/**
 * Upsert items and eliminate any temporary offline duplicates
 * or duplicate entries matching the natural key.
 */
export const dbUpsertAndDeduplicate = async (storeName, incomingItems, naturalKeyFn) => {
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
export const syncAllMongoDBDataToIndexedDB = async (apiClient, currentUser = null) => {
  if (!navigator.onLine || !apiClient) return null;

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

    // 2. Define natural keys for each collection to ensure exact deduplication
    const taskNaturalKey = (t) => `${(t.title || '').trim().toLowerCase()}_${t.academicPeriod || ''}`;
    const schedNaturalKey = (s) =>
      `${(s.subjectCode || s.subjectName || '').trim().toLowerCase()}_${(s.days || []).join('-')}_${s.startTime || ''}`;
    const subNaturalKey = (s) => `${(s.code || s.name || '').trim().toLowerCase()}`;
    const revNaturalKey = (r) => `${(r.title || r.subject || '').trim().toLowerCase()}_${r.category || ''}`;

    const activeEmail = (currentUser?.email || '').trim().toLowerCase();
    const tagOwner = (items) =>
      items.map((item) => ({
        ...item,
        userEmail: item.userEmail || activeEmail || (item.user?.email ? item.user.email.toLowerCase() : ''),
      }));

    await Promise.all([
      dbUpsertAndDeduplicate('tasks', tagOwner(tasks), taskNaturalKey),
      dbUpsertAndDeduplicate('schedules', tagOwner(schedules), schedNaturalKey),
      dbUpsertAndDeduplicate('subjects', tagOwner(subjects), subNaturalKey),
      dbUpsertAndDeduplicate('reviewers', tagOwner(reviewers), revNaturalKey),
      syncExistingAccountsFromCloud(apiClient),
    ]);

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

