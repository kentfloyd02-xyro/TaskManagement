const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  updateChecklist,
  uploadAttachment,
  deleteAttachment,
  toggleArchiveTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/checklist', updateChecklist);
router.patch('/:id/archive', toggleArchiveTask);

router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

module.exports = router;
