const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const ClassSchedule = require('../models/ClassSchedule');
const Subject = require('../models/Subject');
const ReviewMaterial = require('../models/ReviewMaterial');
const User = require('../models/User');

/**
 * @route   GET /api/sync/full-data
 * @desc    Comprehensive data sync endpoint to pull all user data from MongoDB to IndexedDB
 * @access  Private
 */
router.get('/full-data', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    let [tasks, schedules, subjects, reviewers] = await Promise.all([
      Task.find({ user: userId, isArchived: false })
        .populate('subject', 'code name color')
        .populate('project', 'title status')
        .lean(),
      ClassSchedule.find({ user: userId }).lean(),
      Subject.find({ user: userId, isArchived: false }).lean(),
      ReviewMaterial.find({ user: userId }).lean(),
    ]);

    // Return strictly what is in MongoDB for this user - no dummy or fabricated data
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        tasks: tasks.length,
        schedules: schedules.length,
        subjects: subjects.length,
        reviewers: reviewers.length,
      },
      data: {
        tasks,
        schedules,
        subjects,
        reviewers,
      },
    });
  } catch (error) {
    console.error('[Full Data Sync Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve full sync data from MongoDB.',
      error: error.message,
    });
  }
});

module.exports = router;
