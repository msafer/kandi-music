# KANDI Music Platform - ERC-222 Smart Contracts Deployment Guide

## Overview

This guide provides detailed instructions for deploying the KANDI Music Platform smart contracts, including all constructor parameters, deployment order, and configuration steps.

## Contract Architecture

The platform consists of 5 main contracts:

1. **KANDIToken.sol** - Platform token with 100B supply and distribution logic
2. **ERC222NFT.sol** - Music NFT contract (ERC-721A based)
3. **ERC222Token.sol** - Paired kToken contract (ERC-20)
4. **ERC222Vault.sol** - Swap mechanism between NFTs and kTokens
5. **MintRouter.sol** - Minting logic with GHO/KANDI payments

## Prerequisites

- Solidity compiler: ^0.8.20
- OpenZeppelin Contracts: Latest version
- ERC721A: Latest version
- Network: Base, Ethereum, or compatible L2
- Required tokens: GHO stablecoin contract address

## Deployment Order

### Step 1: Deploy KANDI Platform Token

**Contract:** `KANDIToken.sol`

**Constructor Parameters:**
```solidity
constructor(
    address ghoToken_,        // GHO stablecoin contract address
    address devWallet_,       // Development team wallet
    address stakingContract_, // Staking contract (can be set later)
    address checkInContract_  // Check-in contract (can be set later)
)
```

**Example Deployment:**
```javascript
// Deploy KANDIToken
const kandiToken = await KANDIToken.deploy(
    "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f", // GHO token address (example)
    "0x1234567890123456789012345678901234567890", // Dev wallet
    "0x0000000000000000000000000000000000000000", // Staking contract (set later)
    "0x0000000000000000000000000000000000000000"  // Check-in contract (set later)
);
```

**Post-Deployment Configuration:**
- Set sale price: `setSalePrice(1000000000000000)` (0.001 GHO per KANDI)
- Activate sale: `setOpenSaleActive(true)`

---

### Step 2: Deploy MintRouter

**Contract:** `MintRouter.sol`

**Constructor Parameters:**
```solidity
constructor(
    address ghoToken_,        // GHO stablecoin contract address
    address kandiToken_,      // KANDI token from Step 1
    address devWallet_,       // Development team wallet
    address kandiPool_,       // KANDI liquidity pool address
    uint256 platformFeeRate_ // Platform fee in basis points (e.g., 250 = 2.5%)
)
```

**Example Deployment:**
```javascript
const mintRouter = await MintRouter.deploy(
    "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f", // GHO token address
    kandiToken.address,                              // KANDI token from Step 1
    "0x1234567890123456789012345678901234567890",   // Dev wallet
    "0x9876543210987654321098765432109876543210",   // KANDI pool address
    250                                              // 2.5% platform fee
);
```

---

### Step 3: Deploy Song Release Contracts (Per Song)

For each song release, deploy 3 contracts in this order:

#### 3a. Deploy ERC222NFT

**Contract:** `ERC222NFT.sol`

**Constructor Parameters:**
```solidity
constructor(
    string memory name_,              // NFT collection name (e.g., "Hades Music NFT")
    string memory symbol_,            // NFT symbol (e.g., "HADES")
    string memory songName_,          // Song name (e.g., "Hades")
    uint256 maxSupply_,              // Max NFTs (typically 10,000,000)
    string memory baseURI_,          // Metadata base URI
    address royaltyReceiver_,        // Royalty recipient address
    uint96 royaltyFeeNumerator_     // Royalty fee in basis points (e.g., 250 = 2.5%)
)
```

**Example Deployment:**
```javascript
const hadesNFT = await ERC222NFT.deploy(
    "Hades Music NFT",                               // name
    "HADES",                                         // symbol
    "Hades",                                         // songName
    10000000,                                        // maxSupply (10M)
    "https://api.kandimusic.com/metadata/hades/",   // baseURI
    "0x1234567890123456789012345678901234567890",   // royaltyReceiver
    250                                              // 2.5% royalty
);
```

#### 3b. Deploy ERC222Token

**Contract:** `ERC222Token.sol`

**Constructor Parameters:**
```solidity
constructor(
    string memory name_,        // kToken name (e.g., "kHades")
    string memory symbol_,      // kToken symbol (e.g., "KHADES")
    string memory songName_,    // Song name (e.g., "Hades")
    uint256 totalSupply_,      // Total kTokens (typically 100B)
    address nftContract_       // NFT contract from step 3a
)
```

**Example Deployment:**
```javascript
const hadesToken = await ERC222Token.deploy(
    "kHades",                    // name
    "KHADES",                    // symbol
    "Hades",                     // songName
    "100000000000000000000000000000", // 100B tokens (with 18 decimals)
    hadesNFT.address            // nftContract
);
```

#### 3c. Deploy ERC222Vault

**Contract:** `ERC222Vault.sol`

**Constructor Parameters:**
```solidity
constructor(
    address nftContract_,     // NFT contract from step 3a
    address tokenContract_,   // Token contract from step 3b
    string memory songName_, // Song name (e.g., "Hades")
    address admin_           // Admin address (usually dev wallet)
)
```

**Example Deployment:**
```javascript
const hadesVault = await ERC222Vault.deploy(
    hadesNFT.address,                              // nftContract
    hadesToken.address,                            // tokenContract
    "Hades",                                       // songName
    "0x1234567890123456789012345678901234567890"   // admin
);
```

