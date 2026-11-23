const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'docuflow_super_secret_jwt_key_2026');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (!user.isActive || user.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Account is not authorized or active. Please contact the Head of Department (HOD).'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this route.`
      });
    }
    next();
  };
};

const logAudit = async (req, action, targetCollection, targetId, details = {}) => {
  try {
    if (req.user) {
      await AuditLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action,
        targetCollection,
        targetId: targetId ? String(targetId) : undefined,
        details,
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
      });
    }
  } catch (err) {
    console.error('[Audit Log Error]', err.message);
  }
};

module.exports = {
  protect,
  authorize,
  logAudit
};
