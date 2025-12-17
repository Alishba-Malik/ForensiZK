// use anyhow::Result;
// use sha2::{Sha256, Digest};

// use crate::parser::CanonicalRecord;

// /// For compatibility during development we provide two modes:
// /// - SHA256 mode (safe, works everywhere) -> used by backend and UI
// /// - POSEIDON mode (used by the circuit) -> produces field elements used inside the circuit
// ///
// /// Below we implement SHA256 merkle for public.json and also provide Poseidon packing helpers
// /// used by the circuit. The exact Poseidon hashing is implemented inside `circuit.rs` where
// /// plonky2 APIs are used (because plonky2 has the Poseidon implementation).

// pub fn leaf_bytes_for_record(rec: &CanonicalRecord) -> Vec<u8> {
//     format!("{}|{}|{}|{}|{}|{}",
//         rec.index,
//         rec.ts,
//         rec.service.clone().unwrap_or_default(),
//         rec.user.clone().unwrap_or_default(),
//         rec.action.clone().unwrap_or_default(),
//         rec.message.clone()
//     ).into_bytes()
// }

// pub fn make_leaves(events: &Vec<CanonicalRecord>) -> Vec<[u8;32]> {
//     events.iter().map(|e| {
//         let b = leaf_bytes_for_record(e);
//         let mut hasher = Sha256::new();
//         hasher.update(&b);
//         let out = hasher.finalize();
//         let mut arr = [0u8;32];
//         arr.copy_from_slice(&out[..]);
//         arr
//     }).collect()
// }

// pub fn build_merkle_root(mut leaves: Vec<[u8;32]>) -> [u8;32] {
//     if leaves.is_empty() {
//         return sha_empty();
//     }
//     while leaves.len() > 1 {
//         if leaves.len() % 2 == 1 {
//             let last = *leaves.last().unwrap();
//             leaves.push(last);
//         }
//         let mut next = Vec::with_capacity(leaves.len() / 2);
//         for pair in leaves.chunks(2) {
//             let mut h = Sha256::new();
//             h.update(&pair[0]);
//             h.update(&pair[1]);
//             let out = h.finalize();
//             let mut a = [0u8;32];
//             a.copy_from_slice(&out[..]);
//             next.push(a);
//         }
//         leaves = next;
//     }
//     leaves[0]
// }

// fn sha_empty() -> [u8;32] {
//     let mut h = Sha256::new();
//     h.update(b"");
//     let out = h.finalize();
//     let mut a = [0u8;32];
//     a.copy_from_slice(&out[..]);
//     a
// }

// /// Poseidon packing helper: convert canonical record fields to a vector of u64 words
// /// packed as bytes. The circuit will use the same packing to create field elements.
// pub fn pack_record_for_poseidon(rec: &CanonicalRecord) -> Vec<u64> {
//     // Simple packing scheme:
//     // [ index (u64), ts (u64), pid_or_0 (u64), hash1, hash2 ... ]
//     // For string data, compute SHA256 outside and split into u64 words.
//     let mut out: Vec<u64> = Vec::new();
//     out.push(rec.index as u64);
//     out.push(rec.ts as u64);
//     out.push(rec.pid.unwrap_or(0) as u64);

//     // compute sha256 of combination of service|user|action|message
//     let mut h = Sha256::new();
//     h.update(rec.service.clone().unwrap_or_default().as_bytes());
//     h.update(&[0xff]);
//     h.update(rec.user.clone().unwrap_or_default().as_bytes());
//     h.update(&[0xff]);
//     h.update(rec.action.clone().unwrap_or_default().as_bytes());
//     h.update(&[0xff]);
//     h.update(rec.message.as_bytes());
//     let digest = h.finalize();
//     // split digest into 4 u64 (little endian)
//     for chunk in digest.chunks(8) {
//         let mut v: u64 = 0;
//         for (i, b) in chunk.iter().enumerate() {
//             v |= (*b as u64) << (8 * i);
//         }
//         out.push(v);
//     }
//     out
// }

use plonky2::{
    field::{
        goldilocks_field::GoldilocksField,
        types::Field,
    },
    hash::{
        hash_types::HashOut,
        poseidon::PoseidonHash,
    },
    plonk::config::Hasher,
};


use crate::parser::CanonicalRecord;

pub fn make_leaves(records: &[CanonicalRecord]) -> Vec<u64> {
    records.iter().map(|r| r.ts).collect()
}

pub fn build_merkle_root(values: &[u64]) -> HashOut<GoldilocksField> {
    let mut nodes: Vec<HashOut<GoldilocksField>> = values
        .iter()
        .map(|v| {
            let f = GoldilocksField::from_canonical_u64(*v);
            PoseidonHash::hash_pad(&[f])
        })
        .collect();

    while nodes.len() > 1 {
        nodes = nodes
            .chunks(2)
            .map(|c| {
                if c.len() == 2 {
                    PoseidonHash::two_to_one(c[0], c[1])
                } else {
                    c[0]
                }
            })
            .collect();
    }

    nodes[0]
}


