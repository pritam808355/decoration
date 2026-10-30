const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    default: 'user'
  },
  role: {
    type: String,
    default: 'user'
  },
  text: {
    type: String,
    required: true
  },
  time: {
    type: String,
    default: ''
  },
  timestamp: {
    type: String,
    default: () => new Date().toISOString()
  }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  startedAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  lastMessageAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  summary: {
    type: String,
    default: 'Customer Inquiry'
  },
  messages: {
    type: [chatMessageSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
