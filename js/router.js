// router.js - Page Navigation & Data Bridge

INTEREST_OS.router = {
  STORAGE_KEY: 'interest_os_data',

  // Navigate to another page
  go(url) {
    window.location.href = url;
  },

  // Go back
  back() {
    window.history.back();
  },

  // Store profile data for next page
  setData(profile) {
    INTEREST_OS.utils.save(this.STORAGE_KEY, profile);
  },

  // Get stored profile data
  getData() {
    return INTEREST_OS.utils.load(this.STORAGE_KEY);
  },

  // Clear stored data
  clearData() {
    INTEREST_OS.utils.remove(this.STORAGE_KEY);
  },

  // Check if there's stored data
  hasData() {
    return !!INTEREST_OS.utils.load(this.STORAGE_KEY);
  },

  // Load demo data from JSON
  async loadDemo() {
    try {
      const resp = await fetch('data/demo.json');
      if (!resp.ok) throw new Error('Failed to load demo');
      return await resp.json();
    } catch(e) {
      console.error('Load demo failed:', e);
      return null;
    }
  },

  // Init demo mode: load demo.json; store; navigate to graph page
  async startDemo() {
    const demo = await this.loadDemo();
    if (demo) {
      this.setData(demo);
      this.go('graph.html');
    } else {
      alert('演示数据加载失败，请刷新后重试');
    }
  }
};
