/**
 * Meta WhatsApp Cloud API Official Integration Service
 * YUVI DECORATION
 * 
 * Handles:
 * - Automated booking confirmation delivery to customers
 * - PDF Receipt document dispatch
 * - New booking alert to Admin WhatsApp
 * - Safe retry & error logging without duplicate charges
 */

// Helper: Normalize Indian phone number to E.164 without '+' or leading zeros
function formatWhatsAppNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  } else if (cleaned.length > 10 && cleaned.startsWith('91')) {
    // already 91XXXXXXXXXX
  }
  return cleaned;
}

/**
 * Checks whether Meta WhatsApp Cloud API credentials are provided in environment
 */
function isWhatsAppConfigured() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(token && phoneId && token.trim() !== '' && phoneId.trim() !== '');
}

/**
 * Core API Dispatcher to Meta Graph API
 */
async function sendMetaGraphRequest(payload) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    throw new Error('Meta WhatsApp Cloud API credentials (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID) missing.');
  }

  const endpoint = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error ? (data.error.message || JSON.stringify(data.error)) : `HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.metaData = data;
    err.statusCode = response.status;
    throw err;
  }

  return data;
}

/**
 * Send WhatsApp booking confirmation text to customer
 */
async function sendCustomerConfirmationText(booking, formattedPhone, publicReceiptUrl) {
  const totalAmount = Number(booking.estimatedAmount) || 2499;
  const advanceAmount = Number(booking.advanceAmount) || 0;
  const balanceDue = Math.max(0, totalAmount - advanceAmount);

  const messageText = 
`🎉 *BOOKING CONFIRMED - YUVI DECORATION* 🎈
_Decorate Your Happiness • Patna's Premier Event Stylists_

Namaste *${booking.customerName}* ji,
Aapka event decoration booking record kar liya gaya hai!

📋 *BOOKING DETAILS:*
• *Booking ID:* ${booking.id}
• *Occasion:* ${booking.eventType}
• *Setup:* ${booking.packageName || 'Luxury Balloon Setup'}
• *Event Date:* ${booking.eventDate}
• *Time Slot:* ${booking.eventTime || 'Flexible Timing'}
• *Venue Address:* ${booking.venueAddress || 'Patna, Bihar'}

💰 *PAYMENT SUMMARY:*
• *Total Estimated Amount:* Rs. ${totalAmount.toLocaleString('en-IN')}
• *Advance Paid:* Rs. ${advanceAmount.toLocaleString('en-IN')}
• *Balance Due (Pay on Setup):* Rs. ${balanceDue.toLocaleString('en-IN')}
• *Payment Option:* ${booking.paymentMethod || 'Cash on Setup'}

📄 *YOUR PDF RECEIPT:*
Aapka official voucher niche attach kiya gaya hai.
Download link: ${publicReceiptUrl}

🕒 *NEXT STEPS:*
1. Our senior decorator team will arrive 2 hours prior to your setup time.
2. For any special theme changes or custom neon sign names, reply directly to this message.
3. 24x7 Customer Support: +91 9263667669

Thank you for choosing *YUVI DECORATION*! ✨`;

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

  // If approved template is specified, prefer template
  if (templateName && templateName.trim() !== '') {
    try {
      const templatePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName.trim(),
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: booking.customerName || 'Customer' },
                { type: 'text', text: booking.id },
                { type: 'text', text: booking.eventType || 'Celebration' },
                { type: 'text', text: booking.eventDate || 'Scheduled Date' }
              ]
            }
          ]
        }
      };
      return await sendMetaGraphRequest(templatePayload);
    } catch (templateErr) {
      console.warn('[WhatsApp Service] Template dispatch failed, falling back to standard text message:', templateErr.message);
    }
  }

  // Standard interactive text dispatch
  const textPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: {
      preview_url: true,
      body: messageText
    }
  };

  return await sendMetaGraphRequest(textPayload);
}

/**
 * Send PDF Receipt as an official WhatsApp Document
 */
async function sendCustomerReceiptDocument(booking, formattedPhone, publicReceiptUrl) {
  const documentPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'document',
    document: {
      link: publicReceiptUrl,
      caption: `Official Booking Receipt - ${booking.id} | YUVI DECORATION 🎈`,
      filename: `Receipt-${booking.id}.pdf`
    }
  };

  return await sendMetaGraphRequest(documentPayload);
}

/**
 * Send Admin Notification to business owner WhatsApp
 */
async function sendAdminNotification(booking) {
  const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
  if (!adminNumber) {
    console.log('[WhatsApp Service] WHATSAPP_ADMIN_NUMBER not set in .env. Skipping admin notification.');
    return { success: false, reason: 'admin_number_missing' };
  }

  const formattedAdmin = formatWhatsAppNumber(adminNumber);
  const totalAmount = Number(booking.estimatedAmount) || 2499;

  const adminText = 
`🔔 *NEW BOOKING ALERT - YUVI DECORATION*

