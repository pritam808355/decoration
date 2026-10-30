/**
 * YUVI.DECORATION - Core Application Logic
 * Interactive features, services rendering, booking flow & tracker
 */

// --- GLOBAL STATE ---
let allServices = [];
let currentCategory = 'all';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initNavbar();
  fetchServices();
  initBookingForm();
  initTracker();
  initContactForm();
  initModals();
  initScrollReveal();
  initWelcomeExperience();
  initAnimatedStatsCounters();
  initCard3DTilt();
});

// ===================================================
// 1. AMBIENT FLOATING PASTEL BALLOONS CANVAS
// ===================================================
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = document.documentElement.clientWidth || window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = document.documentElement.clientWidth || window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const balloons = [];
  const balloonCount = Math.min(20, Math.floor(width / 70));

  // Delicate pastel colors matching reference design
  const colors = [
    { main: '#f8b4c4', highlight: '#ffffff', string: '#e85072' }, // Soft Pink
    { main: '#ffc9a8', highlight: '#ffffff', string: '#dd6b20' }, // Peach
    { main: '#a5e5e0', highlight: '#ffffff', string: '#38b2ac' }, // Mint Cyan
    { main: '#d8b4e2', highlight: '#ffffff', string: '#805ad5' }, // Soft Lilac
    { main: '#fce38a', highlight: '#ffffff', string: '#d69e2e' }, // Soft Yellow
  ];

  for (let i = 0; i < balloonCount; i++) {
    balloons.push({
      x: Math.random() * width,
      y: height + Math.random() * height,
      radius: 12 + Math.random() * 20,
      speedY: 0.35 + Math.random() * 0.65,
      speedX: (Math.random() - 0.5) * 0.35,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.012 + Math.random() * 0.018,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.28 + Math.random() * 0.35,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    balloons.forEach((b) => {
      b.y -= b.speedY;
      b.sway += b.swaySpeed;
      b.x += Math.sin(b.sway) * 0.45 + b.speedX;

      // Wrap around
      if (b.y < -80) {
        b.y = height + 40;
        b.x = Math.random() * width;
      }
      if (b.x < -40) b.x = width + 30;
      if (b.x > width + 40) b.x = -30;

      ctx.save();
      ctx.globalAlpha = b.opacity;

      // Draw String
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.radius * 1.2);
      ctx.quadraticCurveTo(
        b.x + Math.sin(b.sway * 2) * 6,
        b.y + b.radius * 1.8,
        b.x,
        b.y + b.radius * 2.4
      );
      ctx.strokeStyle = b.color.string;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw Balloon Shape (Oval egg-like)
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.radius * 0.85, b.radius * 1.1, 0, 0, Math.PI * 2);
      
      const grad = ctx.createRadialGradient(
        b.x - b.radius * 0.3,
        b.y - b.radius * 0.4,
        b.radius * 0.1,
        b.x,
        b.y,
        b.radius * 1.1
      );
      grad.addColorStop(0, b.color.highlight);
      grad.addColorStop(0.5, b.color.main);
      grad.addColorStop(1, b.color.string);
      ctx.fillStyle = grad;
      ctx.fill();

      // Balloon knot
      ctx.beginPath();
      ctx.moveTo(b.x - 3, b.y + b.radius * 1.1);
      ctx.lineTo(b.x + 3, b.y + b.radius * 1.1);
      ctx.lineTo(b.x, b.y + b.radius * 1.25);
      ctx.closePath();
      ctx.fillStyle = b.color.main;
      ctx.fill();

      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  draw();
}

// ===================================================
// 2. NAVBAR & NAVIGATION
// ===================================================
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (toggleBtn && navLinks) {
    const icon = toggleBtn.querySelector('i');
    
    toggleBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      if (icon) {
        if (isOpen) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    });

    // Close mobile nav when tapping outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        navLinks.classList.remove('open');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      }
    });
  }
}

// ===================================================
// 3. SERVICES FETCH & RENDER
// ===================================================
async function fetchServices() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/services');
    if (res.ok) {
      allServices = await res.json();
    } else {
      throw new Error('API unavailable');
    }
  } catch (err) {
    // VS Code Live Server & Static Mode Fallback
    console.log('Running in client/Live Server mode - loading local catalogue');
    const local = localStorage.getItem('yuvi_services_data');
    const parsedLocal = local ? JSON.parse(local) : null;
    if (parsedLocal && parsedLocal.length >= (window.DEFAULT_SERVICES || []).length && !parsedLocal.some(s => s.id === 'srv-baby-7375')) {
      allServices = parsedLocal;
    } else {
      allServices = window.DEFAULT_SERVICES || [];
      localStorage.setItem('yuvi_services_data', JSON.stringify(allServices));
    }
  }

  renderServices(allServices);
  initFilterTabs();
  populateBookingPackageDropdown(allServices);
}

function renderServices(services) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  if (services.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <i class="fa-solid fa-balloon" style="font-size: 2.5rem; color: var(--primary-pink); margin-bottom: 1rem;"></i>
        <h4 style="color: var(--text-dark);">No packages found in this category.</h4>
      </div>
    `;
    return;
  }

  grid.innerHTML = services.map(s => `
    <div class="package-card reveal-on-scroll" data-category="${s.category}">
      <div class="pkg-img-wrap">
        <img src="${s.image}" alt="${s.title}" loading="lazy">
        ${s.badge ? `<span class="pkg-badge">${s.badge}</span>` : ''}
        <div class="pkg-rating">
          <i class="fa-solid fa-star" style="color: #f59e0b;"></i>
          <span>${s.rating}</span>
          <span style="color: var(--text-muted); font-size: 0.72rem;">(${s.reviewCount})</span>
        </div>
      </div>
      <div class="pkg-body">
        <div class="pkg-meta">
          <span class="pkg-cat-name">${s.categoryLabel}</span>
          <div class="pkg-price">
            <span>Starts </span>₹${s.priceStart.toLocaleString('en-IN')}
          </div>
        </div>
        <h3 class="pkg-title">${s.title}</h3>
        <p class="pkg-desc">${s.description}</p>
        <ul class="pkg-features-list">
          ${s.features.slice(0, 3).map(f => `
            <li><i class="fa-regular fa-circle-check"></i> ${f}</li>
          `).join('')}
        </ul>
        <div class="pkg-actions-row">
          <button class="btn btn-pink" onclick="openBookingModalForPackage('${s.id}')">
            <i class="fa-regular fa-calendar-check"></i> Book Now
          </button>
          <button class="btn btn-white-pill" onclick="openServiceDetailModal('${s.id}')">
            <i class="fa-regular fa-eye"></i> Details
          </button>
        </div>
      </div>
    </div>
  `).join('');

  if (window.observeRevealElements) {
    window.observeRevealElements();
  }
}

function initFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab-pill');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.getAttribute('data-filter');
      currentCategory = cat;

      if (cat === 'all') {
        renderServices(allServices);
      } else {
        const filtered = allServices.filter(s => s.category === cat);
        renderServices(filtered);
      }
    });
  });
}

function populateBookingPackageDropdown(services) {
  const optionsHtml = `
    <option value="">-- Choose a Curated Package (or Custom) --</option>
    <option value="custom">✨ Custom Bespoke Theme (Tailored to your needs)</option>
    ${services.map(s => `
      <option value="${s.id}" data-price="${s.priceStart}" data-type="${s.categoryLabel}">
        ${s.title} (₹${s.priceStart.toLocaleString('en-IN')})
      </option>
    `).join('')}
  `;

  const select = document.getElementById('booking-package');
  if (select) {
    const curVal = select.value;
    select.innerHTML = optionsHtml;
    if (curVal) select.value = curVal;
  }

  const modalSelect = document.getElementById('modal-booking-package');
  if (modalSelect) {
    const curModal = modalSelect.value;
    modalSelect.innerHTML = optionsHtml;
    if (curModal) modalSelect.value = curModal;
  }
}

// Helper to link package select to event type select
function setupFormSelectSync(packageSelectId, eventTypeId, onPackageChange) {
  const packageSelect = document.getElementById(packageSelectId);
  const eventTypeSelect = document.getElementById(eventTypeId);

  if (!packageSelect || !eventTypeSelect) return;

  packageSelect.addEventListener('change', () => {
    const selectedOpt = packageSelect.selectedOptions[0];
    const packageType = selectedOpt ? selectedOpt.getAttribute('data-type') : null;
    if (packageType) {
      for (let i = 0; i < eventTypeSelect.options.length; i++) {
        if (eventTypeSelect.options[i].text.includes(packageType) || packageType.includes(eventTypeSelect.options[i].value)) {
          eventTypeSelect.selectedIndex = i;
          break;
        }
      }
    }
    if (typeof onPackageChange === 'function') {
      onPackageChange(packageSelect.value);
    }
  });
}

// ===================================================
// 4. BOOKING FORM & CONFIRMATION
// ===================================================
function initBookingForm() {
  const today = new Date().toISOString().split('T')[0];

  const dateInput = document.getElementById('booking-date');
  if (dateInput) dateInput.min = today;
  const modalDateInput = document.getElementById('modal-booking-date');
  if (modalDateInput) modalDateInput.min = today;

  setupFormSelectSync('booking-package', 'booking-event-type');
  setupFormSelectSync('modal-booking-package', 'modal-booking-event-type', (pkgId) => {
    updateModalPackagePreview(pkgId);
  });

  // 1. Main Inline Form Submit
  const mainForm = document.getElementById('main-booking-form');
  if (mainForm) {
    mainForm.addEventListener('submit', (e) => {
      e.preventDefault();
      processBookingSubmit({
        form: mainForm,
        name: document.getElementById('booking-name')?.value,
        phone: document.getElementById('booking-phone')?.value,
        eventType: document.getElementById('booking-event-type')?.value,
        packageSelect: document.getElementById('booking-package'),
        date: document.getElementById('booking-date')?.value,
        time: document.getElementById('booking-time')?.value || 'Flexible',
        venue: document.getElementById('booking-venue')?.value,
        budget: document.getElementById('booking-budget')?.value || 'Standard',
        theme: document.getElementById('booking-theme')?.value || 'Pastel Mix',
        notes: document.getElementById('booking-notes')?.value || '',
        modalToClose: null
      });
    });
  }

  // 2. Instant Modal Form Submit
  const modalForm = document.getElementById('modal-booking-form');
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      processBookingSubmit({
        form: modalForm,
        name: document.getElementById('modal-booking-name')?.value,
        phone: document.getElementById('modal-booking-phone')?.value,
        eventType: document.getElementById('modal-booking-event-type')?.value,
        packageSelect: document.getElementById('modal-booking-package'),
        date: document.getElementById('modal-booking-date')?.value,
        time: document.getElementById('modal-booking-time')?.value || 'Flexible',
        venue: document.getElementById('modal-booking-venue')?.value,
        budget: '₹3,000 - ₹6,000',
        theme: 'Pastel Dream / Custom Theme',
        notes: document.getElementById('modal-booking-notes')?.value || '',
        modalToClose: 'booking-modal'
      });
    });
  }
}

async function processBookingSubmit(cfg) {
  const submitBtn = cfg.form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.innerHTML : 'Confirm Booking';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Securing Reservation...`;
  }

  const selectedPkgOpt = cfg.packageSelect ? cfg.packageSelect.selectedOptions[0] : null;
  const pkgVal = cfg.packageSelect ? cfg.packageSelect.value : 'custom';

  const payload = {
    customerName: (cfg.name || '').trim(),
    mobile: (cfg.phone || '').trim(),
    email: '',
    eventType: cfg.eventType || 'Birthday Party',
    eventDate: cfg.date,
    eventTime: cfg.time || 'Flexible',
    venueAddress: (cfg.venue || '').trim(),
    budget: cfg.budget || 'Standard',
    packageId: pkgVal || 'custom',
    packageName: selectedPkgOpt && pkgVal ? selectedPkgOpt.text : 'Custom Bespoke Setup',
    colorTheme: cfg.theme || 'Pastel Theme',
    notes: (cfg.notes || '').trim()
  };

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok && data.success) {
      cfg.form.reset();
      if (cfg.modalToClose) {
        closeModal(cfg.modalToClose);
      }
      try {
        const localBookings = JSON.parse(localStorage.getItem('yuvi_bookings_data') || '[]');
        localBookings.unshift(data.booking);
        localStorage.setItem('yuvi_bookings_data', JSON.stringify(localBookings.slice(0, 50)));
      } catch (e) {}
      showBookingSuccessModal(data.booking);
      return;
    } else {
      throw new Error(data.error || 'Server error occurred');
    }
  } catch (err) {
    // Offline / Live Server fallback
    const estimatedAmount = selectedPkgOpt ? (Number(selectedPkgOpt.getAttribute('data-price')) || 2499) : 2499;
    const generatedBooking = {
      id: `TPH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      status: 'pending',
      estimatedAmount: estimatedAmount,
      createdAt: new Date().toISOString()
    };
    try {
      const localBookings = JSON.parse(localStorage.getItem('yuvi_bookings_data') || '[]');
      localBookings.unshift(generatedBooking);
      localStorage.setItem('yuvi_bookings_data', JSON.stringify(localBookings));
    } catch (e) {}

    cfg.form.reset();
    if (cfg.modalToClose) {
      closeModal(cfg.modalToClose);
    }
    showBookingSuccessModal(generatedBooking);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}

function showBookingSuccessModal(booking) {
  const modal = document.getElementById('confirmation-modal');
  if (!modal) return;

  const idElem = document.getElementById('confirm-booking-id');
  const detailsElem = document.getElementById('confirm-booking-details');
  const waBtn = document.getElementById('confirm-whatsapp-btn');

  if (idElem) idElem.textContent = booking.id;

  if (detailsElem) {
    detailsElem.innerHTML = `
      <div style="background: #fff8f9; border: 1px solid var(--border-light); border-radius: 12px; padding: 1.2rem; text-align: left; margin: 1.2rem 0; font-size: 0.9rem; line-height: 1.6;">
        <div style="color: var(--primary-pink); font-weight: 700; margin-bottom: 0.5rem; font-size: 1rem;">
          ${booking.packageName}
        </div>
        <p><strong>Customer:</strong> ${booking.customerName} (${booking.mobile})</p>
        <p><strong>Occasion:</strong> ${booking.eventType}</p>
        <p><strong>Date & Time:</strong> ${booking.eventDate} • ${booking.eventTime}</p>
        <p><strong>Venue:</strong> ${booking.venueAddress || 'To be shared'}</p>
        <p><strong>Estimated Amount:</strong> ₹${(booking.estimatedAmount || 2499).toLocaleString('en-IN')}</p>
      </div>
    `;
  }

  if (waBtn) {
    const waText = encodeURIComponent(
      `Hello The Party Hard! 🎈\nI have placed a new booking.\n\n• Booking ID: ${booking.id}\n• Customer: ${booking.customerName}\n• Event: ${booking.eventType}\n• Date: ${booking.eventDate} (${booking.eventTime})\n• Package: ${booking.packageName}\n\nPlease confirm availability!`
    );
    waBtn.href = `https://wa.me/919263667669?text=${waText}`;
  }

  openModal('confirmation-modal');
}

window.copyBookingId = function () {
  const idElem = document.getElementById('confirm-booking-id');
  if (idElem) {
    navigator.clipboard.writeText(idElem.textContent);
    alert(`Copied ${idElem.textContent} to clipboard!`);
  }
};

// ===================================================
// 5. TRACK BOOKING
// ===================================================
function initTracker() {
  const trackBtn = document.getElementById('track-search-btn');
  const trackInput = document.getElementById('track-input');
  const resultCard = document.getElementById('track-result-card');

  if (!trackBtn || !trackInput || !resultCard) return;

  const performTrack = async () => {
    const rawQuery = trackInput.value.trim();
    if (!rawQuery) {
      trackInput.focus();
      return;
    }

    trackBtn.disabled = true;
    trackBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking...`;

    try {
      const res = await fetch(`/api/bookings/track/${encodeURIComponent(rawQuery)}`);
      if (res.ok) {
        const bookings = await res.json();
        if (bookings && bookings.length > 0) {
          renderTrackingResult(bookings[0]);
          resultCard.style.display = 'block';
          resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      throw new Error('Fallback to local lookup');
    } catch (err) {
      // LocalStorage & Offline Fallback
      const queryClean = rawQuery.toLowerCase();
      const digitsOnly = rawQuery.replace(/\D/g, '');
      const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

      const localBookings = JSON.parse(localStorage.getItem('yuvi_bookings_data') || '[]');
      const defaultDemo = [
        {
          id: "TPH-2026-8708",
          customerName: "yaari gamer",
          mobile: "8083553450",
          eventType: "Baby Shower",
          eventDate: "2027-06-12",
          eventTime: "Morning (9:00 AM - 12:00 PM)",
          venueAddress: "New atwarpur dhalai road",
          packageName: "Surprise Bedroom Balloon Canopy & Fairy Lights",
          status: "pending",
          estimatedAmount: 1499,
          createdAt: "2026-10-27T05:01:38.696Z"
        },
        {
          id: "YUVI-2026-3417",
          customerName: "PRITAM KUMAR",
          mobile: "6204274718",
          eventType: "Weddings",
          eventDate: "2027-06-14",
          eventTime: "Evening (5:00 PM - 8:00 PM)",
          venueAddress: "PATNA",
          packageName: "baby theme",
          status: "completed",
          estimatedAmount: 3000,
          createdAt: "2026-10-26T09:23:24.222Z"
        }
      ];
      const combined = [...localBookings, ...defaultDemo];
      const matched = combined.filter(b => {
        const bId = (b.id || '').toLowerCase();
        const bPhone = (b.mobile || '').replace(/\D/g, '');
        const bName = (b.customerName || '').toLowerCase();

        if (bId.includes(queryClean) || queryClean.includes(bId)) return true;
        if (digitsOnly.length >= 4 && (bId.includes(digitsOnly) || bPhone.includes(digitsOnly) || bPhone.includes(last10))) return true;
        if (rawQuery.length >= 3 && bName.includes(queryClean)) return true;
        return false;
      });

      if (matched.length > 0) {
        renderTrackingResult(matched[0]);
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        renderNotFoundCard(rawQuery);
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      trackBtn.disabled = false;
      trackBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Track Live Status`;
    }
  };

  trackBtn.addEventListener('click', performTrack);
  trackInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performTrack();
  });
}

