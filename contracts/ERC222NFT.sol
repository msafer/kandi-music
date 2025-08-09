// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ERC222NFT
 * @dev ERC-721A based NFT contract for KANDI Music Platform
 * @dev Supports EIP-2981 royalties and integrates with ERC222Vault
 * 
 * Constructor Parameters:
 * - name_ - Name of the NFT collection (e.g., "Hades Music NFT")
 * - symbol_ - Symbol of the NFT collection (e.g., "HADES")
 * - songName_ - Name of the song for this release
 * - maxSupply_ - Maximum number of NFTs that can be minted (typically 10M)
 * - baseURI_ - Base URI for token metadata
 * - royaltyReceiver_ - Address to receive royalty payments
 * - royaltyFeeNumerator_ - Royalty fee in basis points (e.g., 250 = 2.5%)
 */
contract ERC222NFT is ERC721A, Ownable, IERC2981, ReentrancyGuard {
    // Maximum supply of NFTs for this song
    uint256 public immutable MAX_SUPPLY;
    
    // Song name this NFT represents
    string public songName;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Royalty information
    address public royaltyReceiver;
    uint96 public royaltyFeeNumerator; // Basis points (10000 = 100%)
    
    // Vault contract address for NFT deposits
    address public vaultContract;
    
    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 quantity);
    event NFTDepositedToVault(address indexed from, uint256 indexed tokenId);
    event RoyaltyUpdated(address indexed receiver, uint96 feeNumerator);
    event VaultContractUpdated(address indexed oldVault, address indexed newVault);
    event BaseURIUpdated(string newBaseURI);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory songName_,
        uint256 maxSupply_,
        string memory baseURI_,
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_
    ) ERC721A(name_, symbol_) Ownable(msg.sender) {
        require(maxSupply_ > 0, "Max supply must be greater than 0");
        require(bytes(songName_).length > 0, "Song name cannot be empty");
        require(royaltyReceiver_ != address(0), "Invalid royalty receiver");
        require(royaltyFeeNumerator_ <= 10000, "Royalty fee too high");

        MAX_SUPPLY = maxSupply_;
        songName = songName_;
        _baseTokenURI = baseURI_;
        royaltyReceiver = royaltyReceiver_;
        royaltyFeeNumerator = royaltyFeeNumerator_;
    }

    /**
     * @dev Mint NFTs to a specific address
     * @param to Address to mint NFTs to
     * @param quantity Number of NFTs to mint
     */
    function mint(address to, uint256 quantity) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(quantity > 0, "Quantity must be greater than 0");
        require(_totalMinted() + quantity <= MAX_SUPPLY, "Exceeds maximum supply");

        uint256 startTokenId = _nextTokenId();
        _mint(to, quantity);

        emit NFTMinted(to, startTokenId, quantity);
    }

    /**
     * @dev Batch mint NFTs to multiple addresses
     * @param recipients Array of addresses to mint to
     * @param quantities Array of quantities to mint to each address
     */
    function batchMint(address[] calldata recipients, uint256[] calldata quantities) 
        external 
        onlyOwner 
    {
        require(recipients.length == quantities.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");

        uint256 totalQuantity = 0;
        for (uint256 i = 0; i < quantities.length; i++) {
            totalQuantity += quantities[i];
        }
        require(_totalMinted() + totalQuantity <= MAX_SUPPLY, "Exceeds maximum supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0) && quantities[i] > 0) {
                uint256 startTokenId = _nextTokenId();
                _mint(recipients[i], quantities[i]);
                emit NFTMinted(recipients[i], startTokenId, quantities[i]);
            }
        }
    }

    /**
     * @dev Deposit NFT to vault contract
     * @param tokenId Token ID to deposit
     */
    function depositToVault(uint256 tokenId) external nonReentrant {
        require(vaultContract != address(0), "Vault contract not set");
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        // Transfer NFT to vault
        safeTransferFrom(msg.sender, vaultContract, tokenId);
        
        emit NFTDepositedToVault(msg.sender, tokenId);
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
     * @dev Update royalty information
     * @param receiver Address to receive royalties
     * @param feeNumerator Royalty fee in basis points
     */
    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        require(receiver != address(0), "Invalid receiver");
        require(feeNumerator <= 10000, "Royalty fee too high");

        royaltyReceiver = receiver;
        royaltyFeeNumerator = feeNumerator;

        emit RoyaltyUpdated(receiver, feeNumerator);
    }

    /**
     * @dev Update base URI for metadata
     * @param newBaseURI New base URI
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Get total number of NFTs minted
     */
    function totalMinted() external view returns (uint256) {
        return _totalMinted();
    }

    /**
     * @dev Check how many NFTs are available to mint
     */
    function availableToMint() external view returns (uint256) {
        return MAX_SUPPLY - _totalMinted();
    }

    /**
     * @dev Override _baseURI to return the base URI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override _startTokenId to start from 1 instead of 0
     */
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /**
     * @dev Override transfer functions to emit deposit events when transferring to vault
     */
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual override {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
        
        // If transferring to vault contract, emit events for each token
        if (to == vaultContract && vaultContract != address(0)) {
            for (uint256 i = 0; i < quantity; i++) {
                emit NFTDepositedToVault(from, startTokenId + i);
            }
        }
    }

    // EIP-2981 Royalty Standard Implementation
    /**
     * @dev Returns royalty information for a token
     * @param tokenId Token ID (not used in this implementation)
     * @param salePrice Sale price of the token
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = royaltyReceiver;
        royaltyAmount = (salePrice * royaltyFeeNumerator) / 10000;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721A, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}