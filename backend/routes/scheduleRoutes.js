const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ClassSchedule = require('../models/ClassSchedule');
const User = require('../models/User');
const { sendNotificationToUser } = require('../services/pushService');

/**
 * @route   GET /api/schedule
 * @desc    Get user's weekly timetable
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const schedules = await ClassSchedule.find({ user: req.user._id }).sort({ startTime: 1 });
    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
});

/**
 * @route   POST /api/schedule
 * @desc    Add a class schedule
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      subjectCode,
      subjectName,
      instructor,
      room,
      days = [],
      startTime,
      endTime,
      color,
      reminderMinutesBefore = 15,
      isReminderActive = true,
    } = req.body;

    if (!subjectCode || !subjectName || !days.length || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Subject Code, Name, Days, Start Time, and End Time.',
      });
    }

    const schedule = await ClassSchedule.create({
      user: req.user._id,
      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim(),
      instructor: instructor?.trim() || '',
      room: room?.trim() || '',
      days,
      startTime,
      endTime,
      color: color || '#2563eb',
      reminderMinutesBefore: Number(reminderMinutesBefore) || 15,
      isReminderActive: !!isReminderActive,
    });

    res.status(201).json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Error creating schedule' });
  }
});

/**
 * @route   PUT /api/schedule/:id
 * @desc    Update a class schedule
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const schedule = await ClassSchedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating schedule' });
  }
});

/**
 * @route   DELETE /api/schedule/:id
 * @desc    Delete a class schedule
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const schedule = await ClassSchedule.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting schedule' });
  }
});

/**
 * @route   POST /api/schedule/subscribe-push
 * @desc    Save Web Push Subscription from user device
 * @access  Private
 */
router.post('/subscribe-push', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data' });
    }

    const user = await User.findById(req.user._id);
    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Check if endpoint already registered
    const exists = user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        subscribedAt: new Date(),
      });
      await user.save();
    }

    // Dispatch instant welcome test notification to device
    sendNotificationToUser(user._id, {
      title: '🔔 Class & Deadline Reminders Active!',
      body: 'Naka-set na ang iyong phone notifications! Tutunog ito 15 minutes bago magsimula ang iyong mga klase.',
      url: '/schedule',
    }).catch(() => {});

    res.json({ success: true, message: 'Device registered for push notifications!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Push subscription failed' });
  }
});

/**
 * @route   GET /api/schedule/vapid-key
 * @desc    Get VAPID public key for frontend registration
 * @access  Public
 */
router.get('/vapid-key', (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
  });
});

module.exports = router;
