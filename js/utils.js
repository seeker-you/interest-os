// utils.js - Interest OS Utility Functions

const INTEREST_OS = window.INTEREST_OS || {};

INTEREST_OS.utils = {

  save: function(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch(e) { console.warn("localStorage save failed:", e); return false; }
  },

  load: function(key) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch(e) { console.warn("localStorage load failed:", e); return null; }
  },

  remove: function(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  },

  uid: function() {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  clamp: function(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  normalizeWeights: function(tags) {
    var total = 0;
    tags.forEach(function(t) { total += t.weight; });
    if (total === 0) return tags;
    return tags.map(function(t) {
      t.weight = Math.round(t.weight / total * 100);
      return t;
    });
  },

  debounce: function(fn, ms) {
    ms = ms || 200;
    var timer;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  },

  shuffle: function(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  },

  hexToRgba: function(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  },

  lightenHex: function(hex, amount) {
    var r = Math.min(255, parseInt(hex.slice(1,3), 16) + amount);
    var g = Math.min(255, parseInt(hex.slice(3,5), 16) + amount);
    var b = Math.min(255, parseInt(hex.slice(5,7), 16) + amount);
    return "#" + [r,g,b].map(function(c) { return c.toString(16).padStart(2,"0"); }).join("");
  }
};
