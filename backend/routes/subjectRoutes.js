const express = require('express');
const router = express.Router();
const {
  getSubjects,
  createSubject,
  updateSubject,
  toggleArchiveSubject,
  deleteSubject,
  scanScheduleAndExtract,
  confirmBatchImport,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Memory storage for schedule uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

router.use(protect); // Protektado lahat ng routes sa baba

router.post('/scan-schedule', upload.single('file'), scanScheduleAndExtract);
router.post('/batch-import', confirmBatchImport);

router.route('/')
  .get(getSubjects)
  .post(createSubject);

router.route('/:id')
  .put(updateSubject)
  .delete(deleteSubject);

router.patch('/:id/archive', toggleArchiveSubject);

module.exports = router;
