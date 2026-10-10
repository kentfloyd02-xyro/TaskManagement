const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  isDone: {
    type: Boolean,
    default: false,
  },
});

const attachmentSchema = new mongoose.Schema({
  originalName: String,
  filename: String,
  path: String,
  size: Number,
  mimeType: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    taskType: {
      type: String,
      enum: [
        'Assignment',
        'Project',
        'Activity',
        'Exam/Quiz',
        'Research',
        'Presentation',
        'Group Work',
        'Reminder',
      ],
      default: 'Assignment',
    },
    academicPeriod: {
      type: String,
      enum: ['Prelim', 'Midterm', 'Finals', 'General'],
      default: 'Prelim',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'],
      default: 'To Do',
      index: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    estimatedMinutes: {
      type: Number,
      default: 60,
    },
    checklist: [checklistItemSchema],
    attachments: [attachmentSchema],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
