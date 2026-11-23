const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: [true, 'Batch name is required (e.g. MCA 2024-2026)'],
    trim: true
  },
  academicRegulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicRegulation',
    required: [true, 'Academic Regulation reference is required']
  },
  startYear: {
    type: Number,
    required: true
  },
  endYear: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    default: 'Master of Computer Applications (MCA)',
    trim: true
  },
  currentSemester: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'batches'
});

module.exports = mongoose.model('Batch', batchSchema);
