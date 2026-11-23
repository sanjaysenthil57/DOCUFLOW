const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: [true, 'Subject code is required'],
    trim: true,
    uppercase: true
  },
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  academicRegulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicRegulation',
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  credits: {
    type: Number,
    default: 3
  },
  subjectType: {
    type: String,
    enum: ['Theory', 'Integrated Theory & Lab', 'Practical / Laboratory', 'Professional Elective', 'Mini Project', 'Main Project & Viva', 'Internship'],
    default: 'Theory'
  },
  description: {
    type: String,
    trim: true
  },
  syllabusSummary: {
    type: String,
    trim: true
  },
  syllabusUnits: [{
    unitNumber: Number,
    unitTitle: String,
    topics: [String]
  }],
  hasProgramming: {
    type: Boolean,
    default: false
  },
  primaryLanguage: {
    type: String,
    default: 'none',
    trim: true
  },
  programmingLanguages: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: {
    type: String,
    trim: true,
    default: 'Master of Computer Applications (MCA)'
  }
}, {
  timestamps: true,
  collection: 'subjects'
});

subjectSchema.index({ subjectCode: 1, academicRegulationId: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
