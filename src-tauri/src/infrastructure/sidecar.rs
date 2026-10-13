use std::io::{BufReader, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{self, Receiver};
use std::time::Duration;
use super::{frame_reader::read_frame, sidecar_paths, credential_lock};
use crate::chat_contracts::{ChatAction, ChatSnapshot, ChatResponse};
use crate::contracts::{Diagnostics, Response};
use crate::flow_contracts::{FlowAction, FlowSnapshot, FlowResponse};

pub struct Sidecar {
    child: Child,
    _credential_lock: std::fs::File,
    stdin: Option<ChildStdin>,
    messages: Receiver<Result<String, String>>,
}

impl Sidecar {
    pub fn spawn(app: &tauri::AppHandle) -> Result<Self, String> {
        let (runtime, script) = sidecar_paths::resolve(app)?;
        let (auth_directory, credential_lock) = credential_lock::acquire(app)?;
        let mut command = Command::new(runtime);
        let flow_directory = auth_directory.parent().ok_or("FLOW_PATH_ERROR")?.join("flow");
        command.env("ALURAYA_AUTH_DIR", auth_directory);
        command.env("ALURAYA_FLOW_DIR", flow_directory);
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
        Ok(Self { child, stdin: Some(stdin), messages, _credential_lock: credential_lock })
    }

    fn request(&mut self, kind: &str, payload: serde_json::Value) -> Result<(String, String), String> {
        let request_id = uuid::Uuid::new_v4().to_string();
        let request = serde_json::json!({
            "schemaVersion": 1, "requestId": request_id, "type": kind, "payload": payload
        });
        let encoded = request.to_string();
        if encoded.len() > 65_536 { return Err("FRAME_TOO_LARGE".into()); }
        let stdin = self.stdin.as_mut().ok_or("SIDECAR_PIPE_CLOSED")?;
        writeln!(stdin, "{}", encoded).map_err(|_| "SIDECAR_WRITE_FAILED")?;
        stdin.flush().map_err(|_| "SIDECAR_WRITE_FAILED")?;
        let frame = self.messages.recv_timeout(Duration::from_secs(8))
            .map_err(|_| "SIDECAR_TIMEOUT")??;
        Ok((request_id, frame))
    }

    pub fn chat(&mut self, action: ChatAction) -> Result<ChatSnapshot, String> {
        let payload = serde_json::to_value(action).map_err(|_| "INVALID_CHAT_ACTION")?;
        let (request_id, frame) = self.request("chat.action", payload)?;
        let response: ChatResponse = serde_json::from_str(&frame).map_err(|_| "SIDECAR_PROTOCOL_ERROR")?;
        if response.schema_version != 1 || response.request_id != request_id || !response.ok {
            return Err("SIDECAR_PROTOCOL_ERROR".into());
        }
        response.payload.validate()?;
        Ok(response.payload)
    }

    pub fn flow(&mut self, action: FlowAction) -> Result<FlowSnapshot, String> {
        let payload = serde_json::to_value(action).map_err(|_| "INVALID_FLOW_ACTION")?;
        let (request_id, frame) = self.request("flow.action", payload)?;
        let response: FlowResponse = serde_json::from_str(&frame).map_err(|_| "SIDECAR_PROTOCOL_ERROR")?;
        if response.schema_version != 1 || response.request_id != request_id || !response.ok { return Err("SIDECAR_PROTOCOL_ERROR".into()); }
        response.payload.validate()?;
        Ok(response.payload)
    }

    pub fn inspect(&mut self) -> Result<Diagnostics, String> {
        let (request_id, frame) = self.request("health.inspect", serde_json::json!({}))?;
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
        // EOF lets the sidecar close its owned browser and flush profile data.
        drop(self.stdin.take());
        for _ in 0..20 {
            if matches!(self.child.try_wait(), Ok(Some(_))) { return; }
            std::thread::sleep(Duration::from_millis(100));
        }
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
