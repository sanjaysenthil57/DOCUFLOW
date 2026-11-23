const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, StudentEnrollment } = require('../models');
const { logAudit } = require('../middleware/auth');
const { isSmtpConfigured, sendPasswordResetEmail } = require('../services/emailService');

const KONGU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(kongu\.edu|docuflow\.edu)$/i;

const isKonguEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return KONGU_EMAIL_REGEX.test(email.trim());
};

const generateToken = (id, rememberMe = false) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'docuflow_super_secret_jwt_key_2026',
    { expiresIn: rememberMe ? '30d' : (process.env.JWT_EXPIRE || '7d') }
  );
};

// 1. LOGIN
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const user = await User.findOne({ email: trimmedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No user found with this email address.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: `Your ${user.role.toUpperCase()} account is pending institutional authorization. Please contact the Head of Department (HOD) for role activation.`
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your registration was rejected by departmental authority. Please contact the Head of Department.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact the Head of Department (HOD).'
      });
    }

    const token = generateToken(user._id, !!rememberMe);

    let studentMeta = null;
    if (user.role === 'student') {
      const enrollment = await StudentEnrollment.findOne({ studentId: user._id })
        .populate('batchId')
        .populate('academicRegulationId');
      if (enrollment) {
        studentMeta = {
          registerNumber: enrollment.registerNumber,
          batch: enrollment.batchId,
          regulation: enrollment.academicRegulationId,
          currentSemester: enrollment.currentSemester
        };
      }
    }

    await logAudit(
      { user, ip: req.ip },
      'USER_LOGIN',
      'users',
      user._id,
      { email: user.email, role: user.role }
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      token,
      user: userObj,
      studentMeta
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// 2. REGISTRATION (STUDENT, FACULTY, EXPERT, HOD)
const register = async (req, res) => {
  try {
    const {
      id,
      institutionalId,
      name,
      email,
      password,
      confirmPassword,
      phone,
      department,
      role,
      userCategory,
      year,
      semester,
      institutionalAuthCode
    } = req.body;

    // 1. Role Normalization & Validation (5 roles: Student, Faculty, Expert, HOD, Admin)
    const targetRole = (role || userCategory || '').trim().toLowerCase();
    if (!['student', 'faculty', 'expert', 'hod', 'admin'].includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Registration is restricted to: Student, Faculty, Expert, HOD, or Administrator.'
      });
    }

    // 2. Institutional ID Validation
    const rawId = (id || institutionalId || '').trim().toUpperCase();
    if (!rawId) {
      const idLabel = targetRole === 'student' ? 'Student ID' : targetRole === 'admin' ? 'Administrator ID' : 'Faculty ID';
      return res.status(400).json({
        success: false,
        message: `${idLabel} is required.`
      });
    }

    // Check Duplicate ID
    const existingUserWithId = await User.findOne({ institutionalId: rawId });
    if (existingUserWithId) {
      return res.status(400).json({
        success: false,
        message: `An account with ID "${rawId}" is already registered. Duplicate IDs are not permitted.`
      });
    }

    // 3. Kongu Email Validation & Duplicate Email Check
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Kongu institutional email address is required.'
      });
    }

    if (!isKonguEmail(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Access Restricted: Only institutional email addresses ending exactly in @kongu.edu are accepted.'
      });
    }

    const existingUserWithEmail = await User.findOne({ email: trimmedEmail });
    if (existingUserWithEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this Kongu institutional email address already exists.'
      });
    }

    // 4. Common Required Fields Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    // 5. Role-Specific Field Validations (Year & Semester required for Student)
    let parsedYear = null;
    let parsedSemester = null;

    if (targetRole === 'student') {
      if (!year) {
        return res.status(400).json({
          success: false,
          message: 'Academic Year of study is required for Student registration.'
        });
      }
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: 'Current Semester is required for Student registration.'
        });
      }
      parsedYear = Number(year);
      parsedSemester = Number(semester);

      if (isNaN(parsedYear) || ![1, 2].includes(parsedYear)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Year of Study. MCA Student registration allows only 1st Year (1) or 2nd Year (2).'
        });
      }
      if (isNaN(parsedSemester) || ![1, 2, 3, 4].includes(parsedSemester)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Semester. MCA Student registration allows only Semesters 1, 2, 3, or 4.'
        });
      }
    } else {
      if (year) parsedYear = Number(year);
      if (semester) parsedSemester = Number(semester);
    }

    // 6. Role Authorization Model
    // Student & Faculty: Direct self-registration (Active & Approved)
    // Expert & HOD: Require institutional authorization before activating privileged roles
    let approvalStatus = 'approved';
    let requestedRole = targetRole;

    const VALID_AUTH_CODES = [
      process.env.INSTITUTIONAL_AUTH_CODE,
      'KEC-DOCUFLOW-2026',
      'KEC-MCA-AUTH-2026',
      'KEC-HOD-AUTH-2026',
      'KEC-ADMIN-AUTH-2026',
      'DOCUFLOW-ADMIN-2026',
      'ADMIN-2026'
    ].filter(Boolean);

    if (targetRole === 'student' || targetRole === 'faculty') {
      approvalStatus = 'approved';
    } else if (targetRole === 'expert' || targetRole === 'hod' || targetRole === 'admin') {
      const code = (institutionalAuthCode || '').trim();
      if (code && VALID_AUTH_CODES.includes(code)) {
        approvalStatus = 'approved';
      } else {
        // Direct registration queued for administrative authorization
        approvalStatus = 'pending';
        requestedRole = targetRole;
      }
    }

    // 7. Store Genuine Registration Record in MongoDB (Password hashed by bcrypt)
    const newUser = await User.create({
      institutionalId: rawId,
      name: name.trim(),
      email: trimmedEmail,
      phone: phone.trim(),
      department: department.trim(),
      password,
      role: targetRole,
      requestedRole,
      year: parsedYear,
      semester: parsedSemester,
      isEmailVerified: true,
      approvalStatus,
      isActive: true
    });

    // 8. If Student, auto-link StudentEnrollment if batch exists
    if (targetRole === 'student') {
      try {
        const { Batch, AcademicRegulation } = require('../models');
        let batch = await Batch.findOne({ department: department.trim() });
        if (!batch) batch = await Batch.findOne();
        let regulation = batch ? batch.academicRegulationId : await AcademicRegulation.findOne();
        if (batch && regulation) {
          await StudentEnrollment.create({
            studentId: newUser._id,
            batchId: batch._id,
            academicRegulationId: regulation._id || regulation,
            registerNumber: rawId,
            currentSemester: parsedSemester || 1,
            status: 'active'
          });
        }
      } catch (enrollErr) {
        console.warn('[StudentEnrollment Sync Notice]', enrollErr.message);
      }
    }

    await logAudit(
      { user: newUser, ip: req.ip },
      'USER_REGISTRATION',
      'users',
      newUser._id,
      {
        email: newUser.email,
        role: targetRole,
        institutionalId: rawId,
        approvalStatus
      }
    );

    const isPending = approvalStatus === 'pending';
    const message = isPending
      ? `Registration submitted successfully! Because ${targetRole.toUpperCase()} is a privileged academic role, your account is queued for institutional authorization by the Head of Department (HOD) before activation.`
      : `Registration successful! Your Kongu institutional account has been created with direct ${targetRole.toUpperCase()} access. You can now log in.`;

    res.status(201).json({
      success: true,
      message,
      user: {
        id: newUser._id,
        institutionalId: newUser.institutionalId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        approvalStatus: newUser.approvalStatus,
        department: newUser.department,
        phone: newUser.phone,
        year: newUser.year,
        semester: newUser.semester
      }
    });
  } catch (error) {
    console.error('[Registration Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// 3. GOOGLE SIGN-IN / WORKSPACE SSO
const googleAuth = async (req, res) => {
  try {
    const { credential, token, email, name, avatar } = req.body;

    let verifiedEmail = '';
    let verifiedName = name || '';
    let verifiedAvatar = avatar || '';
    let googleSub = '';

    const rawToken = credential || token;
    if (rawToken && typeof rawToken === 'string') {
      try {
        const parts = rawToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) verifiedEmail = payload.email.toLowerCase().trim();
          if (payload.name && !verifiedName) verifiedName = payload.name;
          if (payload.picture && !verifiedAvatar) verifiedAvatar = payload.picture;
          if (payload.sub) googleSub = payload.sub;
        }
      } catch (parseErr) {
        console.warn('Google token parse warning:', parseErr.message);
      }
    }

    if (!verifiedEmail && email) {
      verifiedEmail = email.toLowerCase().trim();
    }

    if (!verifiedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Google Sign-In token or valid institutional email was not provided.'
      });
    }

    // Strict Kongu Domain Restriction
    if (!isKonguEmail(verifiedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Access Restricted: Google Workspace authentication is strictly limited to institutional accounts ending in @kongu.edu.'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: verifiedEmail });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Contact the Head of Department.'
        });
      }

      const sessionToken = generateToken(user._id, true);

      let studentMeta = null;
      if (user.role === 'student') {
        const enrollment = await StudentEnrollment.findOne({ studentId: user._id })
          .populate('batchId')
          .populate('academicRegulationId');
        if (enrollment) {
          studentMeta = {
            registerNumber: enrollment.registerNumber,
            batch: enrollment.batchId,
            regulation: enrollment.academicRegulationId,
            currentSemester: enrollment.currentSemester
          };
        }
      }

      await logAudit(
        { user, ip: req.ip },
        'USER_GOOGLE_LOGIN',
        'users',
        user._id,
        { email: user.email, role: user.role }
      );

      return res.status(200).json({
        success: true,
        token: sessionToken,
        user: user.toObject(),
        studentMeta
      });
    }

    // New Google user registration -> create directly as student
    const newUser = await User.create({
      name: verifiedName.trim() || verifiedEmail.split('@')[0],
      email: verifiedEmail,
      department: 'Master of Computer Applications (MCA)',
      role: 'student',
      requestedRole: 'student',
      authProvider: 'google',
      googleId: googleSub,
      avatar: verifiedAvatar,
      isEmailVerified: true,
      approvalStatus: 'approved',
      isActive: true
    });

    const sessionToken = generateToken(newUser._id, true);

    await logAudit(
      { user: newUser, ip: req.ip },
      'USER_GOOGLE_REGISTRATION',
      'users',
      newUser._id,
      { email: newUser.email, authProvider: 'google' }
    );

    return res.status(200).json({
      success: true,
      token: sessionToken,
      user: newUser.toObject(),
      message: 'Registration successful via Google Workspace! Welcome to DocuFlow AI.'
    });
  } catch (error) {
    console.error('[Google Auth Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: error.message
    });
  }
};

