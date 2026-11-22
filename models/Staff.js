const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    default: 'Balloon Artist'
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  assignedAreas: {
    type: String,
    default: 'All Patna'
  },
  status: {
    type: String,
    enum: ['Available', 'On Job', 'Leave'],
    default: 'Available'
  },
  rating: {
    type: Number,
    default: 5.0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  activeOrders: [{
    bookingId: String,
    eventDate: String,
    customerName: String,
    venue: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Staff', StaffSchema);
