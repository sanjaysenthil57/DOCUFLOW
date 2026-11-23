const express = require('express');
const router = express.Router();
const {
  login,
  register,
  googleAuth,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/change-password', protect, changePassword);

module.exports = router;
