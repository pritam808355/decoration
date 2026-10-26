const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper file paths
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

// Generate unique booking id: YUVI-2026-XXXX
function generateBookingId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `YUVI-${year}-${randomNum}`;
}

// --- API ROUTES ---

// 1. Get all services
app.get('/api/services', (req, res) => {
  const { category } = req.query;
  const services = readJson(SERVICES_FILE);
  if (category && category !== 'all') {
    const filtered = services.filter(s => s.category.toLowerCase() === category.toLowerCase());
    return res.json(filtered);
  }
  res.json(services);
});

// 2. Get service by ID
app.get('/api/services/:id', (req, res) => {
  const services = readJson(SERVICES_FILE);
  const item = services.find(s => s.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Service not found' });
  res.json(item);
});

// 3. Create a new booking
app.post('/api/bookings', (req, res) => {
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

  // Find price if package matched
  const services = readJson(SERVICES_FILE);
  const matchedService = services.find(s => s.id === packageId);
  if (matchedService) {
    newBooking.estimatedAmount = matchedService.priceStart;
  }

  bookings.unshift(newBooking);
  writeJson(BOOKINGS_FILE, bookings);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully!',
    booking: newBooking
  });
});

// 4. Track booking by ID or Phone
app.get('/api/bookings/track/:query', (req, res) => {
  const query = req.params.query.trim().toLowerCase();
  const bookings = readJson(BOOKINGS_FILE);

  const matched = bookings.filter(b => 
    b.id.toLowerCase() === query || 
    b.mobile.replace(/\D/g, '').endsWith(query.replace(/\D/g, ''))
  );

  if (matched.length === 0) {
    return res.status(404).json({ error: 'No booking found matching the provided ID or Mobile number.' });
  }

  res.json(matched);
});

