// personas.js - Persona Type Definitions

INTEREST_OS.personas = {
  types: [
    {
      id: "cyber_explorer",
      name: "赛博探索者",
      tagline: "用代码和像素丈量世界的数字游民",
      colorStart: "#6366F1",
      colorEnd: "#8B5CF6",
      dominantCategories: ["科技/AI", "编程/开发"],
      threshold: 0.4
    },
    {
      id: "light_chaser",
      name: "光影捕手",
      tagline: "活在每一帧故事里的叙事旅人",
      colorStart: "#EC4899",
      colorEnd: "#F97316",
      dominantCategories: ["影视/动漫"],
      threshold: 0.4
    },
    {
      id: "knowledge_nomad",
      name: "知识游牧者",
      tagline: "好奇心没有边界，大脑永远在路上",
      colorStart: "#10B981",
      colorEnd: "#22D3EE",
      dominantCategories: ["知识/教育"],
      threshold: 0.3
    },
    {
      id: "game_master",
      name: "游戏大师",
      tagline: "每一个Boss都是你最好的老师",
      colorStart: "#A855F7",
      colorEnd: "#6366F1",
      dominantCategories: ["游戏"],
      threshold: 0.4
    },
    {
      id: "trend_hunter",
      name: "潮流猎手",
      tagline: "永远在线，永远新鲜，永远在路上",
      colorStart: "#F43F5E",
      colorEnd: "#EC4899",
      dominantCategories: ["时尚/娱乐", "生活/日常"],
      threshold: 0.35
    },
    {
      id: "deep_diver",
      name: "深度耕耘者",
      tagline: "一厘米宽，一公里深的专注力量",
      colorStart: "#F59E0B",
      colorEnd: "#EF4444",
      dominantCategories: [],
      threshold: 0,
      customRule(tags) {
        // Any single category > 50%
        const catWeights = {};
        tags.forEach(t => {
          catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
        });
        return Object.values(catWeights).some(w => w > 50);
      }
    }
  ],

  // Determine persona from tags
  determine(tags) {
    // Calculate category weight distribution
    const catWeights = {};
    tags.forEach(t => {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });
    const total = Object.values(catWeights).reduce((a,b) => a+b, 0) || 1;

    let bestPersona = null;
    let bestScore = -1;

    for (const persona of this.types) {
      let score = 0;
      if (persona.customRule) {
        if (persona.customRule(tags)) {
          score = 0.6;
        }
      }
      if (persona.dominantCategories.length > 0) {
        const catScore = persona.dominantCategories.reduce(
          (s, c) => s + (catWeights[c] || 0), 0
        ) / total;
        score = Math.max(score, catScore);
      }
      if (score > bestScore) {
        bestScore = score;
        bestPersona = persona;
      }
    }

    return bestPersona || this.types[0];
  }
};
