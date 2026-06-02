// personas-enhanced.js — Enhanced persona definitions for "Algorithm Mirror"
// Extends INTEREST_OS.personas with richer descriptions and "algorithm's perspective"

(function() {
  if (!INTEREST_OS.personas) return;

  const base = INTEREST_OS.personas;

  // Enhanced descriptions: "算法眼中的你" / "How the algorithm sees you"
  base.enhancedDescriptions = {
    cyber_explorer: {
      zh: '算法看到的是一个用代码和逻辑丈量世界的数字原住民。你的观看记录里充满了技术深度——你不仅想知道"怎么做"，更想知道"为什么"。算法认为你是一个永不停歇的思考者，对系统底层原理有着近乎偏执的好奇。深夜的技术论文、最新的框架对比、底层的原理剖析——这些都在告诉算法：你活在逻辑构建的世界里。',
      en: 'The algorithm sees a digital native who measures the world in code and logic. Your watch history is filled with technical depth — you don\'t just want to know "how", you want to know "why". The algorithm identifies you as a relentless thinker with an almost obsessive curiosity about how systems work under the hood.'
    },
    light_chaser: {
      zh: '算法看到的是一个用故事喂养灵魂的叙事旅人。你的观看记录是一面映照人类处境的镜子——电影、动漫、纪录片，每一帧都在塑造算法对你的认知。你不仅消费故事，你在感受叙事背后的情感结构。算法注意到你对角色命运的投入远超过对特效场面的关注。在你的数据里，算法看到了—个通过他人故事理解自己生活的深邃灵魂。',
      en: 'The algorithm sees a narrative traveler who feeds their soul with stories. Your watch history is a mirror reflecting the human condition — films, anime, documentaries, every frame shapes how the algorithm sees you.'
    },
    knowledge_nomad: {
      zh: '算法看到的是一个永不满足的好奇心容器。你的兴趣边界在持续扩张——从量子物理到哲学思辨，从编程教程到经济分析，没有任何一个知识领域能让你停留太久。算法在努力跟上你的节奏，但你的好奇心比任何推荐算法跑得更快。对你来说，世界是一个巨大的游乐场，每一个知识点都是等待探索的新项目。',
      en: 'The algorithm sees an insatiable vessel of curiosity. Your interest boundaries are constantly expanding — from quantum physics to philosophical debate, from coding tutorials to economic analysis.'
    },
    game_master: {
      zh: '算法看到的是一个在规则系统中寻找最优解的战略家。你的观看记录暴露了你对系统机制的痴迷——攻略、评测、技术分析，每一篇都在告诉算法：你不是在玩游戏，你是在研究游戏。算法注意到你对游戏设计的欣赏远超对单纯娱乐的需求。你把每一个Boss战都当作一个待解决的问题，把每一款游戏都当作一个待分析的系统。',
      en: 'The algorithm sees a strategist seeking optimal solutions within rule systems. Your watch history reveals an obsession with systemic mechanics — guides, reviews, technical analysis.'
    },
    trend_hunter: {
      zh: '算法看到的是一个永远在线、永远在浪潮之巅的潮流感知者。你的观看记录是一份实时更新的文化晴雨表——从最新的综艺到最热的穿搭，从爆款话题到新兴趋势，你总是站在浪潮的前沿。算法注意到你对"正在发生什么"有着本能的敏感。你不仅是潮流的消费者，更是潮流的放大器。',
      en: 'The algorithm sees someone who is always online, always at the crest of the wave. Your watch history is a real-time cultural barometer — from the latest variety shows to trending fashion.'
    },
    deep_diver: {
      zh: '算法看到的是一个在单一领域挖掘到极致深度的人。你的观看记录显示了一种罕见的专注力——在其他人的兴趣分散在十个方向时，你把全部注意力投注在一个领域。算法认为你是一个深度耕耘者，用一厘米宽挖出一公里深的洞。你的专注力是这个时代最稀缺的资源。',
      en: 'The algorithm sees someone who digs to extreme depth in a single domain. Your watch history reveals a rare focus — while others spread across ten directions, you pour all your attention into one area.'
    }
  };

  // Get enhanced description
  base.getEnhancedDescription = function(personaId, lang) {
    const desc = this.enhancedDescriptions[personaId];
    if (!desc) return '';
    return lang === 'zh' ? desc.zh : desc.en;
  };

  // Get algorithmic observation — specific data-driven observations
  base.getAlgorithmObservations = function(tags, analysis) {
    const observations = [];
    const sorted = [...tags].sort((a, b) => b.weight - a.weight);

    // Observation 1: Top interest concentration
    if (sorted.length > 0) {
      const top = sorted[0];
      observations.push({
        icon: '🎯',
        label: (window._i18n?.current === "zh") ? '最强烈的兴趣信号' : 'Strongest Interest Signal',
        detail: (window._i18n?.current === "zh") ? `「${top.name}」在 ${top.weight}% 的观看记录中出现或关联，是算法识别到的最强兴趣信号。` : `${top.name} appears in ${top.weight}% of your watch history — the strongest interest signal detected.`,
        data: `Top: ${top.name} (${top.weight}%)`
      });
    }

    // Observation 2: Category spread
    const categories = [...new Set(tags.map(t => t.category))];
    if (categories.length <= 2) {
      observations.push({
        icon: '⚠',
        label: (window._i18n?.current === "zh") ? '兴趣集中度提示' : 'Interest Concentration',
        detail: (window._i18n?.current === "zh") ? `你的兴趣集中在 ${categories.length} 个分类（大多数人 3-5 个），算法认为你是一个深度聚焦型用户。` : `Your interests span ${categories.length} categories (most people have 3-5). The algorithm sees you as a deep-focus user.`,
        data: `${categories.length} categories`
      });
    } else {
      observations.push({
        icon: '🌈',
        label: (window._i18n?.current === "zh") ? '兴趣多样性' : 'Interest Diversity',
        detail: (window._i18n?.current === "zh") ? `你的兴趣覆盖 ${categories.length} 个分类，算法认为你是一个多元探索型用户。` : `Your interests span ${categories.length} categories. The algorithm sees you as a multi-disciplinary explorer.`,
        data: `${categories.length} categories`
      });
    }

    // Observation 3: Echo chamber assessment
    const echoIndex = analysis?.echoChamberIndex || 50;
    if (echoIndex > 60) {
      observations.push({
        icon: '🔮',
        label: (window._i18n?.current === "zh") ? '算法预测行为' : 'Algorithm Prediction',
        detail: (window._i18n?.current === "zh") ? `基于 ${echoIndex}% 的茧房指数，算法预测你未来 70% 以上的推荐内容将来自当前主导领域。` : `With an echo index of ${echoIndex}%, the algorithm predicts 70%+ of future recommendations will come from your dominant domain.`,
        data: `Echo: ${echoIndex}%`
      });
    } else {
      observations.push({
        icon: '🔮',
        label: (window._i18n?.current === "zh") ? '算法预测行为' : 'Algorithm Prediction',
        detail: (window._i18n?.current === "zh") ? `算法认为你的信息摄入较为均衡，推荐内容将呈现多元化分布。` : `Your information intake is well-balanced. Recommendations will show diverse distribution.`,
        data: `Echo: ${echoIndex}%`
      });
    }

    // Observation 4: Weight distribution pattern
    const weights = tags.map(t => t.weight);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const maxWeight = Math.max(...weights);
    const variance = weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length;

    if (variance > 800) {
      observations.push({
        icon: '📈',
        label: (window._i18n?.current === "zh") ? '兴趣分布模式' : 'Interest Distribution',
        detail: (window._i18n?.current === "zh") ? `你的兴趣权重差异较大（最高 ${maxWeight}% vs 平均 ${Math.round(avgWeight)}%），算法判断你是一个有明显偏好的用户。` : `Your interest weights vary significantly (max ${maxWeight}% vs avg ${Math.round(avgWeight)}%). The algorithm sees you as a user with strong preferences.`,
        data: `High variance`
      });
    } else {
      observations.push({
        icon: '📈',
        label: (window._i18n?.current === "zh") ? '兴趣分布模式' : 'Interest Distribution',
        detail: (window._i18n?.current === "zh") ? `你的兴趣权重分布较为均匀，算法判断你是一个兴趣广泛且均衡的用户。` : `Your interest weights are evenly distributed. The algorithm sees you as a broad and balanced user.`,
        data: `Low variance`
      });
    }

    return observations;
  };

})();
