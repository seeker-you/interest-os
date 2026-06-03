// classifier.js — Interest Classification Engine (18 Categories)
// Pure keyword-based. Outputs category-level weights.
// AI receives these results and ONLY explains them — never creates them.

INTEREST_OS.classifier = {

  // 18 Interest Categories with Chinese keywords
  categories: {
    "美食": [
      "美食", "做饭", "烹饪", "火锅", "烧烤", "探店", "咖啡", "奶茶",
      "烘焙", "甜品", "菜谱", "食材", "料理", "餐厅", "外卖", "小吃",
      "午饭", "晚餐", "早餐", "夜宵", "零食", "饮料", "厨房", "厨艺",
      "吃播", "吃货", "美味", "下厨", "煮饭", "炒菜", "煲汤"
    ],
    "游戏": [
      "游戏", "原神", "王者荣耀", "黑神话", "Steam", "3A", "3A大作",
      "独立游戏", "主机", "PS5", "Switch", "Xbox", "通关", "攻略",
      "电竞", "LOL", "英雄联盟", "RPG", "开放世界", "魂系",
      "艾尔登法环", "塞尔达", "宝可梦", "崩坏", "星穹铁道", "绝区零",
      "老头环", "赛博朋克2077", "博德之门", "幻兽帕鲁", "我的世界",
      "Minecraft", "游戏机", "任天堂", "手柄", "显卡", "帧率"
    ],
    "科技": [
      "科技", "技术", "数码", "手机", "电脑", "笔记本", "硬件", "芯片",
      "处理器", "苹果", "华为", "三星", "小米", "评测", "开箱",
      "智能", "物联网", "5G", "6G", "VR", "AR", "可穿戴", "无人机",
      "电池", "屏幕", "相机", "摄影", "耳机", "音响", "智能家居",
      "NAS", "路由器", "显示器", "机械键盘"
    ],
    "AI": [
      "AI", "人工智能", "机器学习", "深度学习", "ChatGPT", "GPT", "GPT-4",
      "大模型", "LLM", "OpenAI", "Claude", "Gemini", "Copilot",
      "神经网络", "自然语言处理", "计算机视觉", "强化学习", "Transformer",
      "Prompt", "提示词", "AI Agent", "智能体", "具身智能",
      "自动驾驶", "机器人", "Stable Diffusion", "Midjourney", "Sora",
      "AGI", "DeepSeek", "AI绘画", "AI编程"
    ],
    "创业": [
      "创业", "Startup", "融资", "商业模式", "产品经理", "创业故事",
      "独角兽", "YC", "孵化器", "创始人", "CEO", "营销", "增长",
      "SaaS", "副业", "自由职业", "搞钱", "赚钱", "生意", "商业思维",
      "创业经验", "创业公司", "投资人", "BP", "商业计划书"
    ],
    "财经": [
      "财经", "股票", "基金", "投资", "理财", "比特币", "区块链",
      "经济", "市场", "A股", "美股", "港股", "房地产", "保险", "税务",
      "财务自由", "退休", "通货膨胀", "利率", "美元", "黄金", "外汇",
      "牛市", "熊市", "定投", "指数", "纳斯达克", "标普"
    ],
    "历史": [
      "历史", "古代", "近代", "战争", "帝国", "王朝", "文明",
      "考古", "文物", "博物馆", "秦始皇", "汉朝", "唐朝", "宋朝",
      "明朝", "清朝", "三国", "二战", "冷战", "历史人物", "历史故事",
      "历史科普", "历史解说", "古装", "上下五千年"
    ],
    "旅游": [
      "旅游", "旅行", "景点", "酒店", "机票", "签证", "自驾",
      "背包客", "攻略", "游记", "目的地", "风景", "打卡", "度假",
      "民宿", "出国", "国内游", "自由行", "旅游Vlog", "环游世界",
      "穷游", "自驾游", "徒步", "露营"
    ],
    "教育": [
      "教育", "学习", "课程", "教程", "教学", "老师", "学生",
      "考试", "高考", "考研", "留学", "语言", "英语", "日语",
      "数学", "物理", "化学", "生物", "在线教育", "知识", "科普",
      "读书", "阅读", "书评", "TED", "可汗学院", "大学", "专业"
    ],
    "心理学": [
      "心理学", "心理", "性格", "人格", "MBTI", "情绪", "焦虑",
      "抑郁", "压力", "冥想", "正念", "心理咨询", "认知", "行为",
      "潜意识", "原生家庭", "依恋", "自尊", "自我成长", "情商",
      "心理测试", "人格测试", "精神分析", "荣格", "弗洛伊德"
    ],
    "情感": [
      "情感", "爱情", "恋爱", "婚姻", "分手", "暧昧", "关系",
      "相亲", "约会", "情侣", "夫妻", "家庭", "亲情", "友情",
      "社交", "孤独", "治愈", "温暖", "感人", "催泪", "失恋",
      "复合", "暗恋", "表白"
    ],
    "健身": [
      "健身", "运动", "跑步", "游泳", "瑜伽", "力量训练", "有氧",
      "减脂", "增肌", "减肥", "塑形", "健身房", "马拉松",
      "拉伸", "普拉提", "拳击", "搏击", "体能", "HIIT", "深蹲",
      "卧推", "引体向上", "蛋白质", "增肌餐"
    ],
    "汽车": [
      "汽车", "车", "买车", "试驾", "评测", "电动车", "新能源",
      "特斯拉", "比亚迪", "蔚来", "小鹏", "理想", "燃油车",
      "发动机", "变速箱", "二手车", "改装", "赛车", "F1",
      "越野", "SUV", "轿车", "MPV", "充电", "续航"
    ],
    "宠物": [
      "宠物", "猫", "狗", "猫咪", "狗狗", "养猫", "养狗",
      "宠物用品", "宠物粮", "遛狗", "撸猫", "宠物医院", "宠物美容",
      "金毛", "哈士奇", "英短", "美短", "布偶", "橘猫",
      "仓鼠", "兔子", "鹦鹉", "猫粮", "狗粮"
    ],
    "音乐": [
      "音乐", "歌曲", "歌手", "专辑", "演唱会", "翻唱", "演奏",
      "乐器", "钢琴", "吉他", "编曲", "电子音乐", "说唱", "嘻哈",
      "摇滚", "爵士", "古典", "流行", "民谣", "K-pop", "华语",
      "欧美", "JPOP", "Vocaloid", "初音未来", "作曲", "作词"
    ],
    "影视": [
      "电影", "电视剧", "动漫", "动画", "番剧", "Netflix",
      "影评", "解说", "漫威", "DC", "好莱坞", "国产剧", "韩剧",
      "日剧", "纪录片", "综艺", "选秀", "脱口秀", "相声",
      "追剧", "美剧", "英剧", "悬疑", "科幻", "喜剧"
    ],
    "搞笑": [
      "搞笑", "幽默", "段子", "笑话", "喜剧", "沙雕", "鬼畜",
      "整活", "恶搞", "趣闻", "搞笑视频", "滑稽", "吐槽", "梗",
      "meme", "哈哈哈", "笑死", "翻车", "名场面", "模仿"
    ]
  },

  // Map new categories to old persona categories
  personaCategoryMap: {
    "美食": "生活/日常",
    "游戏": "游戏",
    "科技": "科技/AI",
    "AI": "科技/AI",
    "创业": "财经/商业",
    "财经": "财经/商业",
    "历史": "知识/教育",
    "旅游": "生活/日常",
    "教育": "知识/教育",
    "心理学": "知识/教育",
    "情感": "时尚/娱乐",
    "健身": "生活/日常",
    "汽车": "科技/AI",
    "宠物": "生活/日常",
    "音乐": "音乐",
    "影视": "影视/动漫",
    "搞笑": "时尚/娱乐"
  },

  // English display names
  categoryNamesEn: {
    "美食": "Food",
    "游戏": "Gaming",
    "科技": "Technology",
    "AI": "AI",
    "创业": "Startup",
    "财经": "Finance",
    "历史": "History",
    "旅游": "Travel",
    "教育": "Education",
    "心理学": "Psychology",
    "情感": "Relationship",
    "健身": "Fitness",
    "汽车": "Auto",
    "宠物": "Pet",
    "音乐": "Music",
    "影视": "Film & TV",
    "搞笑": "Comedy"
  },

  // ─── Main classification ───
  // Returns category-level weights (percentages, sum to 100)
  classify: function(titles) {
    if (!titles || !titles.length) {
      return this._emptyResult();
    }

    var categoryCounts = {};   // { categoryName: matchCount }
    var keywordMatches = {};   // { categoryName: { keyword: count } }
    var matchedTitleIndices = new Set();

    // Initialize counts
    var allCategories = Object.keys(this.categories);
    allCategories.forEach(function(cat) {
      categoryCounts[cat] = 0;
      keywordMatches[cat] = {};
    });

    // Match each keyword in each category against all titles
    for (var ci = 0; ci < allCategories.length; ci++) {
      var cat = allCategories[ci];
      var keywords = this.categories[cat];

      for (var ki = 0; ki < keywords.length; ki++) {
        var kw = keywords[ki];
        var kwLower = kw.toLowerCase();

        // Count matching titles for this keyword
        for (var ti = 0; ti < titles.length; ti++) {
          var titleLower = titles[ti].toLowerCase();
          if (titleLower.includes(kwLower)) {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            keywordMatches[cat][kw] = (keywordMatches[cat][kw] || 0) + 1;
            matchedTitleIndices.add(ti);
          }
        }
      }
    }

    // Deduplicate: a title matching multiple keywords in the same category
    // should only count once per category. But since the user wants
    // weighted scoring, multiple keyword hits increase the category score.
    // Normalize by total matches across all categories.

    var totalMatchCount = 0;
    allCategories.forEach(function(cat) {
      totalMatchCount += categoryCounts[cat] || 0;
    });

    // Calculate percentage weights
    var totalTitles = titles.length;
    var matchedTitleCount = matchedTitleIndices.size;
    var categoryWeights = {};
    var results = [];

    allCategories.forEach(function(cat) {
      var rawCount = categoryCounts[cat] || 0;
      var pct = totalMatchCount > 0
        ? Math.round(rawCount / totalMatchCount * 100)
        : 0;
      categoryWeights[cat] = pct;

      if (rawCount > 0) {
        results.push({
          name: cat,
          nameEn: INTEREST_OS.classifier.categoryNamesEn[cat] || cat,
          matchCount: rawCount,
          weight: pct,
          uniqueKeywords: Object.keys(keywordMatches[cat]).length,
          personaCategory: INTEREST_OS.classifier.personaCategoryMap[cat] || "其他"
        });
      }
    });

    // Sort by weight descending
    results.sort(function(a, b) { return b.weight - a.weight; });

    return {
      categoryWeights: categoryWeights,    // { "美食": 68, "游戏": 12, ... }
      results: results,                     // sorted array of { name, nameEn, matchCount, weight, ... }
      totalTitles: totalTitles,
      matchedTitleCount: matchedTitleCount,
      matchRate: totalTitles > 0 ? Math.round(matchedTitleCount / totalTitles * 100) : 0,
      totalMatches: totalMatchCount
    };
  },

  // ─── Build persona-compatible weights ───
  // Maps the 18 new categories to the 10 old persona categories
  toPersonaWeights: function(categoryWeights) {
    var personaWeights = {};
    var self = this;
    Object.keys(categoryWeights).forEach(function(cat) {
      var mapped = self.personaCategoryMap[cat] || "其他";
      personaWeights[mapped] = (personaWeights[mapped] || 0) + (categoryWeights[cat] || 0);
    });
    return personaWeights;
  },

  // ─── Generate top tags from categories ───
  toTags: function(classifyResult, colorPalette) {
    var palette = colorPalette || ['#00E5FF','#00FF88','#FFB800','#FF4D6A','#3B82F6','#A855F7','#EC4899','#14B8A6','#F97316','#84CC16','#6366f1','#22c55e','#eab308','#f43f5e','#d946ef','#06b6d4','#f97316','#10b981'];
    var tags = [];

    (classifyResult.results || []).forEach(function(r, i) {
      if (r.weight > 0) {
        tags.push({
          id: INTEREST_OS.utils.uid(),
          name: r.nameEn,
          weight: r.weight,
          category: r.personaCategory,
          color: palette[i % palette.length],
          relatedTags: [],
          sourceTitles: [],
          isUserEdited: false,
          _originalCategory: r.name
        });
      }
    });

    return tags;
  },

  _emptyResult: function() {
    var emptyWeights = {};
    Object.keys(this.categories).forEach(function(c) { emptyWeights[c] = 0; });
    return {
      categoryWeights: emptyWeights,
      results: [],
      totalTitles: 0,
      matchedTitleCount: 0,
      matchRate: 0,
      totalMatches: 0
    };
  }
};
