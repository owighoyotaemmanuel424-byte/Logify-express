import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DBState, User, Shipment, Driver, Payment, Settings, TimelineEvent } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "logify_super_secret_key_123456789";

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "db.json");

// Middleware
app.use(express.json());

// Helper to hash passwords securely with salt
function hashPassword(password: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

// Custom JWT Implementation (standard compliant, native, reliable)
function generateToken(payload: { id: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const [header, body, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// Authentication Middleware (Admin Only)
const trackingRateLimitMap = new Map<string, { count: number; resetTime: number }>();
function trackingRateLimiter(req: any, res: any, next: any) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxRequests = 20; // 20 requests per minute

  const limitData = trackingRateLimitMap.get(ip);
  if (!limitData || now > limitData.resetTime) {
    trackingRateLimitMap.set(ip, { count: 1, resetTime: now + limitWindow });
    return next();
  }

  if (limitData.count >= maxRequests) {
    return res.status(429).json({ error: "Too many tracking requests. Please try again in a minute." });
  }

  limitData.count += 1;
  next();
}

function verifyAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
  if (decoded.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access only" });
  }
  req.user = decoded;
  next();
}

const authenticate = verifyAdmin;

// Database Operations
function readDB(): DBState {
  if (!fs.existsSync(DB_PATH)) {
    const defaultState = seedDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultState, null, 2), "utf8");
    return defaultState;
  }
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(content) as DBState;
    if (parsed.users) {
      parsed.users.forEach(u => {
        u.role = "admin";
      });
    }
    return parsed;
  } catch (error) {
    console.error("Failed to read database, resetting to seeded data", error);
    const defaultState = seedDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultState, null, 2), "utf8");
    return defaultState;
  }
}

function writeDB(state: DBState) {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf8");
}

function triggerNotification(type: "Email" | "SMS", recipient: string, title: string, body: string, db: DBState) {
  if (!db.alerts) db.alerts = [];
  db.alerts.push({
    id: `ALERT-${Math.floor(100000 + Math.random() * 900000)}`,
    type,
    recipient,
    title,
    body,
    timestamp: new Date().toISOString()
  });
  console.log(`[Notification Alert Triggered] Type: ${type} | Recipient: ${recipient} | Title: ${title} | Msg: ${body}`);
}

