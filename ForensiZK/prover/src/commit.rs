use sha2::{Sha256, Digest};

pub fn leaf_bytes_for_record(rec: &crate::parser::CanonicalRecord) -> Vec<u8> {
    // deterministic serialization — must match Node-side leaf creation
    let mut s = String::new();
    s.push_str(&format!("{}|{}|{}|{}|{}|{}",
        rec.index,
        rec.ts,
        rec.src.clone().unwrap_or_default(),
        rec.user.clone().unwrap_or_default(),
        rec.action.clone().unwrap_or_default(),
        rec.message.clone().unwrap_or_default()
    ));
    s.into_bytes()
}

pub fn make_leaves(events: &Vec<crate::parser::CanonicalRecord>) -> Vec<[u8;32]> {
    events.iter().map(|e| {
        let b = leaf_bytes_for_record(e);
        let mut hasher = Sha256::new();
        hasher.update(&b);
        let out = hasher.finalize();
        let mut arr = [0u8;32];
        arr.copy_from_slice(&out[..]);
        arr
    }).collect()
}

pub fn build_merkle_root(leaves: &Vec<[u8;32]>) -> [u8;32] {
    // simple in-memory merkle — duplicate last when odd
    let mut layer: Vec<[u8;32]> = leaves.clone();
    if layer.is_empty() {
        return sha_empty();
    }
    while layer.len() > 1 {
        if layer.len() % 2 == 1 {
            let last = *layer.last().unwrap();
            layer.push(last);
        }
        let mut next: Vec<[u8;32]> = Vec::with_capacity(layer.len()/2);
        for chunk in layer.chunks(2) {
            let mut h = Sha256::new();
            h.update(&chunk[0]);
            h.update(&chunk[1]);
            let out = h.finalize();
            let mut a = [0u8;32];
            a.copy_from_slice(&out[..]);
            next.push(a);
        }
        layer = next;
    }
    layer[0]
}

fn sha_empty() -> [u8;32] {
    let mut h = Sha256::new();
    h.update(b"");
    let out = h.finalize();
    let mut a = [0u8;32];
    a.copy_from_slice(&out[..]);
    a
}
