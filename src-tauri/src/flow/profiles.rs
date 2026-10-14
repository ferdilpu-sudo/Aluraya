use std::{collections::HashSet, fs::{File, OpenOptions}, io::Write, path::PathBuf};
use crate::flow_contracts::Profile;

pub struct Profiles {
    pub root: PathBuf,
    pub items: Vec<Profile>,
    _lock: File,
}
impl Profiles {
    pub fn load(root: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&root).map_err(|_| "STORAGE_ERROR")?;
        let mut options = OpenOptions::new();
        options.read(true).write(true).create(true).truncate(false);
        #[cfg(windows)] {
            use std::os::windows::fs::OpenOptionsExt;
            options.share_mode(0);
        }
        let lock = options.open(root.join("session.lock")).map_err(|_| "PROFILE_IN_USE")?;
        let path = root.join("profiles.json");
        let items = match std::fs::read(&path) {
            Ok(bytes) => decode(&bytes)?,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Vec::new(),
            Err(_) => return Err("STORAGE_ERROR".into()),
        };
        Ok(Self { root, items, _lock: lock })
    }
    pub fn create(&mut self) -> Result<(), String> {
        let mut items = self.items.clone();
        items.push(Profile { id: uuid::Uuid::new_v4().to_string() });
        let bytes = serde_json::to_vec(&items).map_err(|_| "STORAGE_ERROR")?;
        let temporary = self.root.join(format!("profiles-{}.tmp", uuid::Uuid::new_v4()));
        let result = (|| {
            let mut file = OpenOptions::new().write(true).create_new(true).open(&temporary)?;
            file.write_all(&bytes)?;
            file.sync_all()?;
            drop(file);
            std::fs::rename(&temporary, self.root.join("profiles.json"))
        })();
        if result.is_err() {
            let _ = std::fs::remove_file(temporary);
            return Err("STORAGE_ERROR".into());
        }
        self.items = items;
        Ok(())
    }
    pub fn directory(&self, id: &str) -> Result<PathBuf, String> {
        if !self.items.iter().any(|p| p.id == id) { return Err("PROFILE_NOT_FOUND".into()); }
        Ok(self.root.join(id))
    }
}

pub fn decode(bytes: &[u8]) -> Result<Vec<Profile>, String> {
    let items: Vec<Profile> = serde_json::from_slice(bytes).map_err(|_| "STORAGE_ERROR")?;
    let mut seen = HashSet::new();
    for p in &items {
        let id = uuid::Uuid::parse_str(&p.id).map_err(|_| "STORAGE_ERROR")?;
        if id.to_string() != p.id || !seen.insert(p.id.clone()) { return Err("STORAGE_ERROR".into()); }
    }
    Ok(items)
}
