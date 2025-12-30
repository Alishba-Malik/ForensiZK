# ForensiZK

**PLONK-backed Verifiable Log Forensics with Explainable Anomaly Proofs**

ForensiZK is a research-oriented prototype that demonstrates how **forensic log analysis** can be made **cryptographically verifiable** using **zero-knowledge proofs**, while still providing **human-readable explanations** of detected anomalies such as SSH brute force, outbound shells, kernel faults, and temporary execution abuse.

The system allows an analyst to prove that a log file was analyzed correctly **without revealing the raw log contents**, ensuring integrity, privacy, and forensic trust.

---

##  Key Features

* **Zero-Knowledge Log Analysis**

  * Log integrity and analysis verified using PLONK-style proofs
  * No raw log disclosure during verification

* **Explainable Forensic Verdicts**

  * Proofs include structured anomaly indicators (e.g., SSH brute force, outbound shell)
  * Frontend renders human-readable reasons instead of opaque hashes

* **End-to-End Verifiability**

  * Proof generation (Prove)
  * Proof verification (Verify)
  * Public outputs & Merkle roots

* **Real-Time Progress Tracking**

  * Live prover progress via WebSockets
  * Background job processing with BullMQ + Redis

* **Modern Web Interface**

  * Next.js based frontend
  * Clean separation between cryptographic backend and UI

---

## How It Works

### 1. Log Analysis (Prove)

1. User uploads a log file
2. Backend queues a ZK proving job
3. Rust prover:

   * Parses logs
   * Detects forensic anomalies
   * Generates a zero-knowledge proof
4. Backend streams progress and verdict to frontend

### 2. Proof Verification (Verify)

1. User uploads a proof file
2. Prover verifies proof correctness
3. Result includes:

   * Valid / Invalid proof
   * Same indicators (explainability preserved)

---

## Example Verdict Output

```json
{
  "compromised": true,
  "reasons": {
    "kernel_fault": true,
    "network_instability": false,
    "outbound_shell": true,
    "shadow_access": false,
    "ssh_bruteforce": false,
    "tmp_exec": true
  }
}
```

This verdict is **derived during proving**, not inferred after verification, preserving forensic integrity.

---

## Tech Stack

### Cryptography & Proving

* PLONK-style zero-knowledge proofs
* Rust-based prover
* Merkle commitments for log integrity

### Backend

* Node.js + Express
* BullMQ + Redis (job queue)
* WebSockets for live updates

### Frontend

* Next.js
* Tailwind-based UI
* Real-time proof progress & verdict rendering

---

## Running the Project (High-Level)

### Prerequisites

* Rust (stable)
* Node.js (v18+)
* Redis

### Backend

```bash
cd backend
npm install
npm start
```

### Prover

```bash
cd prover
cargo build --release
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

##  Academic Context

This project was developed as part of a **university security / distributed computing / applied cryptography project**, focusing on:

* Verifiable computation
* Zero-knowledge proofs
* Explainable security systems
* Digital forensics without data disclosure

It is a **prototype**, not a production forensic tool.

---

## Limitations

* Not optimized for very large log files
* Proof generation time depends on log size
* Only works for RFC-3164 style sys logs.

---

## Future Work

* Recursive proofs for large-scale logs
* Formal threat model
* More granular anomaly classification

---

## License

This project is released under the [**MIT License**](https://github.com/Alishba-Malik/ForensiZK/blob/main/LICENSE) for academic and research use.
