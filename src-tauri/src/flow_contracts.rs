use serde::{Deserialize, Serialize};
#[derive(Deserialize, Serialize)]
#[serde(tag = "action", rename_all = "snake_case", deny_unknown_fields)]
pub enum FlowAction {
    Inspect {}, Create { browser: String }, Open { #[serde(rename = "profileId")] profile_id: String },
    Observe {}, Close {}, Profiles { page: u32 },
}
impl FlowAction {
    pub fn validate(&self) -> Result<(), String> {
        let valid = match self {
            Self::Create { browser } => ["chrome", "msedge"].contains(&browser.as_str()),
            Self::Open { profile_id } => uuid::Uuid::parse_str(profile_id).is_ok(),
            Self::Profiles { page } => *page <= 100000,
            _ => true,
        };
        if valid { Ok(()) } else { Err("INVALID_FLOW_ACTION".into()) }
    }
}
#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Profile { id: String, browser: String }
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Observation {
    observed_at: String, page: String, editor_visible: bool,
    model_labels: Vec<String>, credit_labels: Vec<String>, cost_verified: bool,
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FlowSnapshot {
    schema_version: u8, activity: String, profiles: Vec<Profile>, profile_count: u32, profile_page: u32,
    active_profile_id: Option<String>, browser_open: bool, observation: Option<Observation>, generation_ready: bool,
    error: Option<String>,
}
impl FlowSnapshot {
    pub fn validate(&self) -> Result<(), String> {
        let valid = self.schema_version == 1 && !self.generation_ready
            && ["idle", "loading", "opening", "observing", "closing"].contains(&self.activity.as_str())
            && self.profiles.len() <= 10
            && self.profiles.iter().all(|p| uuid::Uuid::parse_str(&p.id).is_ok() && ["chrome", "msedge"].contains(&p.browser.as_str()))
            && self.active_profile_id.as_ref().map_or(true, |id| uuid::Uuid::parse_str(id).is_ok())
            && self.observation.as_ref().map_or(true, |o| !o.cost_verified
                && o.observed_at.len() <= 40 && o.observed_at.ends_with('Z')
                && ["flow", "login", "login_rejected", "other", "closed"].contains(&o.page.as_str())
                && o.model_labels.len() <= 12 && o.credit_labels.len() <= 6
                && o.model_labels.iter().chain(o.credit_labels.iter()).all(|s| s.len() <= 400))
            && self.error.as_ref().map_or(true, |s| ["WINDOWS_REQUIRED", "STORAGE_ERROR", "BROWSER_OPEN_FAILED", "NAVIGATION_FAILED", "BROWSER_CLOSED", "PROFILE_ACTIVE", "PROFILE_NOT_FOUND", "OBSERVATION_FAILED", "BUSY"].contains(&s.as_str()));
        if valid { Ok(()) } else { Err("SIDECAR_PROTOCOL_ERROR".into()) }
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FlowResponse { pub schema_version: u8, pub request_id: String, pub ok: bool, pub payload: FlowSnapshot }
