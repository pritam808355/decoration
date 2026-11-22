const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'business_config'
  },
  festiveBanner: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: '🎉 FESTIVE CELEBRATION SALE IN PATNA!' },
    subtitle: { type: String, default: 'Get Flat 15% OFF on Bookings Above ₹2,999. Use Code: FESTIVE15' },
    couponCode: { type: String, default: 'FESTIVE15' },
    badge: { type: String, default: 'LIMITED TIME OFFER' }
  },
  upiDetails: {
    upiId: { type: String, default: 'partyhard@upi' },
    payeeName: { type: String, default: 'Yuvi Decoration Patna' },
    tokenAdvance: { type: Number, default: 500 }
  },
  serviceAreas: [{
    name: String,
    pincode: String,
    available: Boolean,
    expressHours: Number,
    deliveryCharge: Number
  }],
  referralProgram: {
    rewardAmount: { type: Number, default: 200 },
    minOrder: { type: Number, default: 1999 },
    terms: { type: String, default: 'Your friend gets ₹200 OFF on their 1st booking, and you get ₹200 OFF on your next celebration!' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema);
