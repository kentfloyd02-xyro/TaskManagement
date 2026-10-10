const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get all projects of user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const filter = { user: req.user._id };

    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const projects = await Project.find(filter)
      .populate('subject', 'code name color')
      .sort({ createdAt: -1 });

    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const projectObj = project.toObject();
        const tasks = await Task.find({ project: project._id, isArchived: false });
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === 'Completed').length;
        projectObj.taskStats = {
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
        return projectObj;
      })
    );

    res.json({ success: true, count: projectsWithProgress.length, data: projectsWithProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { title, description, subject, deadline, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide project title.' });
    }

    const project = await Project.create({
      user: req.user._id,
      title,
      description: description || '',
      subject: subject || null,
      deadline: deadline || null,
      status: status || 'Planning',
    });

    const populatedProject = await Project.findById(project._id).populate('subject', 'code name color');
    res.status(201).json({ success: true, data: populatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findOne({ _id: req.params.id, user: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('subject', 'code name color');

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle archive project
// @route   PATCH /api/projects/:id/archive
// @access  Private
exports.toggleArchiveProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    project.isArchived = !project.isArchived;
    await project.save();

    res.json({
      success: true,
      message: project.isArchived ? 'Project archived successfully!' : 'Project restored successfully!',
      data: project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await Task.updateMany({ project: project._id }, { $set: { project: null } });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
