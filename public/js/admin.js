/**
 * YUVI DECORATION - Admin Dashboard Logic
 */

let adminToken = sessionStorage.getItem('yuvi_admin_token') || null;
let allAdminBookings = [];
let allAdminEnquiries = [];
let allAdminServices = [];
let allAdminChats = [];
let currentActiveSession = null;
let currentFilter = 'all';
let currentDecorCat = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

function initAdmin() {
  const loginForm = document.getElementById('admin-login-form');
  const logoutBtn = document.getElementById('admin-logout-btn');

  if (adminToken) {
    showDashboard();
  } else {
    showLogin();
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value.trim();

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          adminToken = data.token;
          sessionStorage.setItem('yuvi_admin_token', adminToken);
          showDashboard();
          return;
        } else {
          alert(data.error || 'Invalid credentials');
          return;
        }
      } catch (err) {
        // VS Code Live Server Mode fallback authentication
        const u = username.toLowerCase();
        if ((u === 'partyhard2707@gmail.com' || u === 'admin') && password === 'yuvi@2026') {
          adminToken = 'yuvi-local-token-' + Date.now();
          sessionStorage.setItem('yuvi_admin_token', adminToken);
          showDashboard();
          return;
        } else {
          alert('Invalid email or password.');
          return;
        }
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      adminToken = null;
      sessionStorage.removeItem('yuvi_admin_token');
      showLogin();
    });
  }

  // Tabs Switching
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      document.getElementById('tab-content-bookings').style.display = target === 'bookings' ? 'block' : 'none';
      document.getElementById('tab-content-decorations').style.display = target === 'decorations' ? 'block' : 'none';
      document.getElementById('tab-content-enquiries').style.display = target === 'enquiries' ? 'block' : 'none';
      const chatsTab = document.getElementById('tab-content-chats');
      if (chatsTab) chatsTab.style.display = target === 'chats' ? 'block' : 'none';

      if (target === 'decorations') {
        loadAdminDecorations();
      } else if (target === 'enquiries') {
        loadEnquiries();
      } else if (target === 'chats') {
        loadAdminChats();
      } else {
        loadBookings();
      }
    });
  });

  // Booking Filter Buttons
  document.querySelectorAll('[data-admin-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-admin-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-admin-filter');
      applyFiltersAndSearch();
    });
  });

  // Booking Search input
  const searchInput = document.getElementById('admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFiltersAndSearch();
    });
  }

  // Decorations Category Filter
  document.querySelectorAll('[data-decor-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-decor-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDecorCat = btn.getAttribute('data-decor-cat');
      applyDecorFiltersAndSearch();
    });
  });

  // Decorations Search input
  const decorSearch = document.getElementById('admin-decor-search');
  if (decorSearch) {
    decorSearch.addEventListener('input', () => {
      applyDecorFiltersAndSearch();
    });
  }

  // AI Chats Search input
  const chatSearch = document.getElementById('admin-chats-search');
  if (chatSearch) {
    chatSearch.addEventListener('input', () => {
      applyChatSearch();
    });
  }

  // Add Decoration Form Submission
  const addDecorForm = document.getElementById('add-decoration-form');
  if (addDecorForm) {
    addDecorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = addDecorForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

      const payload = {
        title: document.getElementById('decor-new-title').value,
        category: document.getElementById('decor-new-cat').value,
        priceStart: Number(document.getElementById('decor-new-price').value),
        image: document.getElementById('decor-new-image').value,
        badge: document.getElementById('decor-new-badge').value,
        tags: document.getElementById('decor-new-tags').value,
        description: document.getElementById('decor-new-desc').value,
        features: document.getElementById('decor-new-features').value
      };

      try {
        const res = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          alert('🎉 Decoration package added successfully!');
          addDecorForm.reset();
          closeAddDecorationModal();
          loadAdminDecorations();
          return;
        }
      } catch (err) {
        // Live Server Mode Fallback (LocalStorage)
        const categoryLabels = {
          birthday: "Birthday Parties",
          wedding: "Weddings",
          babyshower: "Baby Shower",
          corporate: "Corporate Events",
          anniversary: "Anniversaries",
          other: "Other Occasions"
        };
        const newPkg = {
          id: `srv-${payload.category.substring(0, 4)}-${Date.now().toString().slice(-4)}`,
          title: payload.title,
          category: payload.category,
          categoryLabel: categoryLabels[payload.category] || "Custom Occasion",
          priceStart: payload.priceStart,
          rating: 5.0,
          reviewCount: 1,
          badge: payload.badge || "New Design",
          description: payload.description,
          features: payload.features ? payload.features.split('\n').filter(Boolean) : ["Custom Theme Colors", "Setup & Dismantle Included"],
          image: payload.image || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80",
          tags: payload.tags ? payload.tags.split(',').map(t=>t.trim()) : [payload.category]
        };

        const currentLocal = JSON.parse(localStorage.getItem('yuvi_services_data') || 'null') || (window.DEFAULT_SERVICES ? [...window.DEFAULT_SERVICES] : []);
        currentLocal.unshift(newPkg);
        localStorage.setItem('yuvi_services_data', JSON.stringify(currentLocal));

        alert('🎉 Decoration package added successfully!');
        addDecorForm.reset();
        closeAddDecorationModal();
        loadAdminDecorations();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }
}

