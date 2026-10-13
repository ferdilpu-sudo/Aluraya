fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new().commands(&["inspect_runtime", "chat_action", "flow_action"]),
        ),
    )
    .expect("Unable to build Aluraya metadata");
}
