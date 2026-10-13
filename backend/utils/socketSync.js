/**
 * Centralized Socket.IO User Sync Broadcaster
 * Notifies all connected devices (phones, tablets, PCs) when data changes,
 * so other devices immediately update their local IndexedDB.
 */
function emitUserDataChange(req, collection, action, data = null) {
  try {
    const io = req?.app?.get('io');
    const userId = req?.user?._id;
    if (io && userId) {
      io.to(`user_${userId.toString()}`).emit('sync_data_changed', {
        collection, // 'tasks', 'schedules', 'subjects', 'reviewers'
        action,     // 'create', 'update', 'delete', 'batch'
        data,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    console.warn('[Socket Sync Broadcast Error]:', err?.message);
  }
}

module.exports = { emitUserDataChange };
