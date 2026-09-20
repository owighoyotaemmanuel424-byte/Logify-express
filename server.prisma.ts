import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { PrismaClient, UserRole, UserStatus, ShipmentStatus, ShipmentType, DriverStatus, PaymentStatus, PaymentMethod, ChatStatus } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production");
}
const jwtSecret = JWT_SECRET || crypto.randomBytes(32).toString("hex");

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));

const asyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

function hashPassword(password: string, salt: string) {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function signToken(payload: { id: string; email: string; role: UserRole }) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 86400 })).toString("base64url");
  const signature = crypto.createHmac("sha256", jwtSecret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string) {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = crypto.createHmac("sha256", jwtSecret).update(`${header}.${body}`).digest("base64url");
    if (!safeEqual(signature, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as { id: string; email: string; role: UserRole };
  } catch {
    return null;
  }
}

type AuthedRequest = Request & { auth?: { id: string; email: string; role: UserRole } };

const authenticate = asyncRoute(async (req: AuthedRequest, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyToken(header.slice(7));
  if (!payload) return res.status(401).json({ error: "Invalid or expired session" });
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.status !== UserStatus.ACTIVE) return res.status(401).json({ error: "Account unavailable" });
  req.auth = { id: user.id, email: user.email, role: user.role };
  next();
});

function requireRoles(...roles: UserRole[]) {
  return asyncRoute(async (req: AuthedRequest, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  });
}

const adminOnly = [authenticate, requireRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)];
const staffOnly = [authenticate, requireRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DRIVER)];

async function audit(actorId: string | undefined, action: string, entity: string, entityId?: string, metadata?: unknown) {
  await prisma.auditLog.create({ data: { actorId, action, entity, entityId, metadata: metadata as any } }).catch(() => undefined);
}

function normalizeString(value: unknown, max = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function shipmentPublicView(shipment: any) {
  return {
    id: shipment.id,
    senderName: shipment.senderName,
    receiverName: shipment.receiverName,
    pickupAddress: shipment.pickupAddress,
    deliveryAddress: shipment.deliveryAddress,
    status: shipment.status,
    type: shipment.type,
    weight: shipment.weight,
    price: shipment.price,
    location: shipment.location,
    currentLat: shipment.currentLat,
    currentLng: shipment.currentLng,
    estimatedDelivery: shipment.estimatedDelivery,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    timeline: shipment.timeline,
  };
}

app.get("/api/health", asyncRoute(async (_req, res) => {
  let database = "ok";
  try { await prisma.$queryRaw`SELECT 1`; } catch { database = "error"; }
  res.status(database === "ok" ? 200 : 503).json({ status: database === "ok" ? "ok" : "degraded", database, service: "logify-express", timestamp: new Date().toISOString() });
}));

app.get("/api/settings", asyncRoute(async (_req, res) => {
  const row = await prisma.setting.findUnique({ where: { id: 1 } });
  res.json(row?.data ?? { companyName: "Logify Logistics", contactEmail: "support@logify.com", contactPhone: "", pricing: { basePrice: 15, pricePerKg: 3.5, pricePerKm: 0.8 }, isSiteActive: true, enableLiveChat: true });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = normalizeString(req.body?.email, 320).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== UserStatus.ACTIVE) return res.status(401).json({ error: "Invalid credentials" });
  const valid = safeEqual(hashPassword(password, user.salt), user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role)) return res.status(403).json({ error: "Administrative access required" });
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  await audit(user.id, "LOGIN", "User", user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role.toLowerCase(), status: user.status.toLowerCase() } });
}));

app.get("/api/auth/verify-session", authenticate, asyncRoute(async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.id }, select: { id: true, email: true, name: true, role: true, status: true, phone: true } });
  if (!user) return res.status(401).json({ valid: false });
  res.json({ valid: true, user: { ...user, role: user.role.toLowerCase(), status: user.status.toLowerCase() } });
}));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const email = normalizeString(req.body?.email, 320).toLowerCase();
  const name = normalizeString(req.body?.name, 120);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !name || password.length < 12) return res.status(400).json({ error: "Name, valid email and a password of at least 12 characters are required" });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Account already exists" });
  const salt = crypto.randomBytes(16).toString("hex");
  const user = await prisma.user.create({ data: { id: crypto.randomUUID(), email, name, passwordHash: hashPassword(password, salt), salt, role: UserRole.USER, status: UserStatus.ACTIVE } });
  await audit(user.id, "REGISTER", "User", user.id);
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role.toLowerCase() } });
}));

app.get("/api/shipments", ...adminOnly, asyncRoute(async (_req: AuthedRequest, res) => {
  const shipments = await prisma.shipment.findMany({ include: { timeline: { orderBy: { timestamp: "asc" } }, assignedDriver: true, payments: true }, orderBy: { createdAt: "desc" } });
  res.json(shipments);
}));

app.get("/api/shipments/:id", ...staffOnly, asyncRoute(async (req: AuthedRequest, res) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id }, include: { timeline: { orderBy: { timestamp: "asc" } }, assignedDriver: true, payments: true, subscribers: true } });
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });
  if (req.auth!.role === UserRole.DRIVER && shipment.assignedDriverId !== req.auth!.id) return res.status(403).json({ error: "Forbidden" });
  res.json(shipment);
}));

