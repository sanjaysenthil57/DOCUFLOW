const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyEnrollment,
  getApprovedDocuments,
  getStudyMaterials,
  askChatbot,
  getChatbotHistory,
  clearChatbotHistory,
  getSemesterSubjects,
  promoteSemester,
  getMyLanguages
} = require('../controllers/studentController');

router.use(protect);
router.use(authorize('student'));

router.get('/enrollment', getMyEnrollment);
router.get('/approved-documents', getApprovedDocuments);
router.get('/study-materials', getStudyMaterials);
router.get('/semester-subjects', getSemesterSubjects);
router.post('/promote', promoteSemester);
router.get('/languages', getMyLanguages);
router.post('/chatbot/ask', askChatbot);
router.get('/chatbot/history', getChatbotHistory);
router.delete('/chatbot/clear', clearChatbotHistory);

module.exports = router;
