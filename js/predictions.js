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
        title: (window._i18n?.current === "zh") ? '信息茧房风险较高' : 'High Echo Chamber Risk',
        desc: (window._i18n?.current === "zh") ? '你的兴趣高度集中在少数领域。算法可能正在为你构建一个舒适但狭窄的信息世界。' : 'Your interests are highly concentrated in a few areas. The algorithm may be building a comfortable but narrow information world.',
        suggestion: (window._i18n?.current === "zh") ? '尝试搜索与当前兴趣完全无关的内容，打破算法的舒适区。' : 'Try searching for content completely outside your current interests to break the algorithm\'s comfort zone.'
      });
    } else if (echoIndex >= 45) {
      advice.push({
        type: 'suggest',
        icon: '→',
        title: (window._i18n?.current === "zh") ? '适当拓展视野' : 'Broaden Your Horizons',
        desc: (window._i18n?.current === "zh") ? '你的兴趣有一定集中度，整体还算健康。' : 'Your interests show some concentration, but remain fairly healthy overall.',
        suggestion: (window._i18n?.current === "zh") ? '偶尔探索一些边缘领域，可能会有意外收获。' : 'Occasionally explore fringe areas — you might discover unexpected gems.'
      });
    } else {
      advice.push({
        type: 'good',
        icon: '✓',
        title: (window._i18n?.current === "zh") ? '信息多元' : 'Information Diversity',
        desc: (window._i18n?.current === "zh") ? '你的信息源非常丰富，几乎不存在信息茧房风险。' : 'Your information sources are highly diverse. Minimal echo chamber risk detected.',
        suggestion: (window._i18n?.current === "zh") ? '继续保持跨领域探索的习惯。' : 'Keep up your cross-domain exploration habit.'
      });
    }

    // Missing category suggestions
    if (missingCategories.length > 0) {
      const topSuggestion = missingCategories.slice(0, 3);
      advice.push({
        type: 'explore',
        icon: '✦',
        title: (window._i18n?.current === "zh") ? '未探索的领域' : 'Unexplored Territories',
        desc: (window._i18n?.current === "zh") ? `你的兴趣雷达尚未覆盖: ${topSuggestion.join('、')}` : `Your interest radar hasn\'t covered: ${topSuggestion.map(function(c){return INTEREST_OS.utils.getCategoryName(c, false);}).join(', ')}`,
        suggestion: (window._i18n?.current === "zh") ? `试试关注一些 ${topSuggestion[0]} 领域的内容，可能会发现新的兴趣点。` : `Try following content in ${INTEREST_OS.utils.getCategoryName(topSuggestion[0], false)} — you might discover new interests.`
      });
    }

    // Specific growth guidance
    const topTag = tags.sort((a, b) => b.weight - a.weight)[0];
    if (topTag && topTag.weight > 40) {
      advice.push({
        type: 'deep',
        icon: '↓',
        title: (window._i18n?.current === "zh") ? '深度耕耘建议' : 'Deep Dive Suggestion',
        desc: (window._i18n?.current === "zh") ? `你在「${topTag.name}」上的权重较高(${topTag.weight}%)，说明你有持续的关注深度。` : `Your weight on ${topTag.name} is high (${topTag.weight}%), showing sustained depth of interest.`,
        suggestion: (window._i18n?.current === "zh") ? '尝试将这个领域的知识应用到其他领域，可能会产生有趣的交叉创新。' : 'Try applying knowledge from this domain to others — interesting cross-pollination may emerge.'
      });
    }

    // Diversity advice
    if ((analysis?.diversityScore || 50) < 40) {
      advice.push({
        type: 'tip',
        icon: '💡',
        title: (window._i18n?.current === "zh") ? '多样性可以更好' : 'Diversity Can Improve',
        desc: (window._i18n?.current === "zh") ? '你的兴趣多样性评分偏低，算法看到的你可能比真实的你更窄。' : 'Your diversity score is low. The algorithm may see a narrower version of you than reality.',
        suggestion: (window._i18n?.current === "zh") ? '每周尝试看一个完全不同类型的视频，拓宽算法对你的认知。' : 'Try watching one completely different genre each week to broaden the algorithm\'s view of you.'
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
          title: (window._i18n?.current === "zh") ? '关键词匹配' : 'Keyword Matching',
          detail: (window._i18n?.current === "zh") ? `扫描 ${totalTitles} 条标题，匹配 ${Object.keys(INTEREST_OS.keywords).length} 大分类、${Object.values(INTEREST_OS.keywords).flat().length} 个关键词` : `Scanned ${totalTitles} titles across ${Object.keys(INTEREST_OS.keywords).length} categories, ${Object.values(INTEREST_OS.keywords).flat().length} keywords`,
          icon: '🔍'
        },
        {
          step: 2,
          title: (window._i18n?.current === "zh") ? '频率统计' : 'Frequency Analysis',
          detail: (window._i18n?.current === "zh") ? `计算每个关键词的出现频率，出现越多权重越高` : `Counts keyword frequency — more appearances = higher weight`,
          icon: '📊'
        },
        {
          step: 3,
          title: (window._i18n?.current === "zh") ? '同义词合并' : 'Synonym Merging',
          detail: (window._i18n?.current === "zh") ? `将同一分类下的相似关键词合并（如 AI + 人工智能 → 科技/AI）` : `Merge similar keywords under same category (e.g., AI + Artificial Intelligence → Tech/AI)`,
          icon: '🔗'
        },
        {
          step: 4,
          title: (window._i18n?.current === "zh") ? '关联分析' : 'Relation Analysis',
          detail: (window._i18n?.current === "zh") ? `分析标签在同一标题中的共现频率，构建兴趣关联网络` : `Analyzes co-occurrence of tags in same titles to build interest relation network`,
          icon: '🌐'
        }
      ],
      keyFindings: [
        { label: (window._i18n?.current === "zh") ? '最突出的兴趣' : 'Top Interest', value: topTag ? `${topTag.name} (${topTag.weight}%)` : '—' },
        { label: (window._i18n?.current === "zh") ? '主导分类' : 'Dominant Category', value: (window._i18n?.current === "zh") ? `${dominantCat} (${topCatWeight}%)` : `${INTEREST_OS.utils.getCategoryName(dominantCat)} (${topCatWeight}%)` },
        { label: (window._i18n?.current === "zh") ? '兴趣粒度' : 'Interest Granularity', value: (window._i18n?.current === "zh") ? `${tagCount} 个标签` : `${tagCount} tags` },
        { label: (window._i18n?.current === "zh") ? '算法确信度' : 'Algorithm Certainty', value: tagCount >= 8 ? ((window._i18n?.current === "zh") ? '高' : 'High') : tagCount >= 5 ? ((window._i18n?.current === "zh") ? '中' : 'Medium') : ((window._i18n?.current === "zh") ? '低' : 'Low') }
      ],
      summary: (window._i18n?.current === "zh") ? `算法通过分析 ${totalTitles} 条观看记录，在 ${Object.keys(INTEREST_OS.keywords).length} 个兴趣分类中识别出 ${tagCount} 个兴趣标签。${
        topTag ? `其中「${topTag.name}」权重最高 (${topTag.weight}%)，是算法判定你最核心的兴趣。` : ''
      }${
        dominantCat ? `整体来看，你的兴趣主要集中在「${dominantCat}」领域。` : ''
      }` : `Analyzed ${totalTitles} watch records across ${Object.keys(INTEREST_OS.keywords).length} categories, identifying ${tagCount} interest tags.${
        topTag ? ` Top tag: ${topTag.name} (${topTag.weight}%) — your core interest.` : ''
      }${
        dominantCat ? ` Your interests center on ${INTEREST_OS.utils.getCategoryName(dominantCat)}.` : ''
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
    let bestCat = (window._i18n?.current === "zh") ? '其他' : 'Other', bestW = 0;
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
        probability: (window._i18n?.current === "zh") ? '高' : 'High',
        reason: (window._i18n?.current === "zh") ? `基于你对 ${dominantCategory} 的关注，算法预测你可能会对「${kw}」产生兴趣` : `Based on your interest in ${INTEREST_OS.utils.getCategoryName(dominantCategory)}, the algorithm predicts you may be interested in ${kw}`
      });
    });

    // Predict from adjacent categories
    adjacentKeywords.slice(0, 3).forEach((kw, i) => {
      if (predictions.length >= 8) return;
      predictions.push({
        name: kw,
        source: 'category_expansion',
        probability: i === 0 ? ((window._i18n?.current === "zh") ? '中高' : 'Med-High') : ((window._i18n?.current === "zh") ? '中' : 'Medium'),
        reason: (window._i18n?.current === "zh") ? `你的兴趣范围可能向「${adjacentCats[i] || adjacentCats[0]}」扩展，算法推荐关注「${kw}」` : `Your interests may expand toward ${adjacentCats[i] || adjacentCats[0]}. Algorithm suggests exploring ${kw}`
      });
    });

    return predictions.slice(0, 8);
  },

  _suggestContent(topTags, dominantCategory) {
    // Content template suggestions based on category
    const contentTemplates = {
      'Tech/AI': [
        { type: (window._i18n?.current === "zh") ? '文章' : 'Article', title: (window._i18n?.current === "zh") ? 'AI Agent 开发实战：从零构建智能体' : 'AI Agent Dev: Build From Scratch', platform: 'YouTube / Bilibili' },
        { type: (window._i18n?.current === "zh") ? '视频' : 'Video', title: (window._i18n?.current === "zh") ? '2025 大模型能力横评：谁是最强王者' : '2025 LLM Comparison: Which Reigns Supreme?', platform: 'YouTube / Bilibili' },
        { type: (window._i18n?.current === "zh") ? '教程' : 'Tutorial', title: (window._i18n?.current === "zh") ? 'Prompt Engineering 进阶指南' : 'Advanced Prompt Engineering Guide', platform: 'YouTube' }
      ],
      'Coding/Dev': [
        { type: (window._i18n?.current === "zh") ? '教程' : 'Tutorial', title: (window._i18n?.current === "zh") ? 'Rust 异步编程完全指南' : 'Rust Async Programming: Complete Guide', platform: 'YouTube / Bilibili' },
        { type: (window._i18n?.current === "zh") ? '视频' : 'Video', title: (window._i18n?.current === "zh") ? '开源项目架构解析：从代码到部署' : 'Open Source Architecture: Code to Deploy', platform: 'Bilibili' },
        { type: (window._i18n?.current === "zh") ? '文章' : 'Article', title: (window._i18n?.current === "zh") ? '系统设计面试：分布式系统核心模式' : 'System Design: Distributed Core Patterns', platform: 'YouTube' }
      ],
      'Gaming': [
        { type: (window._i18n?.current === "zh") ? '评测' : 'Review', title: (window._i18n?.current === "zh") ? '本月值得关注的独立游戏推荐' : 'Indie Games: This Month\'s Picks', platform: 'YouTube / Bilibili' },
        { type: (window._i18n?.current === "zh") ? '攻略' : 'Guide', title: (window._i18n?.current === "zh") ? '黑神话悟空 全隐藏Boss攻略' : 'Black Myth Wukong: All Hidden Bosses', platform: 'Bilibili' },
        { type: (window._i18n?.current === "zh") ? '分析' : 'Analysis', title: (window._i18n?.current === "zh") ? '游戏设计叙事手法深度解析' : 'Game Design: Narrative Techniques Deep Dive', platform: 'YouTube' }
      ],
      'Film/Anime': [
        { type: (window._i18n?.current === "zh") ? '评测' : 'Review', title: (window._i18n?.current === "zh") ? '本月新番扫雷指南' : 'This Month\'s New Anime Guide', platform: 'Bilibili' },
        { type: (window._i18n?.current === "zh") ? '分析' : 'Analysis', title: (window._i18n?.current === "zh") ? '年度十佳电影镜头解析' : 'Top 10 Film Cinematography Moments', platform: 'YouTube' },
        { type: (window._i18n?.current === "zh") ? '推荐' : 'Recommend', title: (window._i18n?.current === "zh") ? '冷门佳作：你可能错过的 10 部动画' : 'Hidden Gems: 10 Anime You Missed', platform: 'Bilibili' }
      ],
      'Music': [
        { type: (window._i18n?.current === "zh") ? '歌单' : 'Playlist', title: (window._i18n?.current === "zh") ? '算法生成的个性化歌单：发现新声音' : 'AI-Generated Playlist: Discover New Sounds', platform: 'YouTube Music' },
        { type: (window._i18n?.current === "zh") ? '教程' : 'Tutorial', title: (window._i18n?.current === "zh") ? '音乐制作入门：用 FL Studio 做第一首歌' : 'Music Production: First Track in FL Studio', platform: 'YouTube' },
        { type: (window._i18n?.current === "zh") ? '评测' : 'Review', title: (window._i18n?.current === "zh") ? '2025 年度专辑推荐' : '2025 Album of the Year Picks', platform: 'YouTube' }
      ],
      'Knowledge/Education': [
        { type: (window._i18n?.current === "zh") ? '纪录片' : 'Documentary', title: (window._i18n?.current === "zh") ? '量子计算如何改变世界' : 'How Quantum Computing Changes Everything', platform: 'YouTube / Bilibili' },
        { type: (window._i18n?.current === "zh") ? '讲座' : 'Lecture', title: (window._i18n?.current === "zh") ? '斯坦福 CS224N 自然语言处理' : 'Stanford CS224N: Natural Language Processing', platform: 'YouTube' },
        { type: (window._i18n?.current === "zh") ? '书单' : 'Books', title: (window._i18n?.current === "zh") ? '年度书单：拓展认知边界的10本书' : 'Yearly Reading List: 10 Books to Expand Your Mind', platform: 'Bilibili' }
      ],
      'Lifestyle': [
        { type: (window._i18n?.current === "zh") ? 'Vlog' : 'Vlog', title: (window._i18n?.current === "zh") ? '极简主义生活方式实践' : 'Minimalist Lifestyle in Practice', platform: 'Bilibili' },
        { type: (window._i18n?.current === "zh") ? '教程' : 'Tutorial', title: (window._i18n?.current === "zh") ? '家庭咖啡角搭建指南' : 'Home Coffee Corner Setup Guide', platform: 'YouTube' },
        { type: (window._i18n?.current === "zh") ? '技巧' : 'Tips', title: (window._i18n?.current === "zh") ? '效率工具与工作流优化' : 'Productivity Tools & Workflow Optimization', platform: 'YouTube / Bilibili' }
      ],
      'Finance/Business': [
        { type: (window._i18n?.current === "zh") ? '分析' : 'Analysis', title: (window._i18n?.current === "zh") ? '科技公司财报深度解读' : 'Tech Earnings Reports: Deep Analysis', platform: 'YouTube' },
        { type: (window._i18n?.current === "zh") ? '案例' : 'Case Study', title: (window._i18n?.current === "zh") ? '独立开发者从0到1产品案例' : 'Indie Dev: 0 to 1 Product Case Study', platform: 'Bilibili' },
        { type: (window._i18n?.current === "zh") ? '新闻' : 'News', title: (window._i18n?.current === "zh") ? '本周科技商业要闻' : 'This Week in Tech & Business', platform: 'YouTube' }
      ],
      'Sports': [
        { type: (window._i18n?.current === "zh") ? '集锦' : 'Highlights', title: (window._i18n?.current === "zh") ? '本周赛事精彩集锦' : 'This Week\'s Sports Highlights', platform: 'YouTube' },
        { type: (window._i18n?.current === "zh") ? '分析' : 'Analysis', title: (window._i18n?.current === "zh") ? '战术深度解析：冠军是如何炼成的' : 'Tactical Analysis: How Champions Are Made', platform: 'Bilibili' },
        { type: (window._i18n?.current === "zh") ? 'Vlog' : 'Vlog', title: (window._i18n?.current === "zh") ? '运动员训练日常 Vlog' : 'Athlete Training Daily Vlog', platform: 'YouTube' }
      ],
      'Fashion/Entertainment': [
        { type: (window._i18n?.current === "zh") ? '趋势' : 'Trends', title: (window._i18n?.current === "zh") ? '2025 秋冬潮流趋势' : '2025 Fall/Winter Fashion Trends', platform: 'Bilibili' },
        { type: (window._i18n?.current === "zh") ? '评测' : 'Review', title: (window._i18n?.current === "zh") ? '本周综艺精选推荐' : 'This Week\'s Best Variety Shows', platform: 'YouTube' },
        { type: (window._i18n?.current === "zh") ? '教程' : 'Tutorial', title: (window._i18n?.current === "zh") ? '穿搭公式：用基础款搭出高级感' : 'Style Formula: Basics for Premium Looks', platform: 'Bilibili' }
      ]
    };

    const enCat = INTEREST_OS.utils.getCategoryName(dominantCategory, false);
    const templates = contentTemplates[enCat] || contentTemplates['Knowledge/Education'];
    return templates.map((t, i) => ({
      ...t,
      rank: i + 1,
      reason: i === 0 ? ((window._i18n?.current === "zh") ? '基于你当前兴趣分布的首推内容' : 'Top pick based on your interest distribution') :
              i === 1 ? ((window._i18n?.current === "zh") ? '同类内容中的热门精选' : 'Popular pick in the same category') :
                        ((window._i18n?.current === "zh") ? '拓展兴趣边界的内容推荐' : 'Expanding your interest boundaries')
    }));
  },

  _algorithmSummary(topTags, dominantCategory) {
    const bestTag = topTags[0];
    const secondTag = topTags[1];
    if (!bestTag) return (window._i18n?.current === "zh") ? '数据不足以生成算法画像。' : 'Insufficient data to generate algorithm profile.';
    return (window._i18n?.current === "zh") ? `算法判断你的核心兴趣是「${bestTag.name}」。${
      secondTag ? `同时，算法注意到你对「${secondTag.name}」也有稳定的关注。` : ''
    }基于你的 ${dominantCategory} 偏好，算法会优先向你推荐该领域的深度内容和相关拓展。` : `The algorithm identifies your core interest as ${bestTag.name}.${
      secondTag ? ` It also notices steady interest in ${secondTag.name}.` : ''
    } Based on your ${INTEREST_OS.utils.getCategoryName(dominantCategory)} preference, the algorithm will prioritize deep content and related explorations in this domain.`;
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
