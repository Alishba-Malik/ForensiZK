const crypto = require('crypto');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function leafHash(obj) {
  // deterministic leaf serialization — users must replicate this in prover
  const s = JSON.stringify(obj, Object.keys(obj).sort());
  return sha256(Buffer.from(s));
}

function buildMerkleHex(leaves) {
  if (!leaves || leaves.length === 0) return sha256(Buffer.from(''));
  let layer = leaves.map(l => Buffer.from(l, 'hex'));
  while (layer.length > 1) {
    if (layer.length % 2 === 1) layer.push(layer[layer.length - 1]);
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const h = crypto.createHash('sha256');
      h.update(layer[i]);
      h.update(layer[i+1]);
      next.push(h.digest());
    }
    layer = next;
  }
  return layer[0].toString('hex');
}

module.exports = { leafHash, buildMerkleHex };
