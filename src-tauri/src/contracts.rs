use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DiagnosticCheck {
    pub id: String,
    pub label: String,
    pub state: String,
    pub detail: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Diagnostics {
    pub schema_version: u8,
    pub runtime: String,
    pub checked_at: String,
    pub platform: String,
    pub node_version: Option<String>,
    pub checks: Vec<DiagnosticCheck>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Response {
    pub schema_version: u8,
    pub request_id: String,
    pub ok: bool,
    pub payload: Diagnostics,
}

impl Response {
    pub fn validate(&self, request_id: &str) -> Result<(), String> {
        let ids = ["host", "sidecar", "chatgpt", "nexabot", "generation"];
        let payload = &self.payload;
        let valid = self.schema_version == 1 && self.request_id == request_id && self.ok
            && payload.schema_version == 1 && payload.runtime == "desktop"
            && payload.checks.len() == ids.len()
            && ids.iter().all(|id| payload.checks.iter().filter(|c| c.id == *id).count() == 1)
            && payload.checks.iter().all(|c| {
                ["pass", "blocked", "not_run"].contains(&c.state.as_str())
                    && !c.label.is_empty() && c.label.len() <= 80
                    && !c.detail.is_empty() && c.detail.len() <= 500
            });
        if valid { Ok(()) } else { Err("SIDECAR_PROTOCOL_ERROR".into()) }
    }
}
