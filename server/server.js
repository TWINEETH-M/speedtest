const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Ping endpoint - returns timestamp for latency measurement
app.get('/api/ping', (req, res) => {
  res.json({ timestamp: Date.now() });
});

// Download endpoint - streams random data for download speed test
app.get('/api/download', (req, res) => {
  const sizeMB = Math.min(parseInt(req.query.size) || 10, 100);
  const totalBytes = sizeMB * 1024 * 1024;
  const chunkSize = 64 * 1024; // 64KB chunks
  let bytesSent = 0;

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', totalBytes);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  function sendChunk() {
    while (bytesSent < totalBytes) {
      const remaining = totalBytes - bytesSent;
      const currentChunkSize = Math.min(chunkSize, remaining);
      const chunk = crypto.randomBytes(currentChunkSize);
      const canContinue = res.write(chunk);
      bytesSent += currentChunkSize;

      if (!canContinue) {
        res.once('drain', sendChunk);
        return;
      }
    }
    res.end();
  }

  sendChunk();
});

// Upload endpoint - accepts binary data for upload speed test
app.post('/api/upload', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  const receivedBytes = req.body ? req.body.length : 0;
  res.json({
    receivedBytes,
    receivedMB: (receivedBytes / (1024 * 1024)).toFixed(2),
    timestamp: Date.now()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`⚡ Speed Test Server running at http://localhost:${PORT}`);
  console.log(`📊 Open your browser to start testing!`);
});