// Offline-First Sync Manager and Data Pipeline
// Manages transparent fallback to IndexedDB and silent auto-syncing when reconnected.

import client from '../api/client';
import {
  openDB,
  dbGetAll,
  dbGetById,
  dbPut,
  dbPutMany,
  dbDelete,
  dbAddToSyncQueue,
  dbGetSyncQueue,
  dbRemoveFromSyncQueue,
  dbGetUserByEmail,
  dbSaveUser,
} from '../db/indexedDB';

let isSyncInProgress = false;

/**
 * Check if browser is really online and server is reachable
 */
export const isServerReachable = async () => {
  if (!navigator.onLine) return false;
  try {
    // Quick ping to health or auth check with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${client.defaults.baseURL || '/api'}/health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);
    return !!res;
  } catch (e) {
    return false;
  }
};

/**
 * Check if a stored item belongs to the active logged-in user
 */
const isItemForUser = (item, currentUser) => {
  if (!item) return false;
  if (!currentUser) return true;

  const currentId = String(currentUser._id || '');
  const currentEmail = (currentUser.email || '').trim().toLowerCase();
  const isAdmin = currentEmail === 'kentfloyd02@gmail.com' || currentUser.role === 'admin';

  const itemUserId = typeof item.user === 'object' && item.user !== null
    ? String(item.user._id || '')
    : String(item.user || '');

  // 1. Direct ID match
  if (itemUserId && itemUserId === currentId) return true;

  // 2. Direct email match
  if (item.userEmail && item.userEmail.trim().toLowerCase() === currentEmail) return true;
  if (typeof item.user === 'object' && item.user?.email && item.user.email.trim().toLowerCase() === currentEmail) return true;

  // 3. Admin permissions (Admin can see seed admin data, items without owner, or admin-tagged items)
  if (isAdmin) {
    if (!itemUserId || itemUserId === 'seed_admin_kentfloyd' || item.isSeed || item.userRole === 'admin') {
      return true;
    }
  }

  return false;
};

/**
 * Handle offline fallback for GET requests
 */
export const handleOfflineGet = async (url, currentUser) => {
  // 1. Tasks
  if (url.startsWith('/tasks')) {
    const tasks = await dbGetAll('tasks', (t) => isItemForUser(t, currentUser));
    return { data: { success: true, data: tasks, tasks, count: tasks.length, isOffline: true } };
  }

  // 2. Class Schedules
  if (url.startsWith('/schedule')) {
    const schedules = await dbGetAll('schedules', (s) => isItemForUser(s, currentUser));
    return { data: { success: true, data: schedules, schedules, count: schedules.length, isOffline: true } };
  }

  // 3. Subjects
  if (url.startsWith('/subjects')) {
    const subjects = await dbGetAll('subjects', (s) => isItemForUser(s, currentUser));
    return { data: { success: true, data: subjects, subjects, count: subjects.length, isOffline: true } };
  }

  // 4. Reviewer Materials
  if (url.startsWith('/reviewer/materials')) {
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const category = urlParams.get('category');
    const reviewers = await dbGetAll('reviewers', (r) => {
      if (!isItemForUser(r, currentUser)) return false;
      if (category && r.category !== category) return false;
      return true;
    });
    return { data: { success: true, data: reviewers, materials: reviewers, count: reviewers.length, isOffline: true } };
  }

  // 5. Projects
  if (url.startsWith('/projects')) {
    const projects = await dbGetAll('projects', (p) => isItemForUser(p, currentUser));
    return { data: { success: true, data: projects, projects, count: projects.length, isOffline: true } };
  }

  // 6. Dashboard Summary
  if (url.startsWith('/analytics/dashboard-summary')) {
    const tasks = await dbGetAll('tasks', (t) => isItemForUser(t, currentUser));
    const subjects = await dbGetAll('subjects', (s) => isItemForUser(s, currentUser));

    const periods = {
      Prelim: { total: 0, completed: 0, pending: 0, percentage: 0 },
      Midterm: { total: 0, completed: 0, pending: 0, percentage: 0 },
      Finals: { total: 0, completed: 0, pending: 0, percentage: 0 },
    };

    const statusCounts = { Backlog: 0, 'To Do': 0, 'In Progress': 0, Review: 0, Completed: 0 };
    tasks.forEach((t) => {
      const p = t.academicPeriod || 'Prelim';
      if (periods[p]) {
        periods[p].total++;
        if (t.status === 'Completed') periods[p].completed++;
        else periods[p].pending++;
      }
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }
    });

    Object.keys(periods).forEach((p) => {
      const total = periods[p].total;
      periods[p].percentage = total > 0 ? Math.round((periods[p].completed / total) * 100) : 0;
    });

    return {
      data: {
        success: true,
        data: {
          periods,
          statusCounts,
          totalSubjects: subjects.length,
          totalActive: tasks.filter((t) => t.status !== 'Completed').length,
          isOffline: true,
        },
      },
    };
  }

  return null;
};

