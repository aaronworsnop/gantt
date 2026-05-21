use crate::error::{AppError, AppResult};
use directories::BaseDirs;
use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

/// Where the app stores its SQLite database. We deliberately do NOT use Tauri's
/// `app_data_dir()` (which folders by bundle identifier, e.g.
/// `%APPDATA%/com.foo.bar/`) — instead we use the conventional Windows
/// `%APPDATA%/Gantt/` path so the folder has a clean human-readable name and is
/// independent of whatever the bundle identifier happens to be.
fn data_dir(_app: &AppHandle) -> AppResult<PathBuf> {
    let base = BaseDirs::new()
        .ok_or_else(|| AppError::Other("could not resolve base directories".into()))?;
    let dir = base.data_dir().join("Gantt");
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn open(app: &AppHandle) -> AppResult<Connection> {
    let path = data_dir(app)?.join("gantt.sqlite");
    let conn = Connection::open(path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    migrate(&conn)?;
    Ok(conn)
}

fn migrate(conn: &Connection) -> AppResult<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT '',
            color TEXT NOT NULL DEFAULT 'blueberry',
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS periods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
            start_day INTEGER NOT NULL,
            end_day INTEGER NOT NULL,
            CHECK (end_day >= start_day)
        );

        CREATE INDEX IF NOT EXISTS periods_entry_idx ON periods(entry_id);
        "#,
    )?;
    Ok(())
}
