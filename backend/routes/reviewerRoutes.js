const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const ReviewMaterial = require('../models/ReviewMaterial');
const { extractTextFromFile } = require('../utils/fileParser');
const {
  checkAndIncrementAiUsage,
  generateReviewQuestions,
} = require('../services/geminiService');
const { emitUserDataChange } = require('../utils/socketSync');

// Configure multer memory storage for fast file parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

/**
 * @route   GET /api/reviewer/materials
 * @desc    Get user saved quiz and exam review materials
 * @access  Private
 */
router.get('/materials', protect, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { user: req.user._id };
    if (category && (category === 'quiz' || category === 'exam')) {
      filter.category = category;
    }

    const materials = await ReviewMaterial.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (err) {
    console.error('[Get Review Materials Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch review materials' });
  }
});

/**
 * @route   GET /api/reviewer/materials/:id
 * @desc    Get specific review material with questions
 * @access  Private
 */
router.get('/materials/:id', protect, async (req, res) => {
  try {
    const material = await ReviewMaterial.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!material) {
      return res.status(404).json({ success: false, message: 'Review material not found' });
    }

    res.json({ success: true, data: material });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving material' });
  }
});

/**
 * @route   POST /api/reviewer/generate
 * @desc    Upload file & generate Quiz or Exam using Gemini AI
 * @access  Private
 */
router.post('/generate', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document file (.pdf, .docx, .pptx, or .txt)' });
    }

    const {
      subject,
      category = 'quiz', // 'quiz' or 'exam'
      questionCount = 10, // 10, 25, 50
      hasTimer = false,
      timerDurationSeconds = 0,
      questionTypePreference = 'multiple_choice', // multiple_choice, identification, enumeration, mixed
      title,
    } = req.body;

    if (!subject || subject.trim() === '') {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }

    // Check Token Limit for Regular User
    const usageCheck = await checkAndIncrementAiUsage(req.user._id);
    if (!usageCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: usageCheck.message,
        usage: usageCheck,
      });
    }

    // 1. Extract text from uploaded document
    const extractedText = await extractTextFromFile(req.file);
    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract enough readable text from the uploaded file. Please ensure the document is not empty or image-only.',
      });
    }

    // 2. Generate questions via Gemini 3.8 Flash
    const countNumber = parseInt(questionCount, 10) || 10;
    const generatedQuestions = await generateReviewQuestions({
      subject,
      category,
      questionCount: countNumber,
      questionType: questionTypePreference,
      textContext: extractedText,
    });

    const finalTitle = title || `${subject} ${category.toUpperCase()}`;

    // Prevent duplicates: Check if material with same title & category already exists for user
    let existingMaterial = await ReviewMaterial.findOne({
      user: req.user._id,
      title: finalTitle,
      category,
    });

    if (existingMaterial) {
      existingMaterial.questions = generatedQuestions;
      existingMaterial.questionCount = generatedQuestions.length;
      existingMaterial.sourceFileName = req.file.originalname;
      existingMaterial.hasTimer = hasTimer === 'true' || hasTimer === true;
      existingMaterial.timerDurationSeconds = parseInt(timerDurationSeconds, 10) || 0;
      existingMaterial.questionTypePreference = questionTypePreference;
      await existingMaterial.save();

      emitUserDataChange(req, 'reviewers', 'update', existingMaterial);
      return res.status(200).json({
        success: true,
        message: `Successfully refreshed existing ${category.toUpperCase()}!`,
        data: existingMaterial,
        usage: usageCheck,
        deduplicated: true,
      });
    }

    // 3. Save to MongoDB
    const newMaterial = await ReviewMaterial.create({
      user: req.user._id,
      title: finalTitle,
      subject,
      category,
      questionTypePreference,
      hasTimer: hasTimer === 'true' || hasTimer === true,
      timerDurationSeconds: parseInt(timerDurationSeconds, 10) || 0,
      questionCount: generatedQuestions.length,
      questions: generatedQuestions,
      sourceFileName: req.file.originalname,
    });

    emitUserDataChange(req, 'reviewers', 'create', newMaterial);
    res.status(201).json({
      success: true,
      message: `Successfully generated ${generatedQuestions.length} questions for ${category.toUpperCase()}!`,
      data: newMaterial,
      usage: usageCheck,
    });
  } catch (err) {
    console.error('[Reviewer Generate Error]', err);
    let errorMsg = err.message || 'Error processing file and generating questions.';
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch (_) {}

    if (errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE')) {
      errorMsg = 'Kasalukuyang mataas ang server traffic ni Google AI (Spike in demand). Paki-click lang muli ang Generate.';
    }

    res.status(err.status || 500).json({
      success: false,
      message: errorMsg,
    });
  }
});

/**
 * @route   PUT /api/reviewer/materials/:id/score
 * @desc    Record completion score for a quiz/exam
 * @access  Private
 */
router.put('/materials/:id/score', protect, async (req, res) => {
  try {
    const { score } = req.body;
    const material = await ReviewMaterial.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { lastScore: score, lastTakenAt: new Date() },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({ success: false, message: 'Review material not found' });
    }

    res.json({ success: true, data: material });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating score' });
  }
});

/**
 * @route   DELETE /api/reviewer/materials/:id
 * @desc    Delete a saved quiz or exam
 * @access  Private
 */
router.delete('/materials/:id', protect, async (req, res) => {
  try {
    const material = await ReviewMaterial.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!material) {
      return res.status(404).json({ success: false, message: 'Review material not found' });
    }

    emitUserDataChange(req, 'reviewers', 'delete', { _id: req.params.id });
    res.json({ success: true, message: 'Review material deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting material' });
  }
});

module.exports = router;
