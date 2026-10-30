/**
 * THE PARTY HARD - AI Assistant (Smart Concierge)
 * Handles bilingual conversation, smart intent triggers,
 * and complete persistent chat history across sessions.
 */

let activeSendMessage = null;

// Global Helpers (defined immediately so inline HTML handlers never fail)
window.openAiChat = function(initialPrompt) {
  const chatBox = document.getElementById('ai-chat-box');
  const tooltip = document.querySelector('.chat-bubble-tooltip');
  const chatInput = document.getElementById('ai-chat-input');
  if (chatBox) {
    chatBox.classList.add('open');
    if (tooltip) tooltip.style.display = 'none';
    if (initialPrompt && typeof initialPrompt === 'string') {
      window.askAiPrompt(initialPrompt);
    } else if (chatInput) {
      setTimeout(() => chatInput.focus(), 150);
    }
  }
};

window.askAiPrompt = function(query) {
  if (!query || !query.trim()) return;
  const chatBox = document.getElementById('ai-chat-box');
  const tooltip = document.querySelector('.chat-bubble-tooltip');
  const chatInput = document.getElementById('ai-chat-input');

  if (chatBox && !chatBox.classList.contains('open')) {
    chatBox.classList.add('open');
    if (tooltip) tooltip.style.display = 'none';
  }

  if (typeof activeSendMessage === 'function') {
    activeSendMessage(query.trim());
  } else {
    // If called before init completes, try again shortly
    setTimeout(() => {
      if (typeof activeSendMessage === 'function') {
        activeSendMessage(query.trim());
      }
    }, 150);
  }

  if (chatInput) {
    setTimeout(() => chatInput.focus(), 150);
  }
};

window.sendAiQuickMessage = window.askAiPrompt;

window.handleHeroAiSubmit = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  const heroInput = document.getElementById('hero-ai-input');
  if (!heroInput) return;
  const val = heroInput.value.trim();
  if (!val) return;
  heroInput.value = '';
  window.askAiPrompt(val);
};

window.hideHeroAiCard = function() {
  const heroCard = document.getElementById('hero-ai-widget');
  if (heroCard) {
    heroCard.style.opacity = '0';
    heroCard.style.transform = 'translateY(12px) scale(0.95)';
    heroCard.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      heroCard.style.display = 'none';
    }, 250);
  }
};

window.closeAiTooltip = function() {
  const tooltip = document.querySelector('.chat-bubble-tooltip');
  if (tooltip) {
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(10px) scale(0.9)';
    tooltip.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      tooltip.style.display = 'none';
    }, 250);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAIChat);
} else {
  initAIChat();
}

