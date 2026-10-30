const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// MongoDB Connection & Mongoose Models
const { connectDB, isDbConnected, getDbStatus, models } = require('./config/db');
const { Service, Booking, Enquiry, ChatSession } = models;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Dedicated Booking Page Route
app.get('/book', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

// Connect to MongoDB asynchronously on startup (with graceful fallback)
connectDB().catch(err => {
  console.log('MongoDB initialization notice:', err.message);
});

// Helper file paths (For Local JSON storage & backup fallback)
const DATA_DIR = path.join(__dirname, 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');

// Helper to safely read JSON
function readJson(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultVal;
  }
}

// Helper to safely write JSON
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Generate unique booking id: TPH-2026-XXXX (The Party Hard)
function generateBookingId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TPH-${year}-${randomNum}`;
}

// --- SYSTEM & DATABASE HEALTH ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: getDbStatus()
  });
});

app.get('/api/db-status', (req, res) => {
  res.json(getDbStatus());
});

// --- API ROUTES ---

// 1. Get all services (from MongoDB or Local JSON fallback)
app.get('/api/services', async (req, res) => {
  const { category } = req.query;

  if (isDbConnected()) {
    try {
      const filter = (category && category !== 'all') 
        ? { category: new RegExp(`^${category}$`, 'i') } 
        : {};
      const services = await Service.find(filter).lean();
      if (services && services.length > 0) {
        return res.json(services);
      }
    } catch (dbErr) {
      console.error('MongoDB find services error:', dbErr.message);
    }
  }

  // Fallback to local JSON file
  const services = readJson(SERVICES_FILE);
  if (category && category !== 'all') {
    const filtered = services.filter(s => s.category.toLowerCase() === category.toLowerCase());
    return res.json(filtered);
  }
  res.json(services);
});

// 2. Get service by ID
app.get('/api/services/:id', async (req, res) => {
  if (isDbConnected()) {
    try {
      const item = await Service.findOne({ id: req.params.id }).lean();
      if (item) return res.json(item);
    } catch (dbErr) {
      console.error('MongoDB find service error:', dbErr.message);
    }
  }

  const services = readJson(SERVICES_FILE);
  const item = services.find(s => s.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Service not found' });
  res.json(item);
});

// 3. Create a new booking
app.post('/api/bookings', async (req, res) => {
  const {
    customerName,
    mobile,
    email,
    eventType,
    eventDate,
    eventTime,
    venueAddress,
    budget,
    packageId,
    packageName,
    colorTheme,
    notes
  } = req.body;

  if (!customerName || !mobile || !eventType || !eventDate) {
    return res.status(400).json({ error: 'Name, mobile, event type, and date are required.' });
  }

  const bookings = readJson(BOOKINGS_FILE);
  const newBooking = {
    id: generateBookingId(),
    customerName: customerName.trim(),
    mobile: mobile.trim(),
    email: (email || '').trim(),
    eventType,
    eventDate,
    eventTime: eventTime || 'Flexible',
    venueAddress: (venueAddress || '').trim(),
    budget: budget || '₹2,500 - ₹5,000',
    packageId: packageId || 'custom',
    packageName: packageName || 'Custom Event Decoration',
    colorTheme: colorTheme || 'Gold & Luxury Black',
    notes: (notes || '').trim(),
    status: 'pending', // pending, confirmed, completed, cancelled
    estimatedAmount: 2499,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Find price if package matched (check MongoDB first, fallback to JSON)
  if (isDbConnected() && packageId && packageId !== 'custom') {
    try {
      const dbService = await Service.findOne({ id: packageId }).lean();
      if (dbService && dbService.priceStart) {
        newBooking.estimatedAmount = dbService.priceStart;
      }
    } catch (e) {}
  }

  if (!newBooking.estimatedAmount || newBooking.estimatedAmount === 2499) {
    const services = readJson(SERVICES_FILE);
    const matchedService = services.find(s => s.id === packageId);
    if (matchedService) {
      newBooking.estimatedAmount = matchedService.priceStart;
    }
  }

  // Save to MongoDB if connected
  if (isDbConnected()) {
    try {
      await Booking.create(newBooking);
    } catch (dbErr) {
      console.error('MongoDB save booking error:', dbErr.message);
    }
  }

  // Keep local JSON in sync
  bookings.unshift(newBooking);
  writeJson(BOOKINGS_FILE, bookings);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully!',
    booking: newBooking
  });
});

// 4. Track booking by ID, Phone, or Name (Super smart matching from ANY phone & MongoDB + local fallback)
app.get('/api/bookings/track/:query', async (req, res) => {
  const rawQuery = (req.params.query || '').trim();
  const queryLower = rawQuery.toLowerCase();
  const digitsOnly = rawQuery.replace(/\D/g, '');
  const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
  const alphanumericOnly = rawQuery.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const allMatched = [];

  // 1. Check MongoDB first if connected
  if (isDbConnected()) {
    try {
      const orConditions = [];

      // Exact ID or normalized ID match
      orConditions.push({ id: new RegExp(rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      if (alphanumericOnly.length >= 3) {
        orConditions.push({ id: new RegExp(alphanumericOnly, 'i') });
      }

      // If user typed digits (phone or booking number like 8708)
      if (digitsOnly.length >= 4) {
        orConditions.push({ id: new RegExp(digitsOnly, 'i') });
        orConditions.push({ mobile: new RegExp(last10Digits, 'i') });
        orConditions.push({ mobile: new RegExp(digitsOnly, 'i') });
      }

      // Customer name match
      if (rawQuery.length >= 3 && !/^\d+$/.test(rawQuery)) {
        orConditions.push({ customerName: new RegExp(rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      }

      if (orConditions.length > 0) {
        const dbMatched = await Booking.find({ $or: orConditions }).sort({ createdAt: -1 }).lean();
        if (dbMatched && dbMatched.length > 0) {
          allMatched.push(...dbMatched);
        }
      }
    } catch (dbErr) {
      console.error('MongoDB track booking error:', dbErr.message);
    }
  }

  // 2. Also check local JSON (and merge any bookings not in MongoDB)
  const bookings = readJson(BOOKINGS_FILE);
  const localMatched = bookings.filter(b => {
    const bId = (b.id || '').toLowerCase();
    const bIdClean = bId.replace(/[^a-zA-Z0-9]/g, '');
    const bPhoneClean = (b.mobile || '').replace(/\D/g, '');
    const bName = (b.customerName || '').toLowerCase();

    // ID Match (substring or exact)
    if (bId.includes(queryLower) || queryLower.includes(bId) || bIdClean.includes(alphanumericOnly) || alphanumericOnly.includes(bIdClean)) {
      return true;
    }
    // Digits match (e.g. 8708, or phone number)
    if (digitsOnly.length >= 4) {
      if (bId.includes(digitsOnly)) return true;
      if (bPhoneClean.includes(digitsOnly) || digitsOnly.includes(bPhoneClean)) return true;
      if (last10Digits.length >= 7 && bPhoneClean.includes(last10Digits)) return true;
    }
    // Customer Name match
    if (rawQuery.length >= 3 && bName.includes(queryLower)) {
      return true;
    }

    return false;
  });

  localMatched.forEach(b => {
    if (!allMatched.some(m => (m.id || '').toLowerCase() === (b.id || '').toLowerCase())) {
      allMatched.push(b);
    }
  });

  if (allMatched.length === 0) {
    return res.status(404).json({ error: 'No booking found matching the provided ID or Mobile number.' });
  }

  res.json(allMatched);
});

// 5. Contact Enquiry
app.post('/api/contact', async (req, res) => {
  const { name, phone, email, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  const enquiries = readJson(ENQUIRIES_FILE);
  const newEnquiry = {
    id: `ENQ-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    phone: phone.trim(),
    email: (email || '').trim(),
    message: (message || '').trim(),
    date: new Date().toISOString(),
    status: 'unread'
  };

  if (isDbConnected()) {
    try {
      await Enquiry.create(newEnquiry);
    } catch (dbErr) {
      console.error('MongoDB save enquiry error:', dbErr.message);
    }
  }

  enquiries.unshift(newEnquiry);
  writeJson(ENQUIRIES_FILE, enquiries);

  res.status(201).json({ success: true, message: 'Enquiry received! Our team will contact you shortly.' });
});

