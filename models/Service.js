const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  categoryLabel: {
    type: String,
    default: 'Custom Occasion'
  },
  priceStart: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    default: 5.0
  },
  reviewCount: {
    type: Number,
    default: 1
  },
  badge: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  features: {
    type: [String],
    default: []
  },
  image: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
