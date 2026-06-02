// galaxy.js - D3 Force-Directed Galaxy Visualization

INTEREST_OS.galaxy = {
  svg: null,
  simulation: null,
  nodes: [],
  links: [],
  onNodeClick: null,

  // Initialize the galaxy chart
  init(containerSelector, tags, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    this.onNodeClick = options.onNodeClick || null;

    // Clear previous
    container.innerHTML = '';

    const W = container.clientWidth;
    const H = container.clientHeight;

    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', W)
      .attr('height', H)
      .attr('viewBox', [0, 0, W, H]);

    // Defs for gradients & glow filters
    const defs = this.svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    filter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter().append('feMergeNode')
      .attr('in', d => d);

    // Star glow filter (bigger)
    const filter2 = defs.append('filter')
      .attr('id', 'starGlow')
      .attr('x', '-100%').attr('y', '-100%')
      .attr('width', '300%').attr('height', '300%');
    filter2.append('feGaussianBlur')
      .attr('stdDeviation', '8')
      .attr('result', 'blur');
    filter2.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter().append('feMergeNode')
      .attr('in', d => d);

    // Radial gradients for each tag
    tags.forEach(tag => {
      const grad = defs.append('radialGradient')
        .attr('id', 'grad-' + tag.id)
        .attr('cx', '30%').attr('cy', '30%');
      grad.append('stop').attr('offset', '0%')
        .attr('stop-color', INTEREST_OS.utils.lightenHex(tag.color, 40));
      grad.append('stop').attr('offset', '100%')
        .attr('stop-color', tag.color);
    });

    // Build nodes
    const maxWeight = Math.max(...tags.map(t => t.weight), 1);
    this.nodes = tags.map((tag, i) => ({
      id: tag.id,
      name: tag.name,
      weight: tag.weight,
      color: tag.color,
      category: tag.category,
      radius: 16 + (tag.weight / maxWeight) * 34,
      x: W / 2 + (Math.random() - 0.5) * 200,
      y: H / 2 + (Math.random() - 0.5) * 200,
      tagData: tag
    }));

    // Build links from relatedTags
    this.links = [];
    const linkSet = new Set();
    tags.forEach(tag => {
      (tag.relatedTags || []).forEach(rid => {
        const key = [tag.id, rid].sort().join('--');
        if (!linkSet.has(key) && this.nodes.find(n => n.id === rid)) {
          linkSet.add(key);
          this.links.push({
            source: tag.id,
            target: rid,
            value: 0.5
          });
        }
      });
    });

    // Add background particles
    this._addParticles(W, H, 60);

    // Add links
    const linkGroup = this.svg.append('g').attr('class', 'links');
    this.linkElements = linkGroup.selectAll('line')
      .data(this.links)
      .enter().append('line')
      .attr('stroke', 'rgba(255,255,255,0.06)')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '3,6');

    // Add nodes
    const nodeGroup = this.svg.append('g').attr('class', 'nodes');
    this.nodeElements = nodeGroup.selectAll('g')
      .data(this.nodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (this.onNodeClick) this.onNodeClick(d.tagData);
        this._highlightNode(d);
      });

    // Planet circles
    this.nodeElements.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => `url(#grad-${d.id})`)
      .attr('filter', 'url(#starGlow)')
      .attr('opacity', 0.85);

    // Labels
    this.nodeElements.append('text')
      .text(d => INTEREST_OS.utils.translateKeyword(d.name))
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 16)
      .attr('fill', '#A1A1AA')
      .attr('font-size', d => 10 + (d.weight / maxWeight) * 4)
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '500');

    // Weight label inside
    this.nodeElements.append('text')
      .text(d => d.weight + '%')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#FFF')
      .attr('font-size', d => 9 + (d.weight / maxWeight) * 3)
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '700')
      .attr('pointer-events', 'none');

    // Force simulation
    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links)
        .id(d => d.id)
        .distance(120)
        .strength(0.3))
      .force('charge', d3.forceManyBody()
        .strength(d => -80 - d.radius * 3))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 10))
      .force('x', d3.forceX(W / 2).strength(0.02))
      .force('y', d3.forceY(H / 2).strength(0.02))
      .alphaDecay(0.02)
      .on('tick', () => this._tick());

    // Click on background to deselect
    this.svg.on('click', () => {
      this._highlightNode(null);
      if (this.onNodeClick) this.onNodeClick(null);
    });

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        this.svg.selectAll('g').attr('transform', event.transform);
      });
    this.svg.call(zoom);

    // Gentle auto-rotate after simulation settles
    setTimeout(() => {
      this.simulation.alphaTarget(0.01).alphaDecay(0.001).restart();
      setTimeout(() => this.simulation.alphaTarget(0), 8000);
    }, 5000);
  },

  _tick() {
    this.linkElements
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    this.nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
  },

  _highlightNode(node) {
    this.nodeElements.selectAll('circle')
      .attr('opacity', d => node ? (d.id === node.id ? 1 : 0.25) : 0.85)
      .attr('stroke', d => node && d.id === node.id ? '#FFF' : 'none')
      .attr('stroke-width', d => node && d.id === node.id ? 2 : 0);
  },

  _addParticles(W, H, count) {
    const particles = this.svg.append('g').attr('class', 'particles');
    for (let i = 0; i < count; i++) {
      particles.append('circle')
        .attr('cx', Math.random() * W)
        .attr('cy', Math.random() * H)
        .attr('r', Math.random() * 1.2 + 0.3)
        .attr('fill', 'rgba(255,255,255,' + (Math.random() * 0.3 + 0.1) + ')')
        .attr('opacity', Math.random() * 0.6 + 0.2);
    }
  },

  // Update labels when language changes (update in place, no re-render)
  updateLabels() {
    if (this.nodeElements) {
      this.nodeElements.select('text')
        .text(d => INTEREST_OS.utils.translateKeyword(d.name));
    }
  },

  // Destroy and clean up
  destroy() {
    if (this.simulation) this.simulation.stop();
    if (this.svg) this.svg.selectAll('*').remove();
  }
};