// 6. Admin Authentication (Loaded from .env)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'partyhard2707@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yuvi@2026';

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const inputUser = (username || '').trim().toLowerCase();

  // Allows logging in with owner email (partyhard2707@gmail.com) or legacy username 'admin'
  if ((inputUser === ADMIN_EMAIL || inputUser === 'admin') && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      token: 'yuvi-admin-secret-session-token-' + Date.now(),
      admin: { email: ADMIN_EMAIL, role: 'Owner' }
    });
  }
  return res.status(401).json({ error: 'Invalid email or password' });
});

// 7. Admin Bookings & Stats
app.get('/api/admin/bookings', async (req, res) => {
  let bookings = [];

  if (isDbConnected()) {
    try {
      const dbBookings = await Booking.find().sort({ createdAt: -1 }).lean();
      if (dbBookings && dbBookings.length > 0) {
        bookings = dbBookings;
      }
    } catch (dbErr) {
      console.error('MongoDB fetch admin bookings error:', dbErr.message);
    }
  }

  if (bookings.length === 0) {
    bookings = readJson(BOOKINGS_FILE);
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    estimatedRevenue: bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (Number(b.estimatedAmount) || 2500), 0)
  };
  res.json({ stats, bookings });
});

// 8. Update booking status
app.patch('/api/admin/bookings/:id/status', async (req, res) => {
  const { status, notes } = req.body;
  const bookings = readJson(BOOKINGS_FILE);
  const booking = bookings.find(b => b.id === req.params.id);

  if (isDbConnected()) {
    try {
      const updateData = { updatedAt: new Date().toISOString() };
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.adminNotes = notes;
      await Booking.findOneAndUpdate({ id: req.params.id }, { $set: updateData });
    } catch (dbErr) {
      console.error('MongoDB update booking status error:', dbErr.message);
    }
  }

  if (!booking && !isDbConnected()) return res.status(404).json({ error: 'Booking not found' });

  if (booking) {
    if (status) booking.status = status;
    if (notes !== undefined) booking.adminNotes = notes;
    booking.updatedAt = new Date().toISOString();
    writeJson(BOOKINGS_FILE, bookings);
    return res.json({ success: true, booking });
  }

  const updatedBooking = isDbConnected() ? await Booking.findOne({ id: req.params.id }).lean() : null;
  res.json({ success: true, booking: updatedBooking || { id: req.params.id, status, adminNotes: notes } });
});

// 9. Delete booking
app.delete('/api/admin/bookings/:id', async (req, res) => {
  if (isDbConnected()) {
    try {
      await Booking.findOneAndDelete({ id: req.params.id });
    } catch (dbErr) {
      console.error('MongoDB delete booking error:', dbErr.message);
    }
  }

  let bookings = readJson(BOOKINGS_FILE);
  bookings = bookings.filter(b => b.id !== req.params.id);
  writeJson(BOOKINGS_FILE, bookings);
  res.json({ success: true, message: 'Booking deleted' });
});

// 10. Admin enquiries
app.get('/api/admin/enquiries', async (req, res) => {
  if (isDbConnected()) {
    try {
      const dbEnquiries = await Enquiry.find().sort({ createdAt: -1 }).lean();
      if (dbEnquiries && dbEnquiries.length > 0) {
        return res.json(dbEnquiries);
      }
    } catch (dbErr) {
      console.error('MongoDB fetch enquiries error:', dbErr.message);
    }
  }

  const enquiries = readJson(ENQUIRIES_FILE);
  res.json(enquiries);
});

