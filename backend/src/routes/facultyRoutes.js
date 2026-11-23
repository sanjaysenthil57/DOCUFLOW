const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
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
} = require('../controllers/facultyController');

router.use(protect);
router.use(authorize('faculty', 'expert'));

// 1. Metadata for Cascaded Form Selectors (Regulations, Semesters, Languages, Batches)
router.get('/metadata', getFacultyCurriculumMetadata);

// 2. Faculty Teaching Subjects & Subject Catalog
router.get('/subjects', getMySubjects);
router.get('/assigned-subjects', getMyAssignedSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// 3. Document Upload & Management
router.post('/upload', upload.single('file'), uploadDocument);
router.post('/reupload/:documentId', upload.single('file'), reuploadDocument);
router.get('/my-documents', getMyDocuments);
router.get('/documents/:id', getDocumentDetails);
router.put('/documents/:id', updateDocumentMetadata);
router.delete('/documents/:id', deleteDocument);

module.exports = router;
