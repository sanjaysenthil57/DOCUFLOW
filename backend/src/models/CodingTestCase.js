const mongoose = require('mongoose');

const codingTestCaseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingQuestion',
    required: true
  },
  input: {
    type: String,
    default: ''
  },
  expectedOutput: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  explanation: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'coding_test_cases'
});

codingTestCaseSchema.index({ questionId: 1 });

module.exports = mongoose.model('CodingTestCase', codingTestCaseSchema);
