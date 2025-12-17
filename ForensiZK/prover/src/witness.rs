// use anyhow::Result;

// pub struct Witness {
//     pub leaf_packed: Vec<Vec<u64>>, // each leaf as packed u64 words
//     pub indices: Vec<u64>,
//     pub ts: Vec<u64>,
// }

// pub fn build_witness(events: &Vec<crate::parser::CanonicalRecord>, packed_leaves: &Vec<Vec<u64>>) -> Result<Witness> {
//     let mut indices = Vec::new();
//     let mut ts = Vec::new();
//     for ev in events.iter() {
//         indices.push(ev.index as u64);
//         ts.push(ev.ts);
//     }
//     Ok(Witness { leaf_packed: packed_leaves.clone(), indices, ts })
// }

use anyhow::Result;
use crate::analyzer::{analyze, Features};
use crate::parser::CanonicalRecord;

#[derive(Debug, Clone)]
pub struct Witness {
    pub features: Features,
    pub timestamps: Vec<u64>,
}

pub fn build_witness(
    records: &[CanonicalRecord],
    leaves: &[u64],
) -> Result<Witness> {
    Ok(Witness {
        features: analyze(records),
        timestamps: leaves.to_vec(),
    })
}