// 10b. Admin: Add New Decoration Package
app.post('/api/admin/services', async (req, res) => {
  const { title, category, priceStart, description, features, image, badge, tags } = req.body;
  if (!title || !category || !priceStart) {
    return res.status(400).json({ error: 'Title, category, and price are required.' });
  }

  const categoryLabels = {
    birthday: "Birthday Parties",
    wedding: "Weddings",
    babyshower: "Baby Shower",
    corporate: "Corporate Events",
    anniversary: "Anniversaries",
    other: "Other Occasions"
  };

  const services = readJson(SERVICES_FILE);
  const newService = {
    id: `srv-${category.substring(0, 4)}-${Date.now().toString().slice(-4)}`,
    title: title.trim(),
    category: category.toLowerCase().trim(),
    categoryLabel: categoryLabels[category.toLowerCase().trim()] || "Custom Occasion",
    priceStart: Number(priceStart) || 1999,
    rating: 5.0,
    reviewCount: 1,
    badge: badge ? badge.trim() : "New Design",
    description: description ? description.trim() : "Handcrafted balloon decoration tailored to your dream celebration.",
    features: Array.isArray(features) ? features : (features ? features.split('\n').map(f => f.trim()).filter(Boolean) : [
      "Custom Theme Color Balloons",
      "Setup & Dismantle Included",
      "Child-Safe Non-Toxic Materials"
    ]),
    image: image ? image.trim() : "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80",
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [category])
  };

  if (isDbConnected()) {
    try {
      await Service.create(newService);
    } catch (dbErr) {
      console.error('MongoDB create service error:', dbErr.message);
    }
  }

  services.unshift(newService);
  writeJson(SERVICES_FILE, services);

  res.status(201).json({ success: true, message: 'New decoration package added successfully!', service: newService });
});

// 10c. Admin: Delete Decoration Package
app.delete('/api/admin/services/:id', async (req, res) => {
  if (isDbConnected()) {
    try {
      await Service.findOneAndDelete({ id: req.params.id });
    } catch (dbErr) {
      console.error('MongoDB delete service error:', dbErr.message);
    }
  }

  let services = readJson(SERVICES_FILE);
  const initialCount = services.length;
  services = services.filter(s => s.id !== req.params.id);

  if (services.length === initialCount && !isDbConnected()) {
    return res.status(404).json({ error: 'Decoration package not found' });
  }

  writeJson(SERVICES_FILE, services);
  res.json({ success: true, message: 'Decoration package deleted successfully!' });
});

// 10d. Admin: Upload Local Image from Phone or PC (Base64)
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.post('/api/admin/upload-image', (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('svg')) ext = 'svg';

    const safeBaseName = (filename || 'decor')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueFileName = `${safeBaseName}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}.${ext}`;
    const destinationPath = path.join(UPLOADS_DIR, uniqueFileName);

    fs.writeFileSync(destinationPath, buffer);
    const imageUrl = `/uploads/${uniqueFileName}`;

    console.log(`📸 [Local Image Uploaded] Saved: ${uniqueFileName} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return res.json({
      success: true,
      imageUrl,
      filename: uniqueFileName,
      size: buffer.length
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return res.status(500).json({ error: 'Failed to save uploaded image: ' + err.message });
  }
});

// 11. AI Smart Assistant endpoint (Supports Hindi, Hinglish, English + Quick Actions)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const query = message.trim().toLowerCase();
  const services = readJson(SERVICES_FILE);

  // Smart Intent Detection & Execution:
  let replyText = '';
  let actionType = null;
  let actionData = null;

  // 1. Check for Budget / Pure Number input (e.g. "2000", "3000", "30000", "mera budget 3000", "under 4000", "2500 me")
  const cleanNumberStr = query.replace(/[₹,\s]/g, '');
  const isPureNumber = /^\d{3,6}$/.test(cleanNumberStr);
  const budgetRegexMatch = query.match(/(?:budget|rs|inr|₹|under|around|approx|karcha|paisa|range|me|mein|tak|wale|wala)\s*(\d{3,6})/i);
  const anyNumMatch = query.match(/(\d{3,6})/);

  let detectedBudget = null;
  if (isPureNumber) {
    detectedBudget = parseInt(cleanNumberStr, 10);
  } else if (budgetRegexMatch) {
    detectedBudget = parseInt(budgetRegexMatch[1], 10);
  } else if (anyNumMatch && (query.includes('budget') || query.includes('rs') || query.includes('₹') || query.includes('karcha') || query.includes('under') || query.length <= 16)) {
    detectedBudget = parseInt(anyNumMatch[1], 10);
  }

  // 1. Budget Intent
  if (detectedBudget && detectedBudget >= 500) {
    if (detectedBudget >= 15000) {
      const luxury = services.filter(s => s.priceStart >= 4000 || s.category === 'wedding' || s.category === 'corporate');
      replyText = `🎈 **₹${detectedBudget.toLocaleString('en-IN')}** ek grand luxury celebration budget hai! Is budget mein hum:\n\n` +
        `✨ **Grand Golden Double Ring Floral Setup** (Weddings & Haldi)\n` +
        `✨ **14ft Grand Spiral Entrance Gateway & Stage Backdrop**\n` +
        `✨ **Custom LED Monograms & Premium Theme Styling**\n\n` +
        `Humare expert decorators pure venue ko royal transform kar denge. Kounsa event plan kar rahe hain?`;
      actionType = 'SHOW_PACKAGES';
      actionData = {
        packages: luxury.slice(0, 3),
        suggestions: ["Wedding Setup 💍", "Corporate Gateway 🏢", "Talk to Owner 📞"]
      };
    } else {
      let matching = services.filter(s => s.priceStart <= detectedBudget + 500);
      matching.sort((a, b) => Math.abs(a.priceStart - detectedBudget) - Math.abs(b.priceStart - detectedBudget));

      if (matching.length > 0) {
        replyText = `🎈 Aapke **₹${detectedBudget.toLocaleString('en-IN')}** budget ke according humare paas ye best packages hain:\n\n` +
          matching.slice(0, 3).map(m => `✨ **${m.title}** — *Starting ₹${m.priceStart.toLocaleString('en-IN')}*\n   👉 Includes: ${m.features.slice(0, 2).join(', ')}`).join('\n\n') +
          `\n\nSabhi setups mein on-time delivery aur cleanup included hai! Kounsa setup pasand aaya?`;
        actionType = 'SHOW_PACKAGES';
        actionData = {
          packages: matching.slice(0, 3),
          suggestions: ["Book Now 📅", "Birthday Ideas 🎂", "Talk to Owner 📞"]
        };
      } else {
        replyText = `Humare starting packages **₹1,499** se start hote hain (Romantic Bedroom Canopy ya Birthday Setup). Aap hume call ya WhatsApp karke customized package banwa sakte hain! 🎈`;
        actionType = 'OPEN_WHATSAPP';
        actionData = { phone: '919263667669' };
      }
    }
  }

  // 2. Location & Doorstep Service ("patna", "kaha service", "bihar", "ghar aakar", "area", "address", "shop", "venue par")
  else if (query.includes('patna') || query.includes('kaha') || query.includes('kahan') || query.includes('location') || query.includes('address') || query.includes('shop') || query.includes('ghar') || query.includes('area') || query.includes('doorstep') || query.includes('bihar') || query.includes('service area') || query.includes('kaha se ho') || query.includes('delhi') || query.includes('city')) {
    replyText = `📍 **The Party Hard Service Areas & Doorstep Setup:**\n\n` +
      `Haan ji! Hum **pure Patna aur aas-paas ke sabhi areas** mein doorstep balloon decoration deliver karte hain! 🚗🎈\n\n` +
      `• Kankarbagh, Boring Road, Bailey Road, Raja Bazar\n` +
      `• Danapur, Saguna More, Patliputra Colony\n` +
      `• Rajendra Nagar, Anisabad, Ashiana Nagar, City Area\n\n` +
      `Chahe aapka ghar/bedroom ho, terrace, hall ya cafe — humari expert decorator team aapke venue par aakar poora setup ready karti hai!\n\nAap Patna mein kis area mein decorate karwana chahte hain?`;
    actionType = 'SHOW_SUGGESTIONS';
    actionData = {
      suggestions: [
        "Birthday Ideas 🎂",
        "Mera budget ₹2,500 hai 💰",
        "Book Now 📅",
        "Talk to Owner 📞"
      ]
    };
  }

  // 3. Timing, Urgency & Express Setup ("urgent", "kitna time", "kitni der", "samay", "kitne ghante", "express", "aaj", "same day", "jaldi")
  else if (query.includes('urgent') || query.includes('time') || query.includes('der') || query.includes('samay') || query.includes('ghante') || query.includes('express') || query.includes('kitni der') || query.includes('jaldi') || query.includes('same day') || query.includes('kitna time') || query.includes('kitne baje')) {
    replyText = `⏰ **Setup Timing & Express Delivery:**\n\n` +
      `• ⚡ **Standard Setup Time**: Normal room ya ring arch decoration **1 se 2 ghante** mein ready ho jata hai.\n` +
      `• 🚀 **Urgent / Same-Day Booking**: Haan ji! Urgent setup ke liye hum **2 se 3 ghante ke express notice** par bhi decoration ready kar dete hain.\n` +
      `• 🕒 **Service Timings**: Subah **8:00 AM se raat 10:00 PM** tak (Daily 7 Days open)!\n\n` +
      `Aapka event aaj hai ya aage kisi date par?`;
    actionType = 'SHOW_SUGGESTIONS';
    actionData = {
      suggestions: [
        "Urgent Booking Call 📞",
        "Book for Today ⚡",
        "Birthday Packages 🎂",
        "Packages & Prices 📋"
      ]
    };
  }

  // 4. Payment, Advance & Discount Rules ("advance", "advance kitna", "payment", "upi", "cash", "gpay", "discount", "kam karo", "offer", "chhut")
  else if (query.includes('advance') || query.includes('payment') || query.includes('upi') || query.includes('cash') || query.includes('gpay') || query.includes('phonepe') || query.includes('discount') || query.includes('offer') || query.includes('kam karo') || query.includes('kam') || query.includes('chhut') || query.includes('paisa kaise')) {
    replyText = `💳 **Payment & Discounts Information:**\n\n` +
      `• 🔒 **Zero Advance Pressure**: Booking form fill karte waqt koi upfront advance nahi lagta! Hum call/WhatsApp par slot lock karte hain.\n` +
      `• 💸 **Multiple Payment Options**: Setup poora dekh lene ke baad aap UPI (Google Pay, PhonePe, Paytm) ya Cash de sakte hain.\n` +
      `• 🎁 **Discounts & Offers**: Direct online packages par festival discounts active hain aur starting package sirf **₹1,499** se hai!\n\n` +
      `Kounsa setup pasand karenge?`;
    actionType = 'SHOW_SUGGESTIONS';
    actionData = {
      suggestions: [
        "View Packages & Prices 📋",
        "Mera budget ₹2,000 hai 💰",
        "Book Now 📅",
        "Talk to Owner 📞"
      ]
    };
  }

  // 5. Balloon Quality & Safety ("quality", "phutega", "phootenge", "helium", "gas", "safe", "bacche", "latex", "chrome", "tikega")
  else if (query.includes('quality') || query.includes('phoot') || query.includes('phut') || query.includes('burst') || query.includes('helium') || query.includes('gas') || query.includes('safe') || query.includes('bacche') || query.includes('latex') || query.includes('chrome') || query.includes('tikega') || query.includes('kaisa balloon')) {
    replyText = `🎈 **Balloon Quality & Durability:**\n\n` +
      `• ✨ **100% Premium Grade**: Hum thick metallic chrome, pastel latex aur foil balloons use karte hain jo bina phootey **24 se 48 ghante** tak fresh aur tight rehte hain.\n` +
      `• 👶 **Safe for Children**: Non-toxic materials aur electric cold-air blower use kiya jata hai.\n` +
      `• 💡 **LED Neon Accents**: Sturdy metal arch frames aur glowing LED neon signs provide karte hain jo bilkul shock-proof aur safe hain!\n\n` +
      `Aapko pastel color theme pasand hai ya metallic chrome?`;
    actionType = 'SHOW_SUGGESTIONS';
    actionData = {
      suggestions: [
        "Pastel Dream Ring Arch 🌸",
        "Metallic Black & Gold 👑",
        "Birthday Ideas 🎂",
        "Talk to Owner 📞"
      ]
    };
  }

  // 6. Customization & Reference Photos ("custom", "photo", "pic", "image", "instagram", "pinterest", "marzi", "pasand", "aisa banega")
  else if (query.includes('custom') || query.includes('photo') || query.includes('pic') || query.includes('image') || query.includes('apni marzi') || query.includes('pasand') || query.includes('instagram') || query.includes('pinterest') || query.includes('aisa banega') || query.includes('design')) {
    replyText = `🎨 **Custom Theme & Reference Photos:**\n\n` +
      `Haan bilkul! Agar aapke paas Instagram, Pinterest ya internet ka koi bhi photo ya customized idea hai, toh hum 100% same-to-same ready kar denge! 🪄\n\n` +
      `Aap apna photo direct WhatsApp par share kar sakte hain:\n` +
      `📱 **WhatsApp**: +91 92636 67669\n\n` +
      `Hum colours, balloon density aur LED signs aapke preference ke according customize kar denge!`;
    actionType = 'OPEN_WHATSAPP';
    actionData = { phone: '919263667669' };
  }

  // 7. Trending & Best Recommendations ("kuch acha", "kuch accha", "badhiya", "sundar", "trending", "suggest", "best", "top", "kuch naya")
  else if (query.includes('kuch acha') || query.includes('kuch accha') || query.includes('badhiya') || query.includes('sundar') || query.includes('trending') || query.includes('suggest') || query.includes('best') || query.includes('top') || query.includes('kuch naya') || query.includes('acha wala')) {
    replyText = `🌟 **The Party Hard Top Trending Recommendations:**\n\n` +
      `1. 🌸 **Pastel Dream Circular Ring Arch** (₹2,499) — Warm LED Neon sign, pastel pink, lavender & chrome balloons. Sabse popular!\n` +
      `2. 👑 **Royal Black & Metallic Gold Milestone** (₹2,999) — 3ft number foils aur luxury adult look.\n` +
      `3. ☁️ **Pastel Clouds & Giant 4ft Plush Teddy** (₹3,299) — Baby Shower & 1st Birthday ke liye super cute!\n` +
      `4. 🌹 **Romantic Bedroom Canopy & Fairy Lights** (₹1,499) — Anniversary aur birthday midnight surprise!\n\n` +
      `Kounsa setup aapke event ke liye perfect lag raha hai?`;
    actionType = 'SHOW_PACKAGES';
    actionData = {
      packages: services.slice(0, 3),
      suggestions: ["Book Trending Setup 📅", "Mera budget ₹2,500 hai 💰", "Talk to Owner 📞"]
    };
  }

  // 8. How to Book / Process ("kaise book", "booking karni", "book karna", "order kaise", "process")
  else if (query.includes('kaise book') || query.includes('booking karni') || query.includes('book karna') || query.includes('order') || query.includes('process') || query.includes('karna hai') || query.includes('book kaise')) {
    replyText = `📅 **Booking Process Bahut Aasan Hai:**\n\n` +
      `1️⃣ Niche '**Book Now**' button par click karein.\n` +
      `2️⃣ Apna Naam, Mobile Number, Event Date aur Occasion select karein.\n` +
      `3️⃣ 'Confirm Booking' dabate hi aapko instant **Booking ID** mil jayegi!\n` +
      `4️⃣ Humari team 15 minutes mein call/WhatsApp karke slot lock kar degi.\n\n` +
      `Chaliye main aapke liye booking form open kar deta hoon! 🎈`;
    actionType = 'OPEN_BOOKING';
    actionData = {};
  }

  // 9. Conversational Chit-Chat / Companion talk ("tum kaun ho", "naam kya hai", "kya haal", "kaise ho", "kese ho", "kya kar sakte ho", "robot", "aur batao")
  else if (query.includes('tum kaun') || query.includes('naam kya') || query.includes('kya haal') || query.includes('kaise ho') || query.includes('kese ho') || query.includes('kya kar sakte') || query.includes('robot') || query.includes('aur batao') || query.includes('kaise h')) {
    replyText = `Namaste ji! Main mast hoon! 😊🎉\n\nMain hoon **The Party Hard AI Assistant** — aapka personal celebration concierge!\n\nMain aapke celebration ke liye best balloon decorations recommend kar sakta hoon, aapke budget mein packages dhoondh sakta hoon, booking karwa sakta hoon aur status track kar sakta hoon!\n\nAap bataiye, kiska celebration plan ho raha hai aaj? 🎈`;
    actionType = 'SHOW_SUGGESTIONS';
    actionData = {
      suggestions: [
        "Birthday Ideas 🎂",
        "Packages & Prices 📋",
        "Mera budget ₹2,500 hai 💰",
        "Talk to Owner 📞"
      ]
    };
  }

  // 10. Affirmations / Friendly Follow-ups ("yes", "haan", "ha", "ok", "theek hai", "bolo", "batao", "suno", "help")
  else if (/^(yes|haan|ha|haa|yup|yeah|ok|okay|theek|thik|accha|achha|bolo|batao|btao|suno|help|bhai)\b/i.test(query) || query === 'yes' || query === 'ok' || query === 'bolo' || query === 'haan') {
    replyText = `Bilkul! 🎈 Main aapki poori help karunga.\n\nKripya batayein:\n🎂 **Kounsa event celebrate kar rahe hain?** (Birthday, Wedding, Baby Shower, Anniversary)\n💰 **Ya aapka approximate budget kya hai?** (e.g. ₹2,000, ₹3,500, ₹5,000)\n\nAap niche kisi bhi option par click kar sakte hain:`;
    actionType = 'SHOW_SUGGESTIONS';
    actionData = {
      suggestions: [
        "Birthday Ideas 🎂",
        "Mera budget ₹2,500 hai 💰",
        "Baby Shower Setup 🍼",
        "Wedding Decor 💍",
        "Talk to Owner 📞"
      ]
    };
  }

  // 11. Farewells / Exit ("bye", "end", "khatam", "alvida", "thank you", "thanks", "dhanyawad", "shukriya")
  else if (/^(bye|goodbye|end|khatam|alvida|thank you|thanks|dhanyawad|shukriya|tata|done)\b/i.test(query) || query === 'end' || query === 'bye') {
    replyText = `Aapka bahut bahut shukriya! 🙏 Agar koi bhi doubt ho ya customized setup chahiye ho, toh kabhi bhi message karein ya humare owner se connect karein:\n\n• 📱 **WhatsApp / Call**: +91 92636 67669\n• 📧 **Email**: partyhard2707@gmail.com\n\nAapka celebration shandar ho! 🎈✨`;
    actionType = 'OPEN_WHATSAPP';
    actionData = { phone: '919263667669' };
  }

  // 12. Greeting ("hello", "hi", "hey", "namaste", "pranam")
  else if (query.includes('hello') || query.includes('hi') || query.includes('namaste') || query.includes('hey') || query.includes('pranam')) {
    replyText = `Namaste! 🙏 Main hoon **Party Hard AI Assistant** — The Party Hard ka smart concierge!\n\nMain aapki kaise madad kar sakta hoon?\n• 🎈 Birthday / Wedding / Baby Shower decoration ideas dekhna\n• 💰 Apne budget ke hisaab se best package dhundhna (jaise ₹2,000 ya ₹3,000)\n• 📅 Booking confirm karna aur status track karna\n• 📞 Owner se WhatsApp par direct baat karna\n\nBataiye aaj kounsa celebration plan kar rahe hain? 😊`;
    actionType = 'SHOW_SUGGESTIONS';
    actionData = {
      suggestions: [
        "Birthday Ideas 🎂",
        "Packages & Prices 📋",
        "Mera budget ₹3,000 hai 💰",
        "Wedding Decor 💍",
        "Talk to Owner 📞"
      ]
    };
  }

  // 5. Packages & Prices ("what are your packages & prices?", "rate list", "packages", "price", "cost")
  else if (query.includes('package') || query.includes('packages') || query.includes('rate') || query.includes('rates') || query.includes('price') || query.includes('prices') || query.includes('cost') || query.includes('karcha') || query.includes('list') || query.includes('kitna')) {
    replyText = `🎈 **The Party Hard Complete Rate List & Packages:**\n\n` +
      `🎂 **Birthday Parties** — Starts at ₹1,499 se ₹3,899 (Pastel Ring Arch, Neon Sign & Cutouts)\n` +
      `🍼 **Baby Shower & Naming** — Starts at ₹2,199 se ₹3,999 (Pastel Clouds, 4ft Teddy & Mom-to-Be Neon)\n` +
      `💖 **Anniversaries** — Starts at ₹1,799 se ₹5,499 (Rose Gold Heart Arch & Fairy Lights)\n` +
      `💍 **Weddings & Haldi** — Starts at ₹3,499 se ₹8,999 (Double Ring Arch & Fresh Florals)\n` +
      `🏢 **Corporate Events** — Starts at ₹3,799 se ₹7,999 (Grand Spiral Gateway & Welcome Stage)\n\n` +
      `Sabhi packages mein on-time setup aur dismantle included hai!`;
    actionType = 'OPEN_GALLERY';
    actionData = {
      category: 'all',
      suggestions: ["Birthday Ideas 🎂", "Mera budget ₹2,500 hai 💰", "Book Now 📅", "Talk to Owner 📞"]
    };
  }

  // 6. Birthday ideas ("birthday decoration ideas dikhao", "bday setup", "janamdin")
  else if (query.includes('birthday') || query.includes('bday') || query.includes('janamdin') || query.includes('cake smash') || query.includes('kids')) {
    const bday = services.filter(s => s.category === 'birthday');
    replyText = `🎂 **Birthday Celebrations ke liye Top Ideas:**\n\n` +
      `1. **Pastel Dream Ring Arch** (₹2,499) — LED Neon Sign, Ring backdrop & pastel chrome balloons.\n` +
      `2. **Royal Black & Gold Adult Milestone Arch** (₹2,999) — Chrome balloons & 3ft number foils.\n` +
      `3. **Surprise Bedroom Balloon Canopy** (₹1,499) — 100 ceiling balloons, fairy lights & memory photo clips!\n\n` +
      `Aap niche click karke direct booking kar sakte hain ya gallery explore karein:`;
    actionType = 'SHOW_PACKAGES';
    actionData = {
      packages: bday.slice(0, 3),
      suggestions: ["Mera budget ₹2,000 hai 💰", "View Birthday Gallery 📸", "Book Birthday 🎂", "Talk to Owner 📞"]
    };
  }

  // 7. Wedding / Engagement ("wedding decoration book karni hai", "engagement", "haldi", "ring ceremony")
  else if (query.includes('wedding') || query.includes('shaadi') || query.includes('shadi') || query.includes('engagement') || query.includes('haldi') || query.includes('mehendi') || query.includes('sangeet')) {
    const wed = services.filter(s => s.category === 'wedding');
    replyText = `💍 **Shaadi & Engagement Decoration Services:**\n\n` +
      `✨ **Royal Double Ring Arch** with champagne balloons & fresh floral accents (₹5,499)\n` +
      `✨ **Haldi / Mehendi Yellow Marigold Traditional Setup** (₹3,899)\n` +
      `✨ **Luxury Bridal Entry Gateway & Proposal Canopy**\n\n` +
      `Main aapke liye Wedding Booking Form open kar raha hoon!`;
    actionType = 'SHOW_PACKAGES';
    actionData = {
      packages: wed.slice(0, 3),
      suggestions: ["Open Booking Form 📅", "Haldi Setup 🌼", "Talk to Owner 📞"]
    };
  }

  // 8. Baby Shower / Welcome Baby ("baby shower", "pink theme baby shower dikhao", "naming ceremony")
  else if (query.includes('baby') || query.includes('shower') || query.includes('naming') || query.includes('godh bharai') || query.includes('welcome baby')) {
    const baby = services.filter(s => s.category === 'babyshower');
    replyText = `🍼 **Baby Shower & Welcome Baby Highlights:**\n\n` +
      `🌸 **Pastel Clouds & 4ft Giant Plush Teddy Bear Setup** (₹3,299)\n` +
      `✨ Transparent LED 'B-A-B-Y' letter cubes & Mom-to-Be Neon Sign\n` +
      `✨ Welcome Prince / Princess cradle & door gateway decoration (₹2,199)\n\n` +
      `Aapko Pink theme chahiye ya Blue/Pastel mix? Hum exact custom colors mein decorate karte hain!`;
    actionType = 'SHOW_PACKAGES';
    actionData = {
      packages: baby.slice(0, 3),
      suggestions: ["Book Baby Shower 🍼", "Pink Theme Photos 🌸", "Talk to Owner 📞"]
    };
  }

  // 9. Anniversary ("anniversary setup", "surprise anniversary")
  else if (query.includes('anniversary') || query.includes('saalgirah') || query.includes('salgirah') || query.includes('romantic')) {
    const anni = services.filter(s => s.category === 'anniversary');
    replyText = `💖 **Anniversary Special Celebrations:**\n\n` +
      `🌹 **Romantic Candlelight & Rose Petal Pathway** (₹1,799)\n` +
      `🎈 **Rose Gold Heart Arch with Fairy Lights** (₹2,999)\n` +
      `✨ **Metallic Silver & Golden Jubilee 25th / 50th Milestone Foil Arches** (₹3,499)\n\n` +
      `Kya aap room decoration chahte hain ya banquet/terrace setup?`;
    actionType = 'SHOW_PACKAGES';
    actionData = {
      packages: anni.slice(0, 3),
      suggestions: ["Book Anniversary 💖", "Bedroom Canopy 🌹", "Talk to Owner 📞"]
    };
  }

  // 10. Corporate / Office events ("corporate", "office party", "showroom opening")
  else if (query.includes('corporate') || query.includes('office') || query.includes('showroom') || query.includes('shop') || query.includes('opening') || query.includes('launch')) {
    const corp = services.filter(s => s.category === 'corporate');
    replyText = `🏢 **Corporate & Grand Opening Balloon Decor:**\n\n` +
      `🎈 12-14ft Grand Spiral Entrance Gateway matching your brand colors (₹4,999)\n` +
      `🎈 Branded balloon columns, pillars & stage backdrop\n` +
      `🎈 Red carpet welcome runner & ribbon cutting styling\n\n` +
      `Corporate GST invoice bhi available hai!`;
    actionType = 'SHOW_PACKAGES';
    actionData = {
      packages: corp.slice(0, 3),
      suggestions: ["Corporate Booking 🏢", "Entrance Gateway 🎈", "Talk to Owner 📞"]
    };
  }

  // 11. Gallery Photos ("show gallery photos", "photos dikhao", "gallery")
  else if (query.includes('gallery') || query.includes('photo') || query.includes('photos') || query.includes('image') || query.includes('images') || query.includes('pic') || query.includes('designs dikhao')) {
    replyText = `📸 **The Party Hard Recent Work Gallery:**\n\n` +
      `Humne haal hi mein kai stunning balloon decorations deliver kiye hain — Birthday ring arches, pastel clouds baby shower, aur wedding backdrops.\n\n` +
      `Aap niche click karke poori gallery dekh sakte hain:`;
    actionType = 'OPEN_GALLERY';
    actionData = {
      category: 'all',
      suggestions: ["Birthday Gallery 🎂", "Baby Shower 🍼", "Wedding Decor 💍", "Talk to Owner 📞"]
    };
  }

  // 12. Talk to Owner / WhatsApp ("talk to a human", "mujhe owner se baat karni hai", "owner", "call", "whatsapp")
  else if (query.includes('owner') || query.includes('human') || query.includes('person') || query.includes('baat') || query.includes('call') || query.includes('phone') || query.includes('whatsapp') || query.includes('number') || query.includes('contact')) {
    replyText = `📞 **The Party Hard Direct Support:**\n\n` +
      `Aap The Party Hard ke owner/team se directly WhatsApp, call ya email par connect kar sakte hain:\n\n` +
      `• 📱 **Phone / WhatsApp**: +91 92636 67669\n` +
      `• 📧 **Email**: partyhard2707@gmail.com\n` +
      `• ⏰ **Timings**: 8:00 AM - 10:00 PM (Daily 7 Days)\n\n` +
      `Niche click karke seedha WhatsApp par baat karein!`;
    actionType = 'OPEN_WHATSAPP';
    actionData = { phone: '919263667669' };
  }

  // 13. Track Booking Status ("meri booking ka status", "track booking", "TPH-", "YUVI-")
  else if (query.includes('status') || query.includes('track') || query.includes('booking id') || query.startsWith('tph-') || query.startsWith('yuvi-')) {
    const idExtract = query.match(/(?:tph|yuvi)-\d{4}-\d{4}/i);
    if (idExtract) {
      const bookings = readJson(BOOKINGS_FILE);
      const found = bookings.find(b => b.id.toLowerCase() === idExtract[0].toLowerCase());
      if (found) {
        replyText = `🔎 **Booking Mil Gayi!**\n\n` +
          `• **Booking ID**: ${found.id}\n` +
          `• **Customer**: ${found.customerName}\n` +
          `• **Event**: ${found.eventType} on **${found.eventDate}** (${found.eventTime})\n` +
          `• **Package**: ${found.packageName}\n` +
          `• **Status**: **${found.status.toUpperCase()}**\n\n` +
          `Team The Party Hard on-time delivery ke liye taiyar hai! 🎈`;
      } else {
        replyText = `Humare records mein **${idExtract[0]}** nahi mila. Kripya apna registered 10-digit mobile number batayein ya Track Booking section use karein.`;
        actionType = 'OPEN_TRACK';
      }
    } else {
      replyText = `🔎 Apni booking ka live status janne ke liye apna **Booking ID** (jaise TPH-2026-8941) ya **Registered Mobile Number** yahan likhein ya 'Track Booking' check karein!`;
      actionType = 'OPEN_TRACK';
    }
  }

  // 14. Availability ("available", "kya date available hai", "next sunday")
  else if (query.includes('available') || query.includes('availability') || query.includes('date') || query.includes('sunday') || query.includes('kal') || query.includes('aaj')) {
    replyText = `📅 **Availability Check:**\n\n` +
      `Haan ji! Weekend aur Sunday slots high demand mein hote hain, isliye hum advance booking recommend karte hain.\n` +
      `Humare decorators subah 8:00 AM se raat 10:00 PM tak setups deliver karte hain.\n\n` +
      `Aap apni preferred event date aur time booking form mein select kijiye, hum instantly slot confirm karenge!`;
    actionType = 'OPEN_BOOKING';
    actionData = {};
  }

  // 15. Conversational Fallback with Helpful Guidance
  else {
    replyText = `Arey bilkul! 🎈 Main The Party Hard se hoon. Main aapke event ke according best balloon decoration plan karne mein madad kar sakta hoon!\n\n` +
      `Aap Birthday, Anniversary, Baby Shower ya Wedding decor dekhna chahte hain? Ya apna approximate budget batayein (jaise ₹2,000 ya ₹3,500), main instant best package dikha dunga! 😊`;
    actionType = 'SHOW_SUGGESTIONS';
    actionData = {
      suggestions: [
        "Birthday Ideas 🎂",
        "Mera budget ₹2,500 hai 💰",
        "Packages & Prices 📋",
        "Wedding Decor 💍",
        "Talk to Owner 📞"
      ]
    };
  }

  // Save conversation session to MongoDB & chats.json history
  let activeSessionId = req.body.sessionId;
  if (!activeSessionId) {
    activeSessionId = `CHAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const timeString = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const isoTime = new Date().toISOString();
  let chats = readJson(CHATS_FILE);
  let session = chats.find(c => c.sessionId === activeSessionId);

  const userMsgObj = { sender: 'user', role: 'user', text: message.trim(), time: timeString, timestamp: isoTime };
  const botMsgObj = { sender: 'bot', role: 'bot', text: replyText, time: timeString, timestamp: isoTime };

  if (!session) {
    session = {
      sessionId: activeSessionId,
      startedAt: isoTime,
      lastMessageAt: isoTime,
      summary: message.length > 50 ? message.substring(0, 50) + '...' : message,
      messages: []
    };
    chats.unshift(session);
  } else {
    // Move session to top of list
    chats = chats.filter(c => c.sessionId !== activeSessionId);
    session.lastMessageAt = isoTime;
    chats.unshift(session);
  }

  session.messages.push(userMsgObj);
  session.messages.push(botMsgObj);
  writeJson(CHATS_FILE, chats);

  if (isDbConnected()) {
    try {
      await ChatSession.findOneAndUpdate(
        { sessionId: activeSessionId },
        {
          $set: {
            lastMessageAt: session.lastMessageAt,
            summary: session.summary
          },
          $setOnInsert: {
            startedAt: session.startedAt
          },
          $push: {
            messages: { $each: [userMsgObj, botMsgObj] }
          }
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.error('MongoDB save chat session error:', dbErr.message);
    }
  }

  res.json({
    reply: replyText,
    action: actionType,
    data: actionData,
    sessionId: activeSessionId
  });
});

// Admin: Get all AI Chat history
app.get('/api/admin/chats', async (req, res) => {
  if (isDbConnected()) {
    try {
      const dbChats = await ChatSession.find().sort({ updatedAt: -1 }).lean();
      if (dbChats && dbChats.length > 0) {
        return res.json(dbChats);
      }
    } catch (dbErr) {
      console.error('MongoDB get chats error:', dbErr.message);
    }
  }

  const chats = readJson(CHATS_FILE);
  res.json(chats);
});

// Admin: Delete an AI Chat session
app.delete('/api/admin/chats/:sessionId', async (req, res) => {
  if (isDbConnected()) {
    try {
      await ChatSession.findOneAndDelete({ sessionId: req.params.sessionId });
    } catch (dbErr) {
      console.error('MongoDB delete chat error:', dbErr.message);
    }
  }

  let chats = readJson(CHATS_FILE);
  chats = chats.filter(c => c.sessionId !== req.params.sessionId);
  writeJson(CHATS_FILE, chats);
  res.json({ success: true, message: 'Chat history deleted' });
});

// Single Page Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`✨ THE PARTY HARD Server Successfully Started!`);
  console.log(`👉 Customer Website: http://localhost:${PORT}`);
  console.log(`👉 Admin Dashboard:  http://localhost:${PORT}/admin.html`);
  console.log(`==================================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const altPort = 3001;
    console.log(`\n⚠️ Port ${PORT} busy tha. Automatically running on port ${altPort}!`);
    app.listen(altPort, () => {
      console.log(`✨ THE PARTY HARD Server running at http://localhost:${altPort}`);
      console.log(`👉 Customer Website: http://localhost:${altPort}`);
      console.log(`👉 Admin Dashboard:  http://localhost:${altPort}/admin.html`);
    });
  } else {
    console.error('Server error:', err);
  }
});