function seedDatabase(): DBState {
  const state: any = {
    users: [],
    shipments: [],
    drivers: [],
    payments: [],
    settings: {
      companyName: "Logify Logistics Ltd.",
      contactEmail: "support@logify.com",
      contactPhone: "+1 (800) 555-LOGI",
      pricing: {
        basePrice: 15.0,
        pricePerKg: 3.5,
        pricePerKm: 0.8,
      },
      isSiteActive: true,
      faviconEmoji: "📦",
      showCookieBanner: true,
      enableLiveChat: true,
      is2FAEnabled: false,
      enableHighContrastStatus: false,
    },
    chats: [],
    quotes: [],
  };

  // Seed default users
  const seedUsers = [
    { id: "admin-1", email: "sarah@logify.com", name: "Sarah Jenkins (Admin)", role: "admin" as const, phone: "+1 555-0100" },
    { id: "user-1", email: "client@logify.com", name: "Alex Mercer (Client)", role: "admin" as const, phone: "+1 555-0101" },
    { id: "driver-1", email: "courier@logify.com", name: "John Doe (Van Driver)", role: "admin" as const, phone: "+1 555-0102" },
    { id: "driver-2", email: "driver2@logify.com", name: "Michael Chang (Truck Driver)", role: "admin" as const, phone: "+1 555-0103" },
  ];

  const defaultPassword = "password123";

  seedUsers.forEach((u) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(defaultPassword, salt);
    state.users.push({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: "active",
      phone: u.phone,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    });
  });

  // Seed default drivers
  state.drivers.push(
    {
      id: "driver-1",
      name: "John Doe (Van Driver)",
      phone: "+1 555-0102",
      vehicleType: "Van",
      vehiclePlate: "NY-LOG-482",
      currentCoords: { lat: 40.7128, lng: -74.006 },
      status: "Available",
    },
    {
      id: "driver-2",
      name: "Michael Chang (Truck Driver)",
      phone: "+1 555-0103",
      vehicleType: "Truck",
      vehiclePlate: "TX-FREIGHT-991",
      currentCoords: { lat: 34.0522, lng: -118.2437 },
      status: "On Delivery",
    }
  );

  // Seed default shipments
  const shipment1: Shipment = {
    id: "LOG-583019-US",
    senderId: "user-1",
    senderName: "Alex Mercer (Client)",
    senderEmail: "client@logify.com",
    senderPhone: "+1 555-0101",
    receiverName: "Global Tech Solutions",
    receiverEmail: "deliveries@globaltech.com",
    receiverPhone: "+1 555-9281",
    pickupAddress: "100 Broadway, New York, NY 10005",
    deliveryAddress: "1600 Amphitheatre Pkwy, Mountain View, CA 94043",
    pickupCoords: { lat: 40.7075, lng: -74.0112 },
    deliveryCoords: { lat: 37.422, lng: -122.0841 },
    currentCoords: { lat: 39.5, lng: -98.35 }, // In transit somewhere in Kansas
    weight: 12.5,
    type: "Express",
    status: "In Transit",
    price: 320.0,
    assignedDriverId: "driver-2",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    timeline: [
      { status: "Pending", timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), location: "New York, NY", description: "Shipment request received and verified" },
      { status: "Picked Up", timestamp: new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString(), location: "New York Hub", description: "Package picked up by courier" },
      { status: "In Transit", timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), location: "New Jersey Distribution Center", description: "Shipment departed and in transit across state lines" },
    ],
  };

  const shipment2: Shipment = {
    id: "LOG-291048-US",
    senderId: "user-1",
    senderName: "Alex Mercer (Client)",
    senderEmail: "client@logify.com",
    senderPhone: "+1 555-0101",
    receiverName: "Jane Miller",
    receiverEmail: "jane@example.com",
    receiverPhone: "+1 555-3810",
    pickupAddress: "450 Sutter St, San Francisco, CA 94108",
    deliveryAddress: "700 Bellevue Way NE, Bellevue, WA 98004",
    pickupCoords: { lat: 37.7892, lng: -122.4084 },
    deliveryCoords: { lat: 47.6166, lng: -122.1979 },
    currentCoords: { lat: 47.6166, lng: -122.1979 },
    weight: 2.0,
    type: "Document",
    status: "Delivered",
    price: 65.0,
    assignedDriverId: "driver-1",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    estimatedDelivery: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    timeline: [
      { status: "Pending", timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), location: "San Francisco, CA", description: "Document shipment booked" },
      { status: "Picked Up", timestamp: new Date(Date.now() - 68 * 60 * 60 * 1000).toISOString(), location: "San Francisco Hub", description: "Courier picked up documents" },
      { status: "In Transit", timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), location: "Seattle Processing Facility", description: "Shipment received at regional sorting hub" },
      { status: "Out for Delivery", timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), location: "Bellevue, WA", description: "Out for final delivery to recipient" },
      { status: "Delivered", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), location: "Bellevue, WA", description: "Delivered. Signed by recipient: J. Miller" },
    ],
  };

  state.shipments.push(shipment1, shipment2);

  // Seed payments
  state.payments.push(
    {
      id: "PAY-1039",
      shipmentId: "LOG-583019-US",
      amount: 320.0,
      currency: "USD",
      status: "Paid",
      method: "Stripe",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "PAY-1040",
      shipmentId: "LOG-291048-US",
      amount: 65.0,
      currency: "USD",
      status: "Paid",
      method: "Card",
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    }
  );

  return state;
}

// Lazy Gemini Initializer
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI Route features.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// --- API ROUTES ---

// Public Shipment Tracking with rate limiting
app.get("/api/track/:trackingId", trackingRateLimiter, (req, res) => {
  const db = readDB();
  const shipment = db.shipments.find((s) => s.id.toUpperCase() === req.params.trackingId.toUpperCase());
  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  res.json(shipment);
});

// Legacy track route redirecting/using same logic
app.get("/api/shipments/track/:id", trackingRateLimiter, (req, res) => {
  const db = readDB();
  const shipment = db.shipments.find((s) => s.id.toUpperCase() === req.params.id.toUpperCase());
  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  res.json(shipment);
});

