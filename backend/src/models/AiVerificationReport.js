const mongoose = require('mongoose');

const aiVerificationReportSchema = new mongoose.Schema({
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
  qualityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'failed'],
    default: 'success'
  },
  modelInfo: {
    modelName: { type: String, default: 'llama3:8b (Ollama Local AI)' },
    provider: { type: String, default: 'Local Ollama & PyMuPDF Engine' },
    executionTimeMs: { type: Number, default: 0 }
  },
  grammarIssues: [{
    issue: String,
    explanation: String,
    page: Number,
    suggestion: String
  }],
  spellingIssues: [{
    word: String,
    context: String,
    page: Number,
    suggestion: String
  }],
  structuralIssues: [{
    section: String,
    issue: String,
    page: Number
  }],
  formattingIssues: [{
    element: String,
    description: String,
    suggestion: String
  }],
  missingSections: [{
    type: String
  }],
  repeatedContentIndicators: [{
    snippet: String,
    count: Number,
    pages: [Number]
  }],
  suggestedCorrections: [{
    type: String
  }],
  summary: {
    type: String
  },
  rawExtractedLength: {
    type: Number,
    default: 0
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'ai_verification_reports'
});

module.exports = mongoose.model('AiVerificationReport', aiVerificationReportSchema);
