use std::io::{BufReader, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{self, Receiver};
use std::time::Duration;
use super::{frame_reader::read_frame, sidecar_paths};
use crate::contracts::{Diagnostics, Response};

pub struct Sidecar {
    child: Child,
    stdin: ChildStdin,
    messages: Receiver<Result<String, String>>,
}

impl Sidecar {
    pub fn spawn(app: &tauri::AppHandle) -> Result<Self, String> {
        let (runtime, script) = sidecar_paths::resolve(app)?;
        let mut command = Command::new(runtime);
        command.arg(script).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null());
        // Inherited NODE_OPTIONS could inject code before the trusted sidecar starts.
        command.env_remove("NODE_OPTIONS").env_remove("NODE_PATH");
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command.spawn().map_err(|_| "SIDECAR_START_FAILED")?;
        let stdin = match child.stdin.take() {
            Some(value) => value,
            None => { let _ = child.kill(); let _ = child.wait(); return Err("SIDECAR_PIPE_FAILED".into()); }
        };
        let stdout = match child.stdout.take() {
            Some(value) => value,
            None => { let _ = child.kill(); let _ = child.wait(); return Err("SIDECAR_PIPE_FAILED".into()); }
        };
        let (sender, messages) = mpsc::sync_channel(8);
        std::thread::spawn(move || {
            let mut reader = BufReader::new(stdout);
            loop {
                match read_frame(&mut reader) {
                    Ok(Some(frame)) => { if sender.try_send(Ok(frame)).is_err() { break; } }
                    Ok(None) => break,
                    Err(error) => { let _ = sender.try_send(Err(error)); break; }
                }
            }
        });
        Ok(Self { child, stdin, messages })
    }

    pub fn inspect(&mut self) -> Result<Diagnostics, String> {
        let request_id = uuid::Uuid::new_v4().to_string();
        let request = serde_json::json!({
            "schemaVersion": 1, "requestId": request_id, "type": "health.inspect", "payload": {}
        });
        writeln!(self.stdin, "{}", request).map_err(|_| "SIDECAR_WRITE_FAILED")?;
        self.stdin.flush().map_err(|_| "SIDECAR_WRITE_FAILED")?;
        let frame = self.messages.recv_timeout(Duration::from_secs(8))
            .map_err(|_| "SIDECAR_TIMEOUT")??;
        let response: Response = serde_json::from_str(&frame).map_err(|_| "SIDECAR_PROTOCOL_ERROR")?;
        response.validate(&request_id)?;
        let mut report = response.payload;
        if let Some(host) = report.checks.iter_mut().find(|check| check.id == "host") {
            host.state = "pass".into();
            host.detail = "Host Tauri menerima respons sidecar tervalidasi. Login provider belum diuji.".into();
        }
        Ok(report)
    }
}

impl Drop for Sidecar {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
