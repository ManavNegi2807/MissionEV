# MissionEV — Living Climate Intelligence

> **Build with Bharat 5.0 (Microsoft Azure Ecosystem) × Portaldot Hacker House 2026 (Portal Layer 0 EVM Ecosystem)**  
> *A "Strava for Carbon" gamified clean-mobility experience with transparent emissions modeling, verifiable smart contracts, and cloud intelligence.*

---

## ⚡ Web3 Integration: Portal V3 EVM & EVMobilityRewards.sol

MissionEV features a real, dual-mode Web3 architecture deployed on the **Portal V3 EVM Testnet (Chain ID `420420777`)**:

### 1. Dual Execution Modes
- **🎮 Interactive Demo Mode**: 
  - Allows full exploration of the Mobility Lab, problem comparison, profile dashboard, and city simulator without requiring a Web3 wallet or gas.
  - Transparently labels emissions and rewards as client-side modeled estimations. Never fabricates on-chain transaction hashes or blockchain confirmations.
- **⛓️ Portal V3 Testnet Mode**:
  - Connects to the user's Web3 wallet (MetaMask, Rabby, etc.) via `ethers.js` (v6).
  - Automatically verifies the connected network and prompts the user to switch or add **Portal V3 Testnet** (Chain ID: `420420777`, RPC: `https://test-evm-rpc-v3.portaldot.dev`).
  - Queries real native gas balances (`PORTAL`) and ERC-20 reward token balances from `IPortalToken`.
  - Submits user-authorized transactions to the `EVMobilityRewards.sol` smart contract and awaits true on-chain block confirmation.

---

### 2. Smart Contract Interface (`EVMobilityRewards.sol`)

The smart contract is located at [`contracts/EVMobilityRewards.sol`](file:///c:/Users/Dell/Desktop/Hack/contracts/EVMobilityRewards.sol).

#### Methods & Mechanics
- `recordEVJourney(bytes32 journeyId, uint32 distanceKm)`:
  - Validates trip distance (`1` to `500` km) and ensures `processedJourneys[journeyId]` has not been previously executed (duplicate trip prevention).
  - Calculates avoided CO2 against the CEA baseline (`196 g/km - 68 g/km = 128 g/km avoided`).
  - Updates the commuter's clean transit streak and increments their on-chain carbon score (+8 points).
  - Directly transfers or credits 1.5 `$MEV` tokens per km avoided from the contract treasury via `IPortalToken.transfer(commuter, amount)`.
  - Emits `JourneyLogged` and `ScoreAdjusted` events.
- `recordICEJourney(bytes32 journeyId, uint8 vehicleType, uint32 distanceKm, uint32 customMileageKmPerLitre)`:
  - Specifically designed for fossil vehicle accounting across 4 tiers:
    - `E20_ETHANOL` (165 g/km)
    - `PETROL_REGULAR` (196 g/km)
    - `PETROL_SPORTS` (240 g/km)
    - `DIESEL_SUV` (224 g/km)
  - Supports **custom mileage overrides** (e.g. `14.5` km/L), dynamically computing actual tailpipe CO2.
  - Resets the clean streak and applies a calibrated score adjustment without minting green tokens or burning unrelated user funds.
- `getCommuter(address commuter)`:
  - Returns `(score, streakDays, lastTripTimestamp, totalAvoidedGrams, totalEmittedGrams, totalTrips, rewardsClaimed, tokenBalance)`.
- `IPortalToken`:
  - Standard ERC-20 interface (`balanceOf`, `decimals`, `symbol`, `transfer`, `approve`).

---

### 3. Portal V3 Testnet Configuration

| Parameter | Configuration Value |
| :--- | :--- |
| **Network Name** | Portal V3 Testnet |
| **EVM Chain ID** | `420420777` (`0x190f0b49`) |
| **RPC Endpoint** | `https://test-evm-rpc-v3.portaldot.dev` |
| **WebSocket** | `wss://test-node-v3.portaldot.dev` |
| **Native Gas Token** | `PORTAL` (18 Decimals) |
| **Block Explorer** | `https://test-explorer-v3.portaldot.dev` |
| **Default Contract Address** | `0x71C8a93B26F7d0c8B2A9e4210e7b931920F039a8` |
| **Default Token Address** | `0x3A5d764C09B192A0284e88102847291048201948` |

*(Note: Contract endpoints can be updated live from the in-app Web3 manager in Chapter 05 without code modifications).*

---

## 🚀 Running Locally

The project runs completely offline and statically:

```bash
# Option 1: Python HTTP Server (Zero npm install needed)
python -m http.server 3000

# Option 2: Node.js / NPX
npm start
```

Open [http://localhost:3000](http://localhost:3000) in any modern browser.

---

## 📁 Repository Structure

```
├── index.html                   # Master application with Web3 mode switchers & dual-mode UI
├── package.json                 # Project configuration
├── README.md                    # Full documentation & Web3 contract analysis
├── css/
│   └── styles.css               # Design system, glassmorphism, responsive styles & Web3 cards
├── js/
│   ├── ethers.umd.min.js        # Ethers.js v6 library (self-contained local copy)
│   ├── contract-abi.js          # Portal V3 configuration & EVMobilityRewards / IPortalToken ABIs
│   ├── web3-portal.js           # Real Web3 wallet connector, RPC queries, on-chain execution
│   ├── data.js                  # Centralized CEA & IPCC emissions factor engine
│   ├── canvas-hero.js           # Interactive route network & EV particle canvas
│   ├── cursor.js                # Fluid custom cursor trail, ring, and magnetic buttons
│   ├── simulator.js             # Mobility Lab, dynamic SVG comparison & mix visualizer
│   ├── dashboard.js             # Carbon score area chart, trip log filters & detail drawer
│   ├── web3-azure.js            # 5-stage pipeline & Azure architecture explorer
│   ├── city-simulator.js        # Dual-route comparison & Future City macro simulator
│   └── app.js                   # Scroll progress, reveals, IST clock, and modal manager
└── contracts/
    ├── EVMobilityRewards.sol    # MissionEV smart contract with IPortalToken on Portal V3 EVM
    └── MissionEV.sol            # Alternate EIP-712 Azure Oracle signed contract
```

---

## 🏆 Hackathon Alignment

- **Build with Bharat 5.0**: Showcases enterprise integration with Microsoft Azure (Azure Functions serverless emissions oracle, Azure Maps geofencing, Azure Cosmos DB profile ledger, and Microsoft Fabric / Power BI municipal analytics).
- **Portal Layer 0 EVM (Portaldot Hacker House 2026)**: Live integration with Portal V3 EVM testnet (Chain ID `420420777`), real wallet connection, contract interaction with `EVMobilityRewards.sol`, and ERC-20 token rewards via `IPortalToken`.
