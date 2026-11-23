const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semesterName: {
    type: String,
    required: true,
    trim: true
  },
  academicRegulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicRegulation',
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'semesters'
});

semesterSchema.index({ semesterNumber: 1, academicRegulationId: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);
