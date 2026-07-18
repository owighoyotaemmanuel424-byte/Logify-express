import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, RotateCcw, AlertCircle, Eye, EyeOff, Loader2, Play, Image as ImageIcon, Check } from 'lucide-react';
import { Shipment, Driver } from '../types.js';

interface AdminDriverPortalViewProps {
  shipments: Shipment[];
  drivers: Driver[];
  token: string;
  onRefresh: () => void;
}

export default function AdminDriverPortalView({
  shipments,
  drivers,
  token,
  onRefresh,
}: AdminDriverPortalViewProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial driver if available
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriverId) {
      setSelectedDriverId(drivers[0].id);
    }
  }, [drivers, selectedDriverId]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const activeDriver = drivers.find(d => d.id === selectedDriverId);
  const assignedShipments = shipments.filter(s => s.assignedDriverId === selectedDriverId);

  // Filter into Pending (for delivery) vs Delivered
  const pendingDeliveries = assignedShipments.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled');
  const completedDeliveries = assignedShipments.filter(s => s.status === 'Delivered');

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    setError(null);
    try {
      const constraints = {
        video: { facingMode: 'environment' }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Camera permission denied or camera unavailable. Please try uploading an image manually below.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas to actual video size
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas image to Base64 data URL
        const base64Image = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(base64Image);
        stopCamera();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Invalid file type. Only image uploads are supported as receipt proof.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
        setCameraActive(false);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the selected file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProof = async () => {
    if (!selectedShipment || !capturedImage) {
      setError("Please capture or upload a delivery receipt first.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/shipments/${selectedShipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Delivered',
          proofOfDelivery: capturedImage,
          location: selectedShipment.deliveryAddress,
          description: `Delivered by courier agent ${activeDriver?.name || 'Assigned Courier'}. Proof of Delivery receipt successfully scanned and logged into tracking database.`
        }),
      });

      if (!response.ok) {
        const errBody = await response.json();
        throw new Error(errBody.error || 'Failed to submit proof of delivery.');
      }

      setSuccess(`Shipment ${selectedShipment.id} successfully delivered! Receipt proof is securely stored.`);
      setSelectedShipment(null);
      setCapturedImage(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Server database communication issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Camera className="text-blue-500 animate-pulse" size={20} /> Driver Portal & Waybill Delivery Log
          </h2>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
            Log dispatch tracking proofs, utilize camera scanners, and finalize shipments.
          </p>
        </div>

        {/* Courier selector simulation */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Active Courier:</label>
          <select
            value={selectedDriverId}
            onChange={(e) => {
              setSelectedDriverId(e.target.value);
              setSelectedShipment(null);
              setCapturedImage(null);
              stopCamera();
              setError(null);
              setSuccess(null);
            }}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none text-slate-900 dark:text-white font-semibold text-xs min-w-[200px]"
          >
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.vehicleType})
              </option>
            ))}
            {drivers.length === 0 && <option value="">-- No Drivers Onboarded --</option>}
          </select>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Shipment list assigned to selected driver */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono border-b border-slate-50 dark:border-slate-800/80 pb-2">
              Assigned Dispatches
            </h3>

            {/* Success / Error logs */}
            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-semibold flex items-start gap-2 border border-emerald-100 dark:border-emerald-900">
                <CheckCircle size={12} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Pending Deliveries */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                Pending Delivery ({pendingDeliveries.length})
              </h4>
              
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {pendingDeliveries.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedShipment(s);
                      setCapturedImage(null);
                      stopCamera();
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedShipment?.id === s.id
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 bg-white dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[9px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {s.id}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400">{s.type}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-700 dark:text-slate-300 leading-snug truncate">
                      To: <span className="font-bold">{s.receiverName}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 truncate">
                      {s.deliveryAddress}
                    </div>
                    <div className="mt-2 flex justify-between items-center text-[8px] font-mono">
                      <span className="text-amber-500 font-bold uppercase">{s.status}</span>
                      <span className="text-slate-400">{s.weight} kg</span>
                    </div>
                  </button>
                ))}
                {pendingDeliveries.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-6">
                    No active dispatches waiting delivery.
                  </p>
                )}
              </div>
            </div>

            {/* Completed Deliveries */}
            <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800/80">
              <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                Completed Deliveries ({completedDeliveries.length})
              </h4>
              
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {completedDeliveries.map(s => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 text-left text-xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                        {s.id}
                      </span>
                      <span className="text-[8px] text-emerald-500 font-mono font-bold flex items-center gap-0.5">
                        <Check size={8} /> DELIVERED
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                      To: <span className="font-bold">{s.receiverName}</span>
                    </div>
                    {s.proofOfDelivery && (
                      <div className="mt-2 flex items-center gap-1 text-[9px] text-blue-500 font-mono font-bold">
                        <ImageIcon size={10} /> Photo receipt registered
                      </div>
                    )}
                  </div>
                ))}
                {completedDeliveries.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-4">
                    No completed dispatches archived.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Active Camera Capture & Drag-and-Drop Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono border-b border-slate-50 dark:border-slate-800/80 pb-2">
              Proof-Of-Delivery Photo Receipt Capture
            </h3>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-xl text-[10px] font-semibold flex items-start gap-2 border border-rose-100 dark:border-rose-900">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {selectedShipment ? (
              <div className="space-y-4">
                {/* Active Shipment Details Header */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Tracking ID</p>
                      <p className="font-bold font-mono text-slate-900 dark:text-white">{selectedShipment.id}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Recipient Name</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-250 truncate">{selectedShipment.receiverName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Weight / Fare</p>
                      <p className="font-semibold text-slate-850 dark:text-slate-300 font-mono">{selectedShipment.weight}kg / ${selectedShipment.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Status</p>
                      <p className="font-bold font-mono text-amber-500 uppercase text-[10px]">{selectedShipment.status}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <p className="text-[9px] font-mono text-slate-400 uppercase">Destination Delivery Address</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{selectedShipment.deliveryAddress}</p>
                  </div>
                </div>

                {/* Camera / Upload Canvas Stage */}
                <div className="space-y-4">
                  {cameraActive ? (
                    /* CAMERA STREAM ACTIVE */
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500 bg-black aspect-video max-w-lg mx-auto shadow-inner">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          playsInline
                          muted
                        />
                        <div className="absolute top-3 left-3 bg-blue-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-white font-mono font-bold flex items-center gap-1 tracking-wider uppercase animate-pulse">
                          <Play size={8} /> Live Device Camera Active
                        </div>
                      </div>

                      <div className="flex justify-center gap-3">
                        <button
                          onClick={capturePhoto}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                        >
                          <Camera size={14} /> Capture Photo Frame
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-all"
                        >
                          Cancel Stream
                        </button>
                      </div>
                    </div>
                  ) : capturedImage ? (
                    /* PREVIEW CAPTURED/UPLOADED IMAGE */
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video max-w-lg mx-auto shadow-md">
                        <img
                          src={capturedImage}
                          alt="Proof of Delivery Receipt"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-emerald-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-white font-mono font-bold flex items-center gap-1 tracking-wider uppercase">
                          <CheckCircle size={8} /> Receipt Scanned Successfully
                        </div>
                      </div>

                      <div className="flex justify-center gap-3">
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RotateCcw size={12} /> Retake Photo
                        </button>
                        <button
                          onClick={() => setCapturedImage(null)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Clear Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* FILE DRAG-AND-DROP ZONE & START CAMERA TRIGGER */
                    <div className="space-y-4">
                      {cameraError && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] leading-relaxed">
                          {cameraError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Device Camera Access Button Panel */}
                        <div 
                          onClick={startCamera}
                          className="border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-all duration-200 group min-h-[180px]"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Camera size={24} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">Access Device Camera</h4>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed mx-auto">
                              Open device lens stream to capture paper receipt, barcode, or package signing.
                            </p>
                          </div>
                          <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase font-mono tracking-wider">
                            Start Camera Scanner
                          </span>
                        </div>

                        {/* File Drag and Drop / Manual Upload */}
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-all duration-200 group min-h-[180px] ${
                            isDragging
                              ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
                              : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload size={22} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">Drag & Drop Image</h4>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed mx-auto">
                              Drag and drop or click to choose PNG/JPG file from device files list.
                            </p>
                          </div>
                          <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-bold uppercase font-mono tracking-wider">
                            Browse Local Files
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hidden canvas to process camera frames */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Submit buttons */}
                  {capturedImage && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
                      <button
                        onClick={handleUploadProof}
                        disabled={submitting}
                        className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Completing Courier Waybill...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Log Delivery & Submit Photo Proof
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 italic text-xs leading-relaxed max-w-sm mx-auto">
                Select a pending dispatch waybill from the left menu list to begin camera capture or upload proof-of-delivery receipts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
