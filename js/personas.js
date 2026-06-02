// personas.js - Persona Type Definitions
// Bilingual: English default, Chinese via nameZh/taglineZh

INTEREST_OS.personas = {
  types: [
    {
      id: "cyber_explorer",
      name: "Cyber Explorer",
      nameZh: "赛博探索者",
      tagline: "A digital native, measuring the world in code and pixels",
      taglineZh: "用代码和像素丈量世界的数字游民",
      colorStart: "#6366F1",
      colorEnd: "#8B5CF6",
      dominantCategories: ["科技/AI", "编程/开发"],
      threshold: 0.4
    },
    {
      id: "light_chaser",
      name: "Light Chaser",
      nameZh: "光影捕手",
      tagline: "A narrative traveler, living in every frame",
      taglineZh: "活在每一帧故事里的叙事旅人",
      colorStart: "#EC4899",
      colorEnd: "#F97316",
      dominantCategories: ["影视/动漫"],
      threshold: 0.4
    },
    {
      id: "knowledge_nomad",
      name: "Knowledge Nomad",
      nameZh: "知识游牧者",
      tagline: "Curiosity without borders, mind always wandering",
      taglineZh: "好奇心没有边界，大脑永远在路上",
      colorStart: "#10B981",
      colorEnd: "#22D3EE",
      dominantCategories: ["知识/教育"],
      threshold: 0.3
    },
    {
      id: "game_master",
      name: "Game Master",
      nameZh: "游戏大师",
      tagline: "Every boss fight is your best teacher",
      taglineZh: "每一个Boss都是你最好的老师",
      colorStart: "#A855F7",
      colorEnd: "#6366F1",
      dominantCategories: ["游戏"],
      threshold: 0.4
    },
    {
      id: "trend_hunter",
      name: "Trend Hunter",
      nameZh: "潮流猎手",
      tagline: "Always online, always fresh, always ahead",
      taglineZh: "永远在线，永远新鲜，永远在路上",
      colorStart: "#F43F5E",
      colorEnd: "#EC4899",
      dominantCategories: ["时尚/娱乐", "生活/日常"],
      threshold: 0.35
    },
    {
      id: "deep_diver",
      name: "Deep Diver",
      nameZh: "深度耕耘者",
      tagline: "One centimeter wide, one kilometer deep",
      taglineZh: "一厘米宽，一公里深的专注力量",
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

  // Get localized name
  getLocalizedName(personaOrId, isZh) {
    const p = typeof personaOrId === 'string'
      ? this.types.find(t => t.id === personaOrId)
      : personaOrId;
    if (!p) return '--';
    return isZh ? (p.nameZh || p.name) : p.name;
  },

  // Get localized tagline
  getLocalizedTagline(personaOrId, isZh) {
    const p = typeof personaOrId === 'string'
      ? this.types.find(t => t.id === personaOrId)
      : personaOrId;
    if (!p) return '';
    return isZh ? (p.taglineZh || p.tagline) : p.tagline;
  },

  // Determine persona from tags (returns localized object)
  determine(tags, isZh) {
    if (isZh === undefined) isZh = (window._i18n?.current === 'zh');
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

    const p = bestPersona || this.types[0];
    return {
      ...p,
      name: isZh ? (p.nameZh || p.name) : p.name,
      tagline: isZh ? (p.taglineZh || p.tagline) : p.tagline
    };
  }
};
