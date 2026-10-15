#[path = "../src/nexabot_contracts.rs"] mod contracts;
use contracts::{NexaAction, NexaSnapshot};
use serde_json::json;
#[test]
fn rejects_privileged_fields_and_unsupported_modes() {
    for value in [json!({"action":"inspect", "key":"secret"}), json!({"action":"submit", "approvalId":"x", "approved":true}), json!({"action":"prepare","input":{"mode":"img","prompt":"test","aspect":2,"url":"file:///secret"}})] {
        assert!(serde_json::from_value::<NexaAction>(value).is_err());
    }
    let invalid: NexaAction = serde_json::from_value(json!({"action":"prepare","input":{"mode":"t2v","prompt":"test","ratio":1,"resolution":4000}})).unwrap();
    assert!(invalid.validate().is_err());
}
#[test]
fn rejects_media_traversal_and_secret_snapshot_fields() {
    let mut state = json!({"schemaVersion":1,"activity":"idle","configured":true,"credit":null,"quote":null,"jobs":[],"jobCount":0,"page":0,"activeId":null,"error":null});
    let parsed: NexaSnapshot = serde_json::from_value(state.clone()).unwrap(); assert!(parsed.validate().is_ok());
    state["jobs"] = json!([{"id":"01234567-89ab-4cde-8fab-0123456789ab","providerId":"job","input":{"mode":"img","prompt":"test","aspect":2},"cost":0.15,"createdAt":1,"state":"ready","error":null,"media":{"fileName":"../../key.dpapi","sha256":"a".repeat(64),"bytes":20,"mime":"image/jpeg"}}]);
    let parsed: NexaSnapshot = serde_json::from_value(state.clone()).unwrap(); assert!(parsed.validate().is_err());
    state["key"] = json!("secret"); assert!(serde_json::from_value::<NexaSnapshot>(state).is_err());
}
