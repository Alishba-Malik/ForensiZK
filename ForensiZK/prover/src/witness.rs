
use anyhow::Result;

// Very small witness builder: convert canonical records into field-friendly vectors
pub struct Witness {
    pub indices: Vec<u64>,
    pub ts: Vec<u64>,
    pub leaf_bytes: Vec<Vec<u8>>
}

pub fn build_witness(events: &Vec<crate::parser::CanonicalRecord>, leaves: &Vec<[u8;32]>) -> Result<Witness> {
    let mut indices = Vec::new();
    let mut ts = Vec::new();
    let mut leaf_bytes = Vec::new();
    for (i, ev) in events.iter().enumerate() {
        indices.push(ev.index as u64);
        ts.push(ev.ts);
        leaf_bytes.push(leaves[i].to_vec());
    }
    Ok(Witness { indices, ts, leaf_bytes })
}
