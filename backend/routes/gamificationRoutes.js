const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const BADGES_CATALOG = [
  {
    id: 'streak_3',
    name: 'Consistency Starter',
    description: '3 Days Active Study Streak',
    icon: '🔥',
  },
  {
    id: 'streak_7',
    name: 'Unstoppable Scholar',
    description: '7 Days Active Study Streak',
    icon: '⚡',
  },
  {
    id: 'task_10',
    name: 'Task Master',
    description: 'Completed 10 tasks on the Kanban board',
    icon: '🎯',
  },
  {
    id: 'group_creator',
    name: 'Study Leader',
    description: 'Created a collaborative study group chat',
    icon: '👥',
  },
  {
    id: 'exam_ace',
    name: 'Exam Ace',
    description: 'Scored high accuracy on the Exam Reviewer',
    icon: '🏆',
  },
];

/**
 * @route   GET /api/gamification/status
 * @desc    Get user's current streak and unlocked badges
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('streak badges name');

    // Check & calculate streak
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastActive = user.streak?.lastActiveDate || todayStr;

    let currentStreak = user.streak?.currentStreak || 1;
    let bestStreak = user.streak?.bestStreak || 1;

    // Check difference in days
    const msInDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((new Date(todayStr) - new Date(lastActive)) / msInDay);

    if (diffDays === 1) {
      // Consecutive day login: increment streak!
      currentStreak += 1;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      user.streak = { currentStreak, lastActiveDate: todayStr, bestStreak };
      await user.save();
    } else if (diffDays > 1) {
      // Broken streak: reset to 1
      currentStreak = 1;
      user.streak = { currentStreak, lastActiveDate: todayStr, bestStreak };
      await user.save();
    }

    // Award streak badges if reached
    let awardedBadges = user.badges || [];
    if (currentStreak >= 3 && !awardedBadges.some((b) => b.id === 'streak_3')) {
      awardedBadges.push({
        id: 'streak_3',
        name: 'Consistency Starter',
        description: '3 Days Active Study Streak',
        icon: '🔥',
      });
    }
    if (currentStreak >= 7 && !awardedBadges.some((b) => b.id === 'streak_7')) {
      awardedBadges.push({
        id: 'streak_7',
        name: 'Unstoppable Scholar',
        description: '7 Days Active Study Streak',
        icon: '⚡',
      });
    }

    user.badges = awardedBadges;
    await user.save();

    res.json({
      success: true,
      streak: user.streak,
      badges: user.badges,
      catalog: BADGES_CATALOG,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch gamification status' });
  }
});

/**
 * @route   GET /api/gamification/leaderboard
 * @desc    Get Streak Leaderboard among friends and classmates
 * @access  Private
 */
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const friendIds = currentUser.friends || [];

    // Query friends + current user
    const users = await User.find({
      _id: { $in: [...friendIds, req.user._id] },
    })
      .select('name email avatar streak badges')
      .sort({ 'streak.currentStreak': -1 })
      .limit(20);

    const leaderboard = users.map((u, idx) => ({
      rank: idx + 1,
      _id: u._id,
      name: u.name,
      avatar: u.avatar,
      streak: u.streak?.currentStreak || 1,
      bestStreak: u.streak?.bestStreak || 1,
      badgeCount: u.badges?.length || 0,
      isMe: u._id.toString() === req.user._id.toString(),
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load leaderboard' });
  }
});

/**
 * @route   POST /api/gamification/award-badge
 * @desc    Award badge dynamically (e.g. upon completing tasks or exam)
 * @access  Private
 */
router.post('/award-badge', protect, async (req, res) => {
  try {
    const { badgeId } = req.body;
    const badgeDef = BADGES_CATALOG.find((b) => b.id === badgeId);

    if (!badgeDef) {
      return res.status(404).json({ success: false, message: 'Badge definition not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user.badges.some((b) => b.id === badgeId)) {
      user.badges.push({
        id: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        unlockedAt: new Date(),
      });
      await user.save();
    }

    res.json({ success: true, badges: user.badges });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error awarding badge' });
  }
});

module.exports = router;