/**
 * Handle offline fallback for mutation requests (POST / PUT / DELETE)
 */
export const handleOfflineMutation = async (method, url, data, currentUser) => {
  const userId = currentUser?._id;
  const userEmail = currentUser?.email;
  const userRole = currentUser?.role;
  const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Tasks Mutations
  if (url.startsWith('/tasks')) {
    const parts = url.split('/');
    const taskId = parts[2]; // e.g. /tasks/:id

    if (method === 'POST') {
      const newTask = {
        _id: tempId,
        user: userId,
        userEmail,
        userRole,
        status: 'To Do',
        academicPeriod: 'Prelim',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocalOnly: true,
        ...data,
      };
      await dbPut('tasks', newTask);
      await dbAddToSyncQueue({
        type: 'CREATE_TASK',
        entity: 'tasks',
        url: '/tasks',
        method: 'POST',
        payload: data,
        tempId,
      });
      return { data: { success: true, data: newTask, task: newTask, isOffline: true } };
    }

    if (method === 'PUT' && taskId) {
      const existing = (await dbGetById('tasks', taskId)) || {};
      const updatedTask = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await dbPut('tasks', updatedTask);
      await dbAddToSyncQueue({
        type: 'UPDATE_TASK',
        entity: 'tasks',
        url: `/tasks/${taskId}`,
        method: 'PUT',
        payload: data,
        tempId: taskId,
      });
      return { data: { success: true, data: updatedTask, task: updatedTask, isOffline: true } };
    }

    if (method === 'DELETE' && taskId) {
      await dbDelete('tasks', taskId);
      await dbAddToSyncQueue({
        type: 'DELETE_TASK',
        entity: 'tasks',
        url: `/tasks/${taskId}`,
        method: 'DELETE',
        tempId: taskId,
      });
      return { data: { success: true, message: 'Deleted locally', isOffline: true } };
    }
  }

  // 2. Schedule Mutations
  if (url.startsWith('/schedule')) {
    const parts = url.split('/');
    const schedId = parts[2];

    if (method === 'POST') {
      const newSched = {
        _id: tempId,
        user: userId,
        userEmail,
        userRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocalOnly: true,
        ...data,
      };
      await dbPut('schedules', newSched);
      await dbAddToSyncQueue({
        type: 'CREATE_SCHEDULE',
        entity: 'schedules',
        url: '/schedule',
        method: 'POST',
        payload: data,
        tempId,
      });
      return { data: { success: true, data: newSched, schedule: newSched, isOffline: true } };
    }

    if (method === 'DELETE' && schedId) {
      await dbDelete('schedules', schedId);
      await dbAddToSyncQueue({
        type: 'DELETE_SCHEDULE',
        entity: 'schedules',
        url: `/schedule/${schedId}`,
        method: 'DELETE',
        tempId: schedId,
      });
      return { data: { success: true, message: 'Deleted locally', isOffline: true } };
    }
  }

  // 3. Subjects Mutations
  if (url.startsWith('/subjects')) {
    const parts = url.split('/');
    const subId = parts[2];

    if (method === 'POST') {
      const newSubject = {
        _id: tempId,
        user: userId,
        userEmail,
        userRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocalOnly: true,
        ...data,
      };
      await dbPut('subjects', newSubject);
      await dbAddToSyncQueue({
        type: 'CREATE_SUBJECT',
        entity: 'subjects',
        url: '/subjects',
        method: 'POST',
        payload: data,
        tempId,
      });
      return { data: { success: true, data: newSubject, subject: newSubject, isOffline: true } };
    }

    if (method === 'DELETE' && subId) {
      await dbDelete('subjects', subId);
      await dbAddToSyncQueue({
        type: 'DELETE_SUBJECT',
        entity: 'subjects',
        url: `/subjects/${subId}`,
        method: 'DELETE',
        tempId: subId,
      });
      return { data: { success: true, message: 'Deleted locally', isOffline: true } };
    }
  }

  // 4. Reviewer Materials
  if (url.startsWith('/reviewer/materials')) {
    const parts = url.split('/');
    const revId = parts[3];

    if (method === 'POST') {
      const newRev = {
        _id: tempId,
        user: userId,
        userEmail,
        userRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocalOnly: true,
        ...data,
      };
      await dbPut('reviewers', newRev);
      await dbAddToSyncQueue({
        type: 'CREATE_REVIEWER',
        entity: 'reviewers',
        url: '/reviewer/materials',
        method: 'POST',
        payload: data,
        tempId,
      });
      return { data: { success: true, data: newRev, material: newRev, isOffline: true } };
    }

    if (method === 'DELETE' && revId) {
      await dbDelete('reviewers', revId);
      await dbAddToSyncQueue({
        type: 'DELETE_REVIEWER',
        entity: 'reviewers',
        url: `/reviewer/materials/${revId}`,
        method: 'DELETE',
        tempId: revId,
      });
      return { data: { success: true, message: 'Deleted locally', isOffline: true } };
    }
  }

  return null;
};

