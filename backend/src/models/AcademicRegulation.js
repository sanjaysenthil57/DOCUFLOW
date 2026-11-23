const mongoose = require('mongoose');

const academicRegulationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Regulation name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Regulation code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    trim: true
  },
  studyLevel: {
    type: String,
    trim: true,
    default: 'PG / MCA (Semesters 1-4)'
  },
  startYear: {
    type: Number,
    required: true
  },
  endYear: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'academic_regulations'
});

module.exports = mongoose.model('AcademicRegulation', academicRegulationSchema);
