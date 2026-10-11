const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_student_planner_jwt_key_2026_dev',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, course, yearLevel, gender = 'male', avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Auto-promote Kentfloyd02@gmail.com to admin
    const role = email.toLowerCase() === 'kentfloyd02@gmail.com' ? 'admin' : 'student';

    const defaultAvatar = gender === 'female' ? 'female-1' : 'male-1';

    const user = await User.create({
      name,
      email,
      password,
      course: course || 'College Student',
      yearLevel: yearLevel || '1st Year',
      gender: gender || 'male',
      avatar: avatar || defaultAvatar,
      role,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        course: user.course,
        yearLevel: user.yearLevel,
        gender: user.gender,
        avatar: user.avatar,
        role: user.role,
        themePreference: user.themePreference,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : '';

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Guarantee kentfloyd02@gmail.com is always admin role
    if (cleanEmail === 'kentfloyd02@gmail.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        course: user.course,
        yearLevel: user.yearLevel,
        role: user.role || (cleanEmail === 'kentfloyd02@gmail.com' ? 'admin' : 'student'),
        themePreference: user.themePreference,
        gender: user.gender || 'male',
        avatar: user.avatar || (user.gender === 'female' ? 'female-1' : 'male-1'),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user && user.email && user.email.toLowerCase() === 'kentfloyd02@gmail.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        avatar: user.avatar || (user.gender === 'female' ? 'female-1' : 'male-1'),
        gender: user.gender || 'male',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile & preferences
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, course, yearLevel, themePreference, avatar, gender } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (course) user.course = course;
    if (yearLevel) user.yearLevel = yearLevel;
    if (themePreference) user.themePreference = themePreference;
    if (avatar) user.avatar = avatar;
    if (gender) user.gender = gender;

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      user.password = req.body.password;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        course: user.course,
        yearLevel: user.yearLevel,
        gender: user.gender || 'male',
        avatar: user.avatar || (user.gender === 'female' ? 'female-1' : 'male-1'),
        themePreference: user.themePreference,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password - Send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and store in user document
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Expires in 30 minutes
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    const clientOrigin =
      req.headers.origin ||
      (req.headers.referer ? new URL(req.headers.referer).origin : null) ||
      'https://task-management-plum-eta.vercel.app';

    const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;

    const message = `Hello ${user.name},\n\nYou requested a password reset for your Student Planner account. Please open the link below to set a new password:\n\n${resetUrl}\n\nIf you did not make this request, you can safely ignore this email.\nThis link will expire in 30 minutes.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #3b82f6; margin-top: 0;">Student Planner Password Reset</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="font-size: 13px; word-break: break-all; color: #3b82f6;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">This reset link will expire in 30 minutes.</p>
      </div>
    `;

    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'Student Planner - Password Reset Request',
        message,
        html,
      });

      // Email was sent via SMTP
      user.resetPasswordViaSmtp = true;
      await user.save({ validateBeforeSave: false });

      res.json({
        success: true,
        message: 'Password reset link sent to your email!',
        previewUrl: emailResult.previewUrl || null,
        resetViaSmtp: true,
      });
    } catch (err) {
      console.warn('[SMTP Dispatch Warning]:', err.message);
      // Fallback: Localhost direct reset link without SMTP
      user.resetPasswordViaSmtp = false;
      await user.save({ validateBeforeSave: false });

      return res.json({
        success: true,
        message: 'Localhost Quick Reset Link generated! Dahil sa localhost ito at hindi via SMTP, kakailanganin ang iyong previous password para makapag-reset.',
        resetToken: resetToken,
        resetUrl: `${resetUrl}?source=localhost`,
        resetViaSmtp: false,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Password Reset Info (Check if previous password is required)
// @route   GET /api/auth/reset-password-info/:token
// @access  Public
exports.getResetPasswordInfo = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link.',
      });
    }

    res.json({
      success: true,
      email: user.email,
      requiresPreviousPassword: !user.resetPasswordViaSmtp,
      resetViaSmtp: Boolean(user.resetPasswordViaSmtp),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    // If reset was NOT done via SMTP (i.e. localhost direct link), previous password is required!
    if (!user.resetPasswordViaSmtp) {
      const { previousPassword } = req.body;
      if (!previousPassword) {
        return res.status(400).json({
          success: false,
          message: 'Dahil sa localhost ginagawa ang pag-reset (hindi via SMTP email), kailangang ilagay ang iyong previous password para sa seguridad.',
        });
      }

      const isMatch = await user.matchPassword(previousPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Maling previous password! Pakisiguradong tama ang iyong dating password.',
        });
      }
    }

    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordViaSmtp = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        course: user.course,
        yearLevel: user.yearLevel,
        themePreference: user.themePreference,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
