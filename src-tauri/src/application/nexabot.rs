use tauri::Manager;
use crate::{nexabot_contracts::{NexaAction, NexaSnapshot}, infrastructure::sidecar::Sidecar};
use super::diagnostics::RuntimeState;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NexaResult { snapshot: NexaSnapshot, media_root: String }

#[tauri::command]
pub async fn nexabot_action(app: tauri::AppHandle, window: tauri::WebviewWindow, action: NexaAction) -> Result<NexaResult, String> {
    if window.label() != "main" { return Err("NEXABOT_CALLER_DENIED".into()); }
    action.validate()?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<RuntimeState>();
        let mut slot = state.0.try_lock().map_err(|_| "BUSY")?;
        if slot.is_none() { *slot = Some(Sidecar::spawn(&app)?); }
        let result = slot.as_mut().ok_or("SIDECAR_MISSING")?.nexabot(action);
        if result.is_err() { *slot = None; }
        let snapshot = result?;
        let media_root = app.path().app_local_data_dir().map_err(|_| "STORAGE_ERROR")?.join("nexabot").join("media");
        Ok(NexaResult { snapshot, media_root: media_root.to_string_lossy().into_owned() })
    }).await.map_err(|_| "NEXABOT_TASK_FAILED")?
}
