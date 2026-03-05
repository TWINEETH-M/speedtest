// Speed Test Logic
function startTest() {
  // Placeholder for actual speed test logic
  const speedValue = document.getElementById('speedValue');
  const pingResult = document.getElementById('pingResult');
  const downloadResult = document.getElementById('downloadResult');
  const uploadResult = document.getElementById('uploadResult');

  // Example values for testing
  speedValue.textContent = Math.floor(Math.random() * 101);
  pingResult.textContent = Math.floor(Math.random() * 100) + " ms";
  downloadResult.textContent = (Math.random() * 100).toFixed(2) + " Mbps";
  uploadResult.textContent = (Math.random() * 100).toFixed(2) + " Mbps";

  document.getElementById('testPhase').classList.remove('idle');
  document.getElementById('testPhase').textContent = 'Testing...';
}