use serde::Deserialize;
use std::fs;
use anyhow::Result;

#[derive(Deserialize, Debug)]
pub struct RawLog {
    pub timestamp: Option<String>,
    pub src: Option<String>,
    pub user: Option<String>,
    pub action: Option<String>,
    pub message: Option<String>
}

#[derive(Clone, Debug)]
pub struct CanonicalRecord {
    pub index: usize,
    pub ts: u64,
    pub src: Option<String>,
    pub user: Option<String>,
    pub action: Option<String>,
    pub message: Option<String>
}

pub fn parse_file(path: &std::path::Path) -> Result<Vec<CanonicalRecord>> {
    let raw = fs::read_to_string(path)?;
    let mut items: Vec<RawLog> = Vec::new();
    if let Ok(j) = serde_json::from_str::<serde_json::Value>(&raw) {
        if j.is_array() {
            items = serde_json::from_str(&raw)?;
        }
    }
    if items.is_empty() {
        // fallback to newline JSON or plain lines
        for (_i, line) in raw.lines().enumerate() {
            if line.trim().is_empty() { continue; }
            if let Ok(r) = serde_json::from_str::<RawLog>(line) {
                items.push(r);
            } else {
                items.push(RawLog { timestamp: None, src: None, user: None, action: None, message: Some(line.to_string()) });
            }
        }
    }

    let mut out = Vec::with_capacity(items.len());
    for (i, r) in items.into_iter().enumerate() {
        let ts = if let Some(t) = r.timestamp {
            match chrono::DateTime::parse_from_rfc3339(&t) {
                Ok(dt) => dt.timestamp() as u64,
                Err(_) => 0u64
            }
        } else { 0u64 };
        out.push(CanonicalRecord { index: i, ts, src: r.src, user: r.user, action: r.action, message: r.message });
    }
    Ok(out)
}
