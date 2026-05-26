import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';

// Resolve DB path relative to project root (where npm start is run from)
const dbPath = path.join(__dirname, '..', '..', 'data', 'dockmaster.db');
const db = new sqlite3.Database(dbPath);

export const dbAll = promisify(db.all.bind(db)) as <T = unknown>(sql: string, params?: Record<string, unknown>) => Promise<T[]>;
export const dbGet = promisify(db.get.bind(db)) as <T = unknown>(sql: string, params?: Record<string, unknown>) => Promise<T | undefined>;
export const dbRun = promisify(db.run.bind(db)) as (sql: string, params?: Record<string, unknown>) => Promise<sqlite3.RunResult>;
export const dbExec = promisify(db.exec.bind(db)) as (sql: string) => Promise<void>;

export async function initDatabase(): Promise<void> {
  await dbExec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT NOT NULL,
      lat REAL,
      lng REAL,
      notes TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS docks (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      material TEXT CHECK(material IN ('wood','metal','aluminum')),
      length INTEGER,
      width INTEGER,
      boat_lift_size INTEGER,
      boat_lift_position TEXT CHECK(boat_lift_position IN ('left','right','center','end')),
      special_notes TEXT,
      google_maps_url TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      dock_id TEXT REFERENCES docks(id) ON DELETE SET NULL,
      type TEXT CHECK(type IN ('install','remove','service')),
      scheduled_date TEXT,
      crew TEXT,
      notes TEXT,
      waterway_access TEXT,
      previous_year_notes TEXT,
      status TEXT CHECK(status IN ('pending','in_progress','completed','cancelled')),
      priority TEXT CHECK(priority IN ('normal','urgent')),
      created_at INTEGER,
      completed_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_docks_customer ON docks(customer_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  `);
}
