const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  updateProject,
  toggleArchiveProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .put(updateProject)
  .delete(deleteProject);

router.patch('/:id/archive', toggleArchiveProject);

module.exports = router;