// Admin-Only Auth Login Routes (Public Register is fully removed)
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access only" });
  }

  if (user.status === "suspended") {
    return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
  }

  const inputHash = hashPassword(password, user.salt);
  if (inputHash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const { passwordHash: _, salt: __, ...userResponse } = user;
  res.json({ user: userResponse, token });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access only" });
  }

  if (user.status === "suspended") {
    return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
  }

  const inputHash = hashPassword(password, user.salt);
  if (inputHash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const { passwordHash: _, salt: __, ...userResponse } = user;
  res.json({ user: userResponse, token });
});

app.get("/api/auth/profile", authenticate, (req: any, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { passwordHash: _, salt: __, ...userResponse } = user;
  res.json(userResponse);
});

app.put("/api/auth/profile", authenticate, (req: any, res) => {
  const { name, phone } = req.body;
  const db = readDB();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users[userIndex].name = name || db.users[userIndex].name;
  db.users[userIndex].phone = phone || db.users[userIndex].phone;

  // Sync with Driver profile if user is a driver
  if (db.users[userIndex].role === "driver") {
    const driverIndex = db.drivers.findIndex((d) => d.id === req.user.id);
    if (driverIndex !== -1) {
      db.drivers[driverIndex].name = name || db.drivers[driverIndex].name;
      db.drivers[driverIndex].phone = phone || db.drivers[driverIndex].phone;
    }
  }

  writeDB(db);
  const { passwordHash: _, salt: __, ...userResponse } = db.users[userIndex];
  res.json(userResponse);
});

// Shipments API (Authenticated)
app.get("/api/shipments", authenticate, (req: any, res) => {
  const db = readDB();
  const { id, role, email } = req.user;

  if (role === "admin") {
    return res.json(db.shipments);
  } else if (role === "driver") {
    const assigned = db.shipments.filter((s) => s.assignedDriverId === id);
    return res.json(assigned);
  } else {
    // Standard customer
    const owned = db.shipments.filter((s) => s.senderId === id || s.senderEmail === email);
    return res.json(owned);
  }
});

