const mongoose = require('mongoose');

const documentVersionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  storedFilename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  fileExtension: {
    type: String
  },
  uploadNotes: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  aiVerificationReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiVerificationReport'
  },
  expertReviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertReview'
  },
  hodApprovalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HodApproval'
  },
  statusAtVersion: {
    type: String,
    default: 'Uploaded'
  }
}, {
  timestamps: true,
  collection: 'document_versions'
});

documentVersionSchema.index({ documentId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('DocumentVersion', documentVersionSchema);
