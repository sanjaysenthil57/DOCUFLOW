const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

// All Admin routes require authentication and authorized Administrator role
router.use(protect);
router.use(authorize('admin'));

// System Telemetry
router.get('/metrics', getSystemMetrics);

// User & Role Management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/approve', approveUser);
router.post('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);
router.post('/users/:id/reject', rejectUser);
router.delete('/users/:id', deleteUser);

// Audit Trail
router.get('/audit-logs', getAuditLogs);

// Subject Assignment Management (Exclusive Admin Responsibility)
router.get('/subject-assignments', getSubjectAssignments);
router.get('/assignment-options', getAssignmentOptions);
router.post('/assign-subject', assignSubjectResponsibility);
router.delete('/subject-assignments/:role/:id', removeSubjectAssignment);

module.exports = router;
