#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod application;
mod contracts;
mod infrastructure;

use application::diagnostics::{inspect_runtime, RuntimeState};
use tauri::Manager;

fn main() {
    let app = tauri::Builder::default()
        .manage(RuntimeState::default())
        .invoke_handler(tauri::generate_handler![inspect_runtime])
        .build(tauri::generate_context!())
        .expect("Unable to initialize Aluraya Studio");
    app.run(|handle, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            if let Ok(mut slot) = handle.state::<RuntimeState>().0.lock() { *slot = None; }
        }
    });
}