---

### Step 4: Configure Contracts

After deploying all contracts for a song, configure them:

#### 4a. Configure NFT Contract
```javascript
// Set vault contract
await hadesNFT.setVaultContract(hadesVault.address);

// Transfer ownership to MintRouter for minting
await hadesNFT.transferOwnership(mintRouter.address);
```

#### 4b. Configure Token Contract
```javascript
// Set vault contract
await hadesToken.setVaultContract(hadesVault.address);

// Transfer initial token supply to vault for swapping
await hadesToken.transfer(hadesVault.address, "50000000000000000000000000000"); // 50B tokens
```

#### 4c. Configure MintRouter
```javascript
// Add song release to MintRouter
await mintRouter.addSongRelease(
    "Hades",                    // songName
    hadesNFT.address,          // nftContract
    hadesToken.address,        // tokenContract
    hadesVault.address,        // vaultContract
    "400000000000000",         // mintPrice (0.0004 GHO per NFT for RIAA compliance)
    100                        // maxMintsPerTx
);
```

#### 4d. Preload Vault (Optional)
```javascript
// Mint some NFTs for initial vault liquidity
await hadesNFT.mint(deployer.address, 1000); // Mint 1000 NFTs

// Approve and preload vault
const nftIds = Array.from({length: 1000}, (_, i) => i + 1);
await hadesNFT.setApprovalForAll(hadesVault.address, true);
await hadesVault.preloadVault(nftIds, "10000000000000000000000000"); // 10M tokens
```

---

## Environment-Specific Addresses

### Mainnet Addresses
```
GHO Token: 0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f
```

### Base Network Addresses
```
GHO Token: [TO BE UPDATED WHEN AVAILABLE]
```

### Testnet Addresses (Sepolia)
```
GHO Token: 0xc4bF5CbDaBE595361438F8c6a187bDc330539c60
```

---

## Configuration Parameters Reference

### KANDI Token Distribution (100B Total)
- **Open Sale:** 50B tokens (50%)
- **Airdrop:** 20B tokens (20%, 90-day lock)
- **Farcaster Users:** 10B tokens (10%)
- **Staking Rewards:** 10B tokens (10%)
- **Check-in Rewards:** 10B tokens (10%)

### Song Release Parameters
- **NFT Max Supply:** 10,000,000 per song
- **kToken Supply:** 100,000,000,000 per song (100B)
- **Conversion Ratio:** 1 NFT = 10,000 kTokens
- **Min Price:** $0.40 USD (RIAA compliance)
- **Default Royalty:** 2.5%

### Platform Fees
- **Default Platform Fee:** 2.5%
- **Fee Distribution:** 50% to dev wallet, 50% to KANDI pool
- **KANDI Swap Fee:** 1%

---

## Verification Commands

After deployment, verify contracts on block explorer:

```bash
# Verify KANDI Token
npx hardhat verify --network mainnet [KANDI_ADDRESS] \
  [GHO_ADDRESS] [DEV_WALLET] [STAKING_CONTRACT] [CHECKIN_CONTRACT]

# Verify NFT Contract
npx hardhat verify --network mainnet [NFT_ADDRESS] \
  "Hades Music NFT" "HADES" "Hades" 10000000 \
  "https://api.kandimusic.com/metadata/hades/" [ROYALTY_RECEIVER] 250

# Verify Token Contract
npx hardhat verify --network mainnet [TOKEN_ADDRESS] \
  "kHades" "KHADES" "Hades" "100000000000000000000000000000" [NFT_ADDRESS]

# Verify Vault Contract
npx hardhat verify --network mainnet [VAULT_ADDRESS] \
  [NFT_ADDRESS] [TOKEN_ADDRESS] "Hades" [ADMIN_ADDRESS]

# Verify MintRouter
npx hardhat verify --network mainnet [MINTROUTER_ADDRESS] \
  [GHO_ADDRESS] [KANDI_ADDRESS] [DEV_WALLET] [KANDI_POOL] 250
```

---

## Post-Deployment Checklist

### KANDI Token
- [ ] Sale price set
- [ ] Sale activated
- [ ] Dev wallet configured
- [ ] Swap configuration set

### Per Song Release
- [ ] NFT max supply configured
- [ ] Royalty settings verified
- [ ] Token total supply verified
- [ ] Vault preloaded with initial liquidity
- [ ] MintRouter song configuration added
- [ ] Mint price set (≥ $0.40 USD)
- [ ] All contract ownerships transferred appropriately

### Platform Integration
- [ ] Frontend API endpoints configured
- [ ] Metadata URIs accessible
- [ ] Block explorer verification completed
- [ ] Multi-sig admin setup (recommended)

---

## Security Considerations

1. **Multi-sig Wallets:** Use multi-sig wallets for admin functions
2. **Time Locks:** Consider implementing time locks for critical functions
3. **Audits:** Complete security audits before mainnet deployment
4. **Emergency Functions:** Ensure emergency withdrawal functions are properly secured
5. **Upgrade Patterns:** Vault contracts should be upgradeable using proxy patterns

---

## Support and Documentation

For additional support:
- Technical Documentation: [Link to docs]
- API Reference: [Link to API docs]
- Discord Community: [Link to Discord]
- GitHub Repository: [Link to repo]

---

*This deployment guide is subject to updates. Always verify the latest version before deployment.*