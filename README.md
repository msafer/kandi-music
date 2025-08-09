# KANDI Music Platform - ERC-222 Mini App

A Web3 music NFT marketplace using a custom token standard that pairs ERC-721 NFTs with mirrored ERC-20 "kTokens" for revolutionary music rights fractionalization.

## 🎵 Overview

The KANDI Music Platform introduces **ERC-222**, a novel token standard that creates a paired relationship between NFTs and fungible tokens for each music release. Every song generates:

- **10 Million NFTs** (ERC-721A based)
- **100 Billion kTokens** (ERC-20 based)
- **1:10,000 conversion ratio** (1 NFT = 10,000 kTokens)
- **Unified vault system** for seamless swapping

## 🔗 ERC-222 Standard Features

### Core Components

1. **ERC222NFT** - Music NFT contract with royalty support
2. **ERC222Token** - Paired kToken for fractionalization
3. **ERC222Vault** - Swap mechanism between NFTs and kTokens
4. **MintRouter** - Payment processing with GHO/KANDI
5. **KANDIToken** - Platform token with 100B supply

### Key Benefits

- **Fractionalized Ownership** - Own portions of music rights through kTokens
- **Liquidity** - Seamless conversion between NFTs and tokens
- **RIAA Compliant** - Enforces $0.40 minimum pricing rule
- **Dynamic Pricing** - Floor price tracking via market cap
- **Royalty Distribution** - EIP-2981 compliant royalty system

## 📊 Tokenomics

### KANDI Platform Token (100B Total Supply)
- **50%** - Open sale
- **20%** - Airdrop (90-day lock)
- **10%** - Farcaster top users
- **10%** - Staking/vault rewards
- **10%** - Daily check-in rewards

### Per Song Release
- **NFT Supply:** 10 million per song
- **kToken Supply:** 100 billion per song
- **Conversion:** 1 NFT ↔ 10,000 kTokens
- **Payment:** GHO stablecoin or KANDI tokens

## 🏗️ Smart Contract Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   MintRouter    │────│   KANDIToken    │
│                 │    │                 │
└─────────┬───────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ERC222NFT     │◄───┤  ERC222Vault    ├───►│  ERC222Token    │
│   (Music NFT)   │    │  (Swap Logic)   │    │   (kToken)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Contract Interactions

1. **Minting:** Users pay GHO/KANDI → Receive NFTs
2. **Swapping:** Deposit NFT → Receive 10,000 kTokens (or vice versa)
3. **Trading:** kTokens tradeable on secondary markets
4. **Rewards:** Platform activity generates KANDI airdrops

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Hardhat or Foundry
- OpenZeppelin Contracts
- ERC721A library

### Installation

```bash
git clone https://github.com/your-repo/kandi-music-platform
cd kandi-music-platform
npm install
```

### Deployment

1. **Deploy KANDI Token**
2. **Deploy MintRouter**
3. **For each song:**
   - Deploy ERC222NFT
   - Deploy ERC222Token
   - Deploy ERC222Vault
   - Configure contracts

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔧 Contract Functions

### ERC222NFT (Music NFT)

```solidity
// Mint NFTs (only owner/MintRouter)
function mint(address to, uint256 quantity) external onlyOwner

// Deposit NFT to vault for kTokens
function depositToVault(uint256 tokenId) external

// Set royalty information
function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner
```

### ERC222Token (kToken)

```solidity
// Convert NFT amount to token amount
function nftToTokenAmount(uint256 nftAmount) external pure returns (uint256)

// Convert token amount to NFT amount
function tokenToNFTAmount(uint256 tokenAmount) external pure returns (uint256)

// Check if amount is valid for NFT conversion
function isValidNFTConversionAmount(uint256 tokenAmount) external pure returns (bool)
```

### ERC222Vault (Swap Logic)

```solidity
// Deposit NFT, receive kTokens
function depositNFT(uint256 tokenId) external

// Deposit kTokens, receive NFT
function depositTokens(uint256 tokenAmount) external

// Get current floor price
function getFloorPrice() public view returns (uint256)

// Check vault statistics
function getVaultStats() external view returns (...)
```

