const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    default: ''
  },
  eventType: {
    type: String,
    required: true
  },
  eventDate: {
    type: String,
    required: true
  },
  eventTime: {
    type: String,
    default: 'Flexible'
  },
  venueAddress: {
    type: String,
    default: ''
  },
  budget: {
    type: String,
    default: '₹2,500 - ₹5,000'
  },
  packageId: {
    type: String,
    default: 'custom'
  },
  packageName: {
    type: String,
    default: 'Custom Event Decoration'
  },
  colorTheme: {
    type: String,
    default: 'Gold & Luxury Black'
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  estimatedAmount: {
    type: Number,
    default: 2499
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
