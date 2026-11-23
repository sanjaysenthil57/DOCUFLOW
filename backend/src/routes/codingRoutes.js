const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getLanguages,
  getQuestions,
  createQuestion,
  getQuestionById,
  runCode,
  submitCode,
  askAiCodingHelp,
  getMySubmissions
} = require('../controllers/codingController');

// All authenticated roles can practice coding (primarily student and faculty)
router.use(protect);

router.get('/languages', getLanguages);
router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.get('/questions/:id', getQuestionById);
router.post('/run', runCode);
router.post('/submit', submitCode);
router.post('/ai-help', askAiCodingHelp);
router.get('/my-submissions', getMySubmissions);

module.exports = router;
