#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod application;
mod contracts;
mod chat_contracts;
mod infrastructure;

use application::diagnostics::{inspect_runtime, RuntimeState};
use tauri::Manager;
use application::chat::chat_action;

fn main() {
    let app = tauri::Builder::default()
        .manage(RuntimeState::default())
        .on_window_event(|window, event| {
            if window.label() == "main" && matches!(event, tauri::WindowEvent::Destroyed) {
                window.app_handle().exit(0);
            }
        })
        .invoke_handler(tauri::generate_handler![inspect_runtime, chat_action])
        .build(tauri::generate_context!())
        .expect("Unable to initialize Aluraya Studio");
    app.run(|handle, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            if let Ok(mut slot) = handle.state::<RuntimeState>().0.lock() { *slot = None; }
        }
    });
}
