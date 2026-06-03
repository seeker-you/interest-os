// utils.js - Interest OS Utility Functions

const INTEREST_OS = window.INTEREST_OS || {};

INTEREST_OS.utils = {

  save: function(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch(e) { console.warn("localStorage save failed:", e); return false; }
  },

  load: function(key) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch(e) { console.warn("localStorage load failed:", e); return null; }
  },

  remove: function(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  },

  uid: function() {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  clamp: function(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  normalizeWeights: function(tags) {
    var total = 0;
    tags.forEach(function(t) { total += t.weight; });
    if (total === 0) return tags;
    return tags.map(function(t) {
      t.weight = Math.round(t.weight / total * 100);
      return t;
    });
  },

  debounce: function(fn, ms) {
    ms = ms || 200;
    var timer;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  },

  shuffle: function(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  },

  hexToRgba: function(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  },

  lightenHex: function(hex, amount) {
    var r = Math.min(255, parseInt(hex.slice(1,3), 16) + amount);
    var g = Math.min(255, parseInt(hex.slice(3,5), 16) + amount);
    var b = Math.min(255, parseInt(hex.slice(5,7), 16) + amount);
    return "#" + [r,g,b].map(function(c) { return c.toString(16).padStart(2,"0"); }).join("");
  },

  // Category name translation
  categoryNames: {
    "科技/AI": { zh: "科技/AI", en: "Tech/AI" },
    "编程/开发": { zh: "编程/开发", en: "Coding/Dev" },
    "游戏": { zh: "游戏", en: "Gaming" },
    "影视/动漫": { zh: "影视/动漫", en: "Film/Anime" },
    "音乐": { zh: "音乐", en: "Music" },
    "知识/教育": { zh: "知识/教育", en: "Knowledge/Education" },
    "生活/日常": { zh: "生活/日常", en: "Lifestyle" },
    "财经/商业": { zh: "财经/商业", en: "Finance/Business" },
    "体育": { zh: "体育", en: "Sports" },
    "时尚/娱乐": { zh: "时尚/娱乐", en: "Fashion/Entertainment" },
    "其他": { zh: "其他", en: "Other" },
    "Unknown": { zh: "未知", en: "Unknown" }
  },

  getCategoryName: function(cat, isZh) {
    if (isZh === undefined) isZh = (window._i18n?.current === 'zh');
    var entry = this.categoryNames[cat];
    if (!entry) return cat;
    return isZh ? entry.zh : entry.en;
  },

  // Keyword translation (Chinese→English for display)
  keywordTranslations: {
    // Tech/AI
    "人工智能": "Artificial Intelligence",
    "机器学习": "Machine Learning",
    "深度学习": "Deep Learning",
    "大模型": "Large Language Model",
    "神经网络": "Neural Network",
    "自然语言处理": "Natural Language Processing",
    "计算机视觉": "Computer Vision",
    "强化学习": "Reinforcement Learning",
    "提示词": "Prompt Engineering",
    "智能体": "AI Agent",
    "具身智能": "Embodied Intelligence",
    "自动驾驶": "Autonomous Driving",
    "机器人": "Robotics",
    // Coding/Dev
    "编程": "Programming",
    "代码": "Code",
    "前端": "Frontend",
    "后端": "Backend",
    "全栈": "Full Stack",
    "开发": "Development",
    "程序员": "Developer",
    "框架": "Framework",
    "数据库": "Database",
    "开源": "Open Source",
    "算法": "Algorithm",
    "数据结构": "Data Structures",
    "面试": "Interview",
    "系统设计": "System Design",
    "微服务": "Microservices",
    // Gaming
    "游戏": "Gaming",
    "王者荣耀": "Honor of Kings",
    "黑神话": "Black Myth",
    "独立游戏": "Indie Games",
    "主机": "Console",
    "通关": "Walkthrough",
    "攻略": "Guide",
    "电竞": "Esports",
    "英雄联盟": "League of Legends",
    "开放世界": "Open World",
    "艾尔登法环": "Elden Ring",
    "塞尔达": "Zelda",
    "宝可梦": "Pokemon",
    "崩坏": "Honkai",
    "星穹铁道": "Star Rail",
    "绝区零": "Zenless Zone Zero",
    "老头环": "Elden Ring",
    "赛博朋克2077": "Cyberpunk 2077",
    "博德之门": "Baldur's Gate",
    "幻兽帕鲁": "Palworld",
    "我的世界": "Minecraft",
    // Film/Anime
    "电影": "Film",
    "电视剧": "TV Series",
    "番剧": "Anime Series",
    "动漫": "Anime",
    "动画": "Animation",
    "新番": "New Anime",
    "影评": "Review",
    "剧情": "Story",
    "解说": "Commentary",
    "三体": "Three Body",
    "流浪地球": "The Wandering Earth",
    "奥本海默": "Oppenheimer",
    "沙丘": "Dune",
    "阿凡达": "Avatar",
    "进击的巨人": "Attack on Titan",
    "咒术回战": "Jujutsu Kaisen",
    "鬼灭之刃": "Demon Slayer",
    "间谍过家家": "Spy x Family",
    "葬送的芙莉莲": "Frieren",
    "我推的孩子": "Oshi no Ko",
    "漫威": "Marvel",
    "好莱坞": "Hollywood",
    "国产剧": "Chinese Drama",
    "韩剧": "K-Drama",
    // Music
    "音乐": "Music",
    "歌曲": "Song",
    "翻唱": "Cover",
    "演奏": "Performance",
    "钢琴": "Piano",
    "吉他": "Guitar",
    "编曲": "Arrangement",
    "电子音乐": "Electronic Music",
    "说唱": "Rap",
    "嘻哈": "Hip-Hop",
    "摇滚": "Rock",
    "爵士": "Jazz",
    "古典": "Classical",
    "混音": "Mixing",
    "音乐制作": "Music Production",
    "演唱会": "Concert",
    "现场": "Live",
    "初音未来": "Hatsune Miku",
    // Knowledge/Education
    "教程": "Tutorial",
    "课程": "Course",
    "学习": "Learning",
    "入门": "Beginner",
    "教学": "Teaching",
    "科普": "Science",
    "知识": "Knowledge",
    "数学": "Mathematics",
    "物理": "Physics",
    "化学": "Chemistry",
    "生物": "Biology",
    "历史": "History",
    "哲学": "Philosophy",
    "经济": "Economics",
    "心理学": "Psychology",
    "社会学": "Sociology",
    "量子": "Quantum",
    "相对论": "Relativity",
    "进化论": "Evolution",
    "可汗学院": "Khan Academy",
    "纪录片": "Documentary",
    "读书": "Reading",
    "书评": "Book Review",
    "阅读": "Reading",
    "英语": "English",
    "语言学习": "Language Learning",
    // Lifestyle
    "日常": "Daily Life",
    "生活": "Lifestyle",
    "美食": "Food",
    "做饭": "Cooking",
    "烹饪": "Cooking",
    "探店": "Food Review",
    "旅行": "Travel",
    "健身": "Fitness",
    "运动": "Sports",
    "穿搭": "Fashion",
    "美妆": "Beauty",
    "护肤": "Skincare",
    "家居": "Home",
    "装修": "Renovation",
    "极简": "Minimalism",
    "效率": "Productivity",
    "手帐": "Journaling",
    "文具": "Stationery",
    // Finance/Business
    "财经": "Finance",
    "商业": "Business",
    "投资": "Investment",
    "股票": "Stocks",
    "基金": "Funds",
    "创业": "Startup",
    "区块链": "Blockchain",
    "比特币": "Bitcoin",
    "Web3": "Web3",
    "财报": "Earnings Report",
    "宏观": "Macroeconomics",
    // Sports
    "体育": "Sports",
    "足球": "Soccer",
    "篮球": "Basketball",
    "NBA": "NBA",
    "英超": "Premier League",
    "欧冠": "UEFA Champions League",
    "奥运会": "Olympics",
    // Fashion/Entertainment
    "时尚": "Fashion",
    "娱乐": "Entertainment",
    "综艺": "Variety Show",
    "选秀": "Talent Show",
    "真人秀": "Reality Show",
    "潮流": "Trends",
    "穿搭": "Style",
    "美妆": "Makeup",
    "护肤": "Skincare",
    // Synonyms (from pipeline.js synonym groups)
    "具身": "Embodied",
    "3A大作": "AAA Games",
    "魂系": "Souls-like",
    "MAD": "MAD AMV",
    "鬼畜": "Meme Remix",
    "Vocaloid": "Vocaloid",
    "LOL": "LOL",
    "PS5": "PS5",
    "Switch": "Switch",
    "脱口秀": "Stand-up Comedy",
    "纪录片": "Documentary",
    "Vlog": "Vlog"
  },

  translateKeyword: function(kw, isZh) {
    if (isZh === undefined) isZh = (window._i18n?.current === 'zh');
    if (!isZh && this.keywordTranslations[kw]) return this.keywordTranslations[kw];
    return kw;
  }
};

// User Profile Manager (used across all pages)
INTEREST_OS.userProfile = {
  USER_KEY: 'interest_os_user',
  AVATARS: ['🧑‍💻', '👨‍💻', '👩‍💻', '🎮', '🎨', '🚀', '🧠', '🎧', '📸', '🌌', '⚡', '🦊'],

  load: function() {
    try { var raw = localStorage.getItem(this.USER_KEY); return raw ? JSON.parse(raw) : null; }
    catch(e) { return null; }
  },

  save: function(data) {
    try { localStorage.setItem(this.USER_KEY, JSON.stringify(data)); return true; }
    catch(e) { return false; }
  },

  get: function() {
    var p = this.load();
    return p || { username: 'Anonymous', avatar: '🧑‍💻' };
  },

  edit: function() {
    var body = document.getElementById('userProfileBody');
    var done = document.getElementById('userProfileDone');
    if (body) body.style.display = '';
    if (done) done.style.display = 'none';
  }
};
