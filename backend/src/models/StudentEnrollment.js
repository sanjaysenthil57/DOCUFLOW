const mongoose = require('mongoose');

const studentEnrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  academicRegulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicRegulation',
    required: true
  },
  registerNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  currentSemester: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'graduated', 'completed', 'suspended'],
    default: 'active'
  },
  completedSemesters: [{
    type: Number
  }],
  semesterHistory: [{
    semesterNumber: Number,
    promotedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Completed' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String
  }],
  arrears: [{
    subjectCode: String,
    subjectName: String,
    semesterNumber: Number,
    cleared: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
  collection: 'student_enrollments'
});

module.exports = mongoose.model('StudentEnrollment', studentEnrollmentSchema);
