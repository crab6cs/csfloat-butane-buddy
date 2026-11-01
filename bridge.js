// Observe the page's existing listing responses. Never issue extra API requests.
(() => {
  'use strict';
  const CHANNEL = 'csfloat-butane-preview-v1';
  const cache = new Map();
  function isListingURL(value) {
    try {
      const url = new URL(value, location.href);
      return url.origin === location.origin && /^\/api\/v1\/listings(?:\/|$)/.test(url.pathname);
    } catch { return false; }
  }
  function send(records) {
    window.postMessage({channel: CHANNEL, type: 'records', records}, location.origin);
  }
  function capture(payload) {
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : payload?.item ? [payload] : [];
    const records = [];
    for (const row of rows) {
      const item = row?.item;
      if (!item || Number(item.keychain_index) !== 81 || !/^\d{1,24}$/.test(String(item.cs2_screenshot_id ?? ''))) continue;
      const pattern = Number(item.keychain_pattern);
      if (!Number.isInteger(pattern) || pattern < 0 || pattern > 100000) continue;
      const record = {
        id: String(row.id), pattern, screenshot: String(item.cs2_screenshot_id),
        inspect: typeof item.inspect_link === 'string' ? item.inspect_link : '',
        serialized: typeof item.serialized_inspect === 'string' ? item.serialized_inspect : ''
      };
      cache.delete(record.id);
      cache.set(record.id, record);
      records.push(record);
    }
    while (cache.size > 4000) cache.delete(cache.keys().next().value);
    if (records.length) send(records);
  }
  window.addEventListener('message', event => {
    if (event.source === window && event.origin === location.origin && event.data?.channel === CHANNEL && event.data.type === 'ready') send([...cache.values()]);
  });
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const pending = Reflect.apply(originalFetch, this, args);
    const input = args[0];
    if (isListingURL(typeof input === 'string' || input instanceof URL ? String(input) : input?.url)) {
      pending.then(response => {
        if (response.ok) response.clone().json().then(capture).catch(() => {});
      }, () => {});
    }
    return pending;
  };
  const open = XMLHttpRequest.prototype.open;
  const sendXHR = XMLHttpRequest.prototype.send;
  const urls = new WeakMap();
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    urls.set(this, isListingURL(url));
    return Reflect.apply(open, this, [method, url, ...rest]);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    if (urls.get(this)) this.addEventListener('load', () => {
      try {
        if (this.status >= 200 && this.status < 300) capture(this.responseType === 'json' ? this.response : JSON.parse(this.responseText));
      } catch { /* Non-JSON/failed responses leave the marketplace untouched. */ }
    }, {once: true});
    return Reflect.apply(sendXHR, this, args);
  };
})();
