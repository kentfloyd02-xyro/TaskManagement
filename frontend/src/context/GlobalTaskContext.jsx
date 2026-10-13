import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { dbGetAll } from '../db/indexedDB';
import { startAlarm, stopAlarm } from '../utils/alarmSound';

const GlobalTaskContext = createContext();

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const GlobalTaskProvider = ({ children }) => {
  // Global Schedule OCR Scan state
  const [scheduleTask, setScheduleTask] = useState({
    isOpen: false,
    isMinimized: false,
    scanning: false,
    file: null,
    previewUrl: '',
    extractedSubjects: null,
    errorMessage: '',
    saveToTimetable: true,
  });

  // Global Reviewer Generator state
  const [reviewerTask, setReviewerTask] = useState({
    isOpen: false,
    isMinimized: false,
    generating: false,
    file: null,
    subject: '',
    category: 'quiz',
    questionCount: 10,
    questionType: 'multiple_choice',
    hasTimer: false,
    timerMinutes: 15,
    generatedData: null,
    errorMessage: '',
  });

  // Top dynamic island notification pill state
  const [islandNotification, setIslandNotification] = useState(null);

  // Active Emergency Class Alarm state
  const [activeAlarm, setActiveAlarm] = useState(null);

  // Snooze map: { [scheduleId_triggerType]: timestamp }
  const [snoozeMap, setSnoozeMap] = useState(() => {
    try {
      const saved = localStorage.getItem('student_planner_snooze_map');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  // Dismissed map for today: { [scheduleId_triggerType_YYYY-MM-DD]: true }
  const [dismissedMap, setDismissedMap] = useState(() => {
    try {
      const saved = localStorage.getItem('student_planner_dismissed_alarms');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const triggerIsland = (notif) => {
    setIslandNotification(notif);
    if (notif.type !== 'scanning' && notif.type !== 'generating') {
      setTimeout(() => {
        setIslandNotification((prev) => (prev?.id === notif.id ? null : prev));
      }, 7000);
    }
  };

  const dismissIsland = () => setIslandNotification(null);

  // Stop active alarm
  const handleStopAlarm = (alarm) => {
    stopAlarm();
    if (alarm) {
      const todayStr = new Date().toISOString().split('T')[0];
      const dismissKey = `${alarm._id || alarm.subjectCode}_${alarm.triggerType}_${todayStr}`;
      const updatedDismissed = { ...dismissedMap, [dismissKey]: true };
      setDismissedMap(updatedDismissed);
      try {
        localStorage.setItem('student_planner_dismissed_alarms', JSON.stringify(updatedDismissed));
      } catch (_) {}

      // Clear any snooze for this item
      const snoozeKey = `${alarm._id || alarm.subjectCode}_${alarm.triggerType}`;
      const nextSnooze = { ...snoozeMap };
      delete nextSnooze[snoozeKey];
      setSnoozeMap(nextSnooze);
      try {
        localStorage.setItem('student_planner_snooze_map', JSON.stringify(nextSnooze));
      } catch (_) {}
    }
    setActiveAlarm(null);
    triggerIsland({
      id: 'alarm_stopped',
      target: 'schedule',
      type: 'info',
      title: '🛑 Alarm Stopped',
      subtitle: `${alarm?.subjectCode || 'Class'} alarm turned off.`,
    });
  };

  // Snooze active alarm for 5 minutes
  const handleSnoozeAlarm = (alarm) => {
    stopAlarm();
    if (alarm) {
      const snoozeKey = `${alarm._id || alarm.subjectCode}_${alarm.triggerType}`;
      const wakeTime = Date.now() + 5 * 60 * 1000; // 5 minutes snooze
      const updatedSnooze = { ...snoozeMap, [snoozeKey]: { wakeTime, alarm } };
      setSnoozeMap(updatedSnooze);
      try {
        localStorage.setItem('student_planner_snooze_map', JSON.stringify(updatedSnooze));
      } catch (_) {}
    }
    setActiveAlarm(null);

    const wakeDate = new Date(Date.now() + 5 * 60 * 1000);
    const wakeFormatted = wakeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    triggerIsland({
      id: 'alarm_snoozed',
      target: 'schedule',
      type: 'warning',
      title: '⏳ Alarm Snoozed for 5 Mins',
      subtitle: `Tutunog muli ang sirena sa ${wakeFormatted}.`,
    });
  };

  // Manual alarm trigger (for testing in UI)
  const triggerManualAlarmTest = (customSchedule = null) => {
    const sample = customSchedule || {
      _id: 'test_alarm_' + Date.now(),
      subjectCode: 'IT101',
      subjectName: 'Introduction to Computing',
      instructor: 'Prof. Santos',
      room: 'Room 304 / Lab 1',
      startTime: '08:00',
      endTime: '10:00',
      triggerType: '15min',
    };
    setActiveAlarm(sample);
  };

  // Event listener for custom window events and service worker messages
  useEffect(() => {
    const handleIslandEvent = (e) => {
      if (e.detail) {
        triggerIsland(e.detail);
      }
    };
    window.addEventListener('student-planner-island-notif', handleIslandEvent);

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'TRIGGER_ALARM' && event.data.alarm) {
        setActiveAlarm(event.data.alarm);
      }
    };
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('student-planner-island-notif', handleIslandEvent);
      if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Background monitor: Checks schedules every 15 seconds
  useEffect(() => {
    const checkScheduleAlarms = async () => {
      if (activeAlarm) return; // Already alarming

      const now = new Date();
      const currentDay = DAYS_OF_WEEK[now.getDay()];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];

      // 1. Check Snoozed Alarms first
      for (const [key, snoozeData] of Object.entries(snoozeMap)) {
        if (snoozeData && snoozeData.wakeTime && Date.now() >= snoozeData.wakeTime) {
          // Snooze expired! Ring siren again!
          const alarmToRing = snoozeData.alarm;
          const updatedSnooze = { ...snoozeMap };
          delete updatedSnooze[key];
          setSnoozeMap(updatedSnooze);
          try {
            localStorage.setItem('student_planner_snooze_map', JSON.stringify(updatedSnooze));
          } catch (_) {}

          setActiveAlarm(alarmToRing);
          return;
        }
      }

      // 2. Fetch all schedules from local IndexedDB
      try {
        const schedules = await dbGetAll('schedules');
        if (!Array.isArray(schedules) || schedules.length === 0) return;

        for (const sched of schedules) {
          if (!sched.days || !sched.days.includes(currentDay)) continue;
          if (!sched.startTime) continue;

          const [hStr, mStr] = sched.startTime.split(':');
          const classStartMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
          const diffMinutes = classStartMinutes - currentMinutes;

          // A. 15-Minute Alert
          if (diffMinutes === 15) {
            const dismissKey = `${sched._id || sched.subjectCode}_15min_${todayStr}`;
            const snoozeKey = `${sched._id || sched.subjectCode}_15min`;
            if (!dismissMapHasKey(dismissedMap, dismissKey) && !snoozeMap[snoozeKey]) {
              setActiveAlarm({
                ...sched,
                triggerType: '15min',
              });
              return;
            }
          }

          // B. 0-Minute (Class Starting Now) Alert
          if (diffMinutes === 0) {
            const dismissKey = `${sched._id || sched.subjectCode}_start_${todayStr}`;
            const snoozeKey = `${sched._id || sched.subjectCode}_start`;
            if (!dismissMapHasKey(dismissedMap, dismissKey) && !snoozeMap[snoozeKey]) {
              setActiveAlarm({
                ...sched,
                triggerType: 'start',
              });
              return;
            }
          }
        }
      } catch (err) {
        // Silent catch for background monitoring
      }
    };

    function dismissMapHasKey(map, key) {
      return Boolean(map && map[key]);
    }

    // Run check every 15 seconds
    const interval = setInterval(checkScheduleAlarms, 15000);
    // Initial check after 2 seconds
    const timeout = setTimeout(checkScheduleAlarms, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [activeAlarm, snoozeMap, dismissedMap]);

  return (
    <GlobalTaskContext.Provider
      value={{
        scheduleTask,
        setScheduleTask,
        reviewerTask,
        setReviewerTask,
        islandNotification,
        setIslandNotification,
        triggerIsland,
        dismissIsland,
        activeAlarm,
        setActiveAlarm,
        handleStopAlarm,
        handleSnoozeAlarm,
        triggerManualAlarmTest,
      }}
    >
      {children}
    </GlobalTaskContext.Provider>
  );
};

export const useGlobalTasks = () => {
  const context = useContext(GlobalTaskContext);
  if (!context) {
    throw new Error('useGlobalTasks must be used within GlobalTaskProvider');
  }
  return context;
};