function showLogin() {
  document.getElementById('admin-login-view').style.display = 'flex';
  document.getElementById('admin-dashboard-view').style.display = 'none';
}

function showDashboard() {
  document.getElementById('admin-login-view').style.display = 'none';
  document.getElementById('admin-dashboard-view').style.display = 'block';
  loadBookings();
  loadAdminChatsCount();
}

async function loadBookings() {
  try {
    const res = await fetch('/api/admin/bookings');
    if (res.ok) {
      const data = await res.json();
      allAdminBookings = data.bookings;
      renderStats(data.stats);
      applyFiltersAndSearch();
      return;
    }
  } catch (err) {
    // VS Code Live Server Mode Fallback
  }

  // Fallback to local storage or demo bookings
  const local = JSON.parse(localStorage.getItem('yuvi_bookings_data') || '[]');
  const defaultDemo = [
    {
      id: "YUVI-2026-8941",
      customerName: "Rahul Sharma",
      mobile: "9876543210",
      eventType: "Birthday Party",
      eventDate: "2026-11-05",
      eventTime: "17:00",
      venueAddress: "Flat 402, Royal Palms, Link Road",
      packageName: "Pastel Dream Birthday Ring Arch",
      status: "confirmed",
      estimatedAmount: 2499,
      createdAt: new Date().toISOString()
    },
    {
      id: "YUVI-2026-8942",
      customerName: "Pooja Verma",
      mobile: "9123456780",
      eventType: "Baby Shower",
      eventDate: "2026-11-12",
      eventTime: "15:30",
      venueAddress: "Hotel Grand Heritage",
      packageName: "Pastel Clouds Baby Shower & Teddy Setup",
      status: "pending",
      estimatedAmount: 3299,
      createdAt: new Date().toISOString()
    }
  ];

  allAdminBookings = local.length > 0 ? local : defaultDemo;
  const stats = {
    total: allAdminBookings.length,
    pending: allAdminBookings.filter(b => b.status === 'pending').length,
    confirmed: allAdminBookings.filter(b => b.status === 'confirmed').length,
    completed: allAdminBookings.filter(b => b.status === 'completed').length,
    estimatedRevenue: allAdminBookings.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 2499), 0)
  };
  renderStats(stats);
  applyFiltersAndSearch();
}

function renderStats(stats) {
  document.getElementById('stat-total-bookings').textContent = stats.total;
  document.getElementById('stat-pending-bookings').textContent = stats.pending;
  document.getElementById('stat-confirmed-bookings').textContent = stats.confirmed;
  document.getElementById('stat-revenue').textContent = '₹' + stats.estimatedRevenue.toLocaleString('en-IN');
}

function applyFiltersAndSearch() {
  const query = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();

  let filtered = allAdminBookings;
  if (currentFilter !== 'all') {
    filtered = filtered.filter(b => (b.status || '').toLowerCase() === currentFilter);
  }

  if (query) {
    filtered = filtered.filter(b => 
      b.id.toLowerCase().includes(query) ||
      b.customerName.toLowerCase().includes(query) ||
      b.mobile.includes(query) ||
      b.eventType.toLowerCase().includes(query)
    );
  }

  renderBookingsTable(filtered);
}

function renderBookingsTable(bookings) {
  const tbody = document.getElementById('admin-bookings-tbody');
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No bookings matching the current filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const status = (b.status || 'pending').toLowerCase();
    const waText = encodeURIComponent(
      `Hello ${b.customerName}! 🎈 This is Yuvi Decoration regarding your booking ${b.id} for ${b.eventType} on ${b.eventDate}. Current status is: ${status.toUpperCase()}. Let us know if you need any adjustments!`
    );

    return `
      <tr>
        <td>
          <strong style="color: var(--primary-pink); font-weight: 700;">${b.id}</strong><br>
          <small style="color: var(--text-muted);">${new Date(b.createdAt).toLocaleDateString('en-IN')}</small>
        </td>
        <td>
          <strong style="color: var(--text-dark);">${b.customerName}</strong><br>
          <a href="tel:${b.mobile}" style="color: var(--text-muted); text-decoration: none;">
            <i class="fa-solid fa-phone"></i> ${b.mobile}
          </a>
        </td>
        <td>
          <span style="font-weight: 600; color: var(--text-dark);">${b.eventType}</span><br>
          <small style="color: var(--primary-pink);">📅 ${b.eventDate} (${b.eventTime})</small>
        </td>
        <td>
          <span style="color: var(--text-dark); font-weight: 500;">${b.packageName}</span><br>
          <small style="color: var(--text-muted);">📍 ${b.venueAddress || 'Standard'}</small>
        </td>
        <td>
          <select onchange="updateBookingStatus('${b.id}', this.value)" class="form-control" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; border-radius: 6px; width: auto; background: #fff;">
            <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>✅ Confirmed</option>
            <option value="completed" ${status === 'completed' ? 'selected' : ''}>🎉 Completed</option>
            <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
          </select>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <a href="https://wa.me/91${b.mobile.replace(/\D/g,'')}?text=${waText}" target="_blank" class="btn btn-whatsapp" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" title="WhatsApp Customer">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
            <button onclick="deleteBooking('${b.id}')" class="btn btn-white-pill" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3);" title="Delete Record">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateBookingStatus = async function(id, newStatus) {
  try {
    const res = await fetch(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (res.ok) {
      loadBookings();
    } else {
      alert(data.error || 'Failed to update status');
    }
  } catch (err) {
    console.error('Status update failed:', err);
    alert('Network error updating status');
  }
};

window.deleteBooking = async function(id) {
  if (!confirm(`Are you sure you want to delete booking ${id}?`)) return;

  try {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      loadBookings();
    } else {
      alert('Failed to delete booking');
    }
  } catch (err) {
    console.error('Delete failed:', err);
  }
};

async function loadEnquiries() {
  try {
    const res = await fetch('/api/admin/enquiries');
    allAdminEnquiries = await res.json();
    renderEnquiriesTable(allAdminEnquiries);
  } catch (err) {
    console.error('Failed to load enquiries:', err);
  }
}

function renderEnquiriesTable(enquiries) {
  const tbody = document.getElementById('admin-enquiries-tbody');
  if (!tbody) return;

  if (enquiries.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No contact enquiries received yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = enquiries.map(e => `
    <tr>
      <td>${new Date(e.date).toLocaleDateString('en-IN')}</td>
      <td><strong>${e.name}</strong></td>
      <td><a href="tel:${e.phone}" style="color: var(--primary-pink); text-decoration: none;">📞 ${e.phone}</a></td>
      <td>${e.email || '-'}</td>
      <td style="max-width: 300px;">${e.message}</td>
      <td>
        <a href="https://wa.me/91${e.phone.replace(/\D/g,'')}?text=Hello%20${encodeURIComponent(e.name)},%20this%20is%20Yuvi%20Decoration%20replying%20to%20your%20enquiry" target="_blank" class="btn btn-whatsapp" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">
          <i class="fa-brands fa-whatsapp"></i> Reply on WhatsApp
        </a>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// DECORATIONS MANAGEMENT (Add / Delete)
// ==========================================
async function loadAdminDecorations() {
  try {
    const res = await fetch('/api/services');
    if (res.ok) {
      allAdminServices = await res.json();
      const countBadge = document.getElementById('total-services-count');
      if (countBadge) countBadge.textContent = allAdminServices.length;
      applyDecorFiltersAndSearch();
      return;
    }
  } catch (err) {
    // Live Server mode fallback
  }

  const local = localStorage.getItem('yuvi_services_data');
  const parsedLocal = local ? JSON.parse(local) : null;
  if (parsedLocal && parsedLocal.length >= (window.DEFAULT_SERVICES || []).length && !parsedLocal.some(s => s.id === 'srv-baby-7375')) {
    allAdminServices = parsedLocal;
  } else {
    allAdminServices = window.DEFAULT_SERVICES || [];
    localStorage.setItem('yuvi_services_data', JSON.stringify(allAdminServices));
  }
  const countBadge = document.getElementById('total-services-count');
  if (countBadge) countBadge.textContent = allAdminServices.length;
  applyDecorFiltersAndSearch();
}

function applyDecorFiltersAndSearch() {
  const query = (document.getElementById('admin-decor-search')?.value || '').toLowerCase().trim();
  let filtered = allAdminServices;

  if (currentDecorCat !== 'all') {
    filtered = filtered.filter(s => s.category === currentDecorCat);
  }

  if (query) {
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(query) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(query))) ||
      (s.categoryLabel && s.categoryLabel.toLowerCase().includes(query))
    );
  }

  renderDecorationsTable(filtered);
}

function renderDecorationsTable(services) {
  const tbody = document.getElementById('admin-decorations-tbody');
  if (!tbody) return;

  if (services.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No decoration packages found. Click "+ Add New Decoration" to create one!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = services.map(s => `
    <tr>
      <td style="width: 80px;">
        <div style="width: 65px; height: 50px; border-radius: 8px; overflow: hidden; background: #faeef1;">
          <img src="${s.image}" alt="${s.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80'">
        </div>
      </td>
      <td>
        <strong style="color: var(--text-dark);">${s.title}</strong><br>
        ${s.badge ? `<span style="font-size: 0.72rem; background: #fff0f3; color: var(--primary-pink); padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 700;">${s.badge}</span>` : ''}
        <span style="font-size: 0.75rem; color: #f59e0b; margin-left: 0.4rem;">★ ${s.rating || 4.9}</span>
      </td>
      <td>
        <span style="font-size: 0.82rem; font-weight: 700; color: var(--primary-pink);">${s.categoryLabel}</span>
      </td>
      <td>
        <strong style="color: var(--text-dark); font-size: 1rem;">₹${s.priceStart.toLocaleString('en-IN')}</strong>
      </td>
      <td>
        <ul style="list-style: none; font-size: 0.78rem; color: var(--text-muted); margin: 0; padding: 0;">
          ${(s.features || []).slice(0, 2).map(f => `<li>• ${f}</li>`).join('')}
        </ul>
      </td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <button onclick="deleteDecoration('${s.id}')" class="btn btn-white-pill" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3);" title="Delete Decoration">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.openAddDecorationModal = function() {
  const modal = document.getElementById('add-decoration-modal');
  if (modal) modal.classList.add('open');
};

window.closeAddDecorationModal = function() {
  const modal = document.getElementById('add-decoration-modal');
  if (modal) modal.classList.remove('open');
};

window.previewDecorImage = function(url) {
  const wrap = document.getElementById('decor-image-preview-wrap');
  const img = document.getElementById('decor-image-preview');
  if (wrap && img && url.trim().length > 5) {
    img.src = url;
    wrap.style.display = 'block';
  } else if (wrap) {
    wrap.style.display = 'none';
  }
};

window.deleteDecoration = async function(id) {
  if (!confirm(`Are you sure you want to remove this decoration package (${id})? It will be removed immediately.`)) return;

  try {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      alert('Decoration deleted successfully!');
      loadAdminDecorations();
      return;
    }
  } catch (err) {
    // Live Server mode fallback
  }

  let currentLocal = JSON.parse(localStorage.getItem('yuvi_services_data') || 'null') || (window.DEFAULT_SERVICES ? [...window.DEFAULT_SERVICES] : []);
  currentLocal = currentLocal.filter(s => s.id !== id);
  localStorage.setItem('yuvi_services_data', JSON.stringify(currentLocal));
  alert('Decoration deleted successfully!');
  loadAdminDecorations();
};

/* ===================================================
   AI CHAT HISTORY & LEADS MANAGEMENT
=================================================== */

async function loadAdminChatsCount() {
  try {
    const res = await fetch('/api/admin/chats');
    if (res.ok) {
      const chats = await res.json();
      updateChatCounters(chats.length);
      return;
    }
  } catch (err) {}

  const localChats = JSON.parse(localStorage.getItem('yuvi_all_chats') || '[]');
  updateChatCounters(localChats.length);
}

function updateChatCounters(count) {
  const statBadge = document.getElementById('stat-total-chats');
  if (statBadge) statBadge.textContent = count;
  const tabBadge = document.getElementById('total-chats-count');
  if (tabBadge) tabBadge.textContent = count;
}

window.loadAdminChats = async function() {
  try {
    const res = await fetch('/api/admin/chats');
    if (res.ok) {
      allAdminChats = await res.json();
      updateChatCounters(allAdminChats.length);
      applyChatSearch();
      return;
    }
  } catch (err) {
    // VS Code Live Server Mode Fallback
  }

  const localChats = JSON.parse(localStorage.getItem('yuvi_all_chats') || '[]');
  if (localChats.length > 0) {
    allAdminChats = localChats;
  } else {
    // Default demo chat session so table is not empty
    allAdminChats = [
      {
        sessionId: "CHAT-2026-1001",
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
        summary: "Inquired about Birthday Arch under ₹3,000",
        messages: [
          { sender: "bot", text: "Hi! I'm Yuvi AI 👋 Welcome to YUVI.decoration! How can I help you today?", time: "10:15 AM" },
          { sender: "user", text: "Birthday decoration ideas dikhao", time: "10:16 AM" },
          { sender: "bot", text: "🎂 Top Birthday Themes: 1. Pastel Dream Ring Arch (₹2,499), 2. Royal Black & Gold Milestone Arch (₹2,999)...", time: "10:16 AM" },
          { sender: "user", text: "Mera budget ₹3,000 hai", time: "10:17 AM" },
          { sender: "bot", text: "🎈 Aapke ₹3,000 budget ke according humare paas top packages hain: Pastel Dream Birthday Ring Arch (₹2,499), Surprise Bedroom Canopy (₹1,499)!", time: "10:18 AM" }
        ]
      },
      {
        sessionId: "CHAT-2026-1002",
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        lastMessageAt: new Date(Date.now() - 7000000).toISOString(),
        summary: "Customer wanted to talk to human / owner",
        messages: [
          { sender: "bot", text: "Hi! I'm Yuvi AI 👋 Welcome to YUVI.decoration! How can I help you today?", time: "12:30 PM" },
          { sender: "user", text: "Talk to a human", time: "12:31 PM" },
          { sender: "bot", text: "📞 Yuvi.Decoration Direct Support: Phone & WhatsApp +91 92636 67669, Email partyhard2707@gmail.com. Timings: 8:00 AM - 10:00 PM.", time: "12:32 PM" }
        ]
      }
    ];
    localStorage.setItem('yuvi_all_chats', JSON.stringify(allAdminChats));
  }

  updateChatCounters(allAdminChats.length);
  applyChatSearch();
};

function applyChatSearch() {
  const query = (document.getElementById('admin-chats-search')?.value || '').toLowerCase().trim();
  let filtered = allAdminChats;

  if (query) {
    filtered = filtered.filter(c => 
      c.sessionId.toLowerCase().includes(query) ||
      (c.summary && c.summary.toLowerCase().includes(query)) ||
      (c.messages && c.messages.some(m => (m.text || '').toLowerCase().includes(query)))
    );
  }

  renderChatsTable(filtered);
}

function renderChatsTable(chats) {
  const tbody = document.getElementById('admin-chats-tbody');
  if (!tbody) return;

  if (chats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-regular fa-comments" style="font-size: 2rem; color: #fbcfe8; display: block; margin-bottom: 0.5rem;"></i>
          No chat conversations found matching your search.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = chats.map(c => {
    const started = new Date(c.startedAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const msgCount = (c.messages || []).length;
    const summary = c.summary || 'Customer inquiry';

    return `
      <tr>
        <td>
          <code style="background: #fdf2f8; color: var(--primary-pink); padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 700;">${c.sessionId}</code>
        </td>
        <td>
          <span style="font-size: 0.85rem; color: var(--text-dark);">${started}</span>
        </td>
        <td>
          <strong style="color: var(--text-dark); font-size: 0.9rem;">${summary}</strong>
          ${(c.messages && c.messages.length > 0) ? `<div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">Last message: "${escapeHtml(c.messages[c.messages.length - 1].text.substring(0, 50))}..."</div>` : ''}
        </td>
        <td>
          <span style="background: #eff6ff; color: #2563eb; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700;">
            ${msgCount} messages
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button onclick="viewChatSession('${c.sessionId}')" class="btn btn-pink" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
              <i class="fa-regular fa-eye"></i> View Transcript
            </button>
            <button onclick="deleteChatSession('${c.sessionId}')" class="btn btn-white-pill" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" title="Delete Session">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.viewChatSession = function(sessionId) {
  const session = allAdminChats.find(c => c.sessionId === sessionId);
  if (!session) return;

  currentActiveSession = session;
  const modal = document.getElementById('view-chat-modal');
  const title = document.getElementById('modal-chat-title');
  const subtitle = document.getElementById('modal-chat-subtitle');
  const transcript = document.getElementById('modal-chat-transcript');

  if (title) {
    title.innerHTML = `<i class="fa-solid fa-comments" style="color: var(--primary-pink);"></i> Session: ${session.sessionId}`;
  }
  if (subtitle) {
    const timeFormatted = new Date(session.startedAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    subtitle.textContent = `Started: ${timeFormatted} • Total ${session.messages.length} messages`;
  }

  if (transcript) {
    if (!session.messages || session.messages.length === 0) {
      transcript.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No messages in this chat session.</p>`;
    } else {
      transcript.innerHTML = session.messages.map(m => {
        const isBot = m.sender === 'bot';
        let formatted = (m.text || '')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');

        return `
          <div class="chat-bubble-row ${isBot ? 'bot' : 'user'}">
            <div class="chat-bubble-avatar ${isBot ? 'bot-icon' : 'user-icon'}">
              <i class="fa-solid ${isBot ? 'fa-robot' : 'fa-user'}"></i>
            </div>
            <div class="chat-bubble-content">
              <div>${formatted}</div>
              <div class="chat-bubble-time">${m.time || ''}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  if (modal) modal.classList.add('open');
};

window.closeViewChatModal = function() {
  const modal = document.getElementById('view-chat-modal');
  if (modal) modal.classList.remove('open');
};

window.copyCurrentChatTranscript = function() {
  if (!currentActiveSession || !currentActiveSession.messages) {
    alert('No active chat session to copy.');
    return;
  }

  let text = `=== YUVI DECORATION AI CHAT TRANSCRIPT ===\n`;
  text += `Session ID: ${currentActiveSession.sessionId}\n`;
  text += `Started At: ${currentActiveSession.startedAt}\n\n`;

  currentActiveSession.messages.forEach(m => {
    const role = m.sender === 'bot' ? 'Yuvi AI' : 'Customer';
    text += `[${m.time || ''}] ${role}: ${m.text}\n\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Chat transcript copied to clipboard!');
  }).catch(() => {
    alert('Copied to clipboard!');
  });
};

window.deleteChatSession = async function(sessionId) {
  if (!confirm(`Are you sure you want to delete chat session ${sessionId}? This action cannot be undone.`)) return;

  try {
    const res = await fetch(`/api/admin/chats/${sessionId}`, { method: 'DELETE' });
    if (res.ok) {
      // deleted on server
    }
  } catch (err) {}

  allAdminChats = allAdminChats.filter(c => c.sessionId !== sessionId);
  localStorage.setItem('yuvi_all_chats', JSON.stringify(allAdminChats));
  localStorage.removeItem('yuvi_history_' + sessionId);

  updateChatCounters(allAdminChats.length);
  applyChatSearch();
  alert('Chat session deleted successfully.');
};

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
