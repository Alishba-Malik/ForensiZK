const express = require('express');
const router = express.Router();


// NOTE: This is a placeholder. Implement OPAQUE or your preferred auth.
router.get('/session', (req, res) => {
// return session info if logged in (cookie or token)
res.json({ user: null });
});


router.post('/logout', (req, res) => {
res.json({ ok: true });
});


module.exports = router;