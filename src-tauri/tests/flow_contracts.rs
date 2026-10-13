#[path = "../src/flow_contracts.rs"]
mod flow_contracts;
use flow_contracts::{FlowAction, FlowSnapshot};
#[test]
fn rejects_remote_paths_and_generation_commands() {
    for body in [r#"{"action":"open","profileId":"../Default"}"#, r#"{"action":"create","browser":"evil.exe"}"#] {
        let parsed: FlowAction = serde_json::from_str(body).unwrap();
        assert!(parsed.validate().is_err());
    }
    assert!(serde_json::from_str::<FlowAction>(r#"{"action":"submit","prompt":"test"}"#).is_err());
    assert!(serde_json::from_str::<FlowAction>(r#"{"action":"inspect","cookie":"secret"}"#).is_err());
}
#[test]
fn never_marks_observations_as_permission_to_generate() {
    let mut value = serde_json::json!({"schemaVersion":1,"activity":"idle","profiles":[],"profileCount":0,"profilePage":0,"activeProfileId":null,"browserOpen":false,"observation":null,"generationReady":false,"error":null});
    assert!(serde_json::from_value::<FlowSnapshot>(value.clone()).unwrap().validate().is_ok());
    value["generationReady"] = serde_json::json!(true);
    assert!(serde_json::from_value::<FlowSnapshot>(value).unwrap().validate().is_err());
}