app.post("/api/shipments", ...staffOnly, asyncRoute(async (req: AuthedRequest, res) => {
  const b = req.body ?? {};
  const senderName = normalizeString(b.senderName, 120), senderEmail = normalizeString(b.senderEmail, 320).toLowerCase(), senderPhone = normalizeString(b.senderPhone, 40);
  const receiverName = normalizeString(b.receiverName, 120), pickupAddress = normalizeString(b.pickupAddress, 500), deliveryAddress = normalizeString(b.deliveryAddress, 500);
  const weight = Number(b.weight), price = Number(b.price ?? 0);
  if (!senderName || !senderEmail || !senderPhone || !receiverName || !pickupAddress || !deliveryAddress || !Number.isFinite(weight) || weight <= 0) return res.status(400).json({ error: "Required shipment fields are missing or invalid" });
  const type = Object.values(ShipmentType).includes(b.type) ? b.type : ShipmentType.STANDARD;
  const id = normalizeString(b.id, 80) || `LOG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const shipment = await prisma.shipment.create({ data: { id, senderId: req.auth!.role === UserRole.DRIVER ? undefined : (normalizeString(b.senderId, 100) || undefined), senderName, senderEmail, senderPhone, receiverName, receiverEmail: normalizeString(b.receiverEmail, 320).toLowerCase() || null, receiverPhone: normalizeString(b.receiverPhone, 40) || null, pickupAddress, deliveryAddress, pickupLat: Number.isFinite(Number(b.pickupLat)) ? Number(b.pickupLat) : null, pickupLng: Number.isFinite(Number(b.pickupLng)) ? Number(b.pickupLng) : null, deliveryLat: Number.isFinite(Number(b.deliveryLat)) ? Number(b.deliveryLat) : null, deliveryLng: Number.isFinite(Number(b.deliveryLng)) ? Number(b.deliveryLng) : null, weight, type, price: Number.isFinite(price) && price >= 0 ? price : 0, packageValue: Number.isFinite(Number(b.packageValue)) ? Number(b.packageValue) : 0, description: normalizeString(b.description, 2000) || null, deliveryType: normalizeString(b.deliveryType, 50) || "Standard", tag: normalizeString(b.tag, 100) || null, estimatedDelivery: b.estimatedDelivery ? new Date(b.estimatedDelivery) : null, timeline: { create: { status: ShipmentStatus.PENDING, description: "Shipment created", location: pickupAddress } } } });
  await audit(req.auth!.id, "CREATE", "Shipment", shipment.id);
  res.status(201).json(shipment);
}));

app.patch("/api/shipments/:id/status", ...staffOnly, asyncRoute(async (req: AuthedRequest, res) => {
  const status = req.body?.status;
  if (!Object.values(ShipmentStatus).includes(status)) return res.status(400).json({ error: "Invalid shipment status" });
  const existing = await prisma.shipment.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Shipment not found" });
  if (req.auth!.role === UserRole.DRIVER && existing.assignedDriverId !== req.auth!.id) return res.status(403).json({ error: "Forbidden" });
  const location = normalizeString(req.body?.location, 300) || existing.location;
  const description = normalizeString(req.body?.description, 500) || `Shipment status changed to ${status}`;
  const shipment = await prisma.$transaction(async tx => {
    const updated = await tx.shipment.update({ where: { id: existing.id }, data: { status, location, currentLat: Number.isFinite(Number(req.body?.lat)) ? Number(req.body.lat) : existing.currentLat, currentLng: Number.isFinite(Number(req.body?.lng)) ? Number(req.body.lng) : existing.currentLng } });
    await tx.timelineEvent.create({ data: { shipmentId: existing.id, status, location, description } });
    return updated;
  });
  await audit(req.auth!.id, "STATUS_UPDATE", "Shipment", shipment.id, { status });
  res.json(shipment);
}));

app.patch("/api/shipments/:id/assign-driver", ...adminOnly, asyncRoute(async (req: AuthedRequest, res) => {
  const driverId = normalizeString(req.body?.driverId, 100) || null;
  if (driverId) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return res.status(404).json({ error: "Driver not found" });
  }
  const shipment = await prisma.shipment.update({ where: { id: req.params.id }, data: { assignedDriverId: driverId } });
  await audit(req.auth!.id, "ASSIGN_DRIVER", "Shipment", shipment.id, { driverId });
  res.json(shipment);
}));

app.get("/api/track/:id", asyncRoute(async (req, res) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id }, include: { timeline: { orderBy: { timestamp: "asc" }, select: { status: true, timestamp: true, location: true, description: true } } } });
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });
  res.json(shipmentPublicView(shipment));
}));

app.post("/api/track/:id/subscribe", asyncRoute(async (req, res) => {
  const email = normalizeString(req.body?.email, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Valid email is required" });
  const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });
  await prisma.shipmentSubscriber.upsert({ where: { shipmentId_email: { shipmentId: shipment.id, email } }, update: {}, create: { shipmentId: shipment.id, email } });
  res.status(201).json({ subscribed: true });
}));

app.post("/api/quotes", asyncRoute(async (req, res) => {
  const pickup = normalizeString(req.body?.pickup, 500), delivery = normalizeString(req.body?.delivery, 500);
  const weight = Number(req.body?.weight), distanceKm = Number(req.body?.distanceKm ?? 0);
  if (!pickup || !delivery || !Number.isFinite(weight) || weight <= 0 || !Number.isFinite(distanceKm) || distanceKm < 0) return res.status(400).json({ error: "Invalid quote request" });
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const data: any = settings?.data ?? {};
  const pricing = data.pricing ?? { basePrice: 15, pricePerKg: 3.5, pricePerKm: 0.8 };
  const price = Math.max(0, Number(pricing.basePrice) + weight * Number(pricing.pricePerKg) + distanceKm * Number(pricing.pricePerKm));
  const quote = await prisma.quote.create({ data: { id: `Q-${Date.now().toString(36).toUpperCase()}`, pickup, delivery, weight, distanceKm, type: normalizeString(req.body?.type, 50) || "Standard", deliveryType: normalizeString(req.body?.deliveryType, 50) || "Standard", price } });
  res.json(quote);
}));

app.get("/api/drivers", ...adminOnly, asyncRoute(async (_req, res) => {
  res.json(await prisma.driver.findMany({ include: { user: { select: { email: true, status: true } } }, orderBy: { createdAt: "desc" } }));
}));

app.patch("/api/drivers/:id/location", ...staffOnly, asyncRoute(async (req: AuthedRequest, res) => {
  if (req.auth!.role === UserRole.DRIVER && req.params.id !== req.auth!.id) return res.status(403).json({ error: "Forbidden" });
  const lat = Number(req.body?.lat), lng = Number(req.body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ error: "Invalid coordinates" });
  res.json(await prisma.driver.update({ where: { id: req.params.id }, data: { lat, lng } }));
}));

app.get("/api/payments", ...adminOnly, asyncRoute(async (_req, res) => {
  res.json(await prisma.payment.findMany({ include: { shipment: { select: { id: true, receiverName: true } } }, orderBy: { timestamp: "desc" } }));
}));

app.post("/api/payments", ...adminOnly, asyncRoute(async (req: AuthedRequest, res) => {
  const shipmentId = normalizeString(req.body?.shipmentId, 100), amount = Number(req.body?.amount);
  if (!shipmentId || !Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: "Invalid payment" });
  const status = Object.values(PaymentStatus).includes(req.body?.status) ? req.body.status : PaymentStatus.PENDING;
  const method = Object.values(PaymentMethod).includes(req.body?.method) ? req.body.method : null;
  const payment = await prisma.payment.create({ data: { id: normalizeString(req.body?.id, 100) || `PAY-${Date.now()}`, shipmentId, amount, currency: normalizeString(req.body?.currency, 10) || "USD", status, method } });
  await audit(req.auth!.id, "CREATE", "Payment", payment.id, { shipmentId, amount });
  res.status(201).json(payment);
}));

app.get("/api/users", ...adminOnly, asyncRoute(async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, status: true, phone: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "desc" } });
  res.json(users);
}));

app.get("/api/audit-logs", ...adminOnly, asyncRoute(async (_req, res) => {
  res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }));
}));

app.patch("/api/settings", ...adminOnly, asyncRoute(async (req: AuthedRequest, res) => {
  const current = await prisma.setting.findUnique({ where: { id: 1 } });
  const next = { ...(current?.data as any ?? {}), ...(req.body ?? {}) };
  await prisma.setting.upsert({ where: { id: 1 }, update: { data: next }, create: { id: 1, data: next } });
  await audit(req.auth!.id, "UPDATE", "Setting", "1");
  res.json(next);
}));

app.get("/api/chats/:id", ...staffOnly, asyncRoute(async (req, res) => {
  const conversation = await prisma.chatConversation.findUnique({ where: { id: req.params.id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  res.json(conversation);
}));

app.post("/api/chats/:id/messages", ...authenticate, asyncRoute(async (req: AuthedRequest, res) => {
  const text = normalizeString(req.body?.text, 4000);
  if (!text) return res.status(400).json({ error: "Message text is required" });
  const conversation = await prisma.chatConversation.upsert({ where: { id: req.params.id }, update: {}, create: { id: req.params.id, status: ChatStatus.OPEN } });
  const message = await prisma.chatMessage.create({ data: { id: crypto.randomUUID(), conversationId: conversation.id, sender: req.auth!.email, text } });
  res.status(201).json(message);
}));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (err?.code === "P2025") return res.status(404).json({ error: "Resource not found" });
  if (err?.code === "P2002") return res.status(409).json({ error: "Resource already exists" });
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");
    if (fs.existsSync(dist)) app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }
  const server = app.listen(PORT, () => console.log(`Logify server listening on :${PORT}`));
  const shutdown = async () => { server.close(); await prisma.$disconnect(); process.exit(0); };
  process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
}

start().catch(async error => { console.error(error); await prisma.$disconnect(); process.exit(1); });
