const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  institutionalId: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@(kongu\.edu|docuflow\.edu)$/i, 'Only valid institutional email addresses ending in @kongu.edu or @docuflow.edu are permitted']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  year: {
    type: Number,
    min: 1,
    max: 5
  },
  semester: {
    type: Number,
    min: 1,
    max: 10
  },
  password: {
    type: String,
    required: function() { return this.authProvider !== 'google'; },
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'faculty', 'expert', 'hod', 'student'],
    required: [true, 'Role is required']
  },
  requestedRole: {
    type: String,
    enum: ['admin', 'student', 'faculty', 'expert', 'hod', 'none'],
    default: 'none'
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    select: false
  },
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  passwordResetTicket: {
    type: String,
    select: false
  },
  passwordResetCode: {
    type: String,
    select: false
  },
  department: {
    type: String,
    default: 'Master of Computer Applications (MCA)',
    trim: true
  },
  expertise: [{
    type: String,
    trim: true
  }],
  workspaces: [{
    type: String,
    enum: ['faculty', 'expert', 'reviewer'],
    default: ['faculty', 'expert', 'reviewer']
  }],
  maxWorkload: {
    type: Number,
    default: 5
  },
  currentWorkload: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'users'
});

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
