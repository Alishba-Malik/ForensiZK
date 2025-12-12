// Very small websocket server to broadcast job progress updates
const WebSocket = require('ws');
const url = require('url');


let wss = null;


function attach(server) {
wss = new WebSocket.Server({ server, path: '/ws/progress' });


wss.on('connection', (socket, req) => {
const params = url.parse(req.url, true).query;
const proofId = params.proofId;
// store mapping in socket for filtering
socket.proofId = proofId;


socket.on('message', msg => { /* ignore */ });
socket.on('close', () => {});
});
}


function broadcast(proofId, data) {
if (!wss) return;
for (const client of wss.clients) {
if (client.readyState === WebSocket.OPEN) {
// if client requested a specific proofId, filter
if (!client.proofId || client.proofId === proofId) client.send(JSON.stringify(data));
}
}
}


module.exports = { attach, broadcast };