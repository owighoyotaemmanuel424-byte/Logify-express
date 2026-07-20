import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string; }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-scanner-element";

  // When modal opens/closes, handle initialization and cleanup of Html5Qrcode
  useEffect(() => {
    if (!isOpen) return;

    setIsInitializing(true);
    setError(null);

    // Give the DOM a moment to render the target div element
    const initTimeout = setTimeout(() => {
      // Create new instance of Html5Qrcode
      const html5QrCode = new Html5Qrcode(elementId);
      qrScannerRef.current = html5QrCode;

      // Request camera permissions and retrieve list of cameras
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to back camera if possible
            const backCam = devices.find(
              (device) =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('environment') ||
                device.label.toLowerCase().includes('rear')
            );
            const initialCameraId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(initialCameraId);
            startScanning(html5QrCode, initialCameraId);
          } else {
            setError("No camera devices found. Please ensure a camera is connected.");
            setIsInitializing(false);
          }
        })
        .catch((err) => {
          console.error("Error getting cameras:", err);
          setError("Failed to access camera. Please check permissions and refresh.");
          setIsInitializing(false);
        });
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = (scanner: Html5Qrcode, cameraId: string) => {
    setIsInitializing(true);
    setError(null);

    scanner.start(
      cameraId,
      {
        fps: 10,
        qrbox: (width, height) => {
          const size = Math.min(width, height) * 0.7;
          return { width: size, height: size };
        }
      },
      (decodedText) => {
        // Stop scanning on success
        stopScanning();
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Verbosely ignored by default to prevent UI spam
      }
    )
    .then(() => {
      setIsInitializing(false);
    })
    .catch((err) => {
      console.error("Error starting camera stream:", err);
      setError("Unable to start the camera stream. Ensure the camera is not in use by another app.");
      setIsInitializing(false);
    });
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cameraId = e.target.value;
    setSelectedCameraId(cameraId);
    if (qrScannerRef.current) {
      if (qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop()
          .then(() => {
            if (qrScannerRef.current) {
              startScanning(qrScannerRef.current, cameraId);
            }
          })
          .catch((err) => {
            console.error("Error stopping scanner for switch:", err);
            setError("Failed to switch camera source.");
          });
      } else {
        startScanning(qrScannerRef.current, cameraId);
      }
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      if (qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop()
          .then(() => {
            qrScannerRef.current = null;
          })
          .catch((err) => {
            console.error("Error stopping camera scan:", err);
          });
      } else {
        qrScannerRef.current = null;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Camera className="text-dhl-red dark:text-red-500 animate-pulse" size={18} />
            <span className="text-sm font-sans font-black text-slate-900 dark:text-white uppercase tracking-tight">Camera QR Scanner</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera Stage */}
        <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          
          {/* Target Element for html5-qrcode */}
          <div 
            id={elementId} 
            className="w-full h-full aspect-square max-h-[400px] [&_video]:object-cover"
          />

          {/* Holographic Laser Targeting Square Overlay */}
          {!isInitializing && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[70%] h-[70%] max-w-[280px] max-h-[280px] border-2 border-dashed border-emerald-500 rounded-2xl flex items-center justify-center">
                {/* Neon Green Scan Line animation */}
                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.8)] rounded animate-scan" />
                
                {/* 4 Corner brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-md" />

                <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase bg-slate-950/70 px-2 py-0.5 rounded-md text-center">
                  Align QR Code
                </span>
              </div>
            </div>
          )}

          {/* Initializing / Loading state */}
          {isInitializing && !error && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-10 text-white">
              <RefreshCw className="animate-spin text-dhl-red" size={32} />
              <p className="text-xs font-mono text-slate-400">Locking satellite optical feed...</p>
            </div>
          )}

          {/* Camera Permission / Access Error */}
          {error && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-20">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h4 className="text-sm font-sans font-black text-white uppercase tracking-tight">Camera Feed Exception</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {error}
                </p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setIsInitializing(true);
                  // Trigger a re-run by mimicking state
                  Html5Qrcode.getCameras()
                    .then((devices) => {
                      if (devices && devices.length > 0) {
                        setCameras(devices);
                        const backCam = devices.find(
                          (device) =>
                            device.label.toLowerCase().includes('back') ||
                            device.label.toLowerCase().includes('environment') ||
                            device.label.toLowerCase().includes('rear')
                        );
                        const initialCameraId = backCam ? backCam.id : devices[0].id;
                        setSelectedCameraId(initialCameraId);
                        if (qrScannerRef.current) {
                          startScanning(qrScannerRef.current, initialCameraId);
                        }
                      } else {
                        setError("No camera devices found. Please ensure a camera is connected.");
                        setIsInitializing(false);
                      }
                    })
                    .catch((err) => {
                      console.error("Error getting cameras on retry:", err);
                      setError("Failed to access camera. Please check permissions and refresh.");
                      setIsInitializing(false);
                    });
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
          {/* Camera Selector */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="font-mono text-slate-400 uppercase font-bold text-[10px] tracking-wider text-left">
                Select Optics Source
              </label>
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-sans font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-dhl-red text-xs max-w-[200px]"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider leading-relaxed">
              Position any Logify shipment QR / barcode within the frame to automatically parse waybill tracking data.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
