const Subject = require('../models/Subject');
const Task = require('../models/Task');

// @desc    Get all subjects of user
// @route   GET /api/subjects
// @access  Private
exports.getSubjects = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const filter = { user: req.user._id };

    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const subjects = await Subject.find(filter).sort({ code: 1 });
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private
exports.createSubject = async (req, res) => {
  try {
    const { code, name, color, instructor, schedule, room } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Please provide subject code and name.' });
    }

    const subject = await Subject.create({
      user: req.user._id,
      code,
      name,
      color: color || '#3b82f6',
      instructor: instructor || '',
      schedule: schedule || '',
      room: room || '',
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
exports.updateSubject = async (req, res) => {
  try {
    let subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle archive subject
// @route   PATCH /api/subjects/:id/archive
// @access  Private
exports.toggleArchiveSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    subject.isArchived = !subject.isArchived;
    await subject.save();

    res.json({
      success: true,
      message: subject.isArchived ? 'Subject archived successfully!' : 'Subject restored successfully!',
      data: subject,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete subject permanently
// @route   DELETE /api/subjects/:id
// @access  Private
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    // Unlink subject from tasks
    await Task.updateMany({ subject: subject._id }, { $set: { subject: null } });

    await subject.deleteOne();

    res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const ClassSchedule = require('../models/ClassSchedule');
const { extractTextFromFile } = require('../utils/fileParser');
const { parseScheduleWithGemini } = require('../services/geminiService');

// Preset colors palette for auto-assigned subject badges
const PALETTE = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#eab308'];

/**
 * @desc    Scan uploaded schedule file (image, PDF, docx) with Gemini AI
 * @route   POST /api/subjects/scan-schedule
 * @access  Private
 */
exports.scanScheduleAndExtract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Walang file o picture na na-upload. Maglagay ng image o PDF ng inyong schedule.',
      });
    }

    const mimeType = req.file.mimetype;
    let fileBuffer = req.file.buffer;
    let textContent = '';

    // If document (docx, pptx, txt), extract text first
    if (
      mimeType.includes('word') ||
      mimeType.includes('presentation') ||
      mimeType.includes('text') ||
      req.file.originalname.match(/\.(docx|pptx|txt)$/i)
    ) {
      textContent = await extractTextFromFile(req.file);
    }

    const aiResult = await parseScheduleWithGemini({
      mimeType,
      fileBuffer,
      textContent,
    });

    if (!aiResult.isSchedule) {
      return res.status(422).json({
        success: false,
        isSchedule: false,
        message:
          aiResult.reason ||
          'Hindi ito school schedule o timetable. Pakisiguradong Certificate of Registration (COR) o class schedule ang inyong nilapag.',
      });
    }

    if (!Array.isArray(aiResult.subjects) || aiResult.subjects.length === 0) {
      return res.status(422).json({
        success: false,
        isSchedule: false,
        message: 'Walang subjects o class schedule na nakita sa file.',
      });
    }

    res.json({
      success: true,
      isSchedule: true,
      subjects: aiResult.subjects,
      count: aiResult.subjects.length,
    });
  } catch (err) {
    console.error('[Scan Schedule Error]', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Nagka-problema sa pag-scan ng schedule.',
    });
  }
};

/**
 * @desc    Batch save extracted subjects to both Subject & ClassSchedule models
 * @route   POST /api/subjects/batch-import
 * @access  Private
 */
exports.confirmBatchImport = async (req, res) => {
  try {
    const { subjects = [], saveToTimetable = true } = req.body;
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Walang subjects na ipapasa para i-save.' });
    }

    const createdSubjects = [];
    const createdClassSchedules = [];

    for (let i = 0; i < subjects.length; i++) {
      const item = subjects[i];
      if (!item.code || !item.name) continue;

      const badgeColor = item.color || PALETTE[i % PALETTE.length];

      // 1. Create or update in Subject model
      let sub = await Subject.findOne({
        user: req.user._id,
        code: { $regex: new RegExp(`^${item.code.trim()}$`, 'i') },
      });

      if (!sub) {
        sub = await Subject.create({
          user: req.user._id,
          code: item.code.trim(),
          name: item.name.trim(),
          color: badgeColor,
          instructor: item.instructor?.trim() || '',
          schedule: item.scheduleText || (item.days?.length ? `${item.days.join('/')} ${item.startTime || ''} - ${item.endTime || ''}`.trim() : ''),
          room: item.room?.trim() || '',
        });
      }
      createdSubjects.push(sub);

      // 2. Also save to ClassSchedule for weekly timetable and 15-min push notifications
      if (saveToTimetable && item.days && item.days.length > 0 && item.startTime && item.endTime) {
        const classSched = await ClassSchedule.create({
          user: req.user._id,
          subjectCode: item.code.trim(),
          subjectName: item.name.trim(),
          instructor: item.instructor?.trim() || '',
          room: item.room?.trim() || '',
          days: item.days,
          startTime: item.startTime,
          endTime: item.endTime,
          color: badgeColor,
          reminderMinutesBefore: 15,
          isReminderActive: true,
        });
        createdClassSchedules.push(classSched);
      }
    }

    res.status(201).json({
      success: true,
      message: `Matagumpay na na-save ang ${createdSubjects.length} subjects!`,
      subjectsCount: createdSubjects.length,
      timetableCount: createdClassSchedules.length,
      subjects: createdSubjects,
    });
  } catch (err) {
    console.error('[Batch Import Error]', err);
    res.status(500).json({ success: false, message: err.message || 'Error saving subjects' });
  }
};
