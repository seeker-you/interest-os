// ai-analyzer.js — Claude-powered interest analysis
// Falls back to keyword engine when API is unavailable.

INTEREST_OS.aiAnalyzer = {
  // Configurable API endpoint (deploy api/analyze.js to Vercel, set this URL)
  API_URL: '',  // Set to your Vercel URL to enable server-side AI analysis

  // Or use a user-provided API key directly (stored in localStorage)
  getUserKey: function() {
    try { return localStorage.getItem('interest_os_apikey'); } catch(e) { return null; }
  },
  setUserKey: function(key) {
    try { localStorage.setItem('interest_os_apikey', key); } catch(e) {}
  },

  // Main entry: analyze titles with AI, fall back to keyword engine
  async analyze(titles, options) {
    options = options || {};
    var lang = options.lang || 'zh';

    // Try serverless backend first (only if URL is configured)
    if (this.API_URL) {
      try {
        var result = await this._callBackend(titles, lang);
        if (result && result.tags && result.tags.length > 0) {
          result.meta = {
            source: 'ai-analyzed',
            recordCount: titles.length,
            generatedAt: new Date().toISOString()
          };
          result.rawTitles = titles;
          return result;
        }
      } catch(e) {
        console.info('[AI] Backend unavailable, trying direct API...');
      }
    }

    // Try direct Anthropic API with user-provided key
    var userKey = this.getUserKey();
    if (userKey) {
      try {
        var result = await this._callDirect(titles, lang, userKey, options);
        if (result && result.summary) {
          result.meta = {
            source: 'ai-analyzed',
            recordCount: titles.length,
            generatedAt: new Date().toISOString()
          };
          result.rawTitles = titles;
          return result;
        }
      } catch(e) {
        console.info('[AI] Direct API call failed, using keyword engine fallback.');
      }
    }

    // Fallback to keyword engine
    return INTEREST_OS.analyzer.analyze(titles);
  },

  // Call the Vercel serverless function
  async _callBackend(titles, lang) {
    var resp = await fetch(this.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titles: titles, lang: lang })
    });
    if (!resp.ok) {
      var err = await resp.json().catch(function() { return {}; });
      throw new Error(err.error || 'Backend error ' + resp.status);
    }
    return await resp.json();
  },

  // Call Anthropic API directly (requires user's own API key)
  // AI ONLY explains keyword-matched results — does NOT extract tags itself
  async _callDirect(titles, lang, apiKey, options) {
    options = options || {};
    var isZh = lang === 'zh';

    // Get keyword engine results to feed to AI for explanation
    var keywordTags = options.keywordTags || [];
    var keywordCategories = options.keywordCategories || {};
    var keywordPersona = options.keywordPersona || { name: '', tagline: '' };
    var keywordAnalysis = options.keywordAnalysis || {};
    var categoryBreakdown = options.categoryBreakdown || '';

    var tagSummary = keywordTags.map(function(t, i) {
      return (i+1) + '. "' + t.name + '" → category: ' + (t.category || 'other') + ' weight: ' + t.weight + '%';
    }).join('\n');

    var catSummary = Object.keys(keywordCategories).map(function(c) {
      return '  - ' + c + ': ' + keywordCategories[c] + '%';
    }).join('\n');

    var breakdownSection = categoryBreakdown
      ? '\n精细分类权重（18个兴趣维度的精确统计，不可修改）:\n' + categoryBreakdown
      : '';

    var systemPrompt = isZh
      ? ('你是一个兴趣分析解释专家。你的任务是根据关键词引擎已经分析好的结果，生成一段易懂的中文总结。\n\n'
        + '你已经收到的分析结果（不可修改）：\n'
        + '人格类型: ' + (keywordPersona.name || '未知') + '\n'
        + '人格标语: ' + (keywordPersona.tagline || '') + '\n'
        + '兴趣标签（权重总和100%）:\n' + tagSummary + '\n'
        + '分类权重:\n' + (catSummary || '  (无)') + breakdownSection + '\n\n'
        + '===== \xe4\xb8\xa5\xe6\xa0\xbc\xe8\xa7\x84\xe5\x88\x99\xef\xbc\x88\xe5\xbf\x85\xe9\xa1\xbb\xe9\x81\xb5\xe5\xae\x88\xef\xbc\x89=====\n'
        + '1. \xe6\x89\x80\xe6\x9c\x89\xe7\xbb\x93\xe8\xae\xba\xe5\xbf\x85\xe9\xa1\xbb\xe5\xbc\x95\xe7\x94\xa8\xe5\x85\xb7\xe4\xbd\x93\xe7\x9a\x84\xe7\xbb\x9f\xe8\xae\xa1\xe7\x99\xbe\xe5\x88\x86\xe6\xaf\x94\xe6\x95\xb0\xe6\x8d\xae\xef\xbc\x88\xe6\xa0\x87\xe7\xad\xbe\xe6\x9d\x83\xe9\x87\x8d\xe3\x80\x81\xe5\x88\x86\xe7\xb1\xbb\xe5\x8d\xa0\xe6\xaf\x94\xef\xbc\x89\xef\xbc\x8c\xe7\xa6\x81\xe6\xad\xa2\xe5\x87\xad\xe7\xa9\xba\xe7\xbb\x93\xe8\xae\xba\n'
        + '2. \xe7\xa6\x81\xe6\xad\xa2\xe6\x8f\x90\xe5\x8f\x8a\xe4\xbb\xbb\xe4\xbd\x95\xe7\xbb\x9f\xe8\xae\xa1\xe7\xbb\x93\xe6\x9e\x9c\xe4\xb8\xad\xe4\xb8\x8d\xe5\xad\x98\xe5\x9c\xa8\xe7\x9a\x84\xe5\x85\xb4\xe8\xb6\xa3\xe9\xa2\x86\xe5\x9f\x9f\xe3\x80\x81\xe6\xa0\x87\xe7\xad\xbe\xe6\x88\x96\xe5\x88\x86\xe7\xb1\xbb\n'
        + '3. \xe5\x8d\xa0\xe6\xaf\x94\xe4\xbd\x8e\xe4\xba\x8e10%\xe7\x9a\x84\xe9\xa2\x86\xe5\x9f\x9f\xe7\xbb\x9d\xe5\xaf\xb9\xe4\xb8\x8d\xe5\xbe\x97\xe6\x8f\x8f\xe8\xbf\xb0\xe4\xb8\xba\xe2\x80\x9c\xe6\xa0\xb8\xe5\xbf\x83\xe5\x85\xb4\xe8\xb6\xa3\xe2\x80\x9d\xe3\x80\x81\xe2\x80\x9c\xe4\xb8\xbb\xe8\xa6\x81\xe5\x85\xb4\xe8\xb6\xa3\xe2\x80\x9d\xe6\x88\x96\xe7\xbb\x99\xe4\xba\x88\xe4\xbb\xbb\xe4\xbd\x95\xe5\xbc\xba\xe8\xb0\x83\n'
        + '4. \xe5\xbf\x85\xe9\xa1\xbb\xe5\x85\x88\xe5\x88\x97\xe5\x87\xba\xe7\x94\xa8\xe6\x88\xb7\xe7\x9a\x84\xe5\x85\xb4\xe8\xb6\xa3\xe6\x95\xb0\xe6\x8d\xae\xe5\x92\x8c\xe6\x9d\x83\xe9\x87\x8d\xef\xbc\x8c\xe5\x86\x8d\xe7\xbb\x99\xe5\x87\xba\xe5\x88\x86\xe6\x9e\x90\xe7\xbb\x93\xe8\xae\xba\xef\xbc\x88\xe6\x95\xb0\xe6\x8d\xae\xe5\x9c\xa8\xe5\x89\x8d\xef\xbc\x8c\xe7\xbb\x93\xe8\xae\xba\xe5\x9c\xa8\xe5\x90\x8e\xef\xbc\x89\n'
        + '===========================\n\n'
        + '请仅生成一个JSON（不要markdown代码块，只要纯JSON）：\n'
        + '{"summary":"用2-3句话总结这个人的兴趣特征。引用具体数据（标签名、权重、分类）。语气自然有洞察力。"}')
      : ('You are an interest analysis explainer. Your ONLY task is to explain the keyword engine results below in natural language.\n\n'
        + '===== STRICT RULES (MUST FOLLOW) =====\n'
        + '1. Every conclusion MUST cite specific statistical percentages (tag weights, category shares) \xe2\x80\x94 never make claims without data\n'
        + '2. NEVER mention any interest domain, tag, or category that does NOT appear in the statistical results below\n'
        + '3. Any domain below 10% share MUST NOT be described as a "core interest", "primary interest", or receive any emphasis\n'
        + '4. ALWAYS present the data first (tag weights, category shares), then give the conclusion \xe2\x80\x94 data before opinion\n'
        + '=====================================\n\n'
        + 'Keyword analysis results (DO NOT modify — these are final):\n'
        + 'Persona: ' + (keywordPersona.name || 'Unknown') + '\n'
        + 'Tagline: ' + (keywordPersona.tagline || '') + '\n'
        + 'Interest tags (weights sum to 100%):\n' + tagSummary + '\n'
        + 'Category weights:\n' + (catSummary || '  (none)') + '\n\n'
        + 'Return JSON ONLY (no markdown):\n'
        + '{"summary":"2-3 sentence summary of this person\\\'s interests. Reference actual data (tag names, weights, categories). Make it insightful and natural."}');

    var userMessage = isZh
      ? '这是用户上传的视频标题（供参考上下文）：\n' + titles.map(function(t, i) { return (i+1) + '. ' + t; }).slice(0, 30).join('\n')
      : 'Video titles for context:\n' + titles.map(function(t, i) { return (i+1) + '. ' + t; }).slice(0, 30).join('\n');

    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!resp.ok) {
      throw new Error('API error ' + resp.status);
    }

    var data = await resp.json();
    var content = data.content?.[0]?.text || '';
    var jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    var parsed = JSON.parse(jsonStr);

    return {
      summary: parsed.summary || '',
      tags: keywordTags,
      analysis: keywordAnalysis
    };
  }
};
