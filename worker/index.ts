interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  LOG_API_KEY?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
}

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
type JsonRecord = Record<string, any>;
const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
const levels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
const shipmentStatuses = ["Pending", "Picked Up", "In Transit", "Out for Delivery", "Delivered", "Cancelled"];
const defaultSettings = { companyName: "Logify Logistics Ltd.", contactEmail: "support@logify.com", contactPhone: "+1 (800) 555-LOGI", pricing: { basePrice: 15, pricePerKg: 3.5, pricePerKm: 0.8 }, isSiteActive: true, faviconEmoji: "📦", showCookieBanner: true, enableLiveChat: true, is2FAEnabled: false, enableHighContrastStatus: false, trackerShowMap: true, trackerShowThermalTag: true, trackerShowSmsAlerts: true, trackerShowEmailAlerts: true, trackerShowSimulation: true, trackerShowTelemetryDeck: true, trackerShowRouteVector: true, trackerShowShareButton: true, trackerShowEstimatedDelivery: true, trackerShowChronologyLog: true, trackerCustomBackgroundPreset: "red-yellow", trackerCustomNotes: "" };

function requireLogKey(req: Request, env: Env) { if (!env.LOG_API_KEY) return false; const auth = req.headers.get("authorization"); const key = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : req.headers.get("x-api-key")?.trim(); return Boolean(key) && key === env.LOG_API_KEY; }
function base64url(value: string | ArrayBuffer) { const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
async function jwtSign(payload: JsonRecord, secret: string) { const body = base64url(JSON.stringify(payload)); const encoded = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${body}`; const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded)); return `${encoded}.${base64url(signature)}`; }
async function jwtVerify(token: string, secret: string): Promise<JsonRecord | null> { try { const [header, body, signature] = token.split("."); if (!header || !body || !signature) return null; const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]); const raw = signature.replace(/-/g, "+").replace(/_/g, "/"); const sig = Uint8Array.from(atob(raw + "=".repeat((4 - raw.length % 4) % 4)), c => c.charCodeAt(0)); if (!await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(`${header}.${body}`))) return null; const rawBody = body.replace(/-/g, "+").replace(/_/g, "/"); return JSON.parse(atob(rawBody + "=".repeat((4 - rawBody.length % 4) % 4))); } catch { return null; } }
async function adminSession(req: Request, env: Env) { if (!env.JWT_SECRET || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return null; const auth = req.headers.get("authorization"); if (!auth?.startsWith("Bearer ")) return null; const payload = await jwtVerify(auth.slice(7).trim(), env.JWT_SECRET); if (!payload || payload.role !== "super_admin") return null; if (String(payload.email || "").trim().toLowerCase() !== env.ADMIN_EMAIL.trim().toLowerCase()) return null; if (payload.exp && Number(payload.exp) < Date.now() / 1000) return null; return payload; }
async function login(req: Request, env: Env) { if (!env.JWT_SECRET || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return json({ success: false, error: "Admin authentication is not configured." }, 503); let body: JsonRecord; try { body = await req.json(); } catch { return json({ success: false, error: "Invalid JSON body" }, 400); } const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""; const password = typeof body?.password === "string" ? body.password : ""; if (!email || !password) return json({ success: false, error: "Missing email or password" }, 400); if (email !== env.ADMIN_EMAIL.trim().toLowerCase() || password !== env.ADMIN_PASSWORD) return json({ success: false, error: "Invalid email or password" }, 401); const now = Math.floor(Date.now() / 1000); const user = { id: "super-admin-1", email, name: "Logify Super Admin", role: "super_admin", status: "active" }; const token = await jwtSign({ ...user, iat: now, exp: now + 7 * 86400 }, env.JWT_SECRET); return json({ success: true, user, token }); }

async function ensureCoreTables(env: Env) {
  const sql = [
    `CREATE TABLE IF NOT EXISTS shipments (id TEXT PRIMARY KEY,sender_name TEXT NOT NULL,sender_email TEXT NOT NULL,sender_phone TEXT NOT NULL,receiver_name TEXT NOT NULL,receiver_email TEXT,receiver_phone TEXT,pickup_address TEXT NOT NULL,delivery_address TEXT NOT NULL,weight REAL NOT NULL,type TEXT NOT NULL,package_value REAL DEFAULT 0,package_dimensions TEXT,pickup_date TEXT,delivery_type TEXT NOT NULL DEFAULT 'Standard',status TEXT NOT NULL DEFAULT 'Pending',price REAL NOT NULL DEFAULT 0,estimated_delivery TEXT,assigned_driver_id TEXT,location TEXT,tag TEXT,description TEXT,invoice_doc_name TEXT,invoice_doc_data TEXT,label_doc_name TEXT,label_doc_data TEXT,proof_of_delivery TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS logs (id TEXT PRIMARY KEY,level TEXT NOT NULL,message TEXT NOT NULL,source TEXT,metadata TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS drivers (id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT,vehicle_type TEXT,vehicle_plate TEXT,status TEXT NOT NULL DEFAULT 'Available',lat REAL,lng REAL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY,shipment_id TEXT NOT NULL,amount REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'USD',status TEXT NOT NULL DEFAULT 'Pending',method TEXT,timestamp TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS quotes (id TEXT PRIMARY KEY,pickup TEXT NOT NULL,delivery TEXT NOT NULL,weight REAL NOT NULL,type TEXT NOT NULL DEFAULT 'Standard',delivery_type TEXT NOT NULL DEFAULT 'Standard',distance_km REAL NOT NULL,price REAL NOT NULL,created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY,type TEXT NOT NULL,recipient TEXT,title TEXT NOT NULL,body TEXT NOT NULL,timestamp TEXT NOT NULL,read_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS chat_conversations (id TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'Open',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY,conversation_id TEXT NOT NULL,sender TEXT NOT NULL,text TEXT NOT NULL,file_attachment TEXT,created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS shipment_subscribers (id INTEGER PRIMARY KEY AUTOINCREMENT,shipment_id TEXT NOT NULL,email TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(shipment_id,email))`
  ];
  for (const statement of sql) await env.DB.prepare(statement).run();
}
function parseJson(value: unknown) { if (value == null || value === "") return null; try { return JSON.parse(String(value)); } catch { return null; } }
function distanceEstimate(pickup: string, delivery: string) { return Math.max(15, (pickup.length + delivery.length) * 4.5); }
function mapShipment(row: Record<string, unknown>) { return { id: String(row.id), senderName: String(row.sender_name), senderEmail: String(row.sender_email), senderPhone: String(row.sender_phone), receiverName: String(row.receiver_name), receiverEmail: row.receiver_email ?? null, receiverPhone: row.receiver_phone ?? null, pickupAddress: String(row.pickup_address), deliveryAddress: String(row.delivery_address), weight: Number(row.weight), type: String(row.type), packageValue: Number(row.package_value || 0), packageDimensions: parseJson(row.package_dimensions), pickupDate: row.pickup_date, deliveryType: String(row.delivery_type || "Standard"), status: String(row.status || "Pending"), price: Number(row.price || 0), estimatedDelivery: row.estimated_delivery, assignedDriverId: row.assigned_driver_id, location: row.location, tag: row.tag, description: row.description, invoiceDocName: row.invoice_doc_name, invoiceDocData: row.invoice_doc_data, labelDocName: row.label_doc_name, labelDocData: row.label_doc_data, proofOfDelivery: row.proof_of_delivery, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapPublicTracking(row: Record<string, unknown>) { return { id: String(row.id), status: String(row.status || "Pending"), location: row.location ?? null, tag: row.tag ?? null, type: String(row.type || "Standard"), deliveryType: String(row.delivery_type || "Standard"), estimatedDelivery: row.estimated_delivery ?? null, createdAt: row.created_at ?? null, updatedAt: row.updated_at ?? null }; }
async function getSettings(env: Env) { const row = await env.DB.prepare("SELECT data FROM settings WHERE id=1").first<{ data: string }>(); if (!row) { const now = new Date().toISOString(); await env.DB.prepare("INSERT OR IGNORE INTO settings(id,data,updated_at) VALUES(1,?,?)").bind(JSON.stringify(defaultSettings), now).run(); return { ...defaultSettings }; } const stored = parseJson(row.data); return { ...defaultSettings, ...(stored && typeof stored === "object" ? stored : {}) }; }

async function createShipment(req: Request, env: Env) {
  let x: JsonRecord; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  for (const key of ["senderName", "senderEmail", "senderPhone", "receiverName", "pickupAddress", "deliveryAddress"]) if (typeof x?.[key] !== "string" || !x[key].trim()) return json({ error: `${key} is required` }, 400);
  const weight = Number(x.weight); if (!Number.isFinite(weight) || weight <= 0) return json({ error: "Weight must be greater than zero" }, 400);
  const settings = await getSettings(env), deliveryType = x.deliveryType === "Express" ? "Express" : "Standard", type = String(x.type || "Standard"), packageValue = Number(x.packageValue || 0), distance = distanceEstimate(x.pickupAddress, x.deliveryAddress);
  let price = Number(settings.pricing.basePrice) + weight * Number(settings.pricing.pricePerKg) + distance * Number(settings.pricing.pricePerKm); if (deliveryType === "Express") price *= 1.5; if (type === "Fragile") price += 25;
  const now = new Date(), createdAt = now.toISOString(), estimated = new Date(now.getTime() + (deliveryType === "Express" ? 86400000 : 4 * 86400000)).toISOString(), id = `LOG-${crypto.randomUUID().slice(0, 8).toUpperCase()}-US`;
  await env.DB.prepare(`INSERT INTO shipments (id,sender_name,sender_email,sender_phone,receiver_name,receiver_email,receiver_phone,pickup_address,delivery_address,weight,type,package_value,package_dimensions,pickup_date,delivery_type,status,price,estimated_delivery,assigned_driver_id,location,tag,description,invoice_doc_name,invoice_doc_data,label_doc_name,label_doc_data,proof_of_delivery,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id, x.senderName.trim(), x.senderEmail.trim(), x.senderPhone.trim(), x.receiverName.trim(), x.receiverEmail ? String(x.receiverEmail).trim() : null, x.receiverPhone ? String(x.receiverPhone).trim() : null, x.pickupAddress.trim(), x.deliveryAddress.trim(), weight, type, Number.isFinite(packageValue) ? packageValue : 0, x.packageDimensions && typeof x.packageDimensions === "object" && !Array.isArray(x.packageDimensions) ? JSON.stringify(x.packageDimensions) : null, x.pickupDate || createdAt.slice(0, 10), deliveryType, "Pending", Number(price.toFixed(2)), estimated, null, null, null, x.description || null, x.invoiceDocName || null, x.invoiceDocData || null, x.labelDocName || null, x.labelDocData || null, null, createdAt, createdAt).run();
  const row = await env.DB.prepare("SELECT * FROM shipments WHERE id=?").bind(id).first<Record<string, unknown>>(); return json({ ...mapShipment(row!), trackingId: id }, 201);
}
async function tracking(req: Request, env: Env, id: string) { if (req.method !== "GET") return json({ error: "Method not allowed" }, 405); const row = await env.DB.prepare("SELECT * FROM shipments WHERE upper(id)=upper(?)").bind(id).first<Record<string, unknown>>(); return row ? json(mapPublicTracking(row)) : json({ error: "Shipment not found" }, 404); }

async function trackingSubscribe(req: Request, env: Env, id: string) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let x: JsonRecord; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const email = typeof x?.email === "string" ? x.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Valid email is required" }, 400);
  const shipment = await env.DB.prepare("SELECT id FROM shipments WHERE upper(id)=upper(?)").bind(id).first<{ id: string }>();
  if (!shipment) return json({ error: "Shipment not found" }, 404);
  const now = new Date().toISOString();
  try {
    await env.DB.prepare("INSERT INTO shipment_subscribers (shipment_id, email, created_at) VALUES (?, ?, ?)").bind(shipment.id, email, now).run();
  } catch (error) {
    const msg = String(error).toLowerCase();
    if (msg.includes("unique") || msg.includes("duplicate")) return json({ error: "Email already subscribed to this shipment" }, 409);
    throw error;
  }
  return json({ success: true, shipmentId: shipment.id, email, message: "Successfully subscribed to tracking updates", createdAt: now }, 201);
}

async function shipmentsRoute(req: Request, env: Env, id: string | null) {
  if (!await adminSession(req, env)) return json({ error: "Unauthorized" }, 401);
  if (req.method === "GET") { if (id) { const row = await env.DB.prepare("SELECT * FROM shipments WHERE id=?").bind(id).first<Record<string, unknown>>(); return row ? json(mapShipment(row)) : json({ error: "Shipment not found" }, 404); } const r = await env.DB.prepare("SELECT * FROM shipments ORDER BY created_at DESC").all(); return json((r.results || []).map(mapShipment)); }
  if (req.method === "POST" && !id) return createShipment(req, env);
  if (req.method === "PUT" && id) { const old = await env.DB.prepare("SELECT * FROM shipments WHERE id=?").bind(id).first<Record<string, unknown>>(); if (!old) return json({ error: "Shipment not found" }, 404); let x: JsonRecord; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); } const status = x.status === undefined ? String(old.status) : String(x.status); if (!shipmentStatuses.includes(status)) return json({ error: "Invalid shipment status" }, 400); await env.DB.prepare("UPDATE shipments SET status=?, assigned_driver_id=?, location=?, description=?, tag=?, updated_at=? WHERE id=?").bind(status, x.assignedDriverId === undefined ? old.assigned_driver_id : x.assignedDriverId || null, x.location === undefined ? old.location : x.location || null, x.description === undefined ? old.description : x.description || null, x.tag === undefined ? old.tag : x.tag || null, new Date().toISOString(), id).run(); const row = await env.DB.prepare("SELECT * FROM shipments WHERE id=?").bind(id).first<Record<string, unknown>>(); return json(mapShipment(row!)); }
  if (req.method === "DELETE" && id) { const r = await env.DB.prepare("DELETE FROM shipments WHERE id=?").bind(id).run(); return r.meta.changes ? json({ success: true, deleted: id }) : json({ error: "Shipment not found" }, 404); }
  return json({ error: "Method not allowed" }, 405);
}

async function settingsRoute(req: Request, env: Env) { if (req.method === "GET") return json(await getSettings(env)); if (req.method !== "PUT") return json({ error: "Method not allowed" }, 405); if (!await adminSession(req, env)) return json({ error: "Unauthorized" }, 401); let body: JsonRecord; try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); } const current = await getSettings(env), next = { ...current, ...body, pricing: { ...current.pricing, ...(body.pricing || {}) } }, now = new Date().toISOString(); await env.DB.prepare("INSERT INTO settings(id,data,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").bind(JSON.stringify(next), now).run(); return json(next); }
async function ratesRoute(req: Request, env: Env) { if (req.method !== "GET") return json({ error: "Method not allowed" }, 405); const p = (await getSettings(env)).pricing; return json([{ id: "standard", name: "Standard Delivery", basePrice: Number(p.basePrice), ratePerKg: Number(p.pricePerKg), ratePerKm: Number(p.pricePerKm), deliveryDays: "4-6 Business Days" }, { id: "express", name: "Express Delivery", basePrice: Number(p.basePrice) * 1.5, ratePerKg: Number(p.pricePerKg) * 1.5, ratePerKm: Number(p.pricePerKm) * 1.5, deliveryDays: "2-3 Business Days" }]); }
async function quotesRoute(req: Request, env: Env) { if (req.method !== "POST") return json({ error: "Method not allowed" }, 405); let x: JsonRecord; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); } const pickup = String(x.pickup || "").trim(), delivery = String(x.delivery || "").trim(), weight = Number(x.weight), type = String(x.type || "Standard"), deliveryType = x.deliveryType === "Express" ? "Express" : "Standard"; if (!pickup || !delivery || !Number.isFinite(weight) || weight <= 0) return json({ error: "Pickup, delivery and weight are required" }, 400); const p = (await getSettings(env)).pricing, distance = distanceEstimate(pickup, delivery); let price = Number(p.basePrice) + weight * Number(p.pricePerKg) + distance * Number(p.pricePerKm); if (deliveryType === "Express") price *= 1.5; if (type === "Fragile") price += 25; const id = `QUO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, createdAt = new Date().toISOString(); await env.DB.prepare("INSERT INTO quotes(id,pickup,delivery,weight,type,delivery_type,distance_km,price,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(id, pickup, delivery, weight, type, deliveryType, distance, Number(price.toFixed(2)), createdAt).run(); return json({ id, pickup, delivery, weight, type, deliveryType, distanceKm: distance, price: Number(price.toFixed(2)), currency: "USD", createdAt }, 201); }

function mapDriver(row: Record<string, unknown>) { return { id: String(row.id), name: String(row.name), phone: row.phone ?? null, vehicleType: row.vehicle_type ?? null, vehiclePlate: row.vehicle_plate ?? null, status: String(row.status), currentCoords: row.lat == null ? null : { lat: Number(row.lat), lng: Number(row.lng) }, createdAt: row.created_at, updatedAt: row.updated_at }; }
async function driversRoute(req: Request, env: Env, id: string | null) { if (!await adminSession(req, env)) return json({ error: "Unauthorized" }, 401); if (req.method === "GET") { if (id) { const r = await env.DB.prepare("SELECT * FROM drivers WHERE id=?").bind(id).first<Record<string, unknown>>(); return r ? json(mapDriver(r)) : json({ error: "Driver not found" }, 404); } const r = await env.DB.prepare("SELECT * FROM drivers ORDER BY created_at DESC").all(); return json((r.results || []).map(mapDriver)); } if (req.method === "POST" && !id) { let x: JsonRecord; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); } if (!String(x.name || "").trim()) return json({ error: "Name is required" }, 400); const now = new Date().toISOString(), driverId = String(x.id || `DRIVER-${crypto.randomUUID().slice(0, 8).toUpperCase()}`); await env.DB.prepare("INSERT INTO drivers(id,name,phone,vehicle_type,vehicle_plate,status,lat,lng,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)").bind(driverId, String(x.name).trim(), x.phone || null, x.vehicleType || null, x.vehiclePlate || null, x.status || "Available", x.currentCoords?.lat ?? null, x.currentCoords?.lng ?? null, now, now).run(); const r = await env.DB.prepare("SELECT * FROM drivers WHERE id=?").bind(driverId).first<Record<string, unknown>>(); return json(mapDriver(r!), 201); } if (req.method === "PUT" && id) { const old = await env.DB.prepare("SELECT * FROM drivers WHERE id=?").bind(id).first<Record<string, unknown>>(); if (!old) return json({ error: "Driver not found" }, 404); let x: JsonRecord; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); } await env.DB.prepare("UPDATE drivers SET name=?,phone=?,vehicle_type=?,vehicle_plate=?,status=?,lat=?,lng=?,updated_at=? WHERE id=?").bind(x.name ?? old.name, x.phone ?? old.phone, x.vehicleType ?? old.vehicle_type, x.vehiclePlate ?? old.vehicle_plate, x.status ?? old.status, x.currentCoords?.lat ?? old.lat, x.currentCoords?.lng ?? old.lng, new Date().toISOString(), id).run(); const r = await env.DB.prepare("SELECT * FROM drivers WHERE id=?").bind(id).first<Record<string, unknown>>(); return json(mapDriver(r!)); } if (req.method === "DELETE" && id) { const r = await env.DB.prepare("DELETE FROM drivers WHERE id=?").bind(id).run(); return r.meta.changes ? json({ success: true, deleted: id }) : json({ error: "Driver not found" }, 404); } return json({ error: "Method not allowed" }, 405); }

async function paymentsRoute(req: Request, env: Env, id: string | null) { if (!await adminSession(req, env)) return json({ error: "Unauthorized" }, 401); const path = new URL(req.url).pathname; if (req.method === "GET") { if (id) { const r = await env.DB.prepare("SELECT * FROM payments WHERE id=?").bind(id).first<Record<string, unknown>>(); return r ? json(r) : json({ error: "Payment not found" }, 404); } const r = await env.DB.prepare("SELECT * FROM payments ORDER BY timestamp DESC").all(); return json(r.results || []); } if (req.method === "POST" && !id) { let x: JsonRecord; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); } if (!x.shipmentId || !Number.isFinite(x.amount) || x.amount <= 0) return json({ error: "shipmentId and amount are required" }, 400); const id = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, now = new Date().toISOString(); await env.DB.prepare("INSERT INTO payments(id,shipment_id,amount,currency,status,method,timestamp,updated_at) VALUES(?,?,?,?,?,?,?,?)").bind(id, x.shipmentId, Number(x.amount), x.currency || "USD", x.status || "Pending", x.method || null, now, now).run(); const r = await env.DB.prepare("SELECT * FROM payments WHERE id=?").bind(id).first<Record<string, unknown>>(); return json(r, 201); } return json({ error: "Method not allowed" }, 405); }
async function alertsRoute(req: Request, env: Env) { if (!await adminSession(req, env)) return json({ error: "Unauthorized" }, 401); if (req.method !== "GET") return json({ error: "Method not allowed" }, 405); const r = await env.DB.prepare("SELECT * FROM alerts ORDER BY timestamp DESC").all(); return json(r.results || []); }

async function chatRoute(req: Request, env: Env, conversationId: string | null) {
  if (req.method === "POST" && !conversationId) {
    if (!env.JWT_SECRET) return json({ error: "Chat is not configured" }, 503);
    const now = new Date().toISOString(), id = `CHAT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, accessToken = await jwtSign({ type: "chat", conversationId: id, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 86400 }, env.JWT_SECRET);
    await env.DB.prepare("INSERT INTO chat_conversations(id,status,created_at,updated_at) VALUES(?,?,?,?)").bind(id, "Open", now, now).run();
    return json({ id, status: "Open", messages: [], accessToken }, 201);
  }
  if (!conversationId) return json({ error: "Conversation ID is required" }, 400);
  const accessToken = req.headers.get("x-chat-token")?.trim();
  const chatPayload = env.JWT_SECRET && accessToken ? await jwtVerify(accessToken, env.JWT_SECRET) : null;
  const ownsChat = Boolean(chatPayload && chatPayload.type === "chat" && String(chatPayload.conversationId) === conversationId && (!chatPayload.exp || Number(chatPayload.exp) >= Date.now() / 1000));
  const adminPayload = await adminSession(req, env);
  if (!ownsChat && !adminPayload) return json({ error: "Unauthorized" }, 401);
  if (req.method === "GET") {
    const conv = await env.DB.prepare("SELECT id,status,created_at AS createdAt,updated_at AS updatedAt FROM chat_conversations WHERE id=?").bind(conversationId).first<Record<string, unknown>>();
    if (!conv) return json({ error: "Conversation not found" }, 404);
    const m = await env.DB.prepare("SELECT id,conversation_id AS conversationId,sender,text,file_attachment AS fileAttachment,created_at AS createdAt FROM chat_messages WHERE conversation_id=? ORDER BY created_at ASC").bind(conversationId).all();
    return json({ ...conv, messages: m.results || [] });
  }
  if (req.method === "POST") {
    let x: JsonRecord; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
    if (!String(x.text || "").trim()) return json({ error: "Text is required" }, 400);
    const sender = adminPayload ? "admin" : "user";
    const now = new Date().toISOString(), id = `MSG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await env.DB.prepare("INSERT INTO chat_messages(id,conversation_id,sender,text,file_attachment,created_at) VALUES(?,?,?,?,?,?)").bind(id, conversationId, sender, String(x.text).trim(), x.fileAttachment || null, now).run();
    const row = await env.DB.prepare("SELECT id,conversation_id AS conversationId,sender,text,file_attachment AS fileAttachment,created_at AS createdAt FROM chat_messages WHERE id=?").bind(id).first<Record<string, unknown>>();
    return json({ ...row }, 201);
  }
  return json({ error: "Method not allowed" }, 405);
}

function mapLog(row: Record<string, unknown>) { return { ...row, id: String(row.id), level: String(row.level), source: row.source == null ? null : String(row.source), metadata: parseJson(row.metadata) }; }
async function logs(req: Request, env: Env, id: string | null) { if (!env.LOG_API_KEY || !requireLogKey(req, env)) return json({ success: false, error: "Unauthorized" }, 401); if (req.method === "GET") { if (id) { const r = await env.DB.prepare("SELECT * FROM logs WHERE id=?").bind(id).first<Record<string, unknown>>(); return r ? json(mapLog(r)) : json({ error: "Log not found" }, 404); } const r = await env.DB.prepare("SELECT * FROM logs ORDER BY created_at DESC LIMIT 100").all(); return json((r.results || []).map(mapLog)); } return json({ error: "Method not allowed" }, 405); }

async function handle(req: Request, env: Env) {
  const url = new URL(req.url), parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "api") return env.ASSETS.fetch(req);
  await ensureCoreTables(env);
  if (parts.length === 1) return json({ error: "API route not found" }, 404);
  if (parts[1] === "auth" && parts[2] === "login" && req.method === "POST") return login(req, env);
  if (parts[1] === "auth" && parts[2] === "verify-session") return json({ success: await adminSession(req, env) ? true : false }, (await adminSession(req, env)) ? 200 : 401);
  if (parts[1] === "track" && parts[2]) {
    if (parts.length === 3 && req.method === "GET") return tracking(req, env, parts[2]);
    if (parts.length === 4 && parts[3] === "subscribe" && req.method === "POST") return trackingSubscribe(req, env, parts[2]);
    return json({ error: "API route not found" }, 404);
  }
  if (parts[1] === "shipments") return shipmentsRoute(req, env, parts[2] || null);
  if (parts[1] === "settings") return settingsRoute(req, env);
  if (parts[1] === "rates") return ratesRoute(req, env);
  if (parts[1] === "quotes") return quotesRoute(req, env);
  if (parts[1] === "drivers") return driversRoute(req, env, parts[2] || null);
  if (parts[1] === "payments") return paymentsRoute(req, env, parts[2] || null);
  if (parts[1] === "alerts") return alertsRoute(req, env);
  if (parts[1] === "chat") return chatRoute(req, env, parts[2] || null);
  if (parts[1] === "logs") return logs(req, env, parts[2] || null);
  return json({ error: "API route not found" }, 404);
}
export default { async fetch(req: Request, env: Env) { try { return await handle(req, env); } catch (error) { console.error(error); return json({ success: false, error: "Internal server error" }, 500); } } };
