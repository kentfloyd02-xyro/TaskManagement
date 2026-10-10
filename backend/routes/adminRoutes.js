const express = require('express');
const router = express.Router();
const {
  getAdminAnalytics,
  getAllUsers,
  getUserTasks,
  updateUser,
  deleteUser,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

// Public to all logged-in students
router.get('/announcements', protect, getAnnouncements);

// Protected strictly for Admin role
router.use(protect, requireAdmin);

router.get('/analytics', getAdminAnalytics);
router.get('/users', getAllUsers);
router.get('/users/:id/tasks', getUserTasks);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
