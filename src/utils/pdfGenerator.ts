import { jsPDF } from 'jspdf';
import { Shipment, Settings } from '../types.js';

export function generateInvoicePDF(shipment: Shipment, settings: Settings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // Slate-900: #0f172a
  const accentColor = [245, 158, 11]; // Amber-500: #f59e0b
  const lightGray = [248, 250, 252]; // Slate-50
  const borderGray = [226, 232, 240]; // Slate-200
  const textDark = [51, 65, 85]; // Slate-700
  const textMuted = [148, 163, 184]; // Slate-400

  // Margins & Dimensions
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  // Helper function to draw horizontal lines
  const drawLine = (y: number, color = borderGray, thickness = 0.2) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(thickness);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // 1. Header Section
  // App/Company Logo
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(margin, 20, 10, 10, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('L', margin + 4, 27);

  // Company Name
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGIFY', margin + 13, 27);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGISTICS', margin + 32, 27);

  // Invoice Title Right Aligned
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE & WAYBILL', pageWidth - margin, 27, { align: 'right' });

  // Company Address/Contact Info
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const companyPhone = settings?.contactPhone || '1-800-555-0199';
  const companyEmail = settings?.contactEmail || 'billing@logify.com';
  const companyAddress = settings?.companyName || 'Logify Logistics Inc.';
  doc.text(`${companyAddress}\nPhone: ${companyPhone}\nEmail: ${companyEmail}`, margin, 38);

  // Waybill metadata Right Aligned
  const dateStr = new Date(shipment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Waybill ID: ${shipment.id}`, pageWidth - margin, 38, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Issued: ${dateStr}`, pageWidth - margin, 43, { align: 'right' });
  
  // Payment cleared badge
  doc.setFillColor(240, 253, 244); // bg-emerald-50
  doc.setDrawColor(220, 252, 231); // border-emerald-100
  doc.roundedRect(pageWidth - margin - 35, 47, 35, 6, 1, 1, 'FD');
  doc.setTextColor(21, 128, 61); // text-emerald-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('PAYMENT CLEARED', pageWidth - margin - 17.5, 51.2, { align: 'center' });

  drawLine(58);

  // 2. Sender vs. Recipient Section
  const colWidth = contentWidth / 2;
  const startY = 66;

  // Sender (Origin)
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SENDER (ORIGIN)', margin, startY);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(shipment.senderName || 'N/A', margin, startY + 5);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Phone: ${shipment.senderPhone || 'N/A'}\nEmail: ${shipment.senderEmail || 'N/A'}`, margin, startY + 10);
  
  // Wrap and draw pickup address
  const senderAddrText = doc.splitTextToSize(shipment.pickupAddress || 'N/A', colWidth - 10);
  doc.setTextColor(100, 116, 139); // Gray 500
  doc.setFont('helvetica', 'italic');
  doc.text(senderAddrText, margin, startY + 19);

  // Recipient (Destination)
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RECIPIENT (DESTINATION)', margin + colWidth, startY);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(shipment.receiverName || 'N/A', margin + colWidth, startY + 5);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Phone: ${shipment.receiverPhone || 'N/A'}\nEmail: ${shipment.receiverEmail || 'N/A'}`, margin + colWidth, startY + 10);

  // Wrap and draw delivery address
  const receiverAddrText = doc.splitTextToSize(shipment.deliveryAddress || 'N/A', colWidth - 10);
  doc.setTextColor(100, 116, 139); // Gray 500
  doc.setFont('helvetica', 'italic');
  doc.text(receiverAddrText, margin + colWidth, startY + 19);

  drawLine(105);

  // 3. Itemized Details Section
  const tableY = 115;
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ITEMIZED DETAILS', margin, tableY);

  // Table Headers Background
  const thY = tableY + 4;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(margin, thY, contentWidth, 8, 'F');
  drawLine(thY);
  drawLine(thY + 8);

  // Table Headers Text
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Service Description', margin + 3, thY + 5.5);
  doc.text('Weight', margin + 65, thY + 5.5);
  doc.text('Cargo Type', margin + 100, thY + 5.5);
  doc.text('Price (USD)', pageWidth - margin - 3, thY + 5.5, { align: 'right' });

  // Rows Data
  const rowHeight = 8;
  const r1Y = thY + 8;
  
  // Row 1: Delivery Fee
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`${shipment.type || 'Standard'} Delivery Service`, margin + 3, r1Y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${shipment.weight || 0} kg`, margin + 65, r1Y + 5.5);
  doc.text('Standard Insured', margin + 100, r1Y + 5.5);
  doc.setFont('courier', 'normal');
  doc.text(`$${(shipment.price * 0.85).toFixed(2)}`, pageWidth - margin - 3, r1Y + 5.5, { align: 'right' });
  drawLine(r1Y + rowHeight);

  // Row 2: Fuel & Logistics Surcharge
  const r2Y = r1Y + rowHeight;
  doc.setFont('helvetica', 'normal');
  doc.text('Fuel & Logistics Surcharge', margin + 3, r2Y + 5.5);
  doc.text('-', margin + 65, r2Y + 5.5);
  doc.text('Variable', margin + 100, r2Y + 5.5);
  doc.setFont('courier', 'normal');
  doc.text(`$${(shipment.price * 0.10).toFixed(2)}`, pageWidth - margin - 3, r2Y + 5.5, { align: 'right' });
  drawLine(r2Y + rowHeight);

  // Row 3: Processing & GST
  const r3Y = r2Y + rowHeight;
  doc.setFont('helvetica', 'normal');
  doc.text('Processing, Sorting & handling fee', margin + 3, r3Y + 5.5);
  doc.text('-', margin + 65, r3Y + 5.5);
  doc.text('Local Tax (5%)', margin + 100, r3Y + 5.5);
  doc.setFont('courier', 'normal');
  doc.text(`$${(shipment.price * 0.05).toFixed(2)}`, pageWidth - margin - 3, r3Y + 5.5, { align: 'right' });
  drawLine(r3Y + rowHeight);

  // 4. Summary / Totals
  const summaryY = r3Y + rowHeight + 8;
  const summaryLabelX = pageWidth - margin - 50;
  const summaryValueX = pageWidth - margin;

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Subtotal:', summaryLabelX, summaryY);
  doc.setFont('courier', 'normal');
  doc.text(`$${(shipment.price * 0.95).toFixed(2)}`, summaryValueX, summaryY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('GST / Taxes (5%):', summaryLabelX, summaryY + 5);
  doc.setFont('courier', 'normal');
  doc.text(`$${(shipment.price * 0.05).toFixed(2)}`, summaryValueX, summaryY + 5, { align: 'right' });

  // Divider
  drawLine(summaryY + 8, borderGray, 0.4);

  // Grand Total
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Grand Total Paid:', summaryLabelX, summaryY + 13);
  doc.setFont('courier', 'bold');
  doc.text(`$${shipment.price.toFixed(2)} USD`, summaryValueX, summaryY + 13, { align: 'right' });

  // 5. Fine Print / Footer
  const footerY = pageHeight - 30;
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Thank you for shipping with Logify Logistics.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Subject to Terms and Conditions of Carriage. Registered under digital waybill transit reference code.', pageWidth / 2, footerY + 4.5, { align: 'center' });

  // Download trigger
  doc.save(`invoice-${shipment.id}.pdf`);
}
