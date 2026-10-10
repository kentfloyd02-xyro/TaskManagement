const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_student_planner_jwt_key_2026_dev'
      );
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found from token.' });
      }

      return next();
    } catch (error) {
      console.error('Auth verification error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized or token expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No authorization token provided. Please log in.' });
  }
};

const requireAdmin = (req, res, next) => {
  const isSuperEmail = req.user && req.user.email && req.user.email.toLowerCase() === 'kentfloyd02@gmail.com';
  if (req.user && (req.user.role === 'admin' || isSuperEmail)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Admin privileges required.',
  });
};

module.exports = { protect, requireAdmin };