function renderNotFoundCard(query) {
  const resultCard = document.getElementById('track-result-card');
  if (!resultCard) return;

  const safeQuery = String(query).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const waQuery = encodeURIComponent(`Hello The Party Hard, mujhe apni booking status check karne me help chahiye. My query: ${query}`);

  resultCard.innerHTML = `
    <div style="text-align: center; padding: 2.2rem 1.2rem; background: #fff8f9; border: 1.5px dashed var(--primary-pink); border-radius: 16px;">
      <div style="width: 58px; height: 58px; border-radius: 50%; background: #ffe4e8; display: inline-flex; align-items: center; justify-content: center; font-size: 1.7rem; color: var(--primary-pink); margin-bottom: 0.85rem;">
        <i class="fa-solid fa-magnifying-glass-arrow-right"></i>
      </div>
      <h3 style="font-size: 1.35rem; color: var(--text-dark); margin-bottom: 0.35rem; font-weight: 700;">Koi Booking Record Nahi Mila</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.25rem; line-height: 1.5;">
        Aapne search kiya: <strong>"${safeQuery}"</strong>.<br>
        Kripya apna <strong>10-digit Mobile Number</strong> (e.g. <em>8083553450</em>) ya <strong>Booking ID</strong> (e.g. <em>TPH-2026-8708</em> ya sirf <em>8708</em>) verify karke dobara try karein.
      </p>
      <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
        <a href="https://wa.me/919263667669?text=${waQuery}" target="_blank" class="btn btn-whatsapp" style="font-size: 0.88rem; padding: 0.65rem 1.25rem; text-decoration: none;">
          <i class="fa-brands fa-whatsapp"></i> WhatsApp Support par Poochhein
        </a>
        <button class="btn btn-pink" onclick="document.getElementById('book').scrollIntoView({ behavior: 'smooth' }); setTimeout(function(){ const n = document.getElementById('booking-name'); if(n) n.focus(); }, 350);" style="font-size: 0.88rem; padding: 0.65rem 1.25rem;">
          <i class="fa-regular fa-calendar-check"></i> Nayi Booking Karein
        </button>
      </div>
    </div>
  `;
}

