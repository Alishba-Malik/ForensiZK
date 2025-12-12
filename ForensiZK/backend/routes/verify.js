const express = require('express');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');


const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', 'uploads');
const PROOFS_DIR = process.env.PROOFS_DIR || path.resolve(__dirname, '..', 'proofs');
const PROVER_BIN = process.env.PROVER_BIN || path.resolve(__dirname, '..', '..', 'prover', 'target', 'release', 'forensic-zk');


const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, UPLOAD_DIR),
filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });
const router = express.Router();


router.post('/', upload.single('proof'), async (req, res) => {
try {
if (!req.file) return res.status(400).send('missing proof file');
const publicInput = req.body.public_input || null;
const proofPath = req.file.path;
// call prover verify command
const args = ['verify', '--proof', proofPath];
if (publicInput) args.push('--public', publicInput);
const proc = spawn(PROVER_BIN, args);
let out = '';
let err = '';
proc.stdout.on('data', d => out += d.toString());
proc.stderr.on('data', d => err += d.toString());
proc.on('close', code => {
if (code === 0) return res.json({ ok: true, output: out });
return res.status(400).json({ ok: false, error: err || out });
});
} catch (e) {
console.error(e);
res.status(500).send('server error');
}
});


module.exports = router;