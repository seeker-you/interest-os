// insights.js — Interest OS Analysis Insights
// MBTI mapping, persona descriptions, methodology explanation

INTEREST_OS.insights = {

  // Map interest category weights to MBTI-like type
  getMBTI: function(tags) {
    var catWeights = {};
    tags.forEach(function(t) {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });

    var total = 0;
    Object.keys(catWeights).forEach(function(k) { total += catWeights[k]; });
    if (total === 0) total = 1;

    var ai = (catWeights["科技/AI"] || 0) / total;
    var dev = (catWeights["编程/开发"] || 0) / total;
    var game = (catWeights["游戏"] || 0) / total;
    var media = (catWeights["影视/动漫"] || 0) / total;
    var music = (catWeights["音乐"] || 0) / total;
    var edu = (catWeights["知识/教育"] || 0) / total;
    var life = (catWeights["生活/日常"] || 0) / total;
    var biz = (catWeights["财经/商业"] || 0) / total;
    var sport = (catWeights["体育"] || 0) / total;
    var fashion = (catWeights["时尚/娱乐"] || 0) / total;

    var types = [
      {
        code: "INTP", name: "逻辑学家", emoji: "🧠",
        descZh: "你是一个被纯粹好奇心驱动的思考者。算法眼中的你沉迷于抽象概念和技术原理，对世界的运作方式有着近乎偏执的探索欲。你可能是那个深夜还在看技术论文的人。",
        descEn: "A pure curiosity-driven thinker. The algorithm sees you as someone obsessed with abstract concepts and technical principles, with an almost compulsive need to understand how things work.",
        match: ai + dev
      },
      {
        code: "INTJ", name: "建筑师", emoji: "🏗️",
        descZh: "你是算法世界里的战略家。你的兴趣高度集中在技术和商业的交叉点上——你不仅想知道技术如何运作，更想知道如何用它改变世界。你的观看记录暴露了你的野心。",
        descEn: "A strategist in the algorithm's world. Your interests sit at the intersection of tech and business — you want to know how tech works AND how to change the world with it.",
        match: (ai + dev + biz) / 1.5
      },
      {
        code: "ENTP", name: "辩论家", emoji: "⚡",
        descZh: "你是数字世界的探险家。你的兴趣广泛跳跃，从游戏到科技到哲学，算法难以将你归类。你享受在不同领域之间建立意想不到的连接。",
        descEn: "An explorer of the digital world. Your interests jump wildly from gaming to tech to philosophy — the algorithm struggles to categorize you. You enjoy making unexpected connections.",
        match: (game + dev + edu) / 1.5
      },
      {
        code: "ENFP", name: "竞选者", emoji: "🎨",
        descZh: "你是算法宇宙中的创意火花。影视、音乐、艺术构成了你的精神世界。你的观看记录像一部五彩斑斓的灵感日记，算法看到了你对美和故事的敏感。",
        descEn: "A creative spark in the algorithm's universe. Film, music, and art form your inner world. Your watch history reads like a colorful diary of inspiration.",
        match: media + music + fashion
      },
      {
        code: "ISTP", name: "鉴赏家", emoji: "🎮",
        descZh: "你是算法世界里的实战派。游戏和动手实践占据了你的大部分注意力。你不喜欢空谈理论，更愿意通过实际操作来理解事物。每个Boss都是你的老师。",
        descEn: "A hands-on practitioner in the algorithm's world. Gaming dominates your attention. You prefer learning by doing — every boss fight is a lesson.",
        match: game
      },
      {
        code: "INFJ", name: "提倡者", emoji: "🔮",
        descZh: "你是算法眼中的深度观察者。你对哲学、心理学和人类处境的兴趣远超常人。你的观看记录透露出一种安静但坚定的探索——你想理解人类本身。",
        descEn: "A deep observer in the algorithm's eyes. Your interest in philosophy, psychology, and the human condition sets you apart. Your history reveals a quiet but determined exploration.",
        match: edu
      },
      {
        code: "ESTP", name: "企业家", emoji: "💼",
        descZh: "你是算法眼中的行动派。商业、财经和创业内容占据了你的注意力。你不满足于消费内容，你更想知道如何创造价值。算法看到了一个未来的建造者。",
        descEn: "A doer in the algorithm's eyes. Business, finance, and entrepreneurship dominate your feed. You don't just consume — you want to create value.",
        match: biz + sport
      },
      {
        code: "ISFP", name: "探险家", emoji: "🌸",
        descZh: "你是算法世界里的生活美学家。美食、旅行、摄影、日常Vlog构成了你的数字足迹。你追求的是体验本身，而不是抽象的分析。",
        descEn: "A lifestyle aesthete in the algorithm's world. Food, travel, photography, and daily vlogs make up your digital footprint. You chase experiences, not abstractions.",
        match: life + fashion + music
      }
    ];

    var best = types[0];
    var bestScore = 0;
    types.forEach(function(t) {
      if (t.match > bestScore) { bestScore = t.match; best = t; }
    });

    return best;
  },

  // Generate methodology explanation
  getMethodology: function(isZh) {
    if (isZh) {
      return "分析原理：系统扫描你上传的视频标题，通过关键词匹配引擎（覆盖10大兴趣类别、200+关键词）提取兴趣标签。权重基于出现频率计算，关联度基于共现分析。所有分析在你浏览器本地完成，不上传任何数据。";
    }
    return "Methodology: The system scans your video titles through a keyword matching engine (10 categories, 200+ keywords) to extract interest tags. Weights are based on frequency, and relationships on co-occurrence. All analysis runs locally in your browser.";
  },

  // Echo chamber explanation
  getEchoChamberDesc: function(score, isZh) {
    if (isZh) {
      if (score < 30) return "你的信息源非常多元，几乎不存在信息茧房。你像一个数字世界的漫游者，在不同领域自由穿行。";
      if (score < 55) return "你的兴趣有一定集中度，但整体仍算健康。有一些主导领域，但并未完全封闭信息来源。";
      if (score < 80) return "你的注意力比较集中在少数几个领域，存在一定的信息茧房风险。建议偶尔探索舒适区之外的内容。";
      return "你的兴趣高度集中，算法可能已经为你构建了一个舒适但狭窄的信息茧房。你的世界也许比你想象的小。";
    }
    if (score < 30) return "Your information sources are highly diverse. Almost no echo chamber. You roam freely across domains like a digital nomad.";
    if (score < 55) return "Your interests have some concentration but remain healthy overall. Some dominant areas exist, but channels aren't fully closed.";
    if (score < 80) return "Your attention is clustered in a few areas. Echo chamber risk present. Try exploring beyond your comfort zone occasionally.";
    return "Highly concentrated interests. The algorithm may have built you a comfortable but narrow echo chamber. Your world might be smaller than you think.";
  }
};
