const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectCode: {
      type: String,
      required: [true, 'Please provide subject code (e.g. CC106)'],
      trim: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Please provide subject name'],
      trim: true,
    },
    instructor: {
      type: String,
      default: '',
      trim: true,
    },
    room: {
      type: String,
      default: '',
      trim: true,
    },
    days: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
      },
    ],
    startTime: {
      type: String, // e.g. "08:00" in 24hr format
      required: true,
    },
    endTime: {
      type: String, // e.g. "10:30"
      required: true,
    },
    color: {
      type: String,
      default: '#2563eb',
    },
    reminderMinutesBefore: {
      type: Number,
      default: 15, // Default 15 minutes before class
    },
    isReminderActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

classScheduleSchema.index({ user: 1, days: 1 });

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);
