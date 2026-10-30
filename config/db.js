const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Enquiry = require('../models/Enquiry');
const ChatSession = require('../models/ChatSession');

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yuvi_decoration';

  if (uri.includes('<PASSWORD>') || uri.includes('<YOUR_CLUSTER_HOST>') || uri.includes('<password>')) {
    console.log(`\n🍃 [MongoDB Setup Info] MONGODB_URI is set, but contains placeholders (<PASSWORD> / <YOUR_CLUSTER_HOST>).`);
    console.log(`👉 Please update .env with your actual MongoDB Atlas password and cluster address.`);
    console.log(`🚀 [Auto-Fallback] Active! Server will use high-performance local JSON storage seamlessly.\n`);
    isConnected = false;
    return false;
  }

  try {
    console.log(`\n🍃 Attempting to connect to MongoDB...`);
    
    // Connect with a reasonable timeout so server boots instantly even if offline
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000, // 4-second timeout
      connectTimeoutMS: 5000
    });

    isConnected = true;
    console.log(`✅ [MongoDB Connected] Database: ${mongoose.connection.name}`);
    console.log(`🍃 Host: ${mongoose.connection.host}`);

    // Auto-seed initial 60 services/packages if collection is empty
    await seedServicesIfEmpty();
    await seedBookingsIfEmpty();
    await seedEnquiriesIfEmpty();
    await seedChatsIfEmpty();

    return true;
  } catch (err) {
    isConnected = false;
    console.log(`⚠️  [MongoDB Notice] Could not connect to MongoDB at: ${uri}`);
    console.log(`ℹ️  Reason: ${err.message}`);
    console.log(`🚀 [Auto-Fallback] Active! Server will use high-performance local JSON storage seamlessly.`);
    console.log(`💡 Tip: To connect MongoDB Cloud (Atlas), add your connection string to .env:\n    MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/yuvi_decoration\n`);
    return false;
  }
}

// Auto-seed 60 decoration packages from services.json into MongoDB
async function seedServicesIfEmpty() {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      const servicesPath = path.join(__dirname, '..', 'data', 'services.json');
      if (fs.existsSync(servicesPath)) {
        const raw = fs.readFileSync(servicesPath, 'utf8');
        const servicesData = JSON.parse(raw);
        if (Array.isArray(servicesData) && servicesData.length > 0) {
          await Service.insertMany(servicesData);
          console.log(`📦 [Auto-Seeded] ${servicesData.length} decoration packages imported into MongoDB!`);
        }
      }
    }
  } catch (seedErr) {
    console.error('Error auto-seeding services to MongoDB:', seedErr.message);
  }
}

// Auto-seed existing bookings if collection is empty
async function seedBookingsIfEmpty() {
  try {
    const count = await Booking.countDocuments();
    if (count === 0) {
      const bookingsPath = path.join(__dirname, '..', 'data', 'bookings.json');
      if (fs.existsSync(bookingsPath)) {
        const raw = fs.readFileSync(bookingsPath, 'utf8');
        const bookingsData = JSON.parse(raw);
        if (Array.isArray(bookingsData) && bookingsData.length > 0) {
          await Booking.insertMany(bookingsData);
          console.log(`📋 [Auto-Seeded] ${bookingsData.length} existing bookings imported into MongoDB!`);
        }
      }
    }
  } catch (seedErr) {
    console.error('Error auto-seeding bookings to MongoDB:', seedErr.message);
  }
}

// Auto-seed existing enquiries if collection is empty
async function seedEnquiriesIfEmpty() {
  try {
    const count = await Enquiry.countDocuments();
    if (count === 0) {
      const enquiriesPath = path.join(__dirname, '..', 'data', 'enquiries.json');
      if (fs.existsSync(enquiriesPath)) {
        const raw = fs.readFileSync(enquiriesPath, 'utf8');
        const enquiriesData = JSON.parse(raw);
        if (Array.isArray(enquiriesData) && enquiriesData.length > 0) {
          await Enquiry.insertMany(enquiriesData);
          console.log(`✉️ [Auto-Seeded] ${enquiriesData.length} enquiries imported into MongoDB!`);
        }
      }
    }
  } catch (seedErr) {
    console.error('Error auto-seeding enquiries to MongoDB:', seedErr.message);
  }
}

// Auto-seed existing chat sessions if collection is empty
async function seedChatsIfEmpty() {
  try {
    const count = await ChatSession.countDocuments();
    if (count === 0) {
      const chatsPath = path.join(__dirname, '..', 'data', 'chats.json');
      if (fs.existsSync(chatsPath)) {
        const raw = fs.readFileSync(chatsPath, 'utf8');
        const chatsData = JSON.parse(raw);
        if (Array.isArray(chatsData) && chatsData.length > 0) {
          await ChatSession.insertMany(chatsData);
          console.log(`💬 [Auto-Seeded] ${chatsData.length} chat sessions imported into MongoDB!`);
        }
      }
    }
  } catch (seedErr) {
    console.error('Error auto-seeding chats to MongoDB:', seedErr.message);
  }
}

// Listen for connection events
mongoose.connection.on('connected', () => {
  isConnected = true;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.log('⚠️ MongoDB error:', err.message);
});

module.exports = {
  connectDB,
  isDbConnected: () => isConnected,
  getDbStatus: () => ({
    type: isConnected ? 'MongoDB' : 'Local JSON Fallback',
    connected: isConnected,
    database: isConnected ? mongoose.connection.name : 'local_storage',
    host: isConnected ? mongoose.connection.host : 'localhost'
  }),
  models: {
    Service,
    Booking,
    Enquiry,
    ChatSession
  }
};