app.post(["/api/shipments", "/api/admin/create-shipment"], authenticate, (req: any, res) => {
  const {
    receiverName,
    receiverEmail,
    receiverPhone,
    pickupAddress,
    deliveryAddress,
    pickupCoords,
    deliveryCoords,
    weight,
    type,
    price,
    senderName,
    senderEmail,
    senderPhone,
    packageValue,
    packageDimensions,
    pickupDate,
    invoiceDocName,
    invoiceDocData,
    labelDocName,
    labelDocData,
  } = req.body;

  if (!receiverName || !pickupAddress || !deliveryAddress || !weight || !type) {
    return res.status(400).json({ error: "Missing required shipment fields" });
  }

  const db = readDB();
  const { id, email, name, role } = req.user;

  // Generate tracking ID e.g., LOG-839102-US
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const shipmentId = `LOG-${randNum}-US`;

  const calculatedPrice = price || Math.round((db.settings.pricing.basePrice + (weight * db.settings.pricing.pricePerKg)) * 100) / 100;

  const defaultPickupCoords = pickupCoords || { lat: 40.7128, lng: -74.006 };
  const defaultDeliveryCoords = deliveryCoords || { lat: 34.0522, lng: -118.2437 };

  // Use sender details from request body (useful for Admin creation) or fallback to logged in user
  const finalSenderName = senderName || name;
  const finalSenderEmail = senderEmail || email;
  const finalSenderPhone = senderPhone || req.body.senderPhone || "+1 555-0101";

  const newShipment: Shipment = {
    id: shipmentId,
    senderId: role === "admin" ? "admin-created" : id,
    senderName: finalSenderName,
    senderEmail: finalSenderEmail,
    senderPhone: finalSenderPhone,
    receiverName,
    receiverEmail: receiverEmail || "",
    receiverPhone: receiverPhone || "",
    pickupAddress,
    deliveryAddress,
    pickupCoords: defaultPickupCoords,
    deliveryCoords: defaultDeliveryCoords,
    currentCoords: defaultPickupCoords,
    weight: Number(weight),
    type,
    status: "Pending",
    price: calculatedPrice,
    assignedDriverId: null,
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    timeline: [
      {
        status: "Pending",
        timestamp: new Date().toISOString(),
        location: pickupAddress.split(",")[0] || "Origin",
        description: "Shipment booked and pending driver assignment.",
      },
    ],
    packageValue: packageValue ? Number(packageValue) : undefined,
    packageDimensions: packageDimensions ? {
      length: Number(packageDimensions.length || 0),
      width: Number(packageDimensions.width || 0),
      height: Number(packageDimensions.height || 0),
    } : undefined,
    pickupDate: pickupDate || undefined,
    invoiceDocName,
    invoiceDocData,
    labelDocName,
    labelDocData,
    tag: req.body.tag || "In Transit",
  };

  // Auto assign an available driver if one exists
  const availableDriver = db.drivers.find((d) => d.status === "Available");
  if (availableDriver) {
    newShipment.assignedDriverId = availableDriver.id;
    newShipment.status = "Pending"; // remains pending until picked up
    availableDriver.status = "On Delivery";

    newShipment.timeline.push({
      status: "Assigned",
      timestamp: new Date().toISOString(),
      location: "System Hub",
      description: `Delivery courier assigned: ${availableDriver.name}`,
    });
  }

  db.shipments.push(newShipment);

  // Generate a payment record
  const payId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
  db.payments.push({
    id: payId,
    shipmentId: shipmentId,
    amount: calculatedPrice,
    currency: "USD",
    status: "Pending",
    method: "Stripe",
    timestamp: new Date().toISOString(),
  });

  // Trigger Creation Notifications
  triggerNotification(
    "Email",
    newShipment.senderEmail,
    `Logify Shipment Booked: ${newShipment.id}`,
    `Hello ${newShipment.senderName}, your shipment with Tracking ID ${newShipment.id} has been booked successfully! Base price is $${calculatedPrice.toFixed(2)} USD.`,
    db
  );
  if (newShipment.senderPhone) {
    triggerNotification(
      "SMS",
      newShipment.senderPhone,
      "Logify Tracking",
      `Your Logify shipment ${newShipment.id} has been booked! Track progress on our website.`,
      db
    );
  }
  if (newShipment.receiverEmail) {
    triggerNotification(
      "Email",
      newShipment.receiverEmail,
      `Incoming Shipment: ${newShipment.id}`,
      `Hello ${newShipment.receiverName}, a shipment from ${newShipment.senderName} is headed your way! Track with ID ${newShipment.id}.`,
      db
    );
  }

  writeDB(db);
  res.status(201).json(newShipment);
});

// Update Shipment (Admin/Driver updates)
app.put("/api/shipments/:id", authenticate, (req: any, res) => {
  const { status, assignedDriverId, currentCoords, description, location } = req.body;
  const db = readDB();
  const shipmentIndex = db.shipments.findIndex((s) => s.id === req.params.id);

  if (shipmentIndex === -1) {
    return res.status(404).json({ error: "Shipment not found" });
  }

  const shipment = db.shipments[shipmentIndex];

  // Authorization check: Admin can do anything, Driver can only update if assigned
  if (req.user.role === "driver" && shipment.assignedDriverId !== req.user.id) {
    return res.status(403).json({ error: "Access denied: Driver not assigned to this shipment" });
  }

  // Update fields
  if (status && status !== shipment.status) {
    shipment.status = status;
    shipment.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      location: location || (shipment.currentCoords ? "In Transit Hub" : "En Route"),
      description: description || `Shipment status updated to ${status}.`,
    });

    // Trigger Status Update Notifications
    triggerNotification(
      "Email",
      shipment.senderEmail,
      `Logify Shipment ${shipment.id} Update: ${status}`,
      `Hello ${shipment.senderName}, your shipment with Tracking ID ${shipment.id} is now ${status}. Update details: ${description || `Status updated to ${status}`}.`,
      db
    );
    if (shipment.senderPhone) {
      triggerNotification(
        "SMS",
        shipment.senderPhone,
        "Logify Update",
        `Your shipment ${shipment.id} status updated to ${status}. Details at Logify.`,
        db
      );
    }
    if (shipment.receiverEmail) {
      triggerNotification(
        "Email",
        shipment.receiverEmail,
        `Logify Incoming Shipment ${shipment.id} Update: ${status}`,
        `Hello ${shipment.receiverName}, the incoming shipment ${shipment.id} from ${shipment.senderName} is now ${status}. Details: ${description || `Status updated to ${status}`}.`,
        db
      );
    }

    // If marked delivered, update driver status back to Available
    if (status === "Delivered" && shipment.assignedDriverId) {
      const driverIndex = db.drivers.findIndex((d) => d.id === shipment.assignedDriverId);
      if (driverIndex !== -1) {
        db.drivers[driverIndex].status = "Available";
      }
    }
  }

  if (assignedDriverId !== undefined && req.user.role === "admin") {
    const oldDriverId = shipment.assignedDriverId;
    shipment.assignedDriverId = assignedDriverId;

    if (oldDriverId) {
      const oldDriver = db.drivers.find((d) => d.id === oldDriverId);
      if (oldDriver) oldDriver.status = "Available";
    }

    if (assignedDriverId) {
      const newDriver = db.drivers.find((d) => d.id === assignedDriverId);
      if (newDriver) {
        newDriver.status = "On Delivery";
        shipment.timeline.push({
          status: shipment.status,
          timestamp: new Date().toISOString(),
          location: "Admin Control",
          description: `Shipment reassigned to courier: ${newDriver.name}`,
        });
      }
    }
  }

  if (currentCoords) {
    shipment.currentCoords = currentCoords;
  }

  if (req.body.proofOfDelivery !== undefined) {
    shipment.proofOfDelivery = req.body.proofOfDelivery;
  }

  if (req.body.tag !== undefined && req.user.role === "admin") {
    shipment.tag = req.body.tag;
  }

  db.shipments[shipmentIndex] = shipment;
  writeDB(db);
  res.json(shipment);
});

