const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAssignedDocuments,
  submitReview,
  getMyReviewHistory
} = require('../controllers/expertController');
const { getDocumentDetails } = require('../controllers/facultyController');

router.use(protect);
router.use(authorize('expert', 'faculty'));

router.get('/assigned-documents', getAssignedDocuments);
router.get('/documents/:id', getDocumentDetails);
router.post('/review/:documentId', submitReview);
router.get('/review-history', getMyReviewHistory);

module.exports = router;
