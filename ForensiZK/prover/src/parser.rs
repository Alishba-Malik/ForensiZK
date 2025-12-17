// use anyhow::Result;
// use chrono::NaiveDateTime;
// use regex::Regex;
// use std::fs;

// #[derive(Debug, Clone)]
// pub struct CanonicalRecord {
//     pub index: u64,
//     pub ts: u64,
//     pub level: Option<String>,
//     pub service: Option<String>,
//     pub pid: Option<u64>,
//     pub user: Option<String>,
//     pub src_ip: Option<String>,
//     pub action: Option<String>,
//     pub message: String,
//     pub raw_line: String,
// }

// pub fn parse_linux_log(path: &std::path::Path) -> Result<Vec<CanonicalRecord>> {
//     let raw = fs::read_to_string(path)?;

//     let re = Regex::new(
//         r"(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(?P<lvl>INFO|WARN|ERROR|ALERT)\s+(?P<svc>[a-zA-Z0-9_.-]+)(?:\[(?P<pid>\d+)\])?:\s+(?P<msg>.*)"
//     )?;

//     let mut out = vec![];

//     for (i, line) in raw.lines().enumerate() {
//         if let Some(c) = re.captures(line) {
//             let ts = NaiveDateTime::parse_from_str(&c["ts"], "%Y-%m-%d %H:%M:%S")?
//                 .and_utc()
//                 .timestamp() as u64;

//             let msg = c["msg"].to_string();

//             let action = if msg.contains("Failed password") {
//                 Some("ssh_failed".into())
//             } else if msg.contains("/etc/shadow") {
//                 Some("shadow_access".into())
//             } else if msg.contains("/tmp/") || msg.contains(".cache") {
//                 Some("tmp_exec".into())
//             } else if msg.contains("wget") || msg.contains("curl") {
//                 Some("outbound".into())
//             } else if msg.contains("segfault") || msg.contains("EXT4-fs") {
//                 Some("kernel_anomaly".into())
//             } else if msg.contains("Link is Down") || msg.contains("Link is Up") {
//                 Some("net_flap".into())
//             } else if msg.contains("Failed to start") {
//                 Some("service_fail".into())
//             } else {
//                 None
//             };

//             out.push(CanonicalRecord {
//                 index: i as u64,
//                 ts,
//                 level: Some(c["lvl"].into()),
//                 service: Some(c["svc"].into()),
//                 pid: c.name("pid").map(|p: regex::Match| p.as_str().parse::<u64>().unwrap()),
//                 user: None,
//                 src_ip: None,
//                 action,
//                 message: msg,
//                 raw_line: line.to_string(),
//             });
//         }
//     }

//     Ok(out)
// }

// pub fn parse_file(path: &std::path::Path) -> Result<Vec<CanonicalRecord>> {
//     parse_linux_log(path)
// }


use anyhow::Result;
use chrono::NaiveDateTime;
use regex::Regex;
use std::fs;

#[derive(Debug, Clone)]
pub struct CanonicalRecord {
    pub index: u64,
    pub ts: u64,
    pub level: Option<String>,
    pub service: Option<String>,
    pub pid: Option<u64>,
    pub user: Option<String>,
    pub src_ip: Option<String>,
    pub action: Option<String>,
    pub message: String,
    pub raw_line: String,
}

pub fn parse_linux_log(path: &std::path::Path) -> Result<Vec<CanonicalRecord>> {
    let raw = fs::read_to_string(path)?;

    // Updated regex for actual Linux logs
    let re = Regex::new(
        r"^(?P<ts>[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}:\d{2}) \S+ (?P<svc>[a-zA-Z0-9_.-]+)(?:\[(?P<pid>\d+)\])?: (?P<msg>.*)$"
    )?;

    let mut out = vec![];

    for (i, line) in raw.lines().enumerate() {
        if let Some(c) = re.captures(line) {
            // Prepend year for NaiveDateTime parsing
            let ts_str = format!("2025 {}", &c["ts"]); 
            let ts = NaiveDateTime::parse_from_str(&ts_str, "%Y %b %d %H:%M:%S")?
                .and_utc()
                .timestamp() as u64;

            let msg = c["msg"].to_string();

            // Action detection
            let action = if msg.contains("Failed password") {
                Some("ssh_failed".into())
            } else if msg.contains("/etc/shadow") {
                Some("shadow_access".into())
            } else if msg.contains("/tmp/") || msg.contains(".cache") {
                Some("tmp_exec".into())
            } else if msg.contains("wget") || msg.contains("curl") || msg.contains("nc ") {
                Some("outbound".into())
            } else if msg.contains("segfault") || msg.contains("EXT4-fs") {
                Some("kernel_anomaly".into())
            } else if msg.contains("Link is Down") || msg.contains("Link is Up") {
                Some("net_flap".into())
            } else if msg.contains("Failed to start") || msg.contains("apache2.service: Failed") {
                Some("service_fail".into())
            } else {
                None
            };

            out.push(CanonicalRecord {
                index: i as u64,
                ts,
                level: None, // Syslog logs don't have explicit levels in this format
                service: Some(c["svc"].into()),
                pid: c.name("pid").map(|p| p.as_str().parse::<u64>().unwrap()),
                user: None,
                src_ip: None,
                action,
                message: msg,
                raw_line: line.to_string(),
            });
        }
    }

    Ok(out)
}

pub fn parse_file(path: &std::path::Path) -> Result<Vec<CanonicalRecord>> {
    parse_linux_log(path)
}
