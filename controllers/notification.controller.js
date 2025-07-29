import Notification from '../models/notification.model.js';

// Create a new notification
export const createNotification = async (userId, message, type) => {
  try {
    const notification = await Notification.create({
      userId,
      message,
      type,
    });
    console.log('Notification created:', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Could not create notification.');
  }
};

// Get notifications for the authenticated user
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or not authorized.' });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
