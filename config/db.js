const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Enquiry = require('../models/Enquiry');
const ChatSession = require('../models/ChatSession');
const Coupon = require('../models/Coupon');
const Inventory = require('../models/Inventory');
const Staff = require('../models/Staff');
const Review = require('../models/Review');
const Setting = require('../models/Setting');

let isConnected = false;
const CLOUD_MONGODB_URI = 'mongodb+srv://pk6926459_db_user:pritam8083@cluster0.f7yszpf.mongodb.net/yuvi_decoration?retryWrites=true&w=majority';

async function connectDB() {
  let uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<PASSWORD>') || uri.includes('<YOUR_CLUSTER_HOST>') || uri.includes('<password>') || uri.includes('127.0.0.1')) {
    uri = CLOUD_MONGODB_URI;
  }

  try {
    console.log(`\n🍃 Attempting to connect to MongoDB...`);
    
    // Connect with a reasonable timeout so server boots instantly even if offline
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 6000
    });

    isConnected = true;
    console.log(`✅ [MongoDB Connected] Database: ${mongoose.connection.name}`);
    console.log(`🍃 Host: ${mongoose.connection.host}`);

    // Auto-seed and sync data into MongoDB
    await seedServicesIfEmpty();
    await seedBookingsIfEmpty();
    await seedEnquiriesIfEmpty();
    await seedChatsIfEmpty();
    await seedCouponsIfEmpty();
    await seedInventoryIfEmpty();
    await seedStaffIfEmpty();
    await seedReviewsIfEmpty();
    await seedSettingsIfEmpty();

    return true;
  } catch (err) {
    isConnected = false;
    console.log(`⚠️  [MongoDB Notice] Could not connect to MongoDB at: ${uri}`);
    console.log(`ℹ️  Reason: ${err.message}`);
    console.log(`🚀 [Auto-Fallback] Active! Server will use high-performance local JSON storage seamlessly.`);
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

// Auto-seed existing bookings and sync missing ones from JSON
async function seedBookingsIfEmpty() {
  try {
    const bookingsPath = path.join(__dirname, '..', 'data', 'bookings.json');
    if (fs.existsSync(bookingsPath)) {
      const raw = fs.readFileSync(bookingsPath, 'utf8');
      const bookingsData = JSON.parse(raw);
      if (Array.isArray(bookingsData) && bookingsData.length > 0) {
        for (const b of bookingsData) {
          const exists = await Booking.findOne({ id: b.id });
          if (!exists) {
            await Booking.create(b);
            console.log(`📋 [Auto-Synced Booking] #${b.id} (${b.customerName}) imported into MongoDB!`);
          }
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

// Auto-seed coupons from coupons.json
async function seedCouponsIfEmpty() {
  try {
    const count = await Coupon.countDocuments();
    if (count === 0) {
      const filePath = path.join(__dirname, '..', 'data', 'coupons.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          await Coupon.insertMany(data);
          console.log(`🏷️ [Auto-Seeded] ${data.length} coupons imported into MongoDB!`);
        }
      }
    }
  } catch (e) {
    console.error('Error auto-seeding coupons:', e.message);
  }
}

// Auto-seed inventory from inventory.json
async function seedInventoryIfEmpty() {
  try {
    const count = await Inventory.countDocuments();
    if (count === 0) {
      const filePath = path.join(__dirname, '..', 'data', 'inventory.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          await Inventory.insertMany(data);
          console.log(`📦 [Auto-Seeded] ${data.length} inventory items imported into MongoDB!`);
        }
      }
    }
  } catch (e) {
    console.error('Error auto-seeding inventory:', e.message);
  }
}

// Auto-seed staff from staff.json
async function seedStaffIfEmpty() {
  try {
    const count = await Staff.countDocuments();
    if (count === 0) {
      const filePath = path.join(__dirname, '..', 'data', 'staff.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          await Staff.insertMany(data);
          console.log(`👷 [Auto-Seeded] ${data.length} staff members imported into MongoDB!`);
        }
      }
    }
  } catch (e) {
    console.error('Error auto-seeding staff:', e.message);
  }
}

// Auto-seed customer reviews from reviews.json
async function seedReviewsIfEmpty() {
  try {
    const count = await Review.countDocuments();
    if (count === 0) {
      const filePath = path.join(__dirname, '..', 'data', 'reviews.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          await Review.insertMany(data);
          console.log(`⭐ [Auto-Seeded] ${data.length} customer reviews imported into MongoDB!`);
        }
      }
    }
  } catch (e) {
    console.error('Error auto-seeding reviews:', e.message);
  }
}

// Auto-seed settings from settings.json
async function seedSettingsIfEmpty() {
  try {
    const count = await Setting.countDocuments();
    if (count === 0) {
      const filePath = path.join(__dirname, '..', 'data', 'settings.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        await Setting.create({ key: 'business_config', ...data });
        console.log(`⚙️ [Auto-Seeded] Business settings imported into MongoDB!`);
      }
    }
  } catch (e) {
    console.error('Error auto-seeding settings:', e.message);
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
  isDbConnected: () => mongoose.connection.readyState === 1,
  getDbStatus: () => {
    const connected = mongoose.connection.readyState === 1;
    return {
      type: connected ? 'MongoDB Atlas' : 'Local JSON Fallback',
      connected,
      database: connected ? mongoose.connection.name : 'local_storage',
      host: connected ? mongoose.connection.host : 'localhost'
    };
  },
  models: {
    Service,
    Booking,
    Enquiry,
    ChatSession,
    Coupon,
    Inventory,
    Staff,
    Review,
    Setting
  }
};
