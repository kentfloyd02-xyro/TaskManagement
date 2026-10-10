const User = require('../models/User');
const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Project = require('../models/Project');
const Announcement = require('../models/Announcement');

// @desc    Get Global System Analytics for Admin
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const totalSubjects = await Subject.countDocuments();
    const totalProjects = await Project.countDocuments();

    // Recent registered users
    const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        totalSubjects,
        totalProjects,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Users with their task counts
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const userObj = u.toObject();
        const userTasks = await Task.countDocuments({ user: u._id });
        const userCompleted = await Task.countDocuments({ user: u._id, status: 'Completed' });
        const userSubjects = await Subject.countDocuments({ user: u._id });
        userObj.taskCount = userTasks;
        userObj.completedTaskCount = userCompleted;
        userObj.subjectCount = userSubjects;
        return userObj;
      })
    );

    res.json({ success: true, count: usersWithStats.length, data: usersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Inspect a student's full task list
// @route   GET /api/admin/users/:id/tasks
// @access  Private/Admin
exports.getUserTasks = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).select('name email course yearLevel role');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const tasks = await Task.find({ user: req.params.id })
      .populate('subject', 'code name color')
      .populate('project', 'title status')
      .sort({ createdAt: -1 });

    res.json({ success: true, user: targetUser, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user details or role
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, course, yearLevel, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Protect Super Admin account from demotion
    if (user.email.toLowerCase() === 'kentfloyd02@gmail.com' && role && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'The Super Administrator account (kentfloyd02@gmail.com) cannot be demoted!',
      });
    }

    if (name) user.name = name;
    if (course) user.course = course;
    if (yearLevel) user.yearLevel = yearLevel;
    if (role && ['student', 'admin'].includes(role)) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        course: user.course,
        yearLevel: user.yearLevel,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user and their records
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Protect Super Admin account from deletion
    if (user.email.toLowerCase() === 'kentfloyd02@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'The Super Administrator account (kentfloyd02@gmail.com) is permanently protected and cannot be deleted!',
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    await Task.deleteMany({ user: user._id });
    await Subject.deleteMany({ user: user._id });
    await Project.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ success: true, message: 'User and all associated data deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Announcement
// @route   POST /api/admin/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'info',
      authorName: req.user.name || 'Administrator',
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Active Announcements (Accessible to all authenticated users)
// @route   GET /api/admin/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
