const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: () => new Date().toISOString()
  },
  status: {
    type: String,
    enum: ['unread', 'contacted', 'archived'],
    default: 'unread'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Enquiry', enquirySchema);