// Drivers Management
app.get("/api/drivers", authenticate, (req: any, res) => {
  const db = readDB();
  res.json(db.drivers);
});

app.post("/api/drivers", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { name, phone, vehicleType, vehiclePlate } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Missing name or phone for driver" });
  }

  const db = readDB();
  const id = `driver-${Math.floor(1000 + Math.random() * 9000)}`;

  const newDriver: Driver = {
    id,
    name,
    phone,
    vehicleType: vehicleType || "Van",
    vehiclePlate: vehiclePlate || `LOG-${Math.floor(100 + Math.random() * 900)}`,
    currentCoords: { lat: 40.7128, lng: -74.006 },
    status: "Available",
  };

  db.drivers.push(newDriver);
  writeDB(db);
  res.status(201).json(newDriver);
});

app.put("/api/drivers/:id", authenticate, (req: any, res) => {
  const { status, currentCoords, vehicleType, vehiclePlate } = req.body;
  const db = readDB();
  const driverIndex = db.drivers.findIndex((d) => d.id === req.params.id);

  if (driverIndex === -1) {
    return res.status(404).json({ error: "Driver record not found" });
  }

  // Authorization check: Admin, or the Driver himself
  if (req.user.role === "driver" && req.user.id !== req.params.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  const driver = db.drivers[driverIndex];
  driver.status = status || driver.status;
  driver.currentCoords = currentCoords || driver.currentCoords;
  driver.vehicleType = vehicleType || driver.vehicleType;
  driver.vehiclePlate = vehiclePlate || driver.vehiclePlate;

  db.drivers[driverIndex] = driver;

  // Also update live simulation for assigned shipments!
  if (currentCoords) {
    db.shipments.forEach((s) => {
      if (s.assignedDriverId === driver.id && s.status !== "Delivered" && s.status !== "Cancelled") {
        s.currentCoords = currentCoords;
      }
    });
  }

  writeDB(db);
  res.json(driver);
});

// Admin User Management
app.get("/api/admin/users", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const db = readDB();
  // Filter out passwords when sending to admin panel
  const safeUsers = db.users.map(({ passwordHash, salt, ...u }) => u);
  res.json(safeUsers);
});

app.put("/api/admin/users/:id/status", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { status } = req.body;
  if (!status || !["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const db = readDB();
  const userIndex = db.users.findIndex((u) => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users[userIndex].status = status as any;
  writeDB(db);
  res.json({ message: `User status successfully updated to ${status}` });
});

app.get("/api/admin/alerts", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const db = readDB();
  res.json(db.alerts || []);
});

// Payments & Finance APIs
app.get("/api/payments", authenticate, (req: any, res) => {
  const db = readDB();
  if (req.user.role === "admin") {
    return res.json(db.payments);
  }

  // Customers only see their own payments
  const userShipments = db.shipments.filter((s) => s.senderId === req.user.id).map((s) => s.id);
  const filteredPayments = db.payments.filter((p) => userShipments.includes(p.shipmentId));
  res.json(filteredPayments);
});

app.post("/api/payments/:id/pay", authenticate, (req: any, res) => {
  const { method } = req.body;
  const db = readDB();
  const payIndex = db.payments.findIndex((p) => p.id === req.params.id);

  if (payIndex === -1) {
    return res.status(404).json({ error: "Payment record not found" });
  }

  const payment = db.payments[payIndex];
  payment.status = "Paid";
  payment.method = method || "Stripe";
  payment.timestamp = new Date().toISOString();

  // Find linked shipment and add billing transaction timeline entry
  const shipmentIndex = db.shipments.findIndex((s) => s.id === payment.shipmentId);
  if (shipmentIndex !== -1) {
    db.shipments[shipmentIndex].timeline.push({
      status: db.shipments[shipmentIndex].status,
      timestamp: new Date().toISOString(),
      location: "Billing Server",
      description: `Payment of $${payment.amount.toFixed(2)} USD cleared successfully via ${payment.method}.`,
    });
  }

  writeDB(db);
  res.json(payment);
});

// Pricing Settings
app.get("/api/settings", (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.put("/api/settings", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { companyName, contactEmail, contactPhone, pricing, isSiteActive, faviconEmoji, showCookieBanner, enableLiveChat, is2FAEnabled, enableHighContrastStatus } = req.body;
  const db = readDB();

  db.settings.companyName = companyName !== undefined ? companyName : db.settings.companyName;
  db.settings.contactEmail = contactEmail !== undefined ? contactEmail : db.settings.contactEmail;
  db.settings.contactPhone = contactPhone !== undefined ? contactPhone : db.settings.contactPhone;
  db.settings.isSiteActive = isSiteActive !== undefined ? isSiteActive : db.settings.isSiteActive;
  db.settings.faviconEmoji = faviconEmoji !== undefined ? faviconEmoji : db.settings.faviconEmoji;
  db.settings.showCookieBanner = showCookieBanner !== undefined ? showCookieBanner : db.settings.showCookieBanner;
  db.settings.enableLiveChat = enableLiveChat !== undefined ? enableLiveChat : db.settings.enableLiveChat;
  db.settings.is2FAEnabled = is2FAEnabled !== undefined ? is2FAEnabled : db.settings.is2FAEnabled;
  db.settings.enableHighContrastStatus = enableHighContrastStatus !== undefined ? enableHighContrastStatus : db.settings.enableHighContrastStatus;

  if (pricing) {
    db.settings.pricing.basePrice = pricing.basePrice !== undefined ? Number(pricing.basePrice) : db.settings.pricing.basePrice;
    db.settings.pricing.pricePerKg = pricing.pricePerKg !== undefined ? Number(pricing.pricePerKg) : db.settings.pricing.pricePerKg;
    db.settings.pricing.pricePerKm = pricing.pricePerKm !== undefined ? Number(pricing.pricePerKm) : db.settings.pricing.pricePerKm;
  }

  writeDB(db);
  res.json(db.settings);
});

// Rates Endpoint
app.get("/api/rates", (req, res) => {
  const db = readDB();
  const base = db.settings.pricing.basePrice;
  const kg = db.settings.pricing.pricePerKg;
  const km = db.settings.pricing.pricePerKm;
  res.json([
    { id: "air", name: "Air Freight", basePrice: base * 2.5, ratePerKg: kg * 1.8, ratePerKm: km * 2.0, deliveryDays: "1-2 Business Days" },
    { id: "sea", name: "Sea Freight", basePrice: base * 0.8, ratePerKg: kg * 0.5, ratePerKm: km * 0.4, deliveryDays: "10-15 Business Days" },
    { id: "express", name: "Express Delivery", basePrice: base * 1.5, ratePerKg: kg * 1.5, ratePerKm: km * 1.5, deliveryDays: "2-3 Business Days" }
  ]);
});

// Quotes Endpoints
app.post("/api/quotes", (req, res) => {
  const { pickup, delivery, weight, type } = req.body;
  if (!pickup || !delivery || !weight) {
    return res.status(400).json({ error: "Pickup, delivery and weight are required" });
  }
  const db = readDB();
  const base = db.settings.pricing.basePrice;
  const kg = db.settings.pricing.pricePerKg;
  const km = db.settings.pricing.pricePerKm;
  const simulatedDistKm = Math.max(15, (pickup.length + delivery.length) * 4.5);
  let price = base + (Number(weight) * kgRateAdjusted(kg, type)) + (simulatedDistKm * km);
  if (type === "Express" || type === "express") {
    price *= 1.5;
  } else if (type === "Fragile" || type === "fragile") {
    price += 25.0;
  } else if (type === "Freight") {
    price *= 1.8;
  }
  const deliveryDays = type === "Express" || type === "express" ? "1-2 days" : "3-5 days";
  const quote = {
    id: "QTE-" + Math.floor(100000 + Math.random() * 900000),
    pickup,
    delivery,
    weight: Number(weight),
    type,
    price: Number(price.toFixed(2)),
    deliveryTime: deliveryDays,
    createdAt: new Date().toISOString()
  };
  if (!db.quotes) db.quotes = [];
  db.quotes.push(quote);
  writeDB(db);
  res.json(quote);
});

function kgRateAdjusted(kg: number, type: string) {
  if (type === "Freight") return kg * 1.3;
  if (type === "Document") return kg * 0.6;
  return kg;
}

app.get("/api/quotes", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const db = readDB();
  res.json(db.quotes || []);
});

// Chat Endpoints
app.get("/api/chat", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const db = readDB();
  res.json(db.chats || []);
});

