chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-image',
    title: '🔍 Analyser avec AI Detector',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-image') {
    chrome.action.openPopup();
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: 'ANALYZE_IMAGE', imageUrl: info.srcUrl });
    }, 500);
  }
});
