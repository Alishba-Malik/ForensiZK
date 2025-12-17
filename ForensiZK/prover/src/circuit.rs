use anyhow::Result;
use plonky2::{
    field::{
        goldilocks_field::GoldilocksField,
        types::Field, // REQUIRED for from_canonical_u64
    },
    iop::witness::{PartialWitness, WitnessWrite},
    plonk::{
        circuit_builder::CircuitBuilder,
        circuit_data::CircuitConfig,
        config::PoseidonGoldilocksConfig,
    },
};
use std::fs;

use crate::witness::Witness;

const D: usize = 2;
const SSH_BITS: usize = 8;

pub fn prove_circuit(
    witness: &Witness,
    out: &std::path::Path,
) -> Result<()> {
    let mut builder =
        CircuitBuilder::<GoldilocksField, D>::new(
            CircuitConfig::standard_recursion_config(),
        );

    // ---------------- Inputs ----------------
    let ssh_failed = builder.add_virtual_target();

    let shadow   = builder.add_virtual_bool_target_safe();
    let tmp_exec = builder.add_virtual_bool_target_safe();
    let outbound = builder.add_virtual_bool_target_safe();
    let kernel   = builder.add_virtual_bool_target_safe();
    let net_flap = builder.add_virtual_bool_target_safe();

    // ---------------- Bit decomposition ----------------
    let bits = builder.split_le(ssh_failed, SSH_BITS);

    // 🔐 CRITICAL: recompose bits back into ssh_failed
    // 🔐 Recompose bits back into ssh_failed (little-endian)
    let reconstructed = builder.le_sum(bits.iter());
    builder.connect(ssh_failed, reconstructed);

    builder.connect(ssh_failed, reconstructed);

    let b0 = bits[0]; // 1
    let b1 = bits[1]; // 2
    let b2 = bits[2]; // 4

    // any bit >= 8 → definitely >= 5
    let mut high_bit = builder._false();
    for &b in &bits[3..] {
        high_bit = builder.or(high_bit, b);
    }

    // b2 == 1 AND (b1 == 1 OR b0 == 1) → 5,6,7
    let b1_or_b0 = builder.or(b1, b0);
    let mid_range = builder.and(b2, b1_or_b0);

    let ssh_brute = builder.or(high_bit, mid_range);
    builder.assert_bool(ssh_brute); // 🔐 boolean safety

    // ---------------- Combine forensic logic ----------------
    let compromised = builder.or(ssh_brute, shadow);
    let compromised = builder.or(compromised, tmp_exec);
    let compromised = builder.or(compromised, outbound);
    let compromised = builder.or(compromised, kernel);
    let compromised = builder.or(compromised, net_flap);

    builder.assert_bool(compromised);
    builder.register_public_input(compromised.target);
    builder.register_public_input(shadow.target);
    builder.register_public_input(tmp_exec.target);
    builder.register_public_input(outbound.target);
    builder.register_public_input(kernel.target);
    builder.register_public_input(net_flap.target);


    // ---------------- Prove ----------------
    let data = builder.build::<PoseidonGoldilocksConfig>();
    let mut pw = PartialWitness::new();

    pw.set_target(
        ssh_failed,
        GoldilocksField::from_canonical_u64(witness.features.ssh_failed),
    )?;

    pw.set_bool_target(shadow,   witness.features.shadow   == 1)?;
    pw.set_bool_target(tmp_exec, witness.features.tmp_exec == 1)?;
    pw.set_bool_target(outbound, witness.features.outbound == 1)?;
    pw.set_bool_target(kernel,   witness.features.kernel   == 1)?;
    pw.set_bool_target(net_flap, witness.features.net_flap == 1)?;

    let proof = data.prove(pw)?;

    // ✅ serialize BEFORE verify (fixes move error)
    let proof_bytes = proof.to_bytes();
    data.verify(proof)?;

    // Ensure output directory exists
    if let Some(parent) = out.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(out, proof_bytes)?;

    // ---------------- Verdict for frontend ----------------
    let ssh_bruteforce = witness.features.ssh_failed >= 5;
    let compromised_flag =
        ssh_bruteforce ||
        witness.features.shadow == 1 ||
        witness.features.tmp_exec == 1 ||
        witness.features.outbound == 1 ||
        witness.features.kernel == 1 ||
        witness.features.net_flap == 1;

    println!(
        "VERDICT:{}",
        serde_json::json!({
            "compromised": compromised_flag,
            "reasons": {
                "ssh_bruteforce": ssh_bruteforce,
                "shadow_access": witness.features.shadow == 1,
                "tmp_exec": witness.features.tmp_exec == 1,
                "outbound_shell": witness.features.outbound == 1,
                "kernel_fault": witness.features.kernel == 1,
                "network_instability": witness.features.net_flap == 1
            }
        })
    );

    Ok(())
}