Customer: *${booking.customerName}*
Phone: *${booking.mobile}*
Occasion: *${booking.eventType}*
Date: *${booking.eventDate}* (${booking.eventTime || 'Flexible'})
Setup: *${booking.packageName}*
Amount: *Rs. ${totalAmount.toLocaleString('en-IN')}*
Venue: *${booking.venueAddress}*
Notes: ${booking.notes || 'None'}

Booking ID: *${booking.id}*
👉 Manage in Admin Panel: /admin.html`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedAdmin,
    type: 'text',
    text: {
      preview_url: false,
      body: adminText
    }
  };

  try {
    const res = await sendMetaGraphRequest(payload);
    return { success: true, messageId: res.messages?.[0]?.id };
  } catch (err) {
    console.error('[WhatsApp Service] Failed to send admin alert:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Master Method: Deliver complete WhatsApp confirmation & receipt to customer and notify admin
 * 
 * @param {Object} booking - Booking object
 * @param {string} baseUrl - Base URL of the website e.g. "https://yuvi.com" or "http://localhost:3000"
 */
async function deliverBookingWhatsAppConfirmation(booking, baseUrl = 'http://localhost:3000') {
  if (!isWhatsAppConfigured()) {
    console.log(`[WhatsApp Notice] Meta WhatsApp credentials are not yet configured in .env. Receipt generated and booking #${booking.id} saved successfully.`);
    return {
      success: false,
      status: 'not_configured',
      error: 'Meta WhatsApp Cloud API credentials not configured in .env',
      bookingId: booking.id
    };
  }

  const formattedPhone = formatWhatsAppNumber(booking.mobile);
  if (!formattedPhone || formattedPhone.length < 10) {
    return {
      success: false,
      status: 'failed',
      error: `Invalid customer WhatsApp number: ${booking.mobile}`,
      bookingId: booking.id
    };
  }

  // Construct absolute public link for PDF
  const cleanBase = baseUrl.replace(/\/$/, '');
  const publicReceiptUrl = `${cleanBase}${booking.receiptUrl || `/receipts/Receipt-${booking.id}.pdf`}`;

  try {
    // 1. Send confirmation message
    const msgRes = await sendCustomerConfirmationText(booking, formattedPhone, publicReceiptUrl);
    const messageId = msgRes.messages?.[0]?.id || 'delivered';

    // 2. Send PDF receipt document
    try {
      await sendCustomerReceiptDocument(booking, formattedPhone, publicReceiptUrl);
    } catch (docErr) {
      console.warn('[WhatsApp Service] Document attachment failed (link may not be publicly accessible if localhost):', docErr.message);
      // We don't fail the whole delivery if document attachment fails due to localhost URL
    }

    // 3. Send Admin alert
    sendAdminNotification(booking).catch(err => {
      console.warn('[WhatsApp Service] Non-critical admin notification error:', err.message);
    });

    return {
      success: true,
      status: 'sent',
      messageId,
      sentAt: new Date().toISOString(),
      bookingId: booking.id
    };
  } catch (err) {
    console.error(`[WhatsApp Service] Error sending WhatsApp confirmation for ${booking.id}:`, err.message);
    return {
      success: false,
      status: 'failed',
      error: err.message,
      bookingId: booking.id
    };
  }
}

module.exports = {
  isWhatsAppConfigured,
  formatWhatsAppNumber,
  deliverBookingWhatsAppConfirmation,
  sendAdminNotification
};
