// share-url.js — Encode/decode profile data in URL hash for sharing

INTEREST_OS.shareUrl = {
  // Encode profile to URL-safe hash string
  encode: function(profile) {
    // Extract only shareable data to minimize size
    var shareable = {
      v: 1, // version
      t: (profile.tags || []).map(function(t) {
        return {
          n: t.name,
          w: t.weight,
          c: t.category,
          cl: t.color,
          r: (t.relatedTags || []).slice(0, 5),
          s: (t.sourceTitles || []).slice(0, 2)
        };
      }),
      a: {
        d: profile.analysis ? profile.analysis.diversityScore : 50,
        e: profile.analysis ? profile.analysis.echoChamberIndex : 50,
        p: profile.analysis ? profile.analysis.personaType : ''
      }
    };
    try {
      var json = JSON.stringify(shareable);
      // Use btoa with Unicode-safe encoding
      return this._btoa(json);
    } catch(e) {
      return '';
    }
  },

  // Decode from URL hash to profile object
  decode: function(hash) {
    try {
      var json = this._atob(hash);
      var raw = JSON.parse(json);
      if (!raw || raw.v !== 1 || !raw.t) return null;

      var TAG_COLORS = [
        "#6366F1", "#8B5CF6", "#EC4899", "#3B82F6", "#14B8A6",
        "#F59E0B", "#EF4444", "#22C55E", "#A855F7", "#06B6D4"
      ];

      var tags = raw.t.map(function(t, i) {
        return {
          id: 'shared_' + i,
          name: t.n,
          weight: t.w,
          category: t.c || '其他',
          color: t.cl || TAG_COLORS[i % TAG_COLORS.length],
          relatedTags: (t.r || []).map(function(rid, j) { return 'shared_' + j; }),
          sourceTitles: t.s || [],
          isUserEdited: false
        };
      });

      return {
        meta: { source: 'shared', recordCount: 0, generatedAt: new Date().toISOString() },
        tags: tags,
        analysis: {
          diversityScore: raw.a ? raw.a.d : 50,
          echoChamberIndex: raw.a ? raw.a.e : 50,
          concentrationLevel: (raw.a && raw.a.e < 30) ? '低' : (raw.a && raw.a.e < 55) ? '中等' : (raw.a && raw.a.e < 80) ? '较高' : '极高',
          personaType: raw.a ? raw.a.p : ''
        },
        rawTitles: []
      };
    } catch(e) {
      console.error('Share URL decode failed:', e);
      return null;
    }
  },

  // Get full share URL
  getShareUrl: function(profile) {
    var hash = this.encode(profile);
    if (!hash) return '';
    var base = window.location.href.split('#')[0].split('?')[0];
    // Point to share page with data
    var sharePage = base.replace(/\/[^\/]*$/, '/share-raw.html');
    return sharePage + '#' + hash;
  },

  // Load profile from current URL hash, return null if none
  loadFromUrl: function() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;
    return this.decode(hash);
  },

  // Generate QR code SVG (minimal matrix-based)
  generateQR: function(url, size) {
    size = size || 200;
    // Use a QR code API for reliable generation
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(url);
    return qrUrl;
  },

  // Unicode-safe base64 encode
  _btoa: function(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  },

  // Unicode-safe base64 decode
  _atob: function(str) {
    // Restore padding
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return decodeURIComponent(escape(atob(str)));
  }
};
