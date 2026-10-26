/**
 * MissionEV - Chapters 05 & 06: Web3 Reward Engine & Azure Architecture
 * Features:
 * - 5-Stage Animated Pipeline Inspector with interactive deep-dives
 * - Portal Layer 0 EVM Transaction Simulator with realistic state machine
 * - Simulated Wallet Connection (and window.ethereum detection)
 * - 4-Layer Interactive Cloud + Blockchain Architecture Visualizer
 */

(function () {
  'use strict';

  var currentTxState = 'idle'; // 'idle' | 'generating' | 'signing' | 'broadcasting' | 'confirmed'
  var isWalletConnected = false;
  var walletAddress = '0x7B2F...39e1';
  var simulatedBlockNumber = 4891024;

  // Active sync data from Mobility Lab
  var activeTripData = {
    distanceKm: 25.0,
    modeName: 'Electric Car (BEV)',
    avoidedKg: 3.20,
    rewardPoints: 69,
    modeCategory: 'clean'
  };

  // Expose global hook for Mobility Lab to update Web3 preview
  window.MISSION_EV_SYNC_TX = function (calcRes) {
    activeTripData.distanceKm = calcRes.distanceKm;
    activeTripData.modeName = calcRes.mode.name;
    activeTripData.avoidedKg = calcRes.avoidedKg;
    activeTripData.rewardPoints = calcRes.rewardPoints;
    activeTripData.modeCategory = calcRes.mode.category;

    updateTxPreview();
  };

  function init() {
    setupPipelineInteractions();
    setupTxSimulator();
    setupWalletConnector();
    setupArchitectureExplorer();
    updateTxPreview();
  }

  /**
   * Chapter 05: 5-Stage Web3 Pipeline Interactions
   */
  var pipelineDetails = {
    step1: {
      title: '01 / JOURNEY INPUT & TELEMETRY',
      subtitle: 'Commuter Logs Route via Client App or Telemetry Gateway',
      body: 'The commuter records a trip in the MissionEV client. Route coordinates, distance, and transit mode are captured. In future phases, Azure IoT Edge and OBD-II automotive dongles can feed verified vehicle telemetry directly.',
      badge: 'CLIENT LAYER • SIMULATED INPUT'
    },
    step2: {
      title: '02 / AZURE ORACLE COMPUTATION',
      subtitle: 'Azure Functions Compute Baseline vs Actual Emissions',
      body: 'Serverless Azure Functions parse trip parameters against the CEA (Central Electricity Authority) grid emission database. The engine deterministically computes avoided CO2e kilograms and generates a cryptographically signed payload.',
      badge: 'MICROSOFT AZURE • DETERMINISTIC ORACLE'
    },
    step3: {
      title: '03 / SMART CONTRACT VERIFICATION',
      subtitle: 'MissionEV.sol Evaluates Carbon Reward Rules',
      body: 'The Solidity contract on Portal Layer 0 EVM receives the oracle signature. It verifies that the commuter has not exceeded daily travel allowances, validates streak multipliers, and computes $MEV tokens earned.',
      badge: 'PORTAL LAYER 0 • SOLIDITY CONTRACT'
    },
    step4: {
      title: '04 / EVM STATE TRANSITION',
      subtitle: 'Gas-Optimized On-Chain Minting & Streak Update',
      body: 'Portal Layer 0 executes the state change. The commuter\'s on-chain carbon score is updated, clean-transit badges are minted as ERC-721/1155 tokens, and $MEV reward points are credited to the user\'s non-custodial wallet.',
      badge: 'PORTAL EVM • LOW LATENCY CONSENSUS'
    },
    step5: {
      title: '05 / ON-CHAIN RECORD & EXPLORER',
      subtitle: 'Immutable, Publicly Auditable Proof of Clean Mobility',
      body: 'The transaction is permanently sealed in an EVM block. Commuters, municipal planners, and ESG auditors can inspect the transaction hash on the block explorer without exposing private personal trip GPS routes.',
      badge: 'PUBLIC LEDGER • ZERO KNOWLEDGE AUDIT'
    }
  };

  function setupPipelineInteractions() {
    var steps = document.querySelectorAll('.pipeline-step-node');
    steps.forEach(function (step) {
      step.addEventListener('click', function () {
        steps.forEach(function (s) { s.classList.remove('active'); s.setAttribute('aria-pressed', 'false'); });
        step.classList.add('active');
        step.setAttribute('aria-pressed', 'true');
        var stepKey = step.getAttribute('data-step');
        showPipelineDetail(stepKey);
      });
      step.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var stepKey = step.getAttribute('data-step');
          showPipelineDetail(stepKey);
        }
      });
    });

    // Default to step 3 (Smart contract verification)
    showPipelineDetail('step3');
  }

  function showPipelineDetail(key) {
    var info = pipelineDetails[key];
    if (!info) return;

    setText('pipelineDetailTitle', info.title);
    setText('pipelineDetailSub', info.subtitle);
    setText('pipelineDetailBody', info.body);
    setText('pipelineDetailBadge', info.badge);
  }

  /**
   * Chapter 05: Interactive Transaction Simulator
   */
  function setupTxSimulator() {
    var simulateBtn = document.getElementById('simulateTxBtn');
    if (simulateBtn) {
      simulateBtn.addEventListener('click', startTransactionSimulation);
    }
  }

  function updateTxPreview() {
    setText('txPreviewMode', activeTripData.modeName);
    setText('txPreviewDist', activeTripData.distanceKm + ' km');
    setText('txPreviewAvoided', activeTripData.avoidedKg + ' kg CO2e');
    setText('txPreviewTokens', '+' + activeTripData.rewardPoints + ' MEV');

    var callCode = 'MissionEV.recordCommute(\n' +
      '  bytes32 tripId = 0x' + Math.floor(Math.random() * 899999 + 100000) + '...f9,\n' +
      '  uint8 mode = ' + (activeTripData.modeCategory === 'clean' ? '1 /* EV */' : '4 /* Transit */') + ',\n' +
      '  uint32 distanceMeters = ' + Math.round(activeTripData.distanceKm * 1000) + ',\n' +
      '  uint32 co2AvoidedGrams = ' + Math.round(activeTripData.avoidedKg * 1000) + '\n' +
      ');';

    var codeEl = document.getElementById('txSolidityCall');
    if (codeEl) codeEl.textContent = callCode;
  }

  function startTransactionSimulation() {
    if (currentTxState !== 'idle' && currentTxState !== 'confirmed') return;

    var btn = document.getElementById('simulateTxBtn');
    var statusCard = document.getElementById('txStatusCard');
    var stateLabel = document.getElementById('txStateLabel');
    var progressBar = document.getElementById('txProgressBar');

    if (!btn || !statusCard) return;

    btn.disabled = true;
    currentTxState = 'generating';
    statusCard.className = 'tx-status-card running';
    if (stateLabel) stateLabel.textContent = 'STAGE 1/4: Generating Azure Oracle Proof...';
    if (progressBar) progressBar.style.width = '25%';

    setTimeout(function () {
      currentTxState = 'signing';
      if (stateLabel) stateLabel.textContent = 'STAGE 2/4: Simulating EIP-712 Commuter Signature...';
      if (progressBar) progressBar.style.width = '50%';

      setTimeout(function () {
        currentTxState = 'broadcasting';
        if (stateLabel) stateLabel.textContent = 'STAGE 3/4: Broadcasting to Portal Layer 0 EVM Mempool...';
        if (progressBar) progressBar.style.width = '75%';

        setTimeout(function () {
          currentTxState = 'confirmed';
          simulatedBlockNumber++;
          var fakeHash = '0x' + Array.from({length: 40}, function() { return Math.floor(Math.random()*16).toString(16); }).join('');

          statusCard.className = 'tx-status-card success';
          if (stateLabel) stateLabel.innerHTML = 'STAGE 4/4: <span class="hl">TRANSACTION MINED ON PORTAL EVM!</span>';
          if (progressBar) progressBar.style.width = '100%';

          // Populate receipt
          setText('txReceiptHash', fakeHash.substring(0, 10) + '...' + fakeHash.substring(34));
          setText('txReceiptBlock', '#' + simulatedBlockNumber.toLocaleString());
          setText('txReceiptGas', '46,128 Gwei (0.00012 PORTAL)');
          setText('txReceiptEvent', 'CommuteVerified(commuter: ' + walletAddress + ', reward: +' + activeTripData.rewardPoints + ' MEV)');

          btn.disabled = false;
          btn.textContent = 'Simulate Another Commute Mint';

          showToast('🎉 Transaction confirmed! Minted +' + activeTripData.rewardPoints + ' MEV on Portal EVM');
        }, 1100);
      }, 900);
    }, 800);
  }

  /**
   * Wallet Connector
   */
  function setupWalletConnector() {
    var walletBtn = document.getElementById('walletConnectBtn');
    if (!walletBtn) return;

    walletBtn.addEventListener('click', function () {
      if (!isWalletConnected) {
        // Attempt browser ethereum detection if available
        if (window.ethereum) {
          window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(function (accounts) {
              if (accounts && accounts[0]) {
                walletAddress = accounts[0].substring(0, 6) + '...' + accounts[0].substring(38);
                connectWalletSuccess();
              } else {
                useSimulatedWallet();
              }
            })
            .catch(function () {
              useSimulatedWallet();
            });
        } else {
          useSimulatedWallet();
        }
      } else {
        disconnectWallet();
      }
    });
  }

  function useSimulatedWallet() {
    walletAddress = '0x7B2F...39e1';
    connectWalletSuccess();
    showToast('Connected Portal Layer 0 Testnet Wallet (Simulated)');
  }

  function connectWalletSuccess() {
    isWalletConnected = true;
    var walletBtn = document.getElementById('walletConnectBtn');
    if (walletBtn) {
      walletBtn.innerHTML = '<span class="wallet-dot online"></span> ' + walletAddress + ' (PORTAL TESTNET)';
      walletBtn.classList.add('connected');
    }
    setText('dashWalletAddress', walletAddress);
  }

  function disconnectWallet() {
    isWalletConnected = false;
    var walletBtn = document.getElementById('walletConnectBtn');
    if (walletBtn) {
      walletBtn.innerHTML = '<span class="wallet-dot"></span> Connect Testnet Wallet';
      walletBtn.classList.remove('connected');
    }
    showToast('Wallet disconnected');
  }

  /**
   * Chapter 06: 4-Layer Interactive Architecture Explorer
   */
  var architectureSpecs = {
    layer1: {
      name: 'LAYER 1: CLIENT FRONTEND EXPERIENCE',
      role: 'Cross-Platform Progressive Web App & Commuter Telemetry Interface',
      synergy: 'Provides seamless zero-barrier journey logging, interactive emissions lab, and non-custodial wallet integration for commuters across mobile, tablet, and desktop.',
      techStack: 'HTML5 Semantic, Modern Vanilla CSS Design System, WebGL/Canvas2D, Ethers.js v6, ServiceWorkers for offline trip queueing.',
      status: 'Implemented in current hackathon prototype'
    },
    layer2: {
      name: 'LAYER 2: MICROSOFT AZURE CLOUD BACKEND',
      role: 'Deterministic Emissions Oracle, Geofencing & Event Streaming',
      synergy: 'Azure Functions calculate lifecycle emissions against CEA baseline databases in real-time. Azure Maps performs route snap-to-road distance validation and detects congestion corridors. Azure Event Hubs streams connected EV vehicle telemetry.',
      techStack: 'Azure Functions (Serverless Node/C#), Azure Maps REST APIs, Azure Event Hubs, Azure API Management, Azure Key Vault for oracle signing keys.',
      status: 'Target architecture defined with simulated endpoints'
    },
    layer3: {
      name: 'LAYER 3: PORTAL LAYER 0 EVM ECOSYSTEM',
      role: 'Decentralized Reward Logic, Cross-Chain Liquidity & Verifiable Audit',
      synergy: 'EVM-compatible Solidity smart contracts enforce reward tokenomics without central counterparty risk. Portal Layer 0 provides sub-second finality, negligible gas fees for frequent commute micro-rewards, and cross-chain interoperability.',
      techStack: 'Solidity 0.8.24, MissionEV.sol, ERC-20 ($MEV token), ERC-721 Clean Transit Badges, Portal Layer 0 RPC Nodes.',
      status: 'Contract specifications modeled with interactive state simulator'
    },
    layer4: {
      name: 'LAYER 4: STORAGE & ENTERPRISE ANALYTICS',
      role: 'Municipal Carbon Accounting & Scalable Commuter Graph',
      synergy: 'Azure Cosmos DB stores encrypted commuter trip histories and streak records with sub-10ms global SLA. Power BI & Microsoft Fabric ingest aggregated, anonymized trip records to provide municipal city planners with macro carbon curtailment dashboards.',
      techStack: 'Azure Cosmos DB (NoSQL API), Microsoft Fabric, Power BI Embedded, Azure Monitor & Application Insights.',
      status: 'Target architecture for Phase 2 ecosystem expansion'
    }
  };

  function setupArchitectureExplorer() {
    var layers = document.querySelectorAll('.arch-layer-card');
    layers.forEach(function (card) {
      card.addEventListener('click', function () {
        layers.forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        card.classList.add('active');
        card.setAttribute('aria-pressed', 'true');
        var layerKey = card.getAttribute('data-layer');
        displayArchitectureSpec(layerKey);
        pulseArchitectureDataPath(layerKey);
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var layerKey = card.getAttribute('data-layer');
          displayArchitectureSpec(layerKey);
          pulseArchitectureDataPath(layerKey);
        }
      });
    });

    // Default to Layer 2 (Azure)
    displayArchitectureSpec('layer2');
  }

  function displayArchitectureSpec(key) {
    var spec = architectureSpecs[key];
    if (!spec) return;

    setText('archSpecName', spec.name);
    setText('archSpecRole', spec.role);
    setText('archSpecSynergy', spec.synergy);
    setText('archSpecTech', spec.techStack);
    setText('archSpecStatus', spec.status);
  }

  function pulseArchitectureDataPath(key) {
    var connectorLines = document.querySelectorAll('.arch-bus-connector');
    connectorLines.forEach(function (line) {
      line.classList.remove('pulsing');
      void line.offsetWidth; // Trigger reflow
      line.classList.add('pulsing');
    });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function showToast(msg) {
    var toastContainer = document.getElementById('toasts');
    if (!toastContainer) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '⚡ ' + msg;
    toastContainer.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
