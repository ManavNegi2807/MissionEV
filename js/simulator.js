/**
 * MissionEV - Chapter 03: Interactive Mobility Lab Engine
 * Powers the real-time emissions comparison, dynamic SVG charts,
 * weekly mobility mix breakdown, and interactive journey timeline.
 */

(function () {
  'use strict';

  var state = {
    mode: 'ev_car',
    distanceKm: 25,
    baseline: 'petrol_avg',
    useGreenTariff: false,
    // Weekly mobility mix percentages (summing to 100)
    weeklyMix: {
      ev: 45,
      metro: 30,
      active: 15,
      fossil: 10
    },
    weeklyTotalKm: 180,
    selectedTimelineTripIndex: 0
  };

  var timelineTrips = [
    { title: 'Morning Commute', route: 'CyberHub → Central Delhi', km: 26.4, mode: 'ev_car', time: '08:30 AM', note: 'Avoided 3.38 kg CO2 vs ICE baseline' },
    { title: 'Client Meeting Run', route: 'Connaught Place → Noida Sec 62', km: 18.2, mode: 'metro', time: '01:15 PM', note: 'Mass transit avoided 3.06 kg CO2' },
    { title: 'Lunch Errands', route: 'Sector 18 Hub Loop', km: 3.5, mode: 'active', time: '02:30 PM', note: 'Zero tailpipe, 100% human-powered active transit' },
    { title: 'Evening Return', route: 'Noida Sec 62 → CyberHub', km: 28.0, mode: 'ev_car', time: '07:15 PM', note: 'Night peak charging via renewable EV tariff' }
  ];

  function init() {
    setupEventListeners();
    updateCalculations();
    renderEmissionsChart();
    renderWeeklyMix();
    renderTimeline();
  }

  function setupEventListeners() {
    // Mode selector pills
    var modeButtons = document.querySelectorAll('.lab-mode-btn');
    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        modeButtons.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.mode = btn.getAttribute('data-mode');
        updateCalculations();
      });
    });

    // Distance Slider & Input
    var distSlider = document.getElementById('labDistanceSlider');
    var distNumber = document.getElementById('labDistanceNumber');
    if (distSlider && distNumber) {
      distSlider.addEventListener('input', function () {
        distNumber.value = distSlider.value;
        state.distanceKm = parseFloat(distSlider.value) || 1;
        updateCalculations();
      });
      distNumber.addEventListener('input', function () {
        var val = Math.min(200, Math.max(1, parseFloat(distNumber.value) || 1));
        distSlider.value = val;
        state.distanceKm = val;
        updateCalculations();
      });
    }

    // Quick distance preset buttons
    var presetButtons = document.querySelectorAll('.dist-preset-btn');
    presetButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        presetButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var km = parseFloat(btn.getAttribute('data-km'));
        state.distanceKm = km;
        if (distSlider) distSlider.value = km;
        if (distNumber) distNumber.value = km;
        updateCalculations();
      });
    });

    // Baseline selector dropdown
    var baselineSelect = document.getElementById('labBaselineSelect');
    if (baselineSelect) {
      baselineSelect.addEventListener('change', function () {
        state.baseline = baselineSelect.value;
        updateCalculations();
      });
    }

    // Green Tariff / Renewable Charging checkbox toggle
    var greenToggle = document.getElementById('labGreenToggle');
    if (greenToggle) {
      greenToggle.addEventListener('change', function () {
        state.useGreenTariff = greenToggle.checked;
        updateCalculations();
      });
    }

    // Reset Lab Button
    var resetBtn = document.getElementById('labResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.mode = 'ev_car';
        state.distanceKm = 25;
        state.baseline = 'petrol_avg';
        state.useGreenTariff = false;

        modeButtons.forEach(function (b) {
          var isDefault = b.getAttribute('data-mode') === 'ev_car';
          b.classList.toggle('active', isDefault);
          b.setAttribute('aria-pressed', isDefault ? 'true' : 'false');
        });

        if (distSlider) distSlider.value = 25;
        if (distNumber) distNumber.value = 25;
        if (baselineSelect) baselineSelect.value = 'petrol_avg';
        if (greenToggle) greenToggle.checked = false;

        updateCalculations();
        showNotification('Mobility Lab parameters reset to defaults');
      });
    }

    // Weekly Mix sliders
    var mixEv = document.getElementById('mixEvSlider');
    var mixMetro = document.getElementById('mixMetroSlider');
    var mixActive = document.getElementById('mixActiveSlider');
    var mixFossil = document.getElementById('mixFossilSlider');

    function onMixChange() {
      if (mixEv) state.weeklyMix.ev = parseInt(mixEv.value, 10);
      if (mixMetro) state.weeklyMix.metro = parseInt(mixMetro.value, 10);
      if (mixActive) state.weeklyMix.active = parseInt(mixActive.value, 10);
      if (mixFossil) state.weeklyMix.fossil = parseInt(mixFossil.value, 10);
      renderWeeklyMix();
    }

    [mixEv, mixMetro, mixActive, mixFossil].forEach(function (slider) {
      if (slider) slider.addEventListener('input', onMixChange);
    });

    // Weekly distance input
    var weekKmInput = document.getElementById('weeklyDistanceInput');
    if (weekKmInput) {
      weekKmInput.addEventListener('input', function () {
        state.weeklyTotalKm = Math.max(10, parseFloat(weekKmInput.value) || 100);
        renderWeeklyMix();
      });
    }
  }

  function updateCalculations() {
    var res = window.MISSION_EV_DATA.calculate(
      state.distanceKm,
      state.mode,
      state.baseline,
      state.useGreenTariff
    );

    // Update dynamic text elements
    setText('labActualKg', res.journeyEmissionsKg + ' kg');
    setText('labBaselineKg', res.baselineEmissionsKg + ' kg');
    setText('labAvoidedKg', res.avoidedKg + ' kg');
    setText('labRewardTokens', '+' + res.rewardPoints + ' MEV');
    setText('labScoreDelta', (res.scoreDelta > 0 ? '+' : '') + res.scoreDelta + ' pts');
    setText('labTreesEquiv', res.treesEquivalent + ' tree-days');
    setText('labPercentReduced', res.percentReduction + '%');

    // Update mode badge & details
    setText('labModeName', res.mode.name);
    setText('labModeBadge', res.mode.badge);
    setText('labEfficiency', res.mode.efficiency_desc);
    setText('labTailpipeVal', res.tailpipeKg + ' kg (0 direct at vehicle tailpipe)');
    setText('labLifecycleVal', res.journeyEmissionsKg + ' kg (' + (state.useGreenTariff ? 'Renewable/Solar Solar Tariff' : 'National Grid Factor 0.71 kg/kWh') + ')');

    // Update visual bars & SVG chart
    renderEmissionsChart(res);

    // Synchronize Web3 Transaction Preview with current lab selection
    if (window.MISSION_EV_SYNC_TX) {
      window.MISSION_EV_SYNC_TX(res);
    }
  }

  /**
   * Visualization A: Emissions Comparison SVG Bar Chart
   */
  function renderEmissionsChart(res) {
    if (!res) {
      res = window.MISSION_EV_DATA.calculate(state.distanceKm, state.mode, state.baseline, state.useGreenTariff);
    }

    var chartContainer = document.getElementById('labComparisonSvg');
    if (!chartContainer) return;

    var maxVal = Math.max(res.baselineEmissionsKg, res.journeyEmissionsKg, 0.5) * 1.25;
    var chartW = 440;
    var chartH = 180;
    var barWidth = 64;

    var baselineHeight = (res.baselineEmissionsKg / maxVal) * 130;
    var actualHeight = (res.journeyEmissionsKg / maxVal) * 130;
    var avoidedHeight = Math.max(0, baselineHeight - actualHeight);

    var baselineY = chartH - 30 - baselineHeight;
    var actualY = chartH - 30 - actualHeight;

    var svgHtml = '<svg viewBox="0 0 560 ' + chartH + '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Emissions Comparison Chart">';
    
    // Grid baseline lines
    svgHtml += '<line x1="40" y1="' + (chartH - 30) + '" x2="540" y2="' + (chartH - 30) + '" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>';
    svgHtml += '<line x1="40" y1="' + (chartH - 95) + '" x2="540" y2="' + (chartH - 95) + '" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" stroke-width="1"/>';
    svgHtml += '<line x1="40" y1="' + (chartH - 160) + '" x2="540" y2="' + (chartH - 160) + '" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" stroke-width="1"/>';

    // Baseline Bar (Fossil benchmark)
    var bar1X = 80;
    svgHtml += '<g class="chart-bar-group" tabindex="0" data-tooltip="Baseline ICE: ' + res.baselineEmissionsKg + ' kg CO2e">';
    svgHtml += '<rect x="' + bar1X + '" y="' + baselineY + '" width="' + barWidth + '" height="' + baselineHeight + '" rx="6" fill="#FF5B3A" opacity="0.85" />';
    svgHtml += '<text x="' + (bar1X + barWidth / 2) + '" y="' + (baselineY - 8) + '" text-anchor="middle" fill="#FF5B3A" font-size="12" font-family="DM Mono" font-weight="600">' + res.baselineEmissionsKg + ' kg</text>';
    svgHtml += '<text x="' + (bar1X + barWidth / 2) + '" y="' + (chartH - 12) + '" text-anchor="middle" fill="#94A79A" font-size="11" font-family="Space Grotesk">Baseline ICE</text>';
    svgHtml += '</g>';

    // Selected Mode Bar (Clean / EV)
    var bar2X = 260;
    var actualColor = res.mode.category === 'fossil' ? '#FF5B3A' : '#B8FF45';
    svgHtml += '<g class="chart-bar-group" tabindex="0" data-tooltip="' + res.mode.name + ': ' + res.journeyEmissionsKg + ' kg CO2e">';
    svgHtml += '<rect x="' + bar2X + '" y="' + actualY + '" width="' + barWidth + '" height="' + Math.max(actualHeight, 4) + '" rx="6" fill="' + actualColor + '" />';
    svgHtml += '<text x="' + (bar2X + barWidth / 2) + '" y="' + (actualY - 8) + '" text-anchor="middle" fill="' + actualColor + '" font-size="12" font-family="DM Mono" font-weight="600">' + res.journeyEmissionsKg + ' kg</text>';
    svgHtml += '<text x="' + (bar2X + barWidth / 2) + '" y="' + (chartH - 12) + '" text-anchor="middle" fill="' + actualColor + '" font-size="11" font-family="Space Grotesk">' + res.mode.name.split(' ')[0] + '</text>';
    svgHtml += '</g>';

    // Avoided Delta Bracket
    if (res.avoidedKg > 0) {
      svgHtml += '<g class="avoided-bracket">';
      var bracketX = bar2X + barWidth + 14;
      var bracketEndX = bracketX + 12;
      // vertical bracket lines
      svgHtml += '<line x1="' + bracketX + '" y1="' + baselineY + '" x2="' + bracketEndX + '" y2="' + baselineY + '" stroke="#20D89A" stroke-width="1.5"/>';
      svgHtml += '<line x1="' + bracketEndX + '" y1="' + baselineY + '" x2="' + bracketEndX + '" y2="' + actualY + '" stroke="#20D89A" stroke-width="1.5" stroke-dasharray="3,2"/>';
      svgHtml += '<line x1="' + bracketX + '" y1="' + actualY + '" x2="' + bracketEndX + '" y2="' + actualY + '" stroke="#20D89A" stroke-width="1.5"/>';
      // label
      var midY = baselineY + (actualY - baselineY) / 2;
      svgHtml += '<text x="' + (bracketEndX + 8) + '" y="' + (midY + 4) + '" fill="#20D89A" font-size="11" font-family="DM Mono" font-weight="700">-' + res.avoidedKg + ' kg</text>';
      svgHtml += '<text x="' + (bracketEndX + 8) + '" y="' + (midY + 18) + '" fill="#20D89A" font-size="10" font-family="DM Mono">AVOIDED</text>';
      svgHtml += '</g>';
    }

    svgHtml += '</svg>';
    chartContainer.innerHTML = svgHtml;

    // Attach hover tooltips
    var barGroups = chartContainer.querySelectorAll('.chart-bar-group');
    barGroups.forEach(function (bg) {
      bg.addEventListener('mouseenter', function (e) {
        var tipText = bg.getAttribute('data-tooltip');
        showChartTooltip(tipText, e.clientX, e.clientY);
      });
      bg.addEventListener('mouseleave', hideChartTooltip);
    });
  }

  /**
   * Visualization B: Weekly Mobility Mix Interactive Breakdown
   */
  function renderWeeklyMix() {
    var totalPct = state.weeklyMix.ev + state.weeklyMix.metro + state.weeklyMix.active + state.weeklyMix.fossil;
    var normEv = totalPct > 0 ? (state.weeklyMix.ev / totalPct) : 0;
    var normMetro = totalPct > 0 ? (state.weeklyMix.metro / totalPct) : 0;
    var normActive = totalPct > 0 ? (state.weeklyMix.active / totalPct) : 0;
    var normFossil = totalPct > 0 ? (state.weeklyMix.fossil / totalPct) : 0;

    // Calculate weekly avoided emissions vs 100% ICE baseline
    var weeklyKm = state.weeklyTotalKm;
    var baselineKg = (weeklyKm * 196) / 1000;
    var actualKg = (
      (weeklyKm * normEv * 68) +
      (weeklyKm * normMetro * 28) +
      (weeklyKm * normActive * 0) +
      (weeklyKm * normFossil * 196)
    ) / 1000;

    var avoidedWeeklyKg = Math.max(0, baselineKg - actualKg);
    var annualSavedKg = avoidedWeeklyKg * 52;
    var treesAbsorbedYear = (annualSavedKg / 22).toFixed(1); // 1 mature tree absorbs ~22kg CO2/yr

    setText('mixWeeklyAvoided', avoidedWeeklyKg.toFixed(1) + ' kg CO2');
    setText('mixAnnualAvoided', (annualSavedKg / 1000).toFixed(2) + ' Metric Tons / yr');
    setText('mixTreesEquiv', treesAbsorbedYear + ' mature trees equivalent');

    // Update percentages text
    setText('mixEvPct', Math.round(normEv * 100) + '%');
    setText('mixMetroPct', Math.round(normMetro * 100) + '%');
    setText('mixActivePct', Math.round(normActive * 100) + '%');
    setText('mixFossilPct', Math.round(normFossil * 100) + '%');

    // Update progress bar visual
    var barEl = document.getElementById('mixDistributionBar');
    if (barEl) {
      barEl.innerHTML = 
        '<div style="width:' + (normEv * 100) + '%; background:#B8FF45;" title="EV: ' + Math.round(normEv * 100) + '%"></div>' +
        '<div style="width:' + (normMetro * 100) + '%; background:#00F0FF;" title="Metro: ' + Math.round(normMetro * 100) + '%"></div>' +
        '<div style="width:' + (normActive * 100) + '%; background:#E0FF85;" title="Active: ' + Math.round(normActive * 100) + '%"></div>' +
        '<div style="width:' + (normFossil * 100) + '%; background:#FF5B3A;" title="ICE: ' + Math.round(normFossil * 100) + '%"></div>';
    }
  }

  /**
   * Visualization C: Interactive Journey Impact Timeline
   */
  function renderTimeline() {
    var container = document.getElementById('timelineList');
    if (!container) return;

    var html = '';
    timelineTrips.forEach(function (trip, idx) {
      var isSelected = idx === state.selectedTimelineTripIndex;
      var modeObj = window.MISSION_EV_DATA.emissionFactors[trip.mode];
      html += '<div class="timeline-trip-item ' + (isSelected ? 'active' : '') + '" data-index="' + idx + '" tabindex="0">';
      html += '<div class="timeline-bullet" style="background:' + modeObj.color + '"></div>';
      html += '<div class="timeline-info">';
      html += '<div class="timeline-row"><b class="t-name">' + trip.title + '</b><span class="t-time">' + trip.time + '</span></div>';
      html += '<div class="t-route">' + trip.route + ' (' + trip.km + ' km)</div>';
      html += '<div class="t-note hl">' + trip.note + '</div>';
      html += '</div>';
      html += '<button type="button" class="btn sm ghost timeline-load-btn" aria-label="Load into simulator">LOAD TRIP</button>';
      html += '</div>';
    });

    container.innerHTML = html;

    var items = container.querySelectorAll('.timeline-trip-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(item.getAttribute('data-index'), 10);
        selectTimelineTrip(idx);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var idx = parseInt(item.getAttribute('data-index'), 10);
          selectTimelineTrip(idx);
        }
      });
    });

    // Initial trip inspection update
    updateTimelineDetail(timelineTrips[state.selectedTimelineTripIndex]);
  }

  function selectTimelineTrip(idx) {
    state.selectedTimelineTripIndex = idx;
    var trip = timelineTrips[idx];
    if (!trip) return;

    var items = document.querySelectorAll('.timeline-trip-item');
    items.forEach(function (it, i) {
      it.classList.toggle('active', i === idx);
    });

    // Populate the Mobility Lab with this trip's parameters
    state.mode = trip.mode;
    state.distanceKm = trip.km;

    var distSlider = document.getElementById('labDistanceSlider');
    var distNumber = document.getElementById('labDistanceNumber');
    if (distSlider) distSlider.value = trip.km;
    if (distNumber) distNumber.value = trip.km;

    var modeButtons = document.querySelectorAll('.lab-mode-btn');
    modeButtons.forEach(function (b) {
      var isMatched = b.getAttribute('data-mode') === trip.mode;
      b.classList.toggle('active', isMatched);
      b.setAttribute('aria-pressed', isMatched ? 'true' : 'false');
    });

    updateCalculations();
    updateTimelineDetail(trip);
    showNotification('Loaded "' + trip.title + '" into Mobility Lab');
  }

  function updateTimelineDetail(trip) {
    var detailEl = document.getElementById('timelineInspectionDetail');
    if (!detailEl) return;

    var modeObj = window.MISSION_EV_DATA.emissionFactors[trip.mode];
    detailEl.innerHTML = 
      '<div class="timeline-detail-header">' +
      '<span class="k">INSPECTED TRIP TELEMETRY</span>' +
      '<h4>' + trip.title + '</h4>' +
      '<p>' + trip.route + '</p>' +
      '</div>' +
      '<div class="timeline-detail-metrics">' +
      '<div class="td-metric"><span class="k">DISTANCE</span><b class="v">' + trip.km + ' km</b></div>' +
      '<div class="td-metric"><span class="k">TRANSIT MODE</span><b class="v" style="color:' + modeObj.color + '">' + modeObj.name + '</b></div>' +
      '<div class="td-metric"><span class="k">DISPATCH TIME</span><b class="v">' + trip.time + '</b></div>' +
      '<div class="td-metric"><span class="k">STATUS</span><b class="v hl">Azure Geofence Verified</b></div>' +
      '</div>';
  }

  function showChartTooltip(text, x, y) {
    var tip = document.getElementById('chartTooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'chartTooltip';
      tip.className = 'chart-tooltip-floating';
      document.body.appendChild(tip);
    }
    tip.textContent = text;
    tip.style.left = (x + 12) + 'px';
    tip.style.top = (y - 28) + 'px';
    tip.style.opacity = '1';
  }

  function hideChartTooltip() {
    var tip = document.getElementById('chartTooltip');
    if (tip) tip.style.opacity = '0';
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.textContent !== text) {
      el.textContent = text;
      // Flash highlight on change
      el.classList.remove('val-updated');
      void el.offsetWidth; // reflow to restart animation
      el.classList.add('val-updated');
    }
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
