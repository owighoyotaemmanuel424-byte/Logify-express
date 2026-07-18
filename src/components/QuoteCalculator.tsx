import React, { useState, useEffect } from 'react';
import { 
  Calculator, ArrowRight, Bot, Compass, Loader2, DollarSign, Scale, 
  MapPin, Truck, AlertCircle, CheckCircle, Ship, Plane, Tag, HelpCircle, 
  RefreshCw, Layers, FileText
} from 'lucide-react';
import { Settings } from '../types.js';
import ShippingLabelModal from './ShippingLabelModal.tsx';

interface QuoteCalculatorProps {
  settings: Settings;
  onNavigate: (view: string) => void;
  token: string | null;
}

interface Rate {
  id: string;
  name: string;
  basePrice: number;
  ratePerKg: number;
  ratePerKm: number;
  deliveryDays: string;
}

export default function QuoteCalculator({ settings, onNavigate, token }: QuoteCalculatorProps) {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [weight, setWeight] = useState(10);
  const [serviceType, setServiceType] = useState<'Standard' | 'Express' | 'Freight' | 'Document'>('Standard');
  
  // Dynamic Quote & Rates States
  const [rates, setRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [savedQuote, setSavedQuote] = useState<{
    id: string;
    pickup: string;
    delivery: string;
    weight: number;
    type: string;
    price: number;
    deliveryTime: string;
    createdAt: string;
  } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  // AI predictions states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPredictions, setAiPredictions] = useState<{
    distanceKm: number;
    estimatedHours: number;
    confidenceScore: number;
    riskLevel: string;
    reasoning: string;
    optimalCheckpoints: Array<{ name: string; estHours: number; tip: string }>;
    routeRecommendations: string[];
  } | null>(null);

  // Fetch Live Rates on boot
  useEffect(() => {
    fetchRates();
  }, [settings]);

  const fetchRates = async () => {
    setRatesLoading(true);
    try {
      const res = await fetch('/api/rates');
      if (res.ok) {
        const data = await res.json();
        setRates(data);
      } else {
        throw new Error();
      }
    } catch (err) {
      // High-quality fallback based on global settings pricing
      const base = settings.pricing.basePrice;
      const kg = settings.pricing.pricePerKg;
      const km = settings.pricing.pricePerKm;
      setRates([
        { id: "air", name: "Air Freight", basePrice: base * 2.5, ratePerKg: kg * 1.8, ratePerKm: km * 2.0, deliveryDays: "1-2 Business Days" },
        { id: "sea", name: "Sea Cargo", basePrice: base * 0.8, ratePerKg: kg * 0.5, ratePerKm: km * 0.4, deliveryDays: "10-15 Business Days" },
        { id: "express", name: "Express Air Freight", basePrice: base * 1.5, ratePerKg: kg * 1.5, ratePerKm: km * 1.5, deliveryDays: "2-3 Business Days" }
      ]);
    } finally {
      setRatesLoading(false);
    }
  };

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup.trim() || !delivery.trim() || weight <= 0) return;

    setQuoteLoading(true);
    setQuoteError(null);
    setSavedQuote(null);
    setAiPredictions(null); // Reset AI on new quote

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pickup,
          delivery,
          weight,
          type: serviceType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to synchronize and save quote ticket.');
      }

      const quoteData = await response.json();
      setSavedQuote(quoteData);
    } catch (err: any) {
      setQuoteError(err.message || 'System issues while processing booking quote.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const runAiAnalysis = async () => {
    if (!savedQuote) return;
    setAiLoading(true);
    setAiError(null);
    setAiPredictions(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const [routeRes, etaRes] = await Promise.all([
        fetch('/api/ai/optimize-route', {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            pickupAddress: savedQuote.pickup, 
            deliveryAddress: savedQuote.delivery, 
            type: savedQuote.type, 
            weight: savedQuote.weight 
          }),
        }),
        fetch('/api/ai/predict-delivery-time', {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            pickupAddress: savedQuote.pickup, 
            deliveryAddress: savedQuote.delivery, 
            type: savedQuote.type, 
            weight: savedQuote.weight 
          }),
        }),
      ]);

      if (!routeRes.ok || !etaRes.ok) {
        throw new Error('AI Engine failed to compute routing metrics. Admin profile may need validation.');
      }

      const routeData = await routeRes.json();
      const etaData = await etaRes.json();

      setAiPredictions({
        distanceKm: routeData.distanceKm,
        estimatedHours: etaData.estimatedHours,
        confidenceScore: etaData.confidenceScore,
        riskLevel: etaData.riskLevel,
        reasoning: etaData.reasoning,
        optimalCheckpoints: routeData.optimalCheckpoints,
        routeRecommendations: routeData.routeRecommendations,
      });
    } catch (err: any) {
      setAiError(err.message || 'The predictive AI routing module is currently unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Page Title */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="text-3xl font-black text-white leading-none tracking-tight">
          System Rates & Instant Quotes
        </h1>
        <p className="text-xs text-neutral-400">
          Obtain dynamic shipment rates across multiple transport modules, save real quote tickets, and trigger generative AI predictive route analytics.
        </p>
      </div>

      {/* 1. DYNAMIC RATES COMPARISON SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-2">
            <Layers size={14} className="text-[#ff7a1a]" /> Live System Transport Rates
          </h2>
          <button 
            onClick={fetchRates} 
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
            title="Refresh Rates"
          >
            {ratesLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Sync Rates
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rates.map((rate) => (
            <div 
              key={rate.id}
              className="bg-neutral-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl shadow-black/20 flex flex-col justify-between space-y-4 hover:border-[#ff7a1a]/30 transition-all group"
            >
              <div className="space-y-3">
                {/* Header Icon */}
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#ff7a1a]/10 text-[#ff7a1a] flex items-center justify-center font-bold">
                    {rate.id === 'air' ? <Plane size={16} /> : rate.id === 'sea' ? <Ship size={16} /> : <Truck size={16} />}
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-neutral-950/80 border border-neutral-850 px-2 py-0.5 rounded text-[#ff7a1a]">
                    {rate.deliveryDays}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#ff7a1a] transition-colors">{rate.name}</h3>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">Baseline freight transportation spanning global trading corridors with integrated waybill tracking.</p>
                </div>
              </div>

              {/* Pricing breakdown details */}
              <div className="border-t border-neutral-800/60 pt-4 space-y-2.5">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-[10px] text-neutral-500 font-sans font-medium">Standard Base Rate:</span>
                  <span className="text-sm font-black text-white">${rate.basePrice.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-neutral-950/40 p-2 rounded-xl border border-neutral-850 font-mono text-center">
                  <div>
                    <span className="text-neutral-500 text-[9px] block">Per Kilogram</span>
                    <span className="font-bold text-neutral-300">${rate.ratePerKg.toFixed(2)}/kg</span>
                  </div>
                  <div className="border-l border-neutral-850">
                    <span className="text-neutral-500 text-[9px] block">Per Kilometer</span>
                    <span className="font-bold text-neutral-300">${rate.ratePerKm.toFixed(2)}/km</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CORE BOOKING FORM & AI ROUTING GENERATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs text-neutral-300">
        {/* Quote Booking Form Card */}
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2.5">
            <Calculator size={15} className="text-[#ff7a1a]" />
            Request Instant Quote Ticket
          </h2>

          <form onSubmit={handleRequestQuote} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Pickup Logistics Depot *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-neutral-500" size={14} />
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 Broadway, New York, NY"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-[#ff7a1a] rounded-xl pl-9 pr-4 py-3 outline-none text-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Consignee Target Destination *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-neutral-500" size={14} />
                <input
                  type="text"
                  required
                  placeholder="e.g. 1600 Amphitheatre Pkwy, Mountain View, CA"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-[#ff7a1a] rounded-xl pl-9 pr-4 py-3 outline-none text-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Gross Weight (kg) *</label>
                <div className="relative font-mono">
                  <Scale className="absolute left-3 top-3.5 text-neutral-500" size={14} />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-[#ff7a1a] rounded-xl pl-9 pr-4 py-3 outline-none text-white transition-colors font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Transport Tier *</label>
                <select
                  value={serviceType}
                  onChange={(e: any) => setServiceType(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-[#ff7a1a] rounded-xl px-4 py-3 outline-none text-white font-medium transition-colors cursor-pointer"
                >
                  <option value="Standard">Standard Delivery</option>
                  <option value="Express">Express Cargo</option>
                  <option value="Freight">Heavy Freight</option>
                  <option value="Document">Secure Document</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={quoteLoading}
              className="w-full py-3.5 bg-[#ff7a1a] hover:bg-[#e66c15] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
            >
              {quoteLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Generating Pricing Ticket...
                </>
              ) : (
                'Request Live Quote Ticket'
              )}
            </button>
          </form>

          {/* QUOTE RESULT BLOCK */}
          {quoteError && (
            <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle size={14} />
              {quoteError}
            </div>
          )}

          {savedQuote && (
            <div className="bg-neutral-950/80 border border-neutral-850 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 animate-fade-in relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Tag size={12} className="text-[#ff7a1a]" />
                  <span className="text-[9px] font-mono font-bold uppercase text-[#ff7a1a] tracking-wider">Ticket ID: {savedQuote.id}</span>
                </div>
                <span className="text-2xl font-mono font-black text-white block">
                  ${savedQuote.price.toFixed(2)} <span className="text-[10px] text-neutral-400 font-sans font-normal">USD</span>
                </span>
                <p className="text-[10px] text-neutral-400 leading-normal">Saved to system database. Active dispatch window: <span className="text-white font-semibold font-mono">{savedQuote.deliveryTime}</span></p>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0 z-10">
                <button
                  onClick={runAiAnalysis}
                  disabled={aiLoading}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-750 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Bot size={11} className="text-[#ff7a1a]" />}
                  Optimize Route AI
                </button>
                <button
                  onClick={() => setIsLabelModalOpen(true)}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-750 text-neutral-300 hover:text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText size={11} className="text-[#ff7a1a]" />
                  Download Label
                </button>
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-4 py-2.5 bg-[#ff7a1a] hover:bg-[#e66c15] text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  Confirm Booking <ArrowRight size={11} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Predictor Panel */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-2">
            <Compass size={14} className="text-[#ff7a1a]" /> AI Fleet Telemetry Router
          </h2>

          <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-3xl p-6 min-h-[360px] flex flex-col justify-center relative overflow-hidden">
            {aiLoading && (
              <div className="flex flex-col items-center space-y-3 text-center p-8">
                <Loader2 className="text-[#ff7a1a] animate-spin" size={32} />
                <p className="text-xs font-mono text-neutral-300">Evaluating transit corridors via Gemini AI...</p>
                <span className="text-[9px] text-neutral-500 max-w-[220px] leading-relaxed">Processing live meteorological feeds and active terminal congestion segments...</span>
              </div>
            )}

            {!aiLoading && !aiPredictions && !aiError && (
              <div className="flex flex-col items-center space-y-3.5 text-center text-neutral-500 p-8">
                <div className="w-12 h-12 bg-neutral-950 border border-neutral-850 rounded-2xl flex items-center justify-center">
                  <Bot size={24} className="text-neutral-600" />
                </div>
                <h3 className="text-xs font-black uppercase font-mono text-neutral-400">Telemetry Optimizer Idle</h3>
                <p className="text-[11px] max-w-[240px] leading-relaxed text-neutral-400">
                  Input shipment specifications to generate a live quote ticket, then invoke Gemini AI to predict optimized routes, coordinates, and checkpoint intervals.
                </p>
              </div>
            )}

            {aiError && (
              <div className="flex flex-col items-center space-y-2.5 text-center text-rose-400 p-8">
                <AlertCircle size={28} />
                <h3 className="text-xs font-black uppercase font-mono tracking-wider">AI Optimizer Refused</h3>
                <p className="text-[11px] text-neutral-500 leading-relaxed">{aiError}</p>
                <span className="text-[9px] text-neutral-500">The baseline quote is still fully valid. Contact routing coordinators.</span>
              </div>
            )}

            {aiPredictions && !aiLoading && (
              <div className="space-y-5 animate-fade-in text-neutral-300">
                {/* AI Header Info */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#ff7a1a] font-bold font-mono">
                    <CheckCircle size={13} /> GEMINI AI REPORT
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">Confidence Score: <span className="text-white font-bold">{aiPredictions.confidenceScore}%</span></span>
                </div>

                {/* Primary Stats Panel */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-neutral-950/60 border border-neutral-850 p-2.5 rounded-xl">
                    <span className="text-[8px] text-neutral-500 uppercase font-bold block font-mono">Est. Distance</span>
                    <span className="text-xs font-mono font-bold text-white">{aiPredictions.distanceKm} km</span>
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-850 p-2.5 rounded-xl">
                    <span className="text-[8px] text-neutral-500 uppercase font-bold block font-mono">Est. Duration</span>
                    <span className="text-xs font-mono font-bold text-white">{aiPredictions.estimatedHours} hrs</span>
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-850 p-2.5 rounded-xl">
                    <span className="text-[8px] text-neutral-500 uppercase font-bold block font-mono">Risk Level</span>
                    <span className={`text-xs font-mono font-bold ${aiPredictions.riskLevel.toLowerCase() === 'high' ? 'text-rose-400' : aiPredictions.riskLevel.toLowerCase() === 'medium' ? 'text-[#ff7a1a]' : 'text-emerald-400'}`}>
                      {aiPredictions.riskLevel}
                    </span>
                  </div>
                </div>

                {/* AI Reasoning narrative block */}
                <div className="space-y-1 bg-neutral-950/40 p-3 rounded-xl border border-neutral-850">
                  <span className="text-[8px] uppercase font-bold text-neutral-500 block font-mono">Corridor assessment</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                    "{aiPredictions.reasoning}"
                  </p>
                </div>

                {/* Segment Checkpoints list */}
                <div className="space-y-2">
                  <span className="text-[8px] uppercase font-bold text-neutral-500 block font-mono">Suggested Route Checkpoints</span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {aiPredictions.optimalCheckpoints.map((point, idx) => (
                      <div key={idx} className="flex gap-2.5 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-850">
                        <div className="w-5 h-5 rounded-lg bg-[#ff7a1a]/10 text-[#ff7a1a] flex items-center justify-center font-bold text-[9px] font-mono shrink-0">
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center w-full">
                            <h4 className="text-[11px] font-bold text-white">{point.name}</h4>
                            <span className="text-[9px] font-mono text-[#ff7a1a]">+{point.estHours}h</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-normal">{point.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {savedQuote && (
        <ShippingLabelModal
          isOpen={isLabelModalOpen}
          onClose={() => setIsLabelModalOpen(false)}
          quote={savedQuote}
          aiPredictions={aiPredictions}
        />
      )}
    </div>
  );
}
