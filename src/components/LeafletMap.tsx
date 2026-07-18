import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../types.js';
import { Compass, Focus, MapPin, Navigation } from 'lucide-react';

interface LeafletMapProps {
  pickupCoords?: Coordinates;
  deliveryCoords?: Coordinates;
  currentCoords?: Coordinates;
  status?: string;
  driverName?: string;
  theme?: 'light' | 'dark';
}

export default function LeafletMap({
  pickupCoords,
  deliveryCoords,
  currentCoords,
  status,
  driverName,
  theme = 'light',
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);

  const markersRef = useRef<{
    pickup?: L.Marker;
    delivery?: L.Marker;
    current?: L.Marker;
    route?: L.Polyline;
  }>({});

  // 1. Initialize Map Instance Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      // Default center around USA center
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([37.8, -96], 4);

      // Add zoom control at bottom-right
      L.control.zoom({
        position: 'bottomright',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Force tile recalculation in container
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(resizeTimer);
    };
  }, []);

  // Update Tile Layer URL depending on Theme
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const lightUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const activeUrl = theme === 'dark' ? darkUrl : lightUrl;

    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(activeUrl);
    } else {
      tileLayerRef.current = L.tileLayer(activeUrl, {
        maxZoom: 19,
      }).addTo(map);
    }
  }, [theme]);

  // 2. Setup Static Routes & Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up existing static markers to prepare for updates if coordinates change
    if (markersRef.current.pickup) {
      map.removeLayer(markersRef.current.pickup);
      markersRef.current.pickup = undefined;
    }
    if (markersRef.current.delivery) {
      map.removeLayer(markersRef.current.delivery);
      markersRef.current.delivery = undefined;
    }
    if (markersRef.current.route) {
      map.removeLayer(markersRef.current.route);
      markersRef.current.route = undefined;
    }

    const bounds: L.LatLngExpression[] = [];

    // Custom SVG HTML icons
    const pickupIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-emerald-500/20 rounded-full animate-ping"></div>
          <div class="w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const deliveryIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-rose-500/20 rounded-full animate-ping"></div>
          <div class="w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Plot Pickup Location
    if (pickupCoords) {
      const pickupLatLng: L.LatLngTuple = [pickupCoords.lat, pickupCoords.lng];
      markersRef.current.pickup = L.marker(pickupLatLng, { icon: pickupIcon })
        .bindPopup(`<strong style="color:#0f172a;">Origin Depot</strong><br><span style="font-size:10px;color:#64748b;">Lat: ${pickupCoords.lat.toFixed(4)}, Lng: ${pickupCoords.lng.toFixed(4)}</span>`)
        .addTo(map);
      bounds.push(pickupLatLng);
    }

    // Plot Delivery Destination
    if (deliveryCoords) {
      const deliveryLatLng: L.LatLngTuple = [deliveryCoords.lat, deliveryCoords.lng];
      markersRef.current.delivery = L.marker(deliveryLatLng, { icon: deliveryIcon })
        .bindPopup(`<strong style="color:#0f172a;">Destination Hub</strong><br><span style="font-size:10px;color:#64748b;">Lat: ${deliveryCoords.lat.toFixed(4)}, Lng: ${deliveryCoords.lng.toFixed(4)}</span>`)
        .addTo(map);
      bounds.push(deliveryLatLng);
    }

    // Draw Route Path Polyline
    if (pickupCoords && deliveryCoords) {
      const polylinePoints: L.LatLngTuple[] = [
        [pickupCoords.lat, pickupCoords.lng],
        [deliveryCoords.lat, deliveryCoords.lng],
      ];
      markersRef.current.route = L.polyline(polylinePoints, {
        color: '#ff7a1a',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);
    }

    // Fit map bounds nicely
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [50, 50],
        maxZoom: 12,
      });
    }

    // Double force size recalculation
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [pickupCoords, deliveryCoords]);

  // 3. Setup / Update Dynamic Vehicle GPS Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !currentCoords) return;

    const currentLatLng: L.LatLngTuple = [currentCoords.lat, currentCoords.lng];

    const currentIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-blue-500/25 rounded-full animate-ping" style="animation-duration: 2.5s;"></div>
          <div class="absolute w-8 h-8 bg-blue-500/40 rounded-full animate-pulse"></div>
          <div class="w-7 h-7 bg-blue-600 rounded-xl border border-white flex items-center justify-center shadow-2xl transform rotate-0 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck">
              <rect width="16" height="10" x="2" y="4" rx="2"/>
              <rect width="16" height="10" x="2" y="14" rx="2"/>
              <path d="M13 6h3a2 2 0 0 1 2 2v7"/>
              <circle cx="7.5" cy="18.5" r="2.5"/>
              <circle cx="16.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
        </div>
      `,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const isDelivered = status === 'Delivered' || status === 'Cancelled';

    if (isDelivered) {
      // If delivered, remove dynamic marker from map
      if (markersRef.current.current) {
        map.removeLayer(markersRef.current.current);
        markersRef.current.current = undefined;
      }
    } else {
      // Update position or create
      if (markersRef.current.current) {
        markersRef.current.current.setLatLng(currentLatLng);
      } else {
        markersRef.current.current = L.marker(currentLatLng, { icon: currentIcon })
          .bindPopup(`<strong style="color:#1e3a8a;">Logify Active Courier</strong><br><span style="font-size:10px;color:#3b82f6;font-family:monospace;font-weight:bold;">Status: ${status}</span>`)
          .addTo(map);
      }

      // Smooth pan to current position if auto-center is active
      if (autoCenter) {
        map.panTo(currentLatLng, {
          animate: true,
          duration: 0.8,
        });
      }
    }

  }, [currentCoords, status, autoCenter]);

  // Handle Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const manualRecenter = () => {
    const map = mapRef.current;
    if (map && currentCoords) {
      map.panTo([currentCoords.lat, currentCoords.lng], {
        animate: true,
        duration: 1.0,
      });
      setAutoCenter(true);
    }
  };

  return (
    <div className="relative w-full h-[380px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group transition-colors duration-300">
      
      {/* Map Interactive Overlay - Top Left */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-lg transition-colors duration-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        GPS SATELLITE FEED
      </div>

      {/* Map Interactive Overlay - Top Right Controls */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
        <button
          onClick={() => setAutoCenter(!autoCenter)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 border shadow-md cursor-pointer ${
            autoCenter
              ? 'bg-blue-600/90 border-blue-500 text-white hover:bg-blue-600'
              : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle locking the map view centered on the moving vehicle"
        >
          <Focus size={11} className={autoCenter ? 'animate-pulse' : ''} />
          {autoCenter ? 'Center Lock: ON' : 'Center Lock: OFF'}
        </button>

        {!autoCenter && currentCoords && (
          <button
            onClick={manualRecenter}
            className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 shadow-md cursor-pointer"
            title="Snap viewport back to the carrier's active GPS coordinate"
          >
            <Navigation size={11} className="rotate-45" />
            Recenter
          </button>
        )}
      </div>

      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-10" />

      {/* Custom styled map legend bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 z-20 transition-colors duration-300">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Origin Depot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Destination Hub
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Active Courier GPS
          </span>
        </div>
        {driverName && (
          <div className="text-slate-500 dark:text-slate-400 font-mono">
            COURIER AGENT: <span className="text-slate-850 dark:text-slate-200 font-bold">{driverName.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
