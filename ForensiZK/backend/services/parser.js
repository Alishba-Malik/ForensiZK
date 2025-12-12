// Minimal parser to convert a log file (JSON array or newline JSON) into canonical events
const fs = require('fs');
const { leafHash } = require('./merkle');

function parseLogFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let items = [];
  try {
    // try parse as JSON array
    const j = JSON.parse(raw);
    if (Array.isArray(j)) items = j;
  } catch (e) {
    // fallback: newline-delimited JSON
    items = raw.split('\n').map(l => { try { return JSON.parse(l) } catch(e){ return { message: l } } });
  }

  // canonicalize minimal example: index, ts (seconds), user (hash), message_hash
  return items.map((it, i) => {
    const ts = it.timestamp ? Math.floor(new Date(it.timestamp).getTime() / 1000) : 0;
    const obj = {
      index: i,
      ts: ts,
      src: it.src || it.service || null,
      user: it.user || null,
      action: it.action || null,
      message: it.message || (it.msg || null)
    };
    const leaf = leafHash(obj);
    return { canonical: obj, leaf };
  });
}

module.exports = { parseLogFile };
