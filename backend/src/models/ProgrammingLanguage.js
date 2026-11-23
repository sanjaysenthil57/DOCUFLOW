const mongoose = require('mongoose');

const programmingLanguageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: 'Latest'
  },
  category: {
    type: String,
    default: 'General Purpose'
  },
  description: {
    type: String,
    default: ''
  },
  defaultBoilerplate: {
    type: String,
    default: ''
  },
  fileExtension: {
    type: String,
    required: true
  },
  executionCommand: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'programming_languages'
});

module.exports = mongoose.model('ProgrammingLanguage', programmingLanguageSchema);
