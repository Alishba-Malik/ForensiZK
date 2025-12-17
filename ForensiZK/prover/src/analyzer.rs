use crate::parser::CanonicalRecord;

#[derive(Debug, Clone)]
pub struct Features {
    pub ssh_failed: u64,
    pub priv_esc: u64,
    pub shadow: u64,
    pub suspicious_cmd: u64,
    pub tmp_exec: u64,
    pub service_fail: u64,
    pub outbound: u64,
    pub kernel: u64,
    pub net_flap: u64,
}

pub fn analyze(records: &[CanonicalRecord]) -> Features {
    let mut f = Features {
        ssh_failed: 0,
        priv_esc: 0,
        shadow: 0,
        suspicious_cmd: 0,
        tmp_exec: 0,
        service_fail: 0,
        outbound: 0,
        kernel: 0,
        net_flap: 0,
    };

    for r in records {
        match r.action.as_deref() {
            Some("ssh_failed") => f.ssh_failed += 1,
            Some("shadow_access") => f.shadow = 1,
            Some("tmp_exec") => f.tmp_exec = 1,
            Some("outbound") => f.outbound = 1,
            Some("kernel_anomaly") => f.kernel = 1,
            Some("net_flap") => f.net_flap = 1,
            Some("service_fail") => f.service_fail = 1,
            _ => {}
        }
    }

    f
}
