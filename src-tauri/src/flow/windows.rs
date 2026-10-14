use std::{path::PathBuf, sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}}};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent};
use tauri::webview::{NewWindowFeatures, NewWindowResponse};
use super::policy;

#[derive(Clone)]
pub struct Session {
    pub profile_id: String,
    pub prefix: String,
    pub root_label: String,
    directory: PathBuf,
    closing: Arc<AtomicBool>,
    pub error: Arc<Mutex<Option<String>>>,
}
impl Session {
    pub fn new(profile_id: String, directory: PathBuf) -> Self {
        let prefix = format!("flow-{}-", uuid::Uuid::new_v4());
        Self { profile_id, root_label: format!("{prefix}main"), prefix, directory,
            closing: Arc::new(AtomicBool::new(false)), error: Arc::new(Mutex::new(None)) }
    }
    pub fn windows(&self, app: &AppHandle) -> Vec<WebviewWindow> {
        app.webview_windows().into_values().filter(|w| w.label().starts_with(&self.prefix)).collect()
    }
    pub fn close(&self, app: &AppHandle) -> Result<(), String> {
        self.closing.store(true, Ordering::SeqCst);
        let mut failed = false;
        for window in self.windows(app) { failed |= window.destroy().is_err(); }
        if failed { Err("BROWSER_CLOSE_FAILED".into()) } else { Ok(()) }
    }
    fn record_error(&self, code: &str) {
        if let Ok(mut error) = self.error.lock() { *error = Some(code.into()); }
    }
    pub fn open(&self, app: &AppHandle) -> Result<(), String> {
        std::fs::create_dir_all(&self.directory).map_err(|_| "STORAGE_ERROR")?;
        self.build(app, &self.root_label, None)?;
        Ok(())
    }
    fn build(&self, app: &AppHandle, label: &str, features: Option<NewWindowFeatures>) -> Result<WebviewWindow, String> {
        let is_root = features.is_none();
        let initial = if is_root { policy::FLOW_URL } else { "about:blank" };
        let url = initial.parse().map_err(|_| "BROWSER_OPEN_FAILED")?;
        let navigation_app = app.clone();
        let navigation_label = label.to_string();
        let navigation_session = self.clone();
        let popup_app = app.clone();
        let popup_session = self.clone();
        let mut builder = WebviewWindowBuilder::new(app, label, WebviewUrl::External(url))
            .title("Aluraya Flow · labs.google")
            .inner_size(1100.0, 760.0)
            .data_directory(self.directory.clone())
            // Use standard WebView2 browser arguments, including its security defaults.
            .additional_browser_args("")
            .devtools(false)
            .disable_drag_drop_handler()
            .on_download(|_, _| false)
            .on_navigation(move |url| {
                if navigation_session.closing.load(Ordering::SeqCst) { return false; }
                if !policy::allowed(url) {
                    navigation_session.record_error("NAVIGATION_BLOCKED");
                    return false;
                }
                if let Some(window) = navigation_app.get_webview_window(&navigation_label) {
                    // Origin only: no auth query, fragments, email or page-supplied titles.
                    let host = url.host_str().unwrap_or("halaman kosong");
                    let _ = window.set_title(&format!("Aluraya Flow · {host}"));
                }
                true
            })
            .on_new_window(move |url, features| {
                if popup_session.closing.load(Ordering::SeqCst) || !policy::allowed(&url)
                    || popup_app.get_webview_window(&popup_session.root_label).is_none()
                    || popup_session.windows(&popup_app).len() >= 5 {
                    popup_session.record_error("POPUP_BLOCKED");
                    return NewWindowResponse::Deny;
                }
                let label = format!("{}{}", popup_session.prefix, uuid::Uuid::new_v4());
                match popup_session.build(&popup_app, &label, Some(features)) {
                    Ok(window) => {
                        if popup_session.closing.load(Ordering::SeqCst) {
                            let _ = window.destroy();
                            NewWindowResponse::Deny
                        } else { NewWindowResponse::Create { window } }
                    }
                    Err(_) => {
                        popup_session.record_error("POPUP_FAILED");
                        NewWindowResponse::Deny
                    }
                }
            });
        // Tauri passes the opener's WebView2 environment via window_features.
        // Start blank: the provider supplies popup content after NewWindow is assigned.
        if let Some(features) = features { builder = builder.window_features(features); }
        let window = builder.build().map_err(|_| "BROWSER_OPEN_FAILED")?;
        if is_root {
            let handle = app.clone();
            let session = self.clone();
            window.on_window_event(move |event| {
                if matches!(event, WindowEvent::Destroyed) {
                    let _ = session.close(&handle);
                }
            });
        }
        Ok(window)
    }
}
