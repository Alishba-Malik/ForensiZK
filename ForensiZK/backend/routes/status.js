// const express = require('express');
// const jobQueue = require('../services/jobQueue');
// const router = express.Router();


// router.get('/', async (req, res) => {
// const proofId = req.query.proof_id;
// if (!proofId) return res.status(400).json({ error: 'missing proof_id' });
// const status = await jobQueue.getStatus(proofId);
// return res.json(status);
// });


// module.exports = router;

const express = require('express');
const jobQueue = require('../services/jobQueue');
const router = express.Router();

function normalizeStatus(status) {
  if (!status) return status;

  if (typeof status.verdict === 'string') {
    try {
      status.verdict = JSON.parse(status.verdict);
    } catch (_) {
      status.verdict = null;
    }
  }

  if (!status.verdict && status.reasons) {
    try {
      status.verdict = {
        compromised: status.compromised === 'true',
        reasons: typeof status.reasons === 'string'
          ? JSON.parse(status.reasons)
          : status.reasons
      };
    } catch (_) {
      status.verdict = null;
    }
  }

  return status;
}

router.get('/', async (req, res) => {
  const proofId = req.query.proof_id;
  if (!proofId) return res.status(400).json({ error: 'missing proof_id' });

  const status = await jobQueue.getStatus(proofId);
  return res.json(normalizeStatus(status));
});

module.exports = router;
