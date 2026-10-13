const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Subject = require('../models/Subject');
const ClassSchedule = require('../models/ClassSchedule');
const {
  checkAndIncrementAiUsage,
  getAiUsageStatus,
  generateChatbotReply,
} = require('../services/geminiService');

/**
 * @route   GET /api/chatbot/usage
 * @desc    Get current user daily AI token usage and limit
 * @access  Private
 */
router.get('/usage', protect, async (req, res) => {
  try {
    const status = await getAiUsageStatus(req.user._id);
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve AI usage' });
  }
});

/**
 * @route   GET /api/chatbot/conversations
 * @desc    Get all conversations for user
 * @access  Private
 */
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching chat history' });
  }
});

/**
 * @route   GET /api/chatbot/conversations/:id
 * @desc    Get specific conversation with messages
 * @access  Private
 */
router.get('/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving conversation' });
  }
});

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a prompt to the AI chatbot (with strict subject guardrails & 300 daily token limit)
 * @access  Private
 */
router.post('/message', protect, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // 1. Initial usage check before contacting LLM
    const initialUsage = await getAiUsageStatus(req.user._id);
    if (!initialUsage.unlimited && initialUsage.remaining <= 0) {
      return res.status(429).json({
        success: false,
        message: `Naabot mo na ang iyong daily limit na 300 AI tokens para sa araw na ito. Mag-rereset ito bukas ng 12:00 AM!`,
        usage: initialUsage,
      });
    }

    // 2. Fetch or create conversation
    let conv;
    if (conversationId) {
      conv = await Conversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
    }

    if (!conv) {
      const title = message.slice(0, 35) + (message.length > 35 ? '...' : '');
      conv = new Conversation({
        user: req.user._id,
        title,
        messages: [],
      });
    }

    // Push user message
    conv.messages.push({
      role: 'user',
      content: message,
    });

    // 3. Fetch user's enrolled subjects from MongoDB to establish guardrails
    const [subjects, schedules] = await Promise.all([
      Subject.find({ user: req.user._id, isArchived: { $ne: true } }),
      ClassSchedule.find({ user: req.user._id }),
    ]);

    const enrolledSubjectsMap = new Map();
    subjects.forEach((s) => {
      if (s.code) enrolledSubjectsMap.set(s.code.trim().toUpperCase(), { code: s.code.trim(), name: s.name.trim() });
    });
    schedules.forEach((sc) => {
      const code = (sc.subjectCode || '').trim().toUpperCase();
      if (code && !enrolledSubjectsMap.has(code)) {
        enrolledSubjectsMap.set(code, {
          code: sc.subjectCode.trim(),
          name: (sc.subjectName || sc.subjectCode).trim(),
        });
      }
    });
    const enrolledSubjects = Array.from(enrolledSubjectsMap.values());

    // 4. Guardrail: If student has zero registered subjects
    if (enrolledSubjects.length === 0) {
      const noSubjectsMsg = '⚠️ Walang Nakitang Subjects: Wala ka pang naka-save o naka-enroll na subject sa iyong account. Pumunta muna sa Subjects o Schedule tab upang magdagdag ng iyong mga kurso bago gamitin ang AI Study Assistant.';
      conv.messages.push({
        role: 'assistant',
        content: noSubjectsMsg,
      });
      await conv.save();

      return res.json({
        success: true,
        data: {
          conversationId: conv._id,
          reply: noSubjectsMsg,
          isOutOfTopic: true,
          messages: conv.messages,
          usage: initialUsage, // Free: No token deducted!
        },
      });
    }

    // 5. Generate reply with strict subject scope evaluation
    const aiResult = await generateChatbotReply({
      messages: conv.messages.slice(-8),
      userContext: {
        name: req.user.name,
        role: req.user.role,
        email: req.user.email,
      },
      enrolledSubjects,
    });

    // 6. If guardrail determined the query is out of topic:
    if (aiResult.isOutOfTopic) {
      const subjectCodes = enrolledSubjects.map((s) => s.code).join(', ');
      const outOfTopicMsg =
        aiResult.message ||
        `⚠️ Out of Topic: Ang AI Study Assistant ay eksklusibo lamang para sa iyong mga enrolled subjects (${subjectCodes}). Ang iyong tanong ay walang kaugnayan sa alinman sa iyong mga aralin. Mangyaring magtanong lamang tungkol sa iyong mga registered subjects.`;

      conv.messages.push({
        role: 'assistant',
        content: outOfTopicMsg,
      });
      await conv.save();

      // Free / Walang bawas: Tokens are NOT deducted when blocked
      return res.json({
        success: true,
        data: {
          conversationId: conv._id,
          reply: outOfTopicMsg,
          isOutOfTopic: true,
          messages: conv.messages,
          usage: initialUsage,
        },
      });
    }

    // 7. On-topic educational question: Deduct 1 token
    const usageCheck = await checkAndIncrementAiUsage(req.user._id);
    if (!usageCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: usageCheck.message,
        usage: usageCheck,
      });
    }

    conv.messages.push({
      role: 'assistant',
      content: aiResult.reply,
    });
    await conv.save();

    res.json({
      success: true,
      data: {
        conversationId: conv._id,
        reply: aiResult.reply,
        isOutOfTopic: false,
        messages: conv.messages,
        usage: usageCheck,
      },
    });
  } catch (err) {
    console.error('[Chatbot API Error]', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Chatbot encountered an error.',
    });
  }
});

/**
 * @route   DELETE /api/chatbot/conversations/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/conversations/:id', protect, async (req, res) => {
  try {
    await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting conversation' });
  }
});

module.exports = router;
