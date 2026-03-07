# ⚡ Internet Speed Test & 📱 Mobile Specs Finder

A modern, real-time internet speed test and mobile phone specifications finder built with Node.js and vanilla JavaScript. Features a beautiful dark-themed UI with animated graphics.

## ✨ Features

- **Real-time Download Speed** — Streams large payloads and calculates Mbps live
- **Real-time Upload Speed** — Tracks upload progress with XMLHttpRequest
- **Ping / Latency** — Measures round-trip time across multiple requests
- **Animated SVG Gauge** — Smooth, glowing speed gauge with gradient arc
- **📱 Mobile Phone Specs** — Search any phone by name and view full specifications
- **Google Search Integration** — Quick link to search phone specs on Google
- **Dark Premium UI** — Modern gradient background with glass-effect cards
- **Responsive Design** — Works on mobile and desktop
- **No Frameworks** — Pure vanilla HTML, CSS, and JavaScript

## 🛠 Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Fonts:** Google Fonts (Orbitron, Rajdhani)

## 📋 Prerequisites

- Node.js 16+ installed

## 🚀 Getting Started

```bash
cd server
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ping` | Returns `{ timestamp }` for latency measurement |
| GET | `/api/download?size=10` | Streams random binary data (default 10MB) |
| POST | `/api/upload` | Accepts binary payload, returns bytes received |
| GET | `/api/phone/search?q=name` | Searches for phone specs by name (proxies GSMArena API) |
| GET | `/api/phone/details?slug=id` | Returns full specifications for a specific phone |

## 🔬 How It Works

1. **Ping Test:** Sends 10 requests to `/api/ping`, measures round-trip time, removes outliers, and averages the result.
2. **Download Test:** Fetches streaming data from `/api/download` using `ReadableStream`, calculates speed in real-time over ~10 seconds.
3. **Upload Test:** Generates random binary blobs and POSTs them to `/api/upload` using `XMLHttpRequest` with progress tracking over ~10 seconds.
4. **Phone Specs:** Enter a phone name to search the GSMArena database via a server proxy. Results show full specifications with graphics. A Google search link is always available as a fallback.

## 📄 License

MIT
