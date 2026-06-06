use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_http::reqwest;

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub synced: usize,
    pub failed: usize,
    pub message: String,
}

/// Flush all pending sync queue items to the central API.
/// Called when connectivity is restored or user hits "Sync Now".
#[tauri::command]
pub async fn sync_now(_app: AppHandle) -> Result<SyncResult, String> {
    // This is a simplified sync — in production you'd iterate the SQLite
    // sync_queue table and POST each action to the API.
    // For now, return a mock result since we need the frontend to drive
    // the actual sync via its own API client (which has the JWT token).

    Ok(SyncResult {
        synced: 0,
        failed: 0,
        message: "Use frontend sync — Rust sync needs JWT from SecureStore".to_string(),
    })
}

/// Check if the central API is reachable.
#[tauri::command]
pub async fn check_connectivity(api_url: String) -> bool {
    match reqwest::get(format!("{}/health", api_url)).await {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}
