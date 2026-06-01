// utils.js - Interest OS Utility Functions

const INTEREST_OS = window.INTEREST_OS || {};

INTEREST_OS.utils = {

  // Safe localStorage read/write
  save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch(e) { console.warn('localStorage save failed:', e); return false; }
  },

  load(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch(e) { console.warn('localStorage load failed:', e); return null; }
  },

  remove(key) {
    try { localStorage.removeItem(key); }
    catch(e) {}
  },

  // Generate unique ID
  uid() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  // Clamp number
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  // Normalize weights to sum 100
  normalizeWeights(tags) {
    const total = tags.reduce((s, t) => s + t.weight, 0);
    if (total === 0) return tags;
    return tags.map(t => ({ ...t, weight: Math.round(t.weight / total * 100) }));
  },

  // Debounce
  debounce(fn, ms = 200) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  },

  // Shuffle array
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Hex color with alpha
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return 
gba(,,,);
  },

  // Lighten hex color
  lightenHex(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1,3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3,5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5,7), 16) + amount);
    return '#' + [r,g,b].map(c => c.toString(16).padStart(2,'0')).join('');
  }
};
