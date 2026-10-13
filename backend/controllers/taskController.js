const Task = require('../models/Task');
const path = require('path');
const fs = require('fs');
const { emitUserDataChange } = require('../utils/socketSync');

// @desc    Get tasks with filters (status, academicPeriod, priority, subject, project, isArchived, search)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const {
      status,
      academicPeriod,
      priority,
      subject,
      project,
      isArchived,
      search,
      taskType,
      sortBy,
      order,
    } = req.query;

    const filter = { user: req.user._id };

    if (isArchived === 'true') {
      filter.isArchived = true;
    } else {
      filter.isArchived = false;
    }

    if (status) filter.status = status;
    if (academicPeriod) filter.academicPeriod = academicPeriod;
    if (priority) filter.priority = priority;
    if (subject) filter.subject = subject;
    if (project) filter.project = project;
    if (taskType) filter.taskType = taskType;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions = { deadline: 1, createdAt: -1 };
    if (sortBy) {
      sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };
    }

    const tasks = await Task.find(filter)
      .populate('subject', 'code name color')
      .populate('project', 'title status')
      .sort(sortOptions);

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
      .populate('subject', 'code name color instructor room')
      .populate('project', 'title status deadline');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new task (supports Quick-Add and detailed creation)
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      project,
      taskType,
      academicPeriod,
      priority,
      status,
      deadline,
      estimatedMinutes,
      checklist,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide task title.' });
    }

    const cleanTitle = title.trim();
    const period = academicPeriod || 'Prelim';

    // Prevent cross-device duplication: Check if task already exists for this user
    let existingTask = await Task.findOne({
      user: req.user._id,
      title: { $regex: new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      academicPeriod: period,
      isArchived: false,
    });

    if (existingTask) {
      // Reconcile and update existing task instead of creating duplicate
      if (description !== undefined) existingTask.description = description;
      if (subject !== undefined) existingTask.subject = subject || null;
      if (project !== undefined) existingTask.project = project || null;
      if (taskType !== undefined) existingTask.taskType = taskType;
      if (priority !== undefined) existingTask.priority = priority;
      if (status !== undefined) existingTask.status = status;
      if (deadline !== undefined) existingTask.deadline = deadline;
      if (estimatedMinutes !== undefined) existingTask.estimatedMinutes = estimatedMinutes;
      if (checklist !== undefined && Array.isArray(checklist) && checklist.length > 0) {
        existingTask.checklist = checklist;
      }
      if (status === 'Completed' && !existingTask.completedAt) {
        existingTask.completedAt = new Date();
      }
      await existingTask.save();

      const populatedExisting = await Task.findById(existingTask._id)
        .populate('subject', 'code name color')
        .populate('project', 'title status');

      emitUserDataChange(req, 'tasks', 'update', populatedExisting);
      return res.status(200).json({ success: true, data: populatedExisting, deduplicated: true });
    }

    const task = await Task.create({
      user: req.user._id,
      title: cleanTitle,
      description: description || '',
      subject: subject || null,
      project: project || null,
      taskType: taskType || 'Assignment',
      academicPeriod: period,
      priority: priority || 'Medium',
      status: status || 'To Do',
      deadline: deadline || null,
      estimatedMinutes: estimatedMinutes || 60,
      checklist: checklist || [],
      completedAt: status === 'Completed' ? new Date() : null,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('subject', 'code name color')
      .populate('project', 'title status');

    emitUserDataChange(req, 'tasks', 'create', populatedTask);
    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Set completedAt timestamp if transitioned to Completed
    if (req.body.status && req.body.status === 'Completed' && task.status !== 'Completed') {
      req.body.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'Completed') {
      req.body.completedAt = null;
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('subject', 'code name color')
      .populate('project', 'title status');

    emitUserDataChange(req, 'tasks', 'update', task);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Quick update status (e.g. Kanban drag and drop)
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.status = status;
    task.completedAt = status === 'Completed' ? new Date() : null;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('subject', 'code name color')
      .populate('project', 'title status');

    emitUserDataChange(req, 'tasks', 'update', populatedTask);
    res.json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add or toggle checklist items
// @route   PATCH /api/tasks/:id/checklist
// @access  Private
exports.updateChecklist = async (req, res) => {
  try {
    const { checklist } = req.body;
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.checklist = checklist;
    await task.save();

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload attachment to task
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const newAttachment = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
    };

    task.attachments.push(newAttachment);
    await task.save();

    res.json({
      success: true,
      message: 'File uploaded successfully!',
      data: task.attachments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete attachment
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  Private
exports.deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found.' });
    }

    // Attempt to delete physical file from disk
    const filePath = path.join(__dirname, '../uploads', attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    task.attachments.pull(req.params.attachmentId);
    await task.save();

    res.json({ success: true, message: 'Attachment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle soft delete / archive task
// @route   PATCH /api/tasks/:id/archive
// @access  Private
exports.toggleArchiveTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.isArchived = !task.isArchived;
    await task.save();

    res.json({
      success: true,
      message: task.isArchived ? 'Task archived successfully!' : 'Task restored successfully!',
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Permanently delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Clean up physical attachments if any
    task.attachments.forEach((att) => {
      const filePath = path.join(__dirname, '../uploads', att.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error(e);
        }
      }
    });

    await task.deleteOne();

    emitUserDataChange(req, 'tasks', 'delete', { _id: req.params.id });
    res.json({ success: true, message: 'Task permanently deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
