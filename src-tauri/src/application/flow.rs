use tauri::Manager;
use crate::{flow_contracts::{FlowAction, FlowSnapshot}, flow::FlowState};

#[tauri::command]
pub async fn flow_action(app: tauri::AppHandle, window: tauri::WebviewWindow, action: FlowAction) -> Result<FlowSnapshot, String> {
    // Capabilities already exclude provider windows; also enforce the local caller here.
    if window.label() != "main" { return Err("FLOW_CALLER_DENIED".into()); }
    action.validate()?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<FlowState>();
        let mut browser = state.0.try_lock().map_err(|_| "BUSY")?;
        browser.act(&app, action)
    }).await.map_err(|_| "FLOW_TASK_FAILED")?
}
