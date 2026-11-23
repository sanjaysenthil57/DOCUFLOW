const mongoose = require('mongoose');

const codingQuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  syntax: {
    type: String
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  programmingLanguage: {
    type: String,
    required: true,
    lowercase: true
  },
  exampleProgram: {
    type: String
  },
  sampleInput: {
    type: String,
    default: ''
  },
  sampleOutput: {
    type: String,
    default: ''
  },
  hints: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'coding_questions'
});

codingQuestionSchema.index({ subjectId: 1, difficulty: 1 });

module.exports = mongoose.model('CodingQuestion', codingQuestionSchema);
