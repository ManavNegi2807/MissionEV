// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MissionEV — Gamified Clean Mobility & Carbon Accounting
 * @notice Created for:
 *   - Build with Bharat 5.0 (Microsoft Azure Ecosystem)
 *   - Portaldot Hacker House 2026 (Portal Layer 0 EVM Ecosystem)
 *
 * @dev Deployed on Portal Layer 0 EVM testnet.
 * Features:
 *  - EIP-712 signature verification from Azure Functions Oracle
 *  - Trip replay protection using unique trip hash identifiers
 *  - Dynamic streak multiplier calculations
 *  - Native $MEV reward token minting
 *  - Commuter on-chain score and badge milestones
 */

contract MissionEV {
    // --- ERC-20 Token Variables for $MEV ---
    string public constant name = "MissionEV Carbon Reward";
    string public constant symbol = "MEV";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // --- Roles & Governance ---
    address public owner;
    address public azureOracleSigner;

    // --- Commuter State ---
    struct CommuterProfile {
        uint256 carbonScore;          // 0 to 1000 normalized index
        uint256 streakDays;           // Current uninterrupted clean streak
        uint256 lastTripTimestamp;    // Timestamp of last verified trip
        uint256 totalAvoidedGramsCO2; // Cumulative avoided carbon in grams
        uint256 totalTripsLogged;     // Total verified trips count
    }

    enum TransportMode {
        EV_CAR,      // 0
        EV_2W,       // 1
        METRO,       // 2
        EBUS,        // 3
        ACTIVE,      // 4 (Walk/Cycle)
        ICE_CAR,     // 5
        ICE_SUV      // 6
    }

    mapping(address => CommuterProfile) public commuters;
    mapping(bytes32 => bool) public processedTrips;

    // --- EIP-712 Typehashes ---
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant TRIP_TYPEHASH = keccak256(
        "TripPayload(address commuter,bytes32 tripId,uint8 mode,uint32 distanceMeters,uint32 co2AvoidedGrams,uint256 nonce,uint256 deadline)"
    );
    mapping(address => uint256) public nonces;

    // --- Events ---
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event CommuteVerified(
        address indexed commuter,
        bytes32 indexed tripId,
        TransportMode mode,
        uint32 distanceMeters,
        uint32 co2AvoidedGrams,
        uint256 pointsMinted,
        uint256 newCarbonScore
    );
    event StreakUpdated(address indexed commuter, uint256 newStreak);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "MissionEV: Only owner");
        _;
    }

    constructor(address _azureOracleSigner) {
        owner = msg.sender;
        azureOracleSigner = _azureOracleSigner;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MissionEV")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function setAzureOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "MissionEV: Invalid oracle address");
        emit OracleUpdated(azureOracleSigner, _newOracle);
        azureOracleSigner = _newOracle;
    }

    /**
     * @notice Records a verified commuter trip with Azure Oracle cryptographic signature.
     * @param tripId Unique UUID hash of the trip
     * @param mode Transport Mode enum (0 = EV_CAR, 1 = EV_2W, etc.)
     * @param distanceMeters Trip distance in meters
     * @param co2AvoidedGrams Kilograms CO2 avoided multiplied by 1000
     * @param deadline Signature expiry timestamp
     * @param v ECDSA signature component
     * @param r ECDSA signature component
     * @param s ECDSA signature component
     */
    function recordCommute(
        bytes32 tripId,
        TransportMode mode,
        uint32 distanceMeters,
        uint32 co2AvoidedGrams,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp <= deadline, "MissionEV: Signature expired");
        require(!processedTrips[tripId], "MissionEV: Trip already processed");

        address commuter = msg.sender;
        uint256 currentNonce = nonces[commuter]++;

        // Verify EIP-712 signature from Azure Oracle
        bytes32 structHash = keccak256(
            abi.encode(
                TRIP_TYPEHASH,
                commuter,
                tripId,
                uint8(mode),
                distanceMeters,
                co2AvoidedGrams,
                currentNonce,
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address recoveredSigner = ecrecover(digest, v, r, s);
        require(recoveredSigner == azureOracleSigner, "MissionEV: Invalid oracle signature");

        // Mark trip as processed
        processedTrips[tripId] = true;

        CommuterProfile storage profile = commuters[commuter];

        // Update streak
        if (profile.lastTripTimestamp > 0 && block.timestamp - profile.lastTripTimestamp <= 1.5 days) {
            profile.streakDays += 1;
        } else if (profile.lastTripTimestamp == 0 || block.timestamp - profile.lastTripTimestamp > 1.5 days) {
            profile.streakDays = 1;
        }
        profile.lastTripTimestamp = block.timestamp;
        profile.totalTripsLogged += 1;
        profile.totalAvoidedGramsCO2 += co2AvoidedGrams;

        // Compute streak multiplier: 1x to 3x (max at 20 days streak)
        uint256 streakMultiplierBps = 10000; // 1.0x baseline
        if (profile.streakDays >= 20) {
            streakMultiplierBps = 30000; // 3.0x
        } else if (profile.streakDays >= 10) {
            streakMultiplierBps = 20000; // 2.0x
        } else if (profile.streakDays >= 5) {
            streakMultiplierBps = 15000; // 1.5x
        }

        // Base reward: 20 tokens per kg avoided (i.e. per 1000g)
        uint256 baseTokens = (uint256(co2AvoidedGrams) * 20 * 1e18) / 1000;
        uint256 rewardAmount = (baseTokens * streakMultiplierBps) / 10000;

        // Mode Bonus
        if (mode == TransportMode.ACTIVE) {
            rewardAmount += 15 * 1e18; // Active transit bonus
        } else if (mode == TransportMode.EV_CAR || mode == TransportMode.EV_2W || mode == TransportMode.METRO) {
            rewardAmount += 10 * 1e18;
        }

        // Update Carbon Score (0 to 1000)
        if (profile.carbonScore == 0) profile.carbonScore = 500; // initial score
        if (co2AvoidedGrams > 2000) {
            profile.carbonScore = min(1000, profile.carbonScore + 8);
        } else if (co2AvoidedGrams > 500) {
            profile.carbonScore = min(1000, profile.carbonScore + 4);
        } else {
            profile.carbonScore = min(1000, profile.carbonScore + 2);
        }

        // Mint $MEV tokens to commuter
        if (rewardAmount > 0) {
            _mint(commuter, rewardAmount);
        }

        emit CommuteVerified(
            commuter,
            tripId,
            mode,
            distanceMeters,
            co2AvoidedGrams,
            rewardAmount / 1e18,
            profile.carbonScore
        );
        emit StreakUpdated(commuter, profile.streakDays);
    }

    function getCommuter(address commuter) external view returns (
        uint256 carbonScore,
        uint256 streakDays,
        uint256 lastTripTimestamp,
        uint256 totalAvoidedGramsCO2,
        uint256 totalTripsLogged,
        uint256 tokenBalance
    ) {
        CommuterProfile memory p = commuters[commuter];
        return (
            p.carbonScore,
            p.streakDays,
            p.lastTripTimestamp,
            p.totalAvoidedGramsCO2,
            p.totalTripsLogged,
            balanceOf[commuter]
        );
    }

    // --- Internal ERC-20 Methods ---
    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "ERC20: Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
