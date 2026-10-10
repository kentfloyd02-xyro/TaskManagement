import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Archive, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const ArchiveVault = () => {
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks?isArchived=true');
      setArchivedTasks(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestore = async (id) => {
    try {
      await api.patch(`/tasks/${id}/archive`);
      fetchArchived();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this task? This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/tasks/${id}`);
      fetchArchived();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Archive Vault
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Soft-deleted tasks and completed past semester coursework can be restored or cleaned here.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {archivedTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Archived Task</th>
                  <th className="px-6 py-3.5">Period</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {archivedTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{task.title}</div>
                      <div className="text-xs text-slate-400">{task.taskType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {task.academicPeriod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {task.subject?.code || 'None'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(task._id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(task._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Archive className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">No archived items</h4>
            <p className="text-xs text-slate-400 mt-1">
              When you archive past tasks, they will securely appear in this vault.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveVault;
