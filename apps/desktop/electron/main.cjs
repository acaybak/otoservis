const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const isDev = !app.isPackaged;

// ============================================================================
// Globals
// ============================================================================
let mainWindow = null;
let db = null;
let syncTimer = null;
let syncing = false;

const SYNC_INTERVAL_MS = 30000; // try sync every 30s

let syncState = {
  online: false,
  syncing: false,
  lastSyncAt: null,
  lastError: null,
  pending: 0,
};

// Entity registry: local table <-> server entity type <-> payload fields
const ENTITIES = {
  customers: {
    type: 'CUSTOMER',
    cols: ['id', 'tenantId', 'firstName', 'lastName', 'phone', 'email', 'tcNo', 'notes', 'createdAt', 'updatedAt'],
    payloadCols: ['firstName', 'lastName', 'phone', 'email', 'tcNo', 'notes'],
    searchCols: ['firstName', 'lastName', 'phone', 'email'],
  },
  vehicles: {
    type: 'VEHICLE',
    cols: ['id', 'tenantId', 'customerId', 'plate', 'brand', 'model', 'year', 'km', 'fuelType', 'color', 'vin', 'notes', 'createdAt', 'updatedAt'],
    payloadCols: ['customerId', 'plate', 'brand', 'model', 'year', 'km', 'fuelType', 'color', 'vin', 'notes'],
    searchCols: ['plate', 'brand', 'model'],
  },
  appointments: {
    type: 'APPOINTMENT',
    cols: ['id', 'tenantId', 'customerId', 'vehicleId', 'plate', 'phone', 'service', 'date', 'time', 'duration', 'notes', 'status', 'source', 'createdAt', 'updatedAt'],
    payloadCols: ['customerId', 'vehicleId', 'plate', 'phone', 'service', 'date', 'time', 'duration', 'notes'],
    searchCols: ['plate', 'phone', 'service'],
  },
  products: {
    type: 'PRODUCT',
    cols: ['id', 'tenantId', 'code', 'name', 'brand', 'purchasePrice', 'salePrice', 'stock', 'minStock', 'createdAt', 'updatedAt'],
    payloadCols: ['code', 'name', 'brand', 'purchasePrice', 'salePrice', 'stock', 'minStock'],
    searchCols: ['name', 'code', 'brand'],
  },
  service_orders: {
    type: 'SERVICE_ORDER',
    cols: ['id', 'tenantId', 'orderNumber', 'customerId', 'vehicleId', 'km', 'customerComplaint', 'diagnosis', 'status', 'totalAmount', 'paidAmount', 'paymentStatus', 'createdAt', 'updatedAt'],
    payloadCols: ['orderNumber', 'customerId', 'vehicleId', 'km', 'customerComplaint', 'diagnosis', 'status', 'totalAmount', 'paidAmount', 'paymentStatus'],
    searchCols: ['orderNumber'],
  },
  service_order_parts: {
    type: 'SERVICE_ORDER_PART',
    cols: ['id', 'tenantId', 'serviceOrderId', 'productId', 'name', 'quantity', 'unitPrice', 'total', 'notes', 'createdAt', 'updatedAt'],
    payloadCols: ['serviceOrderId', 'productId', 'name', 'quantity', 'unitPrice', 'total', 'notes'],
    searchCols: ['name'],
  },
  service_order_labors: {
    type: 'SERVICE_ORDER_LABOR',
    cols: ['id', 'tenantId', 'serviceOrderId', 'description', 'hours', 'hourlyRate', 'total', 'createdAt', 'updatedAt'],
    payloadCols: ['serviceOrderId', 'description', 'hours', 'hourlyRate', 'total'],
    searchCols: ['description'],
  },
  service_order_notes: {
    type: 'SERVICE_ORDER_NOTE',
    cols: ['id', 'tenantId', 'serviceOrderId', 'content', 'createdById', 'createdAt', 'updatedAt'],
    payloadCols: ['serviceOrderId', 'content', 'createdById'],
    searchCols: ['content'],
  },
  maintenance_types: {
    type: 'MAINTENANCE_TYPE',
    cols: ['id', 'tenantId', 'name', 'description', 'defaultIntervalKm', 'defaultIntervalDays', 'isActive', 'createdAt', 'updatedAt'],
    payloadCols: ['name', 'description', 'defaultIntervalKm', 'defaultIntervalDays', 'isActive'],
    searchCols: ['name'],
  },
  maintenance_records: {
    type: 'MAINTENANCE_RECORD',
    cols: ['id', 'tenantId', 'vehicleId', 'maintenanceTypeId', 'serviceOrderId', 'performedAt', 'km', 'notes', 'totalAmount', 'createdAt', 'updatedAt'],
    payloadCols: ['vehicleId', 'maintenanceTypeId', 'serviceOrderId', 'performedAt', 'km', 'notes', 'totalAmount'],
    searchCols: [],
  },
  maintenance_items: {
    type: 'MAINTENANCE_ITEM',
    cols: ['id', 'tenantId', 'maintenanceRecordId', 'itemType', 'productId', 'name', 'quantity', 'unitPrice', 'total', 'createdAt', 'updatedAt'],
    payloadCols: ['maintenanceRecordId', 'itemType', 'productId', 'name', 'quantity', 'unitPrice', 'total'],
    searchCols: ['name'],
  },
  vehicle_maintenance_intervals: {
    type: 'VEHICLE_MAINTENANCE_INTERVAL',
    cols: ['id', 'tenantId', 'vehicleId', 'maintenanceTypeId', 'intervalKm', 'intervalDays', 'lastKm', 'lastPerformedAt', 'nextDueKm', 'nextDueDate', 'createdAt', 'updatedAt'],
    payloadCols: ['vehicleId', 'maintenanceTypeId', 'intervalKm', 'intervalDays', 'lastKm', 'lastPerformedAt', 'nextDueKm', 'nextDueDate'],
    searchCols: [],
  },
  expenses: {
    type: 'EXPENSE',
    cols: ['id', 'tenantId', 'category', 'description', 'amount', 'expenseDate', 'createdAt', 'updatedAt'],
    payloadCols: ['category', 'description', 'amount', 'expenseDate'],
    searchCols: ['category', 'description'],
  },
};

