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

    // If Admin account has no data yet in MongoDB, automatically seed starter items into MongoDB for admin
    const isAdmin = req.user.role === 'admin' || (req.user.email && req.user.email.toLowerCase() === 'kentfloyd02@gmail.com');
    if (isAdmin) {
      if (subjects.length === 0) {
        const starterSubjects = [
          { code: 'CS301', name: 'Software Engineering & Design Patterns', color: '#3b82f6', instructor: 'Dr. Raymond Reyes', schedule: 'Mon/Wed 9:00 AM - 10:30 AM', room: 'Lab 402' },
          { code: 'IT305', name: 'Web & Mobile Systems', color: '#10b981', instructor: 'Prof. Maria Santos', schedule: 'Tue/Thu 1:00 PM - 2:30 PM', room: 'Room 205' },
          { code: 'MATH204', name: 'Discrete Mathematics & Probability', color: '#f59e0b', instructor: 'Engr. Daniel Cruz', schedule: 'Fri 8:00 AM - 11:00 AM', room: 'Lecture Hall B' },
        ];
        for (const s of starterSubjects) {
          await Subject.create({ user: userId, ...s });
        }
        subjects = await Subject.find({ user: userId, isArchived: false }).lean();
      }

      if (tasks.length === 0) {
        const starterTasks = [
          { title: 'Prelim Quiz 1: Object-Oriented Principles', description: 'Review SOLID principles and patterns.', academicPeriod: 'Prelim', status: 'Completed', priority: 'High', deadline: new Date(Date.now() - 7 * 86400000) },
          { title: 'Laboratory Activity 1: Responsive Layout with Flexbox & Grid', description: 'Submit repo link and live demo.', academicPeriod: 'Prelim', status: 'Completed', priority: 'Medium', deadline: new Date(Date.now() - 5 * 86400000) },
          { title: 'UML Class Diagram & ERD Modeling', description: 'Complete data modeling diagram.', academicPeriod: 'Midterm', status: 'In Progress', priority: 'Urgent', deadline: new Date(Date.now() + 2 * 86400000) },
          { title: 'REST API Integration & JWT Authentication Lab', description: 'Build Express middleware with auth.', academicPeriod: 'Midterm', status: 'To Do', priority: 'High', deadline: new Date(Date.now() + 4 * 86400000) },
          { title: 'Midterm Exam: Combinatorics & Permutations', description: 'Lecture Hall B at 8:00 AM.', academicPeriod: 'Midterm', status: 'Backlog', priority: 'Urgent', deadline: new Date(Date.now() + 7 * 86400000) },
        ];
        for (const t of starterTasks) {
          await Task.create({ user: userId, ...t });
        }
        tasks = await Task.find({ user: userId, isArchived: false })
          .populate('subject', 'code name color')
          .populate('project', 'title status')
          .lean();
      }

      if (schedules.length === 0) {
        const starterSchedules = [
          { subjectCode: 'CS301', subjectName: 'Software Engineering', days: ['Monday', 'Wednesday'], startTime: '09:00', endTime: '10:30', room: 'Lab 402', color: '#3b82f6' },
          { subjectCode: 'IT305', subjectName: 'Web & Mobile Systems', days: ['Tuesday', 'Thursday'], startTime: '13:00', endTime: '14:30', room: 'Room 205', color: '#10b981' },
          { subjectCode: 'MATH204', subjectName: 'Discrete Mathematics', days: ['Friday'], startTime: '08:00', endTime: '11:00', room: 'Lecture Hall B', color: '#f59e0b' },
        ];
        for (const sc of starterSchedules) {
          await ClassSchedule.create({ user: userId, ...sc });
        }
        schedules = await ClassSchedule.find({ user: userId }).lean();
      }
    }

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