### MintRouter (Payment Processing)

```solidity
// Mint with GHO payment
function mintWithGHO(string memory songName, uint256 quantity) external

// Mint with KANDI payment (auto-swapped to GHO)
function mintWithKANDI(string memory songName, uint256 quantity, uint256 maxKandiAmount) external

// Add new song release
function addSongRelease(...) external onlyOwner
```

### KANDIToken (Platform Token)

```solidity
// Purchase tokens during open sale
function purchaseTokens(uint256 ghoAmount) external

// Claim airdrop (after 90-day lock)
function claimAirdrop() external

// Swap KANDI to GHO
function swapToGHO(uint256 kandiAmount) external returns (uint256 ghoAmount)
```

## 🎯 Use Cases

### For Artists
- **Revenue Sharing:** Automatic royalty distribution
- **Fan Engagement:** Direct ownership connection with fans
- **Price Discovery:** Market-driven valuation
- **Global Reach:** Borderless music rights trading

### For Fans/Collectors
- **Fractional Ownership:** Buy portions of favorite songs
- **Liquidity:** Convert between NFTs and tokens freely
- **Staking Rewards:** Earn KANDI tokens for participation
- **Community Access:** Exclusive experiences and content

### For Investors
- **Diversification:** Spread investment across multiple songs
- **Liquidity Provision:** Earn fees from vault operations
- **Market Making:** Arbitrage between NFT and token prices
- **Platform Growth:** Benefit from KANDI token appreciation

## 🔒 Security Features

- **Reentrancy Protection:** All external calls protected
- **Access Control:** Role-based permissions
- **Emergency Functions:** Admin withdrawal capabilities
- **Upgradeable Vaults:** Proxy pattern for future improvements
- **Royalty Enforcement:** EIP-2981 standard compliance

## 🌐 Network Support

- **Ethereum Mainnet** - Primary deployment
- **Base** - L2 for reduced fees
- **Arbitrum** - Alternative L2 option
- **Polygon** - Scaling solution

## 📋 API Reference

### Query Song Information
```javascript
// Get song release data
const release = await mintRouter.getSongRelease("Hades");

// Check vault statistics
const stats = await vault.getVaultStats();

// Calculate mint cost
const [totalCost, platformFee, netAmount] = await mintRouter.calculateMintCost("Hades", 5);
```

### User Interactions
```javascript
// Mint NFTs with GHO
await ghoToken.approve(mintRouter.address, cost);
await mintRouter.mintWithGHO("Hades", 5);

// Swap NFT for tokens
await nft.approve(vault.address, tokenId);
await vault.depositNFT(tokenId);

// Swap tokens for NFT
await token.approve(vault.address, tokenAmount);
await vault.depositTokens(tokenAmount);
```

## 🛣️ Roadmap

### Phase 1: Core Platform (Q1 2024)
- [x] ERC-222 standard development
- [x] Smart contract deployment
- [ ] Frontend interface
- [ ] Initial song releases

### Phase 2: Platform Features (Q2 2024)
- [ ] Staking mechanism
- [ ] Daily check-in rewards
- [ ] Farcaster integration
- [ ] Mobile app

### Phase 3: Ecosystem Growth (Q3 2024)
- [ ] Artist onboarding program
- [ ] Marketplace integrations
- [ ] Cross-chain deployment
- [ ] DAO governance

### Phase 4: Advanced Features (Q4 2024)
- [ ] AI-powered recommendations
- [ ] Social features
- [ ] Creator tools
- [ ] Analytics dashboard

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

- **Documentation:** [docs.kandimusic.com](https://docs.kandimusic.com)
- **Discord:** [discord.gg/kandi](https://discord.gg/kandi)
- **Twitter:** [@KANDIMusic](https://twitter.com/KANDIMusic)
- **Email:** support@kandimusic.com

---

**Built with ❤️ for the future of music ownership**