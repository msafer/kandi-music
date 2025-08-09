// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

interface IERC222NFT {
    function mint(address to, uint256 quantity) external;
    function MAX_SUPPLY() external view returns (uint256);
    function totalMinted() external view returns (uint256);
    function songName() external view returns (string memory);
}

interface IERC222Token {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function TOKENS_PER_NFT() external view returns (uint256);
}

interface IERC222Vault {
    function preloadVault(uint256[] calldata nftIds, uint256 tokenAmount) external;
    function updateMarketCap(uint256 additionalValue) external;
}

interface IKANDI is IERC20 {
    function swapToGHO(uint256 kandiAmount) external returns (uint256 ghoAmount);
}

/**
 * @title MintRouter
 * @dev Handles minting logic for ERC222 NFT/Token pairs
 * @dev Accepts GHO payments and optionally KANDI (swapped to GHO)
 * @dev Manages platform fees and vault preloading
 * 
 * Constructor Parameters:
 * - ghoToken_ - Address of GHO stablecoin contract
 * - kandiToken_ - Address of KANDI platform token contract
 * - devWallet_ - Address to receive platform fees
 * - kandiPool_ - Address of KANDI liquidity pool for fee routing
 * - platformFeeRate_ - Platform fee rate in basis points (e.g., 250 = 2.5%)
 */
