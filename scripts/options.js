import { getStoredApiKey, getPreferredModel } from './ai-client.js';

const input = document.getElementById('api-key');
const select = document.getElementById('model');
const button = document.getElementById('save');
const status = document.getElementById('status');

init();

async function init() {
  input.value = (await getStoredApiKey()) || '';
  select.value = await getPreferredModel();
  button?.addEventListener('click', handleSave);
}

function handleSave() {
  const toSave = {
    ypm_api_key: input.value.trim(),
    ypm_model: select.value
  };

  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    chrome.storage.sync.set(toSave, () => setStatus('Saved securely to Chrome Sync.'));
  } else {
    window.localStorage.setItem('ypm_api_key', toSave.ypm_api_key);
    window.localStorage.setItem('ypm_model', toSave.ypm_model);
    setStatus('Saved locally.');
  }
}

function setStatus(message) {
  status.textContent = message;
  setTimeout(() => {
    status.textContent = '';
  }, 4000);
}
