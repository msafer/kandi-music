// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title KANDIToken
 * @dev Platform token for KANDI Music Platform with 100B fixed supply
 * @dev Handles distribution, vesting, staking rewards, and GHO swapping
 * 
 * Constructor Parameters:
 * - ghoToken_ - Address of GHO stablecoin for swapping
 * - devWallet_ - Address for team/development allocation
 * - stakingContract_ - Address of staking contract for rewards
 * - checkInContract_ - Address of daily check-in contract for rewards
 */
contract KANDIToken is ERC20, Ownable, ReentrancyGuard {
    // Total supply: 100 billion tokens
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000 * 10**18;
    
    // Distribution percentages (basis points)
    uint256 public constant OPEN_SALE_PCT = 5000; // 50%
    uint256 public constant AIRDROP_PCT = 2000; // 20%
    uint256 public constant FARCASTER_PCT = 1000; // 10%
    uint256 public constant STAKING_REWARDS_PCT = 1000; // 10%
    uint256 public constant CHECKIN_REWARDS_PCT = 1000; // 10%
    
    // Allocation amounts
    uint256 public constant OPEN_SALE_AMOUNT = (TOTAL_SUPPLY * OPEN_SALE_PCT) / 10000;
    uint256 public constant AIRDROP_AMOUNT = (TOTAL_SUPPLY * AIRDROP_PCT) / 10000;
    uint256 public constant FARCASTER_AMOUNT = (TOTAL_SUPPLY * FARCASTER_PCT) / 10000;
    uint256 public constant STAKING_REWARDS_AMOUNT = (TOTAL_SUPPLY * STAKING_REWARDS_PCT) / 10000;
    uint256 public constant CHECKIN_REWARDS_AMOUNT = (TOTAL_SUPPLY * CHECKIN_REWARDS_PCT) / 10000;
    
    // Vesting configuration
    uint256 public constant AIRDROP_LOCK_PERIOD = 90 days;
    
    // External contracts
    IERC20 public immutable ghoToken;
    address public stakingContract;
    address public checkInContract;
    address public devWallet;
    
    // Distribution tracking
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 lockPeriod;
        bool isActive;
    }
    
    mapping(address => VestingSchedule) public airdropVesting;
    mapping(address => bool) public farcasterEligible;
    mapping(address => bool) public farcasterClaimed;
    
    // Distribution state
    uint256 public openSaleDistributed;
    uint256 public airdropDistributed;
    uint256 public farcasterDistributed;
    uint256 public stakingRewardsDistributed;
    uint256 public checkInRewardsDistributed;
    
    // Sale configuration
    bool public openSaleActive;
    uint256 public salePrice; // Price per token in GHO (18 decimals)
    
    // Swap configuration
    bool public swapEnabled = true;
    uint256 public swapFeeRate = 100; // 1% in basis points
    address public swapFeeReceiver;
    
    // Events
    event OpenSalePurchase(address indexed buyer, uint256 ghoAmount, uint256 kandiAmount);
    event AirdropScheduled(address indexed recipient, uint256 amount, uint256 unlockTime);
    event AirdropClaimed(address indexed recipient, uint256 amount);
    event FarcasterRewardClaimed(address indexed recipient, uint256 amount);
    event StakingRewardDistributed(address indexed recipient, uint256 amount);
    event CheckInRewardDistributed(address indexed recipient, uint256 amount);
    event TokensSwappedToGHO(address indexed user, uint256 kandiAmount, uint256 ghoAmount);
    event SaleStatusUpdated(bool active);
    event SalePriceUpdated(uint256 newPrice);
    event SwapConfigUpdated(bool enabled, uint256 feeRate, address feeReceiver);
    event ContractAddressUpdated(string contractType, address newAddress);

    modifier onlyStakingContract() {
        require(msg.sender == stakingContract, "Only staking contract");
        _;
    }

    modifier onlyCheckInContract() {
        require(msg.sender == checkInContract, "Only check-in contract");
        _;
    }

    constructor(
        address ghoToken_,
        address devWallet_,
        address stakingContract_,
        address checkInContract_
    ) ERC20("KANDI", "KANDI") Ownable(msg.sender) {
        require(ghoToken_ != address(0), "Invalid GHO token address");
        require(devWallet_ != address(0), "Invalid dev wallet address");

        ghoToken = IERC20(ghoToken_);
        devWallet = devWallet_;
        stakingContract = stakingContract_;
        checkInContract = checkInContract_;
        swapFeeReceiver = devWallet_;

        // Mint total supply to this contract for controlled distribution
        _mint(address(this), TOTAL_SUPPLY);
    }

    /**
     * @dev Purchase KANDI tokens with GHO during open sale
     * @param ghoAmount Amount of GHO to spend
     */
    function purchaseTokens(uint256 ghoAmount) external nonReentrant {
        require(openSaleActive, "Open sale is not active");
        require(ghoAmount > 0, "Amount must be greater than 0");
        require(salePrice > 0, "Sale price not set");

        uint256 kandiAmount = (ghoAmount * 10**18) / salePrice;
        require(openSaleDistributed + kandiAmount <= OPEN_SALE_AMOUNT, "Exceeds open sale allocation");

        // Transfer GHO from user
        require(ghoToken.transferFrom(msg.sender, devWallet, ghoAmount), "GHO transfer failed");

        // Transfer KANDI to user
        require(transfer(msg.sender, kandiAmount), "KANDI transfer failed");

        openSaleDistributed += kandiAmount;

        emit OpenSalePurchase(msg.sender, ghoAmount, kandiAmount);
    }

    /**
     * @dev Schedule airdrop for a user (90-day lock)
     * @param recipient Address to receive airdrop
     * @param amount Amount of KANDI tokens to airdrop
     */
    function scheduleAirdrop(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(airdropDistributed + amount <= AIRDROP_AMOUNT, "Exceeds airdrop allocation");
        require(!airdropVesting[recipient].isActive, "Airdrop already scheduled");

        airdropVesting[recipient] = VestingSchedule({
            totalAmount: amount,
            claimedAmount: 0,
            startTime: block.timestamp,
            lockPeriod: AIRDROP_LOCK_PERIOD,
            isActive: true
        });

        airdropDistributed += amount;

        emit AirdropScheduled(recipient, amount, block.timestamp + AIRDROP_LOCK_PERIOD);
    }

    /**
     * @dev Batch schedule airdrops for multiple users
     * @param recipients Array of addresses to receive airdrops
     * @param amounts Array of amounts corresponding to each recipient
     */
    function batchScheduleAirdrop(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(airdropDistributed + totalAmount <= AIRDROP_AMOUNT, "Exceeds airdrop allocation");

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0) && amounts[i] > 0 && !airdropVesting[recipients[i]].isActive) {
                airdropVesting[recipients[i]] = VestingSchedule({
                    totalAmount: amounts[i],
                    claimedAmount: 0,
                    startTime: block.timestamp,
                    lockPeriod: AIRDROP_LOCK_PERIOD,
                    isActive: true
                });

                emit AirdropScheduled(recipients[i], amounts[i], block.timestamp + AIRDROP_LOCK_PERIOD);
            }
        }

        airdropDistributed += totalAmount;
    }

    /**
     * @dev Claim vested airdrop tokens
     */
    function claimAirdrop() external nonReentrant {
        VestingSchedule storage vesting = airdropVesting[msg.sender];
        require(vesting.isActive, "No active airdrop");
        require(block.timestamp >= vesting.startTime + vesting.lockPeriod, "Tokens still locked");
        require(vesting.claimedAmount < vesting.totalAmount, "Already fully claimed");

        uint256 claimableAmount = vesting.totalAmount - vesting.claimedAmount;
        vesting.claimedAmount = vesting.totalAmount;

        require(transfer(msg.sender, claimableAmount), "Transfer failed");

        emit AirdropClaimed(msg.sender, claimableAmount);
    }

    /**
     * @dev Set Farcaster eligibility for users
     * @param users Array of user addresses
     * @param eligible Array of eligibility status
     */
    function setFarcasterEligibility(address[] calldata users, bool[] calldata eligible) external onlyOwner {
        require(users.length == eligible.length, "Arrays length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            farcasterEligible[users[i]] = eligible[i];
        }
    }

    /**
     * @dev Claim Farcaster rewards
     * @param amount Amount to claim (up to eligible amount)
     */
    function claimFarcasterReward(uint256 amount) external nonReentrant {
        require(farcasterEligible[msg.sender], "Not eligible for Farcaster rewards");
        require(!farcasterClaimed[msg.sender], "Already claimed");
        require(amount > 0, "Amount must be greater than 0");
        require(farcasterDistributed + amount <= FARCASTER_AMOUNT, "Exceeds Farcaster allocation");

        farcasterClaimed[msg.sender] = true;
        farcasterDistributed += amount;

        require(transfer(msg.sender, amount), "Transfer failed");

        emit FarcasterRewardClaimed(msg.sender, amount);
    }

    /**
     * @dev Distribute staking rewards (only staking contract)
     * @param recipient Address to receive rewards
     * @param amount Amount of rewards
     */
    function distributeStakingReward(address recipient, uint256 amount) external onlyStakingContract {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(stakingRewardsDistributed + amount <= STAKING_REWARDS_AMOUNT, "Exceeds staking allocation");

        stakingRewardsDistributed += amount;

        require(transfer(recipient, amount), "Transfer failed");

        emit StakingRewardDistributed(recipient, amount);
    }

    /**
     * @dev Distribute check-in rewards (only check-in contract)
     * @param recipient Address to receive rewards
     * @param amount Amount of rewards
     */
    function distributeCheckInReward(address recipient, uint256 amount) external onlyCheckInContract {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(checkInRewardsDistributed + amount <= CHECKIN_REWARDS_AMOUNT, "Exceeds check-in allocation");

        checkInRewardsDistributed += amount;

        require(transfer(recipient, amount), "Transfer failed");

        emit CheckInRewardDistributed(recipient, amount);
    }

    /**
     * @dev Swap KANDI tokens to GHO
     * @param kandiAmount Amount of KANDI to swap
     * @return ghoAmount Amount of GHO received
     */
    function swapToGHO(uint256 kandiAmount) external nonReentrant returns (uint256 ghoAmount) {
        require(swapEnabled, "Swapping is disabled");
        require(kandiAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= kandiAmount, "Insufficient KANDI balance");

        // Calculate swap amount (simplified 1:1 ratio minus fees)
        uint256 swapFee = (kandiAmount * swapFeeRate) / 10000;
        ghoAmount = kandiAmount - swapFee;

        // Transfer KANDI from user to this contract
        require(transferFrom(msg.sender, address(this), kandiAmount), "KANDI transfer failed");

        // Transfer GHO to user
        require(ghoToken.transfer(msg.sender, ghoAmount), "GHO transfer failed");

        // Transfer swap fee to fee receiver
        if (swapFee > 0) {
            require(transfer(swapFeeReceiver, swapFee), "Fee transfer failed");
        }

        emit TokensSwappedToGHO(msg.sender, kandiAmount, ghoAmount);
    }

    /**
     * @dev Set open sale status
     * @param active Whether sale should be active
     */
    function setOpenSaleActive(bool active) external onlyOwner {
        openSaleActive = active;
        emit SaleStatusUpdated(active);
    }

    /**
     * @dev Set sale price
     * @param price Price per KANDI token in GHO (18 decimals)
     */
    function setSalePrice(uint256 price) external onlyOwner {
        require(price > 0, "Price must be greater than 0");
        salePrice = price;
        emit SalePriceUpdated(price);
    }

    /**
     * @dev Update swap configuration
     * @param enabled Whether swapping should be enabled
     * @param feeRate Swap fee rate in basis points
     * @param feeReceiver Address to receive swap fees
     */
    function setSwapConfig(bool enabled, uint256 feeRate, address feeReceiver) external onlyOwner {
        require(feeRate <= 1000, "Fee rate too high (max 10%)");
        require(feeReceiver != address(0), "Invalid fee receiver");

        swapEnabled = enabled;
        swapFeeRate = feeRate;
        swapFeeReceiver = feeReceiver;

        emit SwapConfigUpdated(enabled, feeRate, feeReceiver);
    }

    /**
     * @dev Update staking contract address
     * @param newStakingContract New staking contract address
     */
    function setStakingContract(address newStakingContract) external onlyOwner {
        stakingContract = newStakingContract;
        emit ContractAddressUpdated("staking", newStakingContract);
    }

    /**
     * @dev Update check-in contract address
     * @param newCheckInContract New check-in contract address
     */
    function setCheckInContract(address newCheckInContract) external onlyOwner {
        checkInContract = newCheckInContract;
        emit ContractAddressUpdated("checkin", newCheckInContract);
    }

    /**
     * @dev Update dev wallet address
     * @param newDevWallet New dev wallet address
     */
    function setDevWallet(address newDevWallet) external onlyOwner {
        require(newDevWallet != address(0), "Invalid dev wallet");
        devWallet = newDevWallet;
        emit ContractAddressUpdated("devwallet", newDevWallet);
    }

    /**
     * @dev Get airdrop information for a user
     * @param user User address
     */
    function getAirdropInfo(address user) external view returns (
        uint256 totalAmount,
        uint256 claimedAmount,
        uint256 claimableAmount,
        uint256 unlockTime,
        bool isActive
    ) {
        VestingSchedule memory vesting = airdropVesting[user];
        totalAmount = vesting.totalAmount;
        claimedAmount = vesting.claimedAmount;
        unlockTime = vesting.startTime + vesting.lockPeriod;
        isActive = vesting.isActive;
        
        if (isActive && block.timestamp >= unlockTime) {
            claimableAmount = totalAmount - claimedAmount;
        } else {
            claimableAmount = 0;
        }
    }

    /**
     * @dev Get distribution statistics
     */
    function getDistributionStats() external view returns (
        uint256 openSaleRemaining,
        uint256 airdropRemaining,
        uint256 farcasterRemaining,
        uint256 stakingRewardsRemaining,
        uint256 checkInRewardsRemaining
    ) {
        openSaleRemaining = OPEN_SALE_AMOUNT - openSaleDistributed;
        airdropRemaining = AIRDROP_AMOUNT - airdropDistributed;
        farcasterRemaining = FARCASTER_AMOUNT - farcasterDistributed;
        stakingRewardsRemaining = STAKING_REWARDS_AMOUNT - stakingRewardsDistributed;
        checkInRewardsRemaining = CHECKIN_REWARDS_AMOUNT - checkInRewardsDistributed;
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
     * @dev Get comprehensive token information
     */
    function getTokenInfo() external view returns (
        uint256 totalSupplyAmount,
        uint256 circulatingSupply,
        bool saleActive,
        uint256 currentSalePrice,
        bool swappingEnabled,
        uint256 currentSwapFeeRate
    ) {
        return (
            TOTAL_SUPPLY,
            totalSupply() - balanceOf(address(this)),
            openSaleActive,
            salePrice,
            swapEnabled,
            swapFeeRate
        );
    }
}