require('dotenv').config();

// ensure directories exist BEFORE worker runs
const uploadService = require('./services/upload');
uploadService.ensureDirs();

require('./services/jobQueue');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const proveRoute = require('./routes/prove');
const verifyRoute = require('./routes/verify');
const statusRoute = require('./routes/status');
const authRoute = require('./routes/auth');
const wsProgress = require('./ws/progress');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.use('/api/prove', proveRoute);
app.use('/api/verify', verifyRoute);
app.use('/api/prove/status', statusRoute);
app.use('/api/auth', authRoute);

// serve uploaded files
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));
app.use('/proofs', express.static(path.resolve(process.env.PROOFS_DIR || './proofs')));

const server = require('http').createServer(app);
wsProgress.attach(server);

server.listen(PORT, () => {
  console.log(`ForensiZK backend listening on http://localhost:${PORT}`);
});
