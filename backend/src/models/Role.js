const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['faculty', 'expert', 'hod', 'student'],
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  permissions: [{
    type: String
  }]
}, {
  timestamps: true,
  collection: 'roles'
});

module.exports = mongoose.model('Role', roleSchema);
