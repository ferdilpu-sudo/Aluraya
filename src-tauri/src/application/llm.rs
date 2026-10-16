use tauri::Manager;
use crate::{llm_contracts::{LlmAction, LlmSnapshot}, infrastructure::sidecar::Sidecar};
use super::diagnostics::RuntimeState;
#[tauri::command]
pub async fn llm_action(app: tauri::AppHandle, action: LlmAction) -> Result<LlmSnapshot, String> {
    action.validate()?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<RuntimeState>();
        let mut slot = state.0.try_lock().map_err(|_| "LLM_BUSY")?;
        if slot.is_none() { *slot = Some(Sidecar::spawn(&app)?); }
        let result = slot.as_mut().ok_or("SIDECAR_MISSING")?.llm(action);
        if result.is_err() { *slot = None; }
        result
    }).await.map_err(|_| "LLM_TASK_FAILED")?
}