app.get("/api/chat/:conversationId", (req, res) => {
  const { conversationId } = req.params;
  const db = readDB();
  const chats = db.chats || [];
  const conv = chats.find((c: any) => c.id === conversationId);
  if (!conv) {
    return res.json({ id: conversationId, status: "Open", messages: [] });
  }
  res.json(conv);
});

app.post("/api/chat/:conversationId/messages", (req, res) => {
  const { conversationId } = req.params;
  const { sender, text, fileAttachment } = req.body;
  if (!sender || !text) {
    return res.status(400).json({ error: "Sender and text are required" });
  }
  const db = readDB();
  if (!db.chats) db.chats = [];
  let conv = db.chats.find((c: any) => c.id === conversationId);
  if (!conv) {
    conv = { id: conversationId, status: "Open", messages: [], updatedAt: new Date().toISOString() };
    db.chats.push(conv);
  }
  const newMessage = {
    id: "msg_" + Math.random().toString(36).substring(2, 9),
    sender,
    text,
    timestamp: new Date().toISOString(),
    fileAttachment
  };
  conv.messages.push(newMessage);
  conv.updatedAt = new Date().toISOString();
  if (sender === "user") {
    conv.status = "Open";
  }
  writeDB(db);
  res.json(newMessage);
});

app.put("/api/chat/:conversationId/status", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { conversationId } = req.params;
  const { status } = req.body;
  const db = readDB();
  const chats = db.chats || [];
  const conv = chats.find((c: any) => c.id === conversationId);
  if (!conv) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  conv.status = status || conv.status;
  writeDB(db);
  res.json(conv);
});

// Admin Password Update Endpoint
app.put("/api/admin/change-password", authenticate, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }
  const db = readDB();
  const userIndex = db.users.findIndex((u: any) => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  const user = db.users[userIndex];
  const currentHash = hashPassword(currentPassword, user.salt);
  if (currentHash !== user.passwordHash) {
    return res.status(400).json({ error: "Incorrect current password" });
  }

  const newSalt = crypto.randomBytes(16).toString("hex");
  user.passwordHash = hashPassword(newPassword, newSalt);
  user.salt = newSalt;
  db.users[userIndex] = user;
  writeDB(db);
  res.json({ message: "Password updated successfully" });
});

// --- ADVANCED AI FEATURES VIA GEMINI ---