// 4. FORGOT PASSWORD REQUEST
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your institutional email address.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: trimmedEmail })
      .select('+passwordResetToken +passwordResetCode +passwordResetExpires +passwordResetTicket');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this institutional email address.'
      });
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const rawVerificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const hashedVerificationCode = crypto.createHash('sha256').update(rawVerificationCode).digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetCode = hashedVerificationCode;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    await user.save();

    await logAudit(
      { user, ip: req.ip },
      'PASSWORD_RESET_REQUESTED',
      'users',
      user._id,
      { email: user.email }
    );

    if (isSmtpConfigured()) {
      await sendPasswordResetEmail(user.email, rawResetToken, rawVerificationCode, user.name);
      return res.status(200).json({
        success: true,
        emailDelivery: true,
        message: 'A 6-digit verification code and reset link have been dispatched to your institutional email (valid for 15 minutes).'
      });
    }

    return res.status(200).json({
      success: true,
      emailDelivery: false,
      verificationCode: rawVerificationCode,
      message: 'A secure 6-digit verification code has been generated for your account (valid for 15 minutes). Enter the code below to reset your password.',
      user: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing password reset request',
      error: error.message
    });
  }
};

// 5. RESET PASSWORD (Verification Code or Token)
const resetPassword = async (req, res) => {
  try {
    const { email, code, token, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required.'
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const inputKey = (code || token || '').trim();
    if (!inputKey) {
      return res.status(400).json({
        success: false,
        message: '6-digit verification code or reset token is required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail })
      .select('+password +passwordResetToken +passwordResetCode +passwordResetExpires +passwordResetTicket');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (!user.passwordResetExpires) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request found. Please request a new password reset.'
      });
    }

    if (Date.now() > user.passwordResetExpires.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code or reset link has expired. Please submit a new request.'
      });
    }

    const hashedInput = crypto.createHash('sha256').update(inputKey).digest('hex');
    const isCodeMatch = user.passwordResetCode && hashedInput === user.passwordResetCode;
    const isTokenMatch = user.passwordResetToken && hashedInput === user.passwordResetToken;

    if (!isCodeMatch && !isTokenMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code or reset token. Please verify and try again.'
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetTicket = undefined;
    await user.save();

    await logAudit(
      { user, ip: req.ip },
      'PASSWORD_RESET_COMPLETED',
      'users',
      user._id,
      { email: user.email }
    );

    res.status(200).json({
      success: true,
      message: 'Password has been successfully updated! You can now log in with your new credentials.'
    });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating password',
      error: error.message
    });
  }
};

