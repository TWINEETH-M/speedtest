const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Helper: fetch JSON from an HTTPS URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error('HTTP ' + res.statusCode + ': upstream request failed'));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', reject);
  });
}

// Phone search endpoint - proxies to GSMArena specs API
app.get('/api/phone/search', async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string' || query.length > 200) {
    return res.status(400).json({ error: 'Query parameter "q" is required (max 200 chars)' });
  }
  try {
    const data = await fetchJSON(
      'https://phone-specs-api.azharimm.dev/v2/search?query=' + encodeURIComponent(query)
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch phone data', message: err.message });
  }
});

// Phone details endpoint - proxies to GSMArena specs API
app.get('/api/phone/details', async (req, res) => {
  const slug = req.query.slug;
  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'A valid slug parameter is required (lowercase alphanumeric and hyphens only)' });
  }
  try {
    const data = await fetchJSON(
      'https://phone-specs-api.azharimm.dev/v2/' + slug
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch phone details', message: err.message });
  }
});

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