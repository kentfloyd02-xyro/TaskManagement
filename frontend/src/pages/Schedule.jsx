import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Bell,
  BellOff,
  BookOpen,
  MapPin,
  User,
  CheckCircle2,
  X,
  AlertCircle,
  Smartphone,
  Volume2,
} from 'lucide-react';
import { useGlobalTasks } from '../context/GlobalTaskContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Schedule = () => {
  const { triggerManualAlarmTest } = useGlobalTasks();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState('default'); // 'default', 'granted', 'denied'
  const [feedback, setFeedback] = useState('');

  // Form state
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Wednesday']);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState('#2563eb');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await client.get('/schedule');
      if (res.data?.success) {
        setSchedules(res.data.schedules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    if ('Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  // Subscribe to real phone/browser push notifications
  const handleEnablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Hindi suportado ng browser na ito ang Web Push Notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission !== 'granted') {
        alert('Kailangang i-allow ang notification permission para tumunog ang reminders sa iyong phone/browser.');
        return;
      }

      // Fetch VAPID public key with fallback
      let publicKey = '';
      try {
        const vapidRes = await client.get('/schedule/vapid-key');
        publicKey = vapidRes.data?.publicKey;
      } catch (e) {
        console.warn('Could not fetch VAPID key from backend, using fallback key:', e);
      }

      // Default public key fallback
      if (!publicKey) {
        publicKey = 'BE7YZZPJxF-GbXxy1L11Nrd1uzpWddHejxbzDMVPyXBXDJvQBa_7W82SxBltk9Mz341Ug4KHzRObv2IwmG55_a4';
      }

      const registration = await navigator.serviceWorker.ready;
      const convertedKey = urlBase64ToUint8Array(publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      await client.post('/schedule/subscribe-push', { subscription });
      setFeedback('🎉 Matagumpay na na-activate ang Phone Push Reminders! Tutunog ito 15 mins bago ang iyong klase.');
      setTimeout(() => setFeedback(''), 5000);
    } catch (err) {
      console.error('Push error:', err);
      alert('Failed to subscribe: ' + err.message);
    }
  };

  // Convert VAPID key helper
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!subjectCode || !subjectName || selectedDays.length === 0) {
      alert('Punan ang subject code, name, at pumili ng kahit isang araw.');
      return;
    }

    try {
      const res = await client.post('/schedule', {
        subjectCode,
        subjectName,
        instructor,
        room,
        days: selectedDays,
        startTime,
        endTime,
        color,
        reminderMinutesBefore,
      });

      if (res.data?.success) {
        setIsModalOpen(false);
        setSubjectCode('');
        setSubjectName('');
        setInstructor('');
        setRoom('');
        fetchSchedule();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating schedule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigurado ka bang nais mong burahin ang class schedule na ito?')) return;
    try {
      await client.delete(`/schedule/${id}`);
      setSchedules((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <Calendar className="w-5 h-5" />
            </span>
            Weekly Class Timetable & Schedule
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor lecture times, rooms, and receive real phone push alerts 15 minutes before class.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Push Notification Activation Button */}
          {pushStatus !== 'granted' ? (
            <button
              onClick={handleEnablePushNotifications}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4 animate-bounce" />
              <span>Allow Phone Notifications</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Bell className="w-3.5 h-3.5" />
              <span>15-min Phone Alerts Active</span>
            </span>
          )}

          {/* Test Alarm Siren Button */}
          <button
            onClick={() => triggerManualAlarmTest(schedules[0] || null)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 transition-all cursor-pointer"
            title="Subukan ang tunog ng Siren Alarm at Snooze/Stop buttons"
          >
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>Test Alarm Siren</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Schedule</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TIMETABLE WEEKLY MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayClasses = schedules.filter((s) => s.days?.includes(day));

          return (
            <div
              key={day}
              className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm flex flex-col space-y-3"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{day}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {dayClasses.length} {dayClasses.length === 1 ? 'Class' : 'Classes'}
                </span>
              </div>

              {/* Class Cards */}
              <div className="space-y-2.5 flex-1">
                {dayClasses.map((cls) => (
                  <div
                    key={cls._id}
                    className="p-3.5 rounded-2xl border text-left space-y-2 relative group transition-all shadow-2xs hover:shadow-md"
                    style={{
                      borderColor: `${cls.color}40`,
                      backgroundColor: `${cls.color}0a`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-md text-white"
                        style={{ backgroundColor: cls.color }}
                      >
                        {cls.subjectCode}
                      </span>
                      <button
                        onClick={() => handleDelete(cls._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 text-slate-400 transition-opacity"
                        title="Delete class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                      {cls.subjectName}
                    </h4>

                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          {cls.startTime} - {cls.endTime}
                        </span>
                      </div>
                      {cls.room && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Room: {cls.room}</span>
                        </div>
                      )}
                      {cls.instructor && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Prof: {cls.instructor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {dayClasses.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Walang klase
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE SCHEDULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Add New Class Schedule
                  </h3>
                  <p className="text-xs text-slate-500">Auto phone reminders 15 mins before</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CC106"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Room / Lab
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 304 / Lab 2"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Subject Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Application Development & Emerging Technologies"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Instructor / Professor (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engr. Santos"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              {/* Day Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">
                  Class Days *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = selectedDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              {/* Reminder Duration Selection */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Notification Reminder (Phone/Browser)
                </label>
                <div className="flex gap-2">
                  {[10, 15, 30, 60].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setReminderMinutesBefore(mins)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        reminderMinutesBefore === mins
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {mins} mins before
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
