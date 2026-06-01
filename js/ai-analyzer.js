// ai-analyzer.js — Claude-powered interest analysis
// Falls back to keyword engine when API is unavailable.

INTEREST_OS.aiAnalyzer = {
  // Configurable API endpoint (deploy api/analyze.js to Vercel, set this URL)
  API_URL: 'https://YOUR_VERCEL_PROJECT.vercel.app/api/analyze',

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

    // Try serverless backend first
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
      console.warn('AI backend unavailable, trying direct API...', e.message);
    }

    // Try direct Anthropic API with user-provided key
    var userKey = this.getUserKey();
    if (userKey) {
      try {
        var result = await this._callDirect(titles, lang, userKey);
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
        console.warn('Direct AI call failed, falling back to keyword engine...', e.message);
      }
    }

    // Fallback to keyword engine
    console.log('Using keyword engine fallback');
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
  async _callDirect(titles, lang, apiKey) {
    var isZh = lang === 'zh';
    var systemPrompt = isZh
      ? '你是一个兴趣标签提取专家。给定一组视频标题，提取用户的兴趣标签。返回严格的 JSON 格式（不要 markdown 代码块，只要纯 JSON）：{"tags":[{"name":"标签名","weight":0-100,"category":"分类","relatedTags":[],"sourceTitles":[]}],"personaType":"人格类型","echoChamberIndex":0-100,"diversityScore":0-100,"summary":"一句话总结"}。规则：提取 5-10 个标签，权重总和 100，分类必须是以下之一：科技/AI、编程/开发、游戏、影视/动漫、音乐、知识/教育、财经/商业、体育、时尚/娱乐、生活/日常。'
      : 'You are an interest tag extraction expert. Given video titles, extract interest tags. Return strict JSON only (no markdown): {"tags":[{"name":"tag","weight":0-100,"category":"category","relatedTags":[],"sourceTitles":[]}],"personaType":"persona type","echoChamberIndex":0-100,"diversityScore":0-100,"summary":"one sentence"}. Extract 5-10 tags, weights sum to 100.';

    var userMessage = isZh
      ? '分析以下 ' + titles.length + ' 个视频标题，提取兴趣标签：\n\n' + titles.map(function(t, i) { return (i+1) + '. ' + t; }).join('\n')
      : 'Analyze these ' + titles.length + ' video titles and extract interest tags:\n\n' + titles.map(function(t, i) { return (i+1) + '. ' + t; }).join('\n');

    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
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

    var TAG_COLORS = [
      "#6366F1", "#8B5CF6", "#EC4899", "#3B82F6", "#14B8A6",
      "#F59E0B", "#EF4444", "#22C55E", "#A855F7", "#06B6D4"
    ];
    var tags = (parsed.tags || []).map(function(t, i) {
      return {
        id: 'ai_' + Date.now().toString(36) + '_' + i,
        name: t.name,
        weight: t.weight,
        category: t.category || '其他',
        color: TAG_COLORS[i % TAG_COLORS.length],
        relatedTags: t.relatedTags || [],
        sourceTitles: (t.sourceTitles || []).slice(0, 5),
        isUserEdited: false
      };
    });

    return {
      tags: tags,
      analysis: {
        diversityScore: parsed.diversityScore || 50,
        echoChamberIndex: parsed.echoChamberIndex || 50,
        concentrationLevel: parsed.echoChamberIndex < 30 ? '低' : parsed.echoChamberIndex < 55 ? '中等' : parsed.echoChamberIndex < 80 ? '较高' : '极高',
        personaType: parsed.personaType || '赛博探索者'
      },
      summary: parsed.summary || ''
    };
  }
};
