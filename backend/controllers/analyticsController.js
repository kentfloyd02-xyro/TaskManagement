const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Project = require('../models/Project');

const calculatePercentage = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// @desc    Get dashboard summary (Prelim/Midterm/Finals progress bars, upcoming deadlines, status counts)
// @route   GET /api/analytics/dashboard-summary
// @access  Private
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all active (non-archived) tasks of user
    const tasks = await Task.find({ user: userId, isArchived: false })
      .populate('subject', 'name code color')
      .populate('project', 'title status')
      .sort({ deadline: 1 });

    // 1. Calculation for Academic Periods (Prelim, Midterm, Finals)
    const periods = ['Prelim', 'Midterm', 'Finals'];
    const periodStats = {};

    periods.forEach((period) => {
      const periodTasks = tasks.filter((t) => t.academicPeriod === period);
      const total = periodTasks.length;
      const completed = periodTasks.filter((t) => t.status === 'Completed').length;
      const pending = total - completed;
      const percentage = calculatePercentage(completed, total);

      periodStats[period] = {
        total,
        completed,
        pending,
        percentage,
      };
    });

    // 2. Status counts
    const statusCounts = {
      Backlog: tasks.filter((t) => t.status === 'Backlog').length,
      'To Do': tasks.filter((t) => t.status === 'To Do').length,
      'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
      Review: tasks.filter((t) => t.status === 'Review').length,
      Completed: tasks.filter((t) => t.status === 'Completed').length,
      totalActive: tasks.length,
    };

    // 3. Priority counts
    const priorityCounts = {
      Urgent: tasks.filter((t) => t.priority === 'Urgent' && t.status !== 'Completed').length,
      High: tasks.filter((t) => t.priority === 'High' && t.status !== 'Completed').length,
      Medium: tasks.filter((t) => t.priority === 'Medium' && t.status !== 'Completed').length,
      Low: tasks.filter((t) => t.priority === 'Low' && t.status !== 'Completed').length,
    };

    // 4. Upcoming Deadlines (next 7 days non-completed)
    const now = new Date();
    const upcomingDeadlines = tasks
      .filter((t) => t.deadline && new Date(t.deadline) >= now && t.status !== 'Completed')
      .slice(0, 5);

    // 5. Overdue Tasks
    const overdueTasks = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'Completed'
    );

    // Count subjects and projects
    const totalSubjects = await Subject.countDocuments({ user: userId, isArchived: false });
    const totalProjects = await Project.countDocuments({ user: userId, isArchived: false });

    res.json({
      success: true,
      data: {
        periods: periodStats,
        statusCounts,
        priorityCounts,
        upcomingDeadlines,
        overdueCount: overdueTasks.length,
        totalSubjects,
        totalProjects,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
