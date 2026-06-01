// api/analyze.js — Vercel Serverless Function
// Proxies requests to Claude API for interest tag extraction.
// Deploy: drop this file into a Vercel project as /api/analyze.js
// Set env var: ANTHROPIC_API_KEY

export default async function handler(req, res) {
  // CORS — allow calls from your GitHub Pages domain
  const allowedOrigins = [
    'https://seeker-you.github.io',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080'
  ];
  const origin = req.headers.origin || '';
  if (allowedOrigins.some(o => origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { titles, lang } = req.body || {};
  if (!titles || !Array.isArray(titles) || titles.length === 0) {
    return res.status(400).json({ error: 'Missing or empty titles array' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server not configured with API key' });
  }

  const isZh = lang === 'zh';
  const systemPrompt = isZh
    ? `你是一个兴趣标签提取专家。给定一组视频标题，提取用户的兴趣标签。
返回严格的 JSON 格式（不要 markdown 代码块，只要纯 JSON）：
{
  "tags": [
    {
      "name": "标签名（中文）",
      "weight": 0-100 的整数（基于出现频率），
      "category": "分类名（如：科技/AI、编程/开发、游戏、影视/动漫、音乐、知识/教育、财经/商业、体育、时尚/娱乐、生活/日常）",
      "relatedTags": ["关联的其他标签名"],
      "sourceTitles": ["来源视频标题1", "来源视频标题2"]
    }
  ],
  "personaType": "人格类型名（如：赛博探索者、光影捕手、知识游牧者、游戏大师、潮流猎手、深度耕耘者）",
  "echoChamberIndex": 0-100 的整数（信息茧房指数，越高表示兴趣越集中），
  "diversityScore": 0-100 的整数（兴趣多样性，越高越多元），
  "summary": "一句话总结这个用户的兴趣画像"
}
规则：
- 提取 5-10 个最显著的标签
- 权重总和应为 100
- 分类名必须是上述列表中的一项
- sourceTitles 是支撑该标签的具体视频标题（最多 3 个）
- 如果标题太少（< 5），返回你能提取到的所有标签`
    : `You are an interest tag extraction expert. Given a list of video titles, extract the user's interest tags.
Return strict JSON (no markdown code blocks, pure JSON only):
{
  "tags": [
    {
      "name": "Tag name",
      "weight": integer 0-100 (based on frequency),
      "category": "Category (one of: Tech/AI, Programming, Gaming, Film/Anime, Music, Education, Business/Finance, Sports, Fashion/Entertainment, Lifestyle)",
      "relatedTags": ["related tag names"],
      "sourceTitles": ["source title 1", "source title 2"]
    }
  ],
  "personaType": "Persona type name",
  "echoChamberIndex": integer 0-100,
  "diversityScore": integer 0-100,
  "summary": "One sentence summary of this user's interest profile"
}`;

  const userMessage = isZh
    ? `分析以下 ${titles.length} 个视频标题，提取兴趣标签：\n\n${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : `Analyze these ${titles.length} video titles and extract interest tags:\n\n${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service error: ' + response.status });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Parse the JSON from Claude's response
    let parsed;
    try {
      // Handle possible markdown code block wrapping
      const jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse Claude response:', content);
      return res.status(502).json({ error: 'Failed to parse AI response', raw: content });
    }

    // Add IDs and colors to tags
    const TAG_COLORS = [
      "#6366F1", "#8B5CF6", "#EC4899", "#3B82F6", "#14B8A6",
      "#F59E0B", "#EF4444", "#22C55E", "#A855F7", "#06B6D4"
    ];
    const tags = (parsed.tags || []).map((t, i) => ({
      id: 'ai_' + Date.now().toString(36) + '_' + i,
      name: t.name,
      weight: t.weight,
      category: t.category || '其他',
      color: TAG_COLORS[i % TAG_COLORS.length],
      relatedTags: t.relatedTags || [],
      sourceTitles: (t.sourceTitles || []).slice(0, 5),
      isUserEdited: false
    }));

    return res.status(200).json({
      tags,
      analysis: {
        diversityScore: parsed.diversityScore || 50,
        echoChamberIndex: parsed.echoChamberIndex || 50,
        concentrationLevel: parsed.echoChamberIndex < 30 ? '低' : parsed.echoChamberIndex < 55 ? '中等' : parsed.echoChamberIndex < 80 ? '较高' : '极高',
        personaType: parsed.personaType || '赛博探索者'
      },
      summary: parsed.summary || ''
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
