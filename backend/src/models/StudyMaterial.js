const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
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
  aiSummary: {
    type: String
  },
  sectionWiseSummaries: [{
    sectionTitle: String,
    summary: String,
    keyPoints: [String]
  }],
  keyConcepts: [{
    type: String
  }],
  studyNotes: {
    type: String
  },
  tamilExplanation: {
    type: String
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'study_materials'
});

studyMaterialSchema.index({ batchId: 1, semesterId: 1, subjectId: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
