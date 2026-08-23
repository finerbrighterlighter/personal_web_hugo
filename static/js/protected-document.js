import { getCache, setCache } from './cache.js';

(() => {
  const root = document.querySelector('[data-protected-document]');
  if (!root) return;

  const toggle = root.querySelector('[data-protected-document-toggle]');
  const panel = root.querySelector('[data-protected-document-panel]');
  const viewer = root.querySelector('[data-protected-document-viewer]');
  const openLink = root.querySelector('[data-protected-document-open]');
  const form = root.querySelector('[data-protected-document-form]');
  const input = form.querySelector('input[name="password"]');
  const mask = root.querySelector('[data-protected-document-mask]');
  const submit = root.querySelector('[data-protected-document-submit]');
  const status = root.querySelector('[data-protected-document-status]');
  const announcer = root.querySelector('[data-protected-document-announcer]');
  const placeholder = root.querySelector('.protected-document-placeholder');
  const cacheKey = `protected-document:${root.dataset.documentId}:unlocked`;
  const SHA256_CONSTANTS = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  let isOpen = false;
  let operationId = 0;
  let blobUrl = null;
  let documentPromise = null;
  const isMobile = window.matchMedia?.('(max-width: 767px)').matches ?? window.innerWidth < 768;

  // This is a client-side privacy gate, not authentication or access control.
  function revealDocument(url, token) {
    if (!isOpen || token !== operationId) return;
    let frame = viewer.querySelector('iframe');
    setStatus('ok', root.dataset.unlockedLabel);
    placeholder.hidden = true;
    panel.hidden = true;
    viewer.hidden = false;
    toggle.textContent = root.dataset.exitLabel;
    toggle.setAttribute('aria-expanded', 'true');
    openLink.href = url;
    isOpen = true;

    if (!isMobile && !frame) {
      frame = document.createElement('iframe');
      frame.className = 'protected-document-frame';
      frame.title = root.dataset.viewerTitle;
      viewer.append(frame);
    }
    if (frame) frame.src = url;
  }

  function getUnlocked() {
    try {
      return getCache(cacheKey) === true;
    } catch (error) {
      return false;
    }
  }

  function rememberUnlock() {
    try {
      setCache(cacheKey, true);
    } catch (error) {}
  }

  function syncMask() {
    mask.textContent = Array.from({ length: input.value.length }, () => '*').join(' ');
  }

  async function getDocumentUrl() {
    if (blobUrl) return blobUrl;
    if (documentPromise) return documentPromise;

    documentPromise = fetch(root.dataset.documentUrl, { credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) throw new Error(`Document request failed with ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      })
      .finally(() => {
        documentPromise = null;
      });

    return documentPromise;
  }

  async function loadDocument(token) {
    setStatus('info', root.dataset.loadingLabel);
    try {
      const url = await getDocumentUrl();
      revealDocument(url, token);
    } catch (error) {
      if (!isOpen || token !== operationId) return;
      viewer.hidden = true;
      placeholder.hidden = false;
      panel.hidden = false;
      setStatus('error', root.dataset.loadErrorLabel);
    }
  }

  function setStatus(type, message) {
    const prefix = document.createElement('span');
    prefix.className = `is-${type}`;
    prefix.textContent = `[${type === 'error' ? 'ERR' : type.toUpperCase()}]`;
    status.replaceChildren(prefix, ` ${message}`);
    status.classList.toggle('is-error', type === 'error');
    announcer.textContent = message;
  }

  function setBusy(isBusy) {
    input.disabled = isBusy;
    submit.disabled = isBusy;
  }

  function sha256Fallback(bytes) {
    const bitLength = bytes.length * 8;
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLength);
    const view = new DataView(padded.buffer);
    const words = new Uint32Array(64);
    const hash = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]);

    padded.set(bytes);
    padded[bytes.length] = 0x80;
    view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
    view.setUint32(paddedLength - 4, bitLength >>> 0);

    const rotateRight = (value, count) => (value >>> count) | (value << (32 - count));
    for (let offset = 0; offset < paddedLength; offset += 64) {
      for (let i = 0; i < 16; i += 1) words[i] = view.getUint32(offset + (i * 4));
      for (let i = 16; i < 64; i += 1) {
        const s0 = rotateRight(words[i - 15], 7) ^ rotateRight(words[i - 15], 18) ^ (words[i - 15] >>> 3);
        const s1 = rotateRight(words[i - 2], 17) ^ rotateRight(words[i - 2], 19) ^ (words[i - 2] >>> 10);
        words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
      }

      let [a, b, c, d, e, f, g, h] = hash;
      for (let i = 0; i < 64; i += 1) {
        const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        const choice = (e & f) ^ (~e & g);
        const temp1 = (h + sum1 + choice + SHA256_CONSTANTS[i] + words[i]) >>> 0;
        const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        const majority = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (sum0 + majority) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      hash[0] = (hash[0] + a) >>> 0;
      hash[1] = (hash[1] + b) >>> 0;
      hash[2] = (hash[2] + c) >>> 0;
      hash[3] = (hash[3] + d) >>> 0;
      hash[4] = (hash[4] + e) >>> 0;
      hash[5] = (hash[5] + f) >>> 0;
      hash[6] = (hash[6] + g) >>> 0;
      hash[7] = (hash[7] + h) >>> 0;
    }

    return Array.from(hash, word => word.toString(16).padStart(8, '0')).join('');
  }

  async function sha256(value) {
    const bytes = new window.TextEncoder().encode(value);
    if (window.crypto?.subtle) {
      try {
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      } catch (error) {}
    }
    return sha256Fallback(bytes);
  }

  function openPanel() {
    const token = ++operationId;
    panel.hidden = false;
    panel.classList.remove('collapsed');
    toggle.textContent = root.dataset.exitLabel;
    toggle.setAttribute('aria-expanded', 'true');
    isOpen = true;

    if (getUnlocked()) {
      panel.hidden = true;
      loadDocument(token);
      return;
    }

    setStatus('info', root.dataset.promptLabel);
    input.focus();
  }

  function closePanel() {
    operationId += 1;
    input.value = '';
    syncMask();
    panel.hidden = true;
    viewer.hidden = true;
    placeholder.hidden = false;
    toggle.textContent = root.dataset.viewLabel;
    toggle.setAttribute('aria-expanded', 'false');
    isOpen = false;
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (isOpen) closePanel();
    else openPanel();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!window.TextEncoder) {
      setStatus('error', root.dataset.unsupportedLabel);
      return;
    }

    setBusy(true);
    setStatus('info', root.dataset.checkingLabel);
    const token = operationId;

    try {
      const hash = await sha256(root.dataset.salt + input.value.trim());
      if (hash !== root.dataset.passwordHash) {
        setStatus('error', root.dataset.incorrectLabel);
        input.select();
        return;
      }
      if (!isOpen || token !== operationId) return;

      input.value = '';
      syncMask();
      rememberUnlock();
      await loadDocument(token);
    } catch (error) {
      setStatus('error', root.dataset.unsupportedLabel);
    } finally {
      setBusy(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen && !isMobile) closePanel();
  });

  input.addEventListener('input', syncMask);
  syncMask();

  window.addEventListener('pagehide', () => {
    operationId += 1;
    if (!blobUrl) return;
    URL.revokeObjectURL(blobUrl);
    blobUrl = null;
    openLink.removeAttribute('href');
    viewer.querySelector('iframe')?.removeAttribute('src');
  });

  window.addEventListener('pageshow', event => {
    if (!event.persisted || !isOpen || !getUnlocked()) return;
    viewer.hidden = true;
    placeholder.hidden = false;
    loadDocument(++operationId);
  });

  if (isMobile || getUnlocked()) openPanel();
})();
