import React from 'react';
import { Coordinates } from '../types.js';
import { ExternalLink, MapPin, Navigation, Truck } from 'lucide-react';

interface LeafletMapProps {
  pickupCoords?: Coordinates;
  deliveryCoords?: Coordinates;
  currentCoords?: Coordinates;
  status?: string;
  driverName?: string;
  theme?: 'light' | 'dark';
}

const isValidCoordinate = (point?: Coordinates): point is Coordinates =>
  Boolean(
    point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180,
  );

const coordinateLabel = (point?: Coordinates) =>
  isValidCoordinate(point) ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'Location not available';

export default function LeafletMap({
  pickupCoords,
  deliveryCoords,
  currentCoords,
  status,
  driverName,
  theme = 'light',
}: LeafletMapProps) {
  // Use the shipment's stored coordinates only. This map does not fabricate GPS updates.
  const origin = isValidCoordinate(currentCoords)
    ? currentCoords
    : isValidCoordinate(pickupCoords)
      ? pickupCoords
      : undefined;
  const destination = isValidCoordinate(deliveryCoords) ? deliveryCoords : undefined;

  const mapsUrl = origin && destination
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${origin.lat},${origin.lng}`)}&destination=${encodeURIComponent(`${destination.lat},${destination.lng}`)}&travelmode=driving`
    : destination
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${destination.lat},${destination.lng}`)}`
      : 'https://www.google.com/maps';

  // Google Maps' embeddable directions view keeps the map usable without exposing
  // a browser API key. The external link opens full Google Maps navigation.
  const embedUrl = origin && destination
    ? `https://maps.google.com/maps?output=embed&saddr=${encodeURIComponent(`${origin.lat},${origin.lng}`)}&daddr=${encodeURIComponent(`${destination.lat},${destination.lng}`)}`
    : destination
      ? `https://maps.google.com/maps?output=embed&q=${encodeURIComponent(`${destination.lat},${destination.lng}`)}`
      : origin
        ? `https://maps.google.com/maps?output=embed&q=${encodeURIComponent(`${origin.lat},${origin.lng}`)}`
        : null;

  const panelClass = theme === 'dark'
    ? 'border-[#2b303e] bg-[#12141a] text-white'
    : 'border-slate-200 bg-white text-slate-900';

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-xl ${panelClass}`} aria-label="Google Maps shipment tracking">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
            <MapPin size={19} />
          </div>
          <div>
            <h3 className="text-sm font-black">Google Maps Tracking</h3>
            <p className="mt-0.5 text-xs opacity-70">Shipment route and destination</p>
          </div>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <Navigation size={14} />
          Open in Google Maps
          <ExternalLink size={12} />
        </a>
      </div>

      {embedUrl ? (
        <iframe
          key={embedUrl}
          title="Google Maps route from current shipment location to delivery destination"
          src={embedUrl}
          className="block h-[320px] w-full border-0 sm:h-[390px] lg:h-[430px]"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center">
          <MapPin size={28} className="opacity-50" />
          <p className="text-sm font-bold">Map coordinates are not available yet</p>
          <p className="max-w-sm text-xs opacity-70">
            The map will appear when this shipment has valid pickup or delivery coordinates.
          </p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-500 underline">
            Open Google Maps
          </a>
        </div>
      )}

      <div className="grid gap-3 border-t border-current/10 p-4 sm:grid-cols-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 text-sky-500"><Truck size={16} /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Current shipment position</p>
            <p className="mt-1 break-all font-mono text-xs">{coordinateLabel(origin)}</p>
            {driverName && <p className="mt-1 truncate text-xs opacity-70">Driver: {driverName}</p>}
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 text-rose-500"><MapPin size={16} /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Delivery destination</p>
            <p className="mt-1 break-all font-mono text-xs">{coordinateLabel(destination)}</p>
            {status && <p className="mt-1 text-xs opacity-70">Status: {status}</p>}
          </div>
        </div>
      </div>
      <p className="px-4 pb-4 text-[10px] leading-relaxed opacity-60">
        Route display uses the coordinates saved on the shipment. It is not a live GPS feed unless your tracking system supplies updated coordinates.
      </p>
    </section>
  );
}
