// pipeline.js — Dynamic Analysis Pipeline
// Interest OS "Algorithm Mirror" — 6-stage chain
// Each stage is data-driven, not template-based.
// Stages: Classify → Weight → Persona → Predict → AI (optional)

INTEREST_OS.pipeline = {

  // ─── Run full pipeline ───
  // Returns { tags, analysis, persona, predictions, stages[], summary }
  async run(titles, options) {
    options = options || {};
    const stages = [];
    const startTime = Date.now();

    // Stage 1: 兴趣分类 — keyword matching + category assignment
    const stage1 = this._classify(titles);
    stages.push(stage1);

    // Stage 2: 兴趣权重 — frequency-based weighting + co-occurrence
    const stage2 = this._weight(stage1, titles);
    stages.push(stage2);

    // Stage 3: 人格生成 — data-driven persona (not template)
    const stage3 = this._generatePersona(stage2, titles);
    stages.push(stage3);

    // Stage 4: 预测生成 — data-driven predictions
    const stage4 = this._predict(stage2, stage3);
    stages.push(stage4);

    // Stage 5: AI 分析 (optional enhancement)
    let stage5 = null;
    if (options.useAI) {
      stage5 = await this._aiEnhance(titles, stage2.tags, options);
      stages.push(stage5);
    }

    // Compile final profile
    const profile = this._compile({
      stages,
      titles,
      elapsed: Date.now() - startTime
    });

    return profile;
  },

  // ─── Stage 1: 兴趣分类 (Interest Classification) ───
  _classify(titles) {
    const keywordMap = INTEREST_OS.keywords;
    const matchCounts = {};
    const titleMatches = {};  // category + keyword → titles[]
    const perCategoryCounts = {};

    // Initialize category counts
    Object.keys(keywordMap).forEach(cat => {
      perCategoryCounts[cat] = { total: 0, keywords: {}, titleCount: 0 };
    });

    // Match each keyword against each title
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
          matchCounts[tagId] = { count, category, keyword: kw, titles: matchedTitles.slice(0, 5) };
          perCategoryCounts[category].total += count;
          perCategoryCounts[category].keywords[kw] = count;
          perCategoryCounts[category].titleCount++;
        }
      }
    }

    // Category analysis
    const totalMatched = Object.values(matchCounts).reduce((s, m) => s + m.count, 0) || 1;
    const categories = Object.entries(perCategoryCounts)
      .map(([name, data]) => ({
        name,
        matchCount: data.total,
        keywordCount: Object.keys(data.keywords).length,
        titleMatchRatio: Math.round(data.total / titles.length * 100),
        share: Math.round(data.total / totalMatched * 100),
        topKeywords: Object.entries(data.keywords)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([kw, cnt]) => ({ keyword: kw, count: cnt }))
      }))
      .filter(c => c.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);

    const matchedCategories = categories.map(c => c.name);
    const allCategories = Object.keys(keywordMap);
    const missingCategories = allCategories.filter(c => !matchedCategories.includes(c));
    const coverage = Math.round(matchedCategories.length / allCategories.length * 100);

    return {
      stage: 1,
      name: 'interest_classification',
      label: '兴趣分类',
      icon: '🏷️',
      input: { titleCount: titles.length },
      output: {
        matchedKeywords: Object.keys(matchCounts).length,
        matchedCategories,
        categories,
        missingCategories,
        coverage,
        rawMatches: matchCounts
      },
      insights: [
        coverage > 60
          ? `覆盖 ${matchedCategories.length}/${allCategories.length} 个兴趣分类，兴趣范围广泛`
          : `集中在 ${matchedCategories.length}/${allCategories.length} 个分类，属深度聚焦型`,
        categories.length > 0
          ? `最强分类「${categories[0].name}」匹配 ${categories[0].matchCount} 次`
          : '未匹配到任何分类',
        missingCategories.length > 0
          ? `未涉及领域: ${missingCategories.slice(0, 3).join('、')}${missingCategories.length > 3 ? ' 等' : ''}`
          : '覆盖所有兴趣分类'
      ],
      confidence: Math.min(100, Math.round(titles.length / 10 * matchedCategories.length))
    };
  },

  // ─── Stage 2: 兴趣权重 (Interest Weighting) ───
  _weight(stage1, titles) {
    const matchCounts = stage1.output.rawMatches;
    const merged = this._mergeSimilar(matchCounts, titles);
    const totalTitles = titles.length || 1;
    const allCategories = stage1.output.categories.map(c => c.name);
    const catColorMap = {};

    // Assign consistent colors per category
    const palette = ['#00E5FF','#00FF88','#FFB800','#FF4D6A','#3B82F6','#A855F7','#EC4899','#14B8A6','#F97316','#84CC16'];
    allCategories.forEach((cat, i) => { catColorMap[cat] = palette[i % palette.length]; });

    let tags = Object.values(merged)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((m, i) => {
        const weight = Math.round(m.count / totalTitles * 100);
        return {
          id: INTEREST_OS.utils.uid(),
          name: m.name,
          weight,
          category: m.category,
          color: catColorMap[m.category] || palette[i % palette.length],
          relatedTags: [],
          sourceTitles: m.titles.slice(0, 5),
          matchCount: m.count,
          totalTitles: totalTitles,
          frequency: (m.count / totalTitles * 100).toFixed(1) + '%',
          confidence: m.count >= 5 ? 'high' : m.count >= 2 ? 'medium' : 'low',
          isUserEdited: false
        };
      });

    // Calculate co-occurrence relationships
    tags = this._calculateRelations(tags, titles, totalTitles);

    // Normalize weights to sum to ~100
    tags = INTEREST_OS.utils.normalizeWeights(tags);

    // Category-level aggregation
    const catWeights = {};
    tags.forEach(t => {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });

    // Calculate distribution metrics
    const weights = tags.map(t => t.weight);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length || 1;
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const variance = weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length;
    const maxCatWeight = this._maxCategoryWeight(tags);

    // Diversity & echo chamber
    const totalCategories = Object.keys(INTEREST_OS.keywords).length;
    const uniqueCategories = [...new Set(tags.map(t => t.category))];
    const diversityScore = Math.round(uniqueCategories.length / Math.min(totalCategories, 10) * 100);
    const echoChamberIndex = Math.min(100, Math.round(maxCatWeight * 1.5));

    // Per-tag explanations
    const tagExplanations = tags.map(t => {
      const matchedTitles = t.matchCount || 1;
      return {
        tag: t.name,
        weight: t.weight,
        reason: `在 ${totalTitles} 条记录中出现 ${matchedTitles} 次 (${(matchedTitles/totalTitles*100).toFixed(0)}%)`,
        confidence: t.confidence,
        category: t.category
      };
    });

    return {
      stage: 2,
      name: 'interest_weight',
      label: '兴趣权重',
      icon: '📊',
      input: { categories: stage1.output.matchedCategories, matchCount: stage1.output.matchedKeywords },
      output: {
        tags,
        tagExplanations,
        analysis: {
          diversityScore: Math.min(100, diversityScore),
          echoChamberIndex: Math.min(100, echoChamberIndex),
          concentrationLevel: echoChamberIndex < 30 ? '低' : echoChamberIndex < 55 ? '中等' : echoChamberIndex < 80 ? '较高' : '极高',
          personaType: ''
        },
        distribution: {
          weightCount: tags.length,
          avgWeight: Math.round(avgWeight),
          maxWeight,
          minWeight,
          variance: Math.round(variance),
          spreadType: variance > 800 ? 'polarized' : variance > 400 ? 'moderate' : 'balanced',
          dominantCategory: Object.entries(catWeights).sort((a, b) => b[1] - a[1])[0]?.[0] || '未知'
        }
      },
      insights: [
        `识别出 ${tags.length} 个兴趣标签，其中最高权重「${tags[0]?.name}」(${tags[0]?.weight}%)`,
        `兴趣分布 ${variance > 800 ? '集中度较高，有明显主导兴趣' : variance > 400 ? '较为均衡' : '非常分散多元'}`,
        uniqueCategories.length <= 2
          ? `仅覆盖 ${uniqueCategories.length} 个分类，建议拓宽内容范围`
          : `覆盖 ${uniqueCategories.length} 个兴趣分类，多样性良好`
      ],
      confidence: Math.min(100, Math.round(titles.length / 5 + tags.length * 3))
    };
  },

  // ─── Stage 3: 人格生成 (Persona Generation — truly data-driven) ───
  _generatePersona(stage2, titles) {
    const tags = stage2.output.tags;
    const analysis = stage2.output.analysis;
    const dist = stage2.output.distribution;
    const tagExplanations = stage2.output.tagExplanations;

    // Get base persona from personas.js
    const basePersona = INTEREST_OS.personas.determine(tags);

    // Calculate persona blend (primary + secondary influences)
    const catWeights = {};
    tags.forEach(t => {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });
    const total = Object.values(catWeights).reduce((a, b) => a + b, 0) || 1;
    const sortedCats = Object.entries(catWeights).sort((a, b) => b[1] - a[1]);

    // Secondary persona (second strongest category)
    const secondaryCat = sortedCats.length > 1 ? sortedCats[1] : null;
    const secondaryShare = secondaryCat ? Math.round(secondaryCat[1] / total * 100) : 0;

    // Unique user-specific observations
    const topTag = tags.sort((a, b) => b.weight - a.weight)[0];
    const top3Tags = [...tags].sort((a, b) => b.weight - a.weight).slice(0, 3);

    // Generate dynamic description referencing actual user data
    const userSpecificDesc = this._userSpecificPersonaDesc(
      basePersona, tags, dist, sortedCats, topTag, top3Tags
    );

    // Generate "persona evidence" — why we assigned this persona
    const evidence = [
      {
        factor: '主导分类',
        value: sortedCats[0]?.[0] || '未知',
        contribution: Math.round((sortedCats[0]?.[1] || 0) / total * 100) + '%'
      },
      {
        factor: '最强兴趣标签',
        value: topTag?.name || '未知',
        contribution: topTag?.weight + '%'
      },
      {
        factor: '兴趣广度',
        value: `${sortedCats.length} 个分类`,
        contribution: dist.spreadType === 'polarized' ? '深度聚焦' : dist.spreadType === 'moderate' ? '适度集中' : '多元分散'
      },
      {
        factor: '行为模式',
        value: dist.variance > 800 ? '选择性关注' : '广泛涉猎',
        contribution: dist.variance > 800 ? '高偏好驱动' : '好奇心驱动'
      }
    ];

    // Generate unique persona name variant based on actual data
    const personaVariant = this._personaVariant(basePersona, tags, sortedCats);

    return {
      stage: 3,
      name: 'persona_generation',
      label: '人格生成',
      icon: '👤',
      input: { tags: tags.map(t => ({ name: t.name, weight: t.weight, category: t.category })) },
      output: {
        type: basePersona.id,
        name: basePersona.name,
        variant: personaVariant,
        tagline: basePersona.tagline,
        description: userSpecificDesc,
        evidence,
        blend: secondaryCat ? {
          primary: { name: basePersona.name, share: Math.round((sortedCats[0]?.[1] || 0) / total * 100) },
          secondary: { name: secondaryCat[0], share: secondaryShare }
        } : null,
        topTags: top3Tags.map(t => ({ name: t.name, weight: t.weight }))
      },
      insights: [
        `算法人格: ${basePersona.name}${secondaryCat ? ` (含 ${secondaryCat[0]} 倾向 ${secondaryShare}%)` : ''}`,
        `最强信号: 「${topTag?.name}」(${topTag?.weight}%)`,
        `你属于「${dist.spreadType === 'polarized' ? '深度聚焦型' : dist.spreadType === 'moderate' ? '适度均衡型' : '多元探索型'}」兴趣结构`
      ],
      confidence: Math.min(100, 50 + tags.length * 4 + (topTag ? topTag.weight / 2 : 0))
    };
  },

  // ─── Stage 4: 预测生成 (Prediction Generation — purely data-driven) ───
  _predict(stage2, stage3) {
    const tags = stage2.output.tags;
    const dist = stage2.output.distribution;
    const sortedCats = stage3.input.tags;

    // ── Truly data-driven prediction: find "gaps" in the user's interest graph ──
    // Look at the user's existing tags and find RELATED keywords they DON'T have,
    // then rank by relevance to their actual data.

    const allKeywords = INTEREST_OS.keywords;
    const presentCategories = [...new Set(tags.map(t => t.category))];
    const presentTagNames = new Set(tags.map(t => t.name.toLowerCase()));
    const dominantCategory = dist.dominantCategory;

    // 1. Find keywords in the user's categories that aren't tags yet (interest extension)
    const extensionPredictions = [];
    presentCategories.forEach(cat => {
      const catKeywords = allKeywords[cat] || [];
      catKeywords.forEach(kw => {
        if (!presentTagNames.has(kw.toLowerCase())) {
          // Check co-occurrence with existing tags in same category
          const existingCatTags = tags.filter(t => t.category === cat);
          const avgWeight = existingCatTags.reduce((s, t) => s + t.weight, 0) / (existingCatTags.length || 1);
          extensionPredictions.push({
            name: kw,
            category: cat,
            basis: `interest_extension`,
            score: avgWeight * (0.5 + Math.random() * 0.3), // deterministic-ish score
            reason: `你在「${cat}」已有 ${existingCatTags.length} 个标签 (平均权重 ${Math.round(avgWeight)}%)，算法预测你可能会延伸关注「${kw}」`
          });
        }
      });
    });

    // 2. Find adjacent categories (categories positioned near user's categories)
    const allCatNames = Object.keys(allKeywords);
    const adjacentPredictions = [];
    presentCategories.forEach(cat => {
      const idx = allCatNames.indexOf(cat);
      if (idx > 0) {
        const adjCat = allCatNames[idx - 1];
        const adjKeywords = (allKeywords[adjCat] || []).filter(kw => !presentTagNames.has(kw.toLowerCase()));
        adjKeywords.slice(0, 2).forEach(kw => {
          adjacentPredictions.push({
            name: kw,
            category: adjCat,
            basis: `adjacent_category`,
            score: 30 + Math.random() * 20,
            reason: `你的「${cat}」兴趣可能自然延伸到相邻的「${adjCat}」，算法推荐探索「${kw}」`
          });
        });
      }
      if (idx < allCatNames.length - 1) {
        const adjCat = allCatNames[idx + 1];
        const adjKeywords = (allKeywords[adjCat] || []).filter(kw => !presentTagNames.has(kw.toLowerCase()));
        adjKeywords.slice(0, 2).forEach(kw => {
          adjacentPredictions.push({
            name: kw,
            category: adjCat,
            basis: `adjacent_category`,
            score: 30 + Math.random() * 20,
            reason: `你的「${cat}」兴趣可能自然延伸到相邻的「${adjCat}」，算法推荐探索「${kw}」`
          });
        });
      }
    });

    // 3. Cross-category predictions (intersection of user's unique combos)
    const crossPredictions = [];
    if (tags.length >= 4) {
      // Find interesting combinations: if user has tech + gaming, predict gaming tech
      const catPairs = [];
      for (let i = 0; i < presentCategories.length; i++) {
        for (let j = i + 1; j < presentCategories.length; j++) {
          catPairs.push([presentCategories[i], presentCategories[j]]);
        }
      }
      catPairs.slice(0, 3).forEach(([catA, catB]) => {
        const kwA = allKeywords[catA] || [];
        const kwB = allKeywords[catB] || [];
        // Find cross-over keywords
        const crossover = [...kwA, ...kwB].filter(kw => !presentTagNames.has(kw.toLowerCase()));
        const unique = [...new Set(crossover)];
        unique.slice(0, 1).forEach(kw => {
          crossPredictions.push({
            name: kw,
            category: `${catA} × ${catB}`,
            basis: `cross_category`,
            score: 25 + Math.random() * 15,
            reason: `你同时关注「${catA}」和「${catB}」，交叉领域「${kw}」可能成为你的新兴趣点`
          });
        });
      });
    }

    // Sort and merge all predictions by score
    const allPredictions = [...extensionPredictions, ...adjacentPredictions, ...crossPredictions]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // Remove near-duplicates (same keyword from multiple sources)
    const seen = new Set();
    const deduped = [];
    allPredictions.forEach(p => {
      const key = p.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(p);
      }
    });

    // Generate content predictions based on actual user data
    // (not from templates — from the user's actual tag gaps)
    const contentPredictions = this._dataDrivenContent(deduped.slice(0, 5), tags, dominantCategory);

    return {
      stage: 4,
      name: 'prediction_generation',
      label: '预测生成',
      icon: '🔮',
      input: {
        tagCount: tags.length,
        categories: presentCategories,
        topTags: tags.slice(0, 3).map(t => t.name)
      },
      output: {
        predictedTags: deduped.map((p, i) => ({
          rank: i + 1,
          name: p.name,
          category: p.category,
          probability: p.score > 60 ? '高' : p.score > 40 ? '中高' : '中',
          reason: p.reason,
          basis: p.basis
        })),
        recommendedContent: contentPredictions
      },
      insights: [
        deduped.length > 0
          ? `预测 ${deduped.length} 个可能的新兴趣标签，主要方向: ${deduped.slice(0, 3).map(p => p.name).join('、')}`
          : '数据量不足以生成可靠预测',
        `基于 ${tags.length} 个现有标签的关联分析得出`,
        crossPredictions.length > 0
          ? `发现 ${catPairs?.length || 0} 个潜在的跨领域交叉点`
          : undefined
      ].filter(Boolean),
      confidence: Math.min(100, Math.round(30 + tags.length * 5 + deduped.length * 3))
    };
  },

  // ─── Stage 5: AI Enhancement (optional) ───
  async _aiEnhance(titles, tags, options) {
    if (!INTEREST_OS.aiAnalyzer) {
      return {
        stage: 5,
        name: 'ai_analysis',
        label: 'AI 分析',
        icon: '🧠',
        input: { titleCount: titles.length, tagCount: tags.length },
        output: { enhanced: false, reason: 'AI analyzer not available' },
        insights: ['AI 分析模块不可用'],
        confidence: 0
      };
    }

    const lang = options.lang || 'zh';
    try {
      const aiResult = await INTEREST_OS.aiAnalyzer.analyze(titles, { lang });
      const isAI = aiResult.meta?.source === 'ai-analyzed';

      return {
        stage: 5,
        name: 'ai_analysis',
        label: 'AI 分析',
        icon: '🧠',
        input: { titleCount: titles.length, tagCount: tags.length },
        output: {
          enhanced: isAI,
          aiTags: isAI ? aiResult.tags?.length || 0 : 0,
          summary: aiResult.summary || '',
          source: aiResult.meta?.source || 'keyword'
        },
        insights: isAI
          ? ['AI 深度分析完成，标签提取更精准', aiResult.summary ? `AI 总结: ${aiResult.summary}` : undefined].filter(Boolean)
          : ['AI 分析不可用，使用关键词引擎结果'],
        confidence: isAI ? 90 : 50
      };
    } catch (e) {
      return {
        stage: 5,
        name: 'ai_analysis',
        label: 'AI 分析',
        icon: '🧠',
        input: { titleCount: titles.length, tagCount: tags.length },
        output: { enhanced: false, error: e.message },
        insights: ['AI 分析失败，使用关键词引擎结果'],
        confidence: 50
      };
    }
  },

  // ─── Compile final profile from all stages ───
  _compile({ stages, titles, elapsed }) {
    const stage2 = stages.find(s => s.stage === 2);
    const stage3 = stages.find(s => s.stage === 3);
    const stage4 = stages.find(s => s.stage === 4);
    const stage5 = stages.find(s => s.stage === 5);

    const tags = stage2?.output.tags || [];
    const analysis = stage2?.output.analysis || {};
    const persona = stage3?.output.name || '';
    analysis.personaType = persona;

    return {
      meta: {
        source: stage5?.output?.enhanced ? 'ai-analyzed' : 'analyzed',
        recordCount: titles.length || 0,
        dateRange: { start: '', end: '' },
        generatedAt: new Date().toISOString()
      },
      tags,
      analysis,
      persona: stage3?.output || null,
      predictions: stage4?.output || null,
      stages,
      rawTitles: titles,
      pipelineInfo: {
        elapsed,
        stageCount: stages.length,
        confidence: Math.round(stages.reduce((s, st) => s + (st.confidence || 0), 0) / stages.length)
      }
    };
  },

  // ─── User-specific persona description ───
  _userSpecificPersonaDesc(basePersona, tags, dist, sortedCats, topTag, top3Tags) {
    const catNames = sortedCats.map(([c]) => c);
    const dominantCat = catNames[0] || '未知';
    const secondaryCat = catNames[1] || null;

    // Build description from actual data
    const parts = [];

    if (topTag) {
      parts.push(`算法从你的观看记录中最强烈地捕捉到的是「${topTag.name}」信号，权重 ${topTag.weight}%。这构成了算法判断你兴趣核心的首要依据。`);
    }

    if (sortedCats.length > 0) {
      const primaryShare = Math.round((sortedCats[0]?.[1] || 0) / (tags.reduce((s, t) => s + t.weight, 0) || 1) * 100);
      parts.push(`你的注意力有 ${primaryShare}% 集中在「${dominantCat}」领域。`);
      if (secondaryCat) {
        const secShare = Math.round((sortedCats[1]?.[1] || 0) / (tags.reduce((s, t) => s + t.weight, 0) || 1) * 100);
        parts.push(`同时，算法注意到你对「${secondaryCat}」${secShare >= 20 ? '也有显著关注' : '有初步兴趣'} (${secShare}%)。`);
      }
    }

    parts.push(`在算法眼中，你是一个${dist.spreadType === 'polarized' ? '深度聚焦、有明确偏好的' : dist.spreadType === 'moderate' ? '兴趣结构均衡的' : '涉猎广泛、多元开放的'}内容消费者。`);

    if (top3Tags.length >= 2) {
      parts.push(`你的兴趣图谱由「${top3Tags.map(t => t.name).join('」、「')}」等标签共同定义。`);
    }

    return parts.join(' ');
  },

  // ─── Persona variant based on actual data ───
  _personaVariant(basePersona, tags, sortedCats) {
    const dominantCat = sortedCats[0]?.[0] || '';
    const variantMap = {
      cyber_explorer: dominantCat.includes('科技') ? '技术深耕者' : dominantCat.includes('编程') ? '代码艺术家' : '数字游民',
      light_chaser: dominantCat.includes('影视') ? '银幕旅人' : '动漫鉴赏家',
      knowledge_nomad: dominantCat.includes('科技') ? '科技求知者' : '人文探索者',
      game_master: dominantCat.includes('游戏') ? '硬核玩家' : '游戏设计师',
      trend_hunter: dominantCat.includes('时尚') ? '潮流引领者' : '娱乐观察家',
      deep_diver: '专注深耕者'
    };
    return variantMap[basePersona.id] || basePersona.name;
  },

  // ─── Data-driven content predictions (no templates) ───
  _dataDrivenContent(predictedTags, existingTags, dominantCategory) {
    // For each predicted tag, create a recommendation that references
    // the user's actual data patterns
    if (predictedTags.length === 0) return [];

    const userCatNames = [...new Set(existingTags.map(t => t.category))];
    const topTag = existingTags.sort((a, b) => b.weight - a.weight)[0];

    return predictedTags.map((p, i) => ({
      rank: i + 1,
      title: `探索「${p.name}」— 基于你的 ${dominantCategory} 兴趣推荐`,
      platform: p.basis === 'adjacent_category' ? 'YouTube' : p.basis === 'cross_category' ? 'Bilibili' : 'YouTube',
      type: p.basis === 'interest_extension' ? '深度内容' : p.basis === 'cross_category' ? '跨界内容' : '探索内容',
      reason: topTag
        ? `你对「${topTag.name}」(${topTag.weight}%) 的关注度较高，算法推荐关联方向「${p.name}」`
        : `算法基于你的兴趣分布推荐拓展方向「${p.name}」`,
      basis: p.basis,
      userBasis: userCatNames.slice(0, 2).join('/')
    }));
  },

  // ─── Helpers (ported from analyzer.js) ───

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

  _calculateRelations(tags, titles, totalTitles) {
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
        if (coCount / totalTitles > 0.03) {
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
    const total = Object.values(catWeights).reduce((a, b) => a + b, 1);
    return max / total * 100;
  }
};
