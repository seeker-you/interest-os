// parser.js - Upload File/Text Parser

INTEREST_OS.parser = {

  MAX_RECORDS: 200,

  // Parse a JSON file (YouTube Takeout or Bilibili format)
  parseJSON(text) {
    try {
      const data = JSON.parse(text);
      let titles = [];

      // YouTube Takeout format: array of { title: "Watched ...", ... }
      if (Array.isArray(data)) {
        titles = data
          .map(item => {
            let t = item.title || item.snippet || '';
            // Strip YouTube "Watched " prefix
            if (t.startsWith('Watched ')) t = t.slice(8);
            return t.trim();
          })
          .filter(t => t.length > 0);
      }
      // Bilibili format: { data: { list: [...] } }
      else if (data.data && Array.isArray(data.data.list)) {
        titles = data.data.list
          .map(item => (item.title || item.name || '').trim())
          .filter(t => t.length > 0);
      }
      // Fallback: try to find any array with title fields
      else {
        titles = this._extractTitles(data);
      }

      return this._buildResult(titles, 'json');
    } catch(e) {
      return { error: 'JSON 解析失败，请检查文件格式' };
    }
  },

  // Parse plain text (one title per line)
  parseText(text) {
    const titles = text
      .split(/[\n\r]+/)
      .map(t => t.trim())
      .filter(t => t.length > 2); // skip very short lines
    return this._buildResult(titles, 'text');
  },

  // Parse CSV
  parseCSV(text) {
    const lines = text.split(/[\n\r]+/).filter(l => l.trim());
    if (lines.length === 0) return { error: 'CSV 文件为空' };

    // Try to find title column
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const titleIdx = header.findIndex(h =>
      h === 'title' || h === '标题' || h === 'name' || h === '名称'
    );

    const titles = lines.slice(1).map(line => {
      const cols = line.split(',');
      const idx = titleIdx >= 0 ? titleIdx : 0;
      return (cols[idx] || '').trim();
    }).filter(t => t.length > 0);

    return this._buildResult(titles, 'csv');
  },

  // Detect and parse by content
  autoParse(text, filename = '') {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'csv') return this.parseCSV(text);
    if (ext === 'json') return this.parseJSON(text);
    // Try JSON, fallback to text
    if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
      const jsonResult = this.parseJSON(text);
      if (!jsonResult.error) return jsonResult;
    }
    return this.parseText(text);
  },

  // Internal: extract titles from arbitrary JSON
  _extractTitles(obj, depth = 0) {
    if (depth > 3) return [];
    if (Array.isArray(obj)) {
      return obj.flatMap(item => {
        if (typeof item === 'string') return [item.trim()];
        if (typeof item === 'object' && item !== null) {
          if (item.title) return [String(item.title).trim()];
          return this._extractTitles(item, depth + 1);
        }
        return [];
      });
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).flatMap(v => this._extractTitles(v, depth + 1));
    }
    return [];
  },

  // Build parsed result
  _buildResult(titles, source) {
    const totalFound = titles.length;
    const truncated = totalFound > this.MAX_RECORDS;
    const sliced = truncated ? titles.slice(0, this.MAX_RECORDS) : titles;

    return {
      titles: sliced,
      source,
      totalFound,
      truncated
    };
  }
};