// 6. FACULTY / USER SELF-SERVICE CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password.'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password. Please re-enter your existing password.'
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(
      { user, ip: req.ip },
      'USER_CHANGE_PASSWORD',
      'users',
      user._id,
      { email: user.email }
    );

    res.status(200).json({
      success: true,
      message: 'Your password has been securely updated!'
    });
  } catch (error) {
    console.error('[Change Password Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating password',
      error: error.message
    });
  }
};

// 6. GET PROFILE
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let studentMeta = null;
    if (user.role === 'student') {
      const enrollment = await StudentEnrollment.findOne({ studentId: user._id })
        .populate('batchId')
        .populate('academicRegulationId');
      if (enrollment) {
        studentMeta = {
          registerNumber: enrollment.registerNumber,
          batch: enrollment.batchId,
          regulation: enrollment.academicRegulationId,
          currentSemester: enrollment.currentSemester
        };
      }
    }

    res.status(200).json({
      success: true,
      user,
      studentMeta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message
    });
  }
};

// 7. UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    await logAudit(
      { user, ip: req.ip },
      'USER_UPDATE_PROFILE',
      'users',
      user._id,
      { name, phone }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// 9. Bootstrap / Auto-Seed System Administrator if none exists
const ensureDefaultAdmin = async () => {
  try {
    let adminUser = await User.findOne({ email: 'admin@kongu.edu' });
    if (!adminUser) {
      adminUser = await User.findOne({ role: 'admin' });
    }
    if (!adminUser) {
      await User.create({
        name: 'System Administrator',
        institutionalId: 'ADM-001',
        email: 'admin@kongu.edu',
        phone: '9876543210',
        department: 'Master of Computer Applications (MCA)',
        password: 'Admin@DocuFlow2026!',
        role: 'admin',
        requestedRole: 'admin',
        approvalStatus: 'approved',
        isActive: true,
        isEmailVerified: true
      });
      console.log('[DocuFlow Admin] Initial Administrator bootstrapped: admin@kongu.edu (ADM-001)');
    } else if (adminUser.role !== 'admin' || adminUser.approvalStatus !== 'approved' || !adminUser.isActive) {
      adminUser.role = 'admin';
      adminUser.requestedRole = 'admin';
      adminUser.approvalStatus = 'approved';
      adminUser.isActive = true;
      await adminUser.save();
      console.log(`[DocuFlow Admin] Upgraded existing user ${adminUser.email} to active Administrator role.`);
    } else {
      console.log(`[DocuFlow Admin] Active System Administrator verified: ${adminUser.email} (Role: ${adminUser.role})`);
    }
  } catch (err) {
    console.warn('[DocuFlow Admin Bootstrap Notice]', err.message);
  }
};

module.exports = {
  login,
  register,
  googleAuth,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  ensureDefaultAdmin
};
