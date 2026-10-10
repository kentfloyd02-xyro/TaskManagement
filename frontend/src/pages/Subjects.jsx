import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { BookOpen, Plus, Trash2, Edit2, Archive, CheckCircle } from 'lucide-react';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Subjects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your enrolled courses, instructors, and class schedules.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
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
    </div>
  );
};

export default Subjects;
