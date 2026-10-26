/**
 * MissionEV Web3 Contract Configuration & ABIs
 * Portal V3 EVM Testnet (Chain ID 420420777)
 * Contract: EVMobilityRewards.sol & IPortalToken.sol
 */

const PORTAL_V3_CONFIG = {
  chainId: 420420777,
  chainIdHex: '0x190f0b49',
  chainName: 'Portal V3 Testnet',
  rpcUrl: 'https://test-evm-rpc-v3.portaldot.dev',
  wsUrl: 'wss://test-node-v3.portaldot.dev',
  blockExplorerUrl: 'https://test-explorer-v3.portaldot.dev',
  nativeCurrency: {
    name: 'Portal Testnet Gas',
    symbol: 'PORTAL',
    decimals: 18
  },
  // Contract deployment address slot (can be overridden by user in the UI)
  defaultContractAddress: '0x71C8a93B26F7d0c8B2A9e4210e7b931920F039a8',
  defaultTokenAddress: '0x3A5d764C09B192A0284e88102847291048201948'
};

const EV_MOBILITY_REWARDS_ABI = [
  // Functions
  "function recordEVJourney(bytes32 journeyId, uint32 distanceKm) external",
  "function recordICEJourney(bytes32 journeyId, uint8 vehicleType, uint32 distanceKm, uint32 customMileageKmPerLitre) external",
  "function getCommuter(address commuter) external view returns (uint256 score, uint256 streakDays, uint256 lastTripTimestamp, uint256 totalAvoidedGrams, uint256 totalEmittedGrams, uint256 totalTrips, uint256 rewardsClaimed, uint256 tokenBalance)",
  "function getUserJourneyCount(address commuter) external view returns (uint256)",
  "function processedJourneys(bytes32) external view returns (bool)",
  "function owner() external view returns (address)",
  "function oracle() external view returns (address)",
  "function portalToken() external view returns (address)",
  // Events
  "event JourneyLogged(bytes32 indexed journeyId, address indexed commuter, uint8 vehicleType, uint32 distanceKm, uint32 customMileage, uint32 co2Grams, bool isReward, uint256 tokenReward)",
  "event RewardClaimed(address indexed commuter, uint256 amount)",
  "event ScoreAdjusted(address indexed commuter, uint256 oldScore, uint256 newScore)"
];

const PORTAL_TOKEN_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

window.PORTAL_V3_CONFIG = PORTAL_V3_CONFIG;
window.EV_MOBILITY_REWARDS_ABI = EV_MOBILITY_REWARDS_ABI;
window.PORTAL_TOKEN_ABI = PORTAL_TOKEN_ABI;
