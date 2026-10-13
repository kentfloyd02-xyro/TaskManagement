const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  getResetPasswordInfo,
  getOfflineAccounts,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/offline-accounts', getOfflineAccounts);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password-info/:token', getResetPasswordInfo);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
