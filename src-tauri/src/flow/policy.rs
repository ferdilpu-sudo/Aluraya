use crate::flow_contracts::Page;
use tauri::Url;

pub const FLOW_URL: &str = "https://labs.google/fx/tools/flow";

// Top-level navigation only. Subresources remain under the provider's own web policy.
// No custom schemes, local app URLs, arbitrary hosts or credentials in URLs.
pub fn allowed(url: &Url) -> bool {
    if url.as_str() == "about:blank" { return true; }
    url.scheme() == "https" && url.port_or_known_default() == Some(443)
        && url.username().is_empty() && url.password().is_none()
        && matches!(url.host_str(), Some("labs.google" | "flow.google" |
            "accounts.google.com" | "myaccount.google.com" | "www.google.com" |
            "consent.google.com" | "support.google.com" | "policies.google.com"))
}

pub fn page(url: &Url) -> Page {
    if !allowed(url) { return Page::Other; }
    match url.host_str() {
        Some("accounts.google.com") => {
            let parts: Vec<_> = url.path().split('/').filter(|s| !s.is_empty()).collect();
            let rejected = parts.len() >= 3 && parts[0].starts_with('v')
                && parts[0][1..].chars().all(|c| c.is_ascii_digit()) && parts[0].len() > 1
                && parts[1] == "signin" && parts[2] == "rejected";
            if rejected { Page::LoginRejected } else { Page::Login }
        }
        Some("flow.google") => Page::Flow,
        Some("labs.google") => {
            let parts: Vec<_> = url.path().split('/').filter(|s| !s.is_empty()).collect();
            if parts.starts_with(&["fx", "tools", "flow"])
                || (parts.len() >= 4 && parts[0] == "fx" && parts[2] == "tools" && parts[3] == "flow") {
                Page::Flow
            } else { Page::Other }
        }
        _ => Page::Other,
    }
}

// A Flow tab must not mask a still-open login or rejected popup.
pub fn priority(page: Page) -> u8 {
    match page { Page::LoginRejected => 4, Page::Login => 3, Page::Flow => 2, Page::Other => 1, Page::Closed => 0 }
}
