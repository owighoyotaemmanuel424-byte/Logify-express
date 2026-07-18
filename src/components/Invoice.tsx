import React from 'react';
import { Shipment, Settings } from '../types.js';
import { Download, Printer, Receipt, FileText, CheckCircle2 } from 'lucide-react';

interface InvoiceProps {
  shipment: Shipment;
  settings: Settings;
  onClose: () => void;
}

export default function Invoice({ shipment, settings, onClose }: InvoiceProps) {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0">
      {/* Modal Card */}
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8 print:shadow-none print:my-0 print:rounded-none">
        {/* Modal Controls (hidden on print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="text-amber-400" size={20} />
            <span className="font-semibold text-sm font-mono">Invoice: {shipment.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
            >
              <Printer size={13} />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Printable Body */}
        <div id="invoice-print-area" className="p-8 md:p-12 flex-1 flex flex-col bg-white">
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row md:justify-between border-b border-slate-100 pb-8 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-lg">
                  L
                </div>
                <span className="font-sans font-bold text-xl tracking-tight text-slate-900">
                  LOGIFY<span className="text-amber-500 font-mono text-sm">LOGISTICS</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-[240px]">
                {settings.companyName}<br />
                {settings.contactPhone}<br />
                {settings.contactEmail}
              </p>
            </div>
            
            <div className="text-left md:text-right space-y-1">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-slate-400">WAYBILL & INVOICE</h2>
              <p className="text-lg font-mono font-bold text-slate-950">{shipment.id}</p>
              <p className="text-xs text-slate-500">Date Issued: {formattedDate(shipment.createdAt)}</p>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100 mt-1">
                <CheckCircle2 size={10} /> PAYMENT CLEARED
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sender (Origin)</h3>
              <div className="text-xs space-y-1 text-slate-700">
                <p className="font-bold text-slate-900">{shipment.senderName}</p>
                <p>{shipment.senderPhone}</p>
                <p>{shipment.senderEmail}</p>
                <p className="text-slate-500 italic mt-1">{shipment.pickupAddress}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipient (Destination)</h3>
              <div className="text-xs space-y-1 text-slate-700">
                <p className="font-bold text-slate-900">{shipment.receiverName}</p>
                <p>{shipment.receiverPhone}</p>
                <p>{shipment.receiverEmail}</p>
                <p className="text-slate-500 italic mt-1">{shipment.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Shipment Details Table */}
          <div className="py-8 flex-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Itemized Details</h3>
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="p-3">Service Type</th>
                    <th className="p-3">Weight Class</th>
                    <th className="p-3 text-right">Cargo Class</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">{shipment.type} Delivery</td>
                    <td className="p-3">{shipment.weight} kg</td>
                    <td className="p-3 text-right font-mono">Standard Insured</td>
                    <td className="p-3 text-right font-mono">${(shipment.price * 0.85).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3">Fuel & Logistics Surcharge</td>
                    <td className="p-3">-</td>
                    <td className="p-3 text-right font-mono">Variable</td>
                    <td className="p-3 text-right font-mono">${(shipment.price * 0.10).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3">Processing, Sorting & GST</td>
                    <td className="p-3">-</td>
                    <td className="p-3 text-right font-mono">Local Tax (5%)</td>
                    <td className="p-3 text-right font-mono">${(shipment.price * 0.05).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Total */}
          <div className="border-t border-slate-100 pt-6 flex flex-col items-end space-y-1.5">
            <div className="flex justify-between w-64 text-xs text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono">${(shipment.price * 0.95).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 text-xs text-slate-500">
              <span>GST/Taxes (5%):</span>
              <span className="font-mono">${(shipment.price * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Grand Total Paid:</span>
              <span className="font-mono text-amber-600">${shipment.price.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Fine print */}
          <div className="mt-12 text-[10px] text-slate-400 text-center space-y-1">
            <p>Thank you for shipping with Logify Logistics.</p>
            <p>Subject to Terms and Conditions of Carriage. Registered under digital waybill transit reference code.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