// 5. Contact Enquiry
app.post('/api/contact', (req, res) => {
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
app.get('/api/admin/bookings', (req, res) => {
  const bookings = readJson(BOOKINGS_FILE);
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
app.patch('/api/admin/bookings/:id/status', (req, res) => {
  const { status, notes } = req.body;
  const bookings = readJson(BOOKINGS_FILE);
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (status) booking.status = status;
  if (notes !== undefined) booking.adminNotes = notes;
  booking.updatedAt = new Date().toISOString();

  writeJson(BOOKINGS_FILE, bookings);
  res.json({ success: true, booking });
});

// 9. Delete booking
app.delete('/api/admin/bookings/:id', (req, res) => {
  let bookings = readJson(BOOKINGS_FILE);
  const initialLength = bookings.length;
  bookings = bookings.filter(b => b.id !== req.params.id);
  if (bookings.length === initialLength) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  writeJson(BOOKINGS_FILE, bookings);
  res.json({ success: true, message: 'Booking deleted' });
});

// 10. Admin enquiries
app.get('/api/admin/enquiries', (req, res) => {
  const enquiries = readJson(ENQUIRIES_FILE);
  res.json(enquiries);
});

// 10b. Admin: Add New Decoration Package
app.post('/api/admin/services', (req, res) => {
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

  services.unshift(newService);
  writeJson(SERVICES_FILE, services);

  res.status(201).json({ success: true, message: 'New decoration package added successfully!', service: newService });
});

// 10c. Admin: Delete Decoration Package
app.delete('/api/admin/services/:id', (req, res) => {
  let services = readJson(SERVICES_FILE);
  const initialCount = services.length;
  services = services.filter(s => s.id !== req.params.id);

  if (services.length === initialCount) {
    return res.status(404).json({ error: 'Decoration package not found' });
  }

  writeJson(SERVICES_FILE, services);
  res.json({ success: true, message: 'Decoration package deleted successfully!' });
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

  // 2. Affirmations / Friendly Follow-ups ("yes", "haan", "ha", "ok", "theek hai", "bolo", "batao", "suno", "help")
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

  // 3. Farewells / Exit ("bye", "end", "khatam", "alvida", "thank you", "thanks", "dhanyawad", "shukriya")
  else if (/^(bye|goodbye|end|khatam|alvida|thank you|thanks|dhanyawad|shukriya|tata|done)\b/i.test(query) || query === 'end' || query === 'bye') {
    replyText = `Aapka bahut bahut shukriya! 🙏 Agar koi bhi doubt ho ya customized setup chahiye ho, toh kabhi bhi message karein ya humare owner se connect karein:\n\n• 📱 **WhatsApp / Call**: +91 92636 67669\n• 📧 **Email**: partyhard2707@gmail.com\n\nAapka celebration shandar ho! 🎈✨`;
    actionType = 'OPEN_WHATSAPP';
    actionData = { phone: '919263667669' };
  }

  // 4. Greeting ("hello", "hi", "hey", "namaste", "kese ho")
  else if (query.includes('hello') || query.includes('hi') || query.includes('namaste') || query.includes('hey') || query.includes('kese ho') || query.includes('kaise ho')) {
    replyText = `Namaste! 🙏 Main hoon **Yuvi AI Assistant** — Yuvi.Decoration ka smart concierge!\n\nMain aapki kaise madad kar sakta hoon?\n• 🎈 Birthday / Wedding / Baby Shower decoration ideas dekhna\n• 💰 Apne budget ke hisaab se best package dhundhna (jaise ₹2,000 ya ₹3,000)\n• 📅 Booking confirm karna aur status track karna\n• 📞 Owner se WhatsApp par direct baat karna\n\nBataiye aaj kounsa celebration plan kar rahe hain? 😊`;
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
    replyText = `🎈 **Yuvi.Decoration Complete Rate List & Packages:**\n\n` +
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
    replyText = `📸 **Yuvi.Decoration Recent Work Gallery:**\n\n` +
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
    replyText = `📞 **Yuvi.Decoration Direct Support:**\n\n` +
      `Aap Yuvi Decoration ke owner/team se directly WhatsApp, call ya email par connect kar sakte hain:\n\n` +
      `• 📱 **Phone / WhatsApp**: +91 92636 67669\n` +
      `• 📧 **Email**: partyhard2707@gmail.com\n` +
      `• ⏰ **Timings**: 8:00 AM - 10:00 PM (Daily 7 Days)\n\n` +
      `Niche click karke seedha WhatsApp par baat karein!`;
    actionType = 'OPEN_WHATSAPP';
    actionData = { phone: '919263667669' };
  }

  // 13. Track Booking Status ("meri booking ka status", "track booking", "YUVI-")
  else if (query.includes('status') || query.includes('track') || query.includes('booking id') || query.startsWith('yuvi-')) {
    const idExtract = query.match(/yuvi-\d{4}-\d{4}/i);
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
          `Team Yuvi Decoration on-time delivery ke liye taiyar hai! 🎈`;
      } else {
        replyText = `Humare records mein **${idExtract[0]}** nahi mila. Kripya apna registered 10-digit mobile number batayein ya Track Booking section use karein.`;
        actionType = 'OPEN_TRACK';
      }
    } else {
      replyText = `🔎 Apni booking ka live status janne ke liye apna **Booking ID** (jaise YUVI-2026-8941) ya **Registered Mobile Number** yahan likhein ya 'Track Booking' check karein!`;
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

  // 15. Default Smart Response with Helpful Chips
  else {
    replyText = `Shukriya! 🎈 Yuvi.Decoration par hum Birthday, Wedding, Baby Shower, Anniversary aur Corporate events ke liye premium balloon decoration provide karte hain.\n\nAap kiske bare mein jaanna chahte hain? Niche kisi option par click karein:`;
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

  // Save conversation session to chats.json history
  let activeSessionId = req.body.sessionId;
  if (!activeSessionId) {
    activeSessionId = `CHAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const timeString = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  let chats = readJson(CHATS_FILE);
  let session = chats.find(c => c.sessionId === activeSessionId);

  if (!session) {
    session = {
      sessionId: activeSessionId,
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      summary: message.length > 50 ? message.substring(0, 50) + '...' : message,
      messages: []
    };
    chats.unshift(session);
  } else {
    // Move session to top of list
    chats = chats.filter(c => c.sessionId !== activeSessionId);
    session.lastMessageAt = new Date().toISOString();
    chats.unshift(session);
  }

  session.messages.push({ sender: 'user', text: message.trim(), time: timeString });
  session.messages.push({ sender: 'bot', text: replyText, time: timeString });
  writeJson(CHATS_FILE, chats);

  res.json({
    reply: replyText,
    action: actionType,
    data: actionData,
    sessionId: activeSessionId
  });
});

// Admin: Get all AI Chat history
app.get('/api/admin/chats', (req, res) => {
  const chats = readJson(CHATS_FILE);
  res.json(chats);
});

// Admin: Delete an AI Chat session
app.delete('/api/admin/chats/:sessionId', (req, res) => {
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
  console.log(`✨ YUVI.decoration Server Successfully Started!`);
  console.log(`👉 Customer Website: http://localhost:${PORT}`);
  console.log(`👉 Admin Dashboard:  http://localhost:${PORT}/admin.html`);
  console.log(`==================================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const altPort = 3001;
    console.log(`\n⚠️ Port ${PORT} busy tha. Automatically running on port ${altPort}!`);
    app.listen(altPort, () => {
      console.log(`✨ YUVI.decoration Server running at http://localhost:${altPort}`);
      console.log(`👉 Customer Website: http://localhost:${altPort}`);
      console.log(`👉 Admin Dashboard:  http://localhost:${altPort}/admin.html`);
    });
  } else {
    console.error('Server error:', err);
  }
});
