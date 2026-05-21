mod db;
mod commands;
mod error;

use parking_lot::Mutex;
use std::sync::Arc;
use tauri::Manager;

pub struct AppState {
    pub db: Arc<Mutex<rusqlite::Connection>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let conn = db::open(app.handle())?;
            app.manage(AppState {
                db: Arc::new(Mutex::new(conn)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_entries,
            commands::create_entry,
            commands::update_entry,
            commands::delete_entry,
            commands::create_period,
            commands::update_period,
            commands::delete_period,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
