/**
 * MissionEV - Real Web3 Integration Engine for Portal V3 EVM Testnet
 * Supports:
 * - Real Wallet Connection (EIP-1193 / ethers.js v6)
 * - Chain ID Detection & Automatic Network Switching (Chain ID: 420420777)
 * - Read-only Contract Calls via Public Portal V3 RPC
 * - User-authorized On-Chain Transactions to EVMobilityRewards.sol
 * - Real Token Balance Queries via IPortalToken
 * - Clean Separation: Interactive Demo Mode vs Portal V3 Testnet Mode
 */

(function () {
  'use strict';

  var web3State = {
    mode: 'demo', // 'demo' | 'testnet'
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    isCorrectNetwork: false,
    contractAddress: window.PORTAL_V3_CONFIG.defaultContractAddress,
    tokenAddress: window.PORTAL_V3_CONFIG.defaultTokenAddress,
    contract: null,
    readContract: null,
    tokenContract: null,
    nativeGasBalance: '0.00',
    portalTokenBalance: '0.00',
    onChainStats: null,
    isPendingTx: false
  };

  function initWeb3() {
    initReadOnlyProvider();
    setupWalletButtons();
    setupModeToggle();
    setupContractConfigInputs();
    setupOnChainSubmission();
    updateWeb3UI();
  }

  /**
   * Initializes read-only JSON-RPC provider on Portal V3 Testnet
   */
  function initReadOnlyProvider() {
    try {
      if (typeof ethers !== 'undefined') {
        var readProvider = new ethers.JsonRpcProvider(window.PORTAL_V3_CONFIG.rpcUrl);
        web3State.readContract = new ethers.Contract(
          web3State.contractAddress,
          window.EV_MOBILITY_REWARDS_ABI,
          readProvider
        );
      }
    } catch (e) {
      console.warn('Read-only RPC initialization deferred:', e.message);
    }
  }

  function setupWalletButtons() {
    var connectBtns = document.querySelectorAll('.wallet-connect-trigger, #walletConnectBtn');
    connectBtns.forEach(function (btn) {
      btn.addEventListener('click', toggleWalletConnection);
    });

    // Network switch button in warning banners
    var switchNetworkBtn = document.getElementById('switchNetworkBtn');
    if (switchNetworkBtn) {
      switchNetworkBtn.addEventListener('click', switchOrAddPortalNetwork);
    }

    // Listen for provider events if browser wallet exists
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', onAccountsChanged);
      window.ethereum.on('chainChanged', onChainChanged);
    }
  }

  function setupModeToggle() {
    var modeDemoBtn = document.getElementById('web3ModeDemoBtn');
    var modeTestnetBtn = document.getElementById('web3ModeTestnetBtn');

    if (modeDemoBtn && modeTestnetBtn) {
      modeDemoBtn.addEventListener('click', function () {
        setExecutionMode('demo');
      });
      modeTestnetBtn.addEventListener('click', function () {
        setExecutionMode('testnet');
      });
    }
  }

  function setExecutionMode(mode) {
    web3State.mode = mode;
    var modeDemoBtn = document.getElementById('web3ModeDemoBtn');
    var modeTestnetBtn = document.getElementById('web3ModeTestnetBtn');
    var demoBadges = document.querySelectorAll('.web3-demo-indicator');
    var testnetBadges = document.querySelectorAll('.web3-testnet-indicator');
    var onChainControls = document.querySelectorAll('.web3-onchain-control');

    if (modeDemoBtn) modeDemoBtn.classList.toggle('active', mode === 'demo');
    if (modeTestnetBtn) modeTestnetBtn.classList.toggle('active', mode === 'testnet');

    demoBadges.forEach(function (el) { el.style.display = mode === 'demo' ? '' : 'none'; });
    testnetBadges.forEach(function (el) { el.style.display = mode === 'testnet' ? '' : 'none'; });
    onChainControls.forEach(function (el) { el.style.display = mode === 'testnet' ? '' : 'none'; });

    var banner = document.getElementById('web3ModeBanner');
    if (banner) {
      if (mode === 'testnet') {
        banner.className = 'web3-mode-banner testnet-active';
        banner.innerHTML = '<span class="pulse-dot"></span> <b>PORTAL V3 TESTNET MODE ACTIVE:</b> Real transactions will be submitted to <code>' + web3State.contractAddress.substring(0, 10) + '...</code> on Chain ID <code>420420777</code>.';
      } else {
        banner.className = 'web3-mode-banner demo-active';
        banner.innerHTML = '<span>ℹ️</span> <b>DEMO MODE ACTIVE:</b> Calculating emissions locally. No wallet or testnet gas required to explore.';
      }
    }

    if (mode === 'testnet' && !web3State.account) {
      showToast('Connect a Web3 wallet (e.g. MetaMask) on Portal V3 Testnet to submit real transactions.');
    }
  }

  function setupContractConfigInputs() {
    var contractInput = document.getElementById('customContractAddressInput');
    var tokenInput = document.getElementById('customTokenAddressInput');
    var updateBtn = document.getElementById('saveContractAddressesBtn');

    if (contractInput) contractInput.value = web3State.contractAddress;
    if (tokenInput) tokenInput.value = web3State.tokenAddress;

    if (updateBtn) {
      updateBtn.addEventListener('click', function () {
        if (contractInput && ethers.isAddress(contractInput.value.trim())) {
          web3State.contractAddress = contractInput.value.trim();
        }
        if (tokenInput && ethers.isAddress(tokenInput.value.trim())) {
          web3State.tokenAddress = tokenInput.value.trim();
        }
        initReadOnlyProvider();
        if (web3State.signer) {
          rebuildContractInstances();
        }
        showToast('Updated target smart contract addresses on Portal V3');
        refreshOnChainData();
      });
    }
  }

  async function toggleWalletConnection() {
    if (!web3State.account) {
      await connectWallet();
    } else {
      disconnectWallet();
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      showToast('No Ethereum wallet detected. Please install MetaMask or a compatible Web3 browser extension.');
      return;
    }

    try {
      showToast('Connecting wallet...');
      var browserProvider = new ethers.BrowserProvider(window.ethereum);
      var accounts = await browserProvider.send('eth_requestAccounts', []);

      if (accounts && accounts.length > 0) {
        web3State.provider = browserProvider;
        web3State.signer = await browserProvider.getSigner();
        web3State.account = accounts[0];

        var network = await browserProvider.getNetwork();
        web3State.chainId = Number(network.chainId);
        web3State.isCorrectNetwork = (web3State.chainId === window.PORTAL_V3_CONFIG.chainId);

        rebuildContractInstances();
        await refreshOnChainData();

        if (!web3State.isCorrectNetwork) {
          showNetworkMismatchWarning();
          await switchOrAddPortalNetwork();
        } else {
          showToast('Connected: ' + shortenAddress(web3State.account) + ' on Portal V3 Testnet');
          setExecutionMode('testnet');
        }

        updateWeb3UI();
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      if (err.code === 4001) {
        showToast('Wallet connection request rejected by user.');
      } else {
        showToast('Connection failed: ' + (err.message || 'Unknown error'));
      }
    }
  }

  function disconnectWallet() {
    web3State.provider = null;
    web3State.signer = null;
    web3State.account = null;
    web3State.chainId = null;
    web3State.isCorrectNetwork = false;
    web3State.contract = null;
    web3State.tokenContract = null;
    web3State.nativeGasBalance = '0.00';
    web3State.portalTokenBalance = '0.00';
    web3State.onChainStats = null;

    setExecutionMode('demo');
    updateWeb3UI();
    showToast('Wallet disconnected. Returned to demo mode.');
  }

  function rebuildContractInstances() {
    if (web3State.signer && typeof ethers !== 'undefined') {
      try {
        web3State.contract = new ethers.Contract(
          web3State.contractAddress,
          window.EV_MOBILITY_REWARDS_ABI,
          web3State.signer
        );
        web3State.tokenContract = new ethers.Contract(
          web3State.tokenAddress,
          window.PORTAL_TOKEN_ABI,
          web3State.signer
        );
      } catch (e) {
        console.warn('Failed to build contract instances:', e);
      }
    }
  }

  async function switchOrAddPortalNetwork() {
    if (!window.ethereum) return;

    var targetChainHex = window.PORTAL_V3_CONFIG.chainIdHex;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainHex }]
      });
      showToast('Switched network to Portal V3 Testnet!');
    } catch (switchError) {
      // Error code 4902 indicates chain has not been added to wallet
      if (switchError.code === 4902 || switchError.message.includes('4902')) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetChainHex,
              chainName: window.PORTAL_V3_CONFIG.chainName,
              rpcUrls: [window.PORTAL_V3_CONFIG.rpcUrl],
              nativeCurrency: window.PORTAL_V3_CONFIG.nativeCurrency,
              blockExplorerUrls: [window.PORTAL_V3_CONFIG.blockExplorerUrl]
            }]
          });
          showToast('Added Portal V3 Testnet to wallet!');
        } catch (addError) {
          console.error('Failed to add Portal V3 network:', addError);
          showToast('Could not add Portal V3 network: ' + addError.message);
        }
      } else {
        console.error('Failed to switch network:', switchError);
        showToast('Network switch cancelled or failed.');
      }
    }
  }

  function onAccountsChanged(accounts) {
    if (!accounts || accounts.length === 0) {
      disconnectWallet();
    } else {
      web3State.account = accounts[0];
      if (web3State.provider) {
        web3State.provider.getSigner().then(function (sig) {
          web3State.signer = sig;
          rebuildContractInstances();
          refreshOnChainData();
          updateWeb3UI();
          showToast('Active account changed: ' + shortenAddress(web3State.account));
        });
      }
    }
  }

  function onChainChanged(chainIdHex) {
    web3State.chainId = parseInt(chainIdHex, 16);
    web3State.isCorrectNetwork = (web3State.chainId === window.PORTAL_V3_CONFIG.chainId);
    rebuildContractInstances();
    refreshOnChainData();
    updateWeb3UI();
  }

  async function refreshOnChainData() {
    if (!web3State.account) return;

    // 1. Fetch native gas balance (PORTAL)
    try {
      if (web3State.provider) {
        var balWei = await web3State.provider.getBalance(web3State.account);
        web3State.nativeGasBalance = parseFloat(ethers.formatEther(balWei)).toFixed(4);
      }
    } catch (e) {
      console.warn('Failed to read native gas balance:', e.message);
    }

    // 2. Fetch ERC-20 Portal token balance
    try {
      if (web3State.tokenContract) {
        var tokenBal = await web3State.tokenContract.balanceOf(web3State.account);
        var dec = await web3State.tokenContract.decimals();
        web3State.portalTokenBalance = parseFloat(ethers.formatUnits(tokenBal, dec)).toFixed(2);
      }
    } catch (e) {
      console.warn('Failed to read ERC-20 token balance (contract may not be deployed yet):', e.message);
    }

    // 3. Fetch on-chain commuter stats from EVMobilityRewards.sol
    try {
      var contractToUse = web3State.contract || web3State.readContract;
      if (contractToUse) {
        var stats = await contractToUse.getCommuter(web3State.account);
        web3State.onChainStats = {
          score: Number(stats.score),
          streakDays: Number(stats.streakDays),
          totalAvoidedGrams: Number(stats.totalAvoidedGrams),
          totalEmittedGrams: Number(stats.totalEmittedGrams),
          totalTrips: Number(stats.totalTrips),
          rewardsClaimed: Number(stats.rewardsClaimed)
        };
      }
    } catch (e) {
      console.warn('Failed to read on-chain commuter record:', e.message);
    }

    updateWeb3UI();
  }

  function updateWeb3UI() {
    var walletBtn = document.getElementById('walletConnectBtn');
    var networkBanner = document.getElementById('networkMismatchBanner');

    // Header wallet button
    if (walletBtn) {
      if (web3State.account) {
        var netLabel = web3State.isCorrectNetwork ? 'PORTAL V3' : 'WRONG NET';
        var dotClass = web3State.isCorrectNetwork ? 'online' : '';
        walletBtn.innerHTML = '<span class="wallet-dot ' + dotClass + '"></span> ' + shortenAddress(web3State.account) + ' (' + netLabel + ')';
        walletBtn.classList.add('connected');
      } else {
        walletBtn.innerHTML = '<span class="wallet-dot"></span> Connect Testnet Wallet';
        walletBtn.classList.remove('connected');
      }
    }

    // Network warning banner
    if (networkBanner) {
      if (web3State.account && !web3State.isCorrectNetwork) {
        networkBanner.style.display = 'flex';
        var currentNetText = document.getElementById('currentDetectedChain');
        if (currentNetText) currentNetText.textContent = 'Detected Chain ID: ' + (web3State.chainId || 'Unknown');
      } else {
        networkBanner.style.display = 'none';
      }
    }

    // Connected user display elements
    setText('web3ConnectedAccount', web3State.account ? web3State.account : 'Not Connected (Demo Mode)');
    setText('web3NativeGasBal', web3State.nativeGasBalance + ' PORTAL');
    setText('web3TokenBal', web3State.portalTokenBalance + ' MEV');
    setText('web3TargetContract', shortenAddress(web3State.contractAddress));
    setText('web3TargetToken', shortenAddress(web3State.tokenAddress));

    if (web3State.onChainStats) {
      setText('onChainCarbonScore', web3State.onChainStats.score);
      setText('onChainStreak', web3State.onChainStats.streakDays + ' Days');
      setText('onChainTotalAvoided', (web3State.onChainStats.totalAvoidedGrams / 1000).toFixed(2) + ' kg');
      setText('onChainTotalTrips', web3State.onChainStats.totalTrips);
    }
  }

  function showNetworkMismatchWarning() {
    showToast('⚠️ Wrong network detected! Please switch to Portal V3 Testnet (Chain ID 420420777).');
  }

  /**
   * Chapter 03 & 05: Submit Real On-Chain Commute Transaction
   */
  function setupOnChainSubmission() {
    var submitBtn = document.getElementById('submitRealOnChainBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleOnChainCommuteSubmission);
    }
  }

  async function handleOnChainCommuteSubmission() {
    if (web3State.isPendingTx) return;

    if (!web3State.account) {
      showToast('Please connect your Web3 wallet first to submit a real transaction.');
      await connectWallet();
      return;
    }

    if (!web3State.isCorrectNetwork) {
      showToast('Your wallet is on the wrong network. Please switch to Portal V3 Testnet.');
      await switchOrAddPortalNetwork();
      return;
    }

    // Get current parameters from Mobility Lab
    var distanceSlider = document.getElementById('labDistanceSlider');
    var distanceKm = Math.round(parseFloat(distanceSlider ? distanceSlider.value : 25) || 25);
    var activeModeBtn = document.querySelector('.lab-mode-btn.active');
    var modeKey = activeModeBtn ? activeModeBtn.getAttribute('data-mode') : 'ev_car';

    // Map UI mode to contract methods & parameters
    var isEv = (modeKey === 'ev_car' || modeKey === 'ev_2w');
    var isIce = (modeKey === 'petrol_car' || modeKey === 'diesel_car');

    if (!isEv && !isIce) {
      showToast('Notice: ' + modeKey.toUpperCase() + ' is tracked in the Azure Oracle layer. The on-chain EVMobilityRewards contract specifically implements recordEVJourney and recordICEJourney methods.');
    }

    var submitBtn = document.getElementById('submitRealOnChainBtn');
    var txStatusCard = document.getElementById('realTxReceiptCard');
    var txStatusMsg = document.getElementById('realTxStatusMessage');

    try {
      web3State.isPendingTx = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="pulse-dot"></span> Awaiting Signature in Wallet...';
      }
      if (txStatusCard) txStatusCard.style.display = 'block';
      if (txStatusMsg) txStatusMsg.textContent = 'Please confirm the transaction in your wallet extension...';

      // Generate a unique 32-byte journey ID
      var journeyId = ethers.hexlify(ethers.randomBytes(32));

      var tx;
      if (isEv) {
        // Call recordEVJourney(bytes32 journeyId, uint32 distanceKm)
        tx = await web3State.contract.recordEVJourney(journeyId, distanceKm);
      } else {
        // VehicleType enum: 2 = PETROL_REGULAR, 4 = DIESEL_SUV
        var vType = modeKey === 'diesel_car' ? 4 : 2;
        tx = await web3State.contract.recordICEJourney(journeyId, vType, distanceKm, 0);
      }

      if (txStatusMsg) {
        txStatusMsg.innerHTML = 'Broadcasting transaction to Portal V3 mempool...<br><code class="mono hl">' + tx.hash + '</code>';
      }

      showToast('Transaction submitted! Waiting for block confirmation on Portal V3...');

      var receipt = await tx.wait();

      if (receipt.status === 1) {
        if (txStatusMsg) {
          txStatusMsg.innerHTML = '<b class="hl">✅ TRANSACTION CONFIRMED ON PORTAL V3!</b><br>' +
            'Block: #' + receipt.blockNumber + '<br>' +
            'Gas Used: ' + receipt.gasUsed.toString() + '<br>' +
            'Tx Hash: <a href="' + window.PORTAL_V3_CONFIG.blockExplorerUrl + '/tx/' + tx.hash + '" target="_blank" rel="noopener" class="hl" style="text-decoration:underline;">' + tx.hash.substring(0, 16) + '... (View on Explorer)</a>';
        }
        showToast('🎉 Commute successfully recorded on Portal V3 EVM!');
        await refreshOnChainData();
      } else {
        if (txStatusMsg) txStatusMsg.innerHTML = '<b style="color:var(--coral);">❌ Transaction reverted on-chain.</b>';
        showToast('Transaction reverted by contract.');
      }
    } catch (err) {
      console.error('On-chain transaction error:', err);
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        if (txStatusMsg) txStatusMsg.textContent = 'Transaction was rejected in your wallet.';
        showToast('Transaction rejected by user.');
      } else {
        var reason = err.reason || err.shortMessage || err.message;
        if (txStatusMsg) txStatusMsg.innerHTML = '<b style="color:var(--coral);">Transaction Error:</b> ' + reason;
        showToast('Transaction failed: ' + reason);
      }
    } finally {
      web3State.isPendingTx = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Commute to Portal V3 EVM';
      }
    }
  }

  function shortenAddress(addr) {
    if (!addr || addr.length < 10) return addr || '';
    return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function showToast(msg) {
    var toastContainer = document.getElementById('toasts');
    if (!toastContainer) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '⚡ ' + msg;
    toastContainer.appendChild(t);
    setTimeout(function () { t.remove(); }, 4000);
  }

  window.MISSION_EV_WEB3 = {
    state: web3State,
    connectWallet: connectWallet,
    disconnectWallet: disconnectWallet,
    switchOrAddPortalNetwork: switchOrAddPortalNetwork,
    setExecutionMode: setExecutionMode,
    refreshOnChainData: refreshOnChainData
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeb3);
  } else {
    initWeb3();
  }
})();
