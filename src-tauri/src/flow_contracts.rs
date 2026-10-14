use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(tag = "action", rename_all = "snake_case", deny_unknown_fields)]
pub enum FlowAction {
    Inspect {}, Create {}, Open { #[serde(rename = "profileId")] profile_id: String },
    Observe {}, Close {}, Profiles { page: u32 },
}
impl FlowAction {
    pub fn validate(&self) -> Result<(), String> {
        let valid = match self {
            Self::Open { profile_id } => uuid::Uuid::parse_str(profile_id)
                .map(|id| id.to_string() == *profile_id).unwrap_or(false),
            Self::Profiles { page } => *page <= 100000,
            _ => true,
        };
        if valid { Ok(()) } else { Err("INVALID_FLOW_ACTION".into()) }
    }
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Profile { pub id: String }

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Page { Flow, Login, LoginRejected, Other, Closed }

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Observation {
    pub checked_at_ms: u64,
    pub page: Page,
    pub origin: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowSnapshot {
    pub schema_version: u8,
    pub runtime: &'static str,
    pub profiles: Vec<Profile>,
    pub profile_count: usize,
    pub profile_page: usize,
    pub active_profile_id: Option<String>,
    pub browser_open: bool,
    pub observation: Option<Observation>,
    pub generation_ready: bool,
    pub error: Option<String>,
}
