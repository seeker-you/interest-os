// tagcloud.js - D3 Tag Cloud Visualization

INTEREST_OS.tagcloud = {

  init(containerSelector, tags, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = '';

    const W = container.clientWidth;
    const H = container.clientHeight;
    const onTagClick = options.onTagClick || null;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', W)
      .attr('height', H)
      .attr('viewBox', [0, 0, W, H]);

    const maxWeight = Math.max(...tags.map(t => t.weight), 1);

    // Create word positions using spiral layout
    const placed = [];
    const fontSize = d => 12 + (d.weight / maxWeight) * 40;

    // Sort by weight descending
    const sorted = [...tags].sort((a, b) => b.weight - a.weight);

    sorted.forEach(tag => {
      const fs = fontSize(tag);
      const textW = tag.name.length * fs * 0.6;
      const textH = fs * 1.3;
      const padding = 4;

      // Spiral placement
      let placed_success = false;
      for (let angle = 0; angle < 360 * 3; angle += 5) {
        const rad = angle * Math.PI / 180;
        const r = angle * 0.6;
        const cx = W / 2 + r * Math.cos(rad);
        const cy = H / 2 + r * Math.sin(rad);

        // Check overlap
        const box = {
          x: cx - textW / 2 - padding,
          y: cy - textH / 2 - padding,
          w: textW + padding * 2,
          h: textH + padding * 2
        };

        if (box.x < 10 || box.y < 10 || box.x + box.w > W - 10 || box.y + box.h > H - 10) continue;

        let overlaps = false;
        for (const p of placed) {
          if (!(box.x + box.w < p.x || p.x + p.w < box.x ||
                box.y + box.h < p.y || p.y + p.h < box.y)) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          placed.push(box);

          const textEl = svg.append('text')
            .attr('x', cx)
            .attr('y', cy)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', tag.color)
            .attr('font-size', fs)
            .attr('font-weight', d => tag.weight > 50 ? '700' : '500')
            .attr('font-family', 'Inter, sans-serif')
            .attr('cursor', 'pointer')
            .attr('opacity', 0.85)
            .text(tag.name)
            .on('click', () => { if (onTagClick) onTagClick(tag); })
            .on('mouseenter', function() {
              d3.select(this).attr('opacity', 1).attr('fill', '#FFF');
            })
            .on('mouseleave', function() {
              d3.select(this).attr('opacity', 0.85).attr('fill', tag.color);
            });

          placed_success = true;
          break;
        }
      }
    });
  }
};
