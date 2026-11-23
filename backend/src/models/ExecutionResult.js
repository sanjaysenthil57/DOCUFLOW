const mongoose = require('mongoose');

const executionResultSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingSubmission'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    required: true
  },
  sourceCode: {
    type: String,
    required: true
  },
  stdout: {
    type: String,
    default: ''
  },
  stderr: {
    type: String,
    default: ''
  },
  exitCode: {
    type: Number,
    default: 0
  },
  executionTimeMs: {
    type: Number,
    default: 0
  },
  memoryUsageKb: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  executedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'execution_results'
});

module.exports = mongoose.model('ExecutionResult', executionResultSchema);
