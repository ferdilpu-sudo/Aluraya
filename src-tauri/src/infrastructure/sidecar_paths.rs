use std::path::PathBuf;
use tauri::Manager;

pub fn resolve(app: &tauri::AppHandle) -> Result<(PathBuf, PathBuf), String> {
    if !cfg!(target_os = "windows") || !cfg!(target_arch = "x86_64") {
        return Err("WINDOWS_X64_REQUIRED".into());
    }
    let (runtime, script) = if cfg!(debug_assertions) {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        (root.join("binaries/aluraya-node-x86_64-pc-windows-msvc.exe"),
         root.join("resources/sidecar.cjs"))
    } else {
        let exe = std::env::current_exe().map_err(|_| "RUNTIME_PATH_ERROR")?;
        let parent = exe.parent().ok_or("RUNTIME_PATH_ERROR")?;
        let resources = app.path().resource_dir().map_err(|_| "RESOURCE_PATH_ERROR")?;
        (parent.join("aluraya-node.exe"), resources.join("sidecar/sidecar.cjs"))
    };
    if !runtime.is_file() || !script.is_file() { return Err("SIDECAR_MISSING".into()); }
    Ok((runtime, script))
}
