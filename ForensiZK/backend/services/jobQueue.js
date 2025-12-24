// // Uses BullMQ to manage jobs and work off to the Rust prover
// const { Queue, Worker, QueueScheduler } = require('bullmq');
// const IORedis = require('ioredis');
// const path = require('path');
// const { spawn } = require('child_process');
// const wsProgress = require('../ws/progress');
// const fs = require('fs');

// const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
// const queueName = 'prover_jobs';
// const queue = new Queue(queueName, { connection });
// new QueueScheduler(queueName, { connection });

// const PROVER_BIN =
//   process.env.PROVER_BIN ||
//   path.resolve(__dirname, '..', '..', 'prover', 'target', 'release', 'forensic-zk');

// const PROOFS_DIR =
//   process.env.PROOFS_DIR ||
//   path.resolve(__dirname, '..', 'proofs');

// // Ensure proofs folder exists
// if (!fs.existsSync(PROOFS_DIR)) fs.mkdirSync(PROOFS_DIR, { recursive: true });

// async function addJob(payload) {
//   await queue.add('prove', payload, { attempts: 3 });
// }

// async function getStatus(proofId) {
//   const key = `proof_status:${proofId}`;
//   const status = await connection.hgetall(key);
//   if (!status || !status.status) return { status: 'unknown' };

//   if (status.progress) status.progress = parseInt(status.progress, 10);
//   return status;
// }

// // Build correct backend base URL
// function backendBase() {
//   return process.env.PUBLIC_BACKEND_URL ||
//          `http://localhost:${process.env.PORT || 4000}`;
// }

// // Worker: executes prover
// const worker = new Worker(
//   queueName,
//   async job => {
//     const { proofId, filePath } = job.data;

//     const outProof = path.join(PROOFS_DIR, `${proofId}.bin`);
//     const outPublic = path.join(PROOFS_DIR, `${proofId}.public.json`);

//     const args = [
//       'prove',
//       '--logfile', filePath,
//       '--out', outProof,
//       '--public-out', outPublic,
//       '--proof-id', proofId,
//     ];

//     return await runProver(PROVER_BIN, args, proofId, outProof);
//   },
//   { connection }
// );

// async function runProver(bin, args, proofId, outProof) {
//   return new Promise((resolve, reject) => {
//     const key = `proof_status:${proofId}`;
//     connection.hset(key, 'status', 'running', 'progress', 0);

//     const proc = spawn(bin, args);

//     proc.stdout.on('data', d => {
//       const s = d.toString();

//       // PROGRESS
//       if (s.includes('PROGRESS:')) {
//         const m = s.match(/PROGRESS:(\d{1,3})/);
//         if (m) {
//           const p = parseInt(m[1], 10);
//           connection.hset(key, 'progress', p);
//           wsProgress.broadcast(proofId, { progress: p });
//         }
//       }

//       // MERKLE
//       if (s.includes('MERKLE_ROOT:')) {
//         const m = s.match(/MERKLE_ROOT:([0-9a-fA-F]+)/);
//         if (m) {
//           connection.hset(key, 'merkle_root', m[1]);
//           wsProgress.broadcast(proofId, { merkle_root: m[1] });
//         }
//       }

//       // VERDICT
//       if (s.includes('VERDICT:')) {
//         try {
//           const j = JSON.parse(s.split('VERDICT:')[1]);
//           connection.hset(key, 'verdict', JSON.stringify(j));
//           wsProgress.broadcast(proofId, { verdict: j });
//         } catch (_) {}
//       }
//     });

//     proc.stderr.on('data', d =>
//       console.error('prover err:', d.toString())
//     );

//     proc.on('close', code => {
//       if (code === 0) {
//         const url = `${backendBase()}/proofs/${proofId}.bin`;

//         connection.hset(key, 'proof_download_url', url);
//         connection.hset(key, 'status', 'done');

//         wsProgress.broadcast(proofId, {
//           event: 'done',
//           proof_download_url: url
//         });

//         resolve();
//       } else {
//         connection.hset(key, 'status', 'error');
//         wsProgress.broadcast(proofId, { event: 'error' });
//         reject(new Error('prover exit ' + code));
//       }
//     });
//   });
// }


