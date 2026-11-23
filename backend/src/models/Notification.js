const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'document_uploaded',
      'ai_verification_completed',
      'ai_issues_found',
      'expert_review_assigned',
      'expert_approved',
      'expert_rejected',
      'correction_required',
      're_uploaded',
      'hod_approved',
      'hod_rejected',
      'document_published',
      'coding_assignment',
      'system_alert'
    ],
    default: 'system_alert'
  },
  relatedDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

notificationSchema.index({ recipientId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
