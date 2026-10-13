import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/common/UserAvatar';
import AcademicPeriodBars from '../components/tasks/AcademicPeriodBars';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import GamificationWidget from '../components/gamification/GamificationWidget';
import {
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const { refreshTrigger, triggerRefresh } = useOutletContext();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const [announcements, setAnnouncements] = useState([]);

  const defaultSummary = {
    periods: {
      Prelim: { total: 0, completed: 0, pending: 0, percentage: 0 },
      Midterm: { total: 0, completed: 0, pending: 0, percentage: 0 },
      Finals: { total: 0, completed: 0, pending: 0, percentage: 0 },
    },
    statusCounts: {
      Backlog: 0,
      'To Do': 0,
      'In Progress': 0,
      Review: 0,
      Completed: 0,
      totalActive: 0,
    },
    priorityCounts: { Urgent: 0, High: 0, Medium: 0, Low: 0 },
    upcomingDeadlines: [],
    overdueCount: 0,
    totalSubjects: 0,
    totalProjects: 0,
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, annRes] = await Promise.allSettled([
          api.get('/analytics/dashboard-summary'),
          api.get('/admin/announcements'),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.data?.success) {
          setSummary(dashRes.value.data.data);
          localStorage.setItem('cached_dashboard_summary', JSON.stringify(dashRes.value.data.data));
        } else {
          const cached = localStorage.getItem('cached_dashboard_summary');
          if (cached) {
            setSummary(JSON.parse(cached));
          } else {
            setSummary(defaultSummary);
          }
        }

        if (annRes.status === 'fulfilled' && annRes.value.data?.success) {
          setAnnouncements(annRes.value.data.data || []);
        }
      } catch (err) {
        console.warn('Dashboard fetch issue, loading fallback:', err);
        const cached = localStorage.getItem('cached_dashboard_summary');
        setSummary(cached ? JSON.parse(cached) : defaultSummary);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();

    const handleSyncUpdate = () => fetchDashboard();
    window.addEventListener('student-planner-data-updated', handleSyncUpdate);
    window.addEventListener('student-planner-full-sync-complete', handleSyncUpdate);

    return () => {
      window.removeEventListener('student-planner-data-updated', handleSyncUpdate);
      window.removeEventListener('student-planner-full-sync-complete', handleSyncUpdate);
    };
  }, [refreshTrigger]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-blue-600/20 border-t-blue-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Admin Broadcast Announcements Banner */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.map((ann) => (
            <div
              key={ann._id}
              className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
                ann.type === 'urgent'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100'
                  : ann.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100'
                  : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100'
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/30">
                    {ann.type} Notice
                  </span>
                  <h4 className="font-bold text-sm">{ann.title}</h4>
                </div>
                <p className="text-xs opacity-90">{ann.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Banner Header with User Avatar */}
      <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-5 sm:p-6 rounded-3xl border border-blue-500/20 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="xl" className="ring-4 ring-white dark:ring-slate-800 shadow-md" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                {user?.yearLevel || 'College Student'}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">•</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {user?.course || 'Student Planner'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Monitor term milestones, upcoming assignment deadlines, and course workloads.
            </p>
          </div>
        </div>
      </div>

      {/* Prelim / Midterm / Finals Progress Taskbars */}
      <AcademicPeriodBars periods={summary?.periods} />

      {/* Gamification: Daily Study Streaks, Badges, & Friends Leaderboard */}
      <GamificationWidget />

      {/* Key Metric Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs card-interactive animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Tasks</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 transition-transform hover:scale-110">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            {summary?.statusCounts?.totalActive || 0}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            {summary?.statusCounts?.Completed || 0} marked completed
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs card-interactive animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Urgent & High</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 transition-transform hover:scale-110">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400">
            {(summary?.priorityCounts?.Urgent || 0) + (summary?.priorityCounts?.High || 0)}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">Immediate focus needed</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs card-interactive animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Enrolled Subjects</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 transition-transform hover:scale-110">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            {summary?.totalSubjects || 0}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">Courses this semester</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs card-interactive animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 transition-transform hover:scale-110">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-black ${summary?.overdueCount > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {summary?.overdueCount || 0}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">Past due submissions</div>
        </div>
      </div>

      {/* Upcoming Submissions & Workflow Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Deadlines */}
        <div className="lg:col-span-2 bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <Calendar className="w-4 h-4" />
              </span>
              Upcoming Submissions (Next 7 Days)
            </h2>
          </div>

          {summary?.upcomingDeadlines?.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/60 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No upcoming deadlines this week!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You're caught up with all scheduled academic activities.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary?.upcomingDeadlines?.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center justify-between p-4 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {task.academicPeriod}
                      </span>
                      {task.subject && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-2xs"
                          style={{ backgroundColor: task.subject.color || '#3b82f6' }}
                        >
                          {task.subject.code}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium">
                        {task.taskType}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        {task.deadline ? format(new Date(task.deadline), 'MMM dd, h:mm a') : 'No date'}
                      </p>
                      <span className="text-xs font-semibold text-slate-400">{task.status}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Workflow Distribution */}
        <div className="bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </span>
              Workflow Status
            </h2>
            <div className="space-y-3.5">
              {[
                { label: 'Backlog', count: summary?.statusCounts?.Backlog || 0, color: 'bg-slate-400' },
                { label: 'To Do', count: summary?.statusCounts?.['To Do'] || 0, color: 'bg-blue-500' },
                { label: 'In Progress', count: summary?.statusCounts?.['In Progress'] || 0, color: 'bg-amber-500' },
                { label: 'Review', count: summary?.statusCounts?.Review || 0, color: 'bg-purple-500' },
                { label: 'Completed', count: summary?.statusCounts?.Completed || 0, color: 'bg-emerald-500' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-xs">{label}</span>
                  </div>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 text-center font-medium">
              Keep progressing through stages from Backlog to Completed!
            </p>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={triggerRefresh}
        />
      )}
    </div>
  );
};

export default Dashboard;
