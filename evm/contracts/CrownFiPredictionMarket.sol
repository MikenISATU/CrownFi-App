// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CrownFi Prediction Market
/// @notice Pageant-only, pooled USDC prediction markets with admin settlement and user custody.
/// @dev Each market snapshots its fee and treasury so configuration cannot change after stakes begin.
contract CrownFiPredictionMarket is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Open,
        Closed,
        Resolved,
        Cancelled
    }

    struct Market {
        string question;
        string category;
        uint64 closeTime;
        uint8 numOptions;
        Status status;
        uint8 winningOption;
        uint16 feeBps;
        address treasury;
        uint256 totalPool;
        uint256 payoutsPaid;
        uint256 feesPaid;
    }

    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint16 public constant MAX_FEE_BPS = 1_000;
    uint8 public constant MAX_OPTIONS = 32;

    IERC20 public immutable settlementToken;
    uint16 public defaultFeeBps;
    address public defaultTreasury;
    uint256 public marketCount;

    mapping(uint256 marketId => Market market) private _markets;
    mapping(uint256 marketId => mapping(uint8 option => uint256 amount)) private _pools;
    mapping(uint256 marketId => mapping(address user => mapping(uint8 option => uint256 amount))) private _positions;
    mapping(uint256 marketId => mapping(address user => bool settled)) private _settled;

    error InvalidAddress();
    error InvalidFee(uint16 feeBps);
    error InvalidMarketParameters();
    error MarketNotFound(uint256 marketId);
    error MarketNotOpen(uint256 marketId);
    error MarketNotClosable(uint256 marketId);
    error MarketNotResolvable(uint256 marketId);
    error InvalidOption(uint8 option);
    error InvalidAmount();
    error NothingToWithdraw();
    error NothingToClaim();
    error AlreadySettled();
    error NoWinningStake();
    error UnsupportedTokenBehavior();
    error OwnershipRenunciationDisabled();

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        string category,
        uint8 numOptions,
        uint64 closeTime,
        uint16 feeBps,
        address indexed treasury
    );
    event Staked(uint256 indexed marketId, address indexed user, uint8 indexed option, uint256 amount);
    event Unstaked(uint256 indexed marketId, address indexed user, uint8 indexed option, uint256 amount);
    event MarketClosed(uint256 indexed marketId);
    event MarketResolved(uint256 indexed marketId, uint8 indexed winningOption, uint256 winningPool);
    event MarketCancelled(uint256 indexed marketId);
    event Claimed(uint256 indexed marketId, address indexed user, uint256 gross, uint256 fee, uint256 net);
    event Refunded(uint256 indexed marketId, address indexed user, uint256 amount);
    event DefaultFeeUpdated(uint16 previousFeeBps, uint16 newFeeBps);
    event DefaultTreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);

    constructor(address initialOwner, IERC20 token, address treasury, uint16 feeBps) Ownable(initialOwner) {
        if (initialOwner == address(0) || address(token) == address(0) || treasury == address(0)) {
            revert InvalidAddress();
        }
        if (feeBps > MAX_FEE_BPS) revert InvalidFee(feeBps);
        settlementToken = token;
        defaultTreasury = treasury;
        defaultFeeBps = feeBps;
    }

    function createMarket(
        string calldata question,
        string calldata category,
        uint8 numOptions,
        uint64 closeTime
    ) external onlyOwner whenNotPaused returns (uint256 marketId) {
        if (
            bytes(question).length == 0 ||
            bytes(category).length == 0 ||
            numOptions < 2 ||
            numOptions > MAX_OPTIONS ||
            closeTime <= block.timestamp
        ) revert InvalidMarketParameters();

        marketId = ++marketCount;
        _markets[marketId] = Market({
            question: question,
            category: category,
            closeTime: closeTime,
            numOptions: numOptions,
            status: Status.Open,
            winningOption: 0,
            feeBps: defaultFeeBps,
            treasury: defaultTreasury,
            totalPool: 0,
            payoutsPaid: 0,
            feesPaid: 0
        });

        emit MarketCreated(marketId, question, category, numOptions, closeTime, defaultFeeBps, defaultTreasury);
    }

    function stake(uint256 marketId, uint8 option, uint256 amount) external nonReentrant whenNotPaused {
        Market storage market = _market(marketId);
        _requireOpen(marketId, market);
        if (option >= market.numOptions) revert InvalidOption(option);
        if (amount == 0) revert InvalidAmount();

        _pools[marketId][option] += amount;
        _positions[marketId][msg.sender][option] += amount;
        market.totalPool += amount;

        uint256 balanceBefore = settlementToken.balanceOf(address(this));
        settlementToken.safeTransferFrom(msg.sender, address(this), amount);
        if (settlementToken.balanceOf(address(this)) != balanceBefore + amount) {
            revert UnsupportedTokenBehavior();
        }

        emit Staked(marketId, msg.sender, option, amount);
    }

    /// @notice Withdraws the caller's complete position for one option before market close.
    function unstake(uint256 marketId, uint8 option) external nonReentrant returns (uint256 amount) {
        Market storage market = _market(marketId);
        _requireOpen(marketId, market);
        if (option >= market.numOptions) revert InvalidOption(option);

        amount = _positions[marketId][msg.sender][option];
        if (amount == 0) revert NothingToWithdraw();

        _positions[marketId][msg.sender][option] = 0;
        _pools[marketId][option] -= amount;
        market.totalPool -= amount;
        settlementToken.safeTransfer(msg.sender, amount);

        emit Unstaked(marketId, msg.sender, option, amount);
    }

    function closeMarket(uint256 marketId) external onlyOwner {
        Market storage market = _market(marketId);
        if (market.status != Status.Open) revert MarketNotResolvable(marketId);
        if (block.timestamp < market.closeTime) revert MarketNotClosable(marketId);
        market.status = Status.Closed;
        emit MarketClosed(marketId);
    }

    function resolveMarket(uint256 marketId, uint8 winningOption) external onlyOwner {
        Market storage market = _market(marketId);
        if (market.status == Status.Open) {
            if (block.timestamp < market.closeTime) revert MarketNotResolvable(marketId);
            market.status = Status.Closed;
            emit MarketClosed(marketId);
        }
        if (market.status != Status.Closed) revert MarketNotResolvable(marketId);
        if (winningOption >= market.numOptions) revert InvalidOption(winningOption);

        uint256 winningPool = _pools[marketId][winningOption];
        if (winningPool == 0) revert NoWinningStake();

        market.status = Status.Resolved;
        market.winningOption = winningOption;
        emit MarketResolved(marketId, winningOption, winningPool);
    }

    function cancelMarket(uint256 marketId) external onlyOwner {
        Market storage market = _market(marketId);
        if (market.status != Status.Open && market.status != Status.Closed) {
            revert MarketNotResolvable(marketId);
        }
        market.status = Status.Cancelled;
        emit MarketCancelled(marketId);
    }

    function claim(uint256 marketId) external nonReentrant returns (uint256 net) {
        Market storage market = _market(marketId);
        if (market.status != Status.Resolved) revert MarketNotResolvable(marketId);
        if (_settled[marketId][msg.sender]) revert AlreadySettled();

        uint256 winningStake = _positions[marketId][msg.sender][market.winningOption];
        if (winningStake == 0) revert NothingToClaim();

        uint256 gross = Math.mulDiv(
            winningStake,
            market.totalPool,
            _pools[marketId][market.winningOption]
        );
        uint256 profit = gross - winningStake;
        uint256 fee = Math.mulDiv(profit, market.feeBps, BPS_DENOMINATOR);
        net = gross - fee;

        _settled[marketId][msg.sender] = true;
        market.payoutsPaid += net;
        market.feesPaid += fee;

        if (fee != 0) settlementToken.safeTransfer(market.treasury, fee);
        settlementToken.safeTransfer(msg.sender, net);

        emit Claimed(marketId, msg.sender, gross, fee, net);
    }

    function refund(uint256 marketId) external nonReentrant returns (uint256 amount) {
        Market storage market = _market(marketId);
        if (market.status != Status.Cancelled) revert MarketNotResolvable(marketId);
        if (_settled[marketId][msg.sender]) revert AlreadySettled();

        for (uint8 option = 0; option < market.numOptions; ++option) {
            uint256 position = _positions[marketId][msg.sender][option];
            if (position != 0) {
                amount += position;
                _positions[marketId][msg.sender][option] = 0;
            }
        }
        if (amount == 0) revert NothingToWithdraw();

        _settled[marketId][msg.sender] = true;
        market.payoutsPaid += amount;
        settlementToken.safeTransfer(msg.sender, amount);

        emit Refunded(marketId, msg.sender, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Updates the fee only for markets created after this transaction.
    function setDefaultFee(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert InvalidFee(newFeeBps);
        uint16 previous = defaultFeeBps;
        defaultFeeBps = newFeeBps;
        emit DefaultFeeUpdated(previous, newFeeBps);
    }

    /// @notice Updates the treasury only for markets created after this transaction.
    function setDefaultTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        address previous = defaultTreasury;
        defaultTreasury = newTreasury;
        emit DefaultTreasuryUpdated(previous, newTreasury);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        Market storage market = _market(marketId);
        return market;
    }

    function poolOf(uint256 marketId, uint8 option) external view returns (uint256) {
        Market storage market = _market(marketId);
        if (option >= market.numOptions) revert InvalidOption(option);
        return _pools[marketId][option];
    }

    function positionOf(uint256 marketId, address user, uint8 option) external view returns (uint256) {
        Market storage market = _market(marketId);
        if (option >= market.numOptions) revert InvalidOption(option);
        return _positions[marketId][user][option];
    }

    function hasSettled(uint256 marketId, address user) external view returns (bool) {
        _market(marketId);
        return _settled[marketId][user];
    }

    /// @dev Prevents accidentally abandoning escrow administration and emergency controls.
    function renounceOwnership() public view override onlyOwner {
        revert OwnershipRenunciationDisabled();
    }

    function _market(uint256 marketId) private view returns (Market storage market) {
        if (marketId == 0 || marketId > marketCount) revert MarketNotFound(marketId);
        market = _markets[marketId];
    }

    function _requireOpen(uint256 marketId, Market storage market) private view {
        if (market.status != Status.Open || block.timestamp >= market.closeTime) revert MarketNotOpen(marketId);
    }
}
