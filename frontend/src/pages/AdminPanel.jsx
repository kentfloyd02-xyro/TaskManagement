import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  Clock,
  BookOpen,
  FolderGit2,
  Trash2,
  Edit2,
  Megaphone,
  Plus,
  Eye,
  X,
  Search,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';

const AdminPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');

  // Selected student to inspect their tasks
  const [inspectedUser, setInspectedUser] = useState(null);
  const [studentTasks, setStudentTasks] = useState([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // New Announcement form state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState('info');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, usersRes, announcementsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/admin/announcements'),
      ]);
      setAnalytics(analyticsRes.data.data);
      setUsers(usersRes.data.data);
      setAnnouncements(announcementsRes.data.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleInspectTasks = async (user) => {
    setInspectedUser(user);
    setInspectLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}/tasks`);
      setStudentTasks(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    const target = users.find((u) => u._id === userId);
    if (target && target.email.toLowerCase() === 'kentfloyd02@gmail.com') {
      alert('The Super Administrator account (kentfloyd02@gmail.com) cannot be demoted!');
      return;
    }
    const nextRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      await api.put(`/admin/users/${userId}`, { role: nextRole });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    const target = users.find((u) => u._id === userId);
    if (target && target.email.toLowerCase() === 'kentfloyd02@gmail.com') {
      alert('The Super Administrator account (kentfloyd02@gmail.com) is permanently protected and cannot be deleted!');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${name} and all their tasks? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/announcements', {
        title: newTitle,
        message: newMessage,
        type: newType,
      });
      setShowAnnouncementModal(false);
      setNewTitle('');
      setNewMessage('');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create announcement.');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/admin/announcements/${id}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.course && u.course.toLowerCase().includes(searchUser.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-blue-600/20 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/25">
              <ShieldAlert className="w-5 h-5" />
            </span>
            System Admin Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Exclusive management workspace for Kentfloyd02@gmail.com (Super Admin).
          </p>
        </div>

        <button
          onClick={() => setShowAnnouncementModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Megaphone className="w-4 h-4" />
          Broadcast Announcement
        </button>
      </div>

      {/* Global Analytics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs card-interactive animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics?.totalUsers || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Registered student accounts</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs card-interactive animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">System Tasks</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics?.totalTasks || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {analytics?.completedTasks || 0} completed across all users
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs card-interactive animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Subjects</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics?.totalSubjects || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Enrolled course categories</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs card-interactive animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Term Projects</span>
            <FolderGit2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics?.totalProjects || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Deliverables in progress</div>
        </div>
      </div>

      {/* Broadcast Announcements List */}
      <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-blue-500" />
          Active Broadcast Announcements
        </h3>

        {announcements.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No broadcast announcements currently active.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="flex items-start justify-between p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        ann.type === 'urgent'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : ann.type === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {ann.type}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{ann.message}</p>
                  <p className="text-[10px] text-slate-400">
                    Posted by {ann.authorName} on {format(new Date(ann.createdAt), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Table */}
      <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Registered Student Users ({filteredUsers.length})
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Program / Year</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active Tasks</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    {u.name}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {u.email}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {u.course} ({u.yearLevel})
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`font-extrabold uppercase px-2 py-0.5 rounded-md text-[10px] ${
                        u.role === 'admin'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    {u.completedTaskCount || 0} / {u.taskCount || 0} done
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleInspectTasks(u)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold"
                        title="Inspect User Tasks"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Tasks
                      </button>
                      {u.email.toLowerCase() === 'kentfloyd02@gmail.com' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/20"
                          title="Permanent Super Admin: Cannot be demoted or deleted"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                          Protected
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleUserRole(u._id, u.role)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold"
                            title="Toggle Admin / Student Role"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT TASK INSPECTION MODAL */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Inspecting Tasks: {inspectedUser.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{inspectedUser.email}</p>
              </div>
              <button
                onClick={() => setInspectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-3 flex-1">
              {inspectLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading student tasks...</div>
              ) : studentTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">This student has no tasks created.</div>
              ) : (
                studentTasks.map((t) => (
                  <div
                    key={t._id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{t.title}</span>
                      <span className="font-extrabold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {t.status}
                      </span>
                    </div>
                    {t.description && <p className="text-slate-500 dark:text-slate-400">{t.description}</p>}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Period: <strong>{t.academicPeriod}</strong></span>
                      {t.subject && <span>Subject: <strong>{t.subject.code}</strong></span>}
                      {t.deadline && <span>Due: {format(new Date(t.deadline), 'MMM dd, yyyy')}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Broadcast New Notice</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Change Notice"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Notice Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="urgent">Urgent Notice (Red)</option>
                  <option value="success">Success / Good News (Green)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Message Content *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Write message to appear on student dashboards..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 text-slate-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
