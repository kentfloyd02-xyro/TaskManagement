const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    course: {
      type: String,
      default: 'Student',
      trim: true,
    },
    yearLevel: {
      type: String,
      default: 'College',
      trim: true,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetPasswordViaSmtp: {
      type: Boolean,
      default: false,
    },
    aiUsage: {
      count: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: String,
        default: () => new Date().toISOString().slice(0, 10),
      },
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Gamification: Streaks & Badges (No XP)
    streak: {
      currentStreak: {
        type: Number,
        default: 1,
      },
      lastActiveDate: {
        type: String,
        default: () => new Date().toISOString().slice(0, 10),
      },
      bestStreak: {
        type: Number,
        default: 1,
      },
    },
    badges: [
      {
        id: String,
        name: String,
        description: String,
        icon: String,
        unlockedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Web Push Notification Subscriptions for phone & desktop alerts
    pushSubscriptions: [
      {
        endpoint: String,
        keys: {
          p256dh: String,
          auth: String,
        },
        subscribedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password and enforce super admin role before saving
userSchema.pre('save', async function () {
  if (this.email && this.email.toLowerCase() === 'kentfloyd02@gmail.com') {
    this.role = 'admin';
  }
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
