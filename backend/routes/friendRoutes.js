const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

/**
 * @route   GET /api/friends
 * @desc    Get user's current friends list
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'friends',
      'name email course yearLevel avatar'
    );
    res.json({
      success: true,
      friends: user?.friends || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch friends' });
  }
});

/**
 * @route   GET /api/friends/requests
 * @desc    Get incoming and outgoing friend requests
 * @access  Private
 */
router.get('/requests', protect, async (req, res) => {
  try {
    const incoming = await FriendRequest.find({
      recipient: req.user._id,
      status: 'pending',
    }).populate('sender', 'name email course yearLevel avatar');

    const outgoing = await FriendRequest.find({
      sender: req.user._id,
      status: 'pending',
    }).populate('recipient', 'name email course yearLevel avatar');

    res.json({
      success: true,
      incoming,
      outgoing,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch friend requests' });
  }
});

/**
 * @route   GET /api/friends/search
 * @desc    Search students by name or email
 * @access  Private
 */
router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.json({ success: true, users: [] });
    }

    const regex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ name: regex }, { email: regex }],
    })
      .select('name email course yearLevel avatar')
      .limit(15);

    // Also get pending request status with these users
    const requests = await FriendRequest.find({
      $or: [
        { sender: req.user._id, recipient: { $in: users.map((u) => u._id) } },
        { recipient: req.user._id, sender: { $in: users.map((u) => u._id) } },
      ],
      status: 'pending',
    });

    const currentUser = await User.findById(req.user._id).select('friends');
    const friendIds = (currentUser.friends || []).map((id) => id.toString());

    const result = users.map((u) => {
      const uId = u._id.toString();
      const isFriend = friendIds.includes(uId);
      const reqFound = requests.find(
        (r) =>
          r.sender.toString() === uId || r.recipient.toString() === uId
      );

      let relationship = 'none';
      if (isFriend) relationship = 'friend';
      else if (reqFound) {
        relationship = reqFound.sender.toString() === req.user._id.toString() ? 'sent' : 'received';
      }

      return {
        ...u.toObject(),
        relationship,
        requestId: reqFound?._id,
      };
    });

    res.json({ success: true, users: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search error' });
  }
});

/**
 * @route   POST /api/friends/request
 * @desc    Send a friend request to a user
 * @access  Private
 */
router.post('/request', protect, async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID required' });
    }
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Hindi mo pwedeng i-add ang iyong sarili' });
    }

    // Check if already friends
    const user = await User.findById(req.user._id);
    if (user.friends && user.friends.includes(recipientId)) {
      return res.status(400).json({ success: false, message: 'Magkaibigan na kayo!' });
    }

    // Check existing request
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, message: 'May umiiral nang pending friend request' });
      }
      // If was rejected/accepted earlier, update status
      existing.sender = req.user._id;
      existing.recipient = recipientId;
      existing.status = 'pending';
      await existing.save();
      return res.json({ success: true, message: 'Friend request sent!', request: existing });
    }

    const newReq = await FriendRequest.create({
      sender: req.user._id,
      recipient: recipientId,
      status: 'pending',
    });

    res.status(201).json({ success: true, message: 'Friend request sent!', request: newReq });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sending friend request' });
  }
});

/**
 * @route   PUT /api/friends/request/:id/respond
 * @desc    Accept or reject a friend request
 * @access  Private
 */
router.put('/request/:id/respond', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const request = await FriendRequest.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found or handled' });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      await request.save();

      // Add each other to friends array
      await Promise.all([
        User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.recipient } }),
        User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.sender } }),
      ]);

      return res.json({ success: true, message: 'Friend request accepted!' });
    } else {
      request.status = 'rejected';
      await request.save();
      return res.json({ success: true, message: 'Friend request rejected' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error responding to friend request' });
  }
});

/**
 * @route   DELETE /api/friends/:friendId
 * @desc    Unfriend a user
 * @access  Private
 */
router.delete('/:friendId', protect, async (req, res) => {
  try {
    const { friendId } = req.params;
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: req.user._id } }),
      FriendRequest.deleteMany({
        $or: [
          { sender: req.user._id, recipient: friendId },
          { sender: friendId, recipient: req.user._id },
        ],
      }),
    ]);

    res.json({ success: true, message: 'Unfriended successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error removing friend' });
  }
});

module.exports = router;
