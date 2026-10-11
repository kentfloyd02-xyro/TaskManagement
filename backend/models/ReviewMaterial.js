const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  q: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'identification', 'enumeration'],
    default: 'multiple_choice',
  },
  // Choices for multiple choice
  a: [{
    type: String,
  }],
  // Correct choice index for multiple choice
  c: {
    type: Number,
    default: 0,
  },
  // Expected answer string for identification
  expectedAnswer: {
    type: String,
    default: '',
  },
  // Expected items for enumeration
  expectedItems: [{
    type: String,
  }],
  explanation: {
    type: String,
    default: '',
  },
});

const reviewMaterialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title or subject name'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['quiz', 'exam'],
      default: 'quiz',
      index: true,
    },
    questionTypePreference: {
      type: String,
      enum: ['multiple_choice', 'identification', 'enumeration', 'mixed'],
      default: 'multiple_choice',
    },
    hasTimer: {
      type: Boolean,
      default: false,
    },
    timerDurationSeconds: {
      type: Number,
      default: 0, // 0 means off-time (no timer)
    },
    questionCount: {
      type: Number,
      default: 10,
    },
    questions: [questionSchema],
    sourceFileName: {
      type: String,
      default: '',
    },
    lastScore: {
      type: Number,
      default: null,
    },
    lastTakenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ReviewMaterial', reviewMaterialSchema);
