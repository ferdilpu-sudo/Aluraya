use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(tag = "action", deny_unknown_fields)]
pub enum ChatAction {
    #[serde(rename = "inspect")] Inspect,
    #[serde(rename = "login")] Login { #[serde(rename = "addAccount")] add_account: bool },
    #[serde(rename = "cancel")] Cancel,
    #[serde(rename = "logout")] Logout,
    #[serde(rename = "usage")] Usage,
    #[serde(rename = "models")] Models,
    #[serde(rename = "confirm_plan")] ConfirmPlan,
    #[serde(rename = "clear")] Clear,
    #[serde(rename = "accounts")] Accounts { page: u32 },
    #[serde(rename = "select")] Select { #[serde(rename = "accountId")] account_id: String },
    #[serde(rename = "send")] Send { model: String, text: String },
}
impl ChatAction {
    pub fn validate(&self) -> Result<(), String> {
        let valid = match self {
            Self::Send { model, text } => !model.is_empty() && model.len() <= 800 && !text.trim().is_empty() && text.len() <= 16000,
            Self::Select { account_id } => uuid::Uuid::parse_str(account_id).is_ok(),
            Self::Accounts { page } => *page <= 100000,
            _ => true,
        };
        if valid { Ok(()) } else { Err("INVALID_CHAT_ACTION".into()) }
    }
}
#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct AccountSummary { id: String, label: String }
#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Model { id: String, name: String }
#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Reply { id: String, text: String, state: String }
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChatDiagnostic {
    stage: String, status: u16, shape: String,
    code: Option<String>, param: Option<String>, request_id: Option<String>,
}
impl ChatDiagnostic {
    fn validate(&self) -> bool {
        let identifier = |s: &str, param: bool| !s.is_empty() && s.len() <= 100
            && s.as_bytes()[0].is_ascii_lowercase()
            && s.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'_' || (param && b".[]".contains(&c)));
        ["http", "stream", "protocol"].contains(&self.stage.as_str())
            && (100..=599).contains(&self.status)
            && ["error", "detail", "other", "non_json", "empty", "event"].contains(&self.shape.as_str())
            && self.code.as_ref().map_or(true, |s| identifier(s, false))
            && self.param.as_ref().map_or(true, |s| identifier(s, true))
            && self.request_id.as_ref().map_or(true, |s| s.len() <= 100 &&
                ((s.starts_with("req_") && s.len() > 4 && s.bytes().skip(4).all(|c| c.is_ascii_alphanumeric() || c == b'_' || c == b'-'))
                || (s.len() == 36 && s.bytes().all(|c| c.is_ascii_hexdigit() || c == b'-'))))
    }
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChatSnapshot {
    schema_version: u8, activity: String, account_id: Option<String>, email: Option<String>,
    signed_in: bool, plan_enabled: bool, plan_confirmed: bool, welcome_pending: bool,
    usage_paused: bool, accounts: Vec<AccountSummary>, account_count: u32, account_page: u32,
    models: Vec<Model>, reply: Option<Reply>, error: Option<String>, diagnostic: Option<ChatDiagnostic>,
}
impl ChatSnapshot {
    pub fn validate(&self) -> Result<(), String> {
        let valid = self.schema_version == 1
            && self.diagnostic.as_ref().map_or(true, |d| d.validate())
            && ["idle", "loading", "login", "models", "reply", "logout"].contains(&self.activity.as_str())
            && self.account_id.as_ref().map_or(true, |id| uuid::Uuid::parse_str(id).is_ok())
            && self.email.as_ref().map_or(true, |email| email.len() <= 1280)
            && self.accounts.len() <= 10 && self.models.len() <= 100
            && self.accounts.iter().all(|a| uuid::Uuid::parse_str(&a.id).is_ok() && a.label.len() <= 1520)
            && self.models.iter().all(|m| !m.id.is_empty() && m.id.len() <= 800 && !m.name.is_empty() && m.name.len() <= 800)
            && self.reply.as_ref().map_or(true, |r| uuid::Uuid::parse_str(&r.id).is_ok() && r.text.len() <= 24000 && ["streaming", "completed", "failed", "cancelled"].contains(&r.state.as_str()))
            && self.error.as_ref().map_or(true, |error| error.len() <= 80 && error.bytes().all(|c| c.is_ascii_uppercase() || c == b'_'));
        if valid { Ok(()) } else { Err("SIDECAR_PROTOCOL_ERROR".into()) }
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChatResponse { pub schema_version: u8, pub request_id: String, pub ok: bool, pub payload: ChatSnapshot }
