import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Clock, MapPin, User, AlertTriangle, Volume2, Moon } from 'lucide-react';
import { startAlarm, stopAlarm } from '../../utils/alarmSound';

const ClassAlarmModal = ({ alarm, onStop, onSnooze }) => {
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    // Automatically start loud alarm siren when modal mounts
    startAlarm();

    const interval = setInterval(() => {
      setPulseCount((c) => c + 1);
    }, 1000);

    return () => {
      // Ensure audio stops if modal unmounts
      stopAlarm();
      clearInterval(interval);
    };
  }, []);

  if (!alarm) return null;

  const isStartingNow = alarm.triggerType === 'start';
  const headerBg = isStartingNow
    ? 'from-red-600 via-rose-600 to-amber-600'
    : 'from-amber-500 via-orange-600 to-rose-600';

  const titleText = isStartingNow
    ? '🔔 CLASS STARTING RIGHT NOW!'
    : '🚨 15-MINUTE CLASS WARNING!';

  const subtitleText = isStartingNow
    ? 'Pumasok na sa iyong classroom o online meeting link.'
    : 'Mayroon ka na lamang 15 minuto upang maghanda bago magsimula ang klase.';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Pulsing Emergency Glow Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border-4 border-red-500 dark:border-rose-500 overflow-hidden animate-pulse">
        {/* Flashing Top Alert Banner */}
        <div className={`p-6 text-white bg-gradient-to-r ${headerBg} text-center relative overflow-hidden`}>
          <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-black/30 px-2.5 py-1 rounded-full">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            <span>SIREN ACTIVE</span>
          </div>

          {/* Ringing Bell Icon */}
          <div className="w-20 h-20 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40 shadow-inner">
            <Bell className="w-10 h-10 text-white animate-bounce" />
          </div>

          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase drop-shadow-md">
            {titleText}
          </h2>
          <p className="text-xs md:text-sm font-medium text-white/90 mt-1 max-w-sm mx-auto">
            {subtitleText}
          </p>
        </div>

        {/* Class Information Body */}
        <div className="p-6 space-y-4">
          <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 mb-2">
              {alarm.subjectCode || 'SUBJECT'}
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {alarm.subjectName || 'Class Schedule'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Class Time</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {alarm.startTime} - {alarm.endTime || 'End'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="truncate">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Room / Venue</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {alarm.room || 'TBA'}
                </p>
              </div>
            </div>
          </div>

          {alarm.instructor && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <User className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Instructor</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{alarm.instructor}</p>
              </div>
            </div>
          )}

          {/* Interactive Stop & Snooze Buttons */}
          <div className="pt-2 space-y-2.5">
            {/* Big Stop Button */}
            <button
              onClick={() => {
                stopAlarm();
                onStop(alarm);
              }}
              className="w-full py-4 px-6 rounded-2xl font-black text-sm md:text-base uppercase tracking-wider bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BellOff className="w-5 h-5" />
              <span>STOP ALARM</span>
            </button>

            {/* Snooze 5 Minutes Button */}
            <button
              onClick={() => {
                stopAlarm();
                onSnooze(alarm);
              }}
              className="w-full py-3 px-6 rounded-2xl font-bold text-xs md:text-sm bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Moon className="w-4 h-4" />
              <span>Snooze (Remind me in 5 minutes)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassAlarmModal;
