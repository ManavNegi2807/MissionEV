/**
 * MissionEV - Hero Interactive Luminous Route Network & Particle Canvas
 * Responsive, high-FPS canvas featuring dynamic mobility vectors, interactive waypoint nodes,
 * electric vehicle markers, live telemetry feeds, and mouse parallax interaction.
 */

(function () {
  'use strict';

  var canvas, ctx, width, height, dpr;
  var isVisible = true;
  var mouse = { x: -9999, y: -9999, targetX: 0, targetY: 0, currentX: 0, currentY: 0 };
  var activeNode = null;

  // Waypoints representing urban mobility hubs
  var nodes = [
    { id: 'hub-1', label: 'Cyber Corridor', sub: 'DLF Tech Hub', xRatio: 0.18, yRatio: 0.32, radius: 7, pulse: 0, type: 'ev_depot', stats: { activeEVs: 142, avoidedToday: '428 kg CO2', avgEfficiency: '14.8 kWh/100km' } },
    { id: 'hub-2', label: 'Central Interchange', sub: 'Metro Line Interchange', xRatio: 0.48, yRatio: 0.28, radius: 9, pulse: 1.5, type: 'metro_hub', stats: { ridership: '48,200', cleanShare: '94%', gridSource: 'Solar PPA' } },
    { id: 'hub-3', label: 'Solar Supercharger', sub: '150kW Hyper-Depot', xRatio: 0.82, yRatio: 0.38, radius: 8, pulse: 3.1, type: 'charging_hub', stats: { fastPorts: '24 / 32 Busy', greenTariff: '100% Solar', peakOffload: '-34% Grid' } },
    { id: 'hub-4', label: 'Green Tech Corridor', sub: 'Electronic City Phase 1', xRatio: 0.32, yRatio: 0.72, radius: 7, pulse: 2.2, type: 'micro_transit', stats: { e2WShare: '62%', avoidedToday: '194 kg CO2', streakRiders: '1,280' } },
    { id: 'hub-5', label: 'Airport Aerocity Node', sub: 'Multimodal Transit Hub', xRatio: 0.68, yRatio: 0.76, radius: 8, pulse: 4.0, type: 'fleet_hub', stats: { eTaxis: '88 On-route', zeroTailpipeKm: '18,400 km', status: 'Optimal' } }
  ];

  // Route connections between hubs (indices in nodes array)
  var routes = [
    { from: 0, to: 1, color: '#B8FF45', weight: 1.8, cpOffset: { x: 0, y: -40 }, particles: [] },
    { from: 1, to: 2, color: '#20D89A', weight: 2.2, cpOffset: { x: 30, y: -20 }, particles: [] },
    { from: 0, to: 3, color: '#00F0FF', weight: 1.5, cpOffset: { x: -30, y: 20 }, particles: [] },
    { from: 3, to: 4, color: '#B8FF45', weight: 2.0, cpOffset: { x: 10, y: 30 }, particles: [] },
    { from: 4, to: 2, color: '#20D89A', weight: 1.6, cpOffset: { x: 40, y: 10 }, particles: [] },
    { from: 1, to: 4, color: '#70FF94', weight: 1.4, cpOffset: { x: 0, y: 0 }, particles: [] }
  ];

  // Atmospheric background particles (floating telemetry micro-dots)
  var particles = [];
  var PARTICLE_COUNT = 45;

  function init() {
    canvas = document.getElementById('field');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', debounce(resize, 150));

    // Seed moving EV packets along routes
    routes.forEach(function (route) {
      var numVehicles = 2 + Math.floor(Math.random() * 2);
      for (var i = 0; i < numVehicles; i++) {
        route.particles.push({
          t: Math.random(),
          speed: 0.0025 + Math.random() * 0.003,
          size: 3.5 + Math.random() * 2,
          tail: []
        });
      }
    });

    // Seed background particles
    particles = [];
    for (var j = 0; j < PARTICLE_COUNT; j++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.5,
        color: Math.random() > 0.4 ? '#20D89A' : '#B8FF45'
      });
    }

    // Canvas Mouse listeners
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerleave', onPointerLeave);

    // Visibility observer to save battery when user scrolls away
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(canvas);
    }

    requestAnimationFrame(render);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
    height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onPointerMove(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // Normalised mouse position for parallax (-1 to 1)
    mouse.targetX = (mouse.x / width - 0.5) * 2;
    mouse.targetY = (mouse.y / height - 0.5) * 2;

    // Check hover on nodes
    var hovered = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = getNodePos(nodes[i]);
      var dist = Math.hypot(mouse.x - n.x, mouse.y - n.y);
      if (dist < 26) {
        hovered = nodes[i];
        break;
      }
    }
    activeNode = hovered;
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  }

  function onPointerDown(e) {
    if (activeNode) {
      showNodeTelemetryModal(activeNode);
    }
  }

  function onPointerLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
    mouse.targetX = 0;
    mouse.targetY = 0;
    activeNode = null;
  }

  function getNodePos(node) {
    // Apply subtle parallax offset based on layer depth
    var px = mouse.currentX * 18;
    var py = mouse.currentY * 18;
    return {
      x: node.xRatio * width + px,
      y: node.yRatio * height + py
    };
  }

  function getBezierPoint(p0, p1, cp, t) {
    var inv = 1 - t;
    return {
      x: inv * inv * p0.x + 2 * inv * t * cp.x + t * t * p1.x,
      y: inv * inv * p0.y + 2 * inv * t * cp.y + t * t * p1.y
    };
  }

  function render(time) {
    if (isVisible) {
      // Smooth mouse interpolation
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.05;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle background coordinate grid
      drawGrid();

      // 2. Draw atmospheric drifting particles
      drawParticles();

      // 3. Draw Route Corridors & moving electric vehicles
      drawRoutes();

      // 4. Draw Waypoint Hubs & interactive halos
      drawNodes(time);
    }
    requestAnimationFrame(render);
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(32, 216, 154, 0.04)';
    ctx.lineWidth = 1;
    var step = 60;
    var offsetX = (mouse.currentX * 10) % step;
    var offsetY = (mouse.currentY * 10) % step;

    ctx.beginPath();
    for (var x = offsetX; x < width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (var y = offsetY; y < height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Mouse gentle repulsion
      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var dist = Math.hypot(dx, dy);
      if (dist < 100) {
        var force = (100 - dist) / 100;
        p.x += (dx / dist) * force * 1.5;
        p.y += (dy / dist) * force * 1.5;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRoutes() {
    routes.forEach(function (route) {
      var n0 = getNodePos(nodes[route.from]);
      var n1 = getNodePos(nodes[route.to]);
      var cp = {
        x: (n0.x + n1.x) / 2 + route.cpOffset.x,
        y: (n0.y + n1.y) / 2 + route.cpOffset.y
      };

      // Underlying glowing trajectory line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(n0.x, n0.y);
      ctx.quadraticCurveTo(cp.x, cp.y, n1.x, n1.y);
      ctx.strokeStyle = route.color;
      ctx.lineWidth = route.weight;
      ctx.globalAlpha = 0.22;
      ctx.stroke();

      // Dashed pulsed flow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.setLineDash([4, 18]);
      ctx.lineDashOffset = -Date.now() * 0.015;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.restore();

      // Moving EV / transit packets
      route.particles.forEach(function (vp) {
        vp.t += vp.speed;
        if (vp.t > 1) vp.t = 0;

        var pos = getBezierPoint(n0, n1, cp, vp.t);

        // Keep trail
        vp.tail.unshift({ x: pos.x, y: pos.y });
        if (vp.tail.length > 8) vp.tail.pop();

        // Draw light ribbon tail
        ctx.save();
        for (var k = 1; k < vp.tail.length; k++) {
          var a = vp.tail[k - 1];
          var b = vp.tail[k];
          var alpha = (1 - k / vp.tail.length) * 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = route.color;
          ctx.lineWidth = vp.size * (1 - k / vp.tail.length);
          ctx.globalAlpha = alpha;
          ctx.stroke();
        }

        // Draw vehicle core & corona
        ctx.shadowColor = route.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, vp.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = route.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, vp.size * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });
  }

  function drawNodes(time) {
    nodes.forEach(function (node) {
      var pos = getNodePos(node);
      var isHovered = activeNode && activeNode.id === node.id;
      node.pulse += 0.035;

      ctx.save();
      // Outer pulsing ripple ring
      var rippleSize = node.radius + 12 + Math.sin(node.pulse) * 6;
      var rippleAlpha = 0.15 + Math.sin(node.pulse) * 0.1;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, rippleSize, 0, Math.PI * 2);
      ctx.strokeStyle = '#B8FF45';
      ctx.lineWidth = 1;
      ctx.globalAlpha = isHovered ? 0.7 : rippleAlpha;
      ctx.stroke();

      // Glow halo
      ctx.shadowColor = '#B8FF45';
      ctx.shadowBlur = isHovered ? 25 : 14;

      // Base circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isHovered ? node.radius * 1.3 : node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#B8FF45' : '#13221B';
      ctx.strokeStyle = '#B8FF45';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.stroke();

      // Center bright pip
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#07110D' : '#F1F6EF';
      ctx.fill();

      // Label & telemetry badge
      ctx.shadowBlur = 0;
      ctx.font = '600 11px "Space Grotesk", sans-serif';
      ctx.fillStyle = isHovered ? '#B8FF45' : '#F1F6EF';
      ctx.textAlign = 'left';
      ctx.fillText(node.label, pos.x + 16, pos.y - 2);

      ctx.font = '500 9.5px "DM Mono", monospace';
      ctx.fillStyle = 'rgba(148, 167, 154, 0.85)';
      ctx.fillText(node.sub.toUpperCase(), pos.x + 16, pos.y + 11);

      if (isHovered) {
        // "CLICK TO INSPECT" micro badge
        ctx.fillStyle = 'rgba(184, 255, 69, 0.9)';
        ctx.font = '700 8.5px "DM Mono", monospace';
        ctx.fillText('⚡ TAP TO INSPECT TELEMETRY', pos.x + 16, pos.y + 24);
      }

      ctx.restore();
    });
  }

  function showNodeTelemetryModal(node) {
    var modal = document.getElementById('heroNodeModal');
    if (!modal) return;

    var titleEl = document.getElementById('heroModalTitle');
    var subEl = document.getElementById('heroModalSub');
    var bodyEl = document.getElementById('heroModalBody');

    if (titleEl) titleEl.textContent = node.label;
    if (subEl) subEl.textContent = node.sub + ' • ' + node.type.replace('_', ' ').toUpperCase();

    if (bodyEl) {
      var html = '<div class="telemetry-grid">';
      for (var key in node.stats) {
        var label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
        html += '<div class="telemetry-item">' +
          '<span class="k">' + label + '</span>' +
          '<b class="v hl">' + node.stats[key] + '</b>' +
          '</div>';
      }
      html += '</div>';
      html += '<div class="telemetry-footer-note">' +
        '<span>SOURCE: AZURE IOT MOBILITY ORACLE (SIMULATED)</span>' +
        '<span>STATUS: TELEMETRY STREAM NORMAL</span>' +
        '</div>';
      bodyEl.innerHTML = html;
    }

    modal.classList.add('open');
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
