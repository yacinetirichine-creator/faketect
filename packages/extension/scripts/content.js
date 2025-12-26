// Content script - AI Vision Detector v2.0
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'HIGHLIGHT_IMAGE') {
    document.querySelectorAll('img').forEach(img => {
      if (img.src === msg.imageUrl) img.style.outline = '3px solid #0ea5e9';
    });
  }
});
