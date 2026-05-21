use crate::error::AppResult;
use crate::AppState;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct Period {
    pub id: i64,
    pub entry_id: i64,
    pub start_day: i64,
    pub end_day: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Entry {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub created_at: i64,
    pub periods: Vec<Period>,
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Read all periods for an entry, sorted by (start_day, id).
fn read_periods(conn: &Connection, entry_id: i64) -> AppResult<Vec<Period>> {
    let mut stmt = conn.prepare(
        "SELECT id, entry_id, start_day, end_day FROM periods \
         WHERE entry_id = ?1 ORDER BY start_day, id",
    )?;
    let rows = stmt.query_map([entry_id], |r| {
        Ok(Period {
            id: r.get(0)?,
            entry_id: r.get(1)?,
            start_day: r.get(2)?,
            end_day: r.get(3)?,
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

/// Merge any overlapping periods for the given entry. Two periods overlap when
/// they share at least one day (touching but non-overlapping ranges are left
/// alone, so [1..5] + [6..8] stays as two periods).
///
/// When merging, the lowest period id in a group is kept and updated to span
/// the union; the other ids are deleted. This keeps React keys stable for the
/// "primary" surviving bar so width/position transitions feel smooth.
fn coalesce_periods(conn: &Connection, entry_id: i64) -> AppResult<Vec<Period>> {
    let periods = read_periods(conn, entry_id)?;
    if periods.len() < 2 {
        return Ok(periods);
    }

    // Walk in start_day order, grouping overlaps.
    struct Group {
        start: i64,
        end: i64,
        ids: Vec<i64>,
    }
    let mut groups: Vec<Group> = Vec::new();
    for p in periods {
        if let Some(last) = groups.last_mut() {
            if p.start_day <= last.end {
                last.end = last.end.max(p.end_day);
                last.ids.push(p.id);
                continue;
            }
        }
        groups.push(Group {
            start: p.start_day,
            end: p.end_day,
            ids: vec![p.id],
        });
    }

    for g in &groups {
        let keeper = *g.ids.iter().min().expect("group has at least one id");
        conn.execute(
            "UPDATE periods SET start_day = ?1, end_day = ?2 WHERE id = ?3",
            rusqlite::params![g.start, g.end, keeper],
        )?;
        for &id in &g.ids {
            if id != keeper {
                conn.execute(
                    "DELETE FROM periods WHERE id = ?1",
                    rusqlite::params![id],
                )?;
            }
        }
    }

    read_periods(conn, entry_id)
}

#[tauri::command]
pub fn list_entries(state: State<'_, AppState>) -> AppResult<Vec<Entry>> {
    let conn = state.db.lock();
    let mut entry_stmt =
        conn.prepare("SELECT id, name, color, created_at FROM entries ORDER BY id")?;
    let entry_rows = entry_stmt.query_map([], |r| {
        Ok(Entry {
            id: r.get(0)?,
            name: r.get(1)?,
            color: r.get(2)?,
            created_at: r.get(3)?,
            periods: Vec::new(),
        })
    })?;
    let mut entries: Vec<Entry> = entry_rows.collect::<Result<_, _>>()?;

    let mut period_stmt = conn.prepare(
        "SELECT id, entry_id, start_day, end_day FROM periods ORDER BY start_day, end_day",
    )?;
    let period_rows = period_stmt.query_map([], |r| {
        Ok(Period {
            id: r.get(0)?,
            entry_id: r.get(1)?,
            start_day: r.get(2)?,
            end_day: r.get(3)?,
        })
    })?;
    for p in period_rows {
        let p = p?;
        if let Some(e) = entries.iter_mut().find(|e| e.id == p.entry_id) {
            e.periods.push(p);
        }
    }
    Ok(entries)
}

#[tauri::command]
pub fn create_entry(state: State<'_, AppState>, name: String, color: String) -> AppResult<Entry> {
    let conn = state.db.lock();
    let created_at = now_secs();
    conn.execute(
        "INSERT INTO entries (name, color, created_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![name, color, created_at],
    )?;
    let id = conn.last_insert_rowid();
    Ok(Entry {
        id,
        name,
        color,
        created_at,
        periods: Vec::new(),
    })
}

#[tauri::command]
pub fn update_entry(
    state: State<'_, AppState>,
    id: i64,
    name: Option<String>,
    color: Option<String>,
) -> AppResult<()> {
    let conn = state.db.lock();
    if let Some(n) = name {
        conn.execute(
            "UPDATE entries SET name = ?1 WHERE id = ?2",
            rusqlite::params![n, id],
        )?;
    }
    if let Some(c) = color {
        conn.execute(
            "UPDATE entries SET color = ?1 WHERE id = ?2",
            rusqlite::params![c, id],
        )?;
    }
    Ok(())
}

#[tauri::command]
pub fn delete_entry(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let conn = state.db.lock();
    conn.execute("DELETE FROM entries WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}

#[tauri::command]
pub fn create_period(
    state: State<'_, AppState>,
    entry_id: i64,
    start_day: i64,
    end_day: i64,
) -> AppResult<Vec<Period>> {
    let conn = state.db.lock();
    let (s, e) = if end_day >= start_day {
        (start_day, end_day)
    } else {
        (end_day, start_day)
    };
    conn.execute(
        "INSERT INTO periods (entry_id, start_day, end_day) VALUES (?1, ?2, ?3)",
        rusqlite::params![entry_id, s, e],
    )?;
    coalesce_periods(&conn, entry_id)
}

#[tauri::command]
pub fn update_period(
    state: State<'_, AppState>,
    id: i64,
    start_day: i64,
    end_day: i64,
) -> AppResult<Vec<Period>> {
    let conn = state.db.lock();
    let (s, e) = if end_day >= start_day {
        (start_day, end_day)
    } else {
        (end_day, start_day)
    };
    let entry_id: i64 = conn.query_row(
        "SELECT entry_id FROM periods WHERE id = ?1",
        rusqlite::params![id],
        |r| r.get(0),
    )?;
    conn.execute(
        "UPDATE periods SET start_day = ?1, end_day = ?2 WHERE id = ?3",
        rusqlite::params![s, e, id],
    )?;
    coalesce_periods(&conn, entry_id)
}

#[tauri::command]
pub fn delete_period(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let conn = state.db.lock();
    conn.execute("DELETE FROM periods WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}
