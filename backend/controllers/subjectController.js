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
