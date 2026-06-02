// radar.js - Chart.js Radar Chart

INTEREST_OS.radar = {
  chart: null,

  init(containerSelector, tags) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    if (this.chart) this.chart.destroy();

    // Aggregate by category
    const catWeights = {};
    tags.forEach(t => {
      catWeights[t.category] = (catWeights[t.category] || 0) + t.weight;
    });

    const categories = Object.keys(catWeights);
    const isZh = (window._i18n?.current === 'zh');
    const catLabels = categories.map(function(c) { return INTEREST_OS.utils.getCategoryName(c, isZh); });
    const values = categories.map(function(c) { return Math.min(100, catWeights[c]); });

    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: catLabels,
        datasets: [{
          label: (window._i18n?.current === 'zh') ? '兴趣分布' : 'Interest Distribution',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderColor: '#6366F1',
          borderWidth: 2,
          pointBackgroundColor: values.map((_, i) =>
            ['#6366F1','#8B5CF6','#EC4899','#3B82F6','#14B8A6',
             '#F59E0B','#EF4444','#22C55E','#A855F7','#06B6D4'][i % 10]
          ),
          pointBorderColor: '#FFF',
          pointBorderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              display: false,
              stepSize: 20
            },
            grid: {
              color: 'rgba(255,255,255,0.06)'
            },
            angleLines: {
              color: 'rgba(255,255,255,0.06)'
            },
            pointLabels: {
              color: '#A1A1AA',
              font: { family: 'Inter, sans-serif', size: 12 }
            }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  },

  destroy() {
    if (this.chart) { this.chart.destroy(); this.chart = null; }
  }
};
