/**
 * MissionEV - Chapter 01 (Dual Route Problem Comparison) & Chapter 07 (Future City Collective Impact Simulator)
 */

(function () {
  'use strict';

  var currentCityKey = 'delhi';
  var targetCleanShiftPct = 35; // 35% of daily journeys shifted to clean transit

  var routeComparisons = [
    {
      id: 'delhi_corridor',
      title: 'Delhi: Gurgaon CyberHub → Connaught Place (26.4 km)',
      distanceKm: 26.4,
      iceVehicle: 'Petrol ICE Sedan (196 g/km)',
      iceCo2Kg: 5.17,
      iceCostInr: '₹285 (Petrol Fuel)',
      cleanVehicle: 'Tata Nexon EV (68 g/km Indian Grid)',
      cleanCo2Kg: 1.80,
      cleanCostInr: '₹58 (EV Charging)',
      avoidedKg: 3.37,
      source: 'CEA CO2 Baseline v19 & MoRTH Fuel Economy Standards'
    },
    {
      id: 'bengaluru_hub',
      title: 'Bengaluru: Electronic City → Indiranagar (18.5 km)',
      distanceKm: 18.5,
      iceVehicle: 'Diesel Compact SUV (224 g/km)',
      iceCo2Kg: 4.14,
      iceCostInr: '₹220 (Diesel Fuel)',
      cleanVehicle: 'Ather 450X EV Scooter (24 g/km)',
      cleanCo2Kg: 0.44,
      cleanCostInr: '₹14 (Electric Charging)',
      avoidedKg: 3.70,
      source: 'ARAI EV Efficiency Test Cycle & Karnataka DISCOM Tariff'
    },
    {
      id: 'mumbai_artery',
      title: 'Mumbai: Borivali → Bandra Kurla Complex (28.0 km)',
      distanceKm: 28.0,
      iceVehicle: 'App-Cab Petrol Taxi (196 g/km)',
      iceCo2Kg: 5.49,
      iceCostInr: '₹310 (Petrol Fuel)',
      cleanVehicle: 'Mumbai Metro Line 2A/7 (28 g/km)',
      cleanCo2Kg: 0.78,
      cleanCostInr: '₹60 (Metro Ticket)',
      avoidedKg: 4.71,
      source: 'MMRDA Metro Energy Audit & Urban Transport Institute'
    }
  ];

  function init() {
    setupProblemDualRoute();
    setupCitySimulator();
    setupRoadmapAccordion();
    updateCityCalculations();
  }

  /**
   * Chapter 01: Dual Route Interactive Comparison
   */
  function setupProblemDualRoute() {
    var routeButtons = document.querySelectorAll('.problem-route-btn');
    routeButtons.forEach(function (btn, index) {
      btn.addEventListener('click', function () {
        routeButtons.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        var routeIndex = parseInt(btn.getAttribute('data-route-index'), 10);
        displayRouteComparison(routeIndex);
      });
    });

    displayRouteComparison(0);
  }

  function displayRouteComparison(index) {
    var r = routeComparisons[index] || routeComparisons[0];

    setText('probRouteTitle', r.title);
    setText('probIceVehicle', r.iceVehicle);
    setText('probIceCo2', r.iceCo2Kg + ' kg CO2e');
    setText('probIceCost', r.iceCostInr);

    setText('probCleanVehicle', r.cleanVehicle);
    setText('probCleanCo2', r.cleanCo2Kg + ' kg CO2e');
    setText('probCleanCost', r.cleanCostInr);

    setText('probAvoidedDelta', '-' + r.avoidedKg + ' kg CO2e');
    setText('probMethodologySource', 'Source: ' + r.source);

    // Animate visual comparison bars
    var maxKg = Math.max(r.iceCo2Kg, r.cleanCo2Kg);
    var iceBar = document.getElementById('probIceBar');
    var cleanBar = document.getElementById('probCleanBar');

    if (iceBar) iceBar.style.width = '100%';
    if (cleanBar) cleanBar.style.width = Math.round((r.cleanCo2Kg / maxKg) * 100) + '%';
  }

  /**
   * Chapter 07: City Impact Collective Simulator
   */
  function setupCitySimulator() {
    var cityButtons = document.querySelectorAll('.city-select-btn');
    cityButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        cityButtons.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentCityKey = btn.getAttribute('data-city');
        updateCityCalculations();
      });
    });

    var shiftSlider = document.getElementById('cityShiftSlider');
    var shiftDisplay = document.getElementById('cityShiftDisplay');
    if (shiftSlider) {
      shiftSlider.addEventListener('input', function () {
        targetCleanShiftPct = parseInt(shiftSlider.value, 10);
        if (shiftDisplay) shiftDisplay.textContent = targetCleanShiftPct + '%';
        updateCityCalculations();
      });
    }
  }

  function updateCityCalculations() {
    var city = window.MISSION_EV_DATA.cities[currentCityKey] || window.MISSION_EV_DATA.cities.delhi;

    // Daily shifted trips = total daily trips * (targetCleanShiftPct / 100)
    var shiftedTripsDaily = city.dailyTrips * (targetCleanShiftPct / 100);
    
    // Average ICE emissions per trip vs clean multimodal trip
    // Baseline ICE: 196 g/km * avgTripKm
    // Clean mix: ~42 g/km * avgTripKm
    var co2SavedPerTripKg = (city.avgTripKm * (196 - 42)) / 1000;
    
    // Daily CO2 saved (Metric Tons)
    var dailyCo2SavedMetricTons = (shiftedTripsDaily * co2SavedPerTripKg) / 1000;
    // Annual CO2 saved
    var annualCo2SavedMetricTons = dailyCo2SavedMetricTons * 365;

    // PM2.5 particulate reduction (tailpipe particulate mass: ~0.02g PM2.5 per km ICE)
    var annualPm25SavedKg = (shiftedTripsDaily * city.avgTripKm * 0.02 * 365) / 1000;

    // Estimated health economic benefit: ~₹1,200 per metric ton CO2e averted in health externalities
    var annualHealthBenefitCrores = (annualCo2SavedMetricTons * 1400) / 10000000;

    // MEV Token Treasury generation (1 point per kg avoided)
    var annualTokensMintedMillions = (dailyCo2SavedMetricTons * 1000 * 365 * 20) / 1000000;

    setText('citySimName', city.name);
    setText('citySimTrips', (city.dailyTrips / 1000000).toFixed(1) + 'M Trips/Day');
    setText('citySimContext', city.airQualityContext);

    setText('cityAnnualCo2Avoided', Math.round(annualCo2SavedMetricTons).toLocaleString() + ' Metric Tons / Year');
    setText('cityPm25Reduced', Math.round(annualPm25SavedKg).toLocaleString() + ' kg PM2.5 Air Toxins');
    setText('cityHealthSavings', '₹' + annualHealthBenefitCrores.toFixed(1) + ' Crores Healthcare Value');
    setText('cityTokensTreasury', annualTokensMintedMillions.toFixed(1) + 'M MEV Token Economy');

    setText('citySimShiftLabel', targetCleanShiftPct + '% of daily urban journeys transitioned to EV & Metro');
  }

  /**
   * Strategic Roadmap Accordion / Interactive Timeline
   */
  function setupRoadmapAccordion() {
    var items = document.querySelectorAll('.roadmap-item');
    items.forEach(function (item) {
      var header = item.querySelector('.roadmap-header');
      if (header) {
        header.addEventListener('click', function () {
          var isExpanded = item.classList.contains('expanded');
          items.forEach(function (it) { it.classList.remove('expanded'); });
          if (!isExpanded) {
            item.classList.add('expanded');
          }
        });
      }
    });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
