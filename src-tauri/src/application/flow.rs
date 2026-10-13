use tauri::Manager;
use crate::{flow_contracts::{FlowAction, FlowSnapshot}, infrastructure::sidecar::Sidecar};
use super::diagnostics::RuntimeState;

#[tauri::command]
pub async fn flow_action(app: tauri::AppHandle, action: FlowAction) -> Result<FlowSnapshot, String> {
    action.validate()?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<RuntimeState>();
        let mut slot = state.0.try_lock().map_err(|_| "FLOW_BUSY")?;
        if slot.is_none() { *slot = Some(Sidecar::spawn(&app)?); }
        let result = slot.as_mut().ok_or("SIDECAR_MISSING")?.flow(action);
        if result.is_err() { *slot = None; }
        result
    }).await.map_err(|_| "FLOW_TASK_FAILED")?
}
