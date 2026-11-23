const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  documentType: {
    type: String,
    default: 'lecture_notes',
    trim: true
  },
  classification: {
    type: String,
    trim: true,
    default: 'Lecture Materials'
  },
  unitCoverage: {
    type: String,
    trim: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: false
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: false
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
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  currentVersionNumber: {
    type: Number,
    default: 1
  },
  currentVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentVersion'
  },
  status: {
    type: String,
    enum: [
      'Draft',
      'Uploaded',
      'AI Processing',
      'AI Verification Completed',
      'AI Issues Found',
      'Pending Expert Review',
      'Expert Reviewing',
      'Correction Required',
      'Re-uploaded',
      'Expert Approved',
      'Expert Rejected',
      'Pending HOD Approval',
      'HOD Approved',
      'HOD Rejected',
      'Published'
    ],
    default: 'Uploaded'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  assignedExpertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedByHODId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'documents'
});

documentSchema.index({ batchId: 1, semesterId: 1, subjectId: 1, isPublished: 1 });
documentSchema.index({ facultyId: 1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);
