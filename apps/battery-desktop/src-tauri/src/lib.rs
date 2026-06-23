pub mod csv_import;
pub mod db;
pub mod printer;
pub mod sync;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let conn = db::init_db(app.handle())?;
            app.manage(db::DbState {
                conn: std::sync::Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Printer
            printer::detect_usb_printers,
            printer::generate_zpl,
            printer::print_zpl,
            printer::print_test_page,
            // DB — Print Jobs
            db::create_print_job,
            db::list_pending_jobs,
            db::mark_job_printed,
            db::delete_job,
            // DB — Local Batches
            db::create_local_batch,
            db::list_local_batches,
            // DB — Sync Queue
            db::enqueue_sync_action,
            db::list_sync_queue,
            db::update_sync_status,
            // CSV Import
            csv_import::parse_csv,
            csv_import::generate_serials_from_csv,
            // Sync
            sync::sync_now,
            sync::check_connectivity,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
