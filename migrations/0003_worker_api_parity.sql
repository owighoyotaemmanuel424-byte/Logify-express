CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT,
  vehicle_plate TEXT,
  status TEXT NOT NULL DEFAULT 'Available',
  lat REAL,
  lng REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'Pending',
  method TEXT,
  timestamp TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_shipment ON payments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  pickup TEXT NOT NULL,
  delivery TEXT NOT NULL,
  weight REAL NOT NULL CHECK (weight > 0),
  type TEXT NOT NULL DEFAULT 'Standard',
  delivery_type TEXT NOT NULL DEFAULT 'Standard',
  distance_km REAL NOT NULL CHECK (distance_km >= 0),
  price REAL NOT NULL CHECK (price >= 0),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  recipient TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated ON chat_conversations(updated_at);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  file_attachment TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS shipment_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(shipment_id, email)
);
CREATE INDEX IF NOT EXISTS idx_shipment_subscribers_shipment ON shipment_subscribers(shipment_id);
