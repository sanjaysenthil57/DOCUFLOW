const { Notification } = require('../models');

const sendNotification = async ({
  recipientId,
  senderId = null,
  title,
  message,
  type = 'system_alert',
  relatedDocumentId = null
}) => {
  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      title,
      message,
      type,
      relatedDocumentId
    });
    return notification;
  } catch (error) {
    console.error('[Notification Service Error]', error.message);
    return null;
  }
};

const sendBulkNotifications = async (recipientIds, { senderId = null, title, message, type = 'system_alert', relatedDocumentId = null }) => {
  try {
    const notifications = recipientIds.map(recipientId => ({
      recipientId,
      senderId,
      title,
      message,
      type,
      relatedDocumentId
    }));
    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error('[Bulk Notification Error]', error.message);
    return [];
  }
};

module.exports = {
  sendNotification,
  sendBulkNotifications
};
