'use strict';
const toggle = document.getElementById('enabled');
const status = document.getElementById('status');
function show(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled ? 'On — showing available inspect images.' : 'Off — original CSFloat thumbnails restored.';
}
chrome.storage.local.get({enabled: true}, settings => {show(settings.enabled !== false); toggle.disabled = false;});
toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  try { await chrome.storage.local.set({enabled}); show(enabled); }
  catch { show(!enabled); status.textContent = 'Could not save. Try again.'; }
});
