const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

// Setup upload folder for study notes and files
const uploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `file_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

/**
 * @route   GET /api/chat/rooms
 * @desc    Get all chat rooms (DMs and GCs) for current user
 * @access  Private
 */
router.get('/rooms', protect, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      members: req.user._id,
    })
      .populate('members', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('pendingMembers', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
});

/**
 * @route   POST /api/chat/direct
 * @desc    Find or create a 1-on-1 direct message room with a friend
 * @access  Private
 */
router.post('/direct', protect, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ success: false, message: 'Friend ID required' });
    }

    // Check if 1-on-1 room already exists between these two users
    let room = await ChatRoom.findOne({
      isGroup: false,
      members: { $all: [req.user._id, friendId], $size: 2 },
    }).populate('members', 'name email avatar');

    if (!room) {
      room = await ChatRoom.create({
        isGroup: false,
        members: [req.user._id, friendId],
      });
      room = await ChatRoom.findById(room._id).populate('members', 'name email avatar');
    }

    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error opening direct chat' });
  }
});

/**
 * @route   POST /api/chat/group
 * @desc    Create a new Group Chat (GC)
 * @access  Private
 */
router.post('/group', protect, async (req, res) => {
  try {
    const { name, memberIds = [], subjectTag, requiresApproval = false } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Group chat name is required' });
    }

    // Ensure creator is in members
    const members = Array.from(new Set([req.user._id.toString(), ...memberIds]));

    const group = await ChatRoom.create({
      name: name.trim(),
      isGroup: true,
      creator: req.user._id,
      members,
      subjectTag: subjectTag || '',
      requiresApproval: !!requiresApproval,
    });

    const populated = await ChatRoom.findById(group._id)
      .populate('members', 'name email avatar')
      .populate('creator', 'name email avatar');

    res.status(201).json({ success: true, room: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating group chat' });
  }
});

/**
 * @route   GET /api/chat/rooms/:roomId/messages
 * @desc    Get messages for a room
 * @access  Private
 */
router.get('/rooms/:roomId/messages', protect, async (req, res) => {
  try {
    const room = await ChatRoom.findOne({
      _id: req.params.roomId,
      members: req.user._id,
    });

    if (!room) {
      return res.status(403).json({ success: false, message: 'Access denied to this chatroom' });
    }

    const messages = await Message.find({ chatRoom: room._id })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

/**
 * @route   POST /api/chat/rooms/:roomId/messages
 * @desc    Post message (text or file attachment)
 * @access  Private
 */
router.post(
  '/rooms/:roomId/messages',
  protect,
  upload.single('file'),
  async (req, res) => {
    try {
      const room = await ChatRoom.findOne({
        _id: req.params.roomId,
        members: req.user._id,
      });

      if (!room) {
        return res.status(403).json({ success: false, message: 'Not a member of this chatroom' });
      }

      const { text } = req.body;
      let fileUrl = '';
      let fileName = '';
      let fileType = '';

      if (req.file) {
        fileUrl = `/uploads/chat/${req.file.filename}`;
        fileName = req.file.originalname;
        fileType = req.file.mimetype;
      }

      if (!text && !fileUrl) {
        return res.status(400).json({ success: false, message: 'Message text or file required' });
      }

      const message = await Message.create({
        chatRoom: room._id,
        sender: req.user._id,
        text: text || '',
        fileUrl,
        fileName,
        fileType,
        readBy: [req.user._id],
      });

      // Update lastMessage on ChatRoom
      room.lastMessage = {
        text: text || `[Sent a file: ${fileName}]`,
        sender: req.user._id,
        createdAt: new Date(),
      };
      await room.save();

      const populated = await Message.findById(message._id).populate(
        'sender',
        'name email avatar'
      );

      // Emit live socket event
      const io = req.app.get('io');
      if (io) {
        io.to(room._id.toString()).emit('new_message', populated);
      }

      res.status(201).json({ success: true, message: populated });
    } catch (err) {
      console.error('[Send Message Error]', err);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  }
);

/**
 * @route   PUT /api/chat/rooms/:roomId/members
 * @desc    Creator/Admin add or remove member from group chat
 * @access  Private
 */
router.put('/rooms/:roomId/members', protect, async (req, res) => {
  try {
    const { action, targetUserId } = req.body; // action: 'add' or 'kick'
    const room = await ChatRoom.findById(req.params.roomId);

    if (!room || !room.isGroup) {
      return res.status(404).json({ success: false, message: 'Group chat not found' });
    }

    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Tanging ang Creator/Admin lang ang may pahintulot mag-manage ng members!',
      });
    }

    if (action === 'kick') {
      if (targetUserId === room.creator.toString()) {
        return res.status(400).json({ success: false, message: 'Bawal i-kick ang Creator' });
      }
      room.members = room.members.filter((id) => id.toString() !== targetUserId);
    } else if (action === 'add') {
      if (!room.members.map((id) => id.toString()).includes(targetUserId)) {
        room.members.push(targetUserId);
      }
    }

    await room.save();

    const populated = await ChatRoom.findById(room._id)
      .populate('members', 'name email avatar')
      .populate('creator', 'name email avatar');

    res.json({ success: true, room: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error managing members' });
  }
});

/**
 * @route   PUT /api/chat/rooms/:roomId/approval-toggle
 * @desc    Toggle whether joining requires creator approval
 * @access  Private
 */
router.put('/rooms/:roomId/approval-toggle', protect, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || !room.isGroup) {
      return res.status(404).json({ success: false, message: 'Group chat not found' });
    }

    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Admin/Creator only action' });
    }

    room.requiresApproval = !room.requiresApproval;
    await room.save();

    res.json({ success: true, requiresApproval: room.requiresApproval });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating setting' });
  }
});

module.exports = router;
