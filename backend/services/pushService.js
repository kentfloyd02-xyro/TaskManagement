const webpush = require('web-push');
const User = require('../models/User');

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@studentplanner.edu';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Send push notification to a user's registered devices (phones/computers)
 */
async function sendNotificationToUser(userId, { title, body, icon, url, data }) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return { success: false, message: 'No registered push subscriptions for this user.' };
    }

    const payload = JSON.stringify({
      title: title || 'Student Planner Alert',
      body: body || 'You have an upcoming event.',
      icon: icon || '/logo.png',
      badge: '/logo.png',
      url: url || '/dashboard',
      data: data || {},
    });

    const results = [];
    const deadSubscriptions = [];

    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        );
        results.push({ endpoint: sub.endpoint, success: true });
      } catch (err) {
        // 410 or 404 means the subscription expired or user revoked it
        if (err.statusCode === 410 || err.statusCode === 404) {
          deadSubscriptions.push(sub.endpoint);
        }
        results.push({ endpoint: sub.endpoint, success: false, error: err.message });
      }
    }

    // Clean up expired subscriptions
    if (deadSubscriptions.length > 0) {
      user.pushSubscriptions = user.pushSubscriptions.filter(
        (s) => !deadSubscriptions.includes(s.endpoint)
      );
      await user.save();
    }

    return { success: true, results };
  } catch (err) {
    console.error('Push notification error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendNotificationToUser,
};
