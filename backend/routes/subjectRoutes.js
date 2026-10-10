const express = require('express');
const router = express.Router();
const {
  getSubjects,
  createSubject,
  updateSubject,
  toggleArchiveSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');

router.use(protect); // Protektado lahat ng routes sa baba

router.route('/')
  .get(getSubjects)
  .post(createSubject);

router.route('/:id')
  .put(updateSubject)
  .delete(deleteSubject);

router.patch('/:id/archive', toggleArchiveSubject);

module.exports = router;
