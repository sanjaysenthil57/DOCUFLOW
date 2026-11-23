const mongoose = require('mongoose');

const codingSubmissionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingQuestion',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  programmingLanguage: {
    type: String,
    required: true,
    lowercase: true
  },
  submittedCode: {
    type: String,
    required: true
  },
  customInput: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'Pending',
      'Running',
      'Accepted',
      'Wrong Answer',
      'Compile Error',
      'Runtime Error',
      'Time Limit Exceeded'
    ],
    default: 'Pending'
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  passedTestCases: {
    type: Number,
    default: 0
  },
  executionTimeMs: {
    type: Number,
    default: 0
  },
  memoryKb: {
    type: Number,
    default: 0
  },
  compilerOutput: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'coding_submissions'
});

codingSubmissionSchema.index({ studentId: 1, questionId: 1, status: 1 });

module.exports = mongoose.model('CodingSubmission', codingSubmissionSchema);