function renderTrackingResult(booking) {
  const resultCard = document.getElementById('track-result-card');
  if (!resultCard) return;

  const status = (booking.status || 'pending').toLowerCase();
  
  let step1Class = 'done';
  let step2Class = status === 'pending' ? 'active' : (status === 'cancelled' ? '' : 'done');
  let step3Class = status === 'confirmed' ? 'active' : (status === 'completed' ? 'done' : '');
  let step4Class = status === 'completed' ? 'done active' : '';

  let statusBadgeColor = 'var(--status-pending)';
  let statusBadgeText = 'Under Review / Pending Confirmation';

  if (status === 'confirmed') {
    statusBadgeColor = 'var(--status-confirmed)';
    statusBadgeText = 'Confirmed & Decorator Assigned';
  } else if (status === 'completed') {
    statusBadgeColor = 'var(--status-completed)';
    statusBadgeText = 'Event Successfully Completed';
  } else if (status === 'cancelled') {
    statusBadgeColor = 'var(--status-cancelled)';
    statusBadgeText = 'Booking Cancelled';
  }

  resultCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
      <div>
        <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--primary-pink); letter-spacing: 0.1em; font-weight: 700;">Live Status</span>
        <h3 style="font-size: 1.6rem; color: var(--text-dark); margin: 0.2rem 0;">${booking.id}</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">Placed on: ${new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>
      <div>
        <span style="display: inline-block; padding: 0.35rem 1rem; border-radius: 999px; background: #fff0f3; border: 1px solid ${statusBadgeColor}; color: ${statusBadgeColor}; font-weight: 700; font-size: 0.82rem;">
          ${statusBadgeText}
        </span>
      </div>
    </div>

    <!-- Timeline Steps -->
    <div class="track-timeline">
      <div class="track-step ${step1Class}">
        <div class="track-step-dot"><i class="fa-regular fa-file-lines"></i></div>
        <div class="track-step-title">Order Received</div>
      </div>
      <div class="track-step ${step2Class}">
        <div class="track-step-dot"><i class="fa-regular fa-user"></i></div>
        <div class="track-step-title">Assigned</div>
      </div>
      <div class="track-step ${step3Class}">
        <div class="track-step-dot"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
        <div class="track-step-title">Preparation</div>
      </div>
      <div class="track-step ${step4Class}">
        <div class="track-step-dot"><i class="fa-solid fa-gift"></i></div>
        <div class="track-step-title">Ready!</div>
      </div>
    </div>

    <!-- Details Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; background: #fff8f9; border: 1px solid var(--border-light); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
      <div>
        <p style="color: var(--primary-pink); font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Customer</p>
        <p style="font-weight: 600; color: var(--text-dark);">${booking.customerName}</p>
        <p style="color: var(--text-muted); font-size: 0.85rem;">📞 ${booking.mobile}</p>
      </div>
      <div>
        <p style="color: var(--primary-pink); font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Occasion & Timing</p>
        <p style="font-weight: 600; color: var(--text-dark);">${booking.eventType}</p>
        <p style="color: var(--text-muted); font-size: 0.85rem;">📅 ${booking.eventDate} (${booking.eventTime})</p>
      </div>
      <div>
        <p style="color: var(--primary-pink); font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Selected Setup</p>
        <p style="font-weight: 600; color: var(--text-dark);">${booking.packageName}</p>
        <p style="color: var(--primary-pink); font-weight: 700; font-size: 0.85rem;">₹${(booking.estimatedAmount || 2499).toLocaleString('en-IN')}</p>
      </div>
      <div>
        <p style="color: var(--primary-pink); font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Delivery Venue</p>
        <p style="color: var(--text-dark); font-size: 0.88rem;">${booking.venueAddress || 'To be shared'}</p>
      </div>
    </div>

    <div style="display: flex; gap: 1rem; justify-content: flex-end; flex-wrap: wrap;">
      <a href="https://wa.me/919263667669?text=Hello%20The%20Party%20Hard,%20inquiring%20about%20Booking%20ID%20${booking.id}" target="_blank" class="btn btn-whatsapp" style="font-size: 0.85rem;">
        <i class="fa-brands fa-whatsapp"></i> Chat with Support
      </a>
      <button class="btn btn-white-pill" onclick="window.print()" style="font-size: 0.85rem;">
        <i class="fa-solid fa-print"></i> Print Details
      </button>
    </div>
  `;
}

// ===================================================
// 6. CONTACT ENQUIRY
// ===================================================
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

    const payload = {
      name: document.getElementById('contact-name').value,
      phone: document.getElementById('contact-phone').value,
      message: document.getElementById('contact-msg').value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Thank you! We will get in touch with you shortly.');
        form.reset();
        return;
      }
    } catch (err) {
      alert('Thank you! Your enquiry has been received. Our team will contact you shortly on WhatsApp.');
      form.reset();
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

// ===================================================
// 7. MODALS
// ===================================================
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('open');
    });
  });
}

window.openModal = function (id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
};

window.closeModal = function (id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
};

window.openBookingModalForPackage = function (packageId) {
  // 1. Check if Instant Booking Modal exists (NO PAGE SCROLLING!)
  const modal = document.getElementById('booking-modal');
  if (modal) {
    const modalPkgSelect = document.getElementById('modal-booking-package');
    const mainPkgSelect = document.getElementById('booking-package');

    if (modalPkgSelect) {
      if (packageId) {
        modalPkgSelect.value = packageId;
      }
      modalPkgSelect.dispatchEvent(new Event('change'));
    }
    if (mainPkgSelect && packageId) {
      mainPkgSelect.value = packageId;
      mainPkgSelect.dispatchEvent(new Event('change'));
    }

    updateModalPackagePreview(packageId);

    const modalDate = document.getElementById('modal-booking-date');
    if (modalDate) {
      const today = new Date().toISOString().split('T')[0];
      modalDate.min = today;
      if (!modalDate.value) modalDate.value = today;
    }

    // Open Modal Instantly without ANY scrolling!
    openModal('booking-modal');

    setTimeout(() => {
      const nameInput = document.getElementById('modal-booking-name');
      if (nameInput) nameInput.focus();
    }, 200);
    return;
  }

  // Fallback to standalone booking page if modal is missing
  window.location.href = 'booking.html' + (packageId ? '?package=' + encodeURIComponent(packageId) : '');
};

window.updateModalPackagePreview = function (packageId) {
  const previewWrap = document.getElementById('modal-pkg-preview');
  if (!previewWrap) return;

  const previewImg = document.getElementById('modal-preview-img');
  const previewCat = document.getElementById('modal-preview-cat');
  const previewTitle = document.getElementById('modal-preview-title');
  const previewPrice = document.getElementById('modal-preview-price');
  const submitBtn = document.getElementById('modal-submit-btn');

  const servicesList = window.allServices || [];
  const matched = servicesList.find(s => s.id === packageId);

  if (matched) {
    if (previewImg) previewImg.src = matched.image || 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800';
    if (previewCat) previewCat.textContent = matched.categoryLabel || 'Curated Setup';
    if (previewTitle) previewTitle.textContent = matched.title;
    if (previewPrice) previewPrice.textContent = `Starts ₹${(matched.priceStart || 1999).toLocaleString('en-IN')} • Free On-Site Setup`;
    if (submitBtn) submitBtn.innerHTML = `<i class="fa-regular fa-calendar-check"></i> Confirm Booking (₹${(matched.priceStart || 1999).toLocaleString('en-IN')})`;
  } else {
    if (previewImg) previewImg.src = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800';
    if (previewCat) previewCat.textContent = 'Custom Bespoke Setup';
    if (previewTitle) previewTitle.textContent = 'Custom Event Balloon Styling';
    if (previewPrice) previewPrice.textContent = 'Packages start from ₹1,499 • Custom Colors & Themes';
    if (submitBtn) submitBtn.innerHTML = `<i class="fa-regular fa-calendar-check"></i> Confirm Reservation`;
  }
};

window.openServiceDetailModal = function (serviceId) {
  const service = allServices.find(s => s.id === serviceId);
  if (!service) return;

  const title = document.getElementById('detail-title');
  const body = document.getElementById('detail-body');

  if (title) title.textContent = service.title;
  if (body) {
    body.innerHTML = `
      <div style="position: relative; height: 280px; border-radius: 14px; overflow: hidden; margin-bottom: 1.5rem;">
        <img src="${service.image}" alt="${service.title}" style="width: 100%; height: 100%; object-fit: cover;">
        <span class="pkg-badge" style="position: absolute; top: 1rem; left: 1rem;">${service.badge || 'Signature'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <span class="pkg-cat-name">${service.categoryLabel}</span>
        <div class="pkg-price" style="font-size: 1.4rem;">₹${service.priceStart.toLocaleString('en-IN')}</div>
      </div>
      <p style="color: var(--text-body); margin-bottom: 1.5rem; line-height: 1.6;">${service.description}</p>
      
      <h4 style="color: var(--text-dark); font-size: 1rem; margin-bottom: 0.75rem;">Package Inclusions:</h4>
      <ul style="list-style: none; margin-bottom: 2rem;">
        ${service.features.map(f => `
          <li style="display: flex; align-items: center; gap: 0.6rem; color: var(--text-body); margin-bottom: 0.5rem; font-size: 0.9rem;">
            <i class="fa-regular fa-circle-check" style="color: var(--primary-pink);"></i> ${f}
          </li>
        `).join('')}
      </ul>

      <div style="display: flex; gap: 1rem;">
        <button class="btn btn-pink" style="flex-grow: 1;" onclick="closeModal('detail-modal'); openBookingModalForPackage('${service.id}');">
          <i class="fa-regular fa-calendar-check"></i> Book This Setup
        </button>
        <a href="https://wa.me/919263667669?text=Hello%20The%20Party%20Hard,%20I%20am%20interested%20in%20${encodeURIComponent(service.title)}" target="_blank" class="btn btn-whatsapp">
          <i class="fa-brands fa-whatsapp"></i> Ask on WhatsApp
        </a>
      </div>
    `;
  }

  openModal('detail-modal');
};

window.filterGalleryByCat = function(category) {
  const filterBtn = document.querySelector(`.filter-tab-pill[data-filter="${category}"]`);
  if (filterBtn) {
    filterBtn.click();
  }
  const packagesSection = document.getElementById('packages');
  if (packagesSection) {
    packagesSection.scrollIntoView({ behavior: 'smooth' });
  }
};

/* ===================================================
   HIDDEN OWNER ACCESS (Completely Invisible to Visitors)
   1. Press Ctrl + Shift + A anywhere on website
   2. Triple-click on the YUVI Logo in header
   3. Or visit direct URL: /admin.html
=================================================== */
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    window.location.href = 'admin.html';
  }
});

let logoClickCount = 0;
let logoClickTimer = null;
const brandLogo = document.querySelector('.brand-logo');
if (brandLogo) {
  brandLogo.addEventListener('click', (e) => {
    logoClickCount++;
    clearTimeout(logoClickTimer);
    if (logoClickCount >= 3) {
      e.preventDefault();
      logoClickCount = 0;
      window.location.href = 'admin.html';
      return;
    }
    logoClickTimer = setTimeout(() => {
      logoClickCount = 0;
    }, 1200);
  });
}

/* ===================================================
   CELEBRATION WELCOME EXPERIENCE & CONFETTI ENGINE
=================================================== */

let welcomeConfettiAnimationId = null;
let welcomeParticles = [];

function initWelcomeExperience() {
  const modal = document.getElementById('welcome-modal');
  if (!modal) return;

  // Backdrop click closes modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeWelcomeModal();
    }
  });

  // ESC key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeWelcomeModal();
    }
  });

  // Check if visitor has already been welcomed in this session
  const alreadyWelcomed = sessionStorage.getItem('yuvi_welcomed');
  if (!alreadyWelcomed) {
    // Show after 650ms delay for smooth landing
    setTimeout(() => {
      showWelcomeModal(false);
    }, 650);
  }
}

window.showWelcomeModal = function (force = false) {
  const modal = document.getElementById('welcome-modal');
  if (!modal) return;

  modal.classList.add('open');
  sessionStorage.setItem('yuvi_welcomed', 'true');

  // Trigger celebration confetti
  startWelcomeConfetti();
};

window.closeWelcomeModal = function () {
  const modal = document.getElementById('welcome-modal');
  if (modal) {
    modal.classList.remove('open');
  }
  stopWelcomeConfetti();
};

window.handleWelcomeExplore = function () {
  // Mini celebration burst
  window.fireCelebrationConfetti(window.innerWidth / 2, window.innerHeight / 2);
  closeWelcomeModal();

  // Smooth scroll to packages
  setTimeout(() => {
    const pkgSection = document.getElementById('packages');
    if (pkgSection) {
      pkgSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, 250);
};

window.handleWelcomeChat = function () {
  closeWelcomeModal();
  setTimeout(() => {
    if (window.openAiChat) {
      window.openAiChat('Namaste! Mujhe The Party Hard ke best packages aur trending designs dikhao.');
    }
  }, 300);
};

// Canvas Confetti Implementation
function startWelcomeConfetti() {
  const canvas = document.getElementById('welcome-confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = document.documentElement.clientWidth || window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#e85072', '#f06292', '#f59e0b', '#38b2ac', '#805ad5', '#f472b6', '#fbbf24', '#38bdf8'];
  welcomeParticles = [];
  
  // Create celebration particles
  const count = Math.min(100, Math.floor(window.innerWidth / 12));
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI) - Math.PI; // upwards spread
    const speed = Math.random() * 12 + 6;
    welcomeParticles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 220,
      y: window.innerHeight * 0.75,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.22,
      friction: 0.985,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.4 ? 'circle' : 'rect',
      opacity: 1,
      fade: Math.random() * 0.008 + 0.005
    });
  }

  if (welcomeConfettiAnimationId) {
    cancelAnimationFrame(welcomeConfettiAnimationId);
  }

  function renderConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeCount = 0;

    welcomeParticles.forEach(p => {
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.opacity -= p.fade;

      if (p.opacity > 0 && p.y < canvas.height + 50) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        }
        ctx.restore();
      }
    });

    if (activeCount > 0) {
      welcomeConfettiAnimationId = requestAnimationFrame(renderConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      welcomeConfettiAnimationId = null;
    }
  }

  renderConfetti();
}

function stopWelcomeConfetti() {
  if (welcomeConfettiAnimationId) {
    cancelAnimationFrame(welcomeConfettiAnimationId);
    welcomeConfettiAnimationId = null;
  }
  const canvas = document.getElementById('welcome-confetti-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Global Celebration Confetti Trigger for Clicks
window.fireCelebrationConfetti = function (x, y) {
  const canvas = document.getElementById('welcome-confetti-canvas') || document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const startX = (typeof x === 'number' && !isNaN(x)) ? x : window.innerWidth / 2;
  const startY = (typeof y === 'number' && !isNaN(y)) ? y : window.innerHeight / 2;
  
  const colors = ['#e85072', '#f06292', '#f59e0b', '#38b2ac', '#805ad5', '#fbbf24'];
  const burstParticles = [];
  
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;
    burstParticles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.25,
      friction: 0.98,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      fade: Math.random() * 0.02 + 0.012
    });
  }

  function renderBurst() {
    let active = 0;
    burstParticles.forEach(p => {
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.opacity -= p.fade;

      if (p.opacity > 0) {
        active++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    if (active > 0) {
      requestAnimationFrame(renderBurst);
    }
  }

  renderBurst();
};

/* ===================================================
   SCROLL REVEAL OBSERVER
=================================================== */
let revealObserver = null;

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: reveal everything immediately if browser does not support IntersectionObserver
    document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  });

  observeRevealElements();
}

window.observeRevealElements = function () {
  if (!revealObserver) return;
  document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)').forEach(el => {
    revealObserver.observe(el);
  });
};

// ===================================================
// 8. ANIMATED STATS COUNTERS (Cubic Ease-Out)
// ===================================================
function initAnimatedStatsCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetVal = parseFloat(el.getAttribute('data-target'));
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        animateNumberCount(el, targetVal, decimals);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.25 });

  statNumbers.forEach(el => obs.observe(el));
}

function animateNumberCount(el, target, decimals) {
  let start = 0;
  const duration = 1800;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * easeProgress;

    el.textContent = decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toString();

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
    }
  }

  requestAnimationFrame(step);
}



// ===================================================
// 11. 3D TILT ON PACKAGE & STAT CARDS
// ===================================================
function initCard3DTilt() {
  if (window.innerWidth <= 768) return;

  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.package-card, .stat-card');
    if (!card || card.dataset.tiltInit) return;
    card.dataset.tiltInit = 'true';

    card.addEventListener('mousemove', (ev) => {
      const rect = card.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) translateY(-8px) scale(1.015)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
