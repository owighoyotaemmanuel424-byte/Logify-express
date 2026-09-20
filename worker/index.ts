import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

interface Env {
  ASSETS: Fetcher;
  DATABASE_URL: string;
  JWT_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
}

type JsonObject = Record<string, unknown>;
const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const cors = (res: Response) => { const h = new Headers(res.headers); h.set("access-control-allow-origin", "*"); h.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS"); h.set("access-control-allow-headers", "Content-Type, Authorization, X-API-Key"); return new Response(res.body, { status: res.status, headers: h }); };

function b64(v: string | Uint8Array) { const bytes = typeof v === "string" ? new TextEncoder().encode(v) : v; let s = ""; for (const x of bytes) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function unb64(v: string) { const s = v.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - v.length % 4) % 4); return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
async function sign(payload: JsonObject, secret: string) { const head = b64(JSON.stringify({ alg: "HS256", typ: "JWT" })); const body = b64(JSON.stringify(payload)); const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${head}.${body}`)); return `${head}.${body}.${b64(new Uint8Array(sig))}`; }
async function verify(token: string, secret: string): Promise<JsonObject | null> { try { const [h, b, s] = token.split("."); if (!h || !b || !s) return null; const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]); if (!await crypto.subtle.verify("HMAC", key, unb64(s), new TextEncoder().encode(`${h}.${b}`))) return null; return JSON.parse(new TextDecoder().decode(unb64(b))); } catch { return null; } }
async function admin(req: Request, env: Env) { const h = req.headers.get("authorization"); if (!h?.startsWith("Bearer ")) return null; const p = await verify(h.slice(7), env.JWT_SECRET); if (!p || p.role !== "ADMIN" || Number(p.exp) < Date.now() / 1000) return null; return p; }
function db(env: Env) { return new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) }); }
function publicShipment(s: any) { return { id: s.id, status: title(s.status), location: s.location, tag: s.tag, type: title(s.type), deliveryType: s.deliveryType, estimatedDelivery: s.estimatedDelivery, createdAt: s.createdAt, updatedAt: s.updatedAt }; }
function title(v: string) { return String(v).toLowerCase().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function enumStatus(v: unknown) { const s = String(v ?? "PENDING").toUpperCase().replace(/ /g, "_"); return ["PENDING","PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"].includes(s) ? s : null; }

async function handleApi(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url); const path = url.pathname;
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "access-control-allow-headers": "Content-Type, Authorization, X-API-Key" } });
  if (path === "/api/health") return json({ ok: true, service: "logify-express", database: "prisma-postgresql", timestamp: new Date().toISOString() });
  const prisma = db(env);
  try {
    if (path === "/api/auth/login" && req.method === "POST") {
      const x = await req.json() as any; const email = String(x?.email ?? "").trim().toLowerCase(); const password = String(x?.password ?? "");
      if (email !== env.ADMIN_EMAIL.trim().toLowerCase() || password !== env.ADMIN_PASSWORD) return json({ success: false, error: "Invalid email or password" }, 401);
      const now = Math.floor(Date.now() / 1000); const token = await sign({ id: "admin", email, name: "Logify Administrator", role: "ADMIN", status: "ACTIVE", iat: now, exp: now + 7 * 86400 }, env.JWT_SECRET);
      return json({ success: true, token, user: { id: "admin", email, name: "Logify Administrator", role: "ADMIN", status: "ACTIVE" } });
    }
    const tracking = path.match(/^\/api\/track\/([^/]+)$/i);
    if (tracking && req.method === "GET") { const s = await prisma.shipment.findUnique({ where: { id: tracking[1] }, include: { timeline: { orderBy: { timestamp: "asc" } } } }); if (!s) return json({ error: "Shipment not found" }, 404); return json({ ...publicShipment(s), timeline: s.timeline.map((e: any) => ({ status: title(e.status), timestamp: e.timestamp, location: e.location, description: e.description })) }); }
    const sub = path.match(/^\/api\/track\/([^/]+)\/subscribe$/i);
    if (sub && req.method === "POST") { const x = await req.json() as any; const email = String(x?.email ?? "").trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Valid email is required" }, 400); const s = await prisma.shipment.findUnique({ where: { id: sub[1] }, select: { id: true } }); if (!s) return json({ error: "Shipment not found" }, 404); await prisma.shipmentSubscriber.upsert({ where: { shipmentId_email: { shipmentId: s.id, email } }, create: { shipmentId: s.id, email }, update: {} }); return json({ success: true, shipmentId: s.id, email }, 201); }
    if (path.startsWith("/api/admin/") || path === "/api/shipments" || path === "/api/drivers" || path === "/api/payments" || path === "/api/quotes" || path === "/api/settings" || path === "/api/users") {
      if (!await admin(req, env)) return json({ error: "Unauthorized" }, 401);
    }
    if (path === "/api/shipments" && req.method === "GET") { const list = await prisma.shipment.findMany({ orderBy: { createdAt: "desc" }, include: { timeline: { orderBy: { timestamp: "asc" } }, assignedDriver: true } }); return json(list); }
    if (path === "/api/shipments" && req.method === "POST") {
      const x = await req.json() as any; const required = ["senderName","senderEmail","senderPhone","receiverName","pickupAddress","deliveryAddress"]; for (const k of required) if (!String(x?.[k] ?? "").trim()) return json({ error: `${k} is required` }, 400);
      const weight = Number(x.weight); if (!Number.isFinite(weight) || weight <= 0) return json({ error: "Weight must be greater than zero" }, 400); const deliveryType = String(x.deliveryType ?? "Standard").toUpperCase() === "EXPRESS" ? "Express" : "Standard"; const type = String(x.type ?? "STANDARD").toUpperCase(); const distance = Math.max(15, (String(x.pickupAddress).length + String(x.deliveryAddress).length) * 4.5); let price = 15 + weight * 3.5 + distance * 0.8; if (deliveryType === "Express") price *= 1.5; if (type === "FRAGILE") price += 25; const id = `LOG-${crypto.randomUUID().slice(0, 8).toUpperCase()}-US`; const estimated = new Date(Date.now() + (deliveryType === "Express" ? 86400000 : 4 * 86400000));
      const s = await prisma.shipment.create({ data: { id, senderName: String(x.senderName).trim(), senderEmail: String(x.senderEmail).trim(), senderPhone: String(x.senderPhone).trim(), receiverName: String(x.receiverName).trim(), receiverEmail: x.receiverEmail ? String(x.receiverEmail).trim() : null, receiverPhone: x.receiverPhone ? String(x.receiverPhone).trim() : null, pickupAddress: String(x.pickupAddress).trim(), deliveryAddress: String(x.deliveryAddress).trim(), weight, type: ["FREIGHT","EXPRESS","STANDARD","DOCUMENT","FRAGILE"].includes(type) ? type as any : "STANDARD", packageValue: Number(x.packageValue) || 0, packageDimensions: x.packageDimensions && typeof x.packageDimensions === "object" ? x.packageDimensions : undefined, pickupDate: x.pickupDate ? new Date(x.pickupDate) : new Date(), deliveryType, price: Number(price.toFixed(2)), estimatedDelivery: estimated, description: x.description ? String(x.description) : null, tag: x.tag ? String(x.tag) : null, timeline: { create: { status: "PENDING", description: "Shipment created" } } } });
      await prisma.auditLog.create({ data: { actorId: "admin", action: "CREATE", entity: "Shipment", entityId: id } }); return json({ ...s, trackingId: id }, 201);
    }
    const one = path.match(/^\/api\/shipments\/([^/]+)$/);
    if (one && req.method === "GET") { const s = await prisma.shipment.findUnique({ where: { id: one[1] }, include: { timeline: { orderBy: { timestamp: "asc" } }, assignedDriver: true, payments: true } }); return s ? json(s) : json({ error: "Shipment not found" }, 404); }
    if (one && ["PUT","PATCH"].includes(req.method)) { const x = await req.json() as any; const existing = await prisma.shipment.findUnique({ where: { id: one[1] } }); if (!existing) return json({ error: "Shipment not found" }, 404); const status = x.status === undefined ? existing.status : enumStatus(x.status); if (!status) return json({ error: "Invalid shipment status" }, 400); const s = await prisma.shipment.update({ where: { id: one[1] }, data: { status: status as any, assignedDriverId: x.assignedDriverId === undefined ? existing.assignedDriverId : (x.assignedDriverId || null), location: x.location === undefined ? existing.location : String(x.location || ""), tag: x.tag === undefined ? existing.tag : String(x.tag || ""), description: x.description === undefined ? existing.description : String(x.description || ""), proofOfDelivery: x.proofOfDelivery === undefined ? existing.proofOfDelivery : String(x.proofOfDelivery || ""), timeline: { create: { status: status as any, location: x.location ? String(x.location) : null, description: x.timelineDescription ? String(x.timelineDescription) : `Shipment status changed to ${title(status)}` } } } }); await prisma.auditLog.create({ data: { actorId: "admin", action: "UPDATE", entity: "Shipment", entityId: one[1], metadata: x } }); return json(s); }
    if (path === "/api/drivers" && req.method === "GET") return json(await prisma.driver.findMany({ orderBy: { createdAt: "desc" } }));
    if (path === "/api/drivers" && req.method === "POST") { const x = await req.json() as any; const id = crypto.randomUUID(); const d = await prisma.driver.create({ data: { id, name: String(x.name ?? "").trim(), phone: x.phone ? String(x.phone) : null, vehicleType: x.vehicleType ? String(x.vehicleType) : null, vehiclePlate: x.vehiclePlate ? String(x.vehiclePlate) : null } }); return json(d, 201); }
    if (path === "/api/payments" && req.method === "GET") return json(await prisma.payment.findMany({ orderBy: { timestamp: "desc" }, include: { shipment: { select: { id: true, senderName: true } } } }));
    if (path === "/api/quotes" && req.method === "POST") { const x = await req.json() as any; const weight = Number(x.weight); const distanceKm = Math.max(15, Number(x.distanceKm) || (String(x.pickup ?? "").length + String(x.delivery ?? "").length) * 4.5); let price = 15 + weight * 3.5 + distanceKm * 0.8; if (String(x.deliveryType).toLowerCase() === "express") price *= 1.5; const q = await prisma.quote.create({ data: { id: crypto.randomUUID(), pickup: String(x.pickup ?? ""), delivery: String(x.delivery ?? ""), weight, type: String(x.type ?? "Standard"), deliveryType: String(x.deliveryType ?? "Standard"), distanceKm, price: Number(price.toFixed(2)) } }); return json(q, 201); }
    if (path === "/api/settings" && req.method === "GET") { const s = await prisma.setting.findUnique({ where: { id: 1 } }); return json(s?.data ?? {}); }
    if (path === "/api/settings" && ["PUT","PATCH","POST"].includes(req.method)) { const data = await req.json(); const s = await prisma.setting.upsert({ where: { id: 1 }, create: { id: 1, data }, update: { data } }); return json(s.data); }
    if (path === "/api/users" && req.method === "GET") return json(await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, status: true, phone: true, createdAt: true }, orderBy: { createdAt: "desc" } }));
    if (path === "/api/admin/audit" && req.method === "GET") return json(await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }));
    return json({ error: "Not found" }, 404);
  } finally { await prisma.$disconnect(); }
}

export default { async fetch(req: Request, env: Env): Promise<Response> { try { const url = new URL(req.url); const res = url.pathname.startsWith("/api/") ? await handleApi(req, env) : await env.ASSETS.fetch(req); return cors(res); } catch (e) { console.error(e); return cors(json({ error: "Internal server error" }, 500)); } } } satisfies ExportedHandler<Env>;
