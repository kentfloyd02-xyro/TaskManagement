import React, { useState } from 'react';
import client from '../../api/client';
import {
  Users,
  X,
  Plus,
  Shield,
  BookOpen,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const CreateGroupModal = ({ isOpen, onClose, onSuccess, friends = [] }) => {
  const [name, setName] = useState('');
  const [subjectTag, setSubjectTag] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group chat name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await client.post('/chat/group', {
        name: name.trim(),
        memberIds: selectedFriends,
        subjectTag: subjectTag.trim(),
        requiresApproval,
      });

      if (res.data?.success) {
        onSuccess(res.data.room);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Create Study Group Chat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Collaborate with classmates on assignments and reviewers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Halimbawa: CC106 Study Gang, Finals Reviewers"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject Tag */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Subject Tag (Optional)
            </label>
            <input
              type="text"
              value={subjectTag}
              onChange={(e) => setSubjectTag(e.target.value)}
              placeholder="e.g. CC106, IM101, History"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Admin Approval Toggle Option */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Creator / Admin Approval
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kailangan ng approval mo bago makapasok ang bagong sasali
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer accent-blue-600"
            />
          </div>

          {/* Select Friends */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Add Friends to Group ({selectedFriends.length} selected)</span>
            </label>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
              {friends.map((friend) => {
                const isSelected = selectedFriends.includes(friend._id);
                return (
                  <div
                    key={friend._id}
                    onClick={() => toggleFriend(friend._id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {friend.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{friend.name}</span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}

              {friends.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-3">
                  Wala ka pang friends. Mag-add muna ng friends para maisama sa GC!
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Group...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Create Group Chat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
