use serde::{Deserialize, Serialize};
#[derive(Deserialize, Serialize)]
#[serde(tag = "type", deny_unknown_fields)]
pub enum LlmAuth {
    #[serde(rename = "none")] None {},
    #[serde(rename = "bearer")] Bearer { #[serde(rename = "secretRef")] secret_ref: String },
    #[serde(rename = "header")] Header { #[serde(rename = "headerName")] header_name: String, #[serde(rename = "secretRef")] secret_ref: String },
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LlmConnection { id: String, base_url: String, endpoint: String, model: String, auth: LlmAuth, timeout_seconds: u32, token_limit_field: String }
impl LlmConnection {
    fn valid(&self) -> bool {
        let url = match tauri::Url::parse(&self.base_url) { Ok(v) => v, Err(_) => return false };
        let local = matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "[::1]"));
        let secret_ref_valid = |s: &str| !s.is_empty() && s.len() <= 120 && s.bytes().all(|b| b.is_ascii_alphanumeric() || b"_/-".contains(&b));
        let auth_ok = match &self.auth {
            LlmAuth::None {} => true,
            LlmAuth::Bearer { secret_ref } => secret_ref_valid(secret_ref),
            LlmAuth::Header { header_name, secret_ref } => secret_ref_valid(secret_ref) && !header_name.is_empty() && header_name.len() <= 80
                && header_name.as_bytes()[0].is_ascii_alphabetic() && header_name.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
                && !["host","cookie","content-length","content-type","connection","transfer-encoding","proxy-authorization"].contains(&header_name.to_ascii_lowercase().as_str()),
        };
        uuid::Uuid::parse_str(&self.id).is_ok() && self.base_url.len() <= 2000 && url.username().is_empty() && url.password().is_none() && url.query().is_none() && url.fragment().is_none()
            && !self.base_url.contains(['%', '\\']) && (url.scheme() == "https" || (local && url.scheme() == "http"))
            && self.endpoint.starts_with('/') && !self.endpoint.starts_with("//") && self.endpoint.len() <= 1200
            && !self.endpoint.chars().any(|c| c.is_whitespace() || "\\%?#{}".contains(c)) && !self.endpoint.split('/').any(|s| s == "." || s == "..")
            && !self.model.trim().is_empty() && self.model.len() <= 800 && (5..=600).contains(&self.timeout_seconds)
            && ["max_tokens", "max_completion_tokens"].contains(&self.token_limit_field.as_str()) && auth_ok
    }
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LlmTariff { currency: String, input_per_million: f64, output_per_million: f64, per_request: f64, checked_by_user: bool }
impl LlmTariff { fn valid(&self) -> bool { (3..=8).contains(&self.currency.len()) && self.currency.bytes().all(|b| b.is_ascii_uppercase()) && self.checked_by_user && [self.input_per_million,self.output_per_million,self.per_request].iter().all(|n| n.is_finite() && *n >= 0.0 && *n <= 1e9) } }
#[derive(Deserialize, Serialize)]
#[serde(tag = "action", deny_unknown_fields)]
pub enum LlmAction {
    #[serde(rename = "inspect")] Inspect {},
    #[serde(rename = "configure")] Configure { connection: LlmConnection },
    #[serde(rename = "save_key")] SaveKey { key: String },
    #[serde(rename = "remove_key")] RemoveKey {},
    #[serde(rename = "prepare")] Prepare { text: String, #[serde(rename = "maxTokens")] max_tokens: u32, tariff: LlmTariff },
    #[serde(rename = "submit")] Submit { #[serde(rename = "approvalId")] approval_id: String },
    #[serde(rename = "cancel")] Cancel {},
}
impl LlmAction {
    pub fn validate(&self) -> Result<(), String> {
        let valid = match self {
            Self::Configure { connection } => connection.valid(),
            Self::SaveKey { key } => !key.is_empty() && key.len() <= 4096 && key.bytes().all(|b| (33..=126).contains(&b)),
            Self::Prepare { text, max_tokens, tariff } => !text.trim().is_empty() && text.len() <= 24000 && (1..=4096).contains(max_tokens) && tariff.valid(),
            Self::Submit { approval_id } => uuid::Uuid::parse_str(approval_id).is_ok(),
            _ => true,
        };
        if valid { Ok(()) } else { Err("INVALID_LLM_ACTION".into()) }
    }
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LlmQuote { id: String, expires_at: u64, text: String, max_tokens: u32, tariff: LlmTariff }
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LlmReply { request_id: String, text: String, state: String, input_tokens: Option<u64>, output_tokens: Option<u64> }
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LlmSnapshot { schema_version: u8, activity: String, connection: Option<LlmConnection>, key_present: bool, quote: Option<LlmQuote>, reply: Option<LlmReply>, error: Option<String> }
impl LlmSnapshot {
    pub fn validate(&self) -> Result<(), String> {
        let valid = self.schema_version == 1 && ["idle","storage","request"].contains(&self.activity.as_str())
            && self.connection.as_ref().map_or(true, |c| c.valid())
            && self.quote.as_ref().map_or(true, |q| uuid::Uuid::parse_str(&q.id).is_ok() && !q.text.trim().is_empty() && q.text.len() <= 24000 && q.expires_at > 0 && (1..=4096).contains(&q.max_tokens) && q.tariff.valid())
            && self.reply.as_ref().map_or(true, |r| uuid::Uuid::parse_str(&r.request_id).is_ok() && r.text.len() <= 24000 && ["completed","incomplete"].contains(&r.state.as_str()))
            && self.error.as_ref().map_or(true, |e| ["BUSY","CONFIG_REQUIRED","KEY_REQUIRED","STORAGE_ERROR","INVALID_APPROVAL","AUTH_REJECTED","RATE_LIMIT","PROVIDER_ERROR","INVALID_RESPONSE","OUTPUT_LIMIT","REQUEST_UNCERTAIN","CANCELLED_UNCERTAIN"].contains(&e.as_str()));
        if valid { Ok(()) } else { Err("SIDECAR_PROTOCOL_ERROR".into()) }
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LlmResponse { pub schema_version: u8, pub request_id: String, pub ok: bool, pub payload: LlmSnapshot }
