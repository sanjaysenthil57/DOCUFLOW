const mongoose = require('mongoose');

const expertReviewSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  documentVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentVersion',
    required: true
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  decision: {
    type: String,
    enum: ['approved', 'rejected', 'correction_required'],
    required: true
  },
  comments: {
    type: String,
    required: [true, 'Expert review comments are mandatory']
  },
  structuralEvaluation: {
    contentQuality: { type: Number, min: 1, max: 10, default: 8 },
    formattingCorrect: { type: Boolean, default: true },
    syllabusCoverage: { type: Boolean, default: true }
  },
  identifiedMistakes: [{
    type: String
  }],
  correctionInstructions: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'expert_reviews'
});

module.exports = mongoose.model('ExpertReview', expertReviewSchema);
