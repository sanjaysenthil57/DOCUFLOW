const mongoose = require('mongoose');
const {
  Document,
  DocumentVersion,
  HodApproval,
  StudyMaterial,
  AcademicYear,
  AcademicRegulation,
  Batch,
  Semester,
  Subject,
  FacultyAssignment,
  ExpertAssignment,
  User,
  StudentEnrollment,
  Notification,
  AuditLog
} = require('../models');
const { sendNotification, sendBulkNotifications } = require('../services/notificationService');
const { logAudit } = require('../middleware/auth');
const {
  autoAllocateDocumentReview,
  autoAllocateBatchTeaching,
  getFacultyWorkloadSummary
} = require('../services/allocationEngineService');

// 1. Get documents awaiting HOD final approval
const getPendingApprovals = async (req, res) => {
  try {
    const documents = await Document.find({
      status: { $in: ['Pending HOD Approval', 'Expert Approved'] }
    })
      .populate('facultyId', 'name email department')
      .populate('assignedExpertId', 'name email department')
      .populate('subjectId')
      .populate('batchId')
      .populate('semesterId')
      .populate('academicRegulationId')
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

// 2. Submit HOD Final Decision (Approve, Reject, or Correction Required)
const submitApproval = async (req, res) => {
  try {
    // Role check: Only HOD can perform final academic approval. Admin and others cannot!
    if (req.user.role !== 'hod') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only authorized Head of Department (HOD) can perform final academic document approval. Administrators and other roles are restricted from approving academic documents.'
      });
    }

    const { documentId } = req.params;
    const { decision, comments, rejectionReason, academicYearId } = req.body;

    if (!decision || !['approved', 'rejected', 'correction_required'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be "approved", "rejected", or "correction_required"'
      });
    }

    const document = await Document.findById(documentId)
      .populate('facultyId')
      .populate('subjectId');

    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    // Conflict of Interest: Faculty member cannot approve own document
    if (String(document.facultyId?._id || document.facultyId) === String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of Interest: You cannot approve your own submitted course document.'
      });
    }

    // Enforce Exact Document Approval Workflow: Expert Review must precede HOD Approval
    const validApprovalStatuses = ['Pending HOD Approval', 'Expert Approved', 'Pending HOD'];
    if (!validApprovalStatuses.includes(document.status)) {
      return res.status(400).json({
        success: false,
        message: `Workflow Violation: This document is currently "${document.status}". It must complete Expert Review before HOD Final Approval can take place.`
      });
    }

    let effectiveYearId = academicYearId || document.academicYearId;
    if (!effectiveYearId) {
      const currentYear = await AcademicYear.findOne({ isCurrent: true });
      if (currentYear) effectiveYearId = currentYear._id;
    }

    const hodApproval = await HodApproval.create({
      documentId: document._id,
      documentVersionId: document.currentVersionId,
      hodId: req.user._id,
      decision,
      comments: comments || '',
      rejectionReason: rejectionReason || '',
      academicYearId: effectiveYearId,
      publishedForStudents: decision === 'approved'
    });

    await DocumentVersion.findByIdAndUpdate(document.currentVersionId, {
      hodApprovalId: hodApproval._id
    });

    let nextStatus = 'HOD Approved';
    if (decision === 'approved') {
      nextStatus = 'Published';
      document.isPublished = true;
      document.publishedAt = new Date();
    } else if (decision === 'rejected') {
      nextStatus = 'HOD Rejected';
      document.isPublished = false;
    } else if (decision === 'correction_required') {
      nextStatus = 'Correction Required';
      document.isPublished = false;
    }

    document.status = nextStatus;
    document.verifiedByHODId = req.user._id;
    await document.save();

    if (decision === 'approved') {
      const existingMaterial = await StudyMaterial.findOne({ documentId: document._id });
      if (!existingMaterial) {
        await StudyMaterial.create({
          title: `${document.title} - Official Study Notes`,
          documentId: document._id,
          subjectId: document.subjectId._id,
          semesterId: document.semesterId,
          batchId: document.batchId,
          academicRegulationId: document.academicRegulationId,
          aiSummary: `Comprehensive HOD-approved academic study material for ${document.title}. Covers syllabus units, concept explanations, and practical implementation details.`,
          sectionWiseSummaries: [
            {
              sectionTitle: 'Unit 1: Fundamentals & Core Architecture',
              summary: 'Introduces core theoretical foundations, architectural diagrams, and fundamental principles.',
              keyPoints: ['Foundational concepts', 'Key architectural layers', 'Standard notations and conventions']
            },
            {
              sectionTitle: 'Unit 2: Analytical Design & Practical Algorithms',
              summary: 'Covers detailed algorithms, code structures, data flow, and complexity analysis.',
              keyPoints: ['Algorithm pseudocode and implementation', 'Time and space efficiency', 'Industry best practices']
            }
          ],
          keyConcepts: [
            'Architectural Design Patterns',
            'Algorithmic Complexity & Optimization',
            'Database Integrity & Normalized Schemas',
            'Modular Software Engineering'
          ],
          studyNotes: `HOD Verified Notes: Study the core units thoroughly. Focus on architectural diagrams, sample algorithmic implementations, and university examination question patterns.`,
          tamilExplanation: `இந்த ஆவணம் பல்கலைக்கழகத்தின் அதிகாரப்பூர்வ பாடத்திட்ட வழிகாட்டுதலின்படி துறைத்தலைவரால் (HOD) அங்கீகரிக்கப்பட்டது. முதன்மை கருத்துகள் மற்றும் நிரலாக்க உதாரணங்களை முழுமையாக படிக்கவும்.`,
          isPublished: true
        });
      }

      const enrolledStudents = await StudentEnrollment.find({
        batchId: document.batchId,
        status: 'active'
      }).select('studentId');

      const studentUserIds = enrolledStudents.map(e => e.studentId);
      if (studentUserIds.length > 0) {
        await sendBulkNotifications(studentUserIds, {
          senderId: req.user._id,
          title: `New Approved Academic Resource: ${document.title}`,
          message: `HOD has approved and published "${document.title}" for subject ${document.subjectId.subjectName}. You can now view and download it.`,
          type: 'document_published',
          relatedDocumentId: document._id
        });
      }
    }

    await logAudit(req, 'HOD_FINAL_APPROVAL', 'documents', document._id, {
      decision,
      status: nextStatus,
      published: decision === 'approved',
      comments
    });

    await sendNotification({
      recipientId: document.facultyId._id,
      senderId: req.user._id,
      title: `HOD Final Approval: ${decision.toUpperCase()}`,
      message: `HOD ${req.user.name} has ${decision} "${document.title}". Status: ${nextStatus}.`,
      type: decision === 'approved' ? 'hod_approved' : 'hod_rejected',
      relatedDocumentId: document._id
    });

    res.status(200).json({
      success: true,
      message: `HOD decision submitted. Document is now: ${nextStatus}.`,
      document,
      hodApproval
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. HOD Approval History
const getApprovalHistory = async (req, res) => {
  try {
    const approvals = await HodApproval.find({ hodId: req.user._id })
      .populate({
        path: 'documentId',
        populate: [
          { path: 'subjectId' },
          { path: 'facultyId', select: 'name email department' },
          { path: 'batchId' }
        ]
      })
      .populate('academicYearId')
      .populate('documentVersionId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      approvals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Academic Regulations Management
const listRegulations = async (req, res) => {
  try {
    const regulations = await AcademicRegulation.find().sort({ startYear: -1 });
    res.status(200).json({ success: true, regulations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRegulationById = async (req, res) => {
  try {
    const { id } = req.params;
    const regulation = await AcademicRegulation.findById(id);
    if (!regulation) {
      return res.status(404).json({ success: false, message: 'Academic regulation not found.' });
    }
    res.status(200).json({ success: true, regulation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRegulation = async (req, res) => {
  try {
    const { name, code, description, startYear, endYear, academicYear, studyLevel } = req.body;
    const parsedStart = Number(startYear) || 2026;
    const parsedEnd = endYear ? Number(endYear) : parsedStart + 1;
    const reg = await AcademicRegulation.create({
      name,
      code,
      description,
      startYear: parsedStart,
      endYear: parsedEnd,
      academicYear: academicYear || `${parsedStart}–${parsedEnd}`,
      studyLevel: studyLevel || 'PG / MCA (Semesters 1-4)',
      isActive: true
    });

    // Auto-generate standard 4 Semesters for this regulation
    const semNums = [1, 2, 3, 4];
    for (const num of semNums) {
      await Semester.create({
        semesterNumber: num,
        semesterName: `Semester ${num}`,
        academicRegulationId: reg._id,
        description: `Academic Curriculum Semester ${num} for ${code}`
      });
    }

    await logAudit(req, 'CREATE_REGULATION', 'academic_regulations', reg._id, { code, name });
    res.status(201).json({ success: true, regulation: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateRegulation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, academicYear, studyLevel, startYear, endYear, isActive } = req.body;

    const regulation = await AcademicRegulation.findById(id);
    if (!regulation) {
      return res.status(404).json({ success: false, message: 'Academic regulation not found.' });
    }

    // Required field validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Regulation name is required.' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Regulation code is required.' });
    }

    const formattedCode = code.trim().toUpperCase();

    // Prevent duplicate codes across other regulations
    const duplicate = await AcademicRegulation.findOne({
      code: formattedCode,
      _id: { $ne: id }
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Regulation code '${formattedCode}' is already registered for '${duplicate.name}'.`
      });
    }

    // Parse startYear and endYear from academicYear if not explicitly provided
    let parsedStart = startYear !== undefined && startYear !== '' ? Number(startYear) : undefined;
    let parsedEnd = endYear !== undefined && endYear !== '' ? Number(endYear) : undefined;

    if ((!parsedStart || isNaN(parsedStart)) && academicYear) {
      const match = academicYear.match(/(\d{4})/g);
      if (match && match.length > 0) {
        parsedStart = Number(match[0]);
        if (match.length > 1) {
          parsedEnd = Number(match[1]);
        }
      }
    }

    if (!parsedStart || isNaN(parsedStart)) {
      parsedStart = regulation.startYear || new Date().getFullYear();
    }
    if (parsedEnd === undefined || isNaN(parsedEnd)) {
      parsedEnd = regulation.endYear || (parsedStart + 1);
    }

    const formattedAcademicYear = academicYear && academicYear.trim()
      ? academicYear.trim()
      : `${parsedStart}–${parsedEnd}`;

    const formattedStudyLevel = studyLevel && studyLevel.trim()
      ? studyLevel.trim()
      : (regulation.studyLevel || 'PG / MCA (Semesters 1-4)');

    // Update existing record directly in MongoDB (no duplicate created)
    regulation.name = name.trim();
    regulation.code = formattedCode;
    regulation.academicYear = formattedAcademicYear;
    regulation.studyLevel = formattedStudyLevel;
    regulation.startYear = parsedStart;
    regulation.endYear = parsedEnd;
    if (description !== undefined) {
      regulation.description = description.trim();
    }
    if (isActive !== undefined) {
      regulation.isActive = typeof isActive === 'boolean' ? isActive : isActive === 'true' || isActive === 'Active';
    }

    // Saving updates updatedAt timestamp automatically
    await regulation.save();

    await logAudit(req, 'UPDATE_REGULATION', 'academic_regulations', regulation._id, {
      code: regulation.code,
      name: regulation.name,
      academicYear: regulation.academicYear,
      studyLevel: regulation.studyLevel,
      isActive: regulation.isActive
    });

    res.status(200).json({
      success: true,
      message: 'Academic regulation updated successfully.',
      regulation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Academic Years Management
const listAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYear.find().populate('hodId', 'name email department phone').sort({ startDate: -1 });
    res.status(200).json({ success: true, academicYears: years });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAcademicYear = async (req, res) => {
  try {
    const { yearName, code, startDate, endDate, isCurrent } = req.body;
    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }
    const year = await AcademicYear.create({
      yearName,
      code,
      startDate,
      endDate,
      isCurrent: !!isCurrent,
      hodId: req.user._id
    });
    await logAudit(req, 'CREATE_ACADEMIC_YEAR', 'academic_years', year._id, { yearName, hodId: req.user._id });
    res.status(201).json({ success: true, academicYear: year });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Batches Management
const listBatches = async (req, res) => {
  try {
    const batches = await Batch.find().populate('academicRegulationId').sort({ startYear: -1 });
    res.status(200).json({ success: true, batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBatch = async (req, res) => {
  try {
    const { batchName, academicRegulationId, startYear, endYear, department, currentSemester } = req.body;
    const batch = await Batch.create({
      batchName,
      academicRegulationId,
      startYear,
      endYear,
      department: department || 'MCA',
      currentSemester: currentSemester || 1
    });
    await logAudit(req, 'CREATE_BATCH', 'batches', batch._id, { batchName, academicRegulationId });
    res.status(201).json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Semesters & Subjects Management
const listSemesters = async (req, res) => {
  try {
    const { regulationId } = req.query;
    const query = regulationId ? { academicRegulationId: regulationId } : {};
    const semesters = await Semester.find(query).sort({ semesterNumber: 1 });
    res.status(200).json({ success: true, semesters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listSubjects = async (req, res) => {
  try {
    const { regulationId, semesterNumber } = req.query;
    const query = {};
    if (regulationId) query.academicRegulationId = regulationId;
    if (semesterNumber) query.semesterNumber = Number(semesterNumber);

    const subjects = await Subject.find(query)
      .populate('academicRegulationId')
      .populate('semesterId')
      .sort({ semesterNumber: 1, subjectCode: 1 });
    res.status(200).json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    let {
      subjectCode,
      subjectName,
      academicRegulationId,
      semesterId,
      semesterNumber,
      credits,
      description,
      syllabusSummary,
      hasProgramming,
      primaryLanguage
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

    const formattedCode = subjectCode.trim().toUpperCase();

    // Check duplicate subject code under the same academic regulation
    const existingSubject = await Subject.findOne({
      subjectCode: formattedCode,
      academicRegulationId
    });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: `Subject code '${formattedCode}' already exists for this academic regulation.`
      });
    }

    // Resolve and validate semester from MongoDB
    let semester = null;
    if (semesterId) {
      if (mongoose.Types.ObjectId.isValid(semesterId)) {
        semester = await Semester.findById(semesterId);
      }
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: `Semester record with ID '${semesterId}' was not found in MongoDB.`
        });
      }
    } else if (semesterNumber) {
      semester = await Semester.findOne({
        academicRegulationId,
        semesterNumber: Number(semesterNumber)
      });
    }

    // If semester still not found, check if regulation has semesters or auto-generate them
    if (!semester) {
      const existingSemesters = await Semester.find({ academicRegulationId }).sort({ semesterNumber: 1 });
      if (existingSemesters.length > 0) {
        const targetNum = Number(semesterNumber) || 1;
        semester = existingSemesters.find(s => s.semesterNumber === targetNum) || existingSemesters[0];
      } else {
        const reg = await AcademicRegulation.findById(academicRegulationId);
        const code = reg ? reg.code : 'MCA';
        const createdSems = [];
        for (const num of [1, 2, 3, 4]) {
          const s = await Semester.create({
            semesterNumber: num,
            semesterName: `Semester ${num}`,
            academicRegulationId,
            description: `Academic Curriculum Semester ${num} for ${code}`
          });
          createdSems.push(s);
        }
        const targetNum = Number(semesterNumber) || 1;
        semester = createdSems.find(s => s.semesterNumber === targetNum) || createdSems[0];
      }
    }

    // Ensure the selected semester belongs to the selected academic regulation
    if (semester.academicRegulationId.toString() !== academicRegulationId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The selected semester does not belong to the selected academic regulation.'
      });
    }

    const subject = await Subject.create({
      subjectCode: formattedCode,
      subjectName: subjectName.trim(),
      academicRegulationId,
      semesterId: semester._id,
      semesterNumber: semester.semesterNumber,
      credits: Number(credits) || 3,
      description: description ? description.trim() : '',
      syllabusSummary: syllabusSummary ? syllabusSummary.trim() : '',
      hasProgramming: hasProgramming !== undefined ? hasProgramming : true,
      primaryLanguage: primaryLanguage || 'python',
      subjectType: req.body.subjectType || 'Theory',
      programmingLanguages: req.body.programmingLanguages || [],
      syllabusUnits: req.body.syllabusUnits || []
    });

    await logAudit(req, 'CREATE_SUBJECT', 'subjects', subject._id, {
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      semesterId: subject.semesterId,
      academicRegulationId
    });

    const populatedSubject = await Subject.findById(subject._id)
      .populate('academicRegulationId')
      .populate('semesterId');

    res.status(201).json({ success: true, subject: populatedSubject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Faculty & Expert Assignments
const listFacultyAssignments = async (req, res) => {
  try {
    const assignments = await FacultyAssignment.find({ status: 'active' })
      .populate('facultyId', 'name email department')
      .populate('subjectId')
      .populate('batchId')
      .populate('academicYearId')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignFaculty = async (req, res) => {
  try {
    let { facultyId, subjectId, batchId, academicYearId } = req.body;

    if (!facultyId || !subjectId || !batchId) {
      return res.status(400).json({
        success: false,
        message: 'Faculty member, Subject, and Target Batch are required.'
      });
    }

    let resolvedYearId = null;
    if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
      resolvedYearId = academicYearId;
    } else {
      const year = await AcademicYear.findOne({ isCurrent: true }) || await AcademicYear.findOne();
      if (year) resolvedYearId = year._id;
    }

    const payload = {
      facultyId,
      subjectId,
      batchId,
      assignedBy: req.user._id,
      status: 'active'
    };
    if (resolvedYearId) {
      payload.academicYearId = resolvedYearId;
    }

    const assignment = await FacultyAssignment.create(payload);
    await logAudit(req, 'ASSIGN_FACULTY', 'faculty_assignments', assignment._id, { facultyId, subjectId, batchId });
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listExpertAssignments = async (req, res) => {
  try {
    const assignments = await ExpertAssignment.find({ status: 'active' })
      .populate('expertId', 'name email department')
      .populate('subjectId')
      .populate('academicYearId')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignExpert = async (req, res) => {
  try {
    let { expertId, subjectId, academicYearId } = req.body;
    
    if (!expertId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject Expert and Subject are required.'
      });
    }

    // Ensure the designated user is marked as expert role
    const expertUser = await User.findById(expertId);
    if (expertUser && expertUser.role === 'faculty') {
      expertUser.role = 'expert';
      await expertUser.save();
    }

    let resolvedYearId = null;
    if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
      resolvedYearId = academicYearId;
    } else {
      const year = await AcademicYear.findOne({ isCurrent: true }) || await AcademicYear.findOne();
      if (year) resolvedYearId = year._id;
    }

    const payload = {
      expertId,
      subjectId,
      assignedBy: req.user._id,
      status: 'active'
    };
    if (resolvedYearId) {
      payload.academicYearId = resolvedYearId;
    }

    const assignment = await ExpertAssignment.create(payload);
    await logAudit(req, 'ASSIGN_EXPERT', 'expert_assignments', assignment._id, { expertId, subjectId });
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Department Faculty List & Expert Designation
const listFaculty = async (req, res) => {
  try {
    const faculty = await User.find({ role: { $in: ['faculty', 'expert'] } })
      .select('-password')
      .sort({ name: 1 });
    res.status(200).json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const designateExpert = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = 'expert';
    await user.save();

    await logAudit(req, 'DESIGNATE_EXPERT', 'users', user._id, { email: user.email });
    res.status(200).json({ success: true, message: `${user.name} designated as Subject Expert Reviewer`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.approvalStatus = 'approved';
    user.isActive = true;
    await user.save();

    await logAudit(req, 'APPROVE_USER', 'users', user._id, { email: user.email, role: user.role });
    res.status(200).json({
      success: true,
      message: `Account for ${user.name} (${user.email}) has been authorized and activated successfully.`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.approvalStatus = 'rejected';
    await user.save();

    await logAudit(req, 'REJECT_USER', 'users', user._id, { email: user.email, role: user.role });
    res.status(200).json({
      success: true,
      message: `Account request for ${user.name} (${user.email}) has been rejected.`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Direct Admin Password Reset (Disabled by Security Policy)
const resetUserPassword = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Access Denied: Administrators and HODs cannot directly view or change faculty passwords. Faculty must manage their own credentials via self-service account settings or use the secure Forgot Password workflow.'
  });
};

// 11. Update Subject Details
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subjectCode,
      subjectName,
      credits,
      description,
      syllabusSummary,
      hasProgramming,
      primaryLanguage,
      programmingLanguages,
      subjectType,
      syllabusUnits,
      semesterId,
      isActive
    } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (subjectCode && subjectCode.trim().toUpperCase() !== subject.subjectCode) {
      const formattedCode = subjectCode.trim().toUpperCase();
      const existing = await Subject.findOne({
        academicRegulationId: subject.academicRegulationId,
        subjectCode: formattedCode,
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Subject code "${formattedCode}" is already in use for this regulation.`
        });
      }
      subject.subjectCode = formattedCode;
    }

    if (subjectName) subject.subjectName = subjectName.trim();
    if (credits !== undefined) subject.credits = Number(credits);
    if (description !== undefined) subject.description = description.trim();
    if (syllabusSummary !== undefined) subject.syllabusSummary = syllabusSummary.trim();
    if (hasProgramming !== undefined) subject.hasProgramming = hasProgramming;
    if (primaryLanguage) subject.primaryLanguage = primaryLanguage.trim().toLowerCase();
    if (programmingLanguages) subject.programmingLanguages = programmingLanguages;
    if (subjectType) subject.subjectType = subjectType;
    if (syllabusUnits) subject.syllabusUnits = syllabusUnits;
    if (isActive !== undefined) subject.isActive = isActive;

    if (semesterId && semesterId !== subject.semesterId?.toString()) {
      const sem = await Semester.findById(semesterId);
      if (sem) {
        subject.semesterId = sem._id;
        subject.semesterNumber = sem.semesterNumber;
      }
    }

    await subject.save();
    await logAudit(req, 'UPDATE_SUBJECT', 'subjects', subject._id, { subjectCode: subject.subjectCode });

    const populated = await Subject.findById(subject._id)
      .populate('academicRegulationId')
      .populate('semesterId');

    res.status(200).json({ success: true, subject: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Delete Subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const docCount = await Document.countDocuments({ subjectId: id });
    if (docCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject "${subject.subjectCode}". It has ${docCount} linked course documents. Set it inactive instead.`
      });
    }

    await FacultyAssignment.deleteMany({ subjectId: id });
    await ExpertAssignment.deleteMany({ subjectId: id });
    await Subject.findByIdAndDelete(id);

    await logAudit(req, 'DELETE_SUBJECT', 'subjects', id, { subjectCode: subject.subjectCode });
    res.status(200).json({ success: true, message: `Subject "${subject.subjectCode}" deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 14. Faculty Workload & Auto Allocation
const getFacultyWorkloads = async (req, res) => {
  try {
    const workloads = await getFacultyWorkloadSummary();
    res.status(200).json({ success: true, workloads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const triggerAutoAllocation = async (req, res) => {
  try {
    const pendingDocs = await Document.find({
      status: 'Pending Expert Review',
      assignedExpertId: { $in: [null, undefined] }
    });

    const results = [];
    for (const doc of pendingDocs) {
      const resAlloc = await autoAllocateDocumentReview(doc._id);
      results.push({ documentId: doc._id, title: doc.title, ...resAlloc });
    }

    res.status(200).json({
      success: true,
      message: `Processed ${results.length} document review allocations.`,
      allocations: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const autoAllocateBatchSubjects = async (req, res) => {
  try {
    const { batchId, academicYearId } = req.body;
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'batchId is required.' });
    }
    const result = await autoAllocateBatchTeaching(batchId, academicYearId, req.user._id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 15. Student Directory & HOD Promotion
const listStudents = async (req, res) => {
  try {
    const enrollments = await StudentEnrollment.find()
      .populate('userId', 'name email role department isApproved isActive')
      .populate('batchId')
      .populate('academicRegulationId')
      .populate('currentSemesterId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: enrollments.length, students: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const promoteStudentByHod = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const enrollment = await StudentEnrollment.findById(enrollmentId)
      .populate('userId')
      .populate('batchId')
      .populate('academicRegulationId');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Student enrollment record not found.' });
    }

    const currentSem = enrollment.currentSemester || 1;
    if (currentSem >= 4) {
      enrollment.status = 'graduated';
      if (!enrollment.completedSemesters.includes(4)) {
        enrollment.completedSemesters.push(4);
      }
      enrollment.semesterHistory.push({
        semesterNumber: 4,
        academicYear: enrollment.batchId?.batchName || '2026-2028',
        completedDate: new Date(),
        status: 'completed'
      });
      await enrollment.save();

      return res.status(200).json({
        success: true,
        message: `Student ${enrollment.userId?.name || enrollment.registrationNumber} has successfully graduated and completed all 4 MCA semesters!`,
        enrollment
      });
    }

    const nextSem = currentSem + 1;
    let nextSemesterDoc = await Semester.findOne({
      academicRegulationId: enrollment.academicRegulationId._id,
      semesterNumber: nextSem
    });

    if (!nextSemesterDoc) {
      nextSemesterDoc = await Semester.create({
        semesterNumber: nextSem,
        semesterName: `Semester ${nextSem}`,
        academicRegulationId: enrollment.academicRegulationId._id,
        description: `Academic Curriculum Semester ${nextSem}`
      });
    }

    if (!enrollment.completedSemesters.includes(currentSem)) {
      enrollment.completedSemesters.push(currentSem);
    }
    enrollment.semesterHistory.push({
      semesterNumber: currentSem,
      academicYear: enrollment.batchId?.batchName || '2026-2028',
      completedDate: new Date(),
      status: 'completed'
    });

    enrollment.currentSemester = nextSem;
    enrollment.currentSemesterId = nextSemesterDoc._id;
    await enrollment.save();

    await sendNotification({
      recipientId: enrollment.userId._id,
      title: 'Semester Promotion Approved',
      message: `Congratulations! HOD has approved your academic promotion to Semester ${nextSem}.`,
      type: 'status_update'
    });

    await logAudit(req, 'PROMOTE_STUDENT_HOD', 'student_enrollments', enrollment._id, {
      studentId: enrollment.userId?._id,
      fromSem: currentSem,
      toSem: nextSem
    });

    res.status(200).json({
      success: true,
      message: `Student promoted from Semester ${currentSem} to Semester ${nextSem} successfully.`,
      enrollment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPendingApprovals,
  submitApproval,
  getApprovalHistory,
  listRegulations,
  getRegulationById,
  createRegulation,
  updateRegulation,
  listAcademicYears,
  createAcademicYear,
  listBatches,
  createBatch,
  listSemesters,
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getFacultyWorkloads,
  triggerAutoAllocation,
  autoAllocateBatchSubjects,
  listStudents,
  promoteStudentByHod,
  listFacultyAssignments,
  assignFaculty,
  listExpertAssignments,
  assignExpert,
  listFaculty,
  designateExpert,
  approveUser,
  rejectUser,
  resetUserPassword
};