// ============================================================================
// Database (local SQLite)
// ============================================================================
function getDb() {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'otoservis.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, tenantId TEXT, firstName TEXT, lastName TEXT,
      phone TEXT, email TEXT, tcNo TEXT, notes TEXT,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY, tenantId TEXT, customerId TEXT, plate TEXT, brand TEXT, model TEXT,
      year INTEGER, km INTEGER, fuelType TEXT, color TEXT, vin TEXT, notes TEXT,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY, tenantId TEXT, customerId TEXT, vehicleId TEXT,
      plate TEXT, phone TEXT, service TEXT, date TEXT, time TEXT,
      duration INTEGER DEFAULT 60, notes TEXT, status TEXT DEFAULT 'PENDING',
      source TEXT DEFAULT 'DESKTOP',
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, name TEXT, brand TEXT,
      purchasePrice REAL DEFAULT 0, salePrice REAL DEFAULT 0,
      stock REAL DEFAULT 0, minStock REAL DEFAULT 0,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS service_orders (
      id TEXT PRIMARY KEY, tenantId TEXT, orderNumber TEXT, customerId TEXT,
      vehicleId TEXT, km INTEGER, customerComplaint TEXT, diagnosis TEXT,
      status TEXT DEFAULT 'APPOINTMENT', totalAmount REAL DEFAULT 0,
      paidAmount REAL DEFAULT 0, paymentStatus TEXT DEFAULT 'UNPAID',
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS service_order_parts (
      id TEXT PRIMARY KEY, tenantId TEXT, serviceOrderId TEXT, productId TEXT,
      name TEXT, quantity REAL DEFAULT 1, unitPrice REAL DEFAULT 0, total REAL DEFAULT 0,
      notes TEXT, createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS service_order_labors (
      id TEXT PRIMARY KEY, tenantId TEXT, serviceOrderId TEXT,
      description TEXT, hours REAL DEFAULT 0, hourlyRate REAL DEFAULT 0, total REAL DEFAULT 0,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS service_order_notes (
      id TEXT PRIMARY KEY, tenantId TEXT, serviceOrderId TEXT,
      content TEXT, createdById TEXT,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS maintenance_types (
      id TEXT PRIMARY KEY, tenantId TEXT, name TEXT,
      description TEXT, defaultIntervalKm INTEGER, defaultIntervalDays INTEGER,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS maintenance_records (
      id TEXT PRIMARY KEY, tenantId TEXT, vehicleId TEXT, maintenanceTypeId TEXT,
      serviceOrderId TEXT, performedAt TEXT, km INTEGER, notes TEXT,
      totalAmount REAL DEFAULT 0, createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS maintenance_items (
      id TEXT PRIMARY KEY, tenantId TEXT, maintenanceRecordId TEXT,
      itemType TEXT, productId TEXT, name TEXT,
      quantity REAL DEFAULT 1, unitPrice REAL DEFAULT 0, total REAL DEFAULT 0,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS vehicle_maintenance_intervals (
      id TEXT PRIMARY KEY, tenantId TEXT, vehicleId TEXT, maintenanceTypeId TEXT,
      intervalKm INTEGER, intervalDays INTEGER, lastPerformedAt TEXT, lastKm INTEGER,
      nextDueKm INTEGER, nextDueDate TEXT,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY, tenantId TEXT,
      category TEXT, description TEXT, amount REAL DEFAULT 0,
      expenseDate TEXT,
      createdAt TEXT, updatedAt TEXT, dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_outbox_entity ON outbox(entity_type, entity_id);
  `);

  // Migration: Add missing columns to existing tables
  try {
    db.exec(`ALTER TABLE service_orders ADD COLUMN paidAmount REAL DEFAULT 0`);
  } catch (e) { /* Column may already exist */ }
  try {
    db.exec(`ALTER TABLE service_orders ADD COLUMN paymentStatus TEXT DEFAULT 'UNPAID'`);
  } catch (e) { /* Column may already exist */ }

  // Seed default maintenance types if empty
  const typeCount = db.prepare('SELECT COUNT(*) as count FROM maintenance_types').get();
  if (typeCount.count === 0) {
    const now = new Date().toISOString();
    const tenantId = 'default';
    const defaultTypes = [
      { name: 'Yağ Değişimi', intervalKm: 10000, intervalDays: 180 },
      { name: 'Yağ Filtresi Değişimi', intervalKm: 10000, intervalDays: 180 },
      { name: 'Hava Filtresi Değişimi', intervalKm: 20000, intervalDays: 365 },
      { name: 'Polen Filtresi Değişimi', intervalKm: 15000, intervalDays: 365 },
      { name: 'Fren Balata Kontrolü', intervalKm: 20000, intervalDays: 365 },
      { name: 'Fren Hidrolik Yağı', intervalKm: 40000, intervalDays: 730 },
      { name: 'Soğutma Suyu Kontrolü', intervalKm: 20000, intervalDays: 365 },
      { name: 'Akü Kontrolü', intervalKm: 20000, intervalDays: 365 },
      { name: 'Lastik Rot Balans', intervalKm: 10000, intervalDays: 180 },
      { name: 'Buji Değişimi', intervalKm: 40000, intervalDays: 730 },
    ];
    const insert = db.prepare(
      `INSERT INTO maintenance_types (id, tenantId, name, description, defaultIntervalKm, defaultIntervalDays, isActive, createdAt, updatedAt, dirty)
       VALUES (?, ?, ?, NULL, ?, ?, 1, ?, ?, 1)`,
    );
    for (const t of defaultTypes) {
      insert.run(crypto.randomUUID(), tenantId, t.name, t.intervalKm, t.intervalDays, now, now);
    }
  }

  // Migrations for databases created before the vehicle-owner link existed
  try {
    db.exec('ALTER TABLE vehicles ADD COLUMN customerId TEXT');
  } catch (_) {
    // column already exists
  }

  return db;
}

function getMeta(key) {
  const row = getDb().prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : null;
}
function setMeta(key, value) {
  getDb().prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(key, value == null ? null : String(value));
}

// ============================================================================
// HTTP helper (main process => no CORS)
// ============================================================================
async function fetchJson(url, { method = 'GET', token, body, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(t);
  }
}

// ============================================================================
// Password hashing (for offline login)
// ============================================================================
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

// ============================================================================
// Broadcast sync status to renderer
// ============================================================================
function outboxCount() {
  return getDb().prepare('SELECT COUNT(*) as c FROM outbox').get().c;
}
function broadcast() {
  syncState.pending = outboxCount();
  syncState.syncing = syncing;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync:status', { ...syncState });
  }
}

// ============================================================================
// Sync engine
// ============================================================================
async function ensureFreshToken() {
  const serverUrl = getMeta('serverUrl');
  const refreshToken = getMeta('refreshToken');
  const accessToken = getMeta('accessToken');
  if (!serverUrl || !accessToken) return null;

  // Cheap check: verify the access token is still valid
  const me = await fetchJson(`${serverUrl}/api/v1/auth/me`, { token: accessToken, timeoutMs: 8000 });
  if (me.ok) return accessToken;

  // Try refresh
  if (!refreshToken) return null;
  const ref = await fetchJson(`${serverUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    body: { refreshToken },
    timeoutMs: 8000,
  });
  if (ref.ok && ref.data && ref.data.accessToken) {
    setMeta('accessToken', ref.data.accessToken);
    if (ref.data.refreshToken) setMeta('refreshToken', ref.data.refreshToken);
    return ref.data.accessToken;
  }
  return null;
}

async function syncNow() {
  if (syncing) return syncState;
  const serverUrl = getMeta('serverUrl');
  const deviceKey = getMeta('deviceKey');
  if (!serverUrl || !deviceKey || !getMeta('user')) {
    syncState.online = false;
    broadcast();
    return syncState;
  }

  syncing = true;
  broadcast();
  try {
    const token = await ensureFreshToken();
    if (!token) throw new Error('Oturum geçersiz. Lütfen tekrar giriş yapın.');

    // --- 1. PUSH outbox ---
    const rows = getDb().prepare('SELECT * FROM outbox ORDER BY id LIMIT 200').all();
    if (rows.length > 0) {
      const operations = rows.map((r) => ({
        entityId: r.entity_id,
        entityType: r.entity_type,
        operationType: r.operation_type,
        payload: JSON.parse(r.payload),
      }));
      const res = await fetchJson(`${serverUrl}/api/v1/sync/push`, {
        method: 'POST',
        token,
        body: { deviceKey, operations },
      });
      if (!res.ok) throw new Error(`Push başarısız (HTTP ${res.status})`);

      const results = Array.isArray(res.data) ? res.data : [];
      const tableByType = {};
      for (const key of Object.keys(ENTITIES)) tableByType[ENTITIES[key].type] = key;

      rows.forEach((row, i) => {
        const r = results[i] || { status: 'FAILED' };
        if (r.status === 'SYNCED' || r.status === 'CONFLICT') {
          getDb().prepare('DELETE FROM outbox WHERE id = ?').run(row.id);
          const table = tableByType[row.entity_type];
          if (table && row.operation_type !== 'DELETE') {
            getDb().prepare(`UPDATE ${table} SET dirty = 0 WHERE id = ?`).run(row.entity_id);
          }
          if (table && row.operation_type === 'DELETE') {
            getDb().prepare(`DELETE FROM ${table} WHERE id = ?`).run(row.entity_id);
          }
        } else {
          // FAILED: drop after 5 retries to avoid infinite loops
          getDb().prepare('UPDATE outbox SET retry_count = retry_count + 1 WHERE id = ?').run(row.id);
          const updated = getDb().prepare('SELECT retry_count FROM outbox WHERE id = ?').get(row.id);
          if (updated && updated.retry_count >= 5) {
            getDb().prepare('DELETE FROM outbox WHERE id = ?').run(row.id);
            console.error(`[sync] Op dropped after retries: ${row.entity_type}/${row.entity_id} - ${r.error || 'bilinmeyen hata'}`);
          }
        }
      });
    }

    // --- 2. PULL delta ---
    const since = getMeta('lastPullAt') || '1970-01-01T00:00:00.000Z';
    const pullRes = await fetchJson(
      `${serverUrl}/api/v1/sync/pull?since=${encodeURIComponent(since)}`,
      { token },
    );
    if (!pullRes.ok) throw new Error(`Pull başarısız (HTTP ${pullRes.status})`);

    applyPulledEntities(pullRes.data && pullRes.data.entities ? pullRes.data.entities : {});
    if (pullRes.data && pullRes.data.serverTime) {
      setMeta('lastPullAt', pullRes.data.serverTime);
    }

    syncState.online = true;
    syncState.lastSyncAt = new Date().toISOString();
    syncState.lastError = null;
  } catch (err) {
    syncState.online = false;
    syncState.lastError = err.message || 'Bağlantı hatası';
  } finally {
    syncing = false;
    broadcast();
  }
  return syncState;
}

function applyPulledEntities(entities) {
  const d = getDb();
  const mapping = {
    customers: ENTITIES.customers.cols,
    vehicles: ENTITIES.vehicles.cols,
    appointments: ENTITIES.appointments.cols,
    products: ENTITIES.products.cols,
    serviceOrders: ENTITIES.service_orders.cols,
    serviceOrderParts: ENTITIES.service_order_parts.cols,
    serviceOrderLabors: ENTITIES.service_order_labors.cols,
    serviceOrderNotes: ENTITIES.service_order_notes.cols,
    maintenanceRecords: ENTITIES.maintenance_records.cols,
    maintenanceItems: ENTITIES.maintenance_items.cols,
    maintenanceTypes: ENTITIES.maintenance_types.cols,
  };

  const tableByName = {
    customers: 'customers', vehicles: 'vehicles', appointments: 'appointments',
    products: 'products', serviceOrders: 'service_orders',
    serviceOrderParts: 'service_order_parts', serviceOrderLabors: 'service_order_labors',
    serviceOrderNotes: 'service_order_notes', maintenanceRecords: 'maintenance_records',
    maintenanceItems: 'maintenance_items', maintenanceTypes: 'maintenance_types',
    vehicleMaintenanceIntervals: 'vehicle_maintenance_intervals',
  };

  for (const [serverKey, cols] of Object.entries(mapping)) {
    const rows = entities[serverKey];
    if (!Array.isArray(rows)) continue;
    const table = tableByName[serverKey] || serverKey;

    const checkDirty = d.prepare(`SELECT dirty FROM ${table} WHERE id = ?`);
    const upsert = d.prepare(
      `INSERT OR REPLACE INTO ${table} (${[...cols, 'dirty'].join(', ')})
       VALUES (${[...cols, 'dirty'].map(() => '?').join(', ')})`,
    );

    for (const row of rows) {
      if (!row || !row.id) continue;
      const local = checkDirty.get(row.id);
      // Don't overwrite rows that still have unpushed local changes
      if (local && local.dirty) continue;
      upsert.run(...cols.map((c) => (row[c] === undefined ? null : row[c])), 0);
    }
  }
}

function scheduleSync() {
  // Fire-and-forget: sync shortly after a local change
  setTimeout(() => { syncNow().catch(() => {}); }, 1500);
}

// ============================================================================
// Local CRUD handlers
// ============================================================================
function validateEntity(entity) {
  if (!ENTITIES[entity]) throw new Error(`Bilinmeyen kayıt tipi: ${entity}`);
  return ENTITIES[entity];
}

function handleList(entity, opts = {}) {
  const def = validateEntity(entity);
  const q = (opts.q || '').trim();
  const page = Math.max(1, parseInt(opts.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(opts.limit, 10) || 20));

  const d = getDb();
  let rows;
  let total;

  if (entity === 'service_orders') {
    // Joined query: search across order number, customer name and plate
    const like = q ? `%${q}%` : null;
    const baseWhere = like
      ? "WHERE so.orderNumber LIKE ? OR (c.firstName || ' ' || c.lastName) LIKE ? OR v.plate LIKE ?"
      : '';
    const baseParams = like ? [like, like, like] : [];
    total = d.prepare(
      `SELECT COUNT(*) as c FROM service_orders so
       LEFT JOIN customers c ON c.id = so.customerId
       LEFT JOIN vehicles v ON v.id = so.vehicleId ${baseWhere}`,
    ).get(...baseParams).c;
    rows = d.prepare(
      `SELECT so.*, c.firstName || ' ' || c.lastName as customerName, v.plate as vehiclePlate, v.brand as vehicleBrand, v.model as vehicleModel
       FROM service_orders so
       LEFT JOIN customers c ON c.id = so.customerId
       LEFT JOIN vehicles v ON v.id = so.vehicleId
       ${baseWhere}
       ORDER BY so.updatedAt DESC LIMIT ? OFFSET ?`,
    ).all(...baseParams, limit, (page - 1) * limit);
  } else if (entity === 'vehicles') {
    // Joined query: resolve the owner's name so the list can show whose vehicle it is
    const like = q ? `%${q}%` : null;
    const baseWhere = like
      ? "WHERE v.plate LIKE ? OR v.brand LIKE ? OR v.model LIKE ? OR (c.firstName || ' ' || c.lastName) LIKE ?"
      : '';
    const baseParams = like ? [like, like, like, like] : [];
    total = d.prepare(
      `SELECT COUNT(*) as c FROM vehicles v LEFT JOIN customers c ON c.id = v.customerId ${baseWhere}`,
    ).get(...baseParams).c;
    rows = d.prepare(
      `SELECT v.*, c.firstName || ' ' || c.lastName as customerName
       FROM vehicles v
       LEFT JOIN customers c ON c.id = v.customerId
       ${baseWhere}
       ORDER BY v.updatedAt DESC LIMIT ? OFFSET ?`,
    ).all(...baseParams, limit, (page - 1) * limit);
  } else {
    let where = '';
    const params = [];
    if (q && def.searchCols.length) {
      where = `WHERE ${def.searchCols.map((c) => `${c} LIKE ?`).join(' OR ')}`;
      def.searchCols.forEach(() => params.push(`%${q}%`));
    }
    total = d.prepare(`SELECT COUNT(*) as c FROM ${entity} ${where}`).get(...params).c;
    rows = d.prepare(`SELECT * FROM ${entity} ${where} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, (page - 1) * limit);
  }

  return { data: rows, total, page, limit };
}

function buildPayload(def, row) {
  const payload = {};
  for (const col of def.payloadCols) {
    if (row[col] !== undefined && row[col] !== null) payload[col] = row[col];
  }
  return payload;
}

function handleCreate(entity, data) {
  const def = validateEntity(entity);
  const d = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const tenantId = getMeta('tenantId');

  // Entity-specific defaults
  if (entity === 'service_orders' && !data.orderNumber) {
    data = { ...data, orderNumber: `SO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now() % 100000}` };
  }

  const cols = ['id', 'tenantId', ...def.cols.filter((c) => c !== 'id' && c !== 'tenantId' && c !== 'createdAt' && c !== 'updatedAt')];
  const values = [id, tenantId];
  for (let i = 2; i < cols.length; i++) {
    const c = cols[i];
    values.push(data[c] === undefined ? null : data[c]);
  }

  // Extra fields required by the server payload but not stored locally
  let extra = {};
  if (entity === 'service_orders') {
    const user = getMeta('user');
    if (user) extra.createdById = JSON.parse(user).id;
  }

  const insert = d.prepare(
    `INSERT INTO ${entity} (${[...cols, 'createdAt', 'updatedAt', 'dirty'].join(', ')})
     VALUES (${[...cols, 'createdAt', 'updatedAt', 'dirty'].map(() => '?').join(', ')})`,
  );
  insert.run(...values, now, now, 1);

  const row = d.prepare(`SELECT * FROM ${entity} WHERE id = ?`).get(id);
  const payload = { ...buildPayload(def, row), ...extra };
  d.prepare(
    'INSERT INTO outbox (entity_type, entity_id, operation_type, payload, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(def.type, id, 'CREATE', JSON.stringify(payload), now);

  broadcast();
  scheduleSync();
  return row;
}

function handleUpdate(entity, id, data) {
  const def = validateEntity(entity);
  const d = getDb();
  const existing = d.prepare(`SELECT * FROM ${entity} WHERE id = ?`).get(id);
  if (!existing) throw new Error('Kayıt bulunamadı.');

  const now = new Date().toISOString();
  const updatable = def.cols.filter((c) => c !== 'id' && c !== 'tenantId' && c !== 'createdAt');
  const sets = [];
  const values = [];
  for (const c of updatable) {
    if (data[c] !== undefined) {
      sets.push(`${c} = ?`);
      values.push(data[c]);
    }
  }
  if (!sets.length) return existing;

  sets.push('updatedAt = ?', 'dirty = 1');
  values.push(now, id);
  d.prepare(`UPDATE ${entity} SET ${sets.join(', ')} WHERE id = ?`).run(...values);

  const row = d.prepare(`SELECT * FROM ${entity} WHERE id = ?`).get(id);
  const payload = buildPayload(def, row);
  if (entity === 'service_orders') {
    const user = getMeta('user');
    if (user) payload.createdById = JSON.parse(user).id;
  }
  // Replace any pending CREATE/UPDATE for this entity, add new UPDATE
  d.prepare('DELETE FROM outbox WHERE entity_type = ? AND entity_id = ? AND operation_type IN (?, ?)')
    .run(def.type, id, 'CREATE', 'UPDATE');
  d.prepare(
    'INSERT INTO outbox (entity_type, entity_id, operation_type, payload, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(def.type, id, 'UPDATE', JSON.stringify(payload), now);

  broadcast();
  scheduleSync();
  return row;
}

function handleRemove(entity, id) {
  const def = validateEntity(entity);
  const d = getDb();
  const existing = d.prepare(`SELECT * FROM ${entity} WHERE id = ?`).get(id);
  if (!existing) throw new Error('Kayıt bulunamadı.');

  const now = new Date().toISOString();
  d.prepare(`DELETE FROM ${entity} WHERE id = ?`).run(id);
  d.prepare('DELETE FROM outbox WHERE entity_type = ? AND entity_id = ? AND operation_type IN (?, ?)')
    .run(def.type, id, 'CREATE', 'UPDATE');
  d.prepare(
    'INSERT INTO outbox (entity_type, entity_id, operation_type, payload, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(def.type, id, 'DELETE', JSON.stringify({}), now);

  broadcast();
  scheduleSync();
  return { success: true };
}

function handleStats() {
  const d = getDb();
  return d.prepare(`
    SELECT
      (SELECT COUNT(*) FROM customers) as totalCustomers,
      (SELECT COUNT(*) FROM vehicles) as totalVehicles,
      (SELECT COUNT(*) FROM service_orders WHERE status NOT IN ('DELIVERED', 'CANCELLED')) as activeOrders,
      (SELECT COUNT(*) FROM service_orders WHERE status IN ('DELIVERED')) as completedOrders,
      (SELECT COUNT(*) FROM appointments WHERE status = 'PENDING') as pendingAppointments,
      (SELECT COUNT(*) FROM products WHERE CAST(stock AS REAL) <= CAST(minStock AS REAL)) as lowStockProducts,
      (SELECT COUNT(*) FROM outbox) as pendingSync
  `).get();
}

// ============================================================================
// Auth handlers
// ============================================================================
async function handleLogin(email, password) {
  const serverUrl = (getMeta('serverUrl') || '').replace(/\/+$/, '');
  if (!serverUrl) throw new Error('Önce sunucu adresini ayarlayın.');

  let onlineLogin = null;
  let loginError = null;
  try {
    const res = await fetchJson(`${serverUrl}/api/v1/auth/login`, {
      method: 'POST',
      body: { email, password },
      timeoutMs: 10000,
    });
    if (res.ok && res.data && res.data.accessToken) {
      onlineLogin = res.data;
    } else {
      loginError = res.data && res.data.error ? res.data.error.message : 'Giriş başarısız.';
    }
  } catch (err) {
    loginError = 'Sunucuya ulaşılamadı.';
  }

  if (onlineLogin) {
    setMeta('accessToken', onlineLogin.accessToken);
    setMeta('refreshToken', onlineLogin.refreshToken || '');
    setMeta('user', JSON.stringify(onlineLogin.user));
    setMeta('tenantId', onlineLogin.user.tenantId);
    setMeta('passHash', hashPassword(password));

    // Register this device for sync (once)
    if (!getMeta('deviceKey')) {
      try {
        const devRes = await fetchJson(`${serverUrl}/api/v1/sync/register-device`, {
          method: 'POST',
          token: onlineLogin.accessToken,
          body: { name: `PC-${os.hostname()}` },
          timeoutMs: 10000,
        });
        if (devRes.ok && devRes.data && devRes.data.deviceKey) {
          setMeta('deviceKey', devRes.data.deviceKey);
        }
      } catch (err) {
        console.warn('[auth] Device registration failed:', err.message);
      }
    }

    syncNow().catch(() => {});
    return { user: onlineLogin.user, offline: false };
  }

  // Offline fallback: verify against cached credentials
  const cachedUser = getMeta('user');
  const passHash = getMeta('passHash');
  if (cachedUser && passHash && verifyPassword(password, passHash)) {
    const user = JSON.parse(cachedUser);
    if (user.email === email) {
      return { user, offline: true };
    }
  }
  throw new Error(
    loginError === 'Sunucuya ulaşılamadı.'
      ? 'Sunucuya ulaşılamadı ve çevrimdışı giriş bilgisi bulunamadı. İlk giriş için internet gerekir.'
      : loginError || 'Giriş başarısız.',
  );
}

function handleLogout() {
  setMeta('accessToken', null);
  setMeta('refreshToken', null);
  setMeta('user', null);
  syncState.online = false;
  broadcast();
  return { success: true };
}

// ============================================================================
// Service order total recalculation helper
// ============================================================================
function updateServiceOrderTotal(d, serviceOrderId) {
  const parts = d.prepare('SELECT COALESCE(SUM(total), 0) as s FROM service_order_parts WHERE serviceOrderId = ?').get(serviceOrderId).s;
  const labor = d.prepare('SELECT COALESCE(SUM(total), 0) as s FROM service_order_labors WHERE serviceOrderId = ?').get(serviceOrderId).s;
  const subtotal = parts + labor;
  const taxAmount = subtotal * 0.20; // 20% KDV
  const totalAmount = subtotal + taxAmount;
  d.prepare('UPDATE service_orders SET totalAmount = ?, updatedAt = ? WHERE id = ?')
    .run(Math.round(totalAmount * 100) / 100, new Date().toISOString(), serviceOrderId);
}

function updateMaintenanceTotal(d, recordId) {
  const total = d.prepare('SELECT COALESCE(SUM(total), 0) as s FROM maintenance_items WHERE maintenanceRecordId = ?').get(recordId).s;
  d.prepare('UPDATE maintenance_records SET totalAmount = ?, updatedAt = ? WHERE id = ?')
    .run(Math.round(total * 100) / 100, new Date().toISOString(), recordId);
}

// ============================================================================
// IPC wiring
// ============================================================================
function registerIpc() {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
    platform: process.platform,
    isDev,
  }));

  ipcMain.handle('app:print', (_e, htmlContent) => {
    const { BrowserWindow } = require('electron');
    const printWindow = new BrowserWindow({
      width: 800,
      height: 900,
      show: true,
      title: 'Servis Fişi - Yazdırma',
    });
    
    // Add print button and auto-print script to the HTML
    const htmlWithScript = htmlContent.replace(
      '</body>',
      `<script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
      </body>`
    );
    
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlWithScript)}`);
    
    // Close window after print dialog closes
    printWindow.webContents.on('did-finish-load', () => {
      // Window will stay open for user to manually print if needed
    });
    
    return { success: true };
  });

  ipcMain.handle('config:get', () => ({
    serverUrl: getMeta('serverUrl'),
    deviceKey: getMeta('deviceKey'),
  }));
  ipcMain.handle('config:set', (_e, cfg) => {
    if (cfg && typeof cfg.serverUrl === 'string') {
      setMeta('serverUrl', cfg.serverUrl.trim().replace(/\/+$/, ''));
    }
    return { success: true };
  });

  ipcMain.handle('auth:login', (_e, email, password) => handleLogin(email, password));
  ipcMain.handle('auth:logout', () => handleLogout());
  ipcMain.handle('auth:current', () => {
    const u = getMeta('user');
    return u ? JSON.parse(u) : null;
  });

  ipcMain.handle('store:list', (_e, entity, opts) => handleList(entity, opts || {}));
  ipcMain.handle('store:get', (_e, entity, id) => {
    const def = validateEntity(entity);
    const d = getDb();
    const row = d.prepare(`SELECT * FROM ${entity} WHERE id = ?`).get(id);
    if (!row) throw new Error(`${entity} not found`);
    return row;
  });
  ipcMain.handle('store:create', (_e, entity, data) => handleCreate(entity, data || {}));
  ipcMain.handle('store:update', (_e, entity, id, data) => handleUpdate(entity, id, data || {}));
  ipcMain.handle('store:remove', (_e, entity, id) => handleRemove(entity, id));
  ipcMain.handle('store:stats', () => handleStats());

  // Service order sub-entity handlers (parts, labor, notes)
  ipcMain.handle('so:listParts', (_e, serviceOrderId) => {
    return getDb().prepare('SELECT * FROM service_order_parts WHERE serviceOrderId = ? ORDER BY createdAt').all(serviceOrderId);
  });
  ipcMain.handle('so:addPart', (_e, serviceOrderId, data) => {
    const d = getDb(); const id = crypto.randomUUID(); const now = new Date().toISOString();
    const tenantId = getMeta('tenantId');
    const total = (data.quantity || 1) * (data.unitPrice || 0);
    d.prepare(
      `INSERT INTO service_order_parts (id, tenantId, serviceOrderId, productId, name, quantity, unitPrice, total, notes, createdAt, updatedAt, dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    ).run(id, tenantId, serviceOrderId, data.productId || null, data.name, data.quantity || 1, data.unitPrice || 0, total, data.notes || null, now, now);
    // Update service order total
    updateServiceOrderTotal(d, serviceOrderId);
    scheduleSync();
    return d.prepare('SELECT * FROM service_order_parts WHERE id = ?').get(id);
  });
  ipcMain.handle('so:removePart', (_e, partId) => {
    const d = getDb();
    const part = d.prepare('SELECT * FROM service_order_parts WHERE id = ?').get(partId);
    if (part) {
      d.prepare('DELETE FROM service_order_parts WHERE id = ?').run(partId);
      updateServiceOrderTotal(d, part.serviceOrderId);
      scheduleSync();
    }
    return { success: true };
  });

  ipcMain.handle('so:listLabor', (_e, serviceOrderId) => {
    return getDb().prepare('SELECT * FROM service_order_labors WHERE serviceOrderId = ? ORDER BY createdAt').all(serviceOrderId);
  });
  ipcMain.handle('so:addLabor', (_e, serviceOrderId, data) => {
    const d = getDb(); const id = crypto.randomUUID(); const now = new Date().toISOString();
    const tenantId = getMeta('tenantId');
    const total = (data.hours || 0) * (data.hourlyRate || 0);
    d.prepare(
      `INSERT INTO service_order_labors (id, tenantId, serviceOrderId, description, hours, hourlyRate, total, createdAt, updatedAt, dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    ).run(id, tenantId, serviceOrderId, data.description, data.hours || 0, data.hourlyRate || 0, total, now, now);
    updateServiceOrderTotal(d, serviceOrderId);
    scheduleSync();
    return d.prepare('SELECT * FROM service_order_labors WHERE id = ?').get(id);
  });
  ipcMain.handle('so:removeLabor', (_e, laborId) => {
    const d = getDb();
    const labor = d.prepare('SELECT * FROM service_order_labors WHERE id = ?').get(laborId);
    if (labor) {
      d.prepare('DELETE FROM service_order_labors WHERE id = ?').run(laborId);
      updateServiceOrderTotal(d, labor.serviceOrderId);
      scheduleSync();
    }
    return { success: true };
  });

  ipcMain.handle('so:listNotes', (_e, serviceOrderId) => {
    return getDb().prepare('SELECT * FROM service_order_notes WHERE serviceOrderId = ? ORDER BY createdAt DESC').all(serviceOrderId);
  });
  ipcMain.handle('so:addNote', (_e, serviceOrderId, content) => {
    const d = getDb(); const id = crypto.randomUUID(); const now = new Date().toISOString();
    const tenantId = getMeta('tenantId');
    const user = getMeta('user');
    const userId = user ? JSON.parse(user).id : null;
    d.prepare(
      `INSERT INTO service_order_notes (id, tenantId, serviceOrderId, content, createdById, createdAt, updatedAt, dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    ).run(id, tenantId, serviceOrderId, content, userId, now, now);
    scheduleSync();
    return d.prepare('SELECT * FROM service_order_notes WHERE id = ?').get(id);
  });

  ipcMain.handle('sync:status', () => ({ ...syncState, pending: outboxCount(), syncing }));
  ipcMain.handle('sync:now', () => syncNow());

  // Plate search: search vehicles + service orders by plate
  ipcMain.handle('search:plate', (_e, plate) => {
    if (!plate || !plate.trim()) return { vehicles: [], serviceOrders: [] };
    const d = getDb();
    const like = `%${plate.trim()}%`;
    const vehicles = d.prepare(
      `SELECT v.*, c.firstName || ' ' || c.lastName as customerName
       FROM vehicles v LEFT JOIN customers c ON c.id = v.customerId
       WHERE v.plate LIKE ? LIMIT 10`,
    ).all(like);
    const serviceOrders = d.prepare(
      `SELECT so.*, v.plate as vehiclePlate, v.brand as vehicleBrand, v.model as vehicleModel,
              c.firstName || ' ' || c.lastName as customerName
       FROM service_orders so
       LEFT JOIN vehicles v ON v.id = so.vehicleId
       LEFT JOIN customers c ON c.id = so.customerId
       WHERE v.plate LIKE ?
       ORDER BY so.updatedAt DESC LIMIT 10`,
    ).all(like);
    return { vehicles, serviceOrders };
  });

  // ==========================================================================
  // Maintenance record handlers
  // ==========================================================================
  ipcMain.handle('maint:list', () => {
    const d = getDb();
    return d.prepare(
      `SELECT mr.*, v.plate as vehiclePlate, v.brand as vehicleBrand, v.model as vehicleModel
       FROM maintenance_records mr
       LEFT JOIN vehicles v ON v.id = mr.vehicleId
       ORDER BY mr.performedAt DESC`,
    ).all();
  });

  ipcMain.handle('maint:getOne', (_e, id) => {
    const d = getDb();
    return d.prepare(
      `SELECT mr.*, v.plate as vehiclePlate, v.brand as vehicleBrand, v.model as vehicleModel
       FROM maintenance_records mr
       LEFT JOIN vehicles v ON v.id = mr.vehicleId
       WHERE mr.id = ?`,
    ).get(id);
  });

  ipcMain.handle('maint:create', (_e, data) => {
    const d = getDb(); const id = crypto.randomUUID(); const now = new Date().toISOString();
    const tenantId = getMeta('tenantId');
    d.prepare(
      `INSERT INTO maintenance_records (id, tenantId, vehicleId, maintenanceTypeId, serviceOrderId, performedAt, km, notes, totalAmount, createdAt, updatedAt, dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    ).run(id, tenantId, data.vehicleId, data.maintenanceTypeId || null, data.serviceOrderId || null, data.performedAt || now, data.km || null, data.notes || null, 0, now, now);
    scheduleSync();
    return d.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
  });

  ipcMain.handle('maint:update', (_e, id, data) => {
    const d = getDb(); const now = new Date().toISOString();
    const sets = [];
    const vals = [];
    for (const key of ['vehicleId', 'maintenanceTypeId', 'serviceOrderId', 'performedAt', 'km', 'notes']) {
      if (data[key] !== undefined) { sets.push(`${key} = ?`); vals.push(data[key]); }
    }
    if (sets.length === 0) return d.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
    sets.push('updatedAt = ?', 'dirty = 1');
    vals.push(now, id);
    d.prepare(`UPDATE maintenance_records SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    scheduleSync();
    return d.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
  });

  ipcMain.handle('maint:delete', (_e, id) => {
    const d = getDb();
    d.prepare('DELETE FROM maintenance_items WHERE maintenanceRecordId = ?').run(id);
    d.prepare('DELETE FROM maintenance_records WHERE id = ?').run(id);
    scheduleSync();
    return { success: true };
  });

  ipcMain.handle('maint:listItems', (_e, recordId) => {
    return getDb().prepare('SELECT * FROM maintenance_items WHERE maintenanceRecordId = ? ORDER BY createdAt').all(recordId);
  });

  ipcMain.handle('maint:addItem', (_e, recordId, data) => {
    const d = getDb(); const id = crypto.randomUUID(); const now = new Date().toISOString();
    const tenantId = getMeta('tenantId');
    const total = (data.quantity || 1) * (data.unitPrice || 0);
    d.prepare(
      `INSERT INTO maintenance_items (id, tenantId, maintenanceRecordId, itemType, productId, name, quantity, unitPrice, total, createdAt, updatedAt, dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    ).run(id, tenantId, recordId, data.itemType || 'OPERATION', data.productId || null, data.name, data.quantity || 1, data.unitPrice || 0, total, now, now);
    // Recalculate record total
    updateMaintenanceTotal(d, recordId);
    scheduleSync();
    return d.prepare('SELECT * FROM maintenance_items WHERE id = ?').get(id);
  });

  ipcMain.handle('maint:removeItem', (_e, itemId) => {
    const d = getDb();
    const item = d.prepare('SELECT * FROM maintenance_items WHERE id = ?').get(itemId);
    if (item) {
      d.prepare('DELETE FROM maintenance_items WHERE id = ?').run(itemId);
      updateMaintenanceTotal(d, item.maintenanceRecordId);
      scheduleSync();
    }
    return { success: true };
  });

  // Maintenance schedule/interval tracking
  ipcMain.handle('maint:schedule', (_e, vehicleId) => {
    const d = getDb();
    // Get all maintenance types
    const types = d.prepare('SELECT * FROM maintenance_types WHERE isActive = 1').all();
    // Get existing intervals for this vehicle
    const intervals = d.prepare(
      'SELECT * FROM vehicle_maintenance_intervals WHERE vehicleId = ?',
    ).all(vehicleId);
    const intervalMap = {};
    intervals.forEach((i) => { intervalMap[i.maintenanceTypeId] = i; });
    // Build schedule
    return types.map((type) => {
      const interval = intervalMap[type.id];
      return {
        maintenanceTypeId: type.id,
        maintenanceTypeName: type.name,
        defaultIntervalKm: type.defaultIntervalKm,
        defaultIntervalDays: type.defaultIntervalDays,
        intervalKm: interval?.intervalKm || type.defaultIntervalKm,
        intervalDays: interval?.intervalDays || type.defaultIntervalDays,
        lastPerformedAt: interval?.lastPerformedAt || null,
        lastKm: interval?.lastKm || null,
        nextDueKm: interval?.nextDueKm || null,
        nextDueDate: interval?.nextDueDate || null,
      };
    });
  });

  ipcMain.handle('maint:logInterval', (_e, vehicleId, maintenanceTypeId, km, performedAt) => {
    // Called when a maintenance is completed - updates the interval tracking
    const d = getDb(); const now = new Date().toISOString();
    const tenantId = getMeta('tenantId');
    const type = d.prepare('SELECT * FROM maintenance_types WHERE id = ?').get(maintenanceTypeId);
    if (!type) return null;
    const existing = d.prepare(
      'SELECT * FROM vehicle_maintenance_intervals WHERE vehicleId = ? AND maintenanceTypeId = ?',
    ).get(vehicleId, maintenanceTypeId);
    const intervalKm = existing?.intervalKm || type.defaultIntervalKm;
    const intervalDays = existing?.intervalDays || type.defaultIntervalDays;
    const nextDueKm = km != null && intervalKm != null ? km + intervalKm : null;
    const nextDueDate = performedAt && intervalDays != null
      ? new Date(new Date(performedAt).getTime() + intervalDays * 86400000).toISOString().split('T')[0]
      : null;
    if (existing) {
      d.prepare(
        `UPDATE vehicle_maintenance_intervals SET lastKm = ?, lastPerformedAt = ?, nextDueKm = ?, nextDueDate = ?, updatedAt = ?, dirty = 1 WHERE id = ?`,
      ).run(km, performedAt, nextDueKm, nextDueDate, now, existing.id);
    } else {
      const id = crypto.randomUUID();
      d.prepare(
        `INSERT INTO vehicle_maintenance_intervals (id, tenantId, vehicleId, maintenanceTypeId, intervalKm, intervalDays, lastKm, lastPerformedAt, nextDueKm, nextDueDate, createdAt, updatedAt, dirty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      ).run(id, tenantId, vehicleId, maintenanceTypeId, intervalKm, intervalDays, km, performedAt, nextDueKm, nextDueDate, now, now);
    }
    scheduleSync();
    return { success: true };
  });

  // Update maintenance interval settings for a vehicle
  ipcMain.handle('maint:updateInterval', (_e, vehicleId, maintenanceTypeId, data) => {
    const d = getDb(); const now = new Date().toISOString();
    const tenantId = getMeta('tenantId');
    const existing = d.prepare(
      'SELECT * FROM vehicle_maintenance_intervals WHERE vehicleId = ? AND maintenanceTypeId = ?',
    ).get(vehicleId, maintenanceTypeId);
    
    if (existing) {
      // Update existing interval settings
      const intervalKm = data.intervalKm != null ? data.intervalKm : existing.intervalKm;
      const intervalDays = data.intervalDays != null ? data.intervalDays : existing.intervalDays;
      const nextDueKm = existing.lastKm != null && intervalKm != null ? existing.lastKm + intervalKm : existing.nextDueKm;
      const nextDueDate = existing.lastPerformedAt && intervalDays != null
        ? new Date(new Date(existing.lastPerformedAt).getTime() + intervalDays * 86400000).toISOString().split('T')[0]
        : existing.nextDueDate;
      d.prepare(
        `UPDATE vehicle_maintenance_intervals SET intervalKm = ?, intervalDays = ?, nextDueKm = ?, nextDueDate = ?, updatedAt = ?, dirty = 1 WHERE id = ?`,
      ).run(intervalKm, intervalDays, nextDueKm, nextDueDate, now, existing.id);
    } else {
      // Create new interval record with just the settings
      const id = crypto.randomUUID();
      d.prepare(
        `INSERT INTO vehicle_maintenance_intervals (id, tenantId, vehicleId, maintenanceTypeId, intervalKm, intervalDays, createdAt, updatedAt, dirty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      ).run(id, tenantId, vehicleId, maintenanceTypeId, data.intervalKm, data.intervalDays, now, now);
    }
    scheduleSync();
    return { success: true };
  });

  // Vehicle full history by plate - professional report
  ipcMain.handle('vehicle:history', (_e, plate) => {
    if (!plate || !plate.trim()) return null;
    const d = getDb();
    const like = `%${plate.trim()}%`;
    
    // Find vehicle
    const vehicle = d.prepare(
      `SELECT v.*, c.firstName || ' ' || c.lastName as customerName, c.phone as customerPhone
       FROM vehicles v LEFT JOIN customers c ON c.id = v.customerId
       WHERE v.plate LIKE ? LIMIT 1`,
    ).all(like)[0];
    
    if (!vehicle) return null;
    
    // Get all maintenance records with items
    const records = d.prepare(
      `SELECT mr.*, mt.name as maintenanceTypeName
       FROM maintenance_records mr
       LEFT JOIN maintenance_types mt ON mt.id = mr.maintenanceTypeId
       WHERE mr.vehicleId = ?
       ORDER BY mr.performedAt DESC`,
    ).all(vehicle.id);
    
    // Get items for all records
    const recordsWithItems = records.map((rec) => {
      const items = d.prepare(
        'SELECT * FROM maintenance_items WHERE maintenanceRecordId = ? ORDER BY itemType, createdAt',
      ).all(rec.id);
      return { ...rec, items };
    });
    
    // Get all service orders
    const serviceOrders = d.prepare(
      `SELECT so.*, 
              (SELECT COALESCE(SUM(total), 0) FROM service_order_parts WHERE serviceOrderId = so.id) as partsTotal,
              (SELECT COALESCE(SUM(total), 0) FROM service_order_labors WHERE serviceOrderId = so.id) as laborTotal
       FROM service_orders so
       WHERE so.vehicleId = ?
       ORDER BY so.createdAt DESC`,
    ).all(vehicle.id);
    
    // Calculate totals
    const totalMaintenance = recordsWithItems.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
    const totalServiceOrders = serviceOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const visitCount = recordsWithItems.length + serviceOrders.length;
    
    return {
      vehicle,
      maintenanceRecords: recordsWithItems,
      serviceOrders,
      summary: {
        totalMaintenance,
        totalServiceOrders,
        totalSpent: totalMaintenance + totalServiceOrders,
        visitCount,
        lastVisit: recordsWithItems[0]?.performedAt || serviceOrders[0]?.createdAt || null,
      },
    };
  });

  // ==========================================================================
  // Dashboard widgets
  // ==========================================================================
  ipcMain.handle('dashboard:today-appointments', () => {
    const d = getDb();
    const today = new Date().toISOString().split('T')[0];
    return d.prepare(
      `SELECT a.*, v.plate as vehiclePlate
       FROM appointments a
       LEFT JOIN vehicles v ON v.id = a.vehicleId
       WHERE a.date = ?
       ORDER BY a.time ASC`,
    ).all(today);
  });

  ipcMain.handle('dashboard:active-orders', () => {
    const d = getDb();
    return d.prepare(
      `SELECT so.*, v.plate as vehiclePlate, v.brand as vehicleBrand, v.model as vehicleModel,
              c.firstName || ' ' || c.lastName as customerName
       FROM service_orders so
       LEFT JOIN vehicles v ON v.id = so.vehicleId
       LEFT JOIN customers c ON c.id = so.customerId
       WHERE so.status IN ('WAITING', 'IN_PROGRESS', 'WAITING_PARTS', 'READY')
       ORDER BY so.createdAt ASC`,
    ).all();
  });

  ipcMain.handle('dashboard:recent-maintenance', () => {
    const d = getDb();
    return d.prepare(
      `SELECT mr.*, v.plate as vehiclePlate, mt.name as maintenanceTypeName
       FROM maintenance_records mr
       LEFT JOIN vehicles v ON v.id = mr.vehicleId
       LEFT JOIN maintenance_types mt ON mt.id = mr.maintenanceTypeId
       ORDER BY mr.performedAt DESC LIMIT 5`,
    ).all();
  });

  ipcMain.handle('dashboard:revenue', () => {
    const d = getDb();
    const now = new Date();
    const todayStart = now.toISOString().split('T')[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayRevenue = d.prepare(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM service_orders WHERE status = 'DELIVERED' AND DATE(updatedAt) = ?`,
    ).get(todayStart).total;
    
    const weekRevenue = d.prepare(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM service_orders WHERE status = 'DELIVERED' AND updatedAt >= ?`,
    ).get(weekStart.toISOString()).total;
    
    const monthRevenue = d.prepare(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM service_orders WHERE status = 'DELIVERED' AND updatedAt >= ?`,
    ).get(monthStart.toISOString()).total;
    
    return { today: Number(todayRevenue), week: Number(weekRevenue), month: Number(monthRevenue) };
  });

  // All service orders with vehicle info (for Kanban)
  ipcMain.handle('so:all-with-vehicle', () => {
    const d = getDb();
    return d.prepare(
      `SELECT so.*, v.plate as vehiclePlate, v.brand as vehicleBrand, v.model as vehicleModel,
              c.firstName || ' ' || c.lastName as customerName, c.phone as customerPhone
       FROM service_orders so
       LEFT JOIN vehicles v ON v.id = so.vehicleId
       LEFT JOIN customers c ON c.id = so.customerId
       ORDER BY so.createdAt DESC`,
    ).all();
  });
}

// ============================================================================
// Window + menu
// ============================================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'OtoServis - Servis Yönetim Sistemi',
    backgroundColor: '#1e40af',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  // Show loading content immediately
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head><style>
      body { margin: 0; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); display: flex; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, sans-serif; }
      .loader { text-align: center; color: white; }
      .logo { font-size: 3rem; margin-bottom: 1rem; }
      .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style></head>
    <body><div class="loader"><div class="logo">🔧</div><div class="spinner"></div><div>OtoServis Yükleniyor...</div></div></body>
    </html>
  `)}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    // Load actual app after a brief delay to show splash
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5173');
    }, 500);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  const template = [
    {
      label: 'Dosya',
      submenu: [
        { label: 'Senkronize Et', accelerator: 'CmdOrCtrl+S', click: () => { syncNow().catch(() => {}); } },
        { type: 'separator' },
        { label: 'Çıkış', role: 'quit' },
      ],
    },
    {
      label: 'Görünüm',
      submenu: [
        { role: 'reload', label: 'Yenile' },
        { role: 'forceReload', label: 'Zorla Yenile' },
        { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Yakınlaştırmayı Sıfırla' },
        { role: 'zoomIn', label: 'Yakınlaştır' },
        { role: 'zoomOut', label: 'Uzaklaştır' },
        { role: 'togglefullscreen', label: 'Tam Ekran' },
      ],
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Hakkında',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Hakkında',
              message: 'OtoServis Servis Yönetim Sistemi',
              detail: `Sürüm ${app.getVersion()}\nÇevrimdışı çalışır, internet gelince otomatik senkronize eder.\nElectron ${process.versions.electron} - Node ${process.versions.node}`,
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ============================================================================
// App lifecycle
// ============================================================================
app.whenReady().then(() => {
  getDb(); // initialize local database
  registerIpc();
  createWindow();

  // Periodic auto-sync
  syncTimer = setInterval(() => {
    if (getMeta('user')) syncNow().catch(() => {});
  }, SYNC_INTERVAL_MS);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (syncTimer) clearInterval(syncTimer);
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});
