import React, { useState, useEffect } from 'react';
import { Package, Truck, Calendar, DollarSign, Upload, CheckCircle, Info, Shield, MapPin, Sparkles, Loader2, Printer } from 'lucide-react';
import { Settings } from '../types.js';

interface AdminCreateShipmentViewProps {
  token: string;
  settings: Settings;
  onSuccess: () => void;
  onBackToLogs: () => void;
}

export default function AdminCreateShipmentView({
  token,
  settings,
  onSuccess,
  onBackToLogs,
}: AdminCreateShipmentViewProps) {
  // Form values
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const [weight, setWeight] = useState<number>(1);
  const [type, setType] = useState<'Freight' | 'Express' | 'Standard' | 'Document' | 'Fragile'>('Standard');
  const [packageValue, setPackageValue] = useState<string>('150');
  const [length, setLength] = useState<string>('30');
  const [width, setWidth] = useState<string>('20');
  const [height, setHeight] = useState<string>('15');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'Standard' | 'Express'>('Standard');

  // Documents
  const [invoiceDocName, setInvoiceDocName] = useState('');
  const [invoiceDocData, setInvoiceDocData] = useState('');
  const [labelDocName, setLabelDocName] = useState('');
  const [labelDocData, setLabelDocData] = useState('');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [createdShipment, setCreatedShipment] = useState<any | null>(null);

  // Dynamic estimated price state
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);

  // Re-compute estimated pricing whenever factors change
  useEffect(() => {
    const base = settings.pricing.basePrice;
    const kgRate = settings.pricing.pricePerKg;
    const kmRate = settings.pricing.pricePerKm;
    
    // Simulate a random or deterministic distance based on lengths of addresses
    const simulatedDistKm = Math.max(
      15,
      (pickupAddress.length + deliveryAddress.length) * 4.5
    );

    let price = base + (weight * kgRate) + (simulatedDistKm * kmRate);
    if (deliveryType === 'Express') {
      price *= 1.5; // Express premium
    }
    if (type === 'Fragile') {
      price += 25.0; // special handling fee
    }

    setEstimatedPrice(Number(price.toFixed(2)));
  }, [weight, type, deliveryType, pickupAddress, deliveryAddress, settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: 'invoice' | 'label') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (docType === 'invoice') {
        setInvoiceDocName(file.name);
        setInvoiceDocData(reader.result as string);
      } else {
        setLabelDocName(file.name);
        setLabelDocData(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Shipping Waybill Receipt</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; }
        .receipt-container { border: 2px solid #e2e8f0; border-radius: 16px; padding: 30px; max-width: 650px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
        .logo-box { background-color: #2563eb; color: white; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; float: left; margin-right: 12px; }
        .brand-name { font-weight: 800; font-size: 18px; margin: 0; }
        .brand-sub { font-size: 10px; color: #64748b; font-family: monospace; letter-spacing: 1px; margin: 0; }
        .tracking-box { text-align: center; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; margin: 20px 0; }
        .tracking-id { font-size: 24px; font-weight: 900; letter-spacing: 1px; font-family: monospace; color: #1e3a8a; margin: 5px 0; }
        .barcode { height: 40px; display: flex; justify-content: center; align-items: flex-end; gap: 2px; margin-top: 10px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .details-section { border: 1px solid #f1f5f9; border-radius: 12px; padding: 15px; background-color: #fafafa; }
        .section-title { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .detail-item { font-size: 12px; margin-bottom: 6px; }
        .detail-label { color: #64748b; font-weight: 600; }
        .detail-value { font-weight: 500; }
        .price-breakdown { font-family: monospace; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .price-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .price-total { font-weight: bold; font-size: 14px; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 6px; color: #1e3a8a; }
        .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px; line-height: 1.4; }
      `);
      printWindow.document.write('</style></head><body>');
      
      const sDate = createdShipment?.createdAt ? new Date(createdShipment.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
      const sEstDelivery = createdShipment?.estimatedDelivery ? new Date(createdShipment.estimatedDelivery).toLocaleDateString() : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString();
      
      let barcodeHTML = '';
      for (let i = 0; i < 35; i++) {
        const h = 32 + Math.random() * 15;
        const w = (i % 3 === 0) ? 3 : (i % 2 === 0) ? 1 : 2;
        barcodeHTML += `<div style="background-color: #0f172a; width: ${w}px; height: ${h}px; display: inline-block; margin-right: 2px;"></div>`;
      }

      printWindow.document.write(`
        <div class="receipt-container">
          <div class="header">
            <div style="overflow: hidden;">
              <div class="logo-box">L</div>
              <div style="float: left;">
                <h1 class="brand-name">Logify Logistics</h1>
                <p class="brand-sub">OFFICIAL DISPATCH WAYBILL</p>
              </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <strong>Date:</strong> ${sDate}<br/>
              <strong>Status:</strong> Pending Dispatch
            </div>
          </div>

          <div class="tracking-box">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Shipment Tracking ID</div>
            <div class="tracking-id">${createdShipment?.id || 'LOG-GENERATING-US'}</div>
            <div style="margin-top: 10px; height: 50px;">
              ${barcodeHTML}
            </div>
          </div>

          <div class="grid-2">
            <div class="details-section">
              <h4 class="section-title">Consignor (Sender)</h4>
              <div class="detail-item"><span class="detail-label">Name:</span> <span class="detail-value">${createdShipment?.senderName || senderName}</span></div>
              <div class="detail-item"><span class="detail-label">Email:</span> <span class="detail-value">${createdShipment?.senderEmail || senderEmail}</span></div>
              <div class="detail-item"><span class="detail-label">Phone:</span> <span class="detail-value">${createdShipment?.senderPhone || senderPhone}</span></div>
              <div class="detail-item" style="margin-top: 8px;"><span class="detail-label">Origin Address:</span><br/><span class="detail-value" style="font-size: 11px;">${createdShipment?.pickupAddress || pickupAddress}</span></div>
            </div>

            <div class="details-section">
              <h4 class="section-title">Consignee (Receiver)</h4>
              <div class="detail-item"><span class="detail-label">Name:</span> <span class="detail-value">${createdShipment?.receiverName || receiverName}</span></div>
              <div class="detail-item"><span class="detail-label">Email:</span> <span class="detail-value">${createdShipment?.receiverEmail || receiverEmail || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Phone:</span> <span class="detail-value">${createdShipment?.receiverPhone || receiverPhone || 'N/A'}</span></div>
              <div class="detail-item" style="margin-top: 8px;"><span class="detail-label">Destination Address:</span><br/><span class="detail-value" style="font-size: 11px;">${createdShipment?.deliveryAddress || deliveryAddress}</span></div>
            </div>
          </div>

          <div class="details-section" style="margin-bottom: 20px;">
            <h4 class="section-title">Package & Carriage Details</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
              <div class="detail-item"><span class="detail-label">Service Type:</span><br/><span class="detail-value">${createdShipment?.deliveryType || deliveryType} Delivery</span></div>
              <div class="detail-item"><span class="detail-label">Category:</span><br/><span class="detail-value">${createdShipment?.type || type}</span></div>
              <div class="detail-item"><span class="detail-label">Weight:</span><br/><span class="detail-value">${createdShipment?.weight || weight} kg</span></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
              <div class="detail-item"><span class="detail-label">Est. Delivery:</span><br/><span class="detail-value">${sEstDelivery}</span></div>
              <div class="detail-item"><span class="detail-label">Security Shield:</span><br/><span class="detail-value">Liability Coverage Active</span></div>
            </div>
          </div>

          <div class="details-section">
            <h4 class="section-title">Billing & Charges Statement</h4>
            <div class="price-breakdown">
              <div class="price-row">
                <span>Freight Base Carriage Rate:</span>
                <span>$${settings.pricing.basePrice.toFixed(2)}</span>
              </div>
              <div class="price-row">
                <span>Weight Surcharge:</span>
                <span>$${((createdShipment?.weight || weight) * settings.pricing.pricePerKg).toFixed(2)}</span>
              </div>
              <div class="price-row">
                <span>Priority Service Multiplier:</span>
                <span>${(createdShipment?.deliveryType || deliveryType) === 'Express' ? '1.50x' : '1.00x'}</span>
              </div>
              ${(createdShipment?.type || type) === 'Fragile' ? `
              <div class="price-row" style="color: #dc2626;">
                <span>Specialized Fragile Surcharge:</span>
                <span>+$25.00</span>
              </div>` : ''}
              <div class="price-row price-total">
                <span>Carriage Fees Total:</span>
                <span>$${(createdShipment?.price || estimatedPrice).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            Thank you for shipping with Logify Logistics.<br/>
            All transportation is subject to Logify's carriage terms and security rules.<br/>
            <strong>Logify Dispatch Hub Node - Authorized Signature Seal Active</strong>
          </div>
        </div>
      `);

      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setBookingSuccess(null);

    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderName,
          senderEmail,
          senderPhone,
          receiverName,
          receiverEmail,
          receiverPhone,
          pickupAddress,
          deliveryAddress,
          weight,
          type,
          packageValue: Number(packageValue),
          packageDimensions: {
            length: Number(length),
            width: Number(width),
            height: Number(height),
          },
          pickupDate: pickupDate || new Date().toISOString().substring(0, 10),
          deliveryType,
          invoiceDocName: invoiceDocName || undefined,
          invoiceDocData: invoiceDocData || undefined,
          labelDocName: labelDocName || undefined,
          labelDocData: labelDocData || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to dispatch waybill booking request.');
      }

      const freshShipment = await response.json();
      setBookingSuccess(`Waybill successfully created and scheduled! Assigned Tracking ID: ${freshShipment.id}`);
      setCreatedShipment(freshShipment);
      
      // Clear form
      setSenderName('');
      setSenderEmail('');
      setSenderPhone('');
      setReceiverName('');
      setReceiverEmail('');
      setReceiverPhone('');
      setPickupAddress('');
      setDeliveryAddress('');
      setInvoiceDocName('');
      setInvoiceDocData('');
      setLabelDocName('');
      setLabelDocData('');

    } catch (err: any) {
      setFormError(err.message || 'Server connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdShipment) {
    return (
      <div className="space-y-6">
        {/* Header bar with Print & Finish actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm gap-3 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-1.5">
              <CheckCircle size={16} className="text-emerald-500" />
              Waybill Receipt Successfully Generated
            </h2>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tracking ID: {createdShipment.id}</p>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
            >
              <Printer size={13} />
              Print / Save Receipt
            </button>
            <button
              type="button"
              onClick={onSuccess}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all"
            >
              Done & Return to Logs
            </button>
          </div>
        </div>

        {/* Outer Receipt container */}
        <div id="printable-receipt" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 text-xs text-slate-700 dark:text-slate-300 animate-fade-in">
          
          {/* Top Logo & Branding info */}
          <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg">
                L
              </div>
              <div>
                <h3 className="font-sans font-black text-sm tracking-tight text-slate-900 dark:text-white leading-tight">Logify Logistics</h3>
                <p className="text-[9px] font-bold font-mono tracking-wider text-slate-400 uppercase">Official Dispatch Waybill</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="font-mono text-[8px] font-bold uppercase text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                Pending Dispatch
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-1">Booked: {new Date(createdShipment.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Barcode & Large tracking display */}
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 text-center space-y-3">
            <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Waybill barcode & Tracking ID</p>
            <h2 className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 tracking-wider">
              {createdShipment.id}
            </h2>
            
            {/* Visual simulation of a logistic barcode */}
            <div className="flex justify-center items-end gap-0.5 h-10 opacity-80 pt-1">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900 dark:bg-slate-200"
                  style={{
                    width: `${(i % 3 === 0) ? '3px' : (i % 2 === 0) ? '1px' : '2px'}`,
                    height: `${28 + (Math.sin(i) * 8)}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sender & Receiver Address grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Consignor (Sender) info card */}
            <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-2.5 bg-slate-50/50 dark:bg-slate-800/10">
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400">Consignor (Sender)</span>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{createdShipment.senderName}</p>
                <p className="text-slate-500">{createdShipment.senderEmail}</p>
                <p className="text-slate-500">{createdShipment.senderPhone}</p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                <p className="text-[9px] font-bold font-mono text-slate-400 uppercase">Pickup Location</p>
                <p className="text-[11px] leading-snug font-medium text-slate-700 dark:text-slate-300 mt-0.5">{createdShipment.pickupAddress}</p>
              </div>
            </div>

            {/* Consignee (Receiver) info card */}
            <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-2.5 bg-slate-50/50 dark:bg-slate-800/10">
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400">Consignee (Receiver)</span>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{createdShipment.receiverName}</p>
                <p className="text-slate-500">{createdShipment.receiverEmail || 'No Email Provided'}</p>
                <p className="text-slate-500">{createdShipment.receiverPhone || 'No Phone Provided'}</p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                <p className="text-[9px] font-bold font-mono text-slate-400 uppercase">Destination Location</p>
                <p className="text-[11px] leading-snug font-medium text-slate-700 dark:text-slate-300 mt-0.5">{createdShipment.deliveryAddress}</p>
              </div>
            </div>

          </div>

          {/* Freight metrics details panel */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-800/10">
            <h4 className="text-[9px] font-bold font-mono text-slate-400 uppercase mb-3 border-b border-slate-100 dark:border-slate-800 pb-1.5">Carriage Specs & Timeline Nodes</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-400 text-[10px]">Service Mode</span>
                <p className="font-bold text-slate-800 dark:text-white">{createdShipment.deliveryType} Speed</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Cargo Classification</span>
                <p className="font-bold text-slate-800 dark:text-white">{createdShipment.type}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Carriage Weight</span>
                <p className="font-bold font-mono text-slate-800 dark:text-white">{createdShipment.weight} kg</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Est. Delivery Corridor</span>
                <p className="font-bold text-blue-600 dark:text-blue-400">{new Date(createdShipment.estimatedDelivery).toLocaleDateString()}</p>
              </div>
            </div>

            {createdShipment.packageDimensions && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 flex flex-wrap gap-x-8 gap-y-1.5 text-[11px]">
                <div>
                  <span className="text-slate-400">Dimensions:</span>{' '}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {createdShipment.packageDimensions.length}L × {createdShipment.packageDimensions.width}W × {createdShipment.packageDimensions.height}H cm
                  </span>
                </div>
                {createdShipment.packageValue && (
                  <div>
                    <span className="text-slate-400">Cargo Declared Value:</span>{' '}
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${createdShipment.packageValue} USD</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing statement breakdown */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/10">
            <h4 className="text-[9px] font-bold font-mono text-slate-400 uppercase mb-3">Billing Settle Statement</h4>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Base Line Carriage Rate:</span>
                <span>${settings.pricing.basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Weight-Based Surcharge ({createdShipment.weight} kg):</span>
                <span>${(createdShipment.weight * settings.pricing.pricePerKg).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Priority Multiplier Adjustment:</span>
                <span>{createdShipment.deliveryType === 'Express' ? '1.50x speed surcharge' : '1.00x standard rate'}</span>
              </div>
              {createdShipment.type === 'Fragile' && (
                <div className="flex justify-between text-rose-500 font-bold">
                  <span>Specialized Fragile Surcharge:</span>
                  <span>+$25.00</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 dark:text-white font-bold text-sm pt-2.5 border-t border-slate-200/60 dark:border-slate-800 border-dashed">
                <span>Settle Paid Total:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">${createdShipment.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Legal/Official Carriage note */}
          <p className="text-[10px] text-slate-400 text-center leading-relaxed font-sans pt-2 border-t border-slate-100 dark:border-slate-800">
            This receipt serves as proof of commercial booking under Logify Security terms. Dispatch waybill must be physically attached or digitally coupled to cargo prior to final hub dispatch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Book Dispatch Waybill</h2>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Schedule commercial freight segment routing runs</p>
        </div>
        <button
          onClick={onBackToLogs}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all"
        >
          Back to Shipment Logs
        </button>
      </div>

      {bookingSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs rounded-2xl font-bold flex items-center gap-2.5 animate-pulse">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          {bookingSuccess}
        </div>
      )}

      {formError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-800 dark:text-rose-400 text-xs rounded-2xl font-semibold">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-700 dark:text-slate-300">
        
        {/* Input Details: Sections 1, 2, 3 (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Sender Consignor Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">1</span>
              Sender Consignor Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Consignor Name *</label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Acme Industrial Supply"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Consignor Email *</label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. logistics@acme.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Consignor Phone *</label>
                <input
                  type="text"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="e.g. +1 555-0105"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Pickup Address *</label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. 120 Commerce Way, Newark, NJ"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Receiver Consignee Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">2</span>
              Receiver Consignee Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Consignee Name *</label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Global Tech Warehousing"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Consignee Email *</label>
                <input
                  type="email"
                  required
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  placeholder="e.g. support@globaltech.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Consignee Phone *</label>
                <input
                  type="text"
                  required
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="e.g. +1 555-0108"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. 800 Ocean Terminal Blvd, Boston, MA"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Package Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">3</span>
              Package Details & Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Weight (kg) *</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(Math.max(0.1, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-950 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Type Category</label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white font-medium"
                >
                  <option value="Standard">Standard Cargo</option>
                  <option value="Express">Express Parcel</option>
                  <option value="Freight">Heavy Freight</option>
                  <option value="Document">Secure Documents</option>
                  <option value="Fragile">Fragile Elements</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Cargo Value ($)</label>
                <input
                  type="number"
                  value={packageValue}
                  onChange={(e) => setPackageValue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-950 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-no-repeat font-mono outline-none text-[11px] text-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Length (cm)</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Width (cm)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Estimations Sidebar: Section 4 (1/3 width) */}
        <div className="space-y-6">
          
          {/* Section 4: Delivery Speeds & Pricing */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">4</span>
              Transit Options
            </h4>

            {/* Delivery type buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('Standard')}
                className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                  deliveryType === 'Standard'
                    ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-500/5'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10'
                }`}
              >
                <h5 className="font-bold text-slate-900 dark:text-white">Standard</h5>
                <p className="text-[9px] text-slate-400 leading-tight">3-5 Business days road shipping depot corridors.</p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('Express')}
                className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                  deliveryType === 'Express'
                    ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-500/5 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10'
                }`}
              >
                <h5 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  Express <Sparkles size={11} className="animate-pulse" />
                </h5>
                <p className="text-[9px] text-slate-400 leading-tight">Overnight / Next-Day expedited priority handling.</p>
              </button>
            </div>

            {/* Price breakdown panel */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 rounded-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-mono text-slate-400 uppercase text-[9px] font-bold">Estimated Cost Breakdown</span>
                <span className="text-[9px] text-slate-400 font-bold bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">USD</span>
              </div>
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between text-slate-500">
                  <span>Base Booking Rate:</span>
                  <span>${settings.pricing.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Weight Surcharge ({weight}kg):</span>
                  <span>${(weight * settings.pricing.pricePerKg).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Speed multiplier:</span>
                  <span>{deliveryType === 'Express' ? '1.50x' : '1.00x'}</span>
                </div>
                {type === 'Fragile' && (
                  <div className="flex justify-between text-rose-500 font-semibold">
                    <span>Fragile handling fee:</span>
                    <span>+$25.00</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 dark:text-white font-bold text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Estimated total:</span>
                  <span className="text-blue-600 dark:text-blue-400">${estimatedPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Uploads section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Attachment Options</h4>
            
            {/* Invoice File */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Cargo Invoice File</label>
              <div className="border border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-3.5 text-center cursor-pointer transition-all relative">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileChange(e, 'invoice')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <Upload className="mx-auto text-slate-400" size={16} />
                  <p className="text-[10px] font-medium text-slate-500">
                    {invoiceDocName ? (
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{invoiceDocName}</span>
                    ) : (
                      'Upload Invoice receipt document'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Label File */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase font-mono">Digital Shipping Label</label>
              <div className="border border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-3.5 text-center cursor-pointer transition-all relative">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileChange(e, 'label')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <Upload className="mx-auto text-slate-400" size={16} />
                  <p className="text-[10px] font-medium text-slate-500">
                    {labelDocName ? (
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{labelDocName}</span>
                    ) : (
                      'Upload PDF barcode / shipping label'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-[10px] text-slate-400 font-mono leading-relaxed space-y-1">
              <span className="font-bold text-slate-500 uppercase flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500 font-bold" /> System Automation
              </span>
              <span>Unique Waybill Tracking ID (LOG-XXXXXX-US) & official printable receipt will be auto-generated instantly on submission.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl mt-1 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/15"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
              Generate Waybill & Dispatch Run
            </button>
          </div>
          
        </div>

      </form>
    </div>
  );
}
