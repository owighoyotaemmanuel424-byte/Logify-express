interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  LOG_API_KEY?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
}

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
const levels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];

function requireLogKey(req: Request, env: Env) {
  if (!env.LOG_API_KEY) return false;
  const auth = req.headers.get("authorization");
  const key = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : req.headers.get("x-api-key")?.trim();
  return Boolean(key) && key === env.LOG_API_KEY;
}

function base64url(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function jwtSign(payload: Record<string, unknown>, secret: string) {
  const body = base64url(JSON.stringify(payload));
  const encoded = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${body}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return `${encoded}.${base64url(signature)}`;
}

async function jwtVerify(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const raw = signature.replace(/-/g, "+").replace(/_/g, "/");
    const sig = Uint8Array.from(atob(raw + "=".repeat((4 - raw.length % 4) % 4)), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(`${header}.${body}`));
    if (!valid) return null;
    const rawBody = body.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(rawBody + "=".repeat((4 - rawBody.length % 4) % 4)));
  } catch { return null; }
}

async function adminSession(req: Request, env: Env) {
  if (!env.JWT_SECRET || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return null;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = await jwtVerify(auth.slice(7).trim(), env.JWT_SECRET);
  if (!payload || payload.role !== "super_admin") return null;
  if (payload.exp && Number(payload.exp) < Date.now() / 1000) return null;
  return payload;
}

async function login(req: Request, env: Env) {
  if (!env.JWT_SECRET || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return json({ success: false, error: "Admin authentication is not configured." }, 503);
  let body: any;
  try { body = await req.json(); } catch { return json({ success: false, error: "Invalid JSON body" }, 400); }
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return json({ success: false, error: "Missing email or password" }, 400);
  if (email !== env.ADMIN_EMAIL.trim().toLowerCase() || password !== env.ADMIN_PASSWORD) return json({ success: false, error: "Invalid email or password" }, 401);
  const now = Math.floor(Date.now() / 1000);
  const user = { id: "super-admin-1", email, name: "Logify Super Admin", role: "super_admin", status: "active" };
  const token = await jwtSign({ ...user, iat: now, exp: now + 7 * 86400 }, env.JWT_SECRET);
  return json({ success: true, user, token });
}

async function ensureShipments(env: Env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS shipments (id TEXT PRIMARY KEY,sender_name TEXT NOT NULL,sender_email TEXT NOT NULL,sender_phone TEXT NOT NULL,receiver_name TEXT NOT NULL,receiver_email TEXT,receiver_phone TEXT,pickup_address TEXT NOT NULL,delivery_address TEXT NOT NULL,weight REAL NOT NULL,type TEXT NOT NULL,package_value REAL DEFAULT 0,package_dimensions TEXT,pickup_date TEXT,delivery_type TEXT NOT NULL DEFAULT 'Standard',status TEXT NOT NULL DEFAULT 'Pending',price REAL NOT NULL DEFAULT 0,estimated_delivery TEXT,assigned_driver_id TEXT,location TEXT,tag TEXT,description TEXT,invoice_doc_name TEXT,invoice_doc_data TEXT,label_doc_name TEXT,label_doc_data TEXT,proof_of_delivery TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`).run();
}

function mapShipment(row: Record<string, unknown>) {
  let dimensions = null;
  if (row.package_dimensions) try { dimensions = JSON.parse(String(row.package_dimensions)); } catch {}
  return {
    id: String(row.id), senderName: String(row.sender_name), senderEmail: String(row.sender_email), senderPhone: String(row.sender_phone),
    receiverName: String(row.receiver_name), receiverEmail: row.receiver_email ?? null, receiverPhone: row.receiver_phone ?? null,
    pickupAddress: String(row.pickup_address), deliveryAddress: String(row.delivery_address), weight: Number(row.weight), type: String(row.type),
    packageValue: Number(row.package_value || 0), packageDimensions: dimensions, pickupDate: row.pickup_date,
    deliveryType: String(row.delivery_type || "Standard"), status: String(row.status || "Pending"), price: Number(row.price || 0),
    estimatedDelivery: row.estimated_delivery, assignedDriverId: row.assigned_driver_id, location: row.location, tag: row.tag,
    description: row.description, invoiceDocName: row.invoice_doc_name, invoiceDocData: row.invoice_doc_data,
    labelDocName: row.label_doc_name, labelDocData: row.label_doc_data, proofOfDelivery: row.proof_of_delivery,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

async function shipments(req: Request, env: Env, id: string | null) {
  if (!await adminSession(req, env)) return json({ error: "Unauthorized" }, 401);
  await ensureShipments(env);
  if (req.method === "GET") {
    if (id) {
      const row = await env.DB.prepare("SELECT * FROM shipments WHERE id=?").bind(id).first<Record<string, unknown>>();
      return row ? json(mapShipment(row)) : json({ error: "Shipment not found" }, 404);
    }
    const result = await env.DB.prepare("SELECT * FROM shipments ORDER BY created_at DESC").all();
    return json((result.results || []).map(mapShipment));
  }
  if (req.method === "POST" && !id) {
    let x: any; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
    for (const key of ["senderName", "senderEmail", "senderPhone", "receiverName", "pickupAddress", "deliveryAddress"]) if (typeof x?.[key] !== "string" || !x[key].trim()) return json({ error: `${key} is required` }, 400);
    const weight = Number(x.weight); if (!Number.isFinite(weight) || weight <= 0) return json({ error: "Weight must be greater than zero" }, 400);
    const deliveryType = x.deliveryType === "Express" ? "Express" : "Standard";
    const type = String(x.type || "Standard");
    const packageValue = Number(x.packageValue || 0);
    const dimensions = x.packageDimensions && typeof x.packageDimensions === "object" && !Array.isArray(x.packageDimensions) ? JSON.stringify(x.packageDimensions) : null;
    const distance = Math.max(15, (x.pickupAddress.length + x.deliveryAddress.length) * 4.5);
    let price = 15 + weight * 3.5 + distance * 0.8;
    if (deliveryType === "Express") price *= 1.5;
    if (type === "Fragile") price += 25;
    const now = new Date(); const createdAt = now.toISOString(); const estimated = new Date(now.getTime() + (deliveryType === "Express" ? 86400000 : 4 * 86400000)).toISOString();
    const newId = `LOG-${crypto.randomUUID().slice(0, 8).toUpperCase()}-US`;
    await env.DB.prepare(`INSERT INTO shipments (id,sender_name,sender_email,sender_phone,receiver_name,receiver_email,receiver_phone,pickup_address,delivery_address,weight,type,package_value,package_dimensions,pickup_date,delivery_type,status,price,estimated_delivery,assigned_driver_id,location,tag,description,invoice_doc_name,invoice_doc_data,label_doc_name,label_doc_data,proof_of_delivery,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,x.senderName.trim(),x.senderEmail.trim(),x.senderPhone.trim(),x.receiverName.trim(),x.receiverEmail ? String(x.receiverEmail).trim() : null,x.receiverPhone ? String(x.receiverPhone).trim() : null,x.pickupAddress.trim(),x.deliveryAddress.trim(),weight,type,Number.isFinite(packageValue) ? packageValue : 0,dimensions,x.pickupDate || createdAt.slice(0,10),deliveryType,"Pending",Number(price.toFixed(2)),estimated,null,null,null,x.description || null,x.invoiceDocName || null,x.invoiceDocData || null,x.labelDocName || null,x.labelDocData || null,null,createdAt,createdAt).run();
    const row = await env.DB.prepare("SELECT * FROM shipments WHERE id=?").bind(newId).first<Record<string, unknown>>();
    return json(mapShipment(row!), 201);
  }
  if (req.method === "PUT" && id) {
    const old = await env.DB.prepare("SELECT * FROM shipments WHERE id=?").bind(id).first<Record<string, unknown>>(); if (!old) return json({ error: "Shipment not found" }, 404);
    let x: any; try { x = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
    const status = x.status === undefined ? String(old.status) : String(x.status);
    if (!["Pending","Picked Up","In Transit","Out for Delivery","Delivered","Cancelled"].includes(status)) return json({ error: "Invalid shipment status" }, 400);
    await env.DB.prepare("UPDATE shipments SET status=?,assigned_driver_id=?,location=?,description=?,tag=?,updated_at=? WHERE id=?").bind(status,x.assignedDriverId === undefined ? old.assigned_driver_id : x.assignedDriverId || null,x.location === undefined ? old.location : x.location || null,x.description === undefined ? old.description : x.description || null,x.tag === undefined ? old.tag : x.tag || null,new Date().toISOString(),id).run();
    const row = await env.DB.prepare("SELECT * FROM shipments WHERE id=?").bind(id).first<Record<string, unknown>>(); return json(mapShipment(row!));
  }
  if (req.method === "DELETE" && id) { const result = await env.DB.prepare("DELETE FROM shipments WHERE id=?").bind(id).run(); return result.meta.changes ? json({ success: true, deleted: id }) : json({ error: "Shipment not found" }, 404); }
  return json({ error: "Method not allowed" }, 405);
}

function mapLog(row: Record<string, unknown>) { let metadata = null; if (row.metadata) try { metadata = JSON.parse(String(row.metadata)); } catch {} return { ...row, id: String(row.id), level: String(row.level), source: row.source == null ? null : String(row.source), metadata }; }

async function logs(req: Request, env: Env, id: string | null) {
  if (!env.LOG_API_KEY || !requireLogKey(req, env)) return json({ success: false, error: "Unauthorized" }, 401);
  if (req.method === "GET") {
    if (id) { const row = await env.DB.prepare("SELECT * FROM logs WHERE id=?").bind(id).first<Record<string, unknown>>(); return row ? json({ success: true, log: mapLog(row) }) : json({ success: false, error: "Log not found" }, 404); }
    const limit = Math.min(Math.max(Number(new URL(req.url).searchParams.get("limit") || 50), 1), 200);
    const result = await env.DB.prepare("SELECT * FROM logs ORDER BY created_at DESC LIMIT ?").bind(limit).all();
    return json({ success: true, logs: (result.results || []).map(mapLog), limit });
  }
  if (req.method === "POST" && !id) {
    let x: any; try { x = await req.json(); } catch { return json({ success: false, error: "Invalid JSON body" }, 400); }
    const message = typeof x?.message === "string" ? x.message.trim() : "";
    if (!levels.includes(x?.level) || !message || message.length > 10000) return json({ success: false, error: "Invalid level or message" }, 400);
    const now = new Date().toISOString(); const logId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO logs (id,level,message,source,metadata,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(logId,x.level,message,x.source == null ? null : String(x.source).trim(),x.metadata == null ? null : JSON.stringify(x.metadata),now,now).run();
    const row = await env.DB.prepare("SELECT * FROM logs WHERE id=?").bind(logId).first<Record<string, unknown>>(); return json({ success: true, log: mapLog(row!) }, 201);
  }
  if (req.method === "DELETE") { if (id) { const result = await env.DB.prepare("DELETE FROM logs WHERE id=?").bind(id).run(); return result.meta.changes ? json({ success: true, deleted: id }) : json({ success: false, error: "Log not found" }, 404); } await env.DB.prepare("DELETE FROM logs").run(); return json({ success: true }); }
  return json({ success: false, error: "Method not allowed" }, 405);
}

async function handle(req: Request, env: Env) {
  const url = new URL(req.url); const parts = url.pathname.split("/").filter(Boolean); const id = parts.length === 3 ? parts[2] : null;
  if (url.pathname === "/api/auth/login" && req.method === "POST") return login(req, env);
  if (url.pathname === "/api/auth/verify-session" && req.method === "GET") return adminSession(req, env) ? json({ valid: true }) : json({ valid: false }, 401);
  if (parts[0] === "api" && parts[1] === "shipments") return shipments(req, env, id);
  if (parts[0] === "api" && parts[1] === "logs") return logs(req, env, id);
  return env.ASSETS.fetch(req);
}

export default { async fetch(req: Request, env: Env) { try { return await handle(req, env); } catch (error) { console.error(error); return json({ success: false, error: "Internal server error" }, 500); } } };