/**
 * Execute background auto-sync from IndexedDB to server
 */
export const runBackgroundAutoSync = async () => {
  if (isSyncInProgress || !navigator.onLine) return;
  isSyncInProgress = true;

  try {
    const queue = await dbGetSyncQueue();
    if (!queue || queue.length === 0) {
      isSyncInProgress = false;
      return;
    }

    let syncedCount = 0;

    for (const item of queue) {
      try {
        if (item.type === 'REGISTER_USER') {
          // Register user on server
          const res = await client.post('/auth/register', item.payload);
          if (res.data?.success && res.data?.user) {
            // Update local user in IndexedDB with cloud user ID
            await dbSaveUser(res.data.user);
          }
          await dbRemoveFromSyncQueue(item.id);
          syncedCount++;
        } else if (item.method === 'POST') {
          const res = await client.post(item.url, item.payload);
          const serverCreatedItem =
            res.data?.data ||
            res.data?.task ||
            res.data?.schedule ||
            res.data?.material ||
            res.data?.subject;

          // Always remove the temporary offline ID from IndexedDB to strictly prevent duplicates
          if (item.tempId && item.entity) {
            await dbDelete(item.entity, item.tempId);
          }

          // Store official MongoDB created item with its real _id
          if (serverCreatedItem && serverCreatedItem._id && item.entity) {
            await dbPut(item.entity, serverCreatedItem);
          }

          await dbRemoveFromSyncQueue(item.id);
          syncedCount++;
        } else if (item.method === 'PUT') {
          const res = await client.put(item.url, item.payload);
          const updatedItem =
            res.data?.data ||
            res.data?.task ||
            res.data?.schedule ||
            res.data?.material ||
            res.data?.subject;

          if (updatedItem && updatedItem._id && item.entity) {
            await dbPut(item.entity, updatedItem);
          }

          await dbRemoveFromSyncQueue(item.id);
          syncedCount++;
        } else if (item.method === 'DELETE') {
          // If item was tempId, don't send to server since server never saw it
          if (!item.tempId?.startsWith('offline_')) {
            await client.delete(item.url);
          }
          if (item.tempId && item.entity) {
            await dbDelete(item.entity, item.tempId);
          }
          await dbRemoveFromSyncQueue(item.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn('Sync item failed, will retry next time:', item, err);
      }
    }

    if (syncedCount > 0) {
      window.dispatchEvent(
        new CustomEvent('student-planner-sync-complete', {
          detail: { count: syncedCount },
        })
      );
    }
  } catch (err) {
    console.error('Auto-sync queue process error:', err);
  } finally {
    isSyncInProgress = false;
  }
};
