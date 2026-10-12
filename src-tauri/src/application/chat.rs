use tauri::Manager;
use crate::{chat_contracts::{ChatAction, ChatSnapshot}, infrastructure::sidecar::Sidecar};
use super::diagnostics::RuntimeState;

#[tauri::command]
pub async fn chat_action(app: tauri::AppHandle, action: ChatAction) -> Result<ChatSnapshot, String> {
    action.validate()?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<RuntimeState>();
        let mut slot = state.0.try_lock().map_err(|_| "CHAT_BUSY")?;
        if slot.is_none() { *slot = Some(Sidecar::spawn(&app)?); }
        let result = slot.as_mut().ok_or("SIDECAR_MISSING")?.chat(action);
        if result.is_err() { *slot = None; }
        result
    }).await.map_err(|_| "CHAT_TASK_FAILED")?
}
