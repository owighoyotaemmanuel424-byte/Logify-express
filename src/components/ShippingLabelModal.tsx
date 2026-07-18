import React from 'react';
import { X, Printer, Download, FileText, CheckCircle, ShieldAlert } from 'lucide-react';

interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: {
    id: string;
    pickup: string;
    delivery: string;
    weight: number;
    type: string;
    price: number;
    deliveryTime: string;
    createdAt: string;
  };
  aiPredictions?: {
    distanceKm: number;
    estimatedHours: number;
  } | null;
}

export default function ShippingLabelModal({ isOpen, onClose, quote, aiPredictions }: ShippingLabelModalProps) {
  if (!isOpen) return null;

  const createdDateStr = quote.createdAt ? new Date(quote.createdAt).toLocaleString() : new Date().toLocaleString();
  const trackingNumberStr = `LOG-${quote.id}-${quote.weight.toFixed(0)}-${quote.type.substring(0, 3).toUpperCase()}`;

  // Helper to generate self-contained HTML for PDF-ready Printing
  const generatePrintableHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Label & Manifest - ${quote.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 20px;
            }
            .label-container {
              max-width: 500px;
              margin: 0 auto;
              border: 3px solid #000;
              padding: 20px;
              box-sizing: border-box;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .logo-text {
              font-size: 20px;
              font-weight: 900;
              letter-spacing: -1px;
              text-transform: uppercase;
            }
            .service-badge {
              border: 2px solid #000;
              padding: 3px 8px;
              font-size: 11px;
              font-weight: 800;
              font-family: 'JetBrains Mono', monospace;
              text-transform: uppercase;
            }
            .address-section {
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .section-title {
              font-size: 9px;
              font-weight: 800;
              font-family: 'JetBrains Mono', monospace;
              text-transform: uppercase;
              color: #444;
              margin-bottom: 3px;
            }
            .address-text {
              font-size: 13px;
              font-weight: 600;
              line-height: 1.4;
            }
            .info-grid {
              display: grid;
              grid-cols: 2;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .info-block {
              border: 1px solid #000;
              padding: 8px;
            }
            .info-label {
              font-size: 8px;
              font-weight: 700;
              font-family: 'JetBrains Mono', monospace;
              text-transform: uppercase;
              color: #555;
            }
            .info-val {
              font-size: 12px;
              font-weight: 700;
            }
            .barcode-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 15px 0;
              text-align: center;
              border-bottom: 1px dashed #000;
              margin-bottom: 10px;
            }
            .barcode-svg {
              width: 100%;
              max-width: 360px;
              height: 70px;
            }
            .tracking-text {
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              font-weight: 700;
              margin-top: 6px;
              letter-spacing: 2px;
            }
            .legal-text {
              font-size: 7.5px;
              line-height: 1.3;
              color: #444;
              text-align: justify;
            }
            @media print {
              body {
                padding: 0;
              }
              .label-container {
                border: 3px solid #000;
                page-break-inside: avoid;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">
              <span class="logo-text">LOGIFY EXPRESS</span>
              <span class="service-badge">${quote.type} DISPATCH</span>
            </div>
            
            <div class="address-section">
              <div class="section-title">SHIP FROM (ORIGIN DEPOT)</div>
              <div class="address-text">${quote.pickup}</div>
            </div>
            
            <div class="address-section">
              <div class="section-title">SHIP TO (CONSIGNEE TARGET)</div>
              <div class="address-text" style="font-size: 14px; font-weight: 800;">${quote.delivery}</div>
            </div>
            
            <div class="info-grid">
              <div class="info-block">
                <div class="info-label">LOGISTICS DISPATCH ID</div>
                <div class="info-val" style="font-family: 'JetBrains Mono', monospace;">${quote.id}</div>
              </div>
              <div class="info-block">
                <div class="info-label">WEIGHT & TRANSPORT</div>
                <div class="info-val">${quote.weight} KG (${quote.type})</div>
              </div>
              <div class="info-block">
                <div class="info-label">DISPATCH WINDOW</div>
                <div class="info-val">${quote.deliveryTime}</div>
              </div>
              <div class="info-block">
                <div class="info-label">DATE SCANNED / SECURE</div>
                <div class="info-val" style="font-size: 10px;">${new Date(quote.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div class="barcode-container">
              <svg class="barcode-svg" viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
                <!-- Barcode rendering representing ${quote.id} -->
                <rect x="0" y="0" width="400" height="80" fill="#ffffff" />
                <g fill="#000000">
                  <rect x="20" y="10" width="4" height="60" />
                  <rect x="28" y="10" width="2" height="60" />
                  <rect x="34" y="10" width="6" height="60" />
                  <rect x="46" y="10" width="2" height="60" />
                  <rect x="52" y="10" width="8" height="60" />
                  <rect x="66" y="10" width="4" height="60" />
                  <rect x="74" y="10" width="2" height="60" />
                  <rect x="80" y="10" width="6" height="60" />
                  <rect x="92" y="10" width="10" height="60" />
                  <rect x="108" y="10" width="2" height="60" />
                  <rect x="114" y="10" width="4" height="60" />
                  <rect x="124" y="10" width="8" height="60" />
                  <rect x="136" y="10" width="2" height="60" />
                  <rect x="142" y="10" width="6" height="60" />
                  <rect x="154" y="10" width="4" height="60" />
                  <rect x="162" y="10" width="8" height="60" />
                  <rect x="174" y="10" width="2" height="60" />
                  <rect x="180" y="10" width="10" height="60" />
                  <rect x="196" y="10" width="4" height="60" />
                  <rect x="204" y="10" width="6" height="60" />
                  <rect x="214" y="10" width="2" height="60" />
                  <rect x="220" y="10" width="8" height="60" />
                  <rect x="232" y="10" width="4" height="60" />
                  <rect x="240" y="10" width="2" height="60" />
                  <rect x="246" y="10" width="6" height="60" />
                  <rect x="256" y="10" width="10" height="60" />
                  <rect x="272" y="10" width="4" height="60" />
                  <rect x="280" y="10" width="2" height="60" />
                  <rect x="286" y="10" width="8" height="60" />
                  <rect x="298" y="10" width="4" height="60" />
                  <rect x="306" y="10" width="6" height="60" />
                  <rect x="316" y="10" width="2" height="60" />
                  <rect x="322" y="10" width="10" height="60" />
                  <rect x="336" y="10" width="4" height="60" />
                  <rect x="344" y="10" width="2" height="60" />
                  <rect x="350" y="10" width="8" height="60" />
                  <rect x="362" y="10" width="4" height="60" />
                  <rect x="370" y="10" width="10" height="60" />
                </g>
              </svg>
              <div class="tracking-text">${trackingNumberStr}</div>
            </div>
            
            <div style="margin-top: 12px; display: flex; gap: 15px; align-items: flex-start;">
              <div style="flex-grow: 1;">
                <div class="section-title">TERMS & REGULATORY WAYBILL MANIFEST</div>
                <div class="legal-text">
                  This cargo container contains commercial contents. Carriers are requested to verify weight declarations and safe-handling guidelines. Hazardous chemical components must have active safety data sheets logged with logistics authorities. Re-delivery or delivery returns are subject to standard tariffs.
                </div>
              </div>
              <div style="width: 60px; height: 60px; border: 2px solid #000; padding: 2px; flex-shrink: 0; box-sizing: border-box;">
                <!-- QR code simulation using solid blocks -->
                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <rect width="20" height="20" fill="white" />
                  <g fill="black">
                    <!-- Top Left Corner Marker -->
                    <rect x="1" y="1" width="5" height="5" />
                    <rect x="2" y="2" width="3" height="3" fill="white" />
                    <rect x="3" y="3" width="1" height="1" />
                    
                    <!-- Top Right Corner Marker -->
                    <rect x="14" y="1" width="5" height="5" />
                    <rect x="15" y="2" width="3" height="3" fill="white" />
                    <rect x="16" y="3" width="1" height="1" />
                    
                    <!-- Bottom Left Corner Marker -->
                    <rect x="1" y="14" width="5" height="5" />
                    <rect x="2" y="15" width="3" height="3" fill="white" />
                    <rect x="3" y="16" width="1" height="1" />
                    
                    <!-- Random dots representing QR pattern -->
                    <rect x="8" y="2" width="1" height="2" />
                    <rect x="11" y="1" width="2" height="1" />
                    <rect x="7" y="5" width="3" height="1" />
                    <rect x="11" y="4" width="1" height="3" />
                    <rect x="8" y="8" width="2" height="2" />
                    <rect x="1" y="8" width="2" height="1" />
                    <rect x="4" y="10" width="1" height="2" />
                    <rect x="14" y="8" width="2" height="3" />
                    <rect x="18" y="7" width="1" height="2" />
                    <rect x="7" y="12" width="2" height="1" />
                    <rect x="10" y="11" width="3" height="1" />
                    <rect x="12" y="14" width="2" height="2" />
                    <rect x="8" y="15" width="1" height="3" />
                    <rect x="16" y="15" width="3" height="1" />
                    <rect x="15" y="17" width="2" height="2" />
                    <rect x="1" y="11" width="2" height="1" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
  };

  const handleTriggerPrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintableHtml());
      printWindow.document.close();
    } else {
      alert("Popup blocker prevented launching the print-ready window. Please allow popups for this logistics domain.");
    }
  };

  const handleDownloadLabelHtml = () => {
    const element = document.createElement("a");
    const file = new Blob([generatePrintableHtml()], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `Logify-Shipping-Label-${quote.id}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in my-8">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <FileText className="text-[#ff7a1a]" size={18} />
            <span className="font-bold text-white text-sm uppercase font-mono tracking-wide">PDF-Ready Shipping Manifest</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable label representation */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6">
          
          <div className="p-3 bg-neutral-950/60 border border-neutral-850 rounded-xl text-[10px] text-neutral-400 leading-relaxed flex items-start gap-2">
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={12} />
            <span>
              This manifest contains high-fidelity commercial waybill details ready for physical printing on A4 or 4x6 thermal sticker sheets. Click <strong>Print Waybill</strong> to trigger your browser's native PDF export.
            </span>
          </div>

          {/* Core Shipping Label Render Container (Visual Preview) */}
          <div className="bg-white text-neutral-950 p-6 rounded-2xl border-4 border-neutral-950 max-w-md mx-auto shadow-xl select-none">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-neutral-950 pb-3 mb-3">
              <span className="font-black text-lg tracking-tighter uppercase font-sans">LOGIFY EXPRESS</span>
              <span className="border-2 border-neutral-950 px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase rounded bg-neutral-950 text-white">
                {quote.type} DISPATCH
              </span>
            </div>

            {/* Ship From */}
            <div className="border-b border-neutral-950 pb-2.5 mb-2.5">
              <div className="font-mono text-[8px] font-black text-neutral-500 uppercase tracking-wide">SHIP FROM (ORIGIN LOGISTICS HUB)</div>
              <div className="text-xs font-bold font-sans mt-0.5 leading-snug">{quote.pickup}</div>
            </div>

            {/* Ship To */}
            <div className="border-b border-neutral-950 pb-2.5 mb-2.5">
              <div className="font-mono text-[8px] font-black text-neutral-500 uppercase tracking-wide">SHIP TO (CONSIGNEE DELIVERY TARGET)</div>
              <div className="text-sm font-extrabold font-sans mt-0.5 leading-snug">{quote.delivery}</div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 border-b-2 border-neutral-950 pb-3 mb-3">
              <div className="border border-neutral-950 p-1.5 rounded bg-neutral-50">
                <span className="font-mono text-[7px] font-bold text-neutral-400 block uppercase">DISPATCH TICKET ID</span>
                <span className="text-[10px] font-black font-mono text-neutral-950">{quote.id}</span>
              </div>
              <div className="border border-neutral-950 p-1.5 rounded bg-neutral-50">
                <span className="font-mono text-[7px] font-bold text-neutral-400 block uppercase">GROSS MASS / FARE</span>
                <span className="text-[10px] font-bold font-sans text-neutral-950">{quote.weight} KG (${quote.price.toFixed(2)})</span>
              </div>
              <div className="border border-neutral-950 p-1.5 rounded bg-neutral-50">
                <span className="font-mono text-[7px] font-bold text-neutral-400 block uppercase">ESTIMATED WINDOW</span>
                <span className="text-[10px] font-bold font-sans text-neutral-950 truncate block" title={quote.deliveryTime}>{quote.deliveryTime}</span>
              </div>
              <div className="border border-neutral-950 p-1.5 rounded bg-neutral-50">
                <span className="font-mono text-[7px] font-bold text-neutral-400 block uppercase">SYSTEM DATE</span>
                <span className="text-[10px] font-bold font-sans text-neutral-950">{new Date(quote.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Barcode vector graphic mockup */}
            <div className="flex flex-col items-center py-2.5 border-b border-neutral-950 border-dashed">
              <svg className="w-full max-w-[280px] h-14" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
                <g fill="#000000">
                  <rect x="10" y="5" width="3" height="50" />
                  <rect x="16" y="5" width="1" height="50" />
                  <rect x="20" y="5" width="4" height="50" />
                  <rect x="28" y="5" width="1" height="50" />
                  <rect x="32" y="5" width="5" height="50" />
                  <rect x="42" y="5" width="2" height="50" />
                  <rect x="48" y="5" width="1" height="50" />
                  <rect x="52" y="5" width="4" height="50" />
                  <rect x="60" y="5" width="6" height="50" />
                  <rect x="70" y="5" width="1" height="50" />
                  <rect x="74" y="5" width="3" height="50" />
                  <rect x="80" y="5" width="5" height="50" />
                  <rect x="88" y="5" width="1" height="50" />
                  <rect x="92" y="5" width="4" height="50" />
                  <rect x="100" y="5" width="3" height="50" />
                  <rect x="106" y="5" width="5" height="50" />
                  <rect x="114" y="5" width="1" height="50" />
                  <rect x="118" y="5" width="6" height="50" />
                  <rect x="128" y="5" width="3" height="50" />
                  <rect x="134" y="5" width="4" height="50" />
                  <rect x="140" y="5" width="1" height="50" />
                  <rect x="144" y="5" width="5" height="50" />
                  <rect x="152" y="5" width="3" height="50" />
                  <rect x="158" y="5" width="1" height="50" />
                  <rect x="162" y="5" width="4" height="50" />
                  <rect x="168" y="5" width="6" height="50" />
                  <rect x="178" y="5" width="3" height="50" />
                  <rect x="184" y="5" width="1" height="50" />
                  <rect x="188" y="5" width="5" height="50" />
                  <rect x="196" y="5" width="3" height="50" />
                  <rect x="202" y="5" width="4" height="50" />
                  <rect x="208" y="5" width="1" height="50" />
                  <rect x="212" y="5" width="6" height="50" />
                  <rect x="222" y="5" width="3" height="50" />
                  <rect x="228" y="5" width="1" height="50" />
                  <rect x="232" y="5" width="5" height="50" />
                  <rect x="240" y="5" width="3" height="50" />
                  <rect x="246" y="5" width="6" height="50" />
                  <rect x="256" y="5" width="1" height="50" />
                  <rect x="260" y="5" width="4" height="50" />
                  <rect x="268" y="5" width="3" height="50" />
                  <rect x="274" y="5" width="5" height="50" />
                  <rect x="282" y="5" width="1" height="50" />
                  <rect x="286" y="5" width="4" height="50" />
                </g>
              </svg>
              <span className="font-mono text-[9px] font-bold text-neutral-900 tracking-[1.5px] mt-1.5 uppercase">
                {trackingNumberStr}
              </span>
            </div>

            {/* Bottom Disclaimer with simulation QR */}
            <div className="mt-3 flex gap-4 items-start">
              <div className="flex-1">
                <span className="font-mono text-[6.5px] font-bold text-neutral-500 block uppercase tracking-wide">
                  TERMS & DISPATCH PROTOCOLS
                </span>
                <p className="text-[6.5px] text-neutral-500 leading-normal text-justify mt-0.5">
                  This parcel waybill serves as verification under commercial trade codes. Weight declarations must be verified at the designated sorting hubs prior to courier assignment.
                </p>
              </div>

              {/* QR Simulator Graphic */}
              <div className="w-11 h-11 border border-neutral-950 p-0.5 flex-shrink-0">
                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <rect width="20" height="20" fill="white" />
                  <g fill="black">
                    <rect x="1" y="1" width="5" height="5" />
                    <rect x="2" y="2" width="3" height="3" fill="white" />
                    <rect x="3" y="3" width="1" height="1" />
                    
                    <rect x="14" y="1" width="5" height="5" />
                    <rect x="15" y="2" width="3" height="3" fill="white" />
                    <rect x="16" y="3" width="1" height="1" />
                    
                    <rect x="1" y="14" width="5" height="5" />
                    <rect x="2" y="15" width="3" height="3" fill="white" />
                    <rect x="3" y="16" width="1" height="1" />
                    
                    <rect x="8" y="2" width="1" height="2" />
                    <rect x="11" y="1" width="2" height="1" />
                    <rect x="7" y="5" width="3" height="1" />
                    <rect x="11" y="4" width="1" height="3" />
                    <rect x="8" y="8" width="2" height="2" />
                    <rect x="1" y="8" width="2" height="1" />
                    <rect x="14" y="8" width="2" height="3" />
                    <rect x="7" y="12" width="2" height="1" />
                    <rect x="10" y="11" width="3" height="1" />
                    <rect x="12" y="14" width="2" height="2" />
                    <rect x="8" y="15" width="1" height="3" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={handleDownloadLabelHtml}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-neutral-700"
          >
            <Download size={13} />
            Download HTML Label
          </button>
          
          <button
            onClick={handleTriggerPrint}
            className="px-5 py-2.5 bg-[#ff7a1a] hover:bg-[#e66c15] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-orange-500/10"
          >
            <Printer size={13} />
            Print Waybill & Label
          </button>
        </div>

      </div>
    </div>
  );
}
