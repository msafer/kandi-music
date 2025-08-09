// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ERC222Token
 * @dev ERC-20 token (kToken) that pairs with ERC222NFT
 * @dev Maintains 1:10,000 ratio with NFT (1 NFT = 10,000 kTokens)
 * @dev No burning logic - tokens are always transferred, not destroyed
 * 
 * Constructor Parameters:
 * - name_ - Name of the kToken (e.g., "kHades")
 * - symbol_ - Symbol of the kToken (e.g., "KHADES")
 * - songName_ - Name of the song this token represents
 * - totalSupply_ - Total supply of kTokens (typically 100B for 10M NFTs)
 * - nftContract_ - Address of the paired NFT contract
 */
contract ERC222Token is ERC20, Ownable, ReentrancyGuard {
    // Conversion ratio: 1 NFT = 10,000 kTokens
    uint256 public constant TOKENS_PER_NFT = 10000;
    
    // Song name this token represents
    string public songName;
    
    // Paired NFT contract address
    address public nftContract;
    
    // Vault contract address for token deposits
    address public vaultContract;
    
    // Track if initial supply has been minted
    bool public initialSupplyMinted;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensDepositedToVault(address indexed from, uint256 amount);
    event VaultContractUpdated(address indexed oldVault, address indexed newVault);
    event NFTContractUpdated(address indexed oldNFT, address indexed newNFT);

    modifier onlyVaultOrOwner() {
        require(msg.sender == vaultContract || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        string memory songName_,
        uint256 totalSupply_,
        address nftContract_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        require(bytes(songName_).length > 0, "Song name cannot be empty");
        require(totalSupply_ > 0, "Total supply must be greater than 0");
        require(nftContract_ != address(0), "Invalid NFT contract address");

        songName = songName_;
        nftContract = nftContract_;
        
        // Mint initial supply to owner (will be transferred to vault)
        _mint(msg.sender, totalSupply_);
        initialSupplyMinted = true;
        
        emit TokensMinted(msg.sender, totalSupply_);
    }

    /**
     * @dev Mint tokens to a specific address (only owner or vault)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyVaultOrOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Deposit tokens to vault contract
     * @param amount Amount of tokens to deposit
     */
    function depositToVault(uint256 amount) external nonReentrant {
        require(vaultContract != address(0), "Vault contract not set");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Transfer tokens to vault
        _transfer(msg.sender, vaultContract, amount);
        
        emit TokensDepositedToVault(msg.sender, amount);
    }

    /**
     * @dev Set the vault contract address
     * @param newVault Address of the vault contract
     */
    function setVaultContract(address newVault) external onlyOwner {
        require(newVault != address(0), "Invalid vault address");
        
        address oldVault = vaultContract;
        vaultContract = newVault;
        
        emit VaultContractUpdated(oldVault, newVault);
    }

    /**
     * @dev Set the NFT contract address
     * @param newNFTContract Address of the NFT contract
     */
    function setNFTContract(address newNFTContract) external onlyOwner {
        require(newNFTContract != address(0), "Invalid NFT contract address");
        
        address oldNFT = nftContract;
        nftContract = newNFTContract;
        
        emit NFTContractUpdated(oldNFT, newNFTContract);
    }

    /**
     * @dev Calculate how many kTokens correspond to a given number of NFTs
     * @param nftAmount Number of NFTs
     * @return Number of kTokens
     */
    function nftToTokenAmount(uint256 nftAmount) external pure returns (uint256) {
        return nftAmount * TOKENS_PER_NFT;
    }

    /**
     * @dev Calculate how many NFTs correspond to a given number of kTokens
     * @param tokenAmount Number of kTokens
     * @return Number of NFTs (rounded down)
     */
    function tokenToNFTAmount(uint256 tokenAmount) external pure returns (uint256) {
        return tokenAmount / TOKENS_PER_NFT;
    }

    /**
     * @dev Check if token amount is valid for NFT conversion (divisible by TOKENS_PER_NFT)
     * @param tokenAmount Number of kTokens
     * @return True if amount is valid for conversion
     */
    function isValidNFTConversionAmount(uint256 tokenAmount) external pure returns (bool) {
        return tokenAmount > 0 && tokenAmount % TOKENS_PER_NFT == 0;
    }

    /**
     * @dev Get the maximum number of NFTs that can be obtained with given token amount
     * @param tokenAmount Number of kTokens
     * @return Number of NFTs that can be obtained
     */
    function getMaxNFTsFromTokens(uint256 tokenAmount) external pure returns (uint256) {
        return tokenAmount / TOKENS_PER_NFT;
    }

    /**
     * @dev Get the remaining tokens after NFT conversion
     * @param tokenAmount Number of kTokens
     * @return Remaining tokens that cannot be converted to NFTs
     */
    function getRemainingTokensAfterNFTConversion(uint256 tokenAmount) external pure returns (uint256) {
        return tokenAmount % TOKENS_PER_NFT;
    }

    /**
     * @dev Hook to emit events when transferring to vault (OpenZeppelin v5)
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        super._update(from, to, value);

        if (to == vaultContract && vaultContract != address(0) && from != address(0)) {
            emit TokensDepositedToVault(from, value);
        }
    }

    /**
     * @dev Return detailed token information
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        string memory tokenSongName,
        uint256 tokenTotalSupply,
        uint256 tokensPerNFT,
        address pairedNFTContract,
        address pairedVaultContract
    ) {
        return (
            name(),
            symbol(),
            songName,
            totalSupply(),
            TOKENS_PER_NFT,
            nftContract,
            vaultContract
        );
    }
}