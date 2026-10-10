import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import {
  Kanban,
  List,
  Calendar,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  Download,
  GripVertical,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';

const TaskCenter = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [currentView, setCurrentView] = useState('kanban'); // 'kanban' | 'list' | 'calendar'
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tasksRes, subjectsRes, projectsRes] = await Promise.all([
        api.get('/tasks?isArchived=false'),
        api.get('/subjects'),
        api.get('/projects'),
      ]);
      setTasks(tasksRes.data.data);
      setSubjects(subjectsRes.data.data);
      setProjects(projectsRes.data.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [refreshTrigger]);

  // Status Change Logic (used for both Drag & Drop and Dropdown selector)
  const handleMoveStatus = async (taskId, newStatus) => {
    try {
      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      if (newStatus === 'Completed') {
        try {
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.75 },
          });
        } catch (e) {}
      }
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      triggerRefresh();
    } catch (err) {
      console.error('Failed to move task:', err);
      fetchAll();
    }
  };

  // Drag and Drop event handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== column) {
      setDragOverColumn(column);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      await handleMoveStatus(taskId, targetColumn);
      setDraggedTaskId(null);
    }
  };

  // CSV Export functionality
  const handleExportCSV = () => {
    if (filteredTasks.length === 0) {
      alert('No tasks to export with the current filter.');
      return;
    }

    const headers = ['Title', 'Academic Period', 'Subject', 'Task Type', 'Priority', 'Status', 'Deadline', 'Estimated Minutes', 'Checklist Completed'];
    const rows = filteredTasks.map((t) => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.academicPeriod || ''}"`,
      `"${t.subject?.code || 'None'}"`,
      `"${t.taskType || ''}"`,
      `"${t.priority || ''}"`,
      `"${t.status || ''}"`,
      `"${t.deadline ? format(new Date(t.deadline), 'yyyy-MM-dd HH:mm') : 'None'}"`,
      t.estimatedMinutes || 60,
      `"${(t.checklist || []).filter((c) => c.isDone).length}/${(t.checklist || []).length}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_tasks_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPeriod = periodFilter === 'All' || task.academicPeriod === periodFilter;
    const matchesSubject = subjectFilter === 'All' || task.subject?._id === subjectFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

    return matchesSearch && matchesPeriod && matchesSubject && matchesPriority;
  });

  const columns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];

  const priorityColors = {
    Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    High: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Task Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag cards between columns or use the dropdown to shift task statuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            title="Download CSV file of tasks"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* View Switcher Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setCurrentView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'kanban'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'calendar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Periods</option>
            <option value="Prelim">Prelim</option>
            <option value="Midterm">Midterm</option>
            <option value="Finals">Finals</option>
          </select>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* VIEW: KANBAN BOARD WITH DRAG & DROP + QUICK SELECTOR */}
      {currentView === 'kanban' && (
        <div className="flex gap-5 items-start overflow-x-auto pb-6 pt-1 w-full scroll-smooth">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column);
            const isTarget = dragOverColumn === column;

            return (
              <div
                key={column}
                onDragOver={(e) => handleDragOver(e, column)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column)}
                className={`rounded-2xl p-4 border transition-all w-72 shrink-0 flex flex-col max-h-[80vh] shadow-xs ${
                  isTarget
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 ring-2 ring-blue-500/20 scale-[1.01]'
                    : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800/90'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{column}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards Column */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs card-interactive cursor-grab active:cursor-grabbing group select-none animate-fade-in"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {task.academicPeriod}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
                        {task.title}
                      </h4>

                      {task.subject && (
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: task.subject.color || '#3b82f6' }}
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {task.subject.code} - {task.subject.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {task.deadline ? format(new Date(task.deadline), 'MMM dd') : 'No date'}
                        </span>
                        {task.checklist?.length > 0 && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {task.checklist.filter((c) => c.isDone).length}/{task.checklist.length}
                          </span>
                        )}
                      </div>

                      {/* Fallback Click-to-Move Selector */}
                      <div
                        className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-slate-400 text-[10px]">Move to:</span>
                        <select
                          value={task.status}
                          onChange={(e) => handleMoveStatus(task._id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-semibold py-0.5 px-1.5 rounded-md border border-slate-200 dark:border-slate-600 cursor-pointer"
                        >
                          {columns.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      {isTarget ? 'Drop task here' : 'Empty column'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: LIST TABLE */}
      {currentView === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Task Title</th>
                  <th className="px-6 py-3.5">Period</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTasks.map((task) => (
                  <tr
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{task.title}</div>
                      <div className="text-xs text-slate-400">{task.taskType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {task.academicPeriod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {task.subject ? (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-md text-white"
                          style={{ backgroundColor: task.subject.color || '#3b82f6' }}
                        >
                          {task.subject.code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy h:mm a') : 'No deadline'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CALENDAR DEADLINE AGENDA */}
      {currentView === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Chronological Deadline Timeline
          </h3>

          <div className="space-y-4">
            {filteredTasks
              .filter((t) => t.deadline)
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="bg-blue-600 text-white p-3 rounded-xl text-center min-w-[70px]">
                    <div className="text-xs uppercase font-semibold">
                      {format(new Date(task.deadline), 'MMM')}
                    </div>
                    <div className="text-xl font-extrabold leading-none">
                      {format(new Date(task.deadline), 'dd')}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {task.academicPeriod}
                      </span>
                      {task.subject && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {task.subject.code}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Due at {format(new Date(task.deadline), 'h:mm a')} • Status: {task.status}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

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

export default TaskCenter;
