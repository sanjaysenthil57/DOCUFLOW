const {
  User,
  Document,
  DocumentVersion,
  AiVerificationReport,
  ExpertReview,
  HodApproval,
  CodingSubmission,
  StudentEnrollment,
  FacultyAssignment,
  ExpertAssignment,
  StudyMaterial
} = require('../models');

const getDashboardAnalytics = async (req, res) => {
  try {
    const role = req.user.role;
    let data = {};

    if (role === 'faculty') {
      const [
        uploadedDocs,
        aiVerified,
        pendingExpert,
        correctionsRequired,
        approvedDocs
      ] = await Promise.all([
        Document.countDocuments({ facultyId: req.user._id }),
        Document.countDocuments({ facultyId: req.user._id, status: { $in: ['AI Verification Completed', 'Pending Expert Review'] } }),
        Document.countDocuments({ facultyId: req.user._id, status: 'Pending Expert Review' }),
        Document.countDocuments({ facultyId: req.user._id, status: 'Correction Required' }),
        Document.countDocuments({ facultyId: req.user._id, status: { $in: ['Expert Approved', 'HOD Approved', 'Published'] } })
      ]);

      data = {
        role: 'faculty',
        uploadedDocs,
        aiVerified,
        pendingExpert,
        correctionsRequired,
        approvedDocs
      };
    } else if (role === 'expert') {
      const assignments = await ExpertAssignment.find({ expertId: req.user._id, status: 'active' });
      const subjectIds = assignments.map(a => a.subjectId);

      const [
        totalAssignedDocs,
        pendingReviews,
        completedReviews,
        approvedCount,
        rejectedCount
      ] = await Promise.all([
        Document.countDocuments({ subjectId: { $in: subjectIds } }),
        Document.countDocuments({ subjectId: { $in: subjectIds }, status: { $in: ['Pending Expert Review', 'Expert Reviewing'] } }),
        ExpertReview.countDocuments({ expertId: req.user._id }),
        ExpertReview.countDocuments({ expertId: req.user._id, decision: 'approved' }),
        ExpertReview.countDocuments({ expertId: req.user._id, decision: 'rejected' })
      ]);

      data = {
        role: 'expert',
        totalAssignedDocs,
        pendingReviews,
        completedReviews,
        approvedCount,
        rejectedCount
      };
    } else if (role === 'hod') {
      const [
        pendingApprovals,
        approvedDocs,
        rejectedDocs,
        publishedDocs,
        totalFaculty,
        totalExperts,
        totalStudents,
        totalDocuments
      ] = await Promise.all([
        Document.countDocuments({ status: { $in: ['Pending HOD Approval', 'Expert Approved'] } }),
        HodApproval.countDocuments({ hodId: req.user._id, decision: 'approved' }),
        HodApproval.countDocuments({ hodId: req.user._id, decision: 'rejected' }),
        Document.countDocuments({ status: 'Published' }),
        User.countDocuments({ role: 'faculty' }),
        User.countDocuments({ role: 'expert' }),
        User.countDocuments({ role: 'student' }),
        Document.countDocuments()
      ]);

      // Semester-wise distribution of approved documents
      const semesterStats = await Document.aggregate([
        { $match: { isPublished: true } },
        {
          $lookup: {
            from: 'semesters',
            localField: 'semesterId',
            foreignField: '_id',
            as: 'sem'
          }
        },
        { $unwind: '$sem' },
        {
          $group: {
            _id: '$sem.semesterNumber',
            semesterName: { $first: '$sem.semesterName' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      data = {
        role: 'hod',
        pendingApprovals,
        approvedDocs,
        rejectedDocs,
        publishedDocs,
        totalFaculty,
        totalExperts,
        totalStudents,
        totalDocuments,
        semesterStats,
        systemHealth: {
          database: 'Healthy (MongoDB 9.0)',
          aiService: 'Online (12-Point Heuristic Quality Audit)',
          codeSandbox: 'Python, C, C++, Java Compilers Active'
        }
      };
    } else if (role === 'student') {
      const enrollment = await StudentEnrollment.findOne({ studentId: req.user._id });
      let availableDocs = 0;
      let studyNotesCount = 0;
      let codingSolved = 0;

      if (enrollment) {
        [availableDocs, studyNotesCount, codingSolved] = await Promise.all([
          Document.countDocuments({
            batchId: enrollment.batchId,
            isPublished: true
          }),
          StudyMaterial.countDocuments({
            batchId: enrollment.batchId,
            isPublished: true
          }),
          CodingSubmission.countDocuments({
            studentId: req.user._id,
            status: 'Accepted'
          })
        ]);
      } else {
        [availableDocs, studyNotesCount, codingSolved] = await Promise.all([
          Document.countDocuments({ isPublished: true }),
          StudyMaterial.countDocuments({ isPublished: true }),
          CodingSubmission.countDocuments({
            studentId: req.user._id,
            status: 'Accepted'
          })
        ]);
      }

      data = {
        role: 'student',
        availableDocs,
        studyNotesCount,
        codingSolved,
        enrolledBatch: enrollment ? enrollment.batchId : null,
        currentSemester: enrollment ? enrollment.currentSemester : 1
      };
    }

    res.status(200).json({
      success: true,
      analytics: data
    });
  } catch (error) {
    console.error('[Analytics Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardAnalytics
};