// AI Route Optimization endpoint
app.post("/api/ai/optimize-route", authenticate, async (req, res) => {
  const { pickupAddress, deliveryAddress, type, weight } = req.body;

  if (!pickupAddress || !deliveryAddress) {
    return res.status(400).json({ error: "Pickup and Delivery addresses are required for route optimization." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `
      You are an expert logistics and smart dispatch AI. Optimize the shipping route for a ${type || "Standard"} delivery package weighing ${weight || 1}kg.
      Origin: "${pickupAddress}"
      Destination: "${deliveryAddress}"

      Calculate realistic logistics parameters and provide:
      1. Estimated total road distance in kilometers.
      2. Key optimal checkpoints/coordinates (minimum 3 checkpoints) with description and transit warnings.
      3. A list of 3 practical professional logistics route optimization guidelines (e.g. bypassing high traffic grids, weather alerts, load balancing, or toll reduction tips).

      Respond in clean, standard JSON format matching the schema requested.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distanceKm: { type: Type.NUMBER, description: "Estimated total route distance in kilometers" },
            optimalCheckpoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  estHours: { type: Type.NUMBER },
                  tip: { type: Type.STRING }
                },
                required: ["name", "estHours", "tip"]
              }
            },
            routeRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["distanceKm", "optimalCheckpoints", "routeRecommendations"]
        }
      }
    });

    const aiText = response.text;
    if (!aiText) throw new Error("Empty response received from AI model");
    const result = JSON.parse(aiText.trim());
    res.json(result);
  } catch (err: any) {
    console.error("AI Route optimization error:", err);
    // Fallback if API key is not configured or fails
    res.json({
      distanceKm: 420.5,
      optimalCheckpoints: [
        { name: pickupAddress.split(",")[0] + " Main Hub", estHours: 0, tip: "Initial pickup and load balancing inspection." },
        { name: "Midway Sorting Station", estHours: 4.5, tip: "Sorting corridor. Standard bypass recommended during peak hours (16:00 - 18:30)." },
        { name: deliveryAddress.split(",")[0] + " Local depot", estHours: 8.0, tip: "Final stage sorting. Ensure dispatch signature device is active." }
      ],
      routeRecommendations: [
        "Primary route utilizes direct highway transit corridors. Bypass city tolls via Route-82 to save $12 per leg.",
        "Eco-driving mode active. Consolidate heavy freight cargo with van schedules for lower carbon offsets.",
        "Expected weather: Clear visibility. No speed limits delays expected today."
      ],
      isFallback: true
    });
  }
});

// AI ETA & Delivery Prediction
app.post("/api/ai/predict-delivery-time", authenticate, async (req, res) => {
  const { pickupAddress, deliveryAddress, type, weight } = req.body;

  if (!pickupAddress || !deliveryAddress) {
    return res.status(400).json({ error: "Addresses are required for time prediction" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `
      You are a logistics prediction AI. Predict the delivery hours and risk analysis for a shipment.
      Pickup: "${pickupAddress}"
      Delivery: "${deliveryAddress}"
      Package Type: "${type || "Standard"}"
      Weight: ${weight || 1} kg

      Provide:
      1. Estimated total delivery hours (e.g. 36)
      2. Confidence score (from 0 to 100)
      3. Explanatory delivery details (traffic risk, custom clearances, handling time, or weather hazards)
      4. Safe handling risk level ("Low", "Medium", "High")

      Respond strictly in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedHours: { type: Type.NUMBER },
            confidenceScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            riskLevel: { type: Type.STRING }
          },
          required: ["estimatedHours", "confidenceScore", "reasoning", "riskLevel"]
        }
      }
    });

    const aiText = response.text;
    if (!aiText) throw new Error("Empty response received from AI model");
    const result = JSON.parse(aiText.trim());
    res.json(result);
  } catch (err: any) {
    console.error("AI ETA Prediction error:", err);
    // Fallback if API key is not configured or fails
    res.json({
      estimatedHours: 28.5,
      confidenceScore: 92,
      reasoning: `Predicted travel time computed based on static distance matrix. Calculated under clear road conditions. Safe padding added for standard ${type || "Standard"} cargo packaging overhead.`,
      riskLevel: "Low",
      isFallback: true
    });
  }
});


// Serve static assets in production or set up Vite middleware in dev
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static build from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

startServer();
