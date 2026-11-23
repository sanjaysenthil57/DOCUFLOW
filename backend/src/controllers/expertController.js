const {
  Document,
  DocumentVersion,
  ExpertAssignment,
  ExpertReview,
  AiVerificationReport,
  Subject
} = require('../models');
const { sendNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/auth');

// Get documents awaiting or assigned for expert review
const getAssignedDocuments = async (req, res) => {
  try {
    // 1. Find all subjects assigned to this expert
    const assignments = await ExpertAssignment.find({
      expertId: req.user._id,
      status: 'active'
    });

    const subjectIds = assignments.map(a => a.subjectId);

    // 2. Fetch documents for these subjects or directly allocated to this reviewer
    const documents = await Document.find({
      $or: [
        { subjectId: { $in: subjectIds } },
        { assignedExpertId: req.user._id }
      ],
      facultyId: { $ne: req.user._id }
    })
      .populate('facultyId', 'name email department')
      .populate('subjectId')
      .populate('batchId')
      .populate('semesterId')
      .populate('academicRegulationId')
      .populate('currentVersionId')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit an expert review decision (Approve, Reject, or Request Correction)
const submitReview = async (req, res) => {
  try {
    const { documentId } = req.params;
    const {
      decision,
      comments,
      contentQuality,
      formattingCorrect,
      syllabusCoverage,
      identifiedMistakes,
      correctionInstructions,
      rejectionReason
    } = req.body;

    if (!decision || !['approved', 'rejected', 'correction_required'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be "approved", "rejected", or "correction_required"'
      });
    }

    if (!comments) {
      return res.status(400).json({ success: false, message: 'Review comments are mandatory.' });
    }

    const document = await Document.findById(documentId).populate('facultyId');
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    // Admin cannot review academic documents
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Administrators cannot perform expert reviews on academic documents.'
      });
    }

    // Prevent faculty self-review
    if (document.facultyId?._id?.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of interest: You cannot review your own submitted course document.'
      });
    }

    // Verify expert is assigned to this subject or directly allocated
    const isAssigned = await ExpertAssignment.findOne({
      expertId: req.user._id,
      subjectId: document.subjectId,
      status: 'active'
    });

    const isDirectlyAllocated = document.assignedExpertId && document.assignedExpertId.toString() === req.user._id.toString();

    if (!isAssigned && !isDirectlyAllocated) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You are not assigned as an expert reviewer for this subject. Only designated subject experts can submit reviews.'
      });
    }

    // Create ExpertReview record
    const expertReview = await ExpertReview.create({
      documentId: document._id,
      documentVersionId: document.currentVersionId,
      expertId: req.user._id,
      decision,
      comments,
      structuralEvaluation: {
        contentQuality: contentQuality || 8,
        formattingCorrect: formattingCorrect !== undefined ? formattingCorrect : true,
        syllabusCoverage: syllabusCoverage !== undefined ? syllabusCoverage : true
      },
      identifiedMistakes: identifiedMistakes || [],
      correctionInstructions: correctionInstructions || '',
      rejectionReason: rejectionReason || ''
    });

    // Update document version
    await DocumentVersion.findByIdAndUpdate(document.currentVersionId, {
      expertReviewId: expertReview._id
    });

    // Determine new document status
    let nextStatus = 'Expert Reviewing';
    if (decision === 'approved') {
      nextStatus = 'Pending HOD Approval';
    } else if (decision === 'rejected') {
      nextStatus = 'Expert Rejected';
    } else if (decision === 'correction_required') {
      nextStatus = 'Correction Required';
    }

    document.status = nextStatus;
    document.assignedExpertId = req.user._id;
    await document.save();

    await logAudit(req, 'EXPERT_REVIEW_SUBMIT', 'documents', document._id, {
      decision,
      version: document.currentVersionNumber,
      comments
    });

    // Notify Faculty
    await sendNotification({
      recipientId: document.facultyId._id,
      senderId: req.user._id,
      title: `Expert Review: ${decision.toUpperCase().replace('_', ' ')}`,
      message: `Expert ${req.user.name} reviewed "${document.title}". Decision: ${decision}. Comments: ${comments}`,
      type: decision === 'approved' ? 'expert_approved' : (decision === 'rejected' ? 'expert_rejected' : 'correction_required'),
      relatedDocumentId: document._id
    });

    res.status(200).json({
      success: true,
      message: `Expert review submitted successfully. Document moved to: ${nextStatus}.`,
      document,
      expertReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Review history for this expert
const getMyReviewHistory = async (req, res) => {
  try {
    const reviews = await ExpertReview.find({ expertId: req.user._id })
      .populate({
        path: 'documentId',
        populate: [
          { path: 'subjectId' },
          { path: 'batchId' },
          { path: 'facultyId', select: 'name email department' }
        ]
      })
      .populate('documentVersionId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAssignedDocuments,
  submitReview,
  getMyReviewHistory
};