contract MintRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Payment tokens
    IERC20 public immutable ghoToken;
    IKANDI public immutable kandiToken;
    
    // Fee configuration
    address public devWallet;
    address public kandiPool; // acts as KANDI treasury
    uint256 public platformFeeRate; // Basis points (10000 = 100%)
    uint256 public feeTreasuryShareBps; // share of platform fee to treasury (0-10000)

    uint256 public constant MIN_MINT_PRICE = 0.40 ether;
    uint256 public constant MAX_FEE_BPS = 1000; // 10%
    
    // Song release configurations
    struct SongRelease {
        address nftContract;
        address tokenContract;
        address vaultContract;
        uint256 mintPrice; // Price per NFT in GHO (18 decimals)
        uint256 maxMintsPerTx;
        bool mintEnabled;
        bool exists;
    }
    
    mapping(string => SongRelease) public songReleases;
    string[] public songNames;
    
    // Mint tracking
    mapping(address => mapping(string => uint256)) public userMints; // user => songName => minted count
    
    // Events
    event SongReleaseAdded(
        string indexed songName,
        address nftContract,
        address tokenContract,
        address vaultContract,
        uint256 mintPrice
    );
    event NFTMinted(
        address indexed user,
        string indexed songName,
        uint256 quantity,
        uint256 totalCost,
        address paymentToken
    );
    event PlatformFeeCollected(uint256 amount, address token);
    event MintPriceUpdated(string indexed songName, uint256 newPrice);
    event MintStatusUpdated(string indexed songName, bool enabled);
    event DevWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event KandiPoolUpdated(address indexed oldPool, address indexed newPool);
    event PlatformFeeRateUpdated(uint256 oldRate, uint256 newRate);
    event FeeSplitUpdated(uint256 newTreasuryShareBps);
    event VaultPreloaded(string indexed songName, uint256 nftCount, uint256 tokenAmount);

    constructor(
        address ghoToken_,
        address kandiToken_,
        address devWallet_,
        address kandiPool_,
        uint256 platformFeeRate_
    ) Ownable(msg.sender) {
        require(ghoToken_ != address(0), "Invalid GHO token address");
        require(kandiToken_ != address(0), "Invalid KANDI token address");
        require(devWallet_ != address(0), "Invalid dev wallet address");
        require(kandiPool_ != address(0), "Invalid KANDI pool address");
        require(platformFeeRate_ <= MAX_FEE_BPS, "Platform fee rate too high");

        ghoToken = IERC20(ghoToken_);
        kandiToken = IKANDI(kandiToken_);
        devWallet = devWallet_;
        kandiPool = kandiPool_;
        platformFeeRate = platformFeeRate_;
        feeTreasuryShareBps = 5000; // default 50/50
    }

    /**
     * @dev Add a new song release configuration
     * @param songName Name of the song
     * @param nftContract Address of the NFT contract
     * @param tokenContract Address of the kToken contract
     * @param vaultContract Address of the vault contract
     * @param mintPrice Price per NFT in GHO (18 decimals)
     * @param maxMintsPerTx Maximum NFTs that can be minted per transaction
     */
    function addSongRelease(
        string memory songName,
        address nftContract,
        address tokenContract,
        address vaultContract,
        uint256 mintPrice,
        uint256 maxMintsPerTx
    ) external onlyOwner {
        require(bytes(songName).length > 0, "Song name cannot be empty");
        require(nftContract != address(0), "Invalid NFT contract");
        require(tokenContract != address(0), "Invalid token contract");
        require(vaultContract != address(0), "Invalid vault contract");
        require(mintPrice >= MIN_MINT_PRICE, "Mint price below minimum");
        require(maxMintsPerTx > 0, "Max mints per tx must be greater than 0");
        require(!songReleases[songName].exists, "Song release already exists");

        songReleases[songName] = SongRelease({
            nftContract: nftContract,
            tokenContract: tokenContract,
            vaultContract: vaultContract,
            mintPrice: mintPrice,
            maxMintsPerTx: maxMintsPerTx,
            mintEnabled: true,
            exists: true
        });

        songNames.push(songName);

        emit SongReleaseAdded(songName, nftContract, tokenContract, vaultContract, mintPrice);
    }

    /**
     * @dev Mint NFTs using GHO payment
     * @param songName Name of the song to mint
     * @param quantity Number of NFTs to mint
     */
    function mintWithGHO(string memory songName, uint256 quantity) external nonReentrant {
        _processMint(songName, quantity, address(ghoToken));
    }

    /**
     * @dev Mint NFTs using KANDI payment (swapped to GHO behind the scenes)
     * @param songName Name of the song to mint
     * @param quantity Number of NFTs to mint
     * @param maxKandiAmount Maximum KANDI tokens willing to spend
     */
    function mintWithKANDI(
        string memory songName,
        uint256 quantity,
        uint256 maxKandiAmount
    ) external nonReentrant {
        SongRelease memory release = songReleases[songName];
        require(release.exists, "Song release does not exist");
        require(release.mintEnabled, "Minting is disabled for this song");

        uint256 totalCostGHO = release.mintPrice * quantity;
        
        // Check user's KANDI balance
        require(kandiToken.balanceOf(msg.sender) >= maxKandiAmount, "Insufficient KANDI balance");
        
        // Transfer KANDI from user and swap to GHO
        IERC20(address(kandiToken)).safeTransferFrom(msg.sender, address(this), maxKandiAmount);
        uint256 ghoReceived = kandiToken.swapToGHO(maxKandiAmount);
        require(ghoReceived >= totalCostGHO, "Insufficient GHO received from KANDI swap");

        // Process the mint
        _executeMint(songName, quantity, totalCostGHO, address(kandiToken));
        
        // Refund excess GHO if any
        if (ghoReceived > totalCostGHO) {
            require(ghoToken.transfer(msg.sender, ghoReceived - totalCostGHO), "GHO refund failed");
        }
    }

    /**
     * @dev Internal function to process mints
     * @param songName Name of the song to mint
     * @param quantity Number of NFTs to mint
     * @param paymentToken Address of the payment token used
     */
    function _processMint(string memory songName, uint256 quantity, address paymentToken) internal {
        SongRelease memory release = songReleases[songName];
        require(release.exists, "Song release does not exist");
        require(release.mintEnabled, "Minting is disabled for this song");
        require(quantity > 0, "Quantity must be greater than 0");
        require(quantity <= release.maxMintsPerTx, "Exceeds max mints per transaction");

        uint256 totalCost = release.mintPrice * quantity;
        
        // Transfer payment from user
        ghoToken.safeTransferFrom(msg.sender, address(this), totalCost);
        
        _executeMint(songName, quantity, totalCost, paymentToken);
    }

    /**
     * @dev Execute the mint and handle fees
     * @param songName Name of the song to mint
     * @param quantity Number of NFTs to mint
     * @param totalCost Total cost of the mint
     * @param paymentToken Address of the payment token used
     */
    function _executeMint(
        string memory songName,
        uint256 quantity,
        uint256 totalCost,
        address paymentToken
    ) internal {
        SongRelease memory release = songReleases[songName];
        
        // Check NFT supply limits
        IERC222NFT nftContract = IERC222NFT(release.nftContract);
        require(nftContract.totalMinted() + quantity <= nftContract.MAX_SUPPLY(), "Exceeds max supply");

        // Calculate platform fee
        uint256 platformFee = (totalCost * platformFeeRate) / 10000;
        uint256 netAmount = totalCost - platformFee;

        // Distribute platform fee (50% to dev wallet, 50% to KANDI pool)
        if (platformFee > 0) {
            uint256 treasuryFee = (platformFee * feeTreasuryShareBps) / 10000;
            uint256 devFee = platformFee - treasuryFee;
            
            require(devWallet != address(0) && kandiPool != address(0), "Fee recipients not set");
            ghoToken.safeTransfer(devWallet, devFee);
            ghoToken.safeTransfer(kandiPool, treasuryFee);
            
            emit PlatformFeeCollected(platformFee, address(ghoToken));
        }

        // Mint NFTs to user
        nftContract.mint(msg.sender, quantity);

        // Update vault market cap
        IERC222Vault(release.vaultContract).updateMarketCap(netAmount);

        // Update user mint tracking
        userMints[msg.sender][songName] += quantity;

        emit NFTMinted(msg.sender, songName, quantity, totalCost, paymentToken);
    }

    /**
     * @dev Preload vault with NFTs and tokens (admin function)
     * @param songName Name of the song
     * @param nftIds Array of NFT token IDs to preload
     * @param tokenAmount Amount of kTokens to preload
     */
    function preloadVault(
        string memory songName,
        uint256[] calldata nftIds,
        uint256 tokenAmount
    ) external onlyOwner {
        SongRelease memory release = songReleases[songName];
        require(release.exists, "Song release does not exist");

        // Mint NFTs to this contract first
        if (nftIds.length > 0) {
            IERC222NFT(release.nftContract).mint(address(this), nftIds.length);
        }

        // Transfer tokens to this contract if needed
        if (tokenAmount > 0) {
            IERC222Token tokenContract = IERC222Token(release.tokenContract);
            require(tokenContract.transfer(address(this), tokenAmount), "Token transfer failed");
        }

        // Preload the vault
        IERC222Vault(release.vaultContract).preloadVault(nftIds, tokenAmount);

        emit VaultPreloaded(songName, nftIds.length, tokenAmount);
    }

    /**
     * @dev Update mint price for a song
     * @param songName Name of the song
     * @param newPrice New mint price in GHO
     */
    function setMintPrice(string memory songName, uint256 newPrice) external onlyOwner {
        require(songReleases[songName].exists, "Song release does not exist");
        require(newPrice >= MIN_MINT_PRICE, "Mint price below minimum");

        songReleases[songName].mintPrice = newPrice;
        emit MintPriceUpdated(songName, newPrice);
    }

    /**
     * @dev Enable or disable minting for a song
     * @param songName Name of the song
     * @param enabled Whether minting should be enabled
     */
    function setMintEnabled(string memory songName, bool enabled) external onlyOwner {
        require(songReleases[songName].exists, "Song release does not exist");

        songReleases[songName].mintEnabled = enabled;
        emit MintStatusUpdated(songName, enabled);
    }

    /**
     * @dev Update dev wallet address
     * @param newDevWallet New dev wallet address
     */
    function setDevWallet(address newDevWallet) external onlyOwner {
        require(newDevWallet != address(0), "Invalid dev wallet address");

        address oldWallet = devWallet;
        devWallet = newDevWallet;

        emit DevWalletUpdated(oldWallet, newDevWallet);
    }

    /**
     * @dev Update KANDI pool address
     * @param newKandiPool New KANDI pool address
     */
    function setKandiPool(address newKandiPool) external onlyOwner {
        require(newKandiPool != address(0), "Invalid KANDI pool address");

        address oldPool = kandiPool;
        kandiPool = newKandiPool;

        emit KandiPoolUpdated(oldPool, newKandiPool);
    }

    /**
     * @dev Update platform fee rate
     * @param newRate New platform fee rate in basis points
     */
    function setPlatformFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= MAX_FEE_BPS, "Platform fee rate too high");

        uint256 oldRate = platformFeeRate;
        platformFeeRate = newRate;

        emit PlatformFeeRateUpdated(oldRate, newRate);
    }

    function setFeeSplitBps(uint256 newTreasuryShareBps) external onlyOwner {
        require(newTreasuryShareBps <= 10000, "Invalid split bps");
        feeTreasuryShareBps = newTreasuryShareBps;
        emit FeeSplitUpdated(newTreasuryShareBps);
    }

    /**
     * @dev Get song release information
     * @param songName Name of the song
     */
    function getSongRelease(string memory songName) external view returns (SongRelease memory) {
        require(songReleases[songName].exists, "Song release does not exist");
        return songReleases[songName];
    }

    /**
     * @dev Get all song names
     */
    function getAllSongNames() external view returns (string[] memory) {
        return songNames;
    }

    /**
     * @dev Get user mint count for a specific song
     * @param user User address
     * @param songName Name of the song
     */
    function getUserMintCount(address user, string memory songName) external view returns (uint256) {
        return userMints[user][songName];
    }

    /**
     * @dev Calculate mint cost including platform fee
     * @param songName Name of the song
     * @param quantity Number of NFTs to mint
     */
    function calculateMintCost(string memory songName, uint256 quantity) 
        external 
        view 
        returns (uint256 totalCost, uint256 platformFee, uint256 netAmount) 
    {
        require(songReleases[songName].exists, "Song release does not exist");
        
        totalCost = songReleases[songName].mintPrice * quantity;
        platformFee = (totalCost * platformFeeRate) / 10000;
        netAmount = totalCost - platformFee;
    }

    /**
     * @dev Emergency function to withdraw tokens (owner only)
     * @param token Token address to withdraw
     * @param to Address to withdraw to
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(IERC20(token).transfer(to, amount), "Transfer failed");
    }

    /**
     * @dev Get comprehensive platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalSongs,
        address ghoAddress,
        address kandiAddress,
        address devWalletAddress,
        address kandiPoolAddress,
        uint256 currentPlatformFeeRate
    ) {
        return (
            songNames.length,
            address(ghoToken),
            address(kandiToken),
            devWallet,
            kandiPool,
            platformFeeRate
        );
    }
}