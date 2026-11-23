const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  yearName: {
    type: String,
    required: [true, 'Academic Year name is required (e.g. 2025-2026)'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Academic Year code is required'],
    unique: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Every academic year must have an assigned HOD']
  }
}, {
  timestamps: true,
  collection: 'academic_years'
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);
