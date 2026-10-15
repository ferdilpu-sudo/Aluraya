use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(tag = "mode", deny_unknown_fields)]
pub enum GenerationInput {
    #[serde(rename = "img")] Image { prompt: String, aspect: u8 },
    #[serde(rename = "t2v")] Video { prompt: String, ratio: u8, resolution: u16 },
}
impl GenerationInput {
    fn valid(&self) -> bool {
        let (prompt, valid) = match self {
            Self::Image { prompt, aspect } => (prompt, [1, 2, 5].contains(aspect)),
            Self::Video { prompt, ratio, resolution } => (prompt, [1, 2].contains(ratio) && [720, 1080].contains(resolution)),
        };
        valid && !prompt.trim().is_empty() && prompt.chars().count() <= 4000 && !prompt.chars().any(|c| (c as u32) < 32 && !['\n', '\r', '\t'].contains(&c))
    }
}
#[derive(Deserialize, Serialize)]
#[serde(tag = "action", deny_unknown_fields)]
pub enum NexaAction {
    #[serde(rename = "inspect")] Inspect {},
    #[serde(rename = "pause")] Pause {},
    #[serde(rename = "save_key")] SaveKey { key: String },
    #[serde(rename = "remove_key")] RemoveKey {},
    #[serde(rename = "credit")] Credit {},
    #[serde(rename = "prepare")] Prepare { input: GenerationInput },
    #[serde(rename = "submit")] Submit { #[serde(rename = "approvalId")] approval_id: String },
    #[serde(rename = "resume")] Resume { id: String },
    #[serde(rename = "history")] History { page: u32 },
}
fn uuid(value: &str) -> bool { uuid::Uuid::parse_str(value).map_or(false, |id| id.to_string() == value) }
fn identifier(value: &str) -> bool { !value.is_empty() && value.len() <= 128 && value.bytes().all(|c| c.is_ascii_alphanumeric() || b"_-".contains(&c)) }
impl NexaAction {
    pub fn validate(&self) -> Result<(), String> {
        let valid = match self {
            Self::SaveKey { key } => key.starts_with("nxb_") && (20..=256).contains(&key.len()) && key.bytes().all(|c| c.is_ascii_alphanumeric() || b"_-".contains(&c)),
            Self::Prepare { input } => input.valid(),
            Self::Submit { approval_id } => uuid(approval_id),
            Self::Resume { id } => uuid(id),
            Self::History { page } => *page <= 100000,
            _ => true,
        };
        if valid { Ok(()) } else { Err("INVALID_NEXABOT_ACTION".into()) }
    }
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Credit { balance: f64, cost: f64, checked_at: u64 }
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Quote { id: String, input: GenerationInput, cost: f64, expires_at: u64 }
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Media { file_name: String, sha256: String, bytes: u64, mime: String }
impl Media {
    fn valid(&self) -> bool {
        let (name, ext) = match self.file_name.rsplit_once('.') { Some(v) => v, None => return false };
        uuid(name) && ((ext == "jpg" && self.mime == "image/jpeg") || (ext == "mp4" && self.mime == "video/mp4"))
            && self.sha256.len() == 64 && self.sha256.bytes().all(|c| c.is_ascii_hexdigit()) && self.bytes > 0 && self.bytes <= 256 * 1048576
    }
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Job { id: String, provider_id: Option<String>, input: GenerationInput, cost: f64, charged_cost: Option<f64>, created_at: u64, state: String, error: Option<String>, media: Option<Media> }
fn valid_error(error: &Option<String>) -> bool {
    error.as_ref().map_or(true, |s| ["KEY_REQUIRED", "INVALID_KEY", "INSUFFICIENT_CREDIT", "ACCESS_DENIED", "NOT_FOUND", "RATE_LIMIT", "INVALID_REQUEST", "NETWORK_ERROR", "PROVIDER_ERROR", "PROTOCOL_ERROR", "STORAGE_ERROR", "BUSY", "APPROVAL_STALE", "COST_CHANGED", "SUBMIT_UNCERTAIN", "JOB_FAILED", "DOWNLOAD_FAILED", "DOWNLOAD_REDIRECT", "MEDIA_INVALID", "KEY_MISMATCH"].contains(&s.as_str()))
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NexaSnapshot {
    schema_version: u8, activity: String, configured: bool, credit: Option<Credit>, quote: Option<Quote>,
    jobs: Vec<Job>, job_count: u32, page: u32, active_id: Option<String>, error: Option<String>,
}
impl NexaSnapshot {
    pub fn validate(&self) -> Result<(), String> {
        let positive = |n: f64| n.is_finite() && n > 0.0;
        let valid = self.schema_version == 1 && ["idle", "loading", "saving", "credit", "preparing", "submitting", "monitoring"].contains(&self.activity.as_str())
            && self.active_id.as_ref().map_or(true, |id| uuid(id)) && valid_error(&self.error)
            && self.credit.as_ref().map_or(true, |c| c.balance.is_finite() && c.balance >= 0.0 && positive(c.cost))
            && self.quote.as_ref().map_or(true, |q| uuid(&q.id) && q.input.valid() && positive(q.cost))
            && self.jobs.len() <= 3 && self.jobs.iter().all(|j| uuid(&j.id) && j.input.valid() && positive(j.cost) && j.charged_cost.map_or(true, |c| c.is_finite() && c >= 0.0)
                && j.provider_id.as_ref().map_or(true, |id| identifier(id)) && valid_error(&j.error)
                && ["submitting", "uncertain", "queued", "processing", "done", "ready", "failed"].contains(&j.state.as_str())
                && j.media.as_ref().map_or(true, |m| m.valid()) && (j.state != "ready" || j.media.is_some()));
        if valid { Ok(()) } else { Err("SIDECAR_PROTOCOL_ERROR".into()) }
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NexaResponse { pub schema_version: u8, pub request_id: String, pub ok: bool, pub payload: NexaSnapshot }
