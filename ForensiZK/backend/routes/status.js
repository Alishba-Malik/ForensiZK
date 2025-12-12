const express = require('express');
const jobQueue = require('../services/jobQueue');
const router = express.Router();


router.get('/', async (req, res) => {
const proofId = req.query.proof_id;
if (!proofId) return res.status(400).json({ error: 'missing proof_id' });
const status = await jobQueue.getStatus(proofId);
return res.json(status);
});


module.exports = router;