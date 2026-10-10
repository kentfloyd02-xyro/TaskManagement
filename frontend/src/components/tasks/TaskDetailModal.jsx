import React, { useState } from 'react';
import api from '../../api/client';
import {
  X,
  Paperclip,
  CheckCircle,
  Clock,
  Calendar,
  BookOpen,
  Trash2,
  UploadCloud,
  FileText,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import { format } from 'date-fns';

const TaskDetailModal = ({ task, isOpen, onClose, onUpdated }) => {
  if (!isOpen || !task) return null;

  const [currentTask, setCurrentTask] = useState(task);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.patch(`/tasks/${currentTask._id}/status`, { status: newStatus });
      setCurrentTask(res.data.data);
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklist = async (index) => {
    const updated = [...currentTask.checklist];
    updated[index].isDone = !updated[index].isDone;

    try {
      const res = await api.patch(`/tasks/${currentTask._id}/checklist`, { checklist: updated });
      setCurrentTask(res.data.data);
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const updated = [...(currentTask.checklist || []), { text: newChecklistText.trim(), isDone: false }];
    try {
      const res = await api.patch(`/tasks/${currentTask._id}/checklist`, { checklist: updated });
      setCurrentTask(res.data.data);
      setNewChecklistText('');
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklistItem = async (index) => {
    const updated = currentTask.checklist.filter((_, i) => i !== index);
    try {
      const res = await api.patch(`/tasks/${currentTask._id}/checklist`, { checklist: updated });
      setCurrentTask(res.data.data);
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setError('');

    try {
      const res = await api.post(`/tasks/${currentTask._id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Refresh task
      const refreshed = await api.get(`/tasks/${currentTask._id}`);
      setCurrentTask(refreshed.data.data);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.delete(`/tasks/${currentTask._id}/attachments/${attachmentId}`);
      const refreshed = await api.get(`/tasks/${currentTask._id}`);
      setCurrentTask(refreshed.data.data);
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveToggle = async () => {
    try {
      await api.patch(`/tasks/${currentTask._id}/archive`);
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const priorityColors = {
    Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    High: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {currentTask.academicPeriod}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${priorityColors[currentTask.priority]}`}>
                {currentTask.priority} Priority
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {currentTask.taskType}
              </span>
              {currentTask.subject && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: currentTask.subject.color || '#3b82f6' }}
                >
                  {currentTask.subject.code}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {currentTask.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* Workflow Status Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Workflow Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    currentTask.status === st
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>
                <strong>Deadline:</strong>{' '}
                {currentTask.deadline
                  ? format(new Date(currentTask.deadline), 'MMM dd, yyyy h:mm a')
                  : 'No deadline set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>
                <strong>Est. Time:</strong> {currentTask.estimatedMinutes || 60} mins
              </span>
            </div>
          </div>

          {/* Description */}
          {currentTask.description && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Description & Notes
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {currentTask.description}
              </p>
            </div>
          )}

          {/* Subtasks / Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subtasks / Checklist ({currentTask.checklist?.filter((c) => c.isDone).length || 0}/
                {currentTask.checklist?.length || 0})
              </h4>
            </div>

            <div className="space-y-2 mb-3">
              {currentTask.checklist?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={item.isDone}
                      onChange={() => handleToggleChecklist(idx)}
                      className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                    />
                    <span
                      className={`text-sm ${
                        item.isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.text}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteChecklistItem(idx)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklist} className="flex gap-2">
              <input
                type="text"
                placeholder="Add new subtask item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700"
              >
                Add
              </button>
            </form>
          </div>

          {/* File Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                File Attachments ({currentTask.attachments?.length || 0})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {currentTask.attachments?.map((att) => (
                <div
                  key={att._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700"
                >
                  <a
                    href={att.path}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 truncate text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex-1"
                  >
                    <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="truncate">{att.originalName}</span>
                  </a>
                  <button
                    onClick={() => handleDeleteAttachment(att._id)}
                    className="text-slate-400 hover:text-red-500 p-1 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 cursor-pointer transition-colors">
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Uploading attachment...' : 'Upload assignment / rubric file (Max 15MB)'}</span>
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <button
            onClick={handleArchiveToggle}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
          >
            <Archive className="w-4 h-4" />
            {currentTask.isArchived ? 'Restore Task' : 'Archive Task'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
