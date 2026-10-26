/**
 * MissionEV - Fluid Dynamic Cursor & Microinteraction Engine
 * Features:
 * - Fluid interpolated trailing ring with contextual sizing
 * - Contextual badge labels ("EXPLORE", "SIMULATE", "INSPECT", "MINT", etc.)
 * - Luminous canvas polyline trail behind mouse
 * - Subtle magnetic pull on `.mag` interactive buttons
 * - Ripple feedback on clicks
 * - Automatic disable on touch devices and prefers-reduced-motion
 */

(function () {
  'use strict';

  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;

  if (!FINE || REDUCED) return;

  var trailCanvas, trailCtx, TW, TH;
  var ring, ringLabel, dot;
  var mouse = { x: -9999, y: -9999 };
  var ringPos = { x: -9999, y: -9999 };
  var pts = [];
  var isVisible = false;

  function initCursor() {
    trailCanvas = document.getElementById('cursorTrail');
    ring = document.getElementById('cursorRing');
    ringLabel = document.getElementById('cursorLabel');
    dot = document.getElementById('cursorDot');

    if (!trailCanvas || !ring) return;
    trailCtx = trailCanvas.getContext('2d');

    fitCanvas();
    window.addEventListener('resize', fitCanvas);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    document.documentElement.addEventListener('pointerleave', onLeave);

    initMagneticButtons();

    requestAnimationFrame(renderCursor);
  }

  function fitCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    TW = window.innerWidth;
    TH = window.innerHeight;
    trailCanvas.width = Math.round(TW * dpr);
    trailCanvas.height = Math.round(TH * dpr);
    trailCanvas.style.width = TW + 'px';
    trailCanvas.style.height = TH + 'px';
    trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    isVisible = true;

    if (dot) {
      dot.style.transform = 'translate3d(calc(' + mouse.x + 'px - 50%),calc(' + mouse.y + 'px - 50%),0)';
      dot.style.opacity = '1';
    }

    // Context detection
    var target = e.target;
    var interactive = target.closest('a, button, input, select, .interactive-card, .mode-pill, .badge-card, .arch-layer, .trip-row');
    
    if (interactive) {
      ring.classList.add('hovering');
      var customText = interactive.getAttribute('data-cursor') || '';
      if (!customText) {
        if (interactive.closest('#lab')) customText = 'SIMULATE';
        else if (interactive.closest('#web3')) customText = 'VERIFY';
        else if (interactive.closest('#profile')) customText = 'INSPECT';
        else if (interactive.tagName === 'BUTTON' || interactive.tagName === 'A') customText = 'EXPLORE';
      }
      if (customText && ringLabel) {
        ringLabel.textContent = customText;
        ring.classList.add('has-label');
      } else {
        ring.classList.remove('has-label');
        if (ringLabel) ringLabel.textContent = '';
      }
    } else {
      ring.classList.remove('hovering');
      ring.classList.remove('has-label');
      if (ringLabel) ringLabel.textContent = '';
    }
  }

  function onDown(e) {
    ring.classList.add('clicked');
    setTimeout(function () {
      ring.classList.remove('clicked');
    }, 180);
    createClickRipple(e.clientX, e.clientY);
  }

  function onLeave() {
    isVisible = false;
    if (dot) dot.style.opacity = '0';
    pts = [];
  }

  function createClickRipple(x, y) {
    var ripple = document.createElement('div');
    ripple.className = 'cursor-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    document.body.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 600);
  }

  function initMagneticButtons() {
    function attachMag(btn) {
      btn.addEventListener('pointermove', function (e) {
        var rect = btn.getBoundingClientRect();
        var relX = e.clientX - rect.left - rect.width / 2;
        var relY = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate3d(' + (relX * 0.28) + 'px,' + (relY * 0.32) + 'px,0)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    }
    document.querySelectorAll('.mag').forEach(attachMag);

    // Also observe future .mag additions
    if (window.MutationObserver) {
      var mo = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              if (node.classList && node.classList.contains('mag')) attachMag(node);
              node.querySelectorAll && node.querySelectorAll('.mag').forEach(attachMag);
            }
          });
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  function renderCursor() {
    // Smooth lag interpolation for the outer ring (lerp factor 0.13 = silky trailing)
    var lerpFactor = 0.13;
    ringPos.x += (mouse.x - ringPos.x) * lerpFactor;
    ringPos.y += (mouse.y - ringPos.y) * lerpFactor;

    if (isVisible) {
      ring.style.opacity = '0.9';
    } else {
      ring.style.opacity = '0';
    }

    // Position ring centered on the interpolated position
    ring.style.transform = 'translate3d(calc(' + ringPos.x + 'px - 50%),calc(' + ringPos.y + 'px - 50%),0)';

    // Particle trail
    if (isVisible && mouse.x > -1000) {
      pts.push({ x: mouse.x, y: mouse.y });
    }
    if (pts.length > 28) pts.shift();

    trailCtx.clearRect(0, 0, TW, TH);
    if (pts.length > 2) {
      trailCtx.lineCap = 'round';
      trailCtx.lineJoin = 'round';
      for (var i = 1; i < pts.length; i++) {
        var p0 = pts[i - 1];
        var p1 = pts[i];
        var progress = i / pts.length;
        trailCtx.strokeStyle = 'rgba(184, 255, 69, ' + (progress * 0.38) + ')';
        trailCtx.lineWidth = 1 + progress * 2;
        trailCtx.beginPath();
        trailCtx.moveTo(p0.x, p0.y);
        trailCtx.lineTo(p1.x, p1.y);
        trailCtx.stroke();
      }
    }

    requestAnimationFrame(renderCursor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
  } else {
    initCursor();
  }
})();
