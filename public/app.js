const GAUGE_ARC_LENGTH = 377;
let isRunning = false;

const speedValue = document.getElementById('speedValue');
const gaugeArc = document.getElementById('gaugeArc');
const testPhase = document.getElementById('testPhase');
const startBtn = document.getElementById('startBtn');
const pingResult = document.getElementById('pingResult');
const downloadResult = document.getElementById('downloadResult');
const uploadResult = document.getElementById('uploadResult');
const pingCard = document.getElementById('pingCard');
const downloadCard = document.getElementById('downloadCard');
const uploadCard = document.getElementById('uploadCard');

function setGauge(speed, maxSpeed) {
  maxSpeed = maxSpeed || 100;
  var ratio = Math.min(speed / maxSpeed, 1);
  var dashLength = ratio * GAUGE_ARC_LENGTH;
  gaugeArc.setAttribute('stroke-dasharray', dashLength + ' ' + GAUGE_ARC_LENGTH);
  speedValue.textContent = speed.toFixed(1);
}

function resetGauge() {
  setGauge(0);
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function testPing() {
  testPhase.textContent = 'Testing Ping...';
  testPhase.classList.remove('idle');
  pingCard.classList.add('active');
  var pings = [];
  for (var i = 0; i < 10; i++) {
    try {
      var start = performance.now();
      await fetch('/api/ping?t=' + Date.now(), { cache: 'no-store' });
      var end = performance.now();
      pings.push(end - start);
      var avg = pings.reduce(function(a, b) { return a + b; }, 0) / pings.length;
      pingResult.textContent = Math.round(avg);
      speedValue.textContent = Math.round(avg);
    } catch (err) {
      console.error('Ping error:', err);
    }
    await sleep(100);
  }
  if (pings.length > 4) {
    pings.sort(function(a, b) { return a - b; });
    pings.shift();
    pings.pop();
  }
  var avgPing = pings.length > 0 ? pings.reduce(function(a, b) { return a + b; }, 0) / pings.length : 0;
  pingResult.textContent = Math.round(avgPing);
  pingCard.classList.remove('active');
  pingCard.classList.add('done');
  return avgPing;
}

async function testDownload() {
  testPhase.textContent = 'Testing Download...';
  downloadCard.classList.add('active');
  resetGauge();
  var totalBytes = 0;
  var testDuration = 10000;
  var startTime = performance.now();
  var lastUpdate = startTime;
  try {
    while (performance.now() - startTime < testDuration) {
      var response = await fetch('/api/download?size=10&t=' + Date.now(), { cache: 'no-store' });
      var reader = response.body.getReader();
      while (true) {
        var result = await reader.read();
        if (result.done) break;
        totalBytes += result.value.length;
        var now = performance.now();
        var elapsed = (now - startTime) / 1000;
        if (now - lastUpdate > 100) {
          var speedMbps = (totalBytes * 8) / elapsed / 1000000;
          setGauge(speedMbps);
          downloadResult.textContent = speedMbps.toFixed(1);
          lastUpdate = now;
        }
        if (performance.now() - startTime >= testDuration) {
          await reader.cancel();
          break;
        }
      }
      if (performance.now() - startTime >= testDuration) break;
    }
  } catch (err) {
    console.error('Download error:', err);
  }
  var elapsedFinal = (performance.now() - startTime) / 1000;
  var finalSpeed = (totalBytes * 8) / elapsedFinal / 1000000;
  downloadResult.textContent = finalSpeed.toFixed(1);
  setGauge(finalSpeed);
  downloadCard.classList.remove('active');
  downloadCard.classList.add('done');
  return finalSpeed;
}

async function testUpload() {
  testPhase.textContent = 'Testing Upload...';
  uploadCard.classList.add('active');
  resetGauge();
  var testDuration = 10000;
  var chunkSize = 2 * 1024 * 1024;
  var totalBytes = 0;
  var startTime = performance.now();
  try {
    while (performance.now() - startTime < testDuration) {
      var data = new ArrayBuffer(chunkSize);
      var view = new Uint8Array(data);
      for (var i = 0; i < view.length; i += 1024) {
        view[i] = Math.random() * 256;
      }
      await new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload?t=' + Date.now(), true);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.upload.onprogress = function(e) {
          if (e.lengthComputable) {
            var now = performance.now();
            var elapsed = (now - startTime) / 1000;
            var currentTotal = totalBytes + e.loaded;
            var speedMbps = (currentTotal * 8) / elapsed / 1000000;
            setGauge(speedMbps);
            uploadResult.textContent = speedMbps.toFixed(1);
          }
        };
        xhr.onload = function() {
          totalBytes += chunkSize;
          resolve();
        };
        xhr.onerror = function() { reject(new Error('Upload failed')); };
        xhr.timeout = 30000;
        xhr.ontimeout = function() { reject(new Error('Upload timeout')); };
        xhr.send(data);
      });
      if (performance.now() - startTime >= testDuration) break;
    }
  } catch (err) {
    console.error('Upload error:', err);
  }
  var elapsedFinal = (performance.now() - startTime) / 1000;
  var finalSpeed = (totalBytes * 8) / elapsedFinal / 1000000;
  uploadResult.textContent = finalSpeed.toFixed(1);
  setGauge(finalSpeed);
  uploadCard.classList.remove('active');
  uploadCard.classList.add('done');
  return finalSpeed;
}

async function startTest() {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;
  startBtn.querySelector('.btn-text').textContent = 'TESTING...';
  pingResult.textContent = '--';
  downloadResult.textContent = '--';
  uploadResult.textContent = '--';
  pingCard.classList.remove('active', 'done');
  downloadCard.classList.remove('active', 'done');
  uploadCard.classList.remove('active', 'done');
  resetGauge();
  try {
    await testPing();
    await sleep(500);
    await testDownload();
    await sleep(500);
    await testUpload();
    testPhase.textContent = 'Test Complete!';
    testPhase.classList.add('idle');
    setTimeout(function() {
      testPhase.textContent = 'Press START to test again';
    }, 3000);
  } catch (err) {
    console.error('Test error:', err);
    testPhase.textContent = 'Error occurred. Try again.';
    testPhase.classList.add('idle');
  }
  startBtn.disabled = false;
  startBtn.querySelector('.btn-text').textContent = 'START TEST';
  isRunning = false;
}

testPhase.classList.add('idle');
