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
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  estimatedAmount: {
    type: Number,
    default: 2499
  },
  advanceAmount: {
    type: Number,
    default: 0
  },
  remainingBalance: {
    type: Number,
    default: 2499
  },
  paymentMethod: {
    type: String,
    default: 'Cash on Setup'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'advance_paid', 'completed'],
    default: 'pending'
  },
  receiptUrl: {
    type: String,
    default: ''
  },
  receiptGeneratedAt: {
    type: Date
  },
  whatsappStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'not_configured'],
    default: 'pending'
  },
  whatsappMessageId: {
    type: String,
    default: ''
  },
  whatsappSentAt: {
    type: Date
  },
  whatsappError: {
    type: String,
    default: ''
  },
  adminNotified: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    default: ''
  },
  assignedStaffId: {
    type: String,
    default: ''
  },
  assignedStaffName: {
    type: String,
    default: ''
  },
  couponApplied: {
    type: String,
    default: ''
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  rescheduledCount: {
    type: Number,
    default: 0
  },
  cancelledReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