function initAIChat() {
  const launcher = document.getElementById('ai-chat-launcher');
  const chatBox = document.getElementById('ai-chat-box');
  const closeBtn = document.getElementById('ai-chat-close');
  const clearBtn = document.getElementById('ai-chat-clear');
  const chatForm = document.getElementById('ai-chat-form');
  const chatInput = document.getElementById('ai-chat-input');
  const messagesContainer = document.getElementById('ai-chat-messages');
  const tooltip = document.querySelector('.chat-bubble-tooltip');

  if (!launcher || !chatBox || !chatForm || !chatInput || !messagesContainer) return;

  // Session & History Management
  let currentSessionId = localStorage.getItem('yuvi_chat_session_id');
  if (!currentSessionId) {
    currentSessionId = 'CHAT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('yuvi_chat_session_id', currentSessionId);
  }

  // Load existing history on start
  loadChatHistory();

  // Toggle Chat Box
  launcher.addEventListener('click', () => {
    const isOpen = chatBox.classList.contains('open');
    if (isOpen) {
      chatBox.classList.remove('open');
    } else {
      chatBox.classList.add('open');
      if (tooltip) tooltip.style.display = 'none';
      chatInput.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chatBox.classList.remove('open');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Start a fresh conversation?')) {
        localStorage.removeItem('yuvi_history_' + currentSessionId);
        currentSessionId = 'CHAT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem('yuvi_chat_session_id', currentSessionId);
        messagesContainer.innerHTML = `
          <div class="chat-msg bot">
            Hi! I'm <strong>Party Hard AI</strong> 👋<br><br>
            Welcome to <strong>The Party Hard</strong>! How can I help you today? Aap mujhse decoration ideas, packages, pricing, budget recommendations ya booking status ke bare mein pooch sakte hain!
          </div>
        `;
      }
    });
  }

  // Handle Quick Chips
  document.querySelectorAll('.chat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (query) {
        window.askAiPrompt(query);
      }
    });
  });

  // Handle Form Submission
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    sendMessage(text);
  });

  activeSendMessage = sendMessage;

  async function sendMessage(text) {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Append and save user message
    appendMessage(text, 'user', null, null, timeStr);
    saveMessageToHistory('user', text, null, null, timeStr);
    showTypingIndicator();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: currentSessionId })
      });

      const data = await res.json();
      removeTypingIndicator();

      if (res.ok && data && data.reply) {
        if (data.sessionId) {
          currentSessionId = data.sessionId;
          localStorage.setItem('yuvi_chat_session_id', currentSessionId);
        }
        appendMessage(data.reply, 'bot', data.action, data.data, timeStr);
        saveMessageToHistory('bot', data.reply, data.action, data.data, timeStr);
        handleChatAction(data.action, data.data);
      } else {
        const fallback = generateLocalChatResponse(text);
        appendMessage(fallback.reply, 'bot', fallback.action, fallback.data, timeStr);
        saveMessageToHistory('bot', fallback.reply, fallback.action, fallback.data, timeStr);
        handleChatAction(fallback.action, fallback.data);
      }
    } catch (err) {
      removeTypingIndicator();
      // VS Code Live Server Mode Client Fallback
      const fallback = generateLocalChatResponse(text);
      appendMessage(fallback.reply, 'bot', fallback.action, fallback.data, timeStr);
      saveMessageToHistory('bot', fallback.reply, fallback.action, fallback.data, timeStr);
      handleChatAction(fallback.action, fallback.data);
    }
  }

  function appendMessage(content, sender, action = null, actionData = null, time = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg', sender);

    // Basic markdown conversion
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    msgDiv.innerHTML = formatted;

    if (time) {
      const timeSpan = document.createElement('div');
      timeSpan.style.fontSize = '0.65rem';
      timeSpan.style.opacity = '0.7';
      timeSpan.style.marginTop = '4px';
      timeSpan.style.textAlign = sender === 'user' ? 'right' : 'left';
      timeSpan.textContent = time;
      msgDiv.appendChild(timeSpan);
    }

    // Mini Package Cards inside Chat
    const packagesList = (actionData && actionData.packages) ? actionData.packages : (Array.isArray(actionData) ? actionData : null);
    if ((action === 'SHOW_PACKAGES' || packagesList) && Array.isArray(packagesList) && packagesList.length > 0) {
      const pkgsContainer = document.createElement('div');
      pkgsContainer.style.marginTop = '0.65rem';
      pkgsContainer.style.display = 'flex';
      pkgsContainer.style.flexDirection = 'column';
      pkgsContainer.style.gap = '0.45rem';

      packagesList.forEach(pkg => {
        const card = document.createElement('div');
        card.className = 'chat-pkg-card';
        card.innerHTML = `
          <img src="${pkg.image || 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800'}" alt="${pkg.title}" class="chat-pkg-thumb" onerror="this.src='https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800'">
          <div class="chat-pkg-details">
            <div class="chat-pkg-name">${pkg.title}</div>
            <div class="chat-pkg-price">₹${(pkg.priceStart || 1999).toLocaleString('en-IN')}</div>
          </div>
          <button class="btn btn-pink" style="font-size: 0.72rem; padding: 0.35rem 0.65rem; white-space: nowrap;" onclick="openBookingModalForPackage('${pkg.id}')">
            Book Now
          </button>
        `;
        pkgsContainer.appendChild(card);
      });
      msgDiv.appendChild(pkgsContainer);
    }

    // Quick Suggestion Chips inside bot message
    const suggestionsList = (actionData && actionData.suggestions && Array.isArray(actionData.suggestions)) ? actionData.suggestions : null;
    if (suggestionsList && suggestionsList.length > 0) {
      const sugWrap = document.createElement('div');
      sugWrap.className = 'chat-suggestions-wrap';
      suggestionsList.forEach(sug => {
        const chip = document.createElement('button');
        chip.className = 'chat-reply-chip';
        chip.textContent = sug;
        chip.onclick = () => window.askAiPrompt(sug);
        sugWrap.appendChild(chip);
      });
      msgDiv.appendChild(sugWrap);
    }

    // Interactive Action Buttons
    if (action === 'OPEN_BOOKING') {
      const actionBtn = document.createElement('div');
      actionBtn.style.marginTop = '0.75rem';
      actionBtn.innerHTML = `
        <button class="btn btn-pink" style="width: 100%; font-size: 0.8rem; padding: 0.5rem 0.8rem;" onclick="openBookingModalForPackage('${actionData && actionData.packageId ? actionData.packageId : ''}')">
          <i class="fa-regular fa-calendar-check"></i> Open Booking Form Now
        </button>
      `;
      msgDiv.appendChild(actionBtn);
    } else if (action === 'OPEN_WHATSAPP') {
      const actionBtn = document.createElement('div');
      actionBtn.style.marginTop = '0.75rem';
      actionBtn.innerHTML = `
        <a href="https://wa.me/919263667669?text=Hello%20The%20Party%20Hard,%20mujhe%20decoration%20ke%20baare%20mein%20baat%20karni%20hai" target="_blank" class="btn btn-whatsapp" style="width: 100%; font-size: 0.8rem; padding: 0.5rem 0.8rem; text-decoration: none;">
          <i class="fa-brands fa-whatsapp"></i> Chat with Owner on WhatsApp
        </a>
      `;
      msgDiv.appendChild(actionBtn);
    } else if (action === 'OPEN_GALLERY' && actionData) {
      const cat = typeof actionData === 'string' ? actionData : (actionData.category || 'all');
      const actionBtn = document.createElement('div');
      actionBtn.style.marginTop = '0.75rem';
      actionBtn.innerHTML = `
        <button class="btn btn-white-pill" style="width: 100%; font-size: 0.8rem; padding: 0.5rem 0.8rem;" onclick="filterGalleryByCat('${cat}')">
          <i class="fa-regular fa-images"></i> View ${cat.toUpperCase()} Gallery
        </button>
      `;
      msgDiv.appendChild(actionBtn);
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function loadChatHistory() {
    try {
      const historyKey = 'yuvi_history_' + currentSessionId;
      const saved = JSON.parse(localStorage.getItem(historyKey) || '[]');
      if (saved && Array.isArray(saved) && saved.length > 0) {
        messagesContainer.innerHTML = '';
        saved.forEach(msg => {
          if (msg && msg.content) {
            appendMessage(msg.content, msg.sender || 'bot', msg.action, msg.data, msg.time);
          }
        });
      }
    } catch (e) {
      console.warn('Error loading chat history:', e);
    }
  }

  function saveMessageToHistory(sender, content, action, data, time) {
    try {
      const historyKey = 'yuvi_history_' + currentSessionId;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.push({ sender, content, action, data, time, timestamp: new Date().toISOString() });
      localStorage.setItem(historyKey, JSON.stringify(history.slice(-40)));

      // Also sync to all sessions registry (for Admin Dashboard Live Server view)
      const allSessions = JSON.parse(localStorage.getItem('yuvi_all_chats') || '[]');
      let current = allSessions.find(s => s.sessionId === currentSessionId);
      if (!current) {
        current = {
          sessionId: currentSessionId,
          startedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          summary: content.substring(0, 50),
          messages: []
        };
        allSessions.unshift(current);
      } else {
        current.lastMessageAt = new Date().toISOString();
        if (sender === 'user') current.summary = content.substring(0, 50);
      }
      current.messages.push({ sender, text: content, time });
      localStorage.setItem('yuvi_all_chats', JSON.stringify(allSessions.slice(0, 30)));
    } catch (e) {
      console.warn('Error saving chat history:', e);
    }
  }

  function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.id = 'chat-typing-indicator';
    typing.classList.add('chat-msg', 'bot');
    typing.innerHTML = `
      <div style="display: flex; gap: 4px; align-items: center; padding: 4px 6px;">
        <span style="width: 6px; height: 6px; background: var(--primary-pink); border-radius: 50%; animation: blink 1.2s infinite;"></span>
        <span style="width: 6px; height: 6px; background: var(--primary-pink); border-radius: 50%; animation: blink 1.2s infinite 0.2s;"></span>
        <span style="width: 6px; height: 6px; background: var(--primary-pink); border-radius: 50%; animation: blink 1.2s infinite 0.4s;"></span>
      </div>
    `;
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById('chat-typing-indicator');
    if (typing) typing.remove();
  }

  function handleChatAction(action, data) {
    if (action === 'OPEN_TRACK') {
      const trackSection = document.getElementById('track');
      if (trackSection) {
        trackSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action === 'OPEN_BOOKING') {
      if (typeof window.openBookingModalForPackage === 'function') {
        window.openBookingModalForPackage(data && data.packageId ? data.packageId : '');
      }
    }
  }
}

// Helper to filter gallery from AI chat
window.filterGalleryByCat = function(category) {
  const filterBtn = document.querySelector(`.filter-tab-pill[data-filter="${category}"]`);
  if (filterBtn) {
    filterBtn.click();
    const packagesSection = document.getElementById('packages');
    if (packagesSection) {
      packagesSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

// Client-Side Conversational Fallback (Works on VS Code Live Server / Static Hosting)
function generateLocalChatResponse(message) {
  const query = (message || '').toLowerCase().trim();
  const allServices = (window.DEFAULT_SERVICES || JSON.parse(localStorage.getItem('yuvi_services_data') || '[]'));

  // 1. Check for Budget / Pure Number input (e.g. "2000", "3000", "30000", "under 4000", "2500 me")
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
      const luxury = allServices.filter(s => s.priceStart >= 4000 || s.category === 'wedding' || s.category === 'corporate');
      return {
        reply: `🎈 **₹${detectedBudget.toLocaleString('en-IN')}** ek grand luxury celebration budget hai! Isme hum Grand Golden Double Ring Setup, 14ft Spiral Gateways, aur LED Monograms provide karte hain. Kounsa setup pasand karenge?`,
        action: 'SHOW_PACKAGES',
        data: {
          packages: luxury.slice(0, 3),
          suggestions: ["Wedding Setup 💍", "Corporate Gateway 🏢", "Talk to Owner 📞"]
        }
      };
    } else {
      let matching = allServices.filter(s => s.priceStart <= detectedBudget + 500);
      matching.sort((a, b) => Math.abs(a.priceStart - detectedBudget) - Math.abs(b.priceStart - detectedBudget));

      if (matching.length > 0) {
        return {
          reply: `🎈 Aapke **₹${detectedBudget.toLocaleString('en-IN')}** budget ke according ye best decoration packages available hain:`,
          action: 'SHOW_PACKAGES',
          data: {
            packages: matching.slice(0, 3),
            suggestions: ["Book Now 📅", "Birthday Ideas 🎂", "Talk to Owner 📞"]
          }
        };
      } else {
        return {
          reply: `Humare starting packages **₹1,499** se start hote hain (Romantic Bedroom Canopy ya Birthday Setup). Aap hume call ya WhatsApp karke customized package banwa sakte hain! 🎈`,
          action: 'OPEN_WHATSAPP',
          data: { phone: '919263667669' }
        };
      }
    }
  }

  // 2. Location & Doorstep Service ("patna", "kaha", "kahan", "bihar", "ghar", "area", "address", "shop", "venue")
  if (query.includes('patna') || query.includes('kaha') || query.includes('kahan') || query.includes('location') || query.includes('address') || query.includes('shop') || query.includes('ghar') || query.includes('area') || query.includes('doorstep') || query.includes('bihar') || query.includes('service area') || query.includes('kaha se ho') || query.includes('city')) {
    return {
      reply: `📍 **The Party Hard Service Areas & Doorstep Setup:**\n\n` +
        `Haan ji! Hum **pure Patna aur aas-paas ke sabhi areas** mein doorstep balloon decoration deliver karte hain! 🚗🎈\n\n` +
        `• Kankarbagh, Boring Road, Bailey Road, Raja Bazar\n` +
        `• Danapur, Saguna More, Patliputra Colony\n` +
        `• Rajendra Nagar, Anisabad, Ashiana Nagar, City Area\n\n` +
        `Chahe aapka bedroom ho, terrace, hall ya cafe — humari team aapke venue par aakar poora setup ready karti hai!\n\nAap Patna mein kis area mein decorate karwana chahte hain?`,
      action: 'SHOW_SUGGESTIONS',
      data: {
        suggestions: [
          "Birthday Ideas 🎂",
          "Mera budget ₹2,500 hai 💰",
          "Book Now 📅",
          "Talk to Owner 📞"
        ]
      }
    };
  }

  // 3. Timing, Urgency & Express Setup ("urgent", "kitna time", "kitni der", "samay", "kitne ghante", "express", "aaj")
  if (query.includes('urgent') || query.includes('time') || query.includes('der') || query.includes('samay') || query.includes('ghante') || query.includes('express') || query.includes('kitni der') || query.includes('jaldi') || query.includes('same day') || query.includes('kitna time')) {
    return {
      reply: `⏰ **Setup Timing & Express Delivery:**\n\n` +
        `• ⚡ **Standard Setup Time**: Normal room ya ring arch decoration **1 se 2 ghante** mein ready ho jata hai.\n` +
        `• 🚀 **Urgent / Same-Day Booking**: Haan ji! Urgent setup ke liye hum **2 se 3 ghante ke express notice** par bhi decoration ready kar dete hain.\n` +
        `• 🕒 **Service Timings**: Subah **8:00 AM se raat 10:00 PM** tak (Daily 7 Days open)!\n\n` +
        `Aapka event aaj hai ya aage kisi date par?`,
      action: 'SHOW_SUGGESTIONS',
      data: {
        suggestions: [
          "Urgent Booking Call 📞",
          "Book for Today ⚡",
          "Birthday Packages 🎂",
          "Packages & Prices 📋"
        ]
      }
    };
  }

  // 4. Payment, Advance & Discounts ("advance", "payment", "upi", "cash", "gpay", "discount", "offer", "kam karo")
  if (query.includes('advance') || query.includes('payment') || query.includes('upi') || query.includes('cash') || query.includes('gpay') || query.includes('phonepe') || query.includes('discount') || query.includes('offer') || query.includes('kam karo') || query.includes('kam') || query.includes('chhut')) {
    return {
      reply: `💳 **Payment & Discounts Information:**\n\n` +
        `• 🔒 **Zero Advance Pressure**: Booking form fill karte waqt koi upfront advance nahi lagta! Hum call/WhatsApp par slot confirm karte hain.\n` +
        `• 💸 **Multiple Payment Options**: Setup poora dekh lene ke baad aap UPI (Google Pay, PhonePe, Paytm) ya Cash de sakte hain.\n` +
        `• 🎁 **Discounts & Offers**: Direct online packages par starting price sirf **₹1,499** se hai aur multiple setups par special discount milta hai!\n\n` +
        `Kounsa setup pasand karenge?`,
      action: 'SHOW_SUGGESTIONS',
      data: {
        suggestions: [
          "View Packages & Prices 📋",
          "Mera budget ₹2,000 hai 💰",
          "Book Now 📅",
          "Talk to Owner 📞"
        ]
      }
    };
  }

  // 5. Balloon Quality & Safety ("quality", "phutega", "phootenge", "helium", "gas", "safe", "bacche", "latex", "chrome")
  if (query.includes('quality') || query.includes('phoot') || query.includes('phut') || query.includes('burst') || query.includes('helium') || query.includes('gas') || query.includes('safe') || query.includes('bacche') || query.includes('latex') || query.includes('chrome') || query.includes('tikega')) {
    return {
      reply: `🎈 **Balloon Quality & Durability:**\n\n` +
        `• ✨ **100% Premium Grade**: Hum thick metallic chrome, pastel latex aur foil balloons use karte hain jo bina phootey **24 se 48 ghante** tak fresh aur tight rehte hain.\n` +
        `• 👶 **Safe for Children**: Non-toxic materials aur electric cold-air blower use kiya jata hai.\n` +
        `• 💡 **LED Neon Accents**: Sturdy metal arch frames aur glowing LED neon signs provide karte hain jo bilkul shock-proof aur safe hain!\n\n` +
        `Aapko pastel color theme pasand hai ya metallic chrome?`,
      action: 'SHOW_SUGGESTIONS',
      data: {
        suggestions: [
          "Pastel Dream Ring Arch 🌸",
          "Metallic Black & Gold 👑",
          "Birthday Ideas 🎂",
          "Talk to Owner 📞"
        ]
      }
    };
  }

  // 6. Customization & Pinterest/Instagram Photos ("custom", "photo", "pic", "image", "instagram", "pinterest", "pasand")
  if (query.includes('custom') || query.includes('photo') || query.includes('pic') || query.includes('image') || query.includes('apni marzi') || query.includes('pasand') || query.includes('instagram') || query.includes('pinterest') || query.includes('aisa banega') || query.includes('design')) {
    return {
      reply: `🎨 **Custom Theme & Reference Photos:**\n\n` +
        `Haan bilkul! Agar aapke paas Instagram, Pinterest ya internet ka koi bhi photo ya customized idea hai, toh hum 100% same-to-same ready kar denge! 🪄\n\n` +
        `Aap apna photo direct WhatsApp par share kar sakte hain:\n` +
        `📱 **WhatsApp**: +91 92636 67669\n\n` +
        `Hum colours, balloon density aur LED signs aapke preference ke according customize kar denge!`,
      action: 'OPEN_WHATSAPP',
      data: { phone: '919263667669' }
    };
  }

  // 7. Trending & Best Recommendations ("kuch acha", "kuch accha", "badhiya", "sundar", "trending", "suggest", "best")
  if (query.includes('kuch acha') || query.includes('kuch accha') || query.includes('badhiya') || query.includes('sundar') || query.includes('trending') || query.includes('suggest') || query.includes('best') || query.includes('top') || query.includes('kuch naya') || query.includes('acha wala')) {
    return {
      reply: `🌟 **The Party Hard Top Trending Recommendations:**\n\n` +
        `1. 🌸 **Pastel Dream Circular Ring Arch** (₹2,499) — Warm LED Neon sign, pastel pink, lavender & chrome balloons. Sabse popular!\n` +
        `2. 👑 **Royal Black & Metallic Gold Milestone** (₹2,999) — 3ft number foils aur luxury adult look.\n` +
        `3. ☁️ **Pastel Clouds & Giant 4ft Plush Teddy** (₹3,299) — Baby Shower & 1st Birthday ke liye super cute!\n` +
        `4. 🌹 **Romantic Bedroom Canopy & Fairy Lights** (₹1,499) — Anniversary aur birthday midnight surprise!\n\n` +
        `Kounsa setup aapke event ke liye perfect lag raha hai?`,
      action: 'SHOW_PACKAGES',
      data: {
        packages: allServices.slice(0, 3),
        suggestions: ["Book Trending Setup 📅", "Mera budget ₹2,500 hai 💰", "Talk to Owner 📞"]
      }
    };
  }

  // 8. How to Book ("kaise book", "booking karni", "book karna", "order", "process")
  if (query.includes('kaise book') || query.includes('booking karni') || query.includes('book karna') || query.includes('order') || query.includes('process') || query.includes('karna hai') || query.includes('book kaise')) {
    return {
      reply: `📅 **Booking Process Bahut Aasan Hai:**\n\n` +
        `1️⃣ Niche '**Book Now**' button par click karein.\n` +
        `2️⃣ Apna Naam, Mobile Number, Event Date aur Occasion select karein.\n` +
        `3️⃣ 'Confirm Booking' dabate hi aapko instant **Booking ID** mil jayegi!\n` +
        `4️⃣ Humari team 15 minutes mein call/WhatsApp karke slot lock kar degi.\n\n` +
        `Chaliye main aapke liye booking form open kar deta hoon! 🎈`,
      action: 'OPEN_BOOKING',
      data: {}
    };
  }

  // 9. Conversational Companion Talk ("tum kaun ho", "kya haal", "kaise ho", "kese ho", "aur batao")
  if (query.includes('tum kaun') || query.includes('naam kya') || query.includes('kya haal') || query.includes('kaise ho') || query.includes('kese ho') || query.includes('kya kar sakte') || query.includes('robot') || query.includes('aur batao') || query.includes('kaise h')) {
    return {
      reply: `Namaste ji! Main mast hoon! 😊🎉\n\nMain hoon **The Party Hard AI Assistant** — aapka personal celebration concierge!\n\nMain aapke celebration ke liye best balloon decorations recommend kar sakta hoon, aapke budget mein packages dhoondh sakta hoon, booking karwa sakta hoon aur status track kar sakta hoon!\n\nAap bataiye, kiska celebration plan ho raha hai aaj? 🎈`,
      action: 'SHOW_SUGGESTIONS',
      data: {
        suggestions: [
          "Birthday Ideas 🎂",
          "Packages & Prices 📋",
          "Mera budget ₹2,500 hai 💰",
          "Talk to Owner 📞"
        ]
      }
    };
  }

  // 10. Affirmations / "yes", "haan", "ok", "bolo", "batao", "help"
  if (/^(yes|haan|ha|haa|yup|yeah|ok|okay|theek|thik|accha|achha|bolo|batao|btao|suno|help|bhai)\b/i.test(query) || query === 'yes' || query === 'ok' || query === 'bolo' || query === 'haan') {
    return {
      reply: `Bilkul! 🎈 Main aapki poori help karunga.\n\nKripya batayein:\n🎂 **Kounsa event celebrate kar rahe hain?** (Birthday, Wedding, Baby Shower, Anniversary)\n💰 **Ya aapka approximate budget kya hai?** (e.g. ₹2,000, ₹3,500, ₹5,000)\n\nAap niche kisi bhi option par click kar sakte hain:`,
      action: 'SHOW_SUGGESTIONS',
      data: {
        suggestions: [
          "Birthday Ideas 🎂",
          "Mera budget ₹2,500 hai 💰",
          "Baby Shower Setup 🍼",
          "Wedding Decor 💍",
          "Talk to Owner 📞"
        ]
      }
    };
  }

  // 11. Farewells / "bye", "end", "khatam", "thank you"
  if (/^(bye|goodbye|end|khatam|alvida|thank you|thanks|dhanyawad|shukriya|tata|done)\b/i.test(query) || query === 'end' || query === 'bye') {
    return {
      reply: `Aapka bahut bahut shukriya! 🙏 Agar koi bhi doubt ho ya custom balloon setup chahiye ho, toh kabhi bhi message karein ya humare owner se connect karein:\n\n• 📱 **WhatsApp / Call**: +91 92636 67669\n• 📧 **Email**: partyhard2707@gmail.com\n\nAapka celebration shandar ho! 🎈✨`,
      action: 'OPEN_WHATSAPP',
      data: { phone: '919263667669' }
    };
  }

  // 12. Greeting
  if (query.includes('hello') || query.includes('hi') || query.includes('namaste') || query.includes('hey') || query.includes('pranam')) {
    return {
      reply: `Namaste! 🙏 Main hoon **Party Hard AI Assistant** — The Party Hard ka smart helper!\n\nMain aapki kaise madad kar sakta hoon?\n• 🎈 Birthday / Wedding / Baby Shower decoration ideas dekhna\n• 💰 Apne budget ke hisaab se best package dhundhna (jaise ₹2,000 ya ₹3,000)\n• 📅 Booking confirm karna aur status track karna\n• 📞 Owner se WhatsApp par direct connect hona\n\nBataiye aaj kounsa celebration plan kar rahe hain? 😊`,
      action: 'SHOW_SUGGESTIONS',
      data: {
        suggestions: [
          "Birthday Ideas 🎂",
          "Packages & Prices 📋",
          "Mera budget ₹3,000 hai 💰",
          "Wedding Decor 💍",
          "Talk to Owner 📞"
        ]
      }
    };
  }

  // 13. Birthday ideas
  if (query.includes('birthday') || query.includes('bday') || query.includes('janamdin') || query.includes('cake smash') || query.includes('kids')) {
    const bday = allServices.filter(s => s.category === 'birthday');
    return {
      reply: `🎂 **Birthday Celebrations ke liye Top Ideas:**\n\n` +
        `1. **Pastel Dream Ring Arch** (₹2,499) — LED Neon Sign, Ring backdrop & pastel chrome balloons.\n` +
        `2. **Royal Black & Gold Adult Milestone Arch** (₹2,999) — Chrome balloons & 3ft number foils.\n` +
        `3. **Surprise Bedroom Balloon Canopy** (₹1,499) — 100 ceiling balloons, fairy lights & memory photo clips!\n\n` +
        `Aap niche click karke direct booking kar sakte hain ya gallery explore karein:`,
      action: 'SHOW_PACKAGES',
      data: {
        packages: bday.slice(0, 3),
        suggestions: ["Mera budget ₹2,000 hai 💰", "View Birthday Gallery 📸", "Book Birthday 🎂", "Talk to Owner 📞"]
      }
    };
  }

  // 6. Packages & prices
  if (query.includes('package') || query.includes('packages') || query.includes('rate') || query.includes('rates') || query.includes('price') || query.includes('prices') || query.includes('cost') || query.includes('karcha') || query.includes('list') || query.includes('kitna')) {
    return {
      reply: `🎈 **The Party Hard Complete Rate List & Packages:**\n\n` +
        `🎂 **Birthday Parties** — ₹1,499 se ₹3,899 (Pastel Ring Arch, Neon Sign & Cutouts)\n` +
        `🍼 **Baby Shower & Naming** — ₹2,199 se ₹3,999 (Pastel Clouds, 4ft Teddy & Mom-to-Be Neon)\n` +
        `💖 **Anniversaries** — ₹1,799 se ₹5,499 (Rose Gold Heart Arch & Fairy Lights)\n` +
        `💍 **Weddings & Haldi** — ₹3,499 se ₹8,999 (Double Ring Arch & Fresh Florals)\n` +
        `🏢 **Corporate Events** — ₹3,799 se ₹7,999 (Grand Spiral Gateway & Welcome Stage)\n\n` +
        `Sabhi packages mein free setup aur dismantle included hai!`,
      action: 'OPEN_GALLERY',
      data: {
        category: 'all',
        suggestions: ["Birthday Ideas 🎂", "Mera budget ₹2,500 hai 💰", "Book Now 📅", "Talk to Owner 📞"]
      }
    };
  }

  // 7. Wedding decoration
  if (query.includes('wedding') || query.includes('shaadi') || query.includes('shadi') || query.includes('engagement') || query.includes('haldi') || query.includes('mehendi') || query.includes('sangeet')) {
    const wed = allServices.filter(s => s.category === 'wedding');
    return {
      reply: `💍 **Shaadi & Engagement Decoration Services:**\n\n` +
        `✨ **Royal Double Ring Arch** with champagne balloons & fresh floral accents (₹5,499)\n` +
        `✨ **Haldi / Mehendi Yellow Marigold Traditional Setup** (₹3,899)\n` +
        `✨ **Luxury Bridal Entry Gateway & Proposal Canopy**\n\n` +
        `Main aapke liye Wedding Booking Form open kar raha hoon!`,
      action: 'SHOW_PACKAGES',
      data: {
        packages: wed.slice(0, 3),
        suggestions: ["Open Booking Form 📅", "Haldi Setup 🌼", "Talk to Owner 📞"]
      }
    };
  }

  // 8. Baby shower
  if (query.includes('baby') || query.includes('shower') || query.includes('naming') || query.includes('godh bharai') || query.includes('welcome baby')) {
    const baby = allServices.filter(s => s.category === 'babyshower');
    return {
      reply: `🍼 **Baby Shower & Welcome Baby Highlights:**\n\n` +
        `🌸 **Pastel Clouds & 4ft Giant Plush Teddy Bear Setup** (₹3,299)\n` +
        `✨ Transparent LED 'B-A-B-Y' letter cubes & Mom-to-Be Neon Sign\n` +
        `✨ Welcome Prince / Princess cradle & door gateway decoration (₹2,199)\n\n` +
        `Gallery mein aur designs check karein!`,
      action: 'SHOW_PACKAGES',
      data: {
        packages: baby.slice(0, 3),
        suggestions: ["Book Baby Shower 🍼", "Pink Theme Photos 🌸", "Talk to Owner 📞"]
      }
    };
  }

  // 9. Anniversary
  if (query.includes('anniversary') || query.includes('saalgirah') || query.includes('salgirah') || query.includes('romantic')) {
    const anni = allServices.filter(s => s.category === 'anniversary');
    return {
      reply: `💖 **Anniversary Special Celebrations:**\n\n` +
        `🌹 **Romantic Candlelight & Rose Petal Pathway** (₹1,799)\n` +
        `🎈 **Rose Gold Heart Arch with Fairy Lights** (₹2,999)\n` +
        `✨ **Metallic Silver & Golden Jubilee 25th / 50th Milestone Foil Arches** (₹3,499)\n\n` +
        `Kya aap room decoration chahte hain ya banquet/terrace setup?`,
      action: 'SHOW_PACKAGES',
      data: {
        packages: anni.slice(0, 3),
        suggestions: ["Book Anniversary 💖", "Bedroom Canopy 🌹", "Talk to Owner 📞"]
      }
    };
  }

  // 10. Track booking
  if (query.includes('track') || query.includes('status') || query.includes('booking id') || query.startsWith('tph-') || query.startsWith('yuvi-')) {
    return {
      reply: `🔎 Apni booking ka live status dekhne ke liye apna **Booking ID** (jaise TPH-2026-8941) ya **Registered Mobile Number** niche Track Booking section mein enter karein!`,
      action: 'OPEN_TRACK',
      data: null
    };
  }

  // 11. Human support / WhatsApp
  if (query.includes('human') || query.includes('owner') || query.includes('call') || query.includes('whatsapp') || query.includes('contact') || query.includes('number') || query.includes('phone') || query.includes('baat')) {
    return {
      reply: `📞 **The Party Hard Direct Support:**\n\n` +
        `• 📱 **Phone / WhatsApp**: +91 92636 67669\n` +
        `• 📧 **Email**: partyhard2707@gmail.com\n` +
        `• ⏰ **Timings**: 8:00 AM - 10:00 PM (Daily 7 Days)\n\n` +
        `Niche click karke seedha WhatsApp par baat karein!`,
      action: 'OPEN_WHATSAPP',
      data: { phone: '919263667669' }
    };
  }

  // Conversational Fallback with Helpful Guidance
  return {
    reply: `Arey bilkul! 🎈 Main The Party Hard se hoon. Main aapke event ke according best balloon decoration plan karne mein madad kar sakta hoon!\n\n` +
      `Aap Birthday, Anniversary, Baby Shower ya Wedding decor dekhna chahte hain? Ya apna approximate budget batayein (jaise ₹2,000 ya ₹3,500), main instant best package dikha dunga! 😊`,
    action: 'SHOW_SUGGESTIONS',
    data: {
      suggestions: [
        "Birthday Ideas 🎂",
        "Mera budget ₹2,500 hai 💰",
        "Packages & Prices 📋",
        "Wedding Decor 💍",
        "Talk to Owner 📞"
      ]
    }
  };
}
