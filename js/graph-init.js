// graph-init.js - Interest OS Graph Page Controller

(function() {
  var profile = INTEREST_OS.router.getData();
  if (!profile || !profile.tags || profile.tags.length === 0) {
    INTEREST_OS.router.startDemo();
    return;
  }

  var tags = profile.tags.slice();
  var currentView = 'galaxy';

  // Update stats bar
  var analysis = profile.analysis || {};
  document.getElementById('echoIndex').textContent = (analysis.echoChamberIndex || '--') + '%';
  document.getElementById('diversityScore').textContent = (analysis.diversityScore || '--') + '%';
  document.getElementById('personaName').textContent = analysis.personaType || '--';

  // Render current view
  function renderView(view) {
    var container = document.getElementById('vizContainer');
    if (currentView === 'radar') INTEREST_OS.radar.destroy();
    if (currentView === 'galaxy') INTEREST_OS.galaxy.destroy();
    container.innerHTML = '';

    switch(view) {
      case 'galaxy':
        INTEREST_OS.galaxy.init('#vizContainer', tags, { onNodeClick: showTagDetail });
        break;
      case 'tagcloud':
        INTEREST_OS.tagcloud.init('#vizContainer', tags, { onTagClick: showTagDetail });
        break;
      case 'radar':
        INTEREST_OS.radar.init('#vizContainer', tags);
        break;
    }
    currentView = view;
  }

  function showTagDetail(tag) {
    var el = document.getElementById('tagDetail');
    if (!tag) {
      el.innerHTML = '<p class="text-sm text-[#71717A] text-center py-8">点击星系中的星球<br>查看兴趣详情</p>';
      return;
    }
    var sourceTitles = (tag.sourceTitles || []).slice(0, 5);
    var relatedHtml = '';
    if (tag.relatedTags && tag.relatedTags.length > 0) {
      relatedHtml = '<div><span class="text-[#71717A] text-xs">关联兴趣</span><div class="flex flex-wrap gap-1 mt-1">';
      tag.relatedTags.forEach(function(rid) {
        var rt = tags.find(function(t) { return t.id === rid; });
        if (rt) relatedHtml += '<span class="tag text-xs">' + escHtml(rt.name) + '</span>';
      });
      relatedHtml += '</div></div>';
    }

    var sourcesHtml = '';
    if (sourceTitles.length > 0) {
      sourcesHtml = '<div><span class="text-[#71717A] text-xs">来源视频</span><div class="text-xs text-[#A1A1AA] mt-1 space-y-0.5">';
      sourceTitles.forEach(function(t) { sourcesHtml += '<div>· ' + escHtml(t) + '</div>'; });
      sourcesHtml += '</div></div>';
    }

    el.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
      '<span class="w-3 h-3 rounded-full" style="background:' + tag.color + '"></span>' +
      '<h3 class="text-lg font-semibold">' + escHtml(tag.name) + '</h3></div>' +
      '<div class="space-y-3 text-sm">' +
      '<div class="flex justify-between"><span class="text-[#71717A]">权重</span><span class="text-gradient font-semibold">' + tag.weight + '%</span></div>' +
      '<div class="flex justify-between"><span class="text-[#71717A]">分类</span><span class="text-[#A1A1AA]">' + (tag.category || '-') + '</span></div>' +
      relatedHtml + sourcesHtml +
      (tag.isUserEdited ? '<div class="text-xs text-[#F59E0B] mt-2">✨ 用户已编辑</div>' : '') +
      '</div>';
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // View switcher
  document.querySelectorAll('.view-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.view-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderView(btn.dataset.view);
    });
  });

  // Edit button
  var editor = INTEREST_OS.editor;
  editor.init(function(newTags) {
    tags = newTags;
    profile.tags = newTags;
    var persona = INTEREST_OS.personas.determine(newTags);
    profile.analysis.personaType = persona.name;
    document.getElementById('personaName').textContent = persona.name;
    INTEREST_OS.router.setData(profile);
    renderView(currentView);
    showTagDetail(null);
  });

  document.getElementById('editBtn').addEventListener('click', function() {
    editor.open(tags);
  });

  // Initial render
  renderView('galaxy');

  // Resize
  window.addEventListener('resize', INTEREST_OS.utils.debounce(function() {
    renderView(currentView);
  }, 400));
})();
