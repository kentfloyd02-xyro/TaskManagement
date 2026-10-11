import React, { useState } from 'react';
import client from '../../api/client';
import {
  UserPlus,
  Search,
  Check,
  X,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const AddFriendModal = ({ isOpen, onClose, onFriendUpdated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingMap, setSendingMap] = useState({});
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await client.get(`/friends/search?query=${encodeURIComponent(searchTerm.trim())}`);
      if (res.data?.success) {
        setResults(res.data.users || []);
      }
    } catch (err) {
      setError('Failed to search students');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setSendingMap((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await client.post('/friends/request', { recipientId: userId });
      if (res.data?.success) {
        setResults((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, relationship: 'sent' } : u))
        );
        if (onFriendUpdated) onFriendUpdated();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending request');
    } finally {
      setSendingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Add Classmate as Friend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Search students by full name or email address.
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type name or email address..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Results List */}
          <div className="space-y-2 pt-2">
            {results.map((student) => {
              const isSending = sendingMap[student._id];
              return (
                <div
                  key={student._id}
                  className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {student.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                    </div>
                  </div>

                  {student.relationship === 'friend' ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Friends</span>
                    </span>
                  ) : student.relationship === 'sent' ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-xl shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(student._id)}
                      disabled={isSending}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Friend</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}

            {results.length === 0 && searchTerm && !loading && (
              <p className="text-center text-xs text-slate-400 py-6">
                Walang nahanap na estudyante na tumutugma sa iyong search query.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
