const mongoose = require('mongoose');
const {
  User,
  Document,
  DocumentVersion,
  AcademicRegulation,
  AcademicYear,
  Batch,
  Subject,
  FacultyAssignment,
  ExpertAssignment,
  HodAssignment,
  StudentEnrollment,
  Notification,
  AuditLog
} = require('../models');
const { logAudit } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

// 1. Get Comprehensive System Telemetry & Metrics
const getSystemMetrics = async (req, res) => {
  try {
    const [
      totalUsers,
      studentCount,
      facultyCount,
      expertCount,
      hodCount,
      adminCount,
      pendingUsersCount,
      totalDocuments,
      publishedDocsCount,
      pendingHodCount,
      pendingExpertCount,
      regulationsCount,
      batchesCount,
      subjectsCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'expert' }),
      User.countDocuments({ role: 'hod' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ approvalStatus: 'pending' }),
      Document.countDocuments(),
      Document.countDocuments({ status: 'Published' }),
      Document.countDocuments({ status: { $in: ['Pending HOD Approval', 'Expert Approved'] } }),
      Document.countDocuments({ status: { $in: ['Pending Expert Review', 'Expert Reviewing'] } }),
      AcademicRegulation.countDocuments(),
      Batch.countDocuments(),
      Subject.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        users: {
          total: totalUsers,
          students: studentCount,
          faculty: facultyCount,
          experts: expertCount,
          hods: hodCount,
          admins: adminCount,
          pendingApprovals: pendingUsersCount
        },
        documents: {
          total: totalDocuments,
          published: publishedDocsCount,
          pendingHod: pendingHodCount,
          pendingExpert: pendingExpertCount
        },
        curriculum: {
          regulations: regulationsCount,
          batches: batchesCount,
          subjects: subjectsCount
        },
        system: {
          database: 'CONNECTED',
          platform: 'DocuFlow AI Enterprise Administration',
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Users with Dynamic Search & Filters
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role.toLowerCase();
    }

    if (status && status !== 'all') {
      if (status === 'active') query.isActive = true;
      else if (status === 'inactive') query.isActive = false;
      else query.approvalStatus = status.toLowerCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { institutionalId: { $regex: term, $options: 'i' } },
        { department: { $regex: term, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Toggle User Active / Inactive Status
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'Security Violation: Administrators cannot deactivate their own active administrative session.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.isActive = isActive !== undefined ? isActive : !user.isActive;
    await user.save();

    await logAudit(
      req,
      user.isActive ? 'ADMIN_USER_ACTIVATED' : 'ADMIN_USER_SUSPENDED',
      'users',
      user._id,
      { targetEmail: user.email, targetRole: user.role, isActive: user.isActive }
    );

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.email}) has been ${user.isActive ? 'activated' : 'suspended'}.`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update User Role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'hod', 'expert', 'faculty', 'student'];
    if (!role || !validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    const targetRole = role.toLowerCase();
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (String(req.user._id) === String(id) && targetRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Security Violation: Administrators cannot demote their own active administrative account.'
      });
    }

    const previousRole = user.role;
    user.role = targetRole;
    user.requestedRole = targetRole;
    user.approvalStatus = 'approved';
    await user.save();

    await logAudit(
      req,
      'ADMIN_ROLE_UPDATED',
      'users',
      user._id,
      { targetEmail: user.email, previousRole, newRole: targetRole }
    );

    await sendNotification({
      recipientId: user._id,
      title: 'Institutional Role Updated',
      message: `Your institutional account role has been updated to "${targetRole.toUpperCase()}" by the System Administrator.`,
      type: 'role_updated'
    });

    res.status(200).json({
      success: true,
      message: `Role for ${user.name} successfully updated from ${previousRole} to ${targetRole}.`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Approve User Registration Request
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.approvalStatus = 'approved';
    user.isActive = true;
    if (user.requestedRole && user.requestedRole !== 'none') {
      user.role = user.requestedRole;
    }
    await user.save();

    await logAudit(
      req,
      'ADMIN_USER_APPROVED',
      'users',
      user._id,
      { targetEmail: user.email, role: user.role }
    );

    await sendNotification({
      recipientId: user._id,
      title: 'Account Authorization Approved',
      message: `Your DocuFlow AI institutional account has been approved by the System Administrator with ${user.role.toUpperCase()} privileges.`,
      type: 'account_approved'
    });

    res.status(200).json({
      success: true,
      message: `Account for ${user.name} (${user.email}) approved successfully.`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Reject User Registration Request
const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.approvalStatus = 'rejected';
    user.isActive = false;
    await user.save();

    await logAudit(
      req,
      'ADMIN_USER_REJECTED',
      'users',
      user._id,
      { targetEmail: user.email, role: user.role, reason: reason || 'Not specified' }
    );

    res.status(200).json({
      success: true,
      message: `Registration for ${user.name} (${user.email}) rejected.`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Delete User Account
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'Security Violation: Cannot delete your own active administrator account.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    await User.findByIdAndDelete(id);

    // If student, remove student enrollment
    if (user.role === 'student') {
      await StudentEnrollment.deleteMany({ studentId: id });
    }

    await logAudit(
      req,
      'ADMIN_USER_DELETED',
      'users',
      id,
      { targetEmail: user.email, targetRole: user.role }
    );

    res.status(200).json({
      success: true,
      message: `Account for ${user.name} (${user.email}) deleted permanently.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Get System Audit Trail
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Get Unified Subject Assignments (Faculty, Expert, HOD)
const getSubjectAssignments = async (req, res) => {
  try {
    const { role = 'all', search, department, subjectId } = req.query;

    const results = [];

    // 9a. Faculty Assignments
    if (role === 'all' || role === 'faculty') {
      const fQuery = { status: 'active' };
      if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
        fQuery.subjectId = subjectId;
      }
      const facList = await FacultyAssignment.find(fQuery)
        .populate('facultyId', 'name email institutionalId department role')
        .populate('subjectId', 'subjectCode subjectName semesterNumber department')
        .populate('batchId', 'batchName')
        .populate('academicYearId', 'yearString')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 });

      facList.forEach((a) => {
        if (!a.facultyId || !a.subjectId) return;
        results.push({
          id: a._id,
          assignmentType: 'faculty',
          user: a.facultyId,
          subject: a.subjectId,
          batch: a.batchId,
          academicYear: a.academicYearId,
          department: a.subjectId.department || a.facultyId.department || 'Master of Computer Applications (MCA)',
          assignedBy: a.assignedBy,
          assignedAt: a.assignedAt || a.createdAt,
          status: a.status
        });
      });
    }

    // 9b. Expert Assignments
    if (role === 'all' || role === 'expert') {
      const eQuery = { status: 'active' };
      if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
        eQuery.subjectId = subjectId;
      }
      const expList = await ExpertAssignment.find(eQuery)
        .populate('expertId', 'name email institutionalId department role')
        .populate('subjectId', 'subjectCode subjectName semesterNumber department')
        .populate('academicYearId', 'yearString')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 });

      expList.forEach((a) => {
        if (!a.expertId || !a.subjectId) return;
        results.push({
          id: a._id,
          assignmentType: 'expert',
          user: a.expertId,
          subject: a.subjectId,
          batch: null,
          academicYear: a.academicYearId,
          department: a.subjectId.department || a.expertId.department || 'Master of Computer Applications (MCA)',
          assignedBy: a.assignedBy,
          assignedAt: a.assignedAt || a.createdAt,
          status: a.status
        });
      });
    }

    // 9c. HOD Assignments
    if (role === 'all' || role === 'hod') {
      const hQuery = { status: 'active' };
      if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
        hQuery.subjectId = subjectId;
      }
      const hodList = await HodAssignment.find(hQuery)
        .populate('hodId', 'name email institutionalId department role')
        .populate('subjectId', 'subjectCode subjectName semesterNumber department')
        .populate('batchId', 'batchName')
        .populate('academicYearId', 'yearString')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 });

      hodList.forEach((a) => {
        if (!a.hodId || !a.subjectId) return;
        results.push({
          id: a._id,
          assignmentType: 'hod',
          user: a.hodId,
          subject: a.subjectId,
          batch: a.batchId,
          academicYear: a.academicYearId,
          department: a.department || a.subjectId.department || a.hodId.department || 'Master of Computer Applications (MCA)',
          assignedBy: a.assignedBy,
          assignedAt: a.assignedAt || a.createdAt,
          status: a.status
        });
      });
    }

    // Apply client filter for search or department if specified
    let filtered = results;
    if (department && department !== 'all') {
      filtered = filtered.filter(item =>
        (item.department || '').toLowerCase().includes(department.toLowerCase())
      );
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(item =>
        item.user?.name?.toLowerCase().includes(term) ||
        item.user?.email?.toLowerCase().includes(term) ||
        item.subject?.subjectCode?.toLowerCase().includes(term) ||
        item.subject?.subjectName?.toLowerCase().includes(term)
      );
    }

    // Sort by latest assigned
    filtered.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

    res.status(200).json({
      success: true,
      count: filtered.length,
      assignments: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Get Options for Assignment Form (Users, Subjects, Departments, Academic Years, Batches)
const getAssignmentOptions = async (req, res) => {
  try {
    const [users, subjects, academicYears, batches, regulations] = await Promise.all([
      User.find({
        role: { $in: ['faculty', 'expert', 'hod', 'admin'] },
        isActive: true,
        approvalStatus: 'approved'
      }).select('name email institutionalId role department'),
      Subject.find()
        .populate('academicRegulationId', 'name code')
        .populate('semesterId', 'semesterNumber name')
        .sort({ subjectCode: 1 }),
      AcademicYear.find().sort({ startYear: -1 }),
      Batch.find().sort({ startYear: -1 }),
      AcademicRegulation.find().sort({ startYear: -1 })
    ]);

    // Extract unique departments
    const deptSet = new Set();
    users.forEach(u => u.department && deptSet.add(u.department));
    subjects.forEach(s => s.department && deptSet.add(s.department));
    if (deptSet.size === 0) {
      deptSet.add('Master of Computer Applications (MCA)');
    }

    res.status(200).json({
      success: true,
      options: {
        users,
        subjects,
        academicYears,
        batches,
        regulations,
        departments: Array.from(deptSet)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Assign Subject Responsibility (Faculty, Expert, HOD)
const assignSubjectResponsibility = async (req, res) => {
  try {
    const {
      userId,
      role: targetRole,
      subjectId,
      department,
      academicYearId,
      batchId
    } = req.body;

    // Validate Required Fields
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Valid User ID is required.' });
    }
    if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Valid Subject ID is required.' });
    }

    const normalizedRole = (targetRole || '').toLowerCase().trim();
    if (!['faculty', 'expert', 'hod'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role responsibility. Must be one of: "faculty", "expert", or "hod".'
      });
    }

    // Verify User and Subject existence in MongoDB
    const [user, subject] = await Promise.all([
      User.findById(userId),
      Subject.findById(subjectId)
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Selected User account was not found.' });
    }
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Selected Subject record was not found.' });
    }

    // Resolve Academic Year
    let resolvedYearId = academicYearId;
    if (!resolvedYearId || !mongoose.Types.ObjectId.isValid(resolvedYearId)) {
      const curYear = await AcademicYear.findOne({ isCurrent: true }) || await AcademicYear.findOne();
      if (curYear) resolvedYearId = curYear._id;
    }

    // Resolve Batch
    let resolvedBatchId = batchId;
    if (!resolvedBatchId || !mongoose.Types.ObjectId.isValid(resolvedBatchId)) {
      const defaultBatch = await Batch.findOne({ academicRegulationId: subject.academicRegulationId }) || await Batch.findOne();
      if (defaultBatch) resolvedBatchId = defaultBatch._id;
    }

    let createdAssignment = null;

    // Handle by Target Role with Strict Duplicate Prevention
    if (normalizedRole === 'faculty') {
      const existing = await FacultyAssignment.findOne({
        facultyId: userId,
        subjectId,
        batchId: resolvedBatchId,
        status: 'active'
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Duplicate Assignment: Faculty ${user.name} is already actively assigned to ${subject.subjectCode} (${subject.subjectName}) for this batch.`
        });
      }

      createdAssignment = await FacultyAssignment.create({
        facultyId: userId,
        subjectId,
        batchId: resolvedBatchId,
        academicYearId: resolvedYearId,
        assignedBy: req.user._id,
        status: 'active'
      });
    } else if (normalizedRole === 'expert') {
      const existing = await ExpertAssignment.findOne({
        expertId: userId,
        subjectId,
        status: 'active'
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Duplicate Assignment: Expert reviewer ${user.name} is already actively assigned to evaluate ${subject.subjectCode} (${subject.subjectName}).`
        });
      }

      createdAssignment = await ExpertAssignment.create({
        expertId: userId,
        subjectId,
        academicYearId: resolvedYearId,
        assignedBy: req.user._id,
        status: 'active'
      });
    } else if (normalizedRole === 'hod') {
      const existing = await HodAssignment.findOne({
        hodId: userId,
        subjectId,
        status: 'active'
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Duplicate Assignment: HOD ${user.name} is already actively assigned to oversee ${subject.subjectCode} (${subject.subjectName}).`
        });
      }

      createdAssignment = await HodAssignment.create({
        hodId: userId,
        subjectId,
        department: department || subject.department || user.department || 'Master of Computer Applications (MCA)',
        academicYearId: resolvedYearId,
        batchId: resolvedBatchId,
        assignedBy: req.user._id,
        status: 'active'
      });
    }

    // Audit Logging
    await logAudit(
      req,
      'ADMIN_SUBJECT_ASSIGNED',
      'subject_assignments',
      createdAssignment._id,
      {
        assignedUser: user.email,
        assignedUserName: user.name,
        role: normalizedRole,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName
      }
    );

    // Real-time In-App Notification to Assigned User
    await sendNotification({
      recipientId: user._id,
      title: `New Subject Responsibility Assigned: ${subject.subjectCode}`,
      message: `Administrator has assigned you as ${normalizedRole.toUpperCase()} for "${subject.subjectName}" (${subject.subjectCode}).`,
      type: 'subject_assignment'
    });

    res.status(201).json({
      success: true,
      message: `Successfully assigned ${normalizedRole.toUpperCase()} responsibility for ${subject.subjectCode} to ${user.name}.`,
      assignment: createdAssignment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Remove Subject Assignment (Deactivate)
const removeSubjectAssignment = async (req, res) => {
  try {
    const { role, id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Valid Assignment ID is required.' });
    }

    const normalizedRole = (role || '').toLowerCase();
    let record = null;

    if (normalizedRole === 'faculty') {
      record = await FacultyAssignment.findById(id).populate('facultyId', 'name email').populate('subjectId', 'subjectCode');
      if (record) await FacultyAssignment.findByIdAndDelete(id);
    } else if (normalizedRole === 'expert') {
      record = await ExpertAssignment.findById(id).populate('expertId', 'name email').populate('subjectId', 'subjectCode');
      if (record) await ExpertAssignment.findByIdAndDelete(id);
    } else if (normalizedRole === 'hod') {
      record = await HodAssignment.findById(id).populate('hodId', 'name email').populate('subjectId', 'subjectCode');
      if (record) await HodAssignment.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid assignment role type.' });
    }

    if (!record) {
      return res.status(404).json({ success: false, message: 'Assignment record not found.' });
    }

    await logAudit(
      req,
      'ADMIN_SUBJECT_ASSIGNMENT_REMOVED',
      'subject_assignments',
      id,
      { role: normalizedRole, id }
    );

    res.status(200).json({
      success: true,
      message: `Subject assignment removed successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSystemMetrics,
  getAllUsers,
  toggleUserStatus,
  updateUserRole,
  approveUser,
  rejectUser,
  deleteUser,
  getAuditLogs,
  getSubjectAssignments,
  getAssignmentOptions,
  assignSubjectResponsibility,
  removeSubjectAssignment
};
