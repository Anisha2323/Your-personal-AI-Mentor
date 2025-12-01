import { getStoredApiKey } from './ai-client.js';

const apiStatus = document.getElementById('api-status');
const optionsBtn = document.getElementById('open-options');
const openPanelBtn = document.getElementById('open-panel');
const refreshBtn = document.getElementById('refresh-panel');

init();

function init() {
  reflectApiKey();
  optionsBtn?.addEventListener('click', () => {
    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  openPanelBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('panel.html') });
  });

  refreshBtn?.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'YPM_TOGGLE_PANEL' });
      window.close();
    }
  });
}

async function reflectApiKey() {
  const key = await getStoredApiKey();
  apiStatus.textContent = key ? 'Ready for live hints' : 'API key missing (fallback mode)';
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}
