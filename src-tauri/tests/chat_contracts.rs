#[path = "../src/chat_contracts.rs"]
mod chat_contracts;
use chat_contracts::{ChatAction, ChatResponse};

#[test]
fn rejects_unknown_privileged_fields_and_oversized_text() {
    assert!(serde_json::from_str::<ChatAction>(r#"{"action":"send","model":"available","text":"hello","approved":true}"#).is_err());
    assert!(ChatAction::Send { model: "available".into(), text: "x".repeat(16001) }.validate().is_err());
    assert!(serde_json::from_str::<ChatAction>(r#"{"action":"shell","command":"whoami"}"#).is_err());
}

#[test]
fn accepts_public_snapshot_but_rejects_credentials() {
    let payload = serde_json::json!({"schemaVersion":1,"activity":"idle","accountId":null,"email":null,"signedIn":false,"planEnabled":false,"planConfirmed":false,"welcomePending":false,"usagePaused":false,"accounts":[],"accountCount":0,"accountPage":0,"models":[],"reply":null,"error":null});
    let mut response = serde_json::json!({"schemaVersion":1,"requestId":"38d0587b-17b4-4abc-a6c2-c23aabdaae8d","ok":true,"payload":payload});
    let parsed: ChatResponse = serde_json::from_value(response.clone()).expect("valid public snapshot");
    assert!(parsed.payload.validate().is_ok());
    response["payload"]["accessToken"] = serde_json::json!("fixture-secret");
    assert!(serde_json::from_value::<ChatResponse>(response).is_err());
}

#[test]
fn validates_bounded_diagnostics_and_rejects_raw_provider_fields() {
    let diagnostic = serde_json::json!({"stage":"http","status":400,"shape":"error","code":"invalid_request_error","param":"input[0].content","requestId":"req_fixture"});
    let mut payload = serde_json::json!({"schemaVersion":1,"activity":"idle","accountId":null,"email":null,"signedIn":false,"planEnabled":false,"planConfirmed":false,"welcomePending":false,"usagePaused":false,"accounts":[],"accountCount":0,"accountPage":0,"models":[],"reply":null,"error":"PROVIDER_ERROR","diagnostic":diagnostic});
    let valid: chat_contracts::ChatSnapshot = serde_json::from_value(payload.clone()).unwrap();
    assert!(valid.validate().is_ok());
    payload["diagnostic"]["requestId"] = serde_json::json!("Bearer secret");
    let invalid: chat_contracts::ChatSnapshot = serde_json::from_value(payload.clone()).unwrap();
    assert!(invalid.validate().is_err());
    payload["diagnostic"]["message"] = serde_json::json!("raw provider text");
    assert!(serde_json::from_value::<chat_contracts::ChatSnapshot>(payload).is_err());
}
