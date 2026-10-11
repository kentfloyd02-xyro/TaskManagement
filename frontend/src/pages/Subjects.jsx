import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Archive,
  CheckCircle,
  AlertCircle,
  Sparkles,
  UploadCloud,
  Loader2,
  X,
} from 'lucide-react';
import ScheduleScanModal from '../components/subjects/ScheduleScanModal';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [isScanMinimized, setIsScanMinimized] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [islandNotification, setIslandNotification] = useState(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [instructor, setInstructor] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects');
      setSubjects(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects', {
        code,
        name,
        color,
        instructor,
        schedule,
        room,
      });
      setShowModal(false);
      setCode('');
      setName('');
      setInstructor('');
      setSchedule('');
      setRoom('');
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await api.patch(`/subjects/${id}/archive`);
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const colorOptions = [
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
  ];

  const handleNotifyIsland = (notif) => {
    setIslandNotification(notif);
    if (notif.type !== 'scanning') {
      setTimeout(() => {
        setIslandNotification((prev) => (prev?.title === notif.title ? null : prev));
      }, 6000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative">
      {/* Dynamic Island Floating Notification Pill (Top Center) */}
      {islandNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-6 duration-300">
          <div
            onClick={() => {
              if (showScanModal && isScanMinimized) {
                setIsScanMinimized(false);
              }
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl border text-xs cursor-pointer transition-all hover:scale-105 ${
              islandNotification.type === 'error'
                ? 'bg-rose-950/90 border-rose-700/80 text-rose-100 shadow-rose-900/40'
                : islandNotification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-100 shadow-emerald-900/40'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-100 shadow-black/40'
            }`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
              {islandNotification.type === 'scanning' ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : islandNotification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>

            <div className="truncate max-w-xs md:max-w-md">
              <span className="font-extrabold mr-1">{islandNotification.title}</span>
              <span className="opacity-80 text-[11px] truncate">{islandNotification.subtitle}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIslandNotification(null);
              }}
              className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Subjects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            I-manage ang iyong mga enrolled courses, instructors, at class schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            title="I-scan ang imahe o file ng iyong school schedule"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Scan Schedule</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-emerald-800 dark:text-emerald-200 text-sm animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            Close
          </button>
        </div>
      )}

      {/* Drag & Drop Hero Quick-Action Bar */}
      <div
        onClick={() => setShowScanModal(true)}
        className="p-5 rounded-3xl border-2 border-dashed border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-blue-600 shadow-sm border border-blue-100 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>May kopya ka ba ng School Schedule o COR?</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                AI Auto-Add
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              I-drop o i-click dito para mag-scan ng schedule image/PDF at awtomatikong magdagdag ng lahat ng subjects.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
          <Sparkles className="w-3.5 h-3.5" /> Mag-upload
        </span>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => (
          <div
            key={sub._id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-2.5 py-1 text-xs font-bold text-white rounded-lg shadow-2xs"
                  style={{ backgroundColor: sub.color || '#3b82f6' }}
                >
                  {sub.code}
                </span>
                <button
                  onClick={() => handleArchive(sub._id)}
                  title="Archive Subject"
                  className="text-slate-400 hover:text-amber-500 p-1"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                {sub.name}
              </h3>

              {sub.instructor && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Instructor: <strong>{sub.instructor}</strong>
                </p>
              )}

              {sub.schedule && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sched: {sub.schedule} {sub.room ? `(${sub.room})` : ''}
                </p>
              )}
            </div>
          </div>
        ))}

        {subjects.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">No subjects added yet</h4>
            <p className="text-xs text-slate-400 mt-1">
              Add your courses for the current semester to start organizing your assignments.
            </p>
          </div>
        )}
      </div>

      {/* Modal Add Subject */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Subject</h3>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS101, IT204"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Badge Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    placeholder="Prof. Santos"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Room / Sched
                  </label>
                  <input
                    type="text"
                    placeholder="MWF 10AM / Lab 3"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Auto-Scan Modal with Minimize & Dynamic Island support */}
      <ScheduleScanModal
        isOpen={showScanModal}
        onClose={() => {
          setShowScanModal(false);
          setIsScanMinimized(false);
        }}
        isMinimized={isScanMinimized}
        setIsMinimized={setIsScanMinimized}
        onNotifyIsland={handleNotifyIsland}
        onSuccess={(subCount, timetableCount) => {
          fetchSubjects();
          setSuccessBanner(
            `🎉 Matagumpay na na-import ang ${subCount} subjects! ${
              timetableCount > 0
                ? `Nai-sync din ang ${timetableCount} classes sa iyong Timetable na may push reminders.`
                : ''
            }`
          );
        }}
      />
    </div>
  );
};

export default Subjects;
