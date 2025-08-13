// popup.js — controls settings
const DEFAULTS = { showInChats: false, legacyComposer: false };

document.addEventListener('DOMContentLoaded', () => {
  const cbLegacy = document.getElementById('legacyComposer');

  chrome.storage.sync.get(DEFAULTS, (res) => {
    cbLegacy.checked = !!res.legacyComposer;
  });

  cbLegacy.addEventListener('change', () => {
    chrome.storage.sync.set({ legacyComposer: cbLegacy.checked });
  });
});
