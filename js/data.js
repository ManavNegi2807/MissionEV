/**
 * MissionEV Data & Environmental Calculations Engine
 * Built for Build with Bharat 5.0 (Microsoft Azure) & Portaldot Hacker House 2026 (Portal Layer 0 EVM)
 * 
 * Sources & Methodologies:
 * - Central Electricity Authority (CEA) CO2 Baseline Database for the Indian Power Sector (Avg Grid Factor: ~0.71 kg CO2e/kWh)
 * - IPCC Guidelines for National Greenhouse Gas Inventories (Mobile Combustion)
 * - India GHG Programme Mobile Emission Factors
 * - All estimations are clearly distinguished as simulated illustrative figures for hackathon demonstration.
 */

const MISSION_EV_DATA = {
  // Emission Factors in grams CO2e per passenger-kilometer
  emissionFactors: {
    ev_car: {
      id: 'ev_car',
      name: 'Electric Car (BEV)',
      category: 'clean',
      tailpipe_g_km: 0,
      lifecycle_grid_g_km: 68,     // India avg grid mix (~15 kWh/100km @ 0.71 kg CO2/kWh + battery amort)
      lifecycle_green_g_km: 15,    // Solar / Green tariff (<0.10 kg CO2/kWh)
      efficiency_desc: '15.2 kWh / 100 km',
      icon: 'zap',
      color: '#B8FF45',
      badge: 'Zero Direct Tailpipe'
    },
    ev_2w: {
      id: 'ev_2w',
      name: 'Electric 2-Wheeler (EV Scooter)',
      category: 'clean',
      tailpipe_g_km: 0,
      lifecycle_grid_g_km: 24,     // ~3.2 kWh/100km @ 0.71 kg CO2/kWh
      lifecycle_green_g_km: 6,
      efficiency_desc: '3.2 kWh / 100 km',
      icon: 'bike',
      color: '#20D89A',
      badge: 'High Urban Efficiency'
    },
    metro: {
      id: 'metro',
      name: 'Metro Transit (Passenger Rail)',
      category: 'clean',
      tailpipe_g_km: 0,
      lifecycle_grid_g_km: 28,     // High-capacity electric mass rapid transit per passenger
      lifecycle_green_g_km: 12,
      efficiency_desc: '0.04 kWh / passenger-km',
      icon: 'train',
      color: '#00F0FF',
      badge: 'Mass Decarbonizer'
    },
    ebus: {
      id: 'ebus',
      name: 'Electric Bus (e-Bus)',
      category: 'clean',
      tailpipe_g_km: 0,
      lifecycle_grid_g_km: 35,     // Shared urban electric bus per passenger
      lifecycle_green_g_km: 14,
      efficiency_desc: '1.1 kWh/km / 32 passengers',
      icon: 'bus',
      color: '#70FF94',
      badge: 'Shared Clean Fleet'
    },
    active: {
      id: 'active',
      name: 'Walking & Cycling',
      category: 'zero',
      tailpipe_g_km: 0,
      lifecycle_grid_g_km: 0,
      lifecycle_green_g_km: 0,
      efficiency_desc: '100% Human Powered',
      icon: 'footprints',
      color: '#E0FF85',
      badge: '100% Zero Emission'
    },
    petrol_car: {
      id: 'petrol_car',
      name: 'Petrol Car (ICE Compact/Sedan)',
      category: 'fossil',
      tailpipe_g_km: 165,
      lifecycle_grid_g_km: 196,    // Well-to-wheel (~14.5 km/L petrol)
      lifecycle_green_g_km: 196,
      efficiency_desc: '14.5 km / Litre Petrol',
      icon: 'car',
      color: '#FF6B4A',
      badge: 'High Urban Tailpipe'
    },
    diesel_car: {
      id: 'diesel_car',
      name: 'Diesel SUV / Taxi',
      category: 'fossil',
      tailpipe_g_km: 184,
      lifecycle_grid_g_km: 224,    // Well-to-wheel (~13.0 km/L diesel)
      lifecycle_green_g_km: 224,
      efficiency_desc: '13.0 km / Litre Diesel',
      icon: 'truck',
      color: '#FF4136',
      badge: 'High PM2.5 & NOx'
    }
  },

  baselines: {
    petrol_avg: {
      id: 'petrol_avg',
      name: 'Petrol Sedan Baseline (196 g CO2e/km)',
      factor_g_km: 196,
      notes: 'Typical privately owned Indian commuter car'
    },
    diesel_suv: {
      id: 'diesel_suv',
      name: 'Diesel SUV / Cab Baseline (224 g CO2e/km)',
      factor_g_km: 224,
      notes: 'Popular app-cab ride-hailing and fleet ICE vehicles'
    },
    urban_mix: {
      id: 'urban_mix',
      name: 'Indian Urban Commute Avg (162 g CO2e/km)',
      factor_g_km: 162,
      notes: 'Weighted fleet average across 2W, 3W auto and 4W ICE'
    }
  },

  // City Scenarios for Chapter 07 City Simulator
  cities: {
    delhi: {
      id: 'delhi',
      name: 'Delhi NCR',
      dailyTrips: 24500000,
      avgTripKm: 11.2,
      currentCleanShare: 0.22,
      gridIntensity_kg_kWh: 0.72,
      population: '33 Million',
      airQualityContext: 'Severely affected by vehicular NOx and winter PM2.5 smog'
    },
    bengaluru: {
      id: 'bengaluru',
      name: 'Bengaluru Tech Corridor',
      dailyTrips: 13800000,
      avgTripKm: 9.6,
      currentCleanShare: 0.18,
      gridIntensity_kg_kWh: 0.65,
      population: '14 Million',
      airQualityContext: 'Peak hour congestion bottlenecks with high 2W density'
    },
    mumbai: {
      id: 'mumbai',
      name: 'Mumbai MMR',
      dailyTrips: 18200000,
      avgTripKm: 14.5,
      currentCleanShare: 0.35,
      gridIntensity_kg_kWh: 0.69,
      population: '21 Million',
      airQualityContext: 'Heavy local suburban railway backbone plus evolving metro network'
    }
  },

  // Sample User Profiles for Chapter 04
  profiles: {
    aarav: {
      id: 'aarav',
      name: 'Aarav Sharma',
      tagline: 'EV Pioneer & Metro Commuter',
      avatar: 'AS',
      city: 'Delhi NCR',
      carbonScore: 842,
      scoreTier: 'Econaut Master (Top 3%)',
      streakDays: 18,
      totalAvoidedKg: 142.8,
      totalTrips: 84,
      weeklyDistanceKm: 168.4,
      favoriteMode: 'ev_car',
      walletAddress: '0x7B2F...39e1',
      tokenBalance: '1,428 MEV',
      trips: [
        { id: 'tx-8941', date: 'Today, 09:15 AM', route: 'CyberHub → Connaught Place', distanceKm: 26.4, mode: 'ev_car', actualKg: 1.80, baselineKg: 5.17, avoidedKg: 3.37, points: 68, txHash: '0x8a9c41...bf02', status: 'Verified on Portal EVM' },
        { id: 'tx-8938', date: 'Yesterday, 06:40 PM', route: 'Barakhamba Road → Noida Sec 62', distanceKm: 18.2, mode: 'metro', actualKg: 0.51, baselineKg: 3.57, avoidedKg: 3.06, points: 62, txHash: '0x3f1e92...cc74', status: 'Verified on Portal EVM' },
        { id: 'tx-8924', date: '24 Oct, 08:30 AM', route: 'Saket Metro → Hauz Khas Park', distanceKm: 4.8, mode: 'active', actualKg: 0.00, baselineKg: 0.94, avoidedKg: 0.94, points: 28, txHash: '0x1b45aa...8810', status: 'Verified on Portal EVM' },
        { id: 'tx-8919', date: '23 Oct, 07:15 PM', route: 'Aerocity → Dwarka Sector 21', distanceKm: 12.6, mode: 'ev_car', actualKg: 0.86, baselineKg: 2.47, avoidedKg: 1.61, points: 40, txHash: '0x99e210...de51', status: 'Verified on Portal EVM' },
        { id: 'tx-8902', date: '22 Oct, 09:00 AM', route: 'Nehru Place → Pragati Maidan', distanceKm: 9.8, mode: 'ebus', actualKg: 0.34, baselineKg: 1.92, avoidedKg: 1.58, points: 38, txHash: '0x62dbca...1109', status: 'Verified on Portal EVM' },
        { id: 'tx-8889', date: '21 Oct, 06:30 PM', route: 'Gurgaon Sec 56 → DLF Phase 1', distanceKm: 6.2, mode: 'ev_2w', actualKg: 0.15, baselineKg: 1.22, avoidedKg: 1.07, points: 30, txHash: '0x44fa78...a332', status: 'Verified on Portal EVM' },
        { id: 'tx-8874', date: '20 Oct, 08:15 AM', route: 'Noida Sec 18 → Okhla Phase 3', distanceKm: 11.5, mode: 'metro', actualKg: 0.32, baselineKg: 2.25, avoidedKg: 1.93, points: 44, txHash: '0x22ec14...5510', status: 'Verified on Portal EVM' }
      ]
    },
    priya: {
      id: 'priya',
      name: 'Priya Patel',
      tagline: 'Multimodal Urbanist & Cyclist',
      avatar: 'PP',
      city: 'Bengaluru',
      carbonScore: 785,
      scoreTier: 'Green Champion',
      streakDays: 9,
      totalAvoidedKg: 98.4,
      totalTrips: 62,
      weeklyDistanceKm: 122.0,
      favoriteMode: 'active',
      walletAddress: '0x4E91...61cB',
      tokenBalance: '984 MEV',
      trips: [
        { id: 'tx-7712', date: 'Today, 08:45 AM', route: 'Indiranagar → Embassy GolfLinks', distanceKm: 6.8, mode: 'active', actualKg: 0.00, baselineKg: 1.33, avoidedKg: 1.33, points: 35, txHash: '0x712a88...ff41', status: 'Verified on Portal EVM' },
        { id: 'tx-7705', date: 'Yesterday, 07:10 PM', route: 'Domlur → Koramangala 4th Block', distanceKm: 4.5, mode: 'ev_2w', actualKg: 0.11, baselineKg: 0.88, avoidedKg: 0.77, points: 24, txHash: '0x94bb23...819a', status: 'Verified on Portal EVM' },
        { id: 'tx-7689', date: '24 Oct, 09:10 AM', route: 'MG Road → Baiyappanahalli Metro', distanceKm: 8.2, mode: 'metro', actualKg: 0.23, baselineKg: 1.61, avoidedKg: 1.38, points: 34, txHash: '0x55bc10...32f1', status: 'Verified on Portal EVM' },
        { id: 'tx-7672', date: '23 Oct, 06:50 PM', route: 'Whitefield ITPL → Mahadevapura', distanceKm: 7.4, mode: 'ebus', actualKg: 0.26, baselineKg: 1.45, avoidedKg: 1.19, points: 31, txHash: '0x12dc55...44e7', status: 'Verified on Portal EVM' }
      ]
    },
    rohan: {
      id: 'rohan',
      name: 'Rohan Verma',
      tagline: 'Hybrid Transitioner',
      avatar: 'RV',
      city: 'Mumbai',
      carbonScore: 590,
      scoreTier: 'Decarbonizing Novice',
      streakDays: 4,
      totalAvoidedKg: 38.6,
      totalTrips: 31,
      weeklyDistanceKm: 94.5,
      favoriteMode: 'ev_car',
      walletAddress: '0x11A0...98d4',
      tokenBalance: '386 MEV',
      trips: [
        { id: 'tx-5510', date: 'Today, 10:00 AM', route: 'BKC → Lower Parel', distanceKm: 14.2, mode: 'ev_car', actualKg: 0.97, baselineKg: 2.78, avoidedKg: 1.81, points: 42, txHash: '0x66fe44...aa23', status: 'Verified on Portal EVM' },
        { id: 'tx-5498', date: 'Yesterday, 08:30 PM', route: 'Andheri West → Bandra West', distanceKm: 11.0, mode: 'petrol_car', actualKg: 2.16, baselineKg: 2.16, avoidedKg: 0.00, points: 0, txHash: '0x9901aa...10b4', status: 'High Emissions Logged' }
      ]
    }
  },

  // Achievements Database
  badges: [
    { id: 'badge-1', name: 'Zero Tailpipe Starter', icon: 'zap', desc: 'Completed first 5 trips with 100% electric propulsion', unlocked: true, date: '12 Oct 2026' },
    { id: 'badge-2', name: 'Centurion Decarbonizer', icon: 'shield', desc: 'Avoided over 100 kg CO2e versus standard ICE baselines', unlocked: true, date: '19 Oct 2026' },
    { id: 'badge-3', name: 'Transit Maestro', icon: 'train', desc: 'Used Metro or Electric Bus for 10 consecutive weekdays', unlocked: true, date: '22 Oct 2026' },
    { id: 'badge-4', name: 'Solar Grid Sync', icon: 'sun', desc: 'Charged EV during midday peak solar generation hours', unlocked: false, progress: '3 / 5 Trips' },
    { id: 'badge-5', name: '30-Day Clean Streak', icon: 'flame', desc: 'Maintained 30 uninterrupted days of clean commuting', unlocked: false, progress: '18 / 30 Days' },
    { id: 'badge-6', name: 'Portal On-Chain Legend', icon: 'award', desc: 'Accumulated over 1,000 verified on-chain MEV reward tokens', unlocked: true, date: '25 Oct 2026' }
  ],

  // Leaderboard data
  leaderboard: [
    { rank: 1, name: 'Ananya S.', avatar: 'AS', city: 'Bengaluru', avoidedKg: 312.4, score: 968, streak: 42, badge: 'Eco Titan' },
    { rank: 2, name: 'Vikram Joshi', avatar: 'VJ', city: 'Delhi NCR', avoidedKg: 284.1, score: 942, streak: 35, badge: 'Metro Guru' },
    { rank: 3, name: 'Simran Kaur', avatar: 'SK', city: 'Mumbai', avoidedKg: 246.8, score: 915, streak: 28, badge: 'EV Champion' },
    { rank: 4, name: 'Aarav Sharma (You)', avatar: 'AS', city: 'Delhi NCR', avoidedKg: 142.8, score: 842, streak: 18, badge: 'Econaut' },
    { rank: 5, name: 'Devendra P.', avatar: 'DP', city: 'Pune', avoidedKg: 139.2, score: 830, streak: 14, badge: 'Transit Pro' },
    { rank: 6, name: 'Priya Patel', avatar: 'PP', city: 'Bengaluru', avoidedKg: 98.4, score: 785, streak: 9, badge: 'Active Urbanist' }
  ],

  // Core Calculation Function
  calculate: function(distanceKm, modeKey, baselineKey = 'petrol_avg', useGreenTariff = false) {
    const mode = this.emissionFactors[modeKey] || this.emissionFactors.ev_car;
    const baseline = this.baselines[baselineKey] || this.baselines.petrol_avg;
    
    // Choose lifecycle factor based on grid clean energy setting
    const factor_g_km = useGreenTariff ? mode.lifecycle_green_g_km : mode.lifecycle_grid_g_km;
    
    // Emissions in kilograms
    const journeyEmissionsKg = (distanceKm * factor_g_km) / 1000;
    const baselineEmissionsKg = (distanceKm * baseline.factor_g_km) / 1000;
    const avoidedKg = Math.max(0, baselineEmissionsKg - journeyEmissionsKg);
    const tailpipeKg = (distanceKm * mode.tailpipe_g_km) / 1000;
    
    // MissionEV Reward Points rule (illustrative demo logic)
    // 1 kg avoided CO2 = 20 points base + mode bonus
    let modeBonus = 5;
    if (mode.category === 'zero') modeBonus = 15;
    if (mode.category === 'clean') modeBonus = 10;
    if (mode.category === 'fossil') modeBonus = 0;
    
    const rewardPoints = Math.round(avoidedKg * 20 + (avoidedKg > 0 ? modeBonus : 0));
    
    // Carbon Score Impact (+/- points)
    let scoreDelta = 0;
    if (avoidedKg > 2.0) scoreDelta = +8;
    else if (avoidedKg > 0.5) scoreDelta = +4;
    else if (avoidedKg > 0) scoreDelta = +2;
    else scoreDelta = -5; // ICE penalty for higher emission than baseline

    return {
      distanceKm: parseFloat(distanceKm),
      mode,
      baseline,
      useGreenTariff,
      factor_g_km,
      journeyEmissionsKg: parseFloat(journeyEmissionsKg.toFixed(2)),
      baselineEmissionsKg: parseFloat(baselineEmissionsKg.toFixed(2)),
      avoidedKg: parseFloat(avoidedKg.toFixed(2)),
      tailpipeKg: parseFloat(tailpipeKg.toFixed(2)),
      rewardPoints: Math.max(0, rewardPoints),
      scoreDelta,
      treesEquivalent: (avoidedKg / 0.06).toFixed(1), // Average tree absorbs ~60g CO2/day
      percentReduction: baselineEmissionsKg > 0 ? Math.round((avoidedKg / baselineEmissionsKg) * 100) : 0
    };
  }
};

window.MISSION_EV_DATA = MISSION_EV_DATA;
