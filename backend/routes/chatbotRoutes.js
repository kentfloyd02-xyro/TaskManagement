const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
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
 * @desc    Send a prompt to the AI chatbot (with token check & deduction)
 * @access  Private
 */
router.post('/message', protect, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // 1. Verify and increment token usage
    const usageCheck = await checkAndIncrementAiUsage(req.user._id);
    if (!usageCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: usageCheck.message,
        usage: usageCheck,
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
      // First 35 chars of prompt as initial title
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

    // 3. Generate response via Gemini
    const replyText = await generateChatbotReply({
      messages: conv.messages.slice(-8), // send last 8 messages for context
      userContext: {
        name: req.user.name,
        role: req.user.role,
        email: req.user.email,
      },
    });

    // Push assistant reply
    conv.messages.push({
      role: 'assistant',
      content: replyText,
    });

    await conv.save();

    res.json({
      success: true,
      data: {
        conversationId: conv._id,
        reply: replyText,
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
