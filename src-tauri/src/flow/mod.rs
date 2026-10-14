pub mod policy;
pub mod profiles;
mod windows;

use std::{sync::Mutex, time::{SystemTime, UNIX_EPOCH}};
use tauri::Manager;
use crate::flow_contracts::{FlowAction, FlowSnapshot, Observation, Page};
use profiles::Profiles;
use windows::Session;

#[derive(Default)]
pub struct FlowState(pub Mutex<BrowserState>);
#[derive(Default)]
pub struct BrowserState {
    profiles: Option<Profiles>,
    active: Option<Session>,
    page: usize,
}
impl BrowserState {
    pub fn act(&mut self, app: &tauri::AppHandle, action: FlowAction) -> Result<FlowSnapshot, String> {
        if !cfg!(windows) { return Err("WINDOWS_REQUIRED".into()); }
        if self.profiles.is_none() {
            let root = app.path().app_local_data_dir().map_err(|_| "STORAGE_ERROR")?.join("flow-webview2");
            self.profiles = Some(Profiles::load(root)?);
        }
        if self.active.as_ref().is_some_and(|s| s.windows(app).is_empty()) { self.active = None; }
        match action {
            FlowAction::Create {} => {
                let store = self.profiles.as_mut().ok_or("STORAGE_ERROR")?;
                store.create()?;
                self.page = (store.items.len() - 1) / 10;
            }
            FlowAction::Profiles { page } => {
                let count = self.profiles.as_ref().ok_or("STORAGE_ERROR")?.items.len();
                self.page = (page as usize).min(count.saturating_sub(1) / 10);
            }
            FlowAction::Open { profile_id } => {
                if self.active.is_some() { return Err("PROFILE_ACTIVE".into()); }
                let directory = self.profiles.as_ref().ok_or("STORAGE_ERROR")?.directory(&profile_id)?;
                let session = Session::new(profile_id, directory);
                // Own the session before opening. If cleanup fails, retain ownership.
                self.active = Some(session.clone());
                if let Err(e) = session.open(app) {
                    let _ = session.close(app);
                    return Err(e);
                }
            }
            FlowAction::Close {} => {
                if let Some(session) = &self.active { session.close(app)?; }
                // Do not release ownership until native destruction is observed.
            }
            FlowAction::Inspect {} | FlowAction::Observe {} => {}
        }
        self.snapshot(app)
    }
    fn snapshot(&self, app: &tauri::AppHandle) -> Result<FlowSnapshot, String> {
        let store = self.profiles.as_ref().ok_or("STORAGE_ERROR")?;
        let windows = self.active.as_ref().map(|s| s.windows(app)).unwrap_or_default();
        let open = !windows.is_empty();
        let observation = if open {
            let best = windows.iter().filter_map(|w| w.url().ok())
                .max_by_key(|url| policy::priority(policy::page(url)));
            Some(Observation {
                checked_at_ms: SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64,
                page: best.as_ref().map(policy::page).unwrap_or(Page::Other),
                origin: best.as_ref().and_then(|u| u.host_str().map(|_| u.origin().ascii_serialization())),
            })
        } else { None };
        let error = self.active.as_ref().and_then(|s| s.error.lock().ok().and_then(|e| e.clone()));
        Ok(FlowSnapshot {
            schema_version: 2, runtime: "webview2",
            profiles: store.items.iter().skip(self.page * 10).take(10).cloned().collect(),
            profile_count: store.items.len(), profile_page: self.page,
            active_profile_id: if open { self.active.as_ref().map(|s| s.profile_id.clone()) } else { None },
            browser_open: open, observation, generation_ready: false, error,
        })
    }
}
