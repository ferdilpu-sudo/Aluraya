#[path = "../src/llm_contracts.rs"]
mod llm_contracts;
use llm_contracts::{LlmAction, LlmSnapshot};
#[test]
fn rejects_privilege_injection_secrets_and_unknown_tariffs() {
    for input in [r#"{"action":"inspect","key":"secret"}"#,r#"{"action":"submit","approvalId":"38d0587b-17b4-4abc-a6c2-c23aabdaae8d","approved":true}"#] { assert!(serde_json::from_str::<LlmAction>(input).is_err()); }
    let invalid = serde_json::json!({"action":"prepare","text":"hello","maxTokens":100,"tariff":{"currency":"USD","inputPerMillion":1,"outputPerMillion":2,"perRequest":0,"checkedByUser":false}});
    assert!(serde_json::from_value::<LlmAction>(invalid).unwrap().validate().is_err());
    let snapshot = serde_json::json!({"schemaVersion":1,"activity":"idle","connection":null,"keyPresent":false,"quote":null,"reply":null,"error":null,"key":"secret"});
    assert!(serde_json::from_value::<LlmSnapshot>(snapshot).is_err());
}
#[test]
fn rejects_unsafe_connections_and_accepts_explicit_loopback() {
    let mut input = serde_json::json!({"action":"configure","connection":{"id":"38d0587b-17b4-4abc-a6c2-c23aabdaae8d","baseUrl":"http://127.0.0.1:1234","endpoint":"/v1/chat/completions","model":"local","auth":{"type":"none"},"timeoutSeconds":60,"tokenLimitField":"max_tokens"}});
    assert!(serde_json::from_value::<LlmAction>(input.clone()).unwrap().validate().is_ok());
    for url in ["http://remote.example.com","https://user:pass@example.com","https://example.com?key=secret"] { input["connection"]["baseUrl"] = serde_json::json!(url); assert!(serde_json::from_value::<LlmAction>(input.clone()).unwrap().validate().is_err()); }
    input["connection"]["baseUrl"] = serde_json::json!("https://example.com"); input["connection"]["endpoint"] = serde_json::json!("//other.example.com");
    assert!(serde_json::from_value::<LlmAction>(input).unwrap().validate().is_err());
}

#[test]
fn reply_requires_valid_request_correlation() {
    let mut snapshot = serde_json::json!({"schemaVersion":1,"activity":"idle","connection":null,"keyPresent":false,"quote":null,"reply":{"requestId":"af2b3712-2778-4e75-905c-392fa1a74eed","text":"Usulan","state":"completed","inputTokens":null,"outputTokens":null},"error":null});
    assert!(serde_json::from_value::<LlmSnapshot>(snapshot.clone()).unwrap().validate().is_ok());
    snapshot["reply"]["requestId"] = serde_json::json!("wrong");
    assert!(serde_json::from_value::<LlmSnapshot>(snapshot.clone()).unwrap().validate().is_err());
    snapshot["reply"].as_object_mut().unwrap().remove("requestId");
    assert!(serde_json::from_value::<LlmSnapshot>(snapshot).is_err());
}
