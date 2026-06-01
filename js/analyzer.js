// analyzer.js - Interest Analysis Engine (Rule-based)

INTEREST_OS.analyzer = {

  TAG_COLORS: [
    "#6366F1", "#8B5CF6", "#EC4899", "#3B82F6", "#14B8A6",
    "#F59E0B", "#EF4444", "#22C55E", "#A855F7", "#06B6D4",
    "#F97316", "#84CC16", "#E11D48", "#0EA5E9", "#D946EF"
  ],

  // Main analysis pipeline
  analyze(titles) {
    const keywordMap = INTEREST_OS.keywords;

    // Step 1: Match keywords to titles
    const matchCounts = {};
    const titleMatches = {}; // tagId -> [title strings]

    for (const [category, keywords] of Object.entries(keywordMap)) {
      for (const kw of keywords) {
        const tagId = category + '::' + kw;
        let count = 0;
        const matchedTitles = [];

        for (const title of titles) {
          if (title.toLowerCase().includes(kw.toLowerCase())) {
            count++;
            matchedTitles.push(title);
          }
        }

        if (count > 0) {
          matchCounts[tagId] = {
            count,
            category,
            keyword: kw,
            titles: matchedTitles.slice(0, 5)
          };
        }
      }
    }

    // Step 2: Merge similar tags within same category (e.g., "AI" + "人工智能")
    const merged = this._mergeSimilar(matchCounts, titles);

    // Step 3: Calculate weights (percentage of total titles)
    const totalTitles = titles.length || 1;
    let tags = Object.values(merged)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((m, i) => ({
        id: INTEREST_OS.utils.uid(),
        name: m.name,
        weight: Math.round(m.count / totalTitles * 100),
        category: m.category,
        color: this.TAG_COLORS[i % this.TAG_COLORS.length],
        relatedTags: [],
        sourceTitles: m.titles.slice(0, 5),
        isUserEdited: false
      }));

    // Normalize weights to sum roughly 100
    tags = INTEREST_OS.utils.normalizeWeights(tags);

    // Step 4: Calculate tag relationships
    tags = this._calculateRelations(tags, titles);

    // Step 5: Persona determination
    const persona = INTEREST_OS.personas.determine(tags);

    // Step 6: Diversity & echo chamber analysis
    const categories = [...new Set(tags.map(t => t.category))];
    const totalCategories = Object.keys(INTEREST_OS.keywords).length;
    const diversityScore = Math.round(categories.length / Math.min(totalCategories, 10) * 100);
    const maxCatWeight = this._maxCategoryWeight(tags);
    const echoChamberIndex = Math.min(100, Math.round(maxCatWeight * 1.5));

    let concentrationLevel;
    if (echoChamberIndex < 30) concentrationLevel = '低';
    else if (echoChamberIndex < 55) concentrationLevel = '中等';
    else if (echoChamberIndex < 80) concentrationLevel = '较高';
    else concentrationLevel = '极高';

    return {
      meta: {
        source: 'analyzed',
        recordCount: titles.length,
        dateRange: { start: '', end: '' },
        generatedAt: new Date().toISOString()
      },
      tags,
      analysis: {
        diversityScore,
        echoChamberIndex,
        concentrationLevel,
        personaType: persona.name
      },
      rawTitles: titles
    };
  },

  // Merge similar keywords (e.g., "AI" and "人工智能" both in 科技/AI)
  _mergeSimilar(matchCounts, titles) {
    const merged = {};
    const synonymGroups = [
      ['AI', '人工智能', 'ChatGPT', 'GPT'],
      ['编程', '开发', '代码'],
      ['前端', 'JavaScript', 'TypeScript'],
      ['游戏', '主机', 'Steam'],
      ['动漫', '动画', '番剧'],
      ['电影', '影视', '影院']
    ];

    const processed = new Set();

    for (const [tagId, info] of Object.entries(matchCounts)) {
      if (processed.has(tagId)) continue;

      let group = synonymGroups.find(g => g.some(k => info.keyword.includes(k) || k.includes(info.keyword)));
      if (!group) group = [info.keyword];

      // Merge all tags in the same synonym group within the same category
      let totalCount = 0;
      const allTitles = new Set();
      let bestName = info.keyword;

      for (const [otherId, otherInfo] of Object.entries(matchCounts)) {
        if (processed.has(otherId)) continue;
        if (otherInfo.category !== info.category) continue;
        if (!group.some(k => otherInfo.keyword.includes(k) || k.includes(otherInfo.keyword))) continue;

        totalCount += otherInfo.count;
        otherInfo.titles.forEach(t => allTitles.add(t));
        processed.add(otherId);
        if (otherInfo.count > totalCount * 0.5) bestName = otherInfo.keyword;
      }

      if (totalCount > 0) {
        const key = info.category + '::merged::' + bestName;
        merged[key] = {
          count: totalCount,
          category: info.category,
          name: bestName,
          titles: [...allTitles].slice(0, 5)
        };
      }
    }

    return merged;
  },

  // Calculate co-occurrence relationships
  _calculateRelations(tags, titles) {
    return tags.map((tag, i) => {
      const related = [];
      const tagLower = tag.name.toLowerCase();

      for (let j = 0; j < tags.length; j++) {
        if (i === j) continue;
        const otherLower = tags[j].name.toLowerCase();
        let coCount = 0;
        for (const title of titles) {
          const tl = title.toLowerCase();
          if (tl.includes(tagLower) && tl.includes(otherLower)) coCount++;
        }
        if (coCount / titles.length > 0.05) {
          related.push(tags[j].id);
        }
      }
      return { ...tag, relatedTags: related };
    });
  },

  _maxCategoryWeight(tags) {
    const catWeights = {};
    tags.forEach(t => {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });
    const max = Math.max(...Object.values(catWeights), 1);
    const total = Object.values(catWeights).reduce((a,b) => a+b, 1);
    return max / total * 100;
  }
};
