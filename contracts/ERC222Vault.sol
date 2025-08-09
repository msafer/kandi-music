// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

interface IERC222NFT is IERC721 {
    function MAX_SUPPLY() external view returns (uint256);
    function totalMinted() external view returns (uint256);
    function songName() external view returns (string memory);
}

interface IERC222Token is IERC20 {
    function TOKENS_PER_NFT() external view returns (uint256);
    function songName() external view returns (string memory);
    function mint(address to, uint256 amount) external;
}

/**
 * @title ERC222Vault
 * @dev Vault contract that enables swapping between NFTs and kTokens
 * @dev Tracks floor price and manages paired NFT/kToken storage
 * @dev Enters "open market" mode after all NFTs are minted
 * 
 * Constructor Parameters:
 * @param nftContract_ - Address of the paired ERC222NFT contract
 * @param tokenContract_ - Address of the paired ERC222Token contract
 * @param songName_ - Name of the song this vault represents
 * @param admin_ - Admin address for management functions
 */
contract ERC222Vault is Ownable, ReentrancyGuard, IERC721Receiver {
    // Paired contracts
    IERC222NFT public immutable nftContract;
    IERC222Token public immutable tokenContract;
    
    // Song information
    string public songName;
    
    // Conversion ratio (from token contract)
    uint256 public immutable TOKENS_PER_NFT;
    
    // Vault state
    mapping(uint256 => bool) public nftHeld; // Track which NFTs are in vault
    uint256 public nftCount; // Number of NFTs currently in vault
    uint256 public tokenBalance; // Number of kTokens currently in vault
    
    // Market data
    uint256 public totalMarketCap; // Total value of all transactions
    bool public openMarketMode; // True when all NFTs are minted
    
    // Admin controls
    address public admin;
    bool public swapEnabled = true;
    
    // Events
    event NFTDepositedToVault(address indexed user, uint256 indexed tokenId, uint256 tokensReceived);
    event TokensDepositedToVault(address indexed user, uint256 tokenAmount, uint256 indexed nftReceived);
    event NFTWithdrawnFromVault(address indexed user, uint256 indexed tokenId, uint256 tokensPaid);
    event TokensWithdrawnFromVault(address indexed user, uint256 tokenAmount, uint256 indexed nftDeposited);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event SwapStatusUpdated(bool enabled);
    event OpenMarketModeActivated(uint256 totalNFTsMinted);
    event VaultPreloaded(uint256 nftCount, uint256 tokenAmount);
    event FloorPriceUpdated(uint256 newFloorPrice);

    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == owner(), "Not authorized admin");
        _;
    }

    modifier swapIsEnabled() {
        require(swapEnabled, "Swapping is disabled");
        _;
    }

    constructor(
        address nftContract_,
        address tokenContract_,
        string memory songName_,
        address admin_
    ) Ownable(msg.sender) {
        require(nftContract_ != address(0), "Invalid NFT contract");
        require(tokenContract_ != address(0), "Invalid token contract");
        require(bytes(songName_).length > 0, "Song name cannot be empty");
        require(admin_ != address(0), "Invalid admin address");

        nftContract = IERC222NFT(nftContract_);
        tokenContract = IERC222Token(tokenContract_);
        songName = songName_;
        admin = admin_;
        
        // Get conversion ratio from token contract
        TOKENS_PER_NFT = tokenContract.TOKENS_PER_NFT();
    }

    /**
     * @dev Deposit NFT to vault and receive kTokens
     * @param tokenId NFT token ID to deposit
     */
    function depositNFT(uint256 tokenId) external nonReentrant swapIsEnabled {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(!nftHeld[tokenId], "NFT already in vault");
        require(tokenBalance >= TOKENS_PER_NFT, "Insufficient tokens in vault");

        // Transfer NFT to vault
        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Update state
        nftHeld[tokenId] = true;
        nftCount++;
        tokenBalance -= TOKENS_PER_NFT;
        
        // Transfer kTokens to user
        require(tokenContract.transfer(msg.sender, TOKENS_PER_NFT), "Token transfer failed");
        
        emit NFTDepositedToVault(msg.sender, tokenId, TOKENS_PER_NFT);
        emit FloorPriceUpdated(getFloorPrice());
    }

    /**
     * @dev Deposit kTokens to vault and receive NFT (if available)
     * @param tokenAmount Amount of kTokens to deposit (must be multiple of TOKENS_PER_NFT)
     */
    function depositTokens(uint256 tokenAmount) external nonReentrant swapIsEnabled {
        require(tokenAmount >= TOKENS_PER_NFT, "Insufficient token amount");
        require(tokenAmount % TOKENS_PER_NFT == 0, "Invalid token amount");
        require(nftCount > 0, "No NFTs available in vault");
        
        uint256 nftAmount = tokenAmount / TOKENS_PER_NFT;
        require(nftAmount <= nftCount, "Not enough NFTs in vault");

        // Transfer kTokens from user to vault
        require(tokenContract.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        
        // Update token balance
        tokenBalance += tokenAmount;
        
        // Transfer NFTs to user
        uint256 transferredNFTs = 0;
        for (uint256 i = 1; i <= nftContract.MAX_SUPPLY() && transferredNFTs < nftAmount; i++) {
            if (nftHeld[i]) {
                nftContract.safeTransferFrom(address(this), msg.sender, i);
                nftHeld[i] = false;
                nftCount--;
                transferredNFTs++;
                
                emit TokensDepositedToVault(msg.sender, TOKENS_PER_NFT, i);
            }
        }
        
        require(transferredNFTs == nftAmount, "Failed to transfer all NFTs");
        emit FloorPriceUpdated(getFloorPrice());
    }

    /**
     * @dev Admin function to preload vault with NFTs and tokens
     * @param nftIds Array of NFT token IDs to deposit
     * @param tokenAmount Amount of kTokens to deposit
     */
    function preloadVault(uint256[] calldata nftIds, uint256 tokenAmount) external onlyAdmin {
        // Deposit NFTs
        for (uint256 i = 0; i < nftIds.length; i++) {
            uint256 tokenId = nftIds[i];
            require(!nftHeld[tokenId], "NFT already in vault");
            
            nftContract.safeTransferFrom(msg.sender, address(this), tokenId);
            nftHeld[tokenId] = true;
            nftCount++;
        }
        
        // Deposit tokens
        if (tokenAmount > 0) {
            require(tokenContract.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
            tokenBalance += tokenAmount;
        }
        
        emit VaultPreloaded(nftIds.length, tokenAmount);
        
        // Check if we should activate open market mode
        _checkOpenMarketMode();
    }

    /**
     * @dev Calculate current floor price based on market cap and total NFTs
     * @return Floor price in wei
     */
    function getFloorPrice() public view returns (uint256) {
        uint256 totalNFTs = nftContract.totalMinted();
        if (totalNFTs == 0) return 0;
        
        if (openMarketMode) {
            // In open market mode, floor price is dynamic based on vault composition
            if (nftCount == 0) return 0;
            return tokenBalance / nftCount / TOKENS_PER_NFT;
        } else {
            // During mint phase, use market cap calculation
            return totalMarketCap / totalNFTs;
        }
    }

    /**
     * @dev Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 nftsInVault,
        uint256 tokensInVault,
        uint256 floorPrice,
        bool isOpenMarket,
        uint256 totalNFTsMinted,
        uint256 maxNFTSupply
    ) {
        return (
            nftCount,
            tokenBalance,
            getFloorPrice(),
            openMarketMode,
            nftContract.totalMinted(),
            nftContract.MAX_SUPPLY()
        );
    }

    /**
     * @dev Check if a specific NFT is held in the vault
     * @param tokenId NFT token ID to check
     * @return True if NFT is in vault
     */
    function isNFTInVault(uint256 tokenId) external view returns (bool) {
        return nftHeld[tokenId];
    }

    /**
     * @dev Get list of NFT IDs currently in vault (up to maxResults)
     * @param maxResults Maximum number of results to return
     * @return Array of NFT token IDs in vault
     */
    function getNFTsInVault(uint256 maxResults) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](Math.min(nftCount, maxResults));
        uint256 found = 0;
        
        for (uint256 i = 1; i <= nftContract.MAX_SUPPLY() && found < maxResults; i++) {
            if (nftHeld[i]) {
                result[found] = i;
                found++;
            }
        }
        
        // Resize array if needed
        if (found < result.length) {
            uint256[] memory resized = new uint256[](found);
            for (uint256 i = 0; i < found; i++) {
                resized[i] = result[i];
            }
            return resized;
        }
        
        return result;
    }

    /**
     * @dev Update market cap (called by MintRouter or admin)
     * @param additionalValue Additional value to add to market cap
     */
    function updateMarketCap(uint256 additionalValue) external onlyAdmin {
        totalMarketCap += additionalValue;
        emit FloorPriceUpdated(getFloorPrice());
        
        // Check if we should activate open market mode
        _checkOpenMarketMode();
    }

    /**
     * @dev Check and activate open market mode if all NFTs are minted
     */
    function _checkOpenMarketMode() internal {
        if (!openMarketMode && nftContract.totalMinted() >= nftContract.MAX_SUPPLY()) {
            openMarketMode = true;
            emit OpenMarketModeActivated(nftContract.totalMinted());
        }
    }

    /**
     * @dev Set admin address
     * @param newAdmin New admin address
     */
    function setAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Invalid admin address");
        
        address oldAdmin = admin;
        admin = newAdmin;
        
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    /**
     * @dev Enable or disable swapping
     * @param enabled Whether swapping should be enabled
     */
    function setSwapEnabled(bool enabled) external onlyAdmin {
        swapEnabled = enabled;
        emit SwapStatusUpdated(enabled);
    }

    /**
     * @dev Emergency function to withdraw tokens (admin only)
     * @param to Address to withdraw tokens to
     * @param amount Amount of tokens to withdraw
     */
    function emergencyWithdrawTokens(address to, uint256 amount) external onlyAdmin {
        require(to != address(0), "Invalid recipient");
        require(amount <= tokenBalance, "Insufficient token balance");
        
        tokenBalance -= amount;
        require(tokenContract.transfer(to, amount), "Token transfer failed");
    }

    /**
     * @dev Emergency function to withdraw NFTs (admin only)
     * @param to Address to withdraw NFT to
     * @param tokenId NFT token ID to withdraw
     */
    function emergencyWithdrawNFT(address to, uint256 tokenId) external onlyAdmin {
        require(to != address(0), "Invalid recipient");
        require(nftHeld[tokenId], "NFT not in vault");
        
        nftHeld[tokenId] = false;
        nftCount--;
        nftContract.safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @dev Handle NFT transfers to this contract
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Get comprehensive vault information
     */
    function getVaultInfo() external view returns (
        string memory vaultSongName,
        address nftAddress,
        address tokenAddress,
        uint256 conversionRatio,
        uint256 nftsHeld,
        uint256 tokensHeld,
        uint256 currentFloorPrice,
        bool openMarket,
        bool swappingEnabled
    ) {
        return (
            songName,
            address(nftContract),
            address(tokenContract),
            TOKENS_PER_NFT,
            nftCount,
            tokenBalance,
            getFloorPrice(),
            openMarketMode,
            swapEnabled
        );
    }
}