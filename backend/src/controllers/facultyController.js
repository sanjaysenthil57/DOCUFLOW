const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const {
  Document,
  DocumentVersion,
  FacultyAssignment,
  Subject,
  AcademicRegulation,
  Semester,
  Batch,
  AcademicYear,
  ProgrammingLanguage,
  AiVerificationReport,
  ExpertReview,
  HodApproval,
  Notification
} = require('../models');
const { triggerAiVerification } = require('../services/aiClientService');
const { logAudit } = require('../middleware/auth');

// 1. Get Curriculum Metadata (Regulations, Semesters, Languages, Batches) for Dropdowns
const getFacultyCurriculumMetadata = async (req, res) => {
  try {
    const [regulations, semesters, languages, batches] = await Promise.all([
      AcademicRegulation.find().sort({ startYear: -1 }),
      Semester.find().sort({ semesterNumber: 1 }),
      ProgrammingLanguage.find({ isActive: true }).sort({ name: 1 }),
      Batch.find().sort({ startYear: -1 })
    ]);

    res.status(200).json({
      success: true,
      regulations,
      semesters,
      languages,
      batches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Teaching Subjects (Assigned or Created by this Faculty)
const getMySubjects = async (req, res) => {
  try {
    // Find subjects created by faculty
    const createdSubjects = await Subject.find({ createdBy: req.user._id })
      .populate('academicRegulationId')
      .populate('semesterId');

    // Find subjects assigned via FacultyAssignment
    const assignments = await FacultyAssignment.find({
      facultyId: req.user._id,
      status: 'active'
    })
      .populate({
        path: 'subjectId',
        populate: [{ path: 'academicRegulationId' }, { path: 'semesterId' }]
      })
      .populate('batchId')
      .populate('academicYearId');

    const assignedMap = new Map();
    assignments.forEach(a => {
      if (a.subjectId && a.subjectId._id) {
        assignedMap.set(String(a.subjectId._id), a);
      }
    });

    // Merge unique subjects
    const subjectMap = new Map();
    createdSubjects.forEach(s => {
      subjectMap.set(String(s._id), {
        ...s.toObject(),
        isCreator: true,
        assignment: assignedMap.get(String(s._id)) || null
      });
    });

    assignments.forEach(a => {
      if (a.subjectId && a.subjectId._id) {
        const idStr = String(a.subjectId._id);
        if (!subjectMap.has(idStr)) {
          subjectMap.set(idStr, {
            ...a.subjectId.toObject(),
            isCreator: String(a.subjectId.createdBy) === String(req.user._id),
            assignment: a
          });
        }
      }
    });

    // Only return subjects actively assigned to this faculty (or created by this faculty)
    let allSubjects = Array.from(subjectMap.values());

    // Attach uploaded document count for each subject
    const subjectsWithDocCount = await Promise.all(
      allSubjects.map(async sub => {
        const docCount = await Document.countDocuments({
          subjectId: sub._id,
          facultyId: req.user._id
        });
        return {
          ...sub,
          documentCount: docCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: subjectsWithDocCount.length,
      subjects: subjectsWithDocCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Backwards-compatible assigned subjects
const getMyAssignedSubjects = async (req, res) => {
  try {
    const assignments = await FacultyAssignment.find({
      facultyId: req.user._id,
      status: 'active'
    })
      .populate('subjectId')
      .populate('batchId')
      .populate('academicYearId');

    res.status(200).json({
      success: true,
      assignments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Faculty Self-Service: Create Subject
const createSubject = async (req, res) => {
  try {
    const {
      subjectCode,
      subjectName,
      academicRegulationId,
      semesterId,
      credits,
      subjectType,
      description,
      syllabusSummary,
      hasProgramming,
      primaryLanguage,
      programmingLanguages,
      syllabusUnits
    } = req.body;

    if (!subjectCode || !subjectCode.trim()) {
      return res.status(400).json({ success: false, message: 'Subject code is required.' });
    }
    if (!subjectName || !subjectName.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }
    if (!academicRegulationId) {
      return res.status(400).json({ success: false, message: 'Academic regulation is required.' });
    }
    if (!semesterId) {
      return res.status(400).json({ success: false, message: 'Semester is required.' });
    }

    const formattedCode = subjectCode.trim().toUpperCase();

    // Verify regulation exists
    const regulation = await AcademicRegulation.findById(academicRegulationId);
    if (!regulation) {
      return res.status(400).json({ success: false, message: 'Selected Academic Regulation not found in MongoDB.' });
    }

    // Verify semester exists and belongs to regulation
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(400).json({ success: false, message: 'Selected Semester not found in MongoDB.' });
    }

    if (String(semester.academicRegulationId) !== String(academicRegulationId)) {
      return res.status(400).json({
        success: false,
        message: 'The selected semester does not belong to the selected academic regulation.'
      });
    }

    // Check duplicate subject code under regulation
    const existing = await Subject.findOne({
      academicRegulationId,
      subjectCode: formattedCode
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Subject code '${formattedCode}' already exists under academic regulation '${regulation.code}'.`
      });
    }

    // Create Subject
    const subject = await Subject.create({
      subjectCode: formattedCode,
      subjectName: subjectName.trim(),
      academicRegulationId,
      semesterId: semester._id,
      semesterNumber: semester.semesterNumber,
      credits: Number(credits) || 3,
      subjectType: subjectType || 'Theory',
      description: description ? description.trim() : '',
      syllabusSummary: syllabusSummary ? syllabusSummary.trim() : '',
      hasProgramming: hasProgramming !== undefined ? !!hasProgramming : false,
      primaryLanguage: primaryLanguage || 'python',
      programmingLanguages: Array.isArray(programmingLanguages) ? programmingLanguages : [],
      syllabusUnits: Array.isArray(syllabusUnits) ? syllabusUnits : [],
      createdBy: req.user._id,
      department: req.user.department || 'Master of Computer Applications (MCA)'
    });

    // Auto-link FacultyAssignment for teaching
    try {
      let batch = await Batch.findOne({ academicRegulationId });
      if (!batch) batch = await Batch.findOne();

      let academicYear = await AcademicYear.findOne({ isCurrent: true });
      if (!academicYear) academicYear = await AcademicYear.findOne();

      if (batch) {
        await FacultyAssignment.create({
          facultyId: req.user._id,
          subjectId: subject._id,
          batchId: batch._id,
          academicYearId: academicYear ? academicYear._id : (batch.academicRegulationId || academicRegulationId),
          assignedBy: req.user._id,
          status: 'active'
        });
      }
    } catch (assignErr) {
      console.warn('[Auto-link Assignment Warning]', assignErr.message);
    }

    await logAudit(req, 'FACULTY_CREATE_SUBJECT', 'subjects', subject._id, {
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      facultyId: req.user._id,
      regulationCode: regulation.code
    });

    const populated = await Subject.findById(subject._id)
      .populate('academicRegulationId')
      .populate('semesterId');

    res.status(201).json({
      success: true,
      message: `Subject "${subject.subjectCode} - ${subject.subjectName}" created and added to your teaching curriculum.`,
      subject: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Faculty Self-Service: Update Subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subjectCode,
      subjectName,
      credits,
      subjectType,
      description,
      syllabusSummary,
      hasProgramming,
      primaryLanguage,
      programmingLanguages,
      syllabusUnits,
      semesterId
    } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    // Access control: only creator, assigned faculty, or HOD/admin can edit
    const isCreator = subject.createdBy && String(subject.createdBy) === String(req.user._id);
    const isAssigned = await FacultyAssignment.exists({ facultyId: req.user._id, subjectId: id, status: 'active' });
    const isHod = req.user.role === 'hod' || req.user.role === 'admin';

    if (!isCreator && !isAssigned && !isHod) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit subjects you created or are assigned to teach.'
      });
    }

    if (subjectCode && subjectCode.trim().toUpperCase() !== subject.subjectCode) {
      const formattedCode = subjectCode.trim().toUpperCase();
      const duplicate = await Subject.findOne({
        academicRegulationId: subject.academicRegulationId,
        subjectCode: formattedCode,
        _id: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Subject code '${formattedCode}' already exists for this regulation.`
        });
      }
      subject.subjectCode = formattedCode;
    }

    if (subjectName) subject.subjectName = subjectName.trim();
    if (credits !== undefined) subject.credits = Number(credits);
    if (subjectType) subject.subjectType = subjectType;
    if (description !== undefined) subject.description = description.trim();
    if (syllabusSummary !== undefined) subject.syllabusSummary = syllabusSummary.trim();
    if (hasProgramming !== undefined) subject.hasProgramming = !!hasProgramming;
    if (primaryLanguage) subject.primaryLanguage = primaryLanguage;
    if (programmingLanguages) subject.programmingLanguages = programmingLanguages;
    if (syllabusUnits) subject.syllabusUnits = syllabusUnits;

    if (semesterId && String(semesterId) !== String(subject.semesterId)) {
      const sem = await Semester.findById(semesterId);
      if (sem) {
        subject.semesterId = sem._id;
        subject.semesterNumber = sem.semesterNumber;
      }
    }

    await subject.save();

    await logAudit(req, 'FACULTY_UPDATE_SUBJECT', 'subjects', subject._id, {
      subjectCode: subject.subjectCode,
      updatedBy: req.user._id
    });

    const populated = await Subject.findById(subject._id)
      .populate('academicRegulationId')
      .populate('semesterId');

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully.',
      subject: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Faculty Self-Service: Delete Subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    // Access control
    const isCreator = subject.createdBy && String(subject.createdBy) === String(req.user._id);
    const isHod = req.user.role === 'hod' || req.user.role === 'admin';
    if (!isCreator && !isHod) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete subjects you created.'
      });
    }

    // Prevent deletion if documents are linked
    const docCount = await Document.countDocuments({ subjectId: id });
    if (docCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject "${subject.subjectCode}". It has ${docCount} linked academic documents. Delete or reassign the materials first.`
      });
    }

    await FacultyAssignment.deleteMany({ subjectId: id });
    await Subject.findByIdAndDelete(id);

    await logAudit(req, 'FACULTY_DELETE_SUBJECT', 'subjects', id, {
      subjectCode: subject.subjectCode,
      deletedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: `Subject "${subject.subjectCode}" deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Upload a New Academic Document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file (.pdf, .docx, .doc, or .txt)' });
    }

    const {
      title,
      description,
      unitCoverage,
      classification,
      documentType,
      academicRegulationId,
      semesterId,
      subjectId,
      batchId,
      academicYearId
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Document Title is required.' });
    }
    if (!academicRegulationId) {
      return res.status(400).json({ success: false, message: 'Academic Regulation selection is required.' });
    }
    if (!semesterId) {
      return res.status(400).json({ success: false, message: 'Semester selection is required.' });
    }
    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'Subject selection is required.' });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Selected Subject record was not found in MongoDB.' });
    }

    // Role Responsibility: Admin and HOD cannot upload academic documents as Faculty
    if (req.user.role === 'admin' || req.user.role === 'hod') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Administrators and Heads of Department cannot upload academic course documents as Faculty.'
      });
    }

    // Strict Subject Scoping: Faculty can only upload for assigned subjects (or if creator)
    const activeAssignment = await FacultyAssignment.findOne({
      facultyId: req.user._id,
      subjectId,
      status: 'active'
    });

    if (!activeAssignment && String(subject.createdBy) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: You are not assigned to teach or manage documents for "${subject.subjectName}" (${subject.subjectCode}). Documents can only be uploaded for assigned subjects.`
      });
    }

    // Auto-resolve batchId if omitted
    let resolvedBatchId = batchId;
    if (!resolvedBatchId) {
      const batchDoc = await Batch.findOne({ academicRegulationId }) || await Batch.findOne();
      if (batchDoc) resolvedBatchId = batchDoc._id;
    }

    // Auto-resolve academicYearId if omitted
    let resolvedAcademicYearId = academicYearId;
    if (!resolvedAcademicYearId) {
      const yearDoc = await AcademicYear.findOne({ isCurrent: true }) || await AcademicYear.findOne();
      if (yearDoc) resolvedAcademicYearId = yearDoc._id;
    }

    const finalClassification = classification || documentType || 'Lecture Materials';

    // 1. Create Document record
    const document = await Document.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      unitCoverage: unitCoverage ? unitCoverage.trim() : '',
      classification: finalClassification,
      documentType: documentType || finalClassification.toLowerCase().replace(/\s+/g, '_'),
      facultyId: req.user._id,
      academicRegulationId,
      semesterId,
      subjectId,
      batchId: resolvedBatchId,
      academicYearId: resolvedAcademicYearId,
      currentVersionNumber: 1,
      status: 'Uploaded'
    });

    // 2. Create DocumentVersion record (v1.0)
    const docVersion = await DocumentVersion.create({
      documentId: document._id,
      versionNumber: 1,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension: path.extname(req.file.originalname).toLowerCase(),
      uploadNotes: 'Initial document upload',
      uploadedBy: req.user._id,
      statusAtVersion: 'Uploaded'
    });

    // Link current version to Document
    document.currentVersionId = docVersion._id;
    await document.save();

    await logAudit(req, 'DOCUMENT_UPLOAD', 'documents', document._id, {
      title: document.title,
      subjectCode: subject.subjectCode,
      version: 1,
      filename: req.file.originalname
    });

    // 3. Trigger AI Verification asynchronously
    triggerAiVerification(document._id, docVersion._id, req.file.path, req.file.originalname)
      .catch(err => console.error('[Async AI Trigger Failure]', err));

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully and queued for AI verification.',
      document,
      version: docVersion
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Edit Document Metadata
const updateDocumentMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, unitCoverage, classification, documentType } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (String(document.facultyId) !== String(req.user._id) && req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: You can only edit your own documents.' });
    }

    if (title) document.title = title.trim();
    if (description !== undefined) document.description = description.trim();
    if (unitCoverage !== undefined) document.unitCoverage = unitCoverage.trim();
    if (classification) document.classification = classification.trim();
    if (documentType) document.documentType = documentType.trim();

    await document.save();

    await logAudit(req, 'UPDATE_DOCUMENT_METADATA', 'documents', document._id, {
      title: document.title,
      updatedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Document metadata updated successfully.',
      document
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Delete Document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (String(document.facultyId) !== String(req.user._id) && req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own documents.' });
    }

    // Delete associated versions and files
    const versions = await DocumentVersion.find({ documentId: id });
    for (const v of versions) {
      try {
        if (v.filePath && fs.existsSync(v.filePath)) {
          fs.unlinkSync(v.filePath);
        }
      } catch (fErr) {
        console.warn('[File unlink warning]', fErr.message);
      }
    }

    await DocumentVersion.deleteMany({ documentId: id });
    await AiVerificationReport.deleteMany({ documentId: id });
    await ExpertReview.deleteMany({ documentId: id });
    await HodApproval.deleteMany({ documentId: id });
    await Document.findByIdAndDelete(id);

    await logAudit(req, 'DELETE_DOCUMENT', 'documents', id, {
      title: document.title,
      deletedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: `Document "${document.title}" and its version history deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Re-upload a corrected version of an existing document
const reuploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach the corrected file' });
    }

    const { documentId } = req.params;
    const { uploadNotes } = req.body;

    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    // Admin and HOD cannot re-upload academic documents as Faculty
    if (req.user.role === 'admin' || req.user.role === 'hod') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Administrators and Heads of Department cannot re-upload course documents as Faculty.'
      });
    }

    if (String(document.facultyId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only re-upload your own documents' });
    }

    const nextVersionNumber = (document.currentVersionNumber || 1) + 1;

    // Create new DocumentVersion without overwriting the previous version
    const newVersion = await DocumentVersion.create({
      documentId: document._id,
      versionNumber: nextVersionNumber,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension: path.extname(req.file.originalname).toLowerCase(),
      uploadNotes: uploadNotes || `Correction re-upload for version ${nextVersionNumber}`,
      uploadedBy: req.user._id,
      statusAtVersion: 'Re-uploaded'
    });

    document.currentVersionNumber = nextVersionNumber;
    document.currentVersionId = newVersion._id;
    document.status = 'Re-uploaded';
    await document.save();

    await logAudit(req, 'DOCUMENT_REUPLOAD', 'documents', document._id, {
      title: document.title,
      version: nextVersionNumber,
      filename: req.file.originalname
    });

    // Re-trigger AI Verification
    triggerAiVerification(document._id, newVersion._id, req.file.path, req.file.originalname)
      .catch(err => console.error('[Async AI Trigger Failure]', err));

    res.status(200).json({
      success: true,
      message: `Version ${nextVersionNumber} uploaded successfully and queued for AI verification.`,
      document,
      version: newVersion
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. List all documents submitted by this faculty
const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ facultyId: req.user._id })
      .populate('subjectId')
      .populate('batchId')
      .populate('academicRegulationId')
      .populate('semesterId')
      .populate('academicYearId')
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

// 12. Get complete document details including version history, AI reports, and expert/HOD review decisions
const getDocumentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id)
      .populate('facultyId', 'name email department')
      .populate('subjectId')
      .populate('batchId')
      .populate('academicRegulationId')
      .populate('semesterId')
      .populate('academicYearId')
      .populate('currentVersionId');

    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    // Access control:
    if (req.user.role === 'student' && !document.isPublished) {
      return res.status(403).json({ success: false, message: 'Access denied: document is not yet published.' });
    }
    if (req.user.role === 'faculty' && String(document.facultyId._id) !== String(req.user._id) && !document.isPublished) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const versions = await DocumentVersion.find({ documentId: id })
      .populate('aiVerificationReportId')
      .populate('expertReviewId')
      .populate('hodApprovalId')
      .sort({ versionNumber: -1 });

    const aiReports = await AiVerificationReport.find({ documentId: id }).sort({ createdAt: -1 });
    const expertReviews = await ExpertReview.find({ documentId: id }).populate('expertId', 'name email').sort({ createdAt: -1 });
    const hodApprovals = await HodApproval.find({ documentId: id }).populate('hodId', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      document,
      versions,
      aiReports,
      expertReviews,
      hodApprovals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFacultyCurriculumMetadata,
  getMySubjects,
  getMyAssignedSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  uploadDocument,
  updateDocumentMetadata,
  deleteDocument,
  reuploadDocument,
  getMyDocuments,
  getDocumentDetails
};
