const mongoose = require('mongoose');

const hodApprovalSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  documentVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentVersion',
    required: true
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  decision: {
    type: String,
    enum: ['approved', 'rejected', 'correction_required'],
    required: true
  },
  comments: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: false
  },
  publishedForStudents: {
    type: Boolean,
    default: false
  },
  approvedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'hod_approvals'
});

module.exports = mongoose.model('HodApproval', hodApprovalSchema);
