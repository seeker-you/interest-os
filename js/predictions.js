// predictions.js — Algorithm recommendation predictions & growth advice
// Interest OS "Algorithm Mirror" upgrade

INTEREST_OS.predictions = {

  // ─── Algorithm's future recommendation prediction ───
  getRecommendations(tags) {
    if (!tags || tags.length === 0) return { predictedTags: [], recommendedContent: [] };

    const topTags = [...tags].sort((a, b) => b.weight - a.weight);
    const dominantCategory = this._dominantCategory(tags);
    const catTags = tags.filter(t => t.category === dominantCategory).slice(0, 3);

    // Predict next interest tags based on current patterns
    const predictedTags = this._predictNextTags(tags, dominantCategory);

    // Generate "algorithm would show you" content suggestions
    const recommendedContent = this._suggestContent(topTags, dominantCategory);

    return {
      dominantCategory,
      dominantTags: catTags,
      predictedTags,
      recommendedContent,
      algorithmSummary: this._algorithmSummary(topTags, dominantCategory)
    };
  },

  // ─── Growth advice ───
  getGrowthAdvice(tags, analysis) {
    const advice = [];
    const allCategories = Object.keys(INTEREST_OS.keywords);
    const presentCategories = [...new Set(tags.map(t => t.category))];
    const missingCategories = allCategories.filter(c => !presentCategories.includes(c));
    const echoIndex = analysis?.echoChamberIndex || 50;

    // Advice based on echo chamber
    if (echoIndex >= 70) {
      advice.push({
        type: 'warning',
        icon: '⚠',
        title: '信息茧房风险较高',
        desc: '你的兴趣高度集中在少数领域。算法可能正在为你构建一个舒适但狭窄的信息世界。',
        suggestion: '尝试搜索与当前兴趣完全无关的内容，打破算法的舒适区。'
      });
    } else if (echoIndex >= 45) {
      advice.push({
        type: 'suggest',
        icon: '→',
        title: '适当拓展视野',
        desc: '你的兴趣有一定集中度，整体还算健康。',
        suggestion: '偶尔探索一些边缘领域，可能会有意外收获。'
      });
    } else {
      advice.push({
        type: 'good',
        icon: '✓',
        title: '信息多元',
        desc: '你的信息源非常丰富，几乎不存在信息茧房风险。',
        suggestion: '继续保持跨领域探索的习惯。'
      });
    }

    // Missing category suggestions
    if (missingCategories.length > 0) {
      const topSuggestion = missingCategories.slice(0, 3);
      advice.push({
        type: 'explore',
        icon: '✦',
        title: '未探索的领域',
        desc: `你的兴趣雷达尚未覆盖: ${topSuggestion.join('、')}`,
        suggestion: `试试关注一些 ${topSuggestion[0]} 领域的内容，可能会发现新的兴趣点。`
      });
    }

    // Specific growth guidance
    const topTag = tags.sort((a, b) => b.weight - a.weight)[0];
    if (topTag && topTag.weight > 40) {
      advice.push({
        type: 'deep',
        icon: '↓',
        title: '深度耕耘建议',
        desc: `你在「${topTag.name}」上的权重较高(${topTag.weight}%)，说明你有持续的关注深度。`,
        suggestion: '尝试将这个领域的知识应用到其他领域，可能会产生有趣的交叉创新。'
      });
    }

    // Diversity advice
    if ((analysis?.diversityScore || 50) < 40) {
      advice.push({
        type: 'tip',
        icon: '💡',
        title: '多样性可以更好',
        desc: '你的兴趣多样性评分偏低，算法看到的你可能比真实的你更窄。',
        suggestion: '每周尝试看一个完全不同类型的视频，拓宽算法对你的认知。'
      });
    }

    return advice;
  },

  // ─── Algorithm explanation ───
  getAlgorithmExplanation(tags, analysis) {
    const totalTitles = analysis?.recordCount || tags.length * 3;
    const topTag = [...tags].sort((a, b) => b.weight - a.weight)[0];
    const dominantCat = this._dominantCategory(tags);
    const catWeights = {};
    tags.forEach(t => {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });
    const topCatWeight = Math.round(catWeights[dominantCat] || 0);
    const tagCount = tags.length;

    return {
      steps: [
        {
          step: 1,
          title: '关键词匹配',
          detail: `扫描 ${totalTitles} 条标题，匹配 ${Object.keys(INTEREST_OS.keywords).length} 大分类、${Object.values(INTEREST_OS.keywords).flat().length} 个关键词`,
          icon: '🔍'
        },
        {
          step: 2,
          title: '频率统计',
          detail: `计算每个关键词的出现频率，出现越多权重越高`,
          icon: '📊'
        },
        {
          step: 3,
          title: '同义词合并',
          detail: `将同一分类下的相似关键词合并（如 AI + 人工智能 → 科技/AI）`,
          icon: '🔗'
        },
        {
          step: 4,
          title: '关联分析',
          detail: `分析标签在同一标题中的共现频率，构建兴趣关联网络`,
          icon: '🌐'
        }
      ],
      keyFindings: [
        { label: '最突出的兴趣', value: topTag ? `${topTag.name} (${topTag.weight}%)` : '—' },
        { label: '主导分类', value: `${dominantCat} (${topCatWeight}%)` },
        { label: '兴趣粒度', value: `${tagCount} 个标签` },
        { label: '算法确信度', value: tagCount >= 8 ? '高' : tagCount >= 5 ? '中' : '低' }
      ],
      summary: `算法通过分析 ${totalTitles} 条观看记录，在 ${Object.keys(INTEREST_OS.keywords).length} 个兴趣分类中识别出 ${tagCount} 个兴趣标签。${
        topTag ? `其中「${topTag.name}」权重最高 (${topTag.weight}%)，是算法判定你最核心的兴趣。` : ''
      }${
        dominantCat ? `整体来看，你的兴趣主要集中在「${dominantCat}」领域。` : ''
      }`
    };
  },

  // ─── Weight model breakdown ───
  getWeightModel(tags) {
    if (!tags || tags.length === 0) return { categories: [], topTags: [], distribution: {} };

    // Category-level aggregation
    const categoryMap = {};
    tags.forEach(t => {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { name: t.category, totalWeight: 0, tagCount: 0, tags: [] };
      }
      categoryMap[t.category].totalWeight += t.weight;
      categoryMap[t.category].tagCount++;
      categoryMap[t.category].tags.push(t);
    });

    const categories = Object.values(categoryMap)
      .sort((a, b) => b.totalWeight - a.totalWeight);

    const totalWeight = categories.reduce((s, c) => s + c.totalWeight, 0) || 1;

    // Top individual tags
    const topTags = [...tags].sort((a, b) => b.weight - a.weight).slice(0, 5);

    // Distribution data
    const distribution = {
      evenness: this._calculateEvenness(categories, totalWeight),
      concentration: categories.length > 0 ? Math.round((categories[0]?.totalWeight || 0) / totalWeight * 100) : 0,
      span: categories.length
    };

    return { categories, topTags, distribution, totalWeight };
  },

  // ─── Internal helpers ───
  _dominantCategory(tags) {
    const catWeights = {};
    tags.forEach(t => {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });
    let bestCat = '其他', bestW = 0;
    for (const [cat, w] of Object.entries(catWeights)) {
      if (w > bestW) { bestW = w; bestCat = cat; }
    }
    return bestCat;
  },

  _predictNextTags(tags, dominantCategory) {
    const allKeywords = INTEREST_OS.keywords;
    const presentNames = new Set(tags.map(t => t.name.toLowerCase()));

    // Find keywords in dominant category that aren't already tags
    const catKeywords = allKeywords[dominantCategory] || [];
    const unused = catKeywords.filter(kw => {
      return !presentNames.has(kw.toLowerCase());
    });

    // Also look at adjacent categories
    const allCats = Object.keys(allKeywords);
    const domIdx = allCats.indexOf(dominantCategory);
    const adjacentCats = [];
    if (domIdx > 0) adjacentCats.push(allCats[domIdx - 1]);
    if (domIdx < allCats.length - 1) adjacentCats.push(allCats[domIdx + 1]);

    const adjacentKeywords = adjacentCats.flatMap(c => (allKeywords[c] || []))
      .filter(kw => !presentNames.has(kw.toLowerCase()));

    const predictions = [];

    // Predict from unused keywords in dominant category
    unused.slice(0, 5).forEach(kw => {
      predictions.push({
        name: kw,
        source: 'interest_extension',
        probability: '高',
        reason: `基于你对 ${dominantCategory} 的关注，算法预测你可能会对「${kw}」产生兴趣`
      });
    });

    // Predict from adjacent categories
    adjacentKeywords.slice(0, 3).forEach((kw, i) => {
      if (predictions.length >= 8) return;
      predictions.push({
        name: kw,
        source: 'category_expansion',
        probability: i === 0 ? '中高' : '中',
        reason: `你的兴趣范围可能向「${adjacentCats[i] || adjacentCats[0]}」扩展，算法推荐关注「${kw}」`
      });
    });

    return predictions.slice(0, 8);
  },

  _suggestContent(topTags, dominantCategory) {
    // Content template suggestions based on category
    const contentTemplates = {
      '科技/AI': [
        { type: 'article', title: 'AI Agent 开发实战：从零构建智能体', platform: 'YouTube / Bilibili' },
        { type: 'video', title: '2025 大模型能力横评：谁是最强王者', platform: 'YouTube / Bilibili' },
        { type: 'tutorial', title: 'Prompt Engineering 进阶指南', platform: 'YouTube' }
      ],
      '编程/开发': [
        { type: 'tutorial', title: 'Rust 异步编程完全指南', platform: 'YouTube / Bilibili' },
        { type: 'video', title: '开源项目架构解析：从代码到部署', platform: 'Bilibili' },
        { type: 'article', title: '系统设计面试：分布式系统核心模式', platform: 'YouTube' }
      ],
      '游戏': [
        { type: 'review', title: '本月值得关注的独立游戏推荐', platform: 'YouTube / Bilibili' },
        { type: 'guide', title: '黑神话悟空 全隐藏Boss攻略', platform: 'Bilibili' },
        { type: 'analysis', title: '游戏设计叙事手法深度解析', platform: 'YouTube' }
      ],
      '影视/动漫': [
        { type: 'review', title: '本月新番扫雷指南', platform: 'Bilibili' },
        { type: 'analysis', title: '年度十佳电影镜头解析', platform: 'YouTube' },
        { type: 'recommend', title: '冷门佳作：你可能错过的 10 部动画', platform: 'Bilibili' }
      ],
      '音乐': [
        { type: 'playlist', title: '算法生成的个性化歌单：发现新声音', platform: 'YouTube Music' },
        { type: 'tutorial', title: '音乐制作入门：用 FL Studio 做第一首歌', platform: 'YouTube' },
        { type: 'review', title: '2025 年度专辑推荐', platform: 'YouTube' }
      ],
      '知识/教育': [
        { type: 'documentary', title: '量子计算如何改变世界', platform: 'YouTube / Bilibili' },
        { type: 'lecture', title: '斯坦福 CS224N 自然语言处理', platform: 'YouTube' },
        { type: 'book', title: '年度书单：拓展认知边界的10本书', platform: 'Bilibili' }
      ],
      '生活/日常': [
        { type: 'vlog', title: '极简主义生活方式实践', platform: 'Bilibili' },
        { type: 'tutorial', title: '家庭咖啡角搭建指南', platform: 'YouTube' },
        { type: 'tips', title: '效率工具与工作流优化', platform: 'YouTube / Bilibili' }
      ],
      '财经/商业': [
        { type: 'analysis', title: '科技公司财报深度解读', platform: 'YouTube' },
        { type: 'case', title: '独立开发者从0到1产品案例', platform: 'Bilibili' },
        { type: 'news', title: '本周科技商业要闻', platform: 'YouTube' }
      ],
      '体育': [
        { type: 'highlight', title: '本周赛事精彩集锦', platform: 'YouTube' },
        { type: 'analysis', title: '战术深度解析：冠军是如何炼成的', platform: 'Bilibili' },
        { type: 'vlog', title: '运动员训练日常 Vlog', platform: 'YouTube' }
      ],
      '时尚/娱乐': [
        { type: 'trend', title: '2025 秋冬潮流趋势', platform: 'Bilibili' },
        { type: 'review', title: '本周综艺精选推荐', platform: 'YouTube' },
        { type: 'tutorial', title: '穿搭公式：用基础款搭出高级感', platform: 'Bilibili' }
      ]
    };

    const templates = contentTemplates[dominantCategory] || contentTemplates['知识/教育'];
    return templates.map((t, i) => ({
      ...t,
      rank: i + 1,
      reason: i === 0 ? '基于你当前兴趣分布的首推内容' :
              i === 1 ? '同类内容中的热门精选' :
                        '拓展兴趣边界的内容推荐'
    }));
  },

  _algorithmSummary(topTags, dominantCategory) {
    const bestTag = topTags[0];
    const secondTag = topTags[1];
    if (!bestTag) return '数据不足以生成算法画像。';
    return `算法判断你的核心兴趣是「${bestTag.name}」。${
      secondTag ? `同时，算法注意到你对「${secondTag.name}」也有稳定的关注。` : ''
    }基于你的 ${dominantCategory} 偏好，算法会优先向你推荐该领域的深度内容和相关拓展。`;
  },

  _calculateEvenness(categories, totalWeight) {
    if (categories.length <= 1) return 0;
    const proportions = categories.map(c => c.totalWeight / totalWeight);
    const n = categories.length;
    const h = -proportions.reduce((sum, p) => {
      return p > 0 ? sum + p * Math.log(p) : sum;
    }, 0);
    const hMax = Math.log(n);
    return Math.round((h / hMax) * 100);
  }
};
