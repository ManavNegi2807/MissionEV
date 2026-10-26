# 🌍 Mission EV (Verde) - Gamified Carbon Credit & Penalty Tracker

> **Team Name:** MissionEV  
> **Hackathon Submissions:** Build with Bharat 5.0 (Microsoft Azure Track) & Portaldot Hacker House 2026 (Portal Layer 0 EVM Track)  
> **Team Members:** Suneet Bhardwaj, Manav Negi, Gunjan Baid  
> **College:** Guru Gobind Singh Indraprastha University (GGSIPU)  

---

## 📌 Executive Summary

Urban road transport accounts for over **12% of global energy $\text{CO}_2$ emissions** (and roughly **14% of India's total energy-related $\text{CO}_2$ emissions**, with road traffic driving over **90%** of that total). In mega-cities like Delhi NCR, vehicular pollution drives over **50% of urban air degradation**. Yet, millions of daily commuters burn high-emission fossil fuels with zero personal accountability, static and disposable transit tickets, and zero economic incentives to transition to electric vehicles (EVs).

**Mission EV (Verde)** solves this by introducing a decentralized, gamified **"Strava for Carbon"** ecosystem. It bridges real-time mobility telemetry with Web3 smart contracts, rewarding clean transit (EVs, e-bikes, metros) with tradable tokens while applying score adjustments and penalties to high-emission Internal Combustion Engine (ICE) vehicles.

---

## 🛠️ Complete System Architecture (4-Tier Stack)

Mission EV is engineered using a robust, highly scalable, and production-ready enterprise architecture spanning four distinct layers:

```
[ Layer 1: Client Frontend ] ---> [ Layer 2: Backend & Compute ] ---> [ Layer 3: Decentralized Protocol ] ---> [ Layer 4: Storage & Analytics ]
```

1. **Layer 1: Client Frontend (Interactive User Experience)**
   * Built with responsive HTML5, Tailwind CSS, and custom neon/futuristic UI styling.
   * Features real-time GPS telemetry, speed tracking simulation, and vehicle catalog selection.
   * Integrated with **Ethers.js** for seamless Web3 wallet authentication and transaction signing.

2. **Layer 2: Backend & Compute (Microsoft Azure Cloud)**
   * **Microsoft Azure Functions:** Serverless, event-driven compute engine processing trip distance and automated emission-to-token calculations.
   * **Azure Maps LBS:** Advanced location-based spatial services providing precise geofencing, route tracking, and baseline distance mapping.
   * **Node.js API Gateway:** Secure routing and verification middleware.

3. **Layer 3: Decentralized Protocol (Portal Layer 0 V3.0 EVM)**
   * **Solidity Smart Contracts (`EVMobilityRewards.sol`):** Handles automated trust-verified trip execution, manual mileage overrides, and decentralized scorekeeping.
   * **Portal Test Tokens (ERC-20 Integration):** Programmatic minting (`mint`) and burning (`burnFrom`) logic via the `IPortalToken` interface.
   * **Immutable Hash Mapping:** Eliminates double-counting errors and bureaucratic bottlenecks typical of legacy carbon markets.

4. **Layer 4: Storage & Analytics (Enterprise Data & BI)**
   * **Azure Cosmos DB:** Scalable NoSQL document store tracking user profiles, historical trips, vehicle registries (`D1`, `D2`, `D3` data stores).
   * **Power BI Macro Dashboards:** Real-time ESG analytics and aggregate pollution metrics designed for city planners and corporate ESG compliance officers.

---

## 📝 Smart Contract Core Logic (`EVMobilityRewards.sol`)

The system categorizes vehicles into five distinct fuel tiers to calculate precise credit deltas:
* **EV (FuelType.0):** Rewards earned (`BASE_EV_REWARD_RATE = 1000`)
* **Ethanol Blend (FuelType.1):** Minimal penalty (`ETHANOL_PENALTY_RATE = 300`)
* **Petrol Regular (FuelType.2):** Medium penalty (`REGULAR_PETROL_PENALTY_RATE = 700`)
* **Petrol Power (FuelType.3):** High penalty (`POWER_PETROL_PENALTY_RATE = 1000`)
* **Diesel (FuelType.4):** Maximum penalty (`DIESEL_PENALTY_RATE = 1200`)

### Key Contract Functions:
* `registerUser(uint256 _vehicleId)`: Binds a commuter wallet to their registered vehicle model.
* `processTripWithCustomMileage(address _user, uint256 _kmDistance, uint256 _customMileage)`: Oracle-verified execution function enabling custom efficiency overrides and automated Portal token disbursement.
* `calculateTripCredits(FuelType _fuel, uint256 _mileage, uint256 _km)`: Pure mathematical calculation engine for carbon offsets and penalties.

---

## 💡 Strategic Value & Ecosystem Consequences

### 1. Why it is Transformative for **Portaldot**
* **Mass Consumer Utility:** Shifts Portaldot from a purely speculative or financial Layer 0 chain into a high-utility, real-world utility network with millions of daily micro-transactions.
* **Frictionless Micro-Minting:** Leverages Portaldot V3.0's EVM compatibility and ultra-low gas overhead, making frequent 3 km to 10 km daily commute micro-rewards economically viable.
* **Ecosystem Growth:** Drives heavy transaction volume and smart contract deployments, showcasing Portaldot's capacity for high-frequency Internet of Vehicles (IoV) applications.

### 2. Why it is Transformative for **Microsoft** (Build with Bharat 5.0)
* **Showcasing Azure's Cloud Versatility:** Integrates Azure Functions (serverless scalability) and Azure Maps LBS (geospatial precision) in a live, high-impact societal challenge.
* **Enterprise ESG & Scope 3 Compliance:** Provides corporations with auditable, immutable ESG datasets stored in Azure Cosmos DB and visualized via Power BI, helping businesses meet strict global net-zero regulatory standards.
* **Developer Empowerment:** Highlights how student developers can build robust cloud-native Web3 applications utilizing student developer credits and Microsoft cloud tools.

### 3. Why it is Transformative for **The Entire World**
* **Compounding Network Effect:** By committing just 0.1 Carbon Credit ($\sim 100\text{ kg}$ of $\text{CO}_2$ saved) per person annually, Delhi's 10 million commuters alone create a compounding network effect—**directly wiping out 1 Million Tonnes of transport emissions** and neutralizing urban choking pollution.
* **Gamified Personal Accountability:** Replaces passive, disposable transit tickets with an engaging "Strava for Carbon" fitness model, transforming environmentalism from an abstract chore into an active, rewarding daily habit.
* **B2B & Municipal Synergy:** Bridges everyday citizens with EV manufacturers (Ather, Ola, Tata) and charging networks, while supplying municipal city planners with real-time pollution telemetry to redesign urban transit corridors.

---

## 🔮 Future Roadmap: Hardware & IoT Integration

To evolve beyond manual app inputs and smartphone GPS telemetry, Mission EV is engineered for seamless future expansion into physical hardware:

1. **Embedded Telematics & OBD-II Dongles:**
   * Direct integration with vehicle On-Board Diagnostics (OBD-II) Bluetooth/cellular dongles to pull exact fuel consumption, odometer readings, and battery health straight from the vehicle's ECU.
2. **RFID Metro & FastTag Toll Gateway Sync:**
   * Automated trip initiation and mode detection by syncing with FASTag toll portals and metro smart-card turnstiles.
3. **Manufacturer-Level API Partnerships (OEMs):**
   * Direct firmware integration with connected EV dashboards (e.g., Ather, Ola S1, Tata EV) to cryptographically sign trip data at the hardware level, creating a completely trustless, tamper-proof zero-knowledge proof ($\text{ZKP}$) emission tracking ecosystem.

---

## 🚀 Getting Started & Deployment

1. **Frontend Setup:** Open `index.html` in any modern web browser or serve via a local static server.
2. **Smart Contract Deployment:** 
   * Open **Remix IDE** (`remix.ethereum.org`).
   * Compile and deploy `EVMobilityRewards.sol` on the **Portaldot V3 EVM Testnet** (`Chain ID: 420420777`) using MetaMask.
3. **Environment Configuration:** Connect your wallet, register your vehicle model, and begin tracking your sustainable commutes on-chain!
