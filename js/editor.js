// editor.js - Tag Editor Panel

INTEREST_OS.editor = {
  overlay: null,
  onSave: null,
  tags: [],

  init(onSaveCallback) {
    this.onSave = onSaveCallback;
    this._ensureOverlay();
  },

  _ensureOverlay() {
    if (document.querySelector('.edit-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.innerHTML = 
      <div class="edit-panel glass glass-xl">
        <h3>✏️ 编辑兴趣标签</h3>
        <div class="edit-list"></div>
        <div class="edit-add-row">
          <input type="text" class="glass-input add-tag-name" placeholder="新标签名称" />
          <input type="number" class="glass-input add-tag-weight" placeholder="权重" min="1" max="100" style="width:80px" />
          <button class="btn btn-primary btn-sm add-tag-btn">添加</button>
        </div>
        <div class="flex-center gap-2">
          <button class="btn btn-primary save-btn">保存</button>
          <button class="btn btn-secondary cancel-btn">取消</button>
        </div>
      </div>
    ;
    document.body.appendChild(overlay);

    overlay.querySelector('.cancel-btn').onclick = () => this.close();
    overlay.querySelector('.save-btn').onclick = () => this._save();
    overlay.querySelector('.add-tag-btn').onclick = () => this._addTag();
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    this.overlay = overlay;
  },

  open(tags) {
    this.tags = JSON.parse(JSON.stringify(tags)); // deep clone
    this._render();
    this.overlay.classList.add('open');
  },

  close() {
    this.overlay.classList.remove('open');
  },

  _render() {
    const list = this.overlay.querySelector('.edit-list');
    const colors = ['#6366F1','#8B5CF6','#EC4899','#3B82F6','#14B8A6',
                    '#F59E0B','#EF4444','#22C55E','#A855F7','#06B6D4'];
    list.innerHTML = this.tags.map((t, i) => 
      <div class="edit-row" data-id="">
        <span class="edit-row-color" style="background:"></span>
        <input class="edit-row-name" value="" data-field="name" />
        <span class="edit-row-weight">
          <input type="number" value="" min="0" max="100" data-field="weight" />
        </span>
        <button class="edit-row-delete" title="删除">✕</button>
      </div>
    ).join('');

    // Event listeners
    list.querySelectorAll('.edit-row-delete').forEach(btn => {
      btn.onclick = (e) => {
        const row = e.target.closest('.edit-row');
        const id = row.dataset.id;
        this.tags = this.tags.filter(t => t.id !== id);
        this._render();
      };
    });

    list.querySelectorAll('input[data-field]').forEach(input => {
      input.onchange = () => {
        const row = input.closest('.edit-row');
        const id = row.dataset.id;
        const tag = this.tags.find(t => t.id === id);
        if (!tag) return;
        const field = input.dataset.field;
        if (field === 'weight') {
          tag.weight = Math.max(0, Math.min(100, parseInt(input.value) || 0));
        } else if (field === 'name') {
          tag.name = input.value.trim();
        }
        tag.isUserEdited = true;
      };
    });
  },

  _addTag() {
    const nameInput = this.overlay.querySelector('.add-tag-name');
    const weightInput = this.overlay.querySelector('.add-tag-weight');
    const name = nameInput.value.trim();
    const weight = parseInt(weightInput.value) || 10;
    if (!name) return;

    const colors = ['#6366F1','#8B5CF6','#EC4899','#3B82F6','#14B8A6'];
    this.tags.push({
      id: INTEREST_OS.utils.uid(),
      name,
      weight: Math.min(100, Math.max(1, weight)),
      category: '其他',
      color: colors[Math.floor(Math.random() * colors.length)],
      relatedTags: [],
      sourceTitles: [],
      isUserEdited: true
    });
    nameInput.value = '';
    weightInput.value = '';
    this._render();
  },

  _save() {
    if (this.onSave) this.onSave(this.tags);
    this.close();
  },

  _esc(s) {
    return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;')
            .replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
