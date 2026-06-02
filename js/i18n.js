// i18n.js — Interest OS Language System v2
// More robust: self-contained init, cache-busted

(function() {
  var I = window.INTEREST_OS || {};
  if (!I.utils) I.utils = { save: function(){}, load: function(){} };

  var dict = {
    "nav.about": { zh: "关于", en: "about" },
    "nav.github": { zh: "github", en: "github" },
    "nav.share": { zh: "分享", en: "Share" },
    "nav.step": { zh: "步骤", en: "step" },

    "home.badge": { zh: "兴趣画像可视化平台 · v0.1.0", en: "interest visualization · v0.1.0" },
    "home.title1": { zh: "算法认识你", en: "Algorithm sees you." },
    "home.title2": { zh: "你认识算法吗？", en: "Do you see algorithm?" },
    "home.terminal1": { zh: "上传你的观看记录", en: "upload your watch history" },
    "home.terminal2": { zh: "AI 解析你的兴趣基因", en: "AI parses your interest DNA" },
    "home.terminal3": { zh: "星系图谱可视化呈现", en: "Visualize as a galaxy map" },
    "home.terminal4": { zh: "看见算法眼中的自己", en: "See yourself through algorithm" },
    "home.cta1": { zh: "开始分析", en: "Start Analysis" },
    "home.cta2": { zh: "先用演示数据体验", en: "Try Demo Data" },
    "home.privacy": { zh: "不上传服务器 · 不注册账号 · 不存储数据", en: "No upload · No account · No storage" },

    "feat1.title": { zh: "上传观看记录", en: "Upload History" },
    "feat1.desc": { zh: "支持 YouTube、B站、TikTok 等平台。JSON、CSV 或纯文本，最多 200 条。", en: "Drop YouTube, Bilibili, or TikTok history. JSON, CSV, or plain text. Max 200." },
    "feat2.title": { zh: "AI 智能分析", en: "AI Parsing" },
    "feat2.desc": { zh: "关键词引擎提取兴趣标签、权重和分类。完全在浏览器本地运行。", en: "Keyword engine extracts tags, weights, categories. Runs locally." },
    "feat3.title": { zh: "星系图谱", en: "Galaxy View" },
    "feat3.desc": { zh: "交互式力导向图。每颗星球 = 一个兴趣。大小 = 权重。距离 = 关联度。", en: "Interactive force graph. Planet = interest. Size = weight. Distance = relation." },
    "feat4.title": { zh: "编辑与调整", en: "Edit & Refine" },
    "feat4.desc": { zh: "不同意 AI 的判断？增删标签、调整权重。你说了算。", en: "Disagree with AI? Add, remove, reweight. You decide." },
    "feat5.title": { zh: "信息茧房指数", en: "Echo Chamber Score" },
    "feat5.desc": { zh: "查看你的信息多样性。是否困在过滤气泡里？数据不会说谎。", en: "See diversity score. Trapped in a filter bubble?" },
    "feat6.title": { zh: "分享数字人格", en: "Share Card" },
    "feat6.desc": { zh: "生成人格卡片。下载 PNG。发到朋友圈。让世界看到算法眼中的你。", en: "Generate persona card. Download as PNG. Share anywhere." },

    "trust.1": { zh: "不上传服务器", en: "No server upload" },
    "trust.2": { zh: "不注册账号", en: "No account needed" },
    "trust.3": { zh: "不存储数据", en: "No data stored" },
    "trust.4": { zh: "完全免费", en: "100% free" },

    "footer": { zh: "看见算法眼中的自己", en: "see yourself through the algorithm" },

    "upload.heading": { zh: "导入观看记录", en: "Upload Your Data" },
    "upload.subtitle": { zh: "支持所有平台：YouTube、B站、TikTok、抖音。", en: "Any platform: YouTube, Bilibili, TikTok, Douyin." },
    "upload.tab1": { zh: "文件上传", en: "File Upload" },
    "upload.tab2": { zh: "粘贴文本", en: "Paste Text" },
    "upload.tab3": { zh: "不知道怎么导出？", en: "How to Export?" },
    "upload.drop_text": { zh: "拖拽文件到此处", en: "Drop file here" },
    "upload.drop_hint": { zh: ".json .csv .txt（任意平台） · 最多 200 条", en: ".json .csv .txt (any platform) · up to 200" },
    "upload.parse_btn": { zh: "解析文本", en: "Parse Text" },
    "upload.success": { zh: "解析成功", en: "Parse successful" },
    "upload.analyze_summary": { zh: "AI 分析结果", en: "AI Analysis Results" },
    "upload.top_tags": { zh: "你的主要兴趣", en: "Your Top Interests" },
    "upload.view_galaxy": { zh: "查看星系图谱", en: "View Galaxy Map" },
    "upload.new_analysis": { zh: "重新分析", en: "New Analysis" },
    "upload.records": { zh: "识别到", en: "Records: " },
    "upload.source_label": { zh: "来源: ", en: "Source: " },

    "help.yt_title": { zh: "YouTube 导出方法", en: "YouTube Takeout" },
    "help.yt_1": { zh: "访问 Google Takeout", en: "Visit takeout.google.com" },
    "help.yt_2": { zh: "选择 YouTube 和 YouTube Music", en: "Select YouTube and YouTube Music" },
    "help.yt_3": { zh: "仅勾选历史记录 → 导出 JSON", en: "Check history → Export as JSON" },
    "help.yt_4": { zh: "下载后上传到本页面", en: "Download and upload here" },
    "help.tt_title": { zh: "TikTok / 抖音 导出方法", en: "TikTok / Douyin" },
    "help.tt_1": { zh: "TikTok：设置 → 隐私 → 下载你的数据 → JSON", en: "TikTok: Settings → Privacy → Download data → JSON" },
    "help.tt_2": { zh: "抖音：我 → 菜单 → 隐私设置 → 个人信息下载", en: "Douyin: Profile → Menu → Privacy → Download data" },
    "help.tt_3": { zh: "下载后上传 JSON，或粘贴标题", en: "Upload JSON, or paste titles" },
    "help.bl_title": { zh: "B站 导出方法", en: "Bilibili" },
    "help.bl_1": { zh: "打开 B站 → 历史记录页面", en: "Go to History page" },
    "help.bl_2": { zh: "逐页复制视频标题", en: "Copy titles manually" },
    "help.bl_3": { zh: "粘贴到粘贴文本标签页", en: "Paste in Paste Text tab" },

    "graph.tag_placeholder": { zh: "点击星球查看详情", en: "Click a planet to see details" },
    "graph.echo": { zh: "茧房指数", en: "Echo Chamber" },
    "graph.diversity": { zh: "多样性", en: "Diversity" },
    "graph.persona": { zh: "人格类型", en: "Persona" },
    "graph.edit_btn": { zh: "编辑标签", en: "Edit Tags" },
    "graph.share_btn": { zh: "生成分享卡片", en: "Generate Card" },
    "graph.new_analysis": { zh: "重新分析", en: "New Analysis" },
    "graph.weight": { zh: "权重", en: "Weight" },
    "graph.category": { zh: "分类", en: "Category" },
    "graph.related": { zh: "关联兴趣", en: "Related" },
    "graph.source": { zh: "来源视频", en: "Source Videos" },
    "graph.edited": { zh: "用户已编辑", en: "User edited" },
    "graph.edit_title": { zh: "编辑兴趣标签", en: "edit_tags" },
    "graph.add_placeholder": { zh: "新标签名称", en: "new tag name" },
    "graph.add_btn": { zh: "添加", en: "Add" },
    "graph.save": { zh: "保存", en: "Save" },
    "graph.cancel": { zh: "取消", en: "Cancel" },

    "share.heading": { zh: "你的数字人格", en: "Your Digital Persona" },
    "share.subtitle": { zh: "长按保存图片，分享给你的朋友", en: "Download image, share anywhere." },
    "share.download": { zh: "保存图片", en: "Save Image" },
    "share.copy": { zh: "复制链接", en: "Copy Link" },
    "share.copy_link": { zh: "复制链接", en: "Copy Link" },
    "share.copied": { zh: "链接已复制！", en: "Link copied!" },
    "share.persona_label": { zh: "你 的 算 法 人 格", en: "YOUR ALGORITHM PERSONA" },
    "share.no_data": { zh: "还没有用真实数据分析？", en: "No real data yet?" },
    "share.analyze_real": { zh: "用真实数据分析自己", en: "Analyze Your Real Data" },

    "analyze.status_parse": { zh: "解析兴趣标签...", en: "Parsing interest tags..." },
    "analyze.status_weight": { zh: "计算兴趣权重...", en: "Calculating weights..." },
    "analyze.status_relation": { zh: "分析兴趣关联...", en: "Analyzing relations..." },
    "analyze.status_echo": { zh: "评估信息茧房...", en: "Measuring echo chamber..." },
    "analyze.status_persona": { zh: "生成数字人格...", en: "Generating persona..." },
    "analyze.status_galaxy": { zh: "构建星系图谱...", en: "Building galaxy..." },
    "analyze.done": { zh: "兴趣星系已形成", en: "Your galaxy is ready" },
    "analyze.redirect": { zh: "即将进入星系图谱...", en: "Entering galaxy view..." },

    "misc.loading": { zh: "加载中...", en: "Loading..." },
    "misc.error": { zh: "加载失败，请重试", en: "Failed. Try again." }
  };

  var current = "en";

  function t(key) {
    var entry = dict[key];
    if (!entry) return key;
    return entry[current] || entry["en"] || key;
  }

  function applyAll() {
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute("data-i18n");
      var text = t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
    var btn = document.getElementById("langToggle");
    if (btn) btn.textContent = current === "zh" ? "EN" : "中";
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: current } }));
  }

  function setLang(lang) {
    current = lang;
    try { localStorage.setItem("interest_os_lang", lang); } catch(e) {}
    applyAll();
  }

  function toggle() {
    setLang(current === "zh" ? "en" : "zh");
  }

  // Init
  function init() {
    try {
      var saved = localStorage.getItem("interest_os_lang");
      if (saved === "en" || saved === "zh") current = saved;
    } catch(e) {}
    applyAll();
    var btn = document.getElementById("langToggle");
    if (btn) btn.onclick = toggle;
  }

  // Export
  window._i18n = { t: t, setLang: setLang, toggle: toggle, init: init, current: current };
  INTEREST_OS.i18n = { t: t, setLang: setLang, toggle: toggle, init: init };

  // Run immediately since script is at bottom of body
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
