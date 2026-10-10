import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { FolderGit2, Plus, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('Planning');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const [projRes, subRes] = await Promise.all([
        api.get('/projects'),
        api.get('/subjects'),
      ]);
      setProjects(projRes.data.data);
      setSubjects(subRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', {
        title,
        description,
        subject: subject || null,
        deadline: deadline || null,
        status,
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Projects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track major semester projects, group deliverables, and completion rates.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => (
          <div
            key={proj._id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                {proj.subject ? (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: proj.subject.color || '#3b82f6' }}
                  >
                    {proj.subject.code}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">General Project</span>
                )}
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {proj.status}
                </span>
              </div>

              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                {proj.title}
              </h3>

              {proj.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                  {proj.description}
                </p>
              )}

              {/* Progress bar */}
              <div className="space-y-1 mt-4">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Task Progress</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {proj.taskStats?.percentage || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${proj.taskStats?.percentage || 0}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  {proj.taskStats?.completed || 0} of {proj.taskStats?.total || 0} linked tasks completed
                </div>
              </div>
            </div>

            {proj.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Due: {format(new Date(proj.deadline), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>
        ))}

        {projects.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">No projects created yet</h4>
            <p className="text-xs text-slate-400 mt-1">
              Create a group project or research paper workspace to group your tasks together.
            </p>
          </div>
        )}
      </div>

      {/* Modal Add Project */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Project</h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Capstone Phase 1, Final Group Presentation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Linked Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">No Specific Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
