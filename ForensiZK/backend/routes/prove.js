const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');


const uploadService = require('../services/upload');
const jobQueue = require('../services/jobQueue');


const router = express.Router();


const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, UPLOAD_DIR),
filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });


router.post('/', upload.single('logfile'), async (req, res) => {
try {
if (!req.file) return res.status(400).send('missing file');
const proofId = uuidv4();
// enqueue job: file path + proof id
await jobQueue.addJob({ proofId, filePath: req.file.path });
return res.json({ ok: true, proof_id: proofId });
} catch (err) {
console.error(err);
return res.status(500).send('server error');
}
});


module.exports = router;