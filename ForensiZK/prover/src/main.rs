use structopt::StructOpt;
use std::path::PathBuf;
use std::io::Write;


mod parser;
mod commit;
mod circuit;
mod witness;
mod utils;

#[derive(StructOpt, Debug)]
#[structopt(name = "forensic-zk")]
enum Opt {
    #[structopt(name = "prove")]
    Prove {
        #[structopt(long)] logfile: PathBuf,
        #[structopt(long)] out: PathBuf,
        #[structopt(long = "public-out")] public_out: Option<PathBuf>,
        #[structopt(long = "proof-id")] proof_id: Option<String>
    },
    #[structopt(name = "verify")]
    Verify {
        #[structopt(long)] proof: PathBuf,
        #[structopt(long)] public: Option<String>
    }
}

fn main() -> anyhow::Result<()> {
    let opt = Opt::from_args();
    match opt {
        Opt::Prove { logfile, out, public_out, proof_id } => {
            // 1. parse and canonicalize
            let events = parser::parse_file(&logfile)?;
            // 2. build leaves and merkle root
            let leaves = commit::make_leaves(&events);
            let root = commit::build_merkle_root(&leaves);
            println!("MERKLE_ROOT:{}", hex::encode(&root));
            std::io::stdout().flush().unwrap();
        
            // 3. build witness
            println!("PROGRESS:10");
            std::io::stdout().flush().unwrap();
            let witness = witness::build_witness(&events, &leaves)?;
        
            // 4. simulate progress before circuit proving
            println!("PROGRESS:30");
            std::io::stdout().flush().unwrap();
        
            // 5. heavy proving — no internal logs, so wrap it
            circuit::prove_circuit(
                &witness,
                &out,
                public_out.as_ref().map(|p| p.as_path())
            )?;
        
            // simulate near-end progress
            println!("PROGRESS:80");
            std::io::stdout().flush().unwrap();
        
            // done
            println!("PROGRESS:100");
            std::io::stdout().flush().unwrap();
        
            // 6. emit verdict example
            let verdict = serde_json::json!({"compromised": false, "reason_code": 0});
            println!("VERDICT:{}", serde_json::to_string(&verdict)?);
            std::io::stdout().flush().unwrap();
        
            Ok(())
        }
        

        Opt::Verify { proof, public } => {
            // TODO: implement verify (call plonky2 verify routines)
            println!("VERIFY stub: {}", proof.display());
            Ok(())
        }
    }
}
