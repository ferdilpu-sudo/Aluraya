use std::sync::Mutex;
use tauri::Manager;
use crate::{contracts::Diagnostics, infrastructure::sidecar::Sidecar};

#[derive(Default)]
pub struct RuntimeState(pub Mutex<Option<Sidecar>>);

#[tauri::command]
pub async fn inspect_runtime(app: tauri::AppHandle) -> Result<Diagnostics, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<RuntimeState>();
        // Reject concurrent requests instead of queueing unbounded diagnostic work.
        let mut slot = state.0.try_lock().map_err(|_| "DIAGNOSTICS_BUSY")?;
        if slot.is_none() { *slot = Some(Sidecar::spawn(&app)?); }
        let result = slot.as_mut().ok_or("SIDECAR_MISSING")?.inspect();
        if result.is_err() { *slot = None; }
        result
    }).await.map_err(|_| "DIAGNOSTICS_TASK_FAILED")?
}
