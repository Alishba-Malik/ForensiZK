// use structopt::StructOpt;
// use std::path::PathBuf;
// use std::io::Write;
// use crate::commit::build_merkle_root;
// use plonky2::field::goldilocks_field::GoldilocksField;
// use plonky2::field::types::Field;



// mod parser;
// mod analyzer;
// mod commit;
// mod circuit;
// mod witness;
// mod utils;

// #[derive(StructOpt, Debug)]
// #[structopt(name = "forensic-zk", about = "ZK forensic log prover")]
// enum Opt {
//     /// Generate a zero-knowledge proof from a log file
//     Prove {
//         /// Input log file (syslog / JSON / text)
//         #[structopt(long)]
//         logfile: PathBuf,

//         /// Output proof file (.bin)
//         #[structopt(long)]
//         out: PathBuf,

//         /// Optional public outputs (future use)
//         #[structopt(long)]
//         public_out: Option<PathBuf>,

//         /// Optional proof/job identifier (backend tracking)
//         #[structopt(long)]
//         proof_id: Option<String>,
//     },

//     /// Verify a proof
//     Verify {
//         /// Proof file to verify
//         #[structopt(long)]
//         proof: PathBuf,
//     },
// }

// fn main() -> anyhow::Result<()> {
//     let opt = Opt::from_args();

//     match opt {
//         Opt::Prove {
//             logfile,
//             out,
//             public_out,
//             ..
//         } => {
//             // ---------------- Parse logs ----------------
//             let records = parser::parse_file(&logfile)?;
//             println!("PROGRESS:10");

//             // ---------------- Build witness ----------------
//             let leaves: Vec<u64> = records.iter().map(|r| r.ts).collect();
//             let witness = witness::build_witness(&records, &leaves)?;
//             let merkle_root = build_merkle_root(&leaves);



//             println!("PROGRESS:30");
//             std::io::stdout().flush().unwrap();

//             // ---------------- Prove circuit ----------------
//             circuit::prove_circuit(&witness, &out)?;


//             // ---------------- Write public outputs ----------------
//             // if let Some(path) = public_out {
//             //     let public_inputs = proof.public_inputs.clone();

//             //     let public_json = serde_json::json!({
//             //         "compromised": public_inputs[0] == GoldilocksField::ONE,
//             //         "reasons": {
//             //             "shadow_access": public_inputs[1] == GoldilocksField::ONE,
//             //             "tmp_exec": public_inputs[2] == GoldilocksField::ONE,
//             //             "outbound_shell": public_inputs[3] == GoldilocksField::ONE,
//             //             "kernel_fault": public_inputs[4] == GoldilocksField::ONE,
//             //             "network_instability": public_inputs[5] == GoldilocksField::ONE
//             //         },
//             //         "merkle_root": format!("{:x}", merkle_root.elements[0].to_canonical_u64())

//             //     });

//             //     std::fs::write(
//             //         path,
//             //         serde_json::to_vec_pretty(&public_json)?
//             //     )?;
//             // }



//             // print Merkle root (backend + frontend listen for this)
//             println!(
//                 "MERKLE_ROOT:{:x}",
//                 merkle_root.elements[0].to_canonical_u64()
//             );

//             println!("PROGRESS:100");
//             Ok(())
//         }

//         // Opt::Verify { proof } => {
//         //     // let data = circuit::load_circuit_data()?; // however you store it
//         //     let proof = data.load_proof(&proof)?;
        
//         //     data.verify(proof.clone())?;
        
//         //     let public = proof.public_inputs;
        
//         //     let result = serde_json::json!({
//         //         "compromised": public[0] == GoldilocksField::ONE,
//         //         "reasons": {
//         //             "shadow_access": public[1] == GoldilocksField::ONE,
//         //             "tmp_exec": public[2] == GoldilocksField::ONE,
//         //             "outbound_shell": public[3] == GoldilocksField::ONE,
//         //             "kernel_fault": public[4] == GoldilocksField::ONE,
//         //             "network_instability": public[5] == GoldilocksField::ONE
//         //         }
//         //     });
        
//         //     println!(
//         //         "VERIFIED_PUBLIC_OUTPUT:{}",
//         //         serde_json::to_string_pretty(&result)?
//         //     );
        
//         //     Ok(())
//         // }
//         Opt::Verify { proof } => {
//             println!("VERIFY stub: {}", proof.display());
//             Ok(())
//         }
        
        
//     }


use structopt::StructOpt;
use std::path::PathBuf;
use std::io::Write;

mod parser;
mod analyzer;
mod commit;
mod circuit;
mod witness;
mod utils;

#[derive(StructOpt, Debug)]
#[structopt(name = "forensic-zk", about = "ZK forensic log prover")]
enum Opt {
    /// Generate a zero-knowledge proof from a log file
    Prove {
        /// Input log file (syslog / JSON / text)
        #[structopt(long)]
        logfile: PathBuf,

        /// Output proof file (.bin)
        #[structopt(long)]
        out: PathBuf,

        /// Optional public outputs (future use)
        #[structopt(long)]
        public_out: Option<PathBuf>,

        /// Optional proof/job identifier (backend tracking)
        #[structopt(long)]
        proof_id: Option<String>,
    },

    /// Verify a proof
    Verify {
        /// Proof file to verify
        #[structopt(long)]
        proof: PathBuf,
    },
}

fn main() -> anyhow::Result<()> {
    let opt = Opt::from_args();

    match opt {
        Opt::Prove {
            logfile,
            out,
            ..
        } => {
            // ---------------- Parse logs ----------------
            let records = parser::parse_file(&logfile)?;
            println!("PROGRESS:10");

            // ---------------- Build witness ----------------
            let leaves: Vec<u64> = records.iter().map(|r| r.ts).collect();
            let witness = witness::build_witness(&records, &leaves)?;

            println!("PROGRESS:30");
            std::io::stdout().flush().unwrap();

            // ---------------- Prove circuit ----------------
            circuit::prove_circuit(&witness, &out)?;

            println!("PROGRESS:100");
            Ok(())
        }

        Opt::Verify { proof } => {
            println!("VERIFY stub: {}", proof.display());
            Ok(())
        }
    }
}

