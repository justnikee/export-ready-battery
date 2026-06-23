use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

type DbResult<T> = Result<T, String>;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintJob {
    pub id: String,
    pub batch_id: String,
    pub serial_number: String,
    pub zpl_data: String,
    pub status: String,
    pub created_at: String,
    pub printed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalBatch {
    pub id: String,
    pub name: String,
    pub specs_json: String,
    pub status: String,
    pub synced: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: String,
    pub action_type: String,
    pub payload_json: String,
    pub status: String,
    pub retry_count: i32,
    pub created_at: String,
}

fn db_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let mut path = app_handle.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push("desktop.db");
    path
}

pub fn init_db(app_handle: &tauri::AppHandle) -> DbResult<Connection> {
    let path = db_path(app_handle);
    let conn = Connection::open(path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS print_jobs (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL,
            serial_number TEXT NOT NULL,
            zpl_data TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            printed_at TEXT
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS local_batches (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            specs_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            synced INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            action_type TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            retry_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    Ok(conn)
}

// ------------------------------------------------------------------
// Print Jobs
// ------------------------------------------------------------------

#[tauri::command]
pub fn create_print_job(
    state: tauri::State<'_, DbState>,
    batch_id: String,
    serial_number: String,
    zpl_data: String,
) -> DbResult<PrintJob> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let conn = state.conn.lock().unwrap();

    conn.execute(
        "INSERT INTO print_jobs (id, batch_id, serial_number, zpl_data, status, created_at)
         VALUES (?1, ?2, ?3, ?4, 'pending', ?5)",
        [&id, &batch_id, &serial_number, &zpl_data, &now],
    ).map_err(|e| e.to_string())?;

    Ok(PrintJob {
        id,
        batch_id,
        serial_number,
        zpl_data,
        status: "pending".to_string(),
        created_at: now,
        printed_at: None,
    })
}

#[tauri::command]
pub fn list_pending_jobs(state: tauri::State<'_, DbState>) -> DbResult<Vec<PrintJob>> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, batch_id, serial_number, zpl_data, status, created_at, printed_at
         FROM print_jobs WHERE status = 'pending' ORDER BY created_at"
    ).map_err(|e| e.to_string())?;

    let jobs = stmt.query_map([], |row| {
        Ok(PrintJob {
            id: row.get(0)?,
            batch_id: row.get(1)?,
            serial_number: row.get(2)?,
            zpl_data: row.get(3)?,
            status: row.get(4)?,
            created_at: row.get(5)?,
            printed_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(jobs)
}

#[tauri::command]
pub fn mark_job_printed(state: tauri::State<'_, DbState>, id: String) -> DbResult<()> {
    let now = chrono::Utc::now().to_rfc3339();
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "UPDATE print_jobs SET status = 'printed', printed_at = ?1 WHERE id = ?2",
        [&now, &id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_job(state: tauri::State<'_, DbState>, id: String) -> DbResult<()> {
    let conn = state.conn.lock().unwrap();
    conn.execute("DELETE FROM print_jobs WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ------------------------------------------------------------------
// Local Batches
// ------------------------------------------------------------------

#[tauri::command]
pub fn create_local_batch(
    state: tauri::State<'_, DbState>,
    id: String,
    name: String,
    specs_json: String,
) -> DbResult<LocalBatch> {
    let now = chrono::Utc::now().to_rfc3339();
    let conn = state.conn.lock().unwrap();

    conn.execute(
        "INSERT INTO local_batches (id, name, specs_json, status, synced, created_at)
         VALUES (?1, ?2, ?3, 'draft', 0, ?4)",
        [&id, &name, &specs_json, &now],
    ).map_err(|e| e.to_string())?;

    Ok(LocalBatch {
        id,
        name,
        specs_json,
        status: "draft".to_string(),
        synced: false,
        created_at: now,
    })
}

#[tauri::command]
pub fn list_local_batches(state: tauri::State<'_, DbState>) -> DbResult<Vec<LocalBatch>> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, name, specs_json, status, synced, created_at FROM local_batches ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let batches = stmt.query_map([], |row| {
        Ok(LocalBatch {
            id: row.get(0)?,
            name: row.get(1)?,
            specs_json: row.get(2)?,
            status: row.get(3)?,
            synced: row.get::<_, i32>(4)? != 0,
            created_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(batches)
}

// ------------------------------------------------------------------
// Sync Queue
// ------------------------------------------------------------------

#[tauri::command]
pub fn enqueue_sync_action(
    state: tauri::State<'_, DbState>,
    action_type: String,
    payload_json: String,
) -> DbResult<SyncQueueItem> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let conn = state.conn.lock().unwrap();

    conn.execute(
        "INSERT INTO sync_queue (id, action_type, payload_json, status, retry_count, created_at)
         VALUES (?1, ?2, ?3, 'pending', 0, ?4)",
        [&id, &action_type, &payload_json, &now],
    ).map_err(|e| e.to_string())?;

    Ok(SyncQueueItem {
        id,
        action_type,
        payload_json,
        status: "pending".to_string(),
        retry_count: 0,
        created_at: now,
    })
}

#[tauri::command]
pub fn list_sync_queue(state: tauri::State<'_, DbState>) -> DbResult<Vec<SyncQueueItem>> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, action_type, payload_json, status, retry_count, created_at FROM sync_queue ORDER BY created_at"
    ).map_err(|e| e.to_string())?;

    let items = stmt.query_map([], |row| {
        Ok(SyncQueueItem {
            id: row.get(0)?,
            action_type: row.get(1)?,
            payload_json: row.get(2)?,
            status: row.get(3)?,
            retry_count: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(items)
}

#[tauri::command]
pub fn update_sync_status(
    state: tauri::State<'_, DbState>,
    id: String,
    status: String,
    retry_count: Option<i32>,
) -> DbResult<()> {
    let conn = state.conn.lock().unwrap();
    if let Some(rc) = retry_count {
        conn.execute(
            "UPDATE sync_queue SET status = ?1, retry_count = ?2 WHERE id = ?3",
            [&status, &rc.to_string(), &id],
        ).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "UPDATE sync_queue SET status = ?1 WHERE id = ?2",
            [&status, &id],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}
