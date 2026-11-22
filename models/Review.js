const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: 'Patna'
  },
  eventType: {
    type: String,
    default: 'Birthday Party'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  verified: {
    type: Boolean,
    default: true
  },
  approved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', ReviewSchema);
