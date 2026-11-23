const mongoose = require('mongoose');
const {
  Document,
  Subject,
  User,
  FacultyAssignment,
  ExpertAssignment,
  ExpertReview,
  Notification
} = require('../models');
const { sendNotification, sendBulkNotifications } = require('./notificationService');

/**
 * Automatically allocates an eligible faculty/expert reviewer for a document.
 */
async function autoAllocateDocumentReview(documentId) {
  try {
    const doc = await Document.findById(documentId)
      .populate('subjectId')
      .populate('facultyId', 'name email department')
      .populate('batchId');

    if (!doc) {
      return { success: false, message: 'Document not found' };
    }

    const subject = doc.subjectId;
    const authorId = doc.facultyId?._id ? doc.facultyId._id.toString() : null;

    // 1. Check if an expert is already explicitly assigned to this subject
    let assignedExpert = null;
    const existingSubjectAssignment = await ExpertAssignment.findOne({
      subjectId: subject._id,
      status: 'active'
    }).populate('expertId');

    if (existingSubjectAssignment && existingSubjectAssignment.expertId) {
      const exp = existingSubjectAssignment.expertId;
      if (exp.isActive && exp._id.toString() !== authorId) {
        assignedExpert = exp;
      }
    }

    // 2. If no active subject expert, find all eligible faculty/experts in the department
    if (!assignedExpert) {
      const eligibleUsers = await User.find({
        role: { $in: ['faculty', 'expert', 'hod'] },
        isActive: true,
        approvalStatus: 'approved',
        _id: { $ne: authorId }
      });

      if (eligibleUsers.length === 0) {
        // Notify HOD that no eligible reviewer exists
        const hods = await User.find({ role: 'hod', isActive: true });
        for (const hod of hods) {
          await sendNotification({
            recipientId: hod._id,
            title: 'Action Required: Reviewer Allocation Pending',
            message: `Document "${doc.title}" for subject "${subject.subjectName} (${subject.subjectCode})" has no eligible reviewer. Please review faculty eligibility or assign manually.`,
            type: 'system_alert',
            relatedDocumentId: doc._id
          });
        }
        return { success: false, message: 'No eligible faculty/expert found in department.' };
      }

      // Calculate current review workload for each candidate
      const workloads = await Promise.all(eligibleUsers.map(async (u) => {
        const pendingReviews = await Document.countDocuments({
          subjectId: subject._id,
          status: { $in: ['Pending Expert Review', 'Under Review'] }
        });
        const activeSubjectAssignments = await ExpertAssignment.countDocuments({
          expertId: u._id,
          status: 'active'
        });
        return {
          user: u,
          workload: (u.currentWorkload || 0) + pendingReviews + activeSubjectAssignments
        };
      }));

      // Sort by lowest workload (fair distribution)
      workloads.sort((a, b) => a.workload - b.workload);
      assignedExpert = workloads[0].user;

      // Automatically register the ExpertAssignment for the subject
      await ExpertAssignment.findOneAndUpdate(
        { expertId: assignedExpert._id, subjectId: subject._id },
        {
          expertId: assignedExpert._id,
          subjectId: subject._id,
          academicYearId: doc.academicYearId,
          assignedBy: doc.facultyId?._id || assignedExpert._id,
          status: 'active',
          assignedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }

    // Update expert's workload
    await User.findByIdAndUpdate(assignedExpert._id, { $inc: { currentWorkload: 1 } });

    // Send notifications
    await sendNotification({
      recipientId: assignedExpert._id,
      title: 'New Review Assignment Allocated',
      message: `You have been automatically allocated as academic reviewer for "${doc.title}" (${subject.subjectCode} - ${subject.subjectName}).`,
      type: 'review_assigned',
      relatedDocumentId: doc._id
    });

    if (doc.facultyId?._id) {
      await sendNotification({
        recipientId: doc.facultyId._id,
        title: 'Reviewer Allocated',
        message: `Academic reviewer ${assignedExpert.name} has been assigned to evaluate "${doc.title}".`,
        type: 'status_update',
        relatedDocumentId: doc._id
      });
    }

    return {
      success: true,
      reviewer: {
        _id: assignedExpert._id,
        name: assignedExpert.name,
        email: assignedExpert.email
      }
    };
  } catch (error) {
    console.error('[Allocation Engine Error]', error);
    return { success: false, message: error.message };
  }
}

/**
 * Automatically allocates teaching faculty for unassigned subjects in a batch.
 */
async function autoAllocateBatchTeaching(batchId, academicYearId, assigningUserId) {
  try {
    const { Batch } = require('../models');
    const batch = await Batch.findById(batchId).populate('academicRegulationId');
    if (!batch) return { success: false, message: 'Batch not found' };

    // Find all subjects for this batch's regulation and current semester
    const subjects = await Subject.find({
      academicRegulationId: batch.academicRegulationId._id,
      semesterNumber: batch.currentSemester
    });

    const eligibleFaculty = await User.find({
      role: { $in: ['faculty', 'hod'] },
      isActive: true,
      approvalStatus: 'approved'
    });

    if (eligibleFaculty.length === 0) {
      return { success: false, message: 'No eligible teaching faculty available.' };
    }

    const assignmentsMade = [];

    for (const sub of subjects) {
      const existing = await FacultyAssignment.findOne({
        subjectId: sub._id,
        batchId: batch._id,
        status: 'active'
      });

      if (!existing) {
        // Find faculty with lowest teaching workload
        const facultyWorkloads = await Promise.all(eligibleFaculty.map(async (f) => {
          const count = await FacultyAssignment.countDocuments({ facultyId: f._id, status: 'active' });
          return { faculty: f, count };
        }));

        facultyWorkloads.sort((a, b) => a.count - b.count);
        const selected = facultyWorkloads[0].faculty;

        const newAssignment = await FacultyAssignment.create({
          facultyId: selected._id,
          subjectId: sub._id,
          batchId: batch._id,
          academicYearId,
          assignedBy: assigningUserId || selected._id,
          status: 'active'
        });

        assignmentsMade.push(newAssignment);

        await sendNotification({
          recipientId: selected._id,
          title: 'Course Teaching Allocation',
          message: `You have been allocated to instruct ${sub.subjectCode} - ${sub.subjectName} for ${batch.batchName}.`,
          type: 'teaching_assigned'
        });
      }
    }

    return {
      success: true,
      count: assignmentsMade.length,
      assignments: assignmentsMade
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Fetches real-time faculty workload metrics for HOD monitoring.
 */
async function getFacultyWorkloadSummary() {
  const facultyList = await User.find({
    role: { $in: ['faculty', 'expert', 'hod'] },
    isActive: true
  }).select('name email role department expertise maxWorkload currentWorkload');

  const summary = await Promise.all(facultyList.map(async (f) => {
    const teachingCount = await FacultyAssignment.countDocuments({ facultyId: f._id, status: 'active' });
    const expertCount = await ExpertAssignment.countDocuments({ expertId: f._id, status: 'active' });
    const reviewsCompleted = await ExpertReview.countDocuments({ expertId: f._id });

    return {
      _id: f._id,
      name: f.name,
      email: f.email,
      role: f.role,
      department: f.department,
      expertise: f.expertise || [],
      teachingCount,
      expertCount,
      reviewsCompleted,
      totalActiveWorkload: teachingCount + expertCount,
      capacity: f.maxWorkload || 5,
      utilizationRate: Math.min(100, Math.round(((teachingCount + expertCount) / (f.maxWorkload || 5)) * 100))
    };
  }));

  return summary;
}

module.exports = {
  autoAllocateDocumentReview,
  autoAllocateBatchTeaching,
  getFacultyWorkloadSummary
};
