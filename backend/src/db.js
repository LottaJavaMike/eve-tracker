import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'eve-tracker.db');

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS character (
  id INTEGER PRIMARY KEY,
  character_id INTEGER UNIQUE,
  name TEXT,
  corporation_id INTEGER,
  corporation_name TEXT,
  portrait_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TEXT,
  scopes TEXT,
  connected_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'planned',
  priority TEXT NOT NULL DEFAULT 'normal',
  start_date TEXT,
  due_date TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  duration_minutes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS industry_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  esi_job_id INTEGER UNIQUE,
  activity_type TEXT,
  blueprint_type_id INTEGER,
  blueprint_name TEXT,
  output_type_id INTEGER,
  output_name TEXT,
  runs INTEGER,
  status TEXT,
  start_date TEXT,
  end_date TEXT,
  facility_name TEXT,
  cost REAL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS blueprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  esi_item_id INTEGER UNIQUE,
  type_id INTEGER,
  type_name TEXT,
  material_efficiency INTEGER,
  time_efficiency INTEGER,
  quantity INTEGER,
  is_bpo INTEGER,
  location_name TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS pi_colonies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  planet_id INTEGER UNIQUE,
  planet_name TEXT,
  planet_type TEXT,
  upgrade_level INTEGER,
  num_pins INTEGER,
  expiry_date TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS wallet_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  balance REAL,
  captured_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  esi_item_id INTEGER UNIQUE,
  type_id INTEGER,
  type_name TEXT,
  quantity INTEGER,
  location_id INTEGER,
  location_name TEXT,
  location_flag TEXT,
  unit_price REAL,
  total_value REAL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS skill_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER,
  skill_name TEXT,
  queue_position INTEGER,
  finished_level INTEGER,
  level_start_sp INTEGER,
  level_end_sp INTEGER,
  training_start_sp INTEGER,
  start_date TEXT,
  finish_date TEXT,
  synced_at TEXT
);
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('character', 'current_system_id', 'INTEGER');
ensureColumn('character', 'current_system_name', 'TEXT');
ensureColumn('character', 'location_synced_at', 'TEXT');
