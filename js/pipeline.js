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

    try {
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
        var rawCategoryWeights = stage2.output.categoryWeights || {};
        stage5 = await this._aiEnhance(titles, stage2.output.tags || [], rawCategoryWeights, stage3, options);
        stages.push(stage5);
      }

      // Compile final profile
      const profile = this._compile({
        stages,
        titles,
        elapsed: Date.now() - startTime
      });

      return profile;
    } catch(err) {
      console.error('[pipeline] run error at stage ' + stages.length + ':', err);
      console.error('[pipeline] titles:', typeof titles, Array.isArray(titles) ? 'array[' + titles.length + ']' : 'not array');
      throw err;
    }
  },

  // ─── Stage 1: 兴趣分类 (Interest Classification) ───
  // Uses the 18-category classifier engine
  _classify(titles) {
    const classifier = INTEREST_OS.classifier;
    const result = classifier.classify(titles);
    const allCatNames = Object.keys(classifier.categories);
    const matchedNames = result.results.map(function(r) { return r.name; });

    return {
      stage: 1,
      name: 'interest_classification',
      label: (window._i18n?.current === "zh") ? '兴趣分类' : 'Classification',
      icon: '🏷️',
      input: { titleCount: titles.length },
      output: {
        matchedKeywords: result.totalMatches,
        matchedCategories: matchedNames,
        categories: result.results,
        missingCategories: allCatNames.filter(function(c) { return matchedNames.indexOf(c) === -1; }),
        coverage: Math.round(matchedNames.length / allCatNames.length * 100),
        rawMatches: {}
      },
      classifierResult: result,  // pass full result to stage 2
      insights: [
        result.matchRate > 50
          ? (window._i18n?.current === "zh") ? `覆盖 ${matchedNames.length}/${allCatNames.length} 个兴趣分类，匹配率 ${result.matchRate}%` : `${matchedNames.length}/${allCatNames.length} categories covered, ${result.matchRate}% match rate`
          : (window._i18n?.current === "zh") ? `匹配 ${matchedNames.length}/${allCatNames.length} 个分类（${result.matchRate}%），可尝试提供更多数据` : `${matchedNames.length}/${allCatNames.length} categories matched (${result.matchRate}%), try adding more data`,
        result.results.length > 0
          ? (window._i18n?.current === "zh") ? `最高分类「${result.results[0].name}」占比 ${result.results[0].weight}%` : `Top category: ${result.results[0].nameEn || result.results[0].name} (${result.results[0].weight}%)`
          : (window._i18n?.current === "zh") ? '未匹配到任何分类' : 'No categories matched',
        (window._i18n?.current === "zh") ? `共匹配 ${result.totalMatches} 个关键词，涉及 ${result.matchedTitleCount}/${result.totalTitles} 条记录` : `${result.totalMatches} keyword matches across ${result.matchedTitleCount}/${result.totalTitles} records`
      ],
      confidence: Math.min(100, Math.round(titles.length / 10 * matchedNames.length))
    };
  },

  // ─── Stage 2: 兴趣权重 (Interest Weighting) ───
  _weight(stage1, titles) {
    const classifierResult = stage1.classifierResult;
    const isZh = window._i18n?.current === "zh";

    // Create tags from classifier category weights
    const palette = ['#00E5FF','#00FF88','#FFB800','#FF4D6A','#3B82F6','#A855F7','#EC4899','#14B8A6','#F97316','#84CC16','#6366f1','#22c55e','#eab308','#f43f5e','#d946ef','#06b6d4','#f97316','#10b981'];
    var tags = [];
    (classifierResult.results || []).forEach(function(r, i) {
      if (r.weight > 0) {
        tags.push({
          id: INTEREST_OS.utils.uid(),
          name: r.nameEn || r.name,
          weight: r.weight,
          category: r.personaCategory,
          color: palette[i % palette.length],
          relatedTags: [],
          sourceTitles: [],
          matchCount: r.matchCount,
          totalTitles: classifierResult.totalTitles || 1,
          frequency: (classifierResult.totalTitles > 0 ? Math.round(r.matchCount / classifierResult.totalTitles * 100) : 0) + '%',
          confidence: r.matchCount >= 5 ? 'high' : r.matchCount >= 2 ? 'medium' : 'low',
          isUserEdited: false,
          _originalCategory: r.name
        });
      }
    });

    // Calculate distribution metrics
    const weights = tags.map(function(t) { return t.weight; });
    const avgWeight = weights.length > 0 ? weights.reduce(function(a, b) { return a + b; }, 0) / weights.length : 0;
    const maxWeight = weights.length > 0 ? Math.max.apply(null, weights) : 0;
    const minWeight = weights.length > 0 ? Math.min.apply(null, weights) : 0;
    const variance = weights.length > 0
      ? weights.reduce(function(sum, w) { return sum + Math.pow(w - avgWeight, 2); }, 0) / weights.length
      : 0;
    const maxCatWeight = this._maxCategoryWeight(tags);

    // Diversity & echo chamber
    const uniqueCategories = [...new Set(tags.map(function(t) { return t.category; }))];
    const personaCatCount = Object.keys(INTEREST_OS.classifier.personaCategoryMap).length;
    const uniquePersonaCats = [...new Set(tags.map(function(t) { return t._originalCategory; }))];
    const diversityScore = Math.round(uniquePersonaCats.length / Math.min(Object.keys(INTEREST_OS.classifier.categories).length, 12) * 100);
    const echoChamberIndex = Math.min(100, Math.round(maxCatWeight * 1.5));

    // Category-level aggregation (by persona category)
    const catWeights = {};
    tags.forEach(function(t) {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });

    // Per-tag explanations (category-based, not keyword-based)
    const tagExplanations = tags.map(function(t) {
      return {
        tag: t.name,
        weight: t.weight,
        reason: isZh
          ? ('在 ' + classifierResult.totalTitles + ' 条记录中，『' + (t._originalCategory || t.category) + '』类匹配 ' + t.matchCount + ' 次')
          : ('Category "' + (t._originalCategory || t.category) + '" matched ' + t.matchCount + ' times across ' + classifierResult.totalTitles + ' records'),
        confidence: t.confidence,
        category: t.category
      };
    });

    return {
      stage: 2,
      name: 'interest_weight',
      label: isZh ? '兴趣权重' : 'Weights',
      icon: '📊',
      input: {
        categories: classifierResult.results.map(function(r) { return r.name; }),
        matchCount: classifierResult.totalMatches
      },
      output: {
        tags: tags,
        tagExplanations: tagExplanations,
        categoryWeights: classifierResult.categoryWeights, // { "美食": 68, "游戏": 12, ... }
        analysis: {
          diversityScore: Math.min(100, diversityScore),
          echoChamberIndex: Math.min(100, echoChamberIndex),
          concentrationLevel: echoChamberIndex < 30 ? (isZh ? '低' : 'Low') : echoChamberIndex < 55 ? (isZh ? '中等' : 'Medium') : echoChamberIndex < 80 ? (isZh ? '较高' : 'High') : (isZh ? '极高' : 'Extreme'),
          personaType: ''
        },
        distribution: {
          weightCount: tags.length,
          avgWeight: Math.round(avgWeight),
          maxWeight: maxWeight,
          minWeight: minWeight,
          variance: Math.round(variance),
          spreadType: variance > 800 ? 'polarized' : variance > 400 ? 'moderate' : 'balanced',
          dominantCategory: Object.keys(catWeights).length > 0
            ? Object.entries(catWeights).sort(function(a, b) { return b[1] - a[1]; })[0][0]
            : (isZh ? '未知' : 'Unknown')
        }
      },
      insights: [
        isZh
          ? '识别出 ' + tags.length + ' 个兴趣分类，最高占比「' + (tags[0]?.name || '') + '」(' + (tags[0]?.weight || 0) + '%)'
          : (tags.length + ' categories identified, top: "' + (tags[0]?.name || '') + '" (' + (tags[0]?.weight || 0) + '%)'),
        isZh
          ? '兴趣分布 ' + (variance > 800 ? '集中度较高，有明显主导兴趣' : variance > 400 ? '较为均衡' : '非常分散多元')
          : 'Distribution: ' + (variance > 800 ? 'highly concentrated' : variance > 400 ? 'moderately balanced' : 'widely diversified'),
        uniquePersonaCats.length <= 2
          ? (isZh ? '仅覆盖 ' + uniquePersonaCats.length + ' 个分类，建议拓宽内容范围' : 'Only ' + uniquePersonaCats.length + ' categories — consider broadening')
          : (isZh ? '覆盖 ' + uniquePersonaCats.length + ' 个兴趣分类，多样性良好' : uniquePersonaCats.length + ' categories — good diversity')
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
    const basePersona = INTEREST_OS.personas.determine(tags, (window._i18n?.current === 'zh'));

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
        factor: (window._i18n?.current === "zh") ? '主导分类' : 'Dominant Category',
        value: (window._i18n?.current === "zh") ? (sortedCats[0]?.[0] || '未知') : (INTEREST_OS.utils.getCategoryName(sortedCats[0]?.[0]) || 'Unknown'),
        contribution: Math.round((sortedCats[0]?.[1] || 0) / total * 100) + '%'
      },
      {
        factor: (window._i18n?.current === "zh") ? '最强兴趣标签' : 'Top Interest Tag',
        value: topTag?.name || ((window._i18n?.current === "zh") ? '未知' : 'Unknown'),
        contribution: topTag?.weight + '%'
      },
      {
        factor: (window._i18n?.current === "zh") ? '兴趣广度' : 'Interest Breadth',
        value: (window._i18n?.current === "zh") ? `${sortedCats.length} 个分类` : `${sortedCats.length} categories`,
        contribution: dist.spreadType === 'polarized' ? ((window._i18n?.current === "zh") ? '深度聚焦' : 'Deep Focus') : dist.spreadType === 'moderate' ? ((window._i18n?.current === "zh") ? '适度集中' : 'Moderate') : ((window._i18n?.current === "zh") ? '多元分散' : 'Diversified')
      },
      {
        factor: (window._i18n?.current === "zh") ? '行为模式' : 'Behavior Pattern',
        value: dist.variance > 800 ? ((window._i18n?.current === "zh") ? '选择性关注' : 'Selective Focus') : ((window._i18n?.current === "zh") ? '广泛涉猎' : 'Broad Exploration'),
        contribution: dist.variance > 800 ? ((window._i18n?.current === "zh") ? '高偏好驱动' : 'Preference-Driven') : ((window._i18n?.current === "zh") ? '好奇心驱动' : 'Curiosity-Driven')
      }
    ];

    // Generate unique persona name variant based on actual data
    const personaVariant = this._personaVariant(basePersona, tags, sortedCats);

    return {
      stage: 3,
      name: 'persona_generation',
      label: (window._i18n?.current === "zh") ? '人格生成' : 'Persona',
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
        (window._i18n?.current === "zh") ? `算法人格: ${basePersona.name}${secondaryCat ? ` (含 ${secondaryCat[0]} 倾向 ${secondaryShare}%)` : ''}` : `Persona: ${basePersona.name}${secondaryCat ? ` (${INTEREST_OS.utils.getCategoryName(secondaryCat[0])} influence ${secondaryShare}%)` : ''}`,
        (window._i18n?.current === "zh") ? `最强信号: 「${topTag?.name}」(${topTag?.weight}%)` : `Top signal: ${topTag?.name} (${topTag?.weight}%)`,
        (window._i18n?.current === "zh") ? `你属于「${dist.spreadType === 'polarized' ? '深度聚焦型' : dist.spreadType === 'moderate' ? '适度均衡型' : '多元探索型'}」兴趣结构` : `Interest structure: ${dist.spreadType === 'polarized' ? 'Deep Focus' : dist.spreadType === 'moderate' ? 'Balanced' : 'Multi-disciplinary Explorer'}`
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
            reason: (window._i18n?.current === "zh") ? `你在「${cat}」已有 ${existingCatTags.length} 个标签 (平均权重 ${Math.round(avgWeight)}%)，算法预测你可能会延伸关注「${kw}」` : `You have ${existingCatTags.length} tags in ${cat} (avg ${Math.round(avgWeight)}%). Algorithm predicts extension toward ${kw}`
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
            reason: (window._i18n?.current === "zh") ? `你的「${cat}」兴趣可能自然延伸到相邻的「${adjCat}」，算法推荐探索「${kw}」` : `Your ${cat} interest may extend to adjacent ${adjCat}. Algorithm suggests exploring ${kw}`
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
            reason: (window._i18n?.current === "zh") ? `你的「${cat}」兴趣可能自然延伸到相邻的「${adjCat}」，算法推荐探索「${kw}」` : `Your ${cat} interest may extend to adjacent ${adjCat}. Algorithm suggests exploring ${kw}`
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
            reason: (window._i18n?.current === "zh") ? `你同时关注「${catA}」和「${catB}」，交叉领域「${kw}」可能成为你的新兴趣点` : `You follow both ${catA} and ${catB}. The crossover ${kw} may become a new interest`
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
      label: (window._i18n?.current === "zh") ? '预测生成' : 'Prediction',
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
          probability: p.score > 60 ? ((window._i18n?.current === "zh") ? '高' : 'High') : p.score > 40 ? ((window._i18n?.current === "zh") ? '中高' : 'Med-High') : ((window._i18n?.current === "zh") ? '中' : 'Medium'),
          reason: p.reason,
          basis: p.basis
        })),
        recommendedContent: contentPredictions
      },
      insights: [
        deduped.length > 0
          ? (window._i18n?.current === "zh") ? `预测 ${deduped.length} 个可能的新兴趣标签，主要方向: ${deduped.slice(0, 3).map(p => p.name).join('、')}` : `Predicting ${deduped.length} new interest tags: ${deduped.slice(0, 3).map(p => p.name).join(', ')}`
          : (window._i18n?.current === "zh") ? '数据量不足以生成可靠预测' : 'Insufficient data for reliable predictions',
        (window._i18n?.current === "zh") ? `基于 ${tags.length} 个现有标签的关联分析得出` : `Based on relation analysis of ${tags.length} existing tags`,
        crossPredictions.length > 0
          ? (window._i18n?.current === "zh") ? `发现 ${catPairs?.length || 0} 个潜在的跨领域交叉点` : `${catPairs?.length || 0} potential cross-domain intersections found`
          : undefined
      ].filter(Boolean),
      confidence: Math.min(100, Math.round(30 + tags.length * 5 + deduped.length * 3))
    };
  },

  // ─── Stage 5: AI Explanation (only explains keyword results, never creates them) ───
  async _aiEnhance(titles, tags, rawCategoryWeights, stage3, options) {
    var tagCount = (tags && tags.length) || 0;
    if (!INTEREST_OS.aiAnalyzer) {
      return {
        stage: 5,
        name: 'ai_summary',
        label: (window._i18n?.current === "zh") ? 'AI 解释' : 'AI Summary',
        icon: '🧠',
        input: { titleCount: titles.length, tagCount: tagCount },
        output: { enhanced: false, reason: 'AI analyzer not available' },
        insights: [(window._i18n?.current === "zh") ? 'AI 解释模块不可用' : 'AI summary module unavailable'],
        confidence: 0
      };
    }

    const lang = options.lang || 'zh';

    // Build persona-category aggregated weights
    var personaCatWeights = {};
    (tags || []).forEach(function(t) {
      personaCatWeights[t.category] = (personaCatWeights[t.category] || 0) + (t.weight || 0);
    });

    // Keyword engine results (AI will ONLY explain these, not modify)
    var keywordPersona = { name: '', tagline: '' };
    if (stage3 && stage3.output) {
      keywordPersona.name = stage3.output.name || '';
      keywordPersona.tagline = stage3.output.tagline || '';
    }

    // Format the 18-category breakdown for AI
    var classifier = INTEREST_OS.classifier;
    var categoryBreakdown = Object.keys(rawCategoryWeights)
      .filter(function(c) { return rawCategoryWeights[c] > 0; })
      .sort(function(a, b) { return rawCategoryWeights[b] - rawCategoryWeights[a]; })
      .map(function(c) {
        var nameEn = (classifier && classifier.categoryNamesEn && classifier.categoryNamesEn[c]) || c;
        return '  "' + (lang === 'zh' ? c : nameEn) + '": ' + rawCategoryWeights[c] + '%';
      }).join('\n');

    try {
      const aiResult = await INTEREST_OS.aiAnalyzer.analyze(titles, {
        lang: lang,
        keywordTags: tags || [],
        keywordCategories: personaCatWeights,
        keywordPersona: keywordPersona,
        categoryBreakdown: categoryBreakdown,
        keywordAnalysis: {
          diversityScore: tags.length > 0 ? Math.round([...new Set(tags.map(t => t.category))].length / 10 * 100) : 0,
          echoChamberIndex: 50
        }
      });
      const isAI = aiResult.meta?.source === 'ai-analyzed';

      return {
        stage: 5,
        name: 'ai_analysis',
        label: (window._i18n?.current === "zh") ? 'AI 解释' : 'AI Summary',
        icon: '🧠',
        input: { titleCount: titles.length, tagCount: tagCount },
        output: {
          enhanced: isAI,
          aiTags: tagCount,
          summary: aiResult.summary || '',
          source: 'ai-explained'
        },
        insights: isAI
          ? [aiResult.summary ? (window._i18n?.current === "zh") ? 'AI 解读: ' + aiResult.summary : 'AI insight: ' + aiResult.summary : '', (window._i18n?.current === "zh") ? 'AI 解释基于关键词引擎的统计结果，不改变原始分析。' : 'AI explains keyword engine results, does not override them.'].filter(Boolean)
          : [(window._i18n?.current === "zh") ? 'AI 解释不可用，使用关键词引擎结果' : 'AI explanation unavailable — using keyword engine results'],
        confidence: isAI ? 80 : 50
      };
    } catch (e) {
      return {
        stage: 5,
        name: 'ai_analysis',
        label: (window._i18n?.current === "zh") ? 'AI 解释' : 'AI Summary',
        icon: '🧠',
        input: { titleCount: titles.length, tagCount: tagCount },
        output: { enhanced: false, error: e.message },
        insights: [(window._i18n?.current === "zh") ? 'AI 解释失败，使用关键词引擎结果' : 'AI explanation failed — using keyword engine results'],
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
        source: stage5?.output?.source || 'analyzed',
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
    const dominantCat = catNames[0] || ((window._i18n?.current === "zh") ? '未知' : 'Unknown');
    const secondaryCat = catNames[1] || null;

    // Build description from actual data
    const parts = [];

    if (topTag) {
      parts.push((window._i18n?.current === "zh") ? `算法从你的观看记录中最强烈地捕捉到的是「${topTag.name}」信号，权重 ${topTag.weight}%。这构成了算法判断你兴趣核心的首要依据。` : `The algorithm most strongly detected ${topTag.name} (weight ${topTag.weight}%). This is the primary basis for your interest profile.`);
    }

    if (sortedCats.length > 0) {
      const primaryShare = Math.round((sortedCats[0]?.[1] || 0) / (tags.reduce((s, t) => s + t.weight, 0) || 1) * 100);
      parts.push((window._i18n?.current === "zh") ? `你的注意力有 ${primaryShare}% 集中在「${dominantCat}」领域。` : `${primaryShare}% of your attention is focused on ${INTEREST_OS.utils.getCategoryName(dominantCat)}.`);
      if (secondaryCat) {
        const secShare = Math.round((sortedCats[1]?.[1] || 0) / (tags.reduce((s, t) => s + t.weight, 0) || 1) * 100);
        parts.push((window._i18n?.current === "zh") ? `同时，算法注意到你对「${secondaryCat}」${secShare >= 20 ? '也有显著关注' : '有初步兴趣'} (${secShare}%)。` : `The algorithm also notes ${secShare >= 20 ? 'significant interest' : 'initial interest'} in ${INTEREST_OS.utils.getCategoryName(secondaryCat)} (${secShare}%).`);
      }
    }

    parts.push((window._i18n?.current === "zh") ? `在算法眼中，你是一个${dist.spreadType === 'polarized' ? '深度聚焦、有明确偏好的' : dist.spreadType === 'moderate' ? '兴趣结构均衡的' : '涉猎广泛、多元开放的'}内容消费者。` : `In the algorithm\'s view, you are a ${dist.spreadType === 'polarized' ? 'deeply focused, strongly preferring' : dist.spreadType === 'moderate' ? 'structurally balanced' : 'broadly diversified, multi-disciplinary'} content consumer.`);

    if (top3Tags.length >= 2) {
      parts.push((window._i18n?.current === "zh") ? `你的兴趣图谱由「${top3Tags.map(t => t.name).join('」、「')}」等标签共同定义。` : `Your interest graph is defined by tags like ${top3Tags.map(t => t.name).join(', ')}.`);
    }

    return parts.join(' ');
  },

  // ─── Persona variant based on actual data ───
  // Rules 5-6: If food or travel is the top raw category, generate corresponding variant
  _personaVariant(basePersona, tags, sortedCats) {
    const dominantCat = sortedCats[0]?.[0] || '';
    const isZh = window._i18n?.current === "zh";

    // Check raw 18-category dominance (via _originalCategory on tags)
    var rawCatWeights = {};
    (tags || []).forEach(function(t) {
      var orig = t._originalCategory || '';
      if (orig) rawCatWeights[orig] = (rawCatWeights[orig] || 0) + (t.weight || 0);
    });
    var sortedRaw = Object.entries(rawCatWeights).sort(function(a, b) { return b[1] - a[1]; });
    var topRawCat = sortedRaw[0]?.[0] || '';

    // Rule 5: 如果美食占比最高，优先使用美食人格
    if (topRawCat === '美食') {
      return isZh ? '美食探索家' : 'Food Explorer';
    }
    // Rule 6: 如果旅游占比最高，优先使用旅游人格
    if (topRawCat === '旅游') {
      return isZh ? '旅行家' : 'Traveler';
    }

    const variantMap = {
      cyber_explorer: dominantCat.includes('科技') ? (isZh ? '技术深耕者' : 'Tech Deep Diver') : dominantCat.includes('编程') ? (isZh ? '代码艺术家' : 'Code Artist') : (isZh ? '数字游民' : 'Digital Nomad'),
      light_chaser: dominantCat.includes('影视') ? (isZh ? '银幕旅人' : 'Screen Traveler') : (isZh ? '动漫鉴赏家' : 'Anime Connoisseur'),
      knowledge_nomad: dominantCat.includes('科技') ? (isZh ? '科技求知者' : 'Tech Seeker') : (isZh ? '人文探索者' : 'Humanities Explorer'),
      game_master: dominantCat.includes('游戏') ? (isZh ? '硬核玩家' : 'Hardcore Gamer') : (isZh ? '游戏设计师' : 'Game Designer'),
      trend_hunter: dominantCat.includes('时尚') ? (isZh ? '潮流引领者' : 'Trend Leader') : (isZh ? '娱乐观察家' : 'Entertainment Watcher'),
      deep_diver: isZh ? '专注深耕者' : 'Deep Diver'
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
      title: (window._i18n?.current === "zh") ? `探索「${p.name}」— 基于你的 ${dominantCategory} 兴趣推荐` : `Explore ${p.name} — recommended based on your ${INTEREST_OS.utils.getCategoryName(dominantCategory)} interest`,
      platform: p.basis === 'adjacent_category' ? 'YouTube' : p.basis === 'cross_category' ? 'Bilibili' : 'YouTube',
      type: p.basis === 'interest_extension' ? ((window._i18n?.current === "zh") ? '深度内容' : 'Deep Content') : p.basis === 'cross_category' ? ((window._i18n?.current === "zh") ? '跨界内容' : 'Cross-Domain') : ((window._i18n?.current === "zh") ? '探索内容' : 'Exploratory'),
      reason: topTag
        ? ((window._i18n?.current === "zh") ? `你对「${topTag.name}」(${topTag.weight}%) 的关注度较高，算法推荐关联方向「${p.name}」` : `Your high interest in ${topTag.name} (${topTag.weight}%) leads the algorithm to recommend ${p.name}`)
        : ((window._i18n?.current === "zh") ? `算法基于你的兴趣分布推荐拓展方向「${p.name}」` : `The algorithm recommends exploring ${p.name} based on your interest distribution`),
      basis: p.basis,
      userBasis: userCatNames.slice(0, 2).join('/')
    }));
  },

  // ─── Helpers (ported from analyzer.js) ───

  _mergeSimilar(matchCounts, titles) {
    const merged = {};
    const synonymGroups = [
      ['AI', ((window._i18n?.current === "zh") ? '人工智能' : 'Artificial Intelligence'), 'ChatGPT', 'GPT'],
      [((window._i18n?.current === "zh") ? '编程' : 'Programming'), ((window._i18n?.current === "zh") ? '开发' : 'Development'), ((window._i18n?.current === "zh") ? '代码' : 'Code')],
      [((window._i18n?.current === "zh") ? '前端' : 'Frontend'), 'JavaScript', 'TypeScript'],
      [((window._i18n?.current === "zh") ? '游戏' : 'Gaming'), ((window._i18n?.current === "zh") ? '主机' : 'Console'), 'Steam'],
      [((window._i18n?.current === "zh") ? '动漫' : 'Anime'), ((window._i18n?.current === "zh") ? '动画' : 'Animation'), ((window._i18n?.current === "zh") ? '番剧' : 'Series')],
      [((window._i18n?.current === "zh") ? '电影' : 'Movies'), ((window._i18n?.current === "zh") ? '影视' : 'Film & TV'), ((window._i18n?.current === "zh") ? '影院' : 'Cinema')]
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
