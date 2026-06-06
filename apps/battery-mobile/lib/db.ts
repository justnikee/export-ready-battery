import * as SQLite from "expo-sqlite";
import type { Passport, PendingAction, PendingActionType } from "./types";

let db: SQLite.SQLiteDatabase | null = null;

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("battery_mobile.db");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS scanned_passports (
      uuid TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      scanned_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_actions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  return db;
}

// ------------------------------------------------------------------
// Scanned Passports (offline cache, last 50)
// ------------------------------------------------------------------

export async function insertScannedPassport(passport: Passport): Promise<void> {
  const database = await openDatabase();
  const now = Date.now();

  await database.runAsync(
    `INSERT OR REPLACE INTO scanned_passports (uuid, data, scanned_at) VALUES (?, ?, ?)`,
    [passport.uuid, JSON.stringify(passport), now]
  );

  // Keep only last 50
  const count = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM scanned_passports`
  );
  if (count && count.count > 50) {
    await database.runAsync(
      `DELETE FROM scanned_passports WHERE uuid IN (
        SELECT uuid FROM scanned_passports ORDER BY scanned_at ASC LIMIT ?
      )`,
      [count.count - 50]
    );
  }
}

export async function getScannedPassport(
  uuid: string
): Promise<Passport | null> {
  const database = await openDatabase();
  const row = await database.getFirstAsync<{ data: string }>(
    `SELECT data FROM scanned_passports WHERE uuid = ?`,
    [uuid]
  );
  if (!row) return null;
  try {
    return JSON.parse(row.data) as Passport;
  } catch {
    return null;
  }
}

export async function getAllScannedPassports(): Promise<
  { passport: Passport; scanned_at: number }[]
> {
  const database = await openDatabase();
  const rows = await database.getAllAsync<{ data: string; scanned_at: number }>(
    `SELECT data, scanned_at FROM scanned_passports ORDER BY scanned_at DESC`
  );
  return rows.map((r) => ({
    passport: JSON.parse(r.data) as Passport,
    scanned_at: r.scanned_at,
  }));
}

// ------------------------------------------------------------------
// Pending Actions (offline queue)
// ------------------------------------------------------------------

export async function insertPendingAction(
  action: PendingAction
): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    `INSERT INTO pending_actions (id, type, payload, status, retry_count, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      action.id,
      action.type,
      action.payload,
      action.status,
      action.retry_count,
      action.created_at,
    ]
  );
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const database = await openDatabase();
  return await database.getAllAsync<PendingAction>(
    `SELECT * FROM pending_actions ORDER BY created_at DESC`
  );
}

export async function getUnsyncedActions(): Promise<PendingAction[]> {
  const database = await openDatabase();
  return await database.getAllAsync<PendingAction>(
    `SELECT * FROM pending_actions WHERE status = 'pending' ORDER BY created_at ASC`
  );
}

export async function updateActionStatus(
  id: string,
  status: PendingAction["status"],
  retryCount?: number
): Promise<void> {
  const database = await openDatabase();
  if (retryCount !== undefined) {
    await database.runAsync(
      `UPDATE pending_actions SET status = ?, retry_count = ? WHERE id = ?`,
      [status, retryCount, id]
    );
  } else {
    await database.runAsync(
      `UPDATE pending_actions SET status = ? WHERE id = ?`,
      [status, id]
    );
  }
}

export async function deleteAction(id: string): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(`DELETE FROM pending_actions WHERE id = ?`, [id]);
}
