const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Path to SQLite database file
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'apartment.db');
const db = new DatabaseSync(dbPath);

// Enable foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initializeDatabase() {
  db.exec(`
    -- Flats table
    CREATE TABLE IF NOT EXISTS flats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flat_number TEXT NOT NULL UNIQUE,
      block TEXT NOT NULL,
      floor INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Occupied', -- Occupied, Vacant, Under Maintenance
      created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime'))
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL, -- admin, security, resident
      flat_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL
    );

    -- Visitors table
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      flat_id INTEGER NOT NULL,
      purpose TEXT NOT NULL, -- Guest / Personal, Delivery, Service / Maintenance, Cab / Taxi, Other
      vehicle_number TEXT,
      entry_time TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
      exit_time TEXT,
      status TEXT NOT NULL DEFAULT 'Inside', -- Inside, Exited
      registered_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE RESTRICT,
      FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Maintenance bills table
    CREATE TABLE IF NOT EXISTS maintenance_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flat_id INTEGER NOT NULL,
      billing_month TEXT NOT NULL, -- e.g. "October 2026"
      amount REAL NOT NULL,
      due_date TEXT NOT NULL, -- YYYY-MM-DD
      status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Paid, Overdue
      payment_date TEXT,
      payment_remarks TEXT,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
    );

    -- Complaints table
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      flat_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- Plumbing, Electrical, Cleaning, Lift, Security, Other
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium', -- Low, Medium, High
      status TEXT NOT NULL DEFAULT 'Submitted', -- Submitted, In Progress, Resolved
      admin_response TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
    );
  `);
}

// Helper query wrappers for clean and consistent usage
const queryAll = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

const queryOne = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

const execute = (sql, params = []) => {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return {
    changes: result.changes,
    lastInsertRowid: Number(result.lastInsertRowid)
  };
};

// Initialize schema on load
initializeDatabase();

module.exports = {
  db,
  queryAll,
  queryOne,
  execute,
  initializeDatabase
};
