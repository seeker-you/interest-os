// social.js — Interest OS Social Features
// Rankings, Similar Users, Interest Growth Timeline

INTEREST_OS.social = {

  // ─── 1. RANKING SYSTEM ───
  // Compare the user's interest profile against a synthetic population
  // Returns tier labels (S/A/B/C/D) per category and overall

  _populationCache: null,

  _generatePopulation() {
    if (this._populationCache) return this._populationCache;

    const categories = Object.keys(INTEREST_OS.keywords);
    const population = [];
    const PERSONAS = ['cyber_explorer', 'light_chaser', 'knowledge_nomad',
                      'game_master', 'trend_hunter', 'deep_diver'];

    // Generate 200 synthetic users with varied profiles
    for (let i = 0; i < 200; i++) {
      const basePersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
      const weights = {};

      categories.forEach(c => { weights[c] = 0; });

      // Give each persona some baseline weight distribution
      switch (basePersona) {
        case 'cyber_explorer':
          weights['科技/AI'] = 20 + Math.random() * 40;
          weights['编程/开发'] = 15 + Math.random() * 35;
          weights['游戏'] = Math.random() * 15;
          break;
        case 'light_chaser':
          weights['影视/动漫'] = 25 + Math.random() * 45;
          weights['音乐'] = 10 + Math.random() * 20;
          weights['生活/日常'] = Math.random() * 15;
          break;
        case 'knowledge_nomad':
          weights['知识/教育'] = 20 + Math.random() * 40;
          weights['科技/AI'] = 10 + Math.random() * 20;
          break;
        case 'game_master':
          weights['游戏'] = 30 + Math.random() * 50;
          weights['科技/AI'] = Math.random() * 15;
          break;
        case 'trend_hunter':
          weights['时尚/娱乐'] = 15 + Math.random() * 30;
          weights['生活/日常'] = 15 + Math.random() * 25;
          weights['音乐'] = 5 + Math.random() * 20;
          break;
        case 'deep_diver':
          const focusCat = categories[Math.floor(Math.random() * categories.length)];
          weights[focusCat] = 40 + Math.random() * 40;
          break;
      }

      // Add noise
      categories.forEach(c => {
        weights[c] += Math.random() * 8;
      });

      // Normalize to sum 100
      const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
      const normalized = {};
      categories.forEach(c => {
        normalized[c] = Math.round(weights[c] / total * 100);
      });

      population.push({
        persona: basePersona,
        weights: normalized
      });
    }
    this._populationCache = population;
    return population;
  },

  // Calculate percentile rank of a value within an array
  _percentileRank(value, distribution) {
    const sorted = [...distribution].sort((a, b) => a - b);
    const count = sorted.length;
    const lessThan = sorted.filter(v => v < value).length;
    return Math.round(lessThan / count * 100);
  },

  // Get tier label from percentile
  _tierFromPercentile(pct) {
    if (pct >= 95) return { tier: 'S', label: 'Top 5%', color: '#FFD700' };
    if (pct >= 80) return { tier: 'A', label: 'Top 20%', color: '#00FF88' };
    if (pct >= 50) return { tier: 'B', label: 'Above Avg', color: '#00E5FF' };
    if (pct >= 25) return { tier: 'C', label: 'Below Avg', color: '#FFB800' };
    return { tier: 'D', label: 'Bottom 25%', color: '#FF4D6A' };
  },

  computeRanking(tags) {
    const population = this._generatePopulation();
    const categories = Object.keys(INTEREST_OS.keywords);

    // Build user's category weights
    const userCatWeights = {};
    categories.forEach(c => { userCatWeights[c] = 0; });
    tags.forEach(t => {
      if (userCatWeights[t.category] !== undefined) {
        userCatWeights[t.category] += t.weight;
      }
    });

    // For each category, calculate distribution across population
    const catDistributions = {};
    categories.forEach(c => {
      catDistributions[c] = population.map(p => p.weights[c] || 0);
    });

    // Calculate user's rank per category
    const categoryRanks = {};
    categories.forEach(c => {
      const userVal = userCatWeights[c] || 0;
      const pct = this._percentileRank(userVal, catDistributions[c]);
      categoryRanks[c] = {
        weight: userVal,
        percentile: pct,
        ...this._tierFromPercentile(pct)
      };
    });

    // Calculate the user's strongest interest (highest tier first, then highest weight)
    const rankedCategories = Object.entries(categoryRanks)
      .filter(([, r]) => r.weight > 0)
      .sort((a, b) => {
        const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
        const diff = tierOrder[a[1].tier] - tierOrder[b[1].tier];
        if (diff !== 0) return diff;
        return b[1].weight - a[1].weight;
      });

    // Overall profile tier (average percentile)
    const activeCats = rankedCategories.filter(([, r]) => r.weight > 0);
    const avgPercentile = activeCats.length > 0
      ? Math.round(activeCats.reduce((s, [, r]) => s + r.percentile, 0) / activeCats.length)
      : 0;
    const overallTier = this._tierFromPercentile(avgPercentile);

    // Diversity tier
    const activeCount = activeCats.length;
    const totalCats = categories.length;
    const diversityPct = Math.round(activeCount / totalCats * 100);
    const diversityTier = this._tierFromPercentile(diversityPct * 100 / 100);

    return {
      overall: {
        tier: overallTier.tier,
        label: overallTier.label,
        color: overallTier.color,
        percentile: avgPercentile
      },
      categories: categoryRanks,
      rankedCategories,
      diversity: {
        activeCategories: activeCount,
        totalCategories: totalCats,
        percentile: diversityPct,
        tier: diversityTier.tier,
        label: diversityTier.label,
        color: diversityTier.color
      },
      strongestCategory: rankedCategories[0] || null
    };
  },

  // ─── 2. SIMILAR USERS ───
  // Find similar interest profiles from a generated peer set

  _peerCache: null,

  _generatePeers() {
    if (this._peerCache) return this._peerCache;

    const categories = Object.keys(INTEREST_OS.keywords);

    // Define 12 distinct peer profiles with detailed tag breakdowns
    const peerTemplates = [
      {
        name: 'Alex Chen',
        persona: 'Cyber Explorer',
        emoji: '💻',
        desc: 'Full-stack developer who follows AI research',
        weights: { '科技/AI': 28, '编程/开发': 35, '游戏': 12, '知识/教育': 15, '音乐': 5, '生活/日常': 3, '影视/动漫': 2 }
      },
      {
        name: 'Mia Zhang',
        persona: 'Light Chaser',
        emoji: '🎬',
        desc: 'Film buff and anime enthusiast',
        weights: { '影视/动漫': 42, '音乐': 18, '生活/日常': 15, '时尚/娱乐': 12, '知识/教育': 8, '科技/AI': 3, '游戏': 2 }
      },
      {
        name: 'Sam Rivera',
        persona: 'Knowledge Nomad',
        emoji: '📚',
        desc: 'Lifelong learner exploring science & philosophy',
        weights: { '知识/教育': 38, '科技/AI': 18, '编程/开发': 10, '影视/动漫': 10, '生活/日常': 10, '音乐': 8, '财经/商业': 4, '体育': 2 }
      },
      {
        name: 'Jamie Kim',
        persona: 'Game Master',
        emoji: '🎮',
        desc: 'Hardcore gamer & esports viewer',
        weights: { '游戏': 55, '科技/AI': 12, '编程/开发': 8, '影视/动漫': 10, '音乐': 8, '生活/日常': 5, '体育': 2 }
      },
      {
        name: 'Taylor Wu',
        persona: 'Trend Hunter',
        emoji: '👟',
        desc: 'Fashion, lifestyle and pop culture follower',
        weights: { '时尚/娱乐': 30, '生活/日常': 36, '音乐': 15, '影视/动漫': 12, '知识/教育': 5, '科技/AI': 2 }
      },
      {
        name: 'Jordan Lee',
        persona: 'Deep Diver',
        emoji: '🎯',
        desc: 'Deeply focused on a single domain',
        weights: { '科技/AI': 52, '编程/开发': 25, '知识/教育': 12, '游戏': 6, '生活/日常': 3, '影视/动漫': 2 }
      },
      {
        name: 'Riley Park',
        persona: 'Cyber Explorer',
        emoji: '🔧',
        desc: 'DevOps engineer & open source contributor',
        weights: { '编程/开发': 40, '科技/AI': 22, '游戏': 15, '知识/教育': 10, '音乐': 6, '生活/日常': 5, '影视/动漫': 2 }
      },
      {
        name: 'Avery Singh',
        persona: 'Light Chaser',
        emoji: '🎵',
        desc: 'Music producer & concert goer',
        weights: { '音乐': 45, '影视/动漫': 20, '生活/日常': 15, '时尚/娱乐': 10, '知识/教育': 5, '科技/AI': 3, '游戏': 2 }
      },
      {
        name: 'Morgan Liu',
        persona: 'Knowledge Nomad',
        emoji: '🧪',
        desc: 'Science researcher & documentary watcher',
        weights: { '知识/教育': 35, '科技/AI': 25, '影视/动漫': 12, '生活/日常': 10, '音乐': 8, '财经/商业': 6, '体育': 4 }
      },
      {
        name: 'Casey Brown',
        persona: 'Game Master',
        emoji: '🕹️',
        desc: 'Speedrunner and gaming community member',
        weights: { '游戏': 48, '科技/AI': 8, '编程/开发': 14, '影视/动漫': 12, '音乐': 10, '生活/日常': 5, '体育': 3 }
      },
      {
        name: 'Drew Wang',
        persona: 'Trend Hunter',
        emoji: '📱',
        desc: 'Social media trends & entertainment news',
        weights: { '时尚/娱乐': 35, '生活/日常': 25, '影视/动漫': 15, '音乐': 12, '科技/AI': 5, '知识/教育': 5, '游戏': 3 }
      },
      {
        name: 'Quinn Li',
        persona: 'Deep Diver',
        emoji: '🎨',
        desc: 'Art & design focused content consumer',
        weights: { '时尚/娱乐': 30, '生活/日常': 25, '影视/动漫': 20, '音乐': 15, '知识/教育': 5, '科技/AI': 3, '游戏': 2 }
      }
    ];

    // Normalize weights for each peer
    this._peerCache = peerTemplates.map(p => {
      const total = Object.values(p.weights).reduce((a, b) => a + b, 0) || 1;
      const normWeights = {};
      Object.entries(p.weights).forEach(([cat, w]) => {
        normWeights[cat] = Math.round(w / total * 100);
      });
      return { ...p, weights: normWeights };
    });

    return this._peerCache;
  },

  // Cosine similarity between two category weight vectors
  _cosineSimilarity(w1, w2) {
    const allKeys = new Set([...Object.keys(w1), ...Object.keys(w2)]);
    let dot = 0, n1 = 0, n2 = 0;
    for (const k of allKeys) {
      const v1 = w1[k] || 0;
      const v2 = w2[k] || 0;
      dot += v1 * v2;
      n1 += v1 * v1;
      n2 += v2 * v2;
    }
    if (n1 === 0 || n2 === 0) return 0;
    return dot / (Math.sqrt(n1) * Math.sqrt(n2));
  },

  findSimilarUsers(tags, limit = 5) {
    const peers = this._generatePeers();
    const categories = Object.keys(INTEREST_OS.keywords);

    // Build user's category weight vector
    const userWeights = {};
    categories.forEach(c => { userWeights[c] = 0; });
    tags.forEach(t => {
      if (userWeights[t.category] !== undefined) {
        userWeights[t.category] += t.weight;
      }
    });

    // Normalize user weights to sum 100
    const userTotal = Object.values(userWeights).reduce((a, b) => a + b, 0) || 1;
    const userNorm = {};
    Object.entries(userWeights).forEach(([c, w]) => {
      userNorm[c] = Math.round(w / userTotal * 100);
    });

    // Calculate similarity with each peer
    const scored = peers.map(peer => {
      const similarity = this._cosineSimilarity(userNorm, peer.weights);

      // Find overlapping top interests
      const userTopCats = Object.entries(userNorm)
        .sort((a, b) => b[1] - a[1])
        .filter(([, w]) => w > 0)
        .slice(0, 3)
        .map(([c]) => c);

      const peerTopCats = Object.entries(peer.weights)
        .sort((a, b) => b[1] - a[1])
        .filter(([, w]) => w > 0)
        .slice(0, 3)
        .map(([c]) => c);

      const sharedCats = userTopCats.filter(c => peerTopCats.includes(c));

      return {
        ...peer,
        similarity: Math.round(similarity * 100),
        sharedCategories: sharedCats,
        matchLevel: similarity > 0.7 ? 'high' : similarity > 0.4 ? 'medium' : 'low'
      };
    });

    // Sort by similarity descending, return top N
    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  },

  // ─── 3. INTEREST GROWTH TIMELINE ───
  // Show how interests evolved over time by splitting titles chronologically

  computeTimeline(titles, tags) {
    const categories = Object.keys(INTEREST_OS.keywords);
    const TITLE_TIME_ESTIMATE = 7; // days per title (used when no timestamps)

    // Ensure we have enough data
    if (!titles || titles.length < 8) {
      return { periods: 0, data: [], chartLabels: [], chartDatasets: [] };
    }

    // Try to extract timestamps from title metadata (YouTube Takeout includes them)
    // Fallback: split titles evenly into 3-4 chronological periods
    const numPeriods = Math.min(4, Math.max(2, Math.floor(titles.length / 5)));
    const periodSize = Math.ceil(titles.length / numPeriods);

    const periods = [];
    for (let p = 0; p < numPeriods; p++) {
      const start = p * periodSize;
      const end = Math.min(start + periodSize, titles.length);
      const periodTitles = titles.slice(start, end);

      // Calculate category weights for this period
      const catCounts = {};
      categories.forEach(c => { catCounts[c] = 0; });

      // Simple keyword matching for this period's titles
      const kwMap = INTEREST_OS.keywords;
      for (const title of periodTitles) {
        const tl = title.toLowerCase();
        for (const [cat, kws] of Object.entries(kwMap)) {
          for (const kw of kws) {
            if (tl.includes(kw.toLowerCase())) {
              catCounts[cat] = (catCounts[cat] || 0) + 1;
              break; // count each title once per category
            }
          }
        }
      }

      // Normalize to percentages
      const total = periodTitles.length || 1;
      const weights = {};
      categories.forEach(c => {
        weights[c] = Math.round((catCounts[c] || 0) / total * 100);
      });

      periods.push({
        label: this._periodLabel(p, numPeriods, titles.length),
        titleCount: periodTitles.length,
        weights,
        dominantCat: Object.entries(weights)
          .sort((a, b) => b[1] - a[1])
          .filter(([, w]) => w > 0)[0]
      });
    }

    // Build Chart.js compatible data
    const activeCategories = Object.keys(INTEREST_OS.keywords)
      .filter(cat => periods.some(p => (p.weights[cat] || 0) > 2));

    const chartLabels = periods.map(p => p.label);
    const colors = ['#00E5FF','#00FF88','#FFB800','#FF4D6A','#3B82F6','#A855F7','#EC4899','#14B8A6','#F97316','#84CC16'];

    const chartDatasets = activeCategories.map((cat, i) => ({
      label: INTEREST_OS.utils.getCategoryName(cat, false),
      data: periods.map(p => p.weights[cat] || 0),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '20',
      fill: false,
      tension: 0.3,
      pointRadius: 3,
      borderWidth: 2
    }));

    // Calculate overall trend
    const trend = this._calculateTrend(periods, categories);

    return {
      periods: periods.length,
      data: periods,
      chartLabels,
      chartDatasets,
      trend
    };
  },

  _periodLabel(index, total, titleCount) {
    const now = new Date();
    const daysBack = titleCount * 7; // rough estimate
    const periodDays = Math.floor(daysBack / total);
    const offsetDays = (total - 1 - index) * periodDays;
    const startDate = new Date(now.getTime() - (offsetDays + periodDays) * 86400000);
    const endDate = new Date(now.getTime() - offsetDays * 86400000);

    const fmt = (d) => `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    if (total === 2) return index === 0 ? 'Earlier' : 'Recent';
    if (total === 3) return ['Earliest', 'Mid', 'Recent'][index];
    return ['Oldest', 'Earlier', 'Later', 'Recent'][index] || `Period ${index + 1}`;
  },

  _calculateTrend(periods, categories) {
    if (periods.length < 2) return { growing: [], declining: [], stable: [] };

    const first = periods[0];
    const last = periods[periods.length - 1];
    const growing = [];
    const declining = [];
    const stable = [];

    categories.forEach(cat => {
      const startVal = first.weights[cat] || 0;
      const endVal = last.weights[cat] || 0;
      const diff = endVal - startVal;

      if (diff > 5) {
        growing.push({ category: cat, change: diff });
      } else if (diff < -5) {
        declining.push({ category: cat, change: Math.abs(diff) });
      } else {
        stable.push({ category: cat, change: diff });
      }
    });

    return {
      growing: growing.sort((a, b) => b.change - a.change),
      declining: declining.sort((a, b) => b.change - a.change),
      stable: stable.sort((a, b) => b.change - a.change)
    };
  },

  // ─── RENDER FUNCTIONS ───

  renderRanking(containerId, ranking) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isZh = window._i18n?.current === 'zh';
    const catNames = INTEREST_OS.utils.categoryNames;

    // Overall tier badge
    const overallHTML = `
      <div class="ranking-summary">
        <div class="ranking-tier-badge" style="background:${ranking.overall.color}20;border-color:${ranking.overall.color}">
          <span class="ranking-tier-letter" style="color:${ranking.overall.color}">${ranking.overall.tier}</span>
          <span class="ranking-tier-label">${ranking.overall.label}</span>
        </div>
        <div class="ranking-summary-text">
          <span class="mono" style="font-size:0.875rem;color:var(--text)">${isZh ? '综合兴趣评级' : 'Overall Interest Rating'}</span>
          <span class="mono" style="font-size:0.6875rem;color:var(--text-muted)">${isZh ? `基于 ${Object.keys(ranking.categories).filter(c => ranking.categories[c].weight > 0).length} 个活跃兴趣分类` : `Based on ${Object.keys(ranking.categories).filter(c => ranking.categories[c].weight > 0).length} active categories`}</span>
        </div>
      </div>
      <div class="ranking-diversity">
        <span class="ranking-dot" style="background:${ranking.diversity.color}"></span>
        <span class="mono" style="font-size:0.75rem;color:var(--text-dim)">${isZh ? '兴趣多样性' : 'Interest Diversity'}: ${ranking.diversity.activeCategories}/${ranking.diversity.totalCategories} (${ranking.diversity.tier})</span>
      </div>
    `;

    // Category tier list
    const catHTML = ranking.rankedCategories.map(([cat, rank]) => {
      const displayName = catNames[cat] ? catNames[cat].en : cat;
      return `
        <div class="ranking-cat-row">
          <div class="ranking-cat-info">
            <span class="ranking-cat-name mono">${displayName}</span>
            <span class="ranking-cat-weight mono">${rank.weight}%</span>
          </div>
          <div class="ranking-cat-bar-bg">
            <div class="ranking-cat-bar" style="width:${Math.min(100, rank.percentile)}%;background:${rank.color};opacity:${0.4 + rank.percentile / 200}"></div>
          </div>
          <span class="ranking-cat-tier mono" style="color:${rank.color}">${rank.tier}</span>
          <span class="ranking-cat-pct mono" style="color:${rank.color}">${rank.percentile}%</span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="ranking-section">
        ${overallHTML}
        <div class="ranking-cat-list">
          ${catHTML}
        </div>
      </div>
    `;
  },

  renderSimilarUsers(containerId, similarUsers, userTags) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isZh = window._i18n?.current === 'zh';

    if (!similarUsers || similarUsers.length === 0) {
      container.innerHTML = `<p class="mono" style="font-size:0.75rem;color:var(--text-muted);padding:14px">${isZh ? '暂无相似用户数据' : 'No similar user data available'}</p>`;
      return;
    }

    const html = similarUsers.map((u, i) => {
      const matchColor = u.similarity > 70 ? 'var(--accent-green)' : u.similarity > 40 ? 'var(--accent-2)' : 'var(--text-muted)';
      const sharedHTML = u.sharedCategories.length > 0
        ? `<span class="mono" style="font-size:0.625rem;color:var(--accent)">${isZh ? '共同兴趣' : 'Shared'}: ${u.sharedCategories.map(c => INTEREST_OS.utils.getCategoryName(c)).join(', ')}</span>`
        : '';

      return `
        <div class="similar-user-card" style="animation-delay:${i * 0.1}s">
          <div class="similar-user-header">
            <span class="similar-user-avatar">${u.emoji}</span>
            <div class="similar-user-info">
              <span class="similar-user-name mono">${u.name}</span>
              <span class="similar-user-persona mono" style="font-size:0.6875rem;color:var(--text-dim)">${u.persona}</span>
            </div>
            <div class="similar-user-match" style="color:${matchColor}">
              <span class="mono" style="font-size:1rem;font-weight:700">${u.similarity}%</span>
              <span class="mono" style="font-size:0.5rem;text-transform:uppercase">${isZh ? '匹配' : 'Match'}</span>
            </div>
          </div>
          <div class="similar-user-desc mono" style="font-size:0.6875rem;color:var(--text-muted)">${u.desc}</div>
          ${sharedHTML ? `<div class="similar-user-shared">${sharedHTML}</div>` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="similar-users-section">
        <p class="mono" style="font-size:0.6875rem;color:var(--text-muted);margin-bottom:12px">
          ${isZh ? '基于兴趣分布相似度计算，发现与你最接近的算法人格' : 'Profiles most similar to your interest distribution'}
        </p>
        ${html}
      </div>
    `;
  },

  renderTimeline(containerId, chartContainerId, timelineData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isZh = window._i18n?.current === 'zh';

    if (!timelineData || timelineData.periods < 2) {
      container.innerHTML = `<p class="mono" style="font-size:0.75rem;color:var(--text-muted);padding:14px">${isZh ? '数据量不足以生成兴趣时间线（需要至少 8 条记录）' : 'Not enough data for timeline (need at least 8 records)'}</p>`;
      return;
    }

    // Render trend summary
    const trend = timelineData.trend;
    let trendHTML = '';
    if (trend) {
      const parts = [];
      if (trend.growing.length > 0) {
        parts.push(`<span style="color:var(--accent-green)">↑ ${trend.growing.map(t => INTEREST_OS.utils.getCategoryName(t.category)).join(', ')}</span>`);
      }
      if (trend.declining.length > 0) {
        parts.push(`<span style="color:var(--accent-3)">↓ ${trend.declining.map(t => INTEREST_OS.utils.getCategoryName(t.category)).join(', ')}</span>`);
      }
      if (trend.stable.length > 0) {
        parts.push(`<span style="color:var(--text-muted)">→ ${trend.stable.slice(0, 3).map(t => INTEREST_OS.utils.getCategoryName(t.category)).join(', ')}${trend.stable.length > 3 ? '...' : ''}</span>`);
      }
      trendHTML = parts.length > 0
        ? `<div class="timeline-trend mono" style="font-size:0.6875rem;display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;padding:8px 12px;background:var(--bg);border:1px solid var(--border)">${parts.join('')}</div>`
        : '';
    }

    // Period overview
    const periodHTML = timelineData.data.map((p, i) => {
      const topCats = Object.entries(p.weights)
        .sort((a, b) => b[1] - a[1])
        .filter(([, w]) => w > 3)
        .slice(0, 3);

      return `
        <div class="timeline-period">
          <div class="timeline-period-header">
            <span class="mono" style="font-size:0.75rem;font-weight:700;color:var(--text)">${p.label}</span>
            <span class="mono" style="font-size:0.625rem;color:var(--text-muted)">${p.titleCount} ${isZh ? '条' : 'titles'}</span>
          </div>
          <div class="timeline-period-tags">
            ${topCats.length > 0
              ? topCats.map(([cat, w]) =>
                  `<span class="timeline-tag" style="border-color:var(--border)"><span style="color:var(--accent)">${INTEREST_OS.utils.getCategoryName(cat)}</span> ${w}%</span>`
                ).join('')
              : `<span class="mono" style="font-size:0.625rem;color:var(--text-muted)">${isZh ? '未检测到明显兴趣' : 'No dominant interests'}</span>`
            }
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="timeline-section">
        ${trendHTML}
        <div class="timeline-chart-wrap">
          <canvas id="${chartContainerId}"></canvas>
        </div>
        <div class="timeline-periods">
          ${periodHTML}
        </div>
      </div>
    `;

    // Render Chart.js chart
    this._renderTimelineChart(chartContainerId, timelineData);
  },

  _renderTimelineChart(canvasId, timelineData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');

    // Limit datasets to 6 for readability
    const allDatasets = timelineData.chartDatasets;
    const sorted = [...allDatasets].sort((a, b) => {
      const sumA = a.data.reduce((s, v) => s + v, 0);
      const sumB = b.data.reduce((s, v) => s + v, 0);
      return sumB - sumA;
    });
    const topDatasets = sorted.slice(0, 6);

    // Destroy existing chart if any
    if (this._timelineChart) {
      this._timelineChart.destroy();
    }

    this._timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timelineData.chartLabels,
        datasets: topDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#A1A1AA',
              font: { family: 'Space Mono, monospace', size: 10 },
              boxWidth: 12,
              padding: 12
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#71717A', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#71717A', font: { size: 10 }, maxTicksLimit: 5 },
            grid: { color: 'rgba(255,255,255,0.06)' }
          }
        }
      }
    });
  }
};
