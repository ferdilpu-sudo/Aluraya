#[path = "../src/flow_contracts.rs"]
mod flow_contracts;
#[path = "../src/flow/policy.rs"]
mod policy;
#[path = "../src/flow/profiles.rs"]
mod profiles;
use flow_contracts::{FlowAction, Page};

#[test]
fn rejects_privileged_fields_legacy_launchers_and_submit() {
    for action in ["inspect", "observe", "close", "create"] {
        let valid = serde_json::json!({"action": action});
        assert!(serde_json::from_value::<FlowAction>(valid.clone()).unwrap().validate().is_ok());
        for key in ["cookie", "browser", "path", "url", "script", "approved"] {
            let mut invalid = valid.clone();
            invalid[key] = serde_json::json!("foreign-input");
            assert!(serde_json::from_value::<FlowAction>(invalid).is_err());
        }
    }
    assert!(serde_json::from_str::<FlowAction>(r#"{"action":"submit"}"#).is_err());
    for value in ["../Default", "C:\\Users\\Default", "{38d0587b-17b4-4abc-a6c2-c23aabdaae8d}"] {
        let action = FlowAction::Open { profile_id: value.into() };
        assert!(action.validate().is_err());
    }
}
#[test]
fn navigation_rejects_local_and_lookalike_origins() {
    for url in ["http://labs.google/fx/tools/flow", "https://labs.google.evil.test/fx/tools/flow",
        "https://accounts.google.com@evil.test/", "https://name@accounts.google.com/",
        "https://labs.google:444/", "file:///C:/secret", "http://tauri.localhost/", "https://tauri.localhost/",
        "http://127.0.0.1:1420/", "data:text/html,test", "javascript:alert(1)"] {
        assert!(!policy::allowed(&url.parse().unwrap()), "{url}");
    }
    assert!(policy::allowed(&policy::FLOW_URL.parse().unwrap()));
    assert!(policy::allowed(&"about:blank".parse().unwrap()));
}
#[test]
fn navigation_never_confuses_login_or_rejected_popup_with_flow() {
    for url in ["https://accounts.google.com/v3/signin/rejected?secret=redacted",
        "https://accounts.google.com/v2/signin/rejected"] {
        assert_eq!(policy::page(&url.parse().unwrap()), Page::LoginRejected);
    }
    assert_eq!(policy::page(&"https://accounts.google.com/v3/signin/identifier".parse().unwrap()), Page::Login);
    assert_eq!(policy::page(&"https://labs.google/fx/id/tools/flow/project/123".parse().unwrap()), Page::Flow);
    assert_eq!(policy::page(&"https://labs.google/fx/tools/flow-spoof".parse().unwrap()), Page::Other);
    assert!(policy::priority(Page::LoginRejected) > policy::priority(Page::Login));
    assert!(policy::priority(Page::Login) > policy::priority(Page::Flow));
}
#[test]
fn registry_rejects_duplicate_ids_paths_and_extra_fields() {
    let id = uuid::Uuid::new_v4().to_string();
    for body in [serde_json::json!([{"id":"../Default"}]),
        serde_json::json!([{"id":id,"cookie":"secret"}]),
        serde_json::json!([{"id":id},{"id":id}])] {
        assert!(profiles::decode(&serde_json::to_vec(&body).unwrap()).is_err());
    }
}
#[test]
fn profiles_persist_without_account_cap_and_corruption_is_not_overwritten() {
    let root = std::env::temp_dir().join(format!("aluraya-flow-profiles-{}",uuid::Uuid::new_v4()));
    let mut registry = profiles::Profiles::load(root.clone()).unwrap();
    for _ in 0..25 { registry.create().unwrap(); }
    let id = registry.items[24].id.clone();
    assert_eq!(registry.directory(&id).unwrap(), root.join(&id));
    assert!(registry.directory("../Default").is_err());
    #[cfg(windows)]
    assert!(profiles::Profiles::load(root.clone()).is_err());
    drop(registry);
    let reloaded = profiles::Profiles::load(root.clone()).unwrap();
    assert_eq!(reloaded.items.len(),25);
    assert_eq!(reloaded.items[24].id,id);
    drop(reloaded);
    std::fs::write(root.join("profiles.json"),"corrupt").unwrap();
    assert!(profiles::Profiles::load(root.clone()).is_err());
    assert_eq!(std::fs::read_to_string(root.join("profiles.json")).unwrap(), "corrupt");
    std::fs::remove_dir_all(root).unwrap();
}