// module.exports = { addJob, getStatus };

// Uses BullMQ to manage jobs and work off to the Rust prover
const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');
const path = require('path');
const { spawn } = require('child_process');
const wsProgress = require('../ws/progress');
const fs = require('fs');

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const queueName = 'prover_jobs';
const queue = new Queue(queueName, { connection });
new QueueScheduler(queueName, { connection });

const PROVER_BIN =
  process.env.PROVER_BIN ||
  path.resolve(__dirname, '..', '..', 'prover', 'target', 'release', 'forensic-zk');

const PROOFS_DIR =
  process.env.PROOFS_DIR ||
  path.resolve(__dirname, '..', 'proofs');

if (!fs.existsSync(PROOFS_DIR)) {
  fs.mkdirSync(PROOFS_DIR, { recursive: true });
}

async function addJob(payload) {
  await queue.add('prove', payload, { attempts: 3 });
}

async function getStatus(proofId) {
  const key = `proof_status:${proofId}`;
  const status = await connection.hgetall(key);
  if (!status || !status.status) return { status: 'unknown' };

  if (status.progress) status.progress = parseInt(status.progress, 10);
  if (status.reasons) status.reasons = JSON.parse(status.reasons);
  if (status.verdict) status.verdict = JSON.parse(status.verdict);

  return status;
}

function backendBase() {
  return process.env.PUBLIC_BACKEND_URL ||
    `http://localhost:${process.env.PORT || 4000}`;
}

// Worker
const worker = new Worker(
  queueName,
  async job => {
    const { proofId, filePath } = job.data;

    const outProof = path.join(PROOFS_DIR, `${proofId}.bin`);
    const outPublic = path.join(PROOFS_DIR, `${proofId}.public.json`);

    const args = [
      'prove',
      '--logfile', filePath,
      '--out', outProof,
      '--public-out', outPublic,
      '--proof-id', proofId
    ];

    await runProver(PROVER_BIN, args, proofId);
  },
  { connection }
);

async function runProver(bin, args, proofId) {
  return new Promise((resolve, reject) => {
    const key = `proof_status:${proofId}`;
    connection.hset(key, 'status', 'running', 'progress', 0);

    const proc = spawn(bin, args);

    let stdoutBuffer = '';

    proc.stdout.on('data', d => {
      stdoutBuffer += d.toString();

      let lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        const s = line.trim();

        // PROGRESS
        if (s.startsWith('PROGRESS:')) {
          const p = parseInt(s.split(':')[1], 10);
          connection.hset(key, 'progress', p);
          wsProgress.broadcast(proofId, { progress: p });
        }

        // MERKLE ROOT
        if (s.startsWith('MERKLE_ROOT:')) {
          const root = s.split(':')[1];
          connection.hset(key, 'merkle_root', root);
          wsProgress.broadcast(proofId, { merkle_root: root });
        }

        // VERDICT (MOST IMPORTANT)
        if (s.startsWith('VERDICT:')) {
          try {
            const verdict = JSON.parse(s.replace('VERDICT:', ''));

            connection.hset(
              key,
              'verdict', JSON.stringify(verdict),
              'compromised', verdict.compromised ? 'true' : 'false',
              'reasons', JSON.stringify(verdict.reasons)
            );

            wsProgress.broadcast(proofId, {
              verdict,
              compromised: verdict.compromised,
              reasons: verdict.reasons
            });
          } catch (e) {
            console.error('Failed to parse VERDICT:', e);
          }
        }
      }
    });

    proc.stderr.on('data', d => {
      console.error('prover err:', d.toString());
    });

    proc.on('close', code => {
      if (code === 0) {
        const url = `${backendBase()}/proofs/${proofId}.bin`;

        connection.hset(
          key,
          'status', 'done',
          'proof_download_url', url
        );

        wsProgress.broadcast(proofId, {
          event: 'done',
          proof_download_url: url
        });

        resolve();
      } else {
        connection.hset(key, 'status', 'error');
        wsProgress.broadcast(proofId, { event: 'error' });
        reject(new Error('prover exit ' + code));
      }
    });
  });
}

module.exports = { addJob, getStatus };
