const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required (e.g. IT101)'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6', // Default blue badge
    },
    instructor: {
      type: String,
      default: '',
      trim: true,
    },
    schedule: {
      type: String,
      default: '', // e.g. "MWF 9:00 AM - 10:30 AM"
    },
    room: {
      type: String,
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', subjectSchema);
