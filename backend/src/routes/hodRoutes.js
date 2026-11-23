const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPendingApprovals,
  submitApproval,
  getApprovalHistory,
  listRegulations,
  getRegulationById,
  listAcademicYears,
  listBatches,
  listSemesters,
  listSubjects
} = require('../controllers/hodController');
const { getDocumentDetails } = require('../controllers/facultyController');

// All HOD routes require authentication and authorized Head of Department (HOD) role ONLY
router.use(protect);
router.use(authorize('hod'));

// Document Approvals (Primary & Exclusive HOD Academic Responsibility)
router.get('/pending-approvals', getPendingApprovals);
router.get('/documents/:id', getDocumentDetails);
router.post('/approve/:documentId', submitApproval);
router.get('/approval-history', getApprovalHistory);

// Read-Only Curriculum Context for Approval Reference
router.get('/regulations', listRegulations);
router.get('/regulations/:id', getRegulationById);
router.get('/academic-years', listAcademicYears);
router.get('/batches', listBatches);
router.get('/semesters', listSemesters);
router.get('/subjects', listSubjects);

module.exports = router;
