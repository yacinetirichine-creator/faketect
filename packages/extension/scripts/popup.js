const API_URL = 'http://localhost:3001/api';
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const dropzoneView = document.getElementById('dropzone-view');
const previewView = document.getElementById('preview-view');
const loadingView = document.getElementById('loading-view');
const resultView = document.getElementById('result-view');
const previewImage = document.getElementById('preview-image');
const previewName = document.getElementById('preview-name');
const previewSize = document.getElementById('preview-size');
const analyzeBtn = document.getElementById('analyze-btn');
const resetBtn = document.getElementById('reset-btn');
const newBtn = document.getElementById('new-btn');
const errorMessage = document.getElementById('error-message');

let selectedFile = null, selectedBase64 = null;

function showView(v) { [dropzoneView, previewView, loadingView, resultView].forEach(x => x.style.display = 'none'); v.style.display = 'block'; }
function formatSize(b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(2) + ' MB'; }
function showError(m) { errorMessage.textContent = m; errorMessage.style.display = 'block'; }
function hideError() { errorMessage.style.display = 'none'; }

function handleFile(file) {
  if (!file.type.startsWith('image/')) { showError('Sélectionnez une image'); return; }
  if (file.size > 10485760) { showError('Max 10 MB'); return; }
  selectedFile = file; hideError();
  const reader = new FileReader();
  reader.onload = (e) => { selectedBase64 = e.target.result; previewImage.src = selectedBase64; previewName.textContent = file.name; previewSize.textContent = formatSize(file.size); showView(previewView); };
  reader.readAsDataURL(file);
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('active'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('active'));
dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('active'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });
resetBtn.addEventListener('click', () => { selectedFile = null; selectedBase64 = null; fileInput.value = ''; hideError(); showView(dropzoneView); });
newBtn.addEventListener('click', () => { selectedFile = null; selectedBase64 = null; showView(dropzoneView); });

analyzeBtn.addEventListener('click', async () => {
  if (!selectedBase64) return;
  showView(loadingView); hideError();
  try {
    const res = await fetch(`${API_URL}/analyze/base64`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: selectedBase64, filename: selectedFile?.name || 'image', source: 'extension' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur');
    displayResult(data.data);
  } catch (err) { showView(previewView); showError(err.message); }
});

function displayResult(r) {
  const score = Math.round(r.combined_score * 100);
  const conf = r.confidence_level;
  const scoreEl = document.getElementById('result-score');
  scoreEl.textContent = score + '%';
  scoreEl.className = 'result-score ' + (score > 70 ? 'high' : score > 40 ? 'medium' : 'low');
  document.getElementById('result-title').textContent = r.interpretation?.title || 'Analyse terminée';
  document.getElementById('result-desc').textContent = r.interpretation?.description || '';
  const badge = document.getElementById('result-badge');
  badge.textContent = 'Confiance ' + (conf === 'high' ? 'haute' : conf === 'medium' ? 'moyenne' : 'faible');
  badge.className = 'result-badge ' + conf;
  document.getElementById('engine-se').textContent = r.engines?.sightengine?.score != null ? Math.round(r.engines.sightengine.score * 100) + '%' : '-';
  document.getElementById('engine-il').textContent = r.engines?.illuminarty?.score != null ? Math.round(r.engines.illuminarty.score * 100) + '%' : '-';
  const exifWarn = document.getElementById('exif-warning');
  exifWarn.style.display = r.exif?.aiMarkers?.hasMarkers ? 'block' : 'none';
  showView(resultView);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ANALYZE_IMAGE') {
    fetch(msg.imageUrl).then(r => r.blob()).then(blob => handleFile(new File([blob], 'image.jpg', { type: blob.type }))).catch(() => showError('Impossible de charger'));
  }
});
