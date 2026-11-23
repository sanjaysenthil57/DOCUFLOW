const mongoose = require('mongoose');

const chatbotConversationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  messages: [{
    sender: {
      type: String,
      enum: ['student', 'assistant'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    sourceType: {
      type: String,
      enum: ['approved_document', 'general_academic', 'coding_helper'],
      default: 'approved_document'
    },
    documentReferences: [{
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
      title: String,
      page: Number,
      snippet: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  collection: 'chatbot_conversations'
});

chatbotConversationSchema.index({ studentId: 1, subjectId: 1 });

module.exports = mongoose.model('ChatbotConversation', chatbotConversationSchema);
