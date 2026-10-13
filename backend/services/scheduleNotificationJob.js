const ClassSchedule = require('../models/ClassSchedule');
const { sendNotificationToUser } = require('./pushService');

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// In-memory set of already sent notifications for today to avoid duplicate alerts
const sentAlertsToday = new Set();
let lastPurgeDate = '';

/**
 * Checks all active class schedules and dispatches 15-minute and 0-minute alerts
 */
async function checkAndDispatchClassAlerts(io = null) {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Reset cache daily
    if (lastPurgeDate !== todayStr) {
      sentAlertsToday.clear();
      lastPurgeDate = todayStr;
    }

    const currentDay = DAYS_OF_WEEK[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Query active schedules matching today
    const activeSchedules = await ClassSchedule.find({
      days: currentDay,
      isReminderActive: { $ne: false },
    }).lean();

    if (!activeSchedules || activeSchedules.length === 0) return;

    for (const sched of activeSchedules) {
      if (!sched.startTime) continue;

      const [h, m] = sched.startTime.split(':');
      const startMin = parseInt(h, 10) * 60 + parseInt(m, 10);
      const diffMinutes = startMin - currentMinutes;

      let triggerType = null;
      let alertTitle = '';
      let alertBody = '';

      if (diffMinutes === 15) {
        triggerType = '15min';
        alertTitle = `🚨 15-Min Class Warning: ${sched.subjectCode}`;
        alertBody = `${sched.subjectName} starts at ${sched.startTime}${sched.room ? ` in ${sched.room}` : ''}. Humanda na sa klase!`;
      } else if (diffMinutes === 0) {
        triggerType = 'start';
        alertTitle = `🔔 Class Starting Now: ${sched.subjectCode}`;
        alertBody = `${sched.subjectName} ay nagsisimula na ngayon sa ${sched.room || 'Room TBA'}. Pumasok na sa klase!`;
      }

      if (triggerType) {
        const alertKey = `${sched._id}_${triggerType}_${todayStr}`;
        if (!sentAlertsToday.has(alertKey)) {
          sentAlertsToday.add(alertKey);

          const alarmPayload = {
            _id: sched._id,
            subjectCode: sched.subjectCode,
            subjectName: sched.subjectName,
            instructor: sched.instructor,
            room: sched.room,
            startTime: sched.startTime,
            endTime: sched.endTime,
            triggerType,
          };

          // 1. Send Web Push Notification to user's phone/devices
          sendNotificationToUser(sched.user, {
            title: alertTitle,
            body: alertBody,
            url: '/schedule',
            data: {
              isAlarm: true,
              alarm: alarmPayload,
            },
          }).catch((err) => console.warn('[Push Alert Error]', err?.message));

          // 2. Broadcast via Socket.IO if user has an active open browser
          if (io) {
            io.emit('class_alarm_trigger', {
              userId: sched.user.toString(),
              alarm: alarmPayload,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[Schedule Notification Job Error]:', error);
  }
}

/**
 * Initializes the background 1-minute interval checker
 */
function startScheduleNotificationJob(io = null) {
  console.log('[Schedule Notification Job] Initialized. Monitoring 15-min and 0-min class alerts.');

  // Run initial check after 5 seconds
  setTimeout(() => checkAndDispatchClassAlerts(io), 5000);

  // Run every 60 seconds
  setInterval(() => {
    checkAndDispatchClassAlerts(io);
  }, 60000);
}

module.exports = {
  startScheduleNotificationJob,
  checkAndDispatchClassAlerts,
};
