use std::{fs::{File, OpenOptions}, path::PathBuf};

// Windows releases this exclusive handle even after a crash. No stale PID lock.
pub fn acquire(app: &tauri::AppHandle) -> Result<(PathBuf, File), String> {
    use tauri::Manager;
    let directory = app.path().app_local_data_dir().map_err(|_| "AUTH_DIRECTORY_FAILED")?.join("chatgpt");
    std::fs::create_dir_all(&directory).map_err(|_| "AUTH_DIRECTORY_FAILED")?;
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true);
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        options.share_mode(0);
    }
    let lock = options.open(directory.join("session.lock")).map_err(|_| "CHAT_SESSION_IN_USE")?;
    Ok((directory, lock))
}
