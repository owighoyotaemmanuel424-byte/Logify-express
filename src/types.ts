export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'driver';
  status: 'active' | 'suspended';
  phone: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TimelineEvent {
  status: string;
  timestamp: string;
  location: string;
  description: string;
}

export interface Shipment {
  id: string; // Tracking ID e.g., LOG-739281-US
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCoords: Coordinates;
  deliveryCoords: Coordinates;
  currentCoords: Coordinates;
  weight: number; // in kg
  type: 'Freight' | 'Express' | 'Standard' | 'Document' | 'Fragile';
  status: 'Pending' | 'Picked Up' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  price: number;
  assignedDriverId: string | null;
  timeline: TimelineEvent[];
  createdAt: string;
  estimatedDelivery: string;
  packageValue?: number;
  packageDimensions?: { length: number; width: number; height: number };
  pickupDate?: string;
  invoiceDocName?: string;
  invoiceDocData?: string;
  labelDocName?: string;
  labelDocData?: string;
  tag?: string; // Color-coded shipment tag, e.g. "In Transit", "Delayed", "Customs Hold", "Delivered"
  proofOfDelivery?: string; // Camera captured base64 image data of receipt
  subscribers?: string[]; // Registered email addresses for status updates
}

export interface Driver {
  id: string; // User ID
  name: string;
  phone: string;
  vehicleType: 'Truck' | 'Van' | 'Motorcycle' | 'Drones';
  vehiclePlate: string;
  currentCoords: Coordinates;
  status: 'Available' | 'On Delivery' | 'Offline';
}

export interface Payment {
  id: string;
  shipmentId: string;
  amount: number;
  currency: string;
  status: 'Paid' | 'Pending' | 'Failed';
  method: 'Card' | 'Stripe' | 'Paystack' | 'Bank Transfer';
  timestamp: string;
}

export interface PricingRule {
  basePrice: number;
  pricePerKg: number;
  pricePerKm: number;
}

export interface Settings {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  pricing: PricingRule;
  isSiteActive?: boolean; // ON -> Site Active, OFF -> Maintenance Mode
  faviconEmoji?: string; // Emoji or custom text icon
  showCookieBanner?: boolean; // Toggle Cookie Banner
  enableLiveChat?: boolean; // Toggle Live Chat System
  is2FAEnabled?: boolean; // Toggle 2FA security
  enableHighContrastStatus?: boolean; // Toggle High Contrast Status colors for dark mode
  trackerShowMap?: boolean;
  trackerShowThermalTag?: boolean;
  trackerShowSmsAlerts?: boolean;
  trackerShowEmailAlerts?: boolean;
  trackerShowSimulation?: boolean;
  trackerShowTelemetryDeck?: boolean;
  trackerShowRouteVector?: boolean;
  trackerShowShareButton?: boolean;
  trackerShowEstimatedDelivery?: boolean;
  trackerShowChronologyLog?: boolean;
  trackerCustomBackgroundPreset?: 'red-yellow' | 'slate' | 'emerald' | 'cosmic' | 'cyber';
  trackerCustomNotes?: string;
}

export interface Alert {
  id: string;
  type: 'Email' | 'SMS';
  recipient: string;
  title: string;
  body: string;
  timestamp: string;
}

export interface DBState {
  users: User[];
  shipments: Shipment[];
  drivers: Driver[];
  payments: Payment[];
  settings: Settings;
  alerts?: Alert[];
  chats?: any[];
  quotes?: any[];
}
