const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Generate a professional, luxury PDF receipt for YUVI DECORATION
 * Using Cream, Pastel Pink, and Champagne Gold styling.
 * 
 * @param {Object} booking 
 * @returns {Promise<{ filePath: string, relativeUrl: string, fileName: string }>}
 */
function generateBookingReceipt(booking) {
  return new Promise((resolve, reject) => {
    try {
      const receiptsDir = path.join(__dirname, '..', 'public', 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const fileName = `Receipt-${booking.id}.pdf`;
      const filePath = path.join(receiptsDir, fileName);
      const relativeUrl = `/receipts/${fileName}`;

      // Create PDF Document (A4 size with 36pt margins)
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `YUVI DECORATION Receipt - ${booking.id}`,
          Author: 'YUVI DECORATION Patna',
          Subject: 'Official Event Decoration Booking Confirmation & Receipt',
          Keywords: 'balloon decoration, booking receipt, yuvi decoration'
        }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- Color Palette ---
      const COLOR_CREAM = '#FDFBF7';
      const COLOR_PINK = '#E85072';
      const COLOR_PINK_SOFT = '#FDE8EE';
      const COLOR_GOLD = '#C5A059';
      const COLOR_GOLD_LIGHT = '#FDF8EF';
      const COLOR_DARK = '#232333';
      const COLOR_MUTED = '#6B7280';
      const COLOR_BORDER = '#E5E7EB';
      const COLOR_SUCCESS = '#059669';

      // 1. Draw Page Cream Background & Decorative Luxury Border
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_CREAM);

      // Gold Outer Frame
      doc.rect(18, 18, doc.page.width - 36, doc.page.height - 36)
         .lineWidth(1.5)
         .stroke(COLOR_GOLD);

      // Inner Soft Pink Border
      doc.rect(22, 22, doc.page.width - 44, doc.page.height - 44)
         .lineWidth(0.5)
         .stroke('#F3D9E2');

      // 2. Header Banner
      doc.rect(23, 23, doc.page.width - 46, 85)
         .fill('#FFF5F7');

      // Brand Logo & Title
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor(COLOR_PINK)
         .text('YUVI DECORATION', 42, 38);

      doc.fontSize(8.5)
         .font('Helvetica-Bold')
         .fillColor(COLOR_GOLD)
         .text('DECORATE YOUR HAPPINESS  •  PREMIUM EVENT STYLING', 42, 64, { characterSpacing: 1 });

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(COLOR_MUTED)
         .text('Boring Road, Patna, Bihar  |  WhatsApp: +91 9263667669  |  partyhard2707@gmail.com', 42, 78);

      // Right-aligned Badge: Booking ID & Date
      doc.rect(doc.page.width - 195, 34, 155, 60)
         .fillAndStroke('#FFFFFF', COLOR_GOLD);

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(COLOR_MUTED)
         .text('BOOKING CONFIRMATION', doc.page.width - 190, 42, { width: 145, align: 'center' });

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(COLOR_PINK)
         .text(booking.id, doc.page.width - 190, 56, { width: 145, align: 'center' });

      const bookingDateStr = booking.createdAt 
        ? new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      doc.fontSize(7.5)
         .font('Helvetica')
         .fillColor(COLOR_MUTED)
         .text(`Issued: ${bookingDateStr}`, doc.page.width - 190, 74, { width: 145, align: 'center' });

      // Divider Line
      let yPos = 122;

      // 3. Status Bar Banner
      doc.rect(36, yPos, doc.page.width - 72, 30)
         .fill(COLOR_GOLD_LIGHT);
      doc.rect(36, yPos, doc.page.width - 72, 30)
         .lineWidth(0.8)
         .stroke(COLOR_GOLD);

      const statusText = (booking.status || 'pending').toUpperCase();
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(COLOR_DARK)
         .text('STATUS: ', 48, yPos + 10, { continued: true })
         .fillColor(statusText === 'CONFIRMED' || statusText === 'COMPLETED' ? COLOR_SUCCESS : '#D97706')
         .text(statusText + '  |  ')
         .fillColor(COLOR_DARK)
         .text('PAYMENT: ', { continued: true })
         .fillColor(COLOR_PINK)
         .text((booking.paymentMethod || 'Cash on Setup').toUpperCase() + '  |  ')
         .fillColor(COLOR_DARK)
         .text('ON-TIME SETUP GUARANTEE: ', { continued: true })
         .fillColor(COLOR_SUCCESS)
         .text('ACTIVE');

      yPos += 42;

      // 4. Two Information Columns: Customer Info & Event Details
      const colWidth = (doc.page.width - 72 - 14) / 2;
      const leftColX = 36;
      const rightColX = leftColX + colWidth + 14;
      const cardHeight = 130;

      // Left Box: Customer Information
      doc.rect(leftColX, yPos, colWidth, cardHeight)
         .fillAndStroke('#FFFFFF', COLOR_BORDER);

      doc.rect(leftColX, yPos, colWidth, 24)
         .fill(COLOR_PINK_SOFT);

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(COLOR_PINK)
         .text('CUSTOMER INFORMATION', leftColX + 12, yPos + 7);

      let custY = yPos + 32;
      drawLabelValue(doc, 'Full Name:', booking.customerName || 'N/A', leftColX + 12, custY, colWidth - 24);
      custY += 18;
      drawLabelValue(doc, 'WhatsApp Mobile:', booking.mobile || 'N/A', leftColX + 12, custY, colWidth - 24);
      custY += 18;
      drawLabelValue(doc, 'Email:', booking.email || 'Not Provided', leftColX + 12, custY, colWidth - 24);
      custY += 18;
      drawLabelValue(doc, 'Setup Address:', booking.venueAddress || 'Patna City, Bihar', leftColX + 12, custY, colWidth - 24, true);

      // Right Box: Event & Setup Details
      doc.rect(rightColX, yPos, colWidth, cardHeight)
         .fillAndStroke('#FFFFFF', COLOR_BORDER);

      doc.rect(rightColX, yPos, colWidth, 24)
         .fill(COLOR_GOLD_LIGHT);

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(COLOR_GOLD)
         .text('EVENT & SETUP DETAILS', rightColX + 12, yPos + 7);

      let evntY = yPos + 32;
      drawLabelValue(doc, 'Occasion / Event:', booking.eventType || 'Celebration', rightColX + 12, evntY, colWidth - 24);
      evntY += 18;
      drawLabelValue(doc, 'Event Date:', booking.eventDate || 'To be scheduled', rightColX + 12, evntY, colWidth - 24);
      evntY += 18;
      drawLabelValue(doc, 'Setup Time Slot:', booking.eventTime || 'Flexible Timing', rightColX + 12, evntY, colWidth - 24);
      evntY += 18;
      drawLabelValue(doc, 'Theme / Colors:', booking.colorTheme || 'Pastel & Gold Theme', rightColX + 12, evntY, colWidth - 24);

      yPos += cardHeight + 16;

      // 5. Booking Order Item Breakdown Table
      doc.rect(36, yPos, doc.page.width - 72, 24)
         .fill(COLOR_PINK);

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text('ITEM / DECORATION PACKAGE', 48, yPos + 7)
         .text('CATEGORY', 330, yPos + 7)
         .text('AMOUNT (INR)', doc.page.width - 130, yPos + 7, { width: 85, align: 'right' });

      yPos += 24;

      const totalAmount = Number(booking.estimatedAmount) || 2499;
      const advanceAmount = Number(booking.advanceAmount) || 0;
      const remainingBalance = Math.max(0, totalAmount - advanceAmount);

      // Table Row
      doc.rect(36, yPos, doc.page.width - 72, 44)
         .fillAndStroke('#FFFFFF', COLOR_BORDER);

      doc.fontSize(9.5)
         .font('Helvetica-Bold')
         .fillColor(COLOR_DARK)
         .text(booking.packageName || 'Luxury Balloon Decoration Setup', 48, yPos + 10, { width: 270 });

      const notesText = booking.notes 
        ? `Notes: ${booking.notes.substring(0, 75)}`
        : 'Includes complete on-site balloon styling, stands, spotlights, and setup.';
      
      doc.fontSize(7.5)
         .font('Helvetica')
         .fillColor(COLOR_MUTED)
         .text(notesText, 48, yPos + 25, { width: 270 });

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(COLOR_DARK)
         .text(booking.eventType || 'Event Decor', 330, yPos + 16);

      doc.fontSize(10.5)
         .font('Helvetica-Bold')
         .fillColor(COLOR_PINK)
         .text(`Rs. ${totalAmount.toLocaleString('en-IN')}`, doc.page.width - 130, yPos + 16, { width: 85, align: 'right' });

      yPos += 54;

      // 6. Financial Summary Box (Right Aligned)
      const summaryWidth = 230;
      const summaryX = doc.page.width - 36 - summaryWidth;

      doc.rect(summaryX, yPos, summaryWidth, 90)
         .fillAndStroke('#FFFFFF', COLOR_BORDER);

      let sumY = yPos + 10;
      drawSummaryRow(doc, 'Subtotal / Package Rate:', `Rs. ${totalAmount.toLocaleString('en-IN')}`, summaryX + 12, sumY, summaryWidth - 24, false);
      sumY += 18;
      drawSummaryRow(doc, 'Advance Paid (Deposit):', `Rs. ${advanceAmount.toLocaleString('en-IN')}`, summaryX + 12, sumY, summaryWidth - 24, false);
      sumY += 18;
      
      // Divider in summary
      doc.moveTo(summaryX + 12, sumY)
         .lineTo(summaryX + summaryWidth - 12, sumY)
         .stroke(COLOR_BORDER);
      sumY += 8;

      drawSummaryRow(doc, 'Balance Due upon Setup:', `Rs. ${remainingBalance.toLocaleString('en-IN')}`, summaryX + 12, sumY, summaryWidth - 24, true);

      // Left of summary: Important Instructions & Terms
      const termsWidth = summaryX - 36 - 16;
      doc.rect(36, yPos, termsWidth, 90)
         .fillAndStroke(COLOR_GOLD_LIGHT, COLOR_GOLD);

      doc.fontSize(8.5)
         .font('Helvetica-Bold')
         .fillColor(COLOR_GOLD)
         .text('CUSTOMER PEACE-OF-MIND TERMS', 48, yPos + 10);

      doc.fontSize(7.5)
         .font('Helvetica')
         .fillColor(COLOR_DARK)
         .text('• Zero Advance Pressure: Pay balance only after setup inspection.', 48, yPos + 26)
         .text('• Decorator Arrival: Our team reaches the venue 2 hours prior to event time.', 48, yPos + 38)
         .text('• Custom Signs: Ensure celebrant name and age spelling is confirmed.', 48, yPos + 50)
         .text('• Rescheduling: Free date rescheduling up to 24 hours prior to event.', 48, yPos + 62)
         .text('• Support: Call / WhatsApp +91 9263667669 for immediate assistance.', 48, yPos + 74);

      yPos += 105;

      // 7. Security & Verification Watermark Box
      doc.rect(36, yPos, doc.page.width - 72, 42)
         .fillAndStroke('#FFFFFF', COLOR_BORDER);

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(COLOR_PINK)
         .text('VERIFIED BOOKING VOUCHER  •  OFFICIAL RECORD', 48, yPos + 8);

      doc.fontSize(7.5)
         .font('Helvetica')
         .fillColor(COLOR_MUTED)
         .text('This is an automatically generated booking voucher from YUVI DECORATION. Keep this receipt or your Booking ID handy for order tracking and on-site decorator verification.', 48, yPos + 20, { width: doc.page.width - 96 });

      // 8. Footer Luxury Note
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(COLOR_GOLD)
         .text('Thank You For Choosing YUVI DECORATION  •  We Make Every Moment More Special!', 36, doc.page.height - 42, {
           width: doc.page.width - 72,
           align: 'center'
         });

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          relativeUrl,
          fileName
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Helper: Draw label-value pair
function drawLabelValue(doc, label, value, x, y, width, isMultiline = false) {
  doc.fontSize(7.5)
     .font('Helvetica-Bold')
     .fillColor('#6B7280')
     .text(label, x, y);

  doc.fontSize(8.5)
     .font('Helvetica')
     .fillColor('#1F2937')
     .text(value, x + 85, y, {
       width: width - 85,
       height: isMultiline ? 28 : 14,
       ellipsis: true
     });
}

// Helper: Draw summary row
function drawSummaryRow(doc, label, value, x, y, width, isHighlight = false) {
  doc.fontSize(isHighlight ? 9 : 8)
     .font(isHighlight ? 'Helvetica-Bold' : 'Helvetica')
     .fillColor(isHighlight ? '#232333' : '#6B7280')
     .text(label, x, y);

  doc.fontSize(isHighlight ? 10.5 : 8.5)
     .font('Helvetica-Bold')
     .fillColor(isHighlight ? '#E85072' : '#232333')
     .text(value, x, y, { width, align: 'right' });
}

module.exports = {
  generateBookingReceipt
};
