(() => {
  'use strict';
  const CHANNEL = 'csfloat-butane-preview-v1';
  const byId = new Map();
  let byInspect = new Map(), byPattern = new Map();
  const states = new Map();
  const failed = new Set();
  let enabled = false, queued = false;
  const normalize = value => { try { return decodeURIComponent(value); } catch { return value; } };
  function rebuild() {
    byInspect = new Map(); byPattern = new Map();
    for (const record of byId.values()) {
      for (const link of [record.inspect, record.serialized]) if (link) byInspect.set(normalize(link), record);
      // The same template produces the same appearance, even across different listings.
      byPattern.set(record.pattern, record);
    }
  }
  function restore(img, state) {
    img.removeEventListener('error', state.error);
    // Do not overwrite a new thumbnail if the site recycled this element.
    if (img.getAttribute('src') === state.url) {
      for (const [name, value] of Object.entries(state.original)) {
        if (value === null) img.removeAttribute(name); else img.setAttribute(name, value);
      }
    }
    img.classList.remove('bb-actual-preview');
    states.delete(img);
  }
  function match(card) {
    for (const anchor of card.querySelectorAll('a[href]')) {
      const href = anchor.getAttribute('href') || '';
      const inspect = byInspect.get(normalize(href));
      if (inspect) return inspect;
      const id = href.match(/\/item\/(\d+)/)?.[1];
      if (id && byId.has(id)) return byId.get(id);
    }
    const badge = card.querySelector('.keychain-pattern');
    const number = badge?.textContent.match(/#\s*([\d,]+)/)?.[1];
    return number ? byPattern.get(Number(number.replaceAll(',', ''))) : null;
  }
  function scan() {
    queued = false;
    for (const [img, state] of states) {
      if (!img.isConnected) { img.removeEventListener('error', state.error); states.delete(img); }
    }
    if (!enabled) { for (const [img, state] of states) restore(img, state); return; }
    for (const card of document.querySelectorAll('item-card')) {
      const img = card.querySelector('app-item-image-actions img.item-img');
      if (!img) continue;
      const name = card.querySelector('app-item-name .item-name')?.textContent.trim();
      const record = name === 'Butane Buddy' ? match(card) : null;
      const url = record ? `https://csfloat.pics/m/${record.screenshot}/playside.png?v=3` : null;
      const old = states.get(img);
      if (old && (old.url !== url || img.getAttribute('src') !== old.url)) restore(img, old);
      if (!url || failed.has(url) || states.has(img)) continue;
      const original = Object.fromEntries(['src', 'srcset', 'sizes', 'title'].map(key => [key, img.getAttribute(key)]));
      const state = {url, original, error: () => {
        failed.add(url);
        if (states.get(img) === state) restore(img, state);
      }};
      states.set(img, state);
      img.addEventListener('error', state.error);
      img.removeAttribute('srcset'); img.removeAttribute('sizes');
      img.classList.add('bb-actual-preview');
      img.title = `Actual inspect screenshot · Butane Buddy #${record.pattern}`;
      img.src = url;
    }
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(scan); } }
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.channel !== CHANNEL || event.data.type !== 'records' || !Array.isArray(event.data.records)) return;
    for (const record of event.data.records.slice(0, 4000)) {
      if (!record || !/^\d{1,24}$/.test(record.id) || !/^\d{1,24}$/.test(record.screenshot) || !Number.isInteger(record.pattern) || record.pattern < 0 || record.pattern > 100000) continue;
      byId.delete(record.id);
      byId.set(record.id, {id: record.id, screenshot: record.screenshot, pattern: record.pattern,
        inspect: typeof record.inspect === 'string' ? record.inspect : '', serialized: typeof record.serialized === 'string' ? record.serialized : ''});
    }
    while (byId.size > 4000) byId.delete(byId.keys().next().value);
    rebuild(); schedule();
  });
  chrome.storage.local.get({enabled: true}, settings => {enabled = settings.enabled !== false; schedule();});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.enabled) {
      enabled = changes.enabled.newValue !== false;
      if (enabled) failed.clear();
      schedule();
    }
  });
  const observer = new MutationObserver(schedule);
  observer.observe(document, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['src', 'srcset', 'href']});
  function addStyle() {
    if (!document.documentElement) return;
    const style = document.createElement('style');
    style.textContent = 'img.bb-actual-preview { object-fit: contain !important; object-position: center !important; }';
    document.documentElement.append(style);
  }
  if (document.documentElement) addStyle(); else document.addEventListener('DOMContentLoaded', addStyle, {once:true});
  window.postMessage({channel: CHANNEL, type: 'ready'}, location.origin);
})();
