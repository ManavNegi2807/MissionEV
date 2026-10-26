/**
 * MissionEV - Chapter 04: Mobility Profile & Dashboard Engine
 * Implements interactive application dashboard with timeframe filters,
 * score history SVG area chart, trip log filtering, detail drawer,
 * profile switcher, and localStorage persistence.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'missionev_demo_profile_v1';
  var currentProfileId = 'aarav';
  var currentTimeframe = 'week'; // 'day' | 'week' | 'month'
  var currentModeFilter = 'all';

  var profileData = JSON.parse(JSON.stringify(window.MISSION_EV_DATA.profiles));

  // Historical score datasets for dynamic chart rendering
  var scoreHistory = {
    day: [
      { label: '06:00', score: 838, avoidedKg: 0.0 },
      { label: '09:00', score: 840, avoidedKg: 1.8 },
      { label: '12:00', score: 840, avoidedKg: 1.8 },
      { label: '15:00', score: 841, avoidedKg: 2.2 },
      { label: '18:00', score: 842, avoidedKg: 3.4 },
      { label: '21:00', score: 842, avoidedKg: 3.4 }
    ],
    week: [
      { label: 'Mon', score: 824, avoidedKg: 18.2 },
      { label: 'Tue', score: 828, avoidedKg: 21.4 },
      { label: 'Wed', score: 831, avoidedKg: 19.8 },
      { label: 'Thu', score: 835, avoidedKg: 24.1 },
      { label: 'Fri', score: 838, avoidedKg: 22.0 },
      { label: 'Sat', score: 840, avoidedKg: 16.5 },
      { label: 'Sun', score: 842, avoidedKg: 20.8 }
    ],
    month: [
      { label: 'W1', score: 780, avoidedKg: 82.0 },
      { label: 'W2', score: 802, avoidedKg: 94.5 },
      { label: 'W3', score: 822, avoidedKg: 110.2 },
      { label: 'W4', score: 842, avoidedKg: 142.8 }
    ]
  };

  function init() {
    loadSavedProfile();
    setupDashboardEvents();
    renderProfileView();
    renderScoreChart();
    renderTripList();
    renderBadges();
    renderLeaderboard();
  }

  function loadSavedProfile() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed.profileId && profileData[parsed.profileId]) {
          currentProfileId = parsed.profileId;
        }
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for profile storage', e);
    }
  }

  function saveProfileState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        profileId: currentProfileId,
        timeframe: currentTimeframe
      }));
    } catch (e) {}
  }

  function setupDashboardEvents() {
    // Timeframe selector buttons (Day / Week / Month)
    var tfButtons = document.querySelectorAll('.dash-tf-btn');
    tfButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tfButtons.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentTimeframe = btn.getAttribute('data-tf');
        renderScoreChart();
        saveProfileState();
      });
    });

    // Transport Mode Filters (All, EV, Metro, Active, Fossil)
    var filterButtons = document.querySelectorAll('.dash-filter-btn');
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentModeFilter = btn.getAttribute('data-filter');
        renderTripList();
      });
    });

    // Profile Switcher Selector
    var profileSelect = document.getElementById('dashProfileSelect');
    if (profileSelect) {
      profileSelect.value = currentProfileId;
      profileSelect.addEventListener('change', function () {
        currentProfileId = profileSelect.value;
        renderProfileView();
        renderScoreChart();
        renderTripList();
        saveProfileState();
        showNotification('Switched profile to ' + profileData[currentProfileId].name);
      });
    }

    // Reset Profile / Demo Data Button
    var resetBtn = document.getElementById('dashResetDemoBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        localStorage.removeItem(STORAGE_KEY);
        profileData = JSON.parse(JSON.stringify(window.MISSION_EV_DATA.profiles));
        currentProfileId = 'aarav';
        currentTimeframe = 'week';
        currentModeFilter = 'all';

        if (profileSelect) profileSelect.value = 'aarav';
        tfButtons.forEach(function (b) {
          var isWk = b.getAttribute('data-tf') === 'week';
          b.classList.toggle('active', isWk);
          b.setAttribute('aria-pressed', isWk ? 'true' : 'false');
        });
        filterButtons.forEach(function (b) {
          var isAll = b.getAttribute('data-filter') === 'all';
          b.classList.toggle('active', isAll);
        });

        renderProfileView();
        renderScoreChart();
        renderTripList();
        showNotification('Demo Profile and Trip Data reset to pristine state');
      });
    }

    // Modal / Drawer close buttons
    var closeDrawerBtn = document.getElementById('closeTripDrawerBtn');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', closeTripDrawer);
    }

    var drawerOverlay = document.getElementById('tripDrawerOverlay');
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', closeTripDrawer);
    }
  }

  function renderProfileView() {
    var p = profileData[currentProfileId];
    if (!p) return;

    setText('dashUserName', p.name);
    setText('dashUserTagline', p.tagline);
    setText('dashUserCity', p.city);
    setText('dashCarbonScore', p.carbonScore);
    setText('dashScoreTier', p.scoreTier);
    setText('dashStreakDays', p.streakDays + ' Days');
    setText('dashTotalAvoided', p.totalAvoidedKg + ' kg CO2e');
    setText('dashTotalTrips', p.totalTrips + ' Commutes');
    setText('dashWeeklyDistance', p.weeklyDistanceKm + ' km');
    setText('dashWalletAddress', p.walletAddress);
    setText('dashTokenBalance', p.tokenBalance);

    var avatarEl = document.getElementById('dashAvatar');
    if (avatarEl) avatarEl.textContent = p.avatar;
  }

  /**
   * SVG Score History Area & Line Chart
   */
  function renderScoreChart() {
    var chartEl = document.getElementById('dashScoreSvg');
    if (!chartEl) return;

    var series = scoreHistory[currentTimeframe] || scoreHistory.week;
    var W = 620;
    var H = 210;
    var padL = 48;
    var padR = 24;
    var padT = 24;
    var padB = 34;

    var minScore = 750;
    var maxScore = 870;

    var points = series.map(function (item, i) {
      var x = padL + (i / (series.length - 1)) * (W - padL - padR);
      var y = H - padB - ((item.score - minScore) / (maxScore - minScore)) * (H - padT - padB);
      return { x: x, y: y, label: item.label, score: item.score, avoided: item.avoidedKg };
    });

    var lineD = 'M ' + points[0].x + ' ' + points[0].y;
    for (var j = 1; j < points.length; j++) {
      // Smooth cubic curve
      var prev = points[j - 1];
      var curr = points[j];
      var cp1x = prev.x + (curr.x - prev.x) * 0.45;
      var cp1y = prev.y;
      var cp2x = curr.x - (curr.x - prev.x) * 0.45;
      var cp2y = curr.y;
      lineD += ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + curr.x + ' ' + curr.y;
    }

    var areaD = lineD + ' L ' + points[points.length - 1].x + ' ' + (H - padB) + ' L ' + points[0].x + ' ' + (H - padB) + ' Z';

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" preserveAspectRatio="none">';
    
    // Gradient definitions
    svg += '<defs>';
    svg += '<linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">';
    svg += '<stop offset="0%" stop-color="#B8FF45" stop-opacity="0.35"/>';
    svg += '<stop offset="100%" stop-color="#B8FF45" stop-opacity="0.0"/>';
    svg += '</linearGradient>';
    svg += '</defs>';

    // Horizontal guideline grids
    [780, 810, 840].forEach(function (val) {
      var gy = H - padB - ((val - minScore) / (maxScore - minScore)) * (H - padT - padB);
      svg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3"/>';
      svg += '<text x="' + (padL - 10) + '" y="' + (gy + 4) + '" text-anchor="end" fill="#94A79A" font-size="10" font-family="DM Mono">' + val + '</text>';
    });

    // Area Fill
    svg += '<path d="' + areaD + '" fill="url(#scoreAreaGrad)"/>';

    // Stroke line
    svg += '<path d="' + lineD + '" fill="none" stroke="#B8FF45" stroke-width="2.5" stroke-linecap="round"/>';

    // Interactive Data Nodes
    points.forEach(function (pt) {
      svg += '<g class="chart-point-node" tabindex="0" data-label="' + pt.label + '" data-score="' + pt.score + '" data-avoided="' + pt.avoided + '">';
      svg += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="5.5" fill="#07110D" stroke="#B8FF45" stroke-width="2.5"/>';
      svg += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="2" fill="#B8FF45"/>';
      svg += '<text x="' + pt.x + '" y="' + (H - padB + 18) + '" text-anchor="middle" fill="#94A79A" font-size="11" font-family="DM Mono">' + pt.label + '</text>';
      svg += '</g>';
    });

    svg += '</svg>';
    chartEl.innerHTML = svg;

    // Attach hover inspection on nodes
    var pointNodes = chartEl.querySelectorAll('.chart-point-node');
    pointNodes.forEach(function (pNode) {
      pNode.addEventListener('mouseenter', function (e) {
        var label = pNode.getAttribute('data-label');
        var score = pNode.getAttribute('data-score');
        var avoided = pNode.getAttribute('data-avoided');
        var rect = pNode.getBoundingClientRect();
        showScoreTooltip(label + ' • Score: ' + score + ' (Avoided ' + avoided + ' kg)', rect.left + rect.width / 2, rect.top);
      });
      pNode.addEventListener('mouseleave', hideScoreTooltip);
    });
  }

  function renderTripList() {
    var listContainer = document.getElementById('dashTripList');
    if (!listContainer) return;

    var p = profileData[currentProfileId];
    var trips = p ? p.trips : [];

    // Filter by mode
    if (currentModeFilter !== 'all') {
      trips = trips.filter(function (t) {
        if (currentModeFilter === 'clean') return t.mode === 'ev_car' || t.mode === 'ev_2w' || t.mode === 'ebus';
        if (currentModeFilter === 'metro') return t.mode === 'metro';
        if (currentModeFilter === 'active') return t.mode === 'active';
        if (currentModeFilter === 'fossil') return t.mode === 'petrol_car' || t.mode === 'diesel_car';
        return true;
      });
    }

    if (trips.length === 0) {
      listContainer.innerHTML = '<div class="no-trips-msg">No trips recorded under this filter. Switch filters or log a new trip.</div>';
      return;
    }

    var html = '';
    trips.forEach(function (trip) {
      var modeObj = window.MISSION_EV_DATA.emissionFactors[trip.mode] || window.MISSION_EV_DATA.emissionFactors.ev_car;
      html += '<div class="trip-row" data-id="' + trip.id + '" tabindex="0">';
      html += '<div class="trip-col-mode"><span class="mode-tag" style="border-color:' + modeObj.color + '; color:' + modeObj.color + ';">' + modeObj.name.split(' ')[0] + '</span></div>';
      html += '<div class="trip-col-route"><b>' + trip.route + '</b><span class="trip-date">' + trip.date + ' • ' + trip.distanceKm + ' km</span></div>';
      html += '<div class="trip-col-avoided"><span class="hl">-' + trip.avoidedKg + ' kg</span><small>Avoided CO2</small></div>';
      html += '<div class="trip-col-tokens"><b>+' + trip.points + ' MEV</b><small>' + trip.status + '</small></div>';
      html += '<div class="trip-col-action"><button type="button" class="btn sm ghost" aria-label="Inspect trip details">INSPECT →</button></div>';
      html += '</div>';
    });

    listContainer.innerHTML = html;

    var rows = listContainer.querySelectorAll('.trip-row');
    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        var tripId = row.getAttribute('data-id');
        openTripDrawer(tripId);
      });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var tripId = row.getAttribute('data-id');
          openTripDrawer(tripId);
        }
      });
    });
  }

  function openTripDrawer(tripId) {
    var p = profileData[currentProfileId];
    var trip = p.trips.find(function (t) { return t.id === tripId; });
    if (!trip) return;

    var drawer = document.getElementById('tripDrawer');
    var content = document.getElementById('tripDrawerContent');
    if (!drawer || !content) return;

    var modeObj = window.MISSION_EV_DATA.emissionFactors[trip.mode] || window.MISSION_EV_DATA.emissionFactors.ev_car;

    content.innerHTML = 
      '<div class="drawer-header">' +
      '<span class="k">PORTAL ON-CHAIN VERIFIED RECORD</span>' +
      '<h3>' + trip.route + '</h3>' +
      '<p>' + trip.date + ' • Distance: ' + trip.distanceKm + ' km</p>' +
      '</div>' +
      '<div class="drawer-grid">' +
      '<div class="d-item"><span class="k">TRANSPORT MODE</span><b class="v" style="color:' + modeObj.color + '">' + modeObj.name + '</b></div>' +
      '<div class="d-item"><span class="k">ESTIMATED EMISSIONS</span><b class="v">' + trip.actualKg + ' kg CO2e</b></div>' +
      '<div class="d-item"><span class="k">BASELINE ICE EMISSIONS</span><b class="v">' + trip.baselineKg + ' kg CO2e</b></div>' +
      '<div class="d-item"><span class="k">NET AVOIDED CARBON</span><b class="v hl">-' + trip.avoidedKg + ' kg CO2e</b></div>' +
      '<div class="d-item"><span class="k">REWARD MINTED</span><b class="v hl">+' + trip.points + ' MEV</b></div>' +
      '<div class="d-item"><span class="k">VERIFICATION STATUS</span><b class="v">' + trip.status + '</b></div>' +
      '</div>' +
      '<div class="drawer-onchain-proof">' +
      '<span class="k">SMART CONTRACT TRANSACTION PROOF</span>' +
      '<div class="proof-code"><code>TX HASH: ' + trip.txHash + '<br>EVM CONTRACT: 0x82b9...46A0 (Portal Layer 0 Testnet)<br>ORACLE FEED: Azure Functions Route Telemetry Proof</code></div>' +
      '<p class="proof-disclaimer">Simulated hackathon demonstration. Proves data validation and token minting logic on Portal Layer 0 EVM.</p>' +
      '</div>';

    drawer.classList.add('open');
    var overlay = document.getElementById('tripDrawerOverlay');
    if (overlay) overlay.classList.add('open');
  }

  function closeTripDrawer() {
    var drawer = document.getElementById('tripDrawer');
    var overlay = document.getElementById('tripDrawerOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  function renderBadges() {
    var badgeContainer = document.getElementById('dashBadgesGrid');
    if (!badgeContainer) return;

    var html = '';
    window.MISSION_EV_DATA.badges.forEach(function (b) {
      html += '<div class="badge-card ' + (b.unlocked ? 'unlocked' : 'locked') + '" tabindex="0">';
      html += '<div class="badge-icon-wrap">' + getBadgeSvg(b.icon) + '</div>';
      html += '<b class="b-title">' + b.name + '</b>';
      html += '<p class="b-desc">' + b.desc + '</p>';
      html += '<span class="b-status ' + (b.unlocked ? 'hl' : '') + '">' + (b.unlocked ? 'Unlocked ' + b.date : 'Progress: ' + b.progress) + '</span>';
      html += '</div>';
    });

    badgeContainer.innerHTML = html;
  }

  function renderLeaderboard() {
    var lbContainer = document.getElementById('dashLeaderboard');
    if (!lbContainer) return;

    var html = '';
    window.MISSION_EV_DATA.leaderboard.forEach(function (user) {
      var isYou = user.name.includes('(You)');
      html += '<div class="lb-row ' + (isYou ? 'is-user' : '') + '">';
      html += '<div class="lb-rank">#' + user.rank + '</div>';
      html += '<div class="lb-user"><b>' + user.name + '</b><small>' + user.city + ' • ' + user.badge + '</small></div>';
      html += '<div class="lb-avoided hl">-' + user.avoidedKg + ' kg</div>';
      html += '<div class="lb-streak">🔥 ' + user.streak + 'd</div>';
      html += '<div class="lb-score"><b>' + user.score + ' pts</b></div>';
      html += '</div>';
    });

    lbContainer.innerHTML = html;
  }

  function getBadgeSvg(icon) {
    if (icon === 'zap') return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
    if (icon === 'train') return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2"><rect x="4" y="3" width="16" height="16" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="8" y1="15" x2="8" y2="15.01"/><line x1="16" y1="15" x2="16" y2="15.01"/></svg>';
    if (icon === 'sun') return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>';
    if (icon === 'flame') return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
    if (icon === 'award') return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>';
    return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
  }

  function showScoreTooltip(text, x, y) {
    var tip = document.getElementById('chartTooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'chartTooltip';
      tip.className = 'chart-tooltip-floating';
      document.body.appendChild(tip);
    }
    tip.textContent = text;
    tip.style.left = (x - 30) + 'px';
    tip.style.top = (y - 36) + 'px';
    tip.style.opacity = '1';
  }

  function hideScoreTooltip() {
    var tip = document.getElementById('chartTooltip');
    if (tip) tip.style.opacity = '0';
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function showNotification(msg) {
    var toastContainer = document.getElementById('toasts');
    if (!toastContainer) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '⚡ ' + msg;
    toastContainer.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
