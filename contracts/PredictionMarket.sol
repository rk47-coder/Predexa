// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice A collateralized binary prediction market with transferable ERC-1155 outcome shares.
/// @dev One complete set equals one collateral unit and contains one YES and one NO share.
contract PredictionMarket is ERC1155, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant YES = 0;
    uint256 public constant NO = 1;

    enum Outcome {
        Unresolved,
        Yes,
        No,
        Invalid
    }

    error OnlyFactory();
    error OnlyResolver();
    error TradingClosed();
    error TradingStillOpen();
    error MarketAlreadyResolved();
    error MarketUnresolved();
    error InvalidOutcome();
    error ZeroAmount();

    IERC20 public immutable collateralToken;
    address public immutable factory;
    address public immutable resolver;
    uint64 public immutable tradingClosesAt;
    uint64 public immutable resolutionDeadline;

    string public question;
    string public category;
    string public description;
    string public resolutionSource;
    string public resolutionCriteria;

    Outcome public outcome;

    event CompleteSetMinted(address indexed account, uint256 collateralAmount);
    event CompleteSetMerged(address indexed account, uint256 collateralAmount);
    event MarketResolved(Outcome indexed outcome, uint64 resolvedAt);
    event SharesRedeemed(address indexed account, uint256 yesShares, uint256 noShares, uint256 payout);

    constructor(
        address collateralToken_,
        address resolver_,
        uint64 tradingClosesAt_,
        uint64 resolutionDeadline_,
        string memory question_,
        string memory category_,
        string memory description_,
        string memory resolutionSource_,
        string memory resolutionCriteria_
    ) ERC1155("") {
        collateralToken = IERC20(collateralToken_);
        factory = msg.sender;
        resolver = resolver_;
        tradingClosesAt = tradingClosesAt_;
        resolutionDeadline = resolutionDeadline_;
        question = question_;
        category = category_;
        description = description_;
        resolutionSource = resolutionSource_;
        resolutionCriteria = resolutionCriteria_;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    modifier onlyResolver() {
        if (msg.sender != resolver) revert OnlyResolver();
        _;
    }

    modifier whileTradingOpen() {
        if (block.timestamp >= tradingClosesAt) revert TradingClosed();
        _;
    }

    /// @notice Adds initial inventory paid for by the factory owner during market creation.
    function seedInitialLiquidity(address provider, uint256 collateralAmount) external onlyFactory {
        if (collateralAmount == 0) return;
        _mint(provider, YES, collateralAmount, "");
        _mint(provider, NO, collateralAmount, "");
        emit CompleteSetMinted(provider, collateralAmount);
    }

    /// @notice Deposits collateral and mints matching transferable YES and NO shares.
    function mintCompleteSets(uint256 collateralAmount) external nonReentrant whileTradingOpen {
        if (collateralAmount == 0) revert ZeroAmount();
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralAmount);
        _mint(msg.sender, YES, collateralAmount, "");
        _mint(msg.sender, NO, collateralAmount, "");
        emit CompleteSetMinted(msg.sender, collateralAmount);
    }

    /// @notice Burns matching YES and NO shares to recover collateral before trading closes.
    function mergeCompleteSets(uint256 collateralAmount) external nonReentrant whileTradingOpen {
        if (collateralAmount == 0) revert ZeroAmount();
        _burn(msg.sender, YES, collateralAmount);
        _burn(msg.sender, NO, collateralAmount);
        collateralToken.safeTransfer(msg.sender, collateralAmount);
        emit CompleteSetMerged(msg.sender, collateralAmount);
    }

    /// @notice Resolves the market after trading closes. Invalid gives each side a 50% payout.
    function resolve(Outcome outcome_) external onlyResolver {
        if (block.timestamp < tradingClosesAt) revert TradingStillOpen();
        if (outcome != Outcome.Unresolved) revert MarketAlreadyResolved();
        if (outcome_ == Outcome.Unresolved) revert InvalidOutcome();
        outcome = outcome_;
        emit MarketResolved(outcome_, uint64(block.timestamp));
    }

    /// @notice Redeems winning shares for the collateral held by this market.
    function redeem() external nonReentrant {
        Outcome resolvedOutcome = outcome;
        if (resolvedOutcome == Outcome.Unresolved) revert MarketUnresolved();

        uint256 yesShares = balanceOf(msg.sender, YES);
        uint256 noShares = balanceOf(msg.sender, NO);
        uint256 payout;

        if (resolvedOutcome == Outcome.Yes) {
            payout = yesShares;
            if (yesShares != 0) _burn(msg.sender, YES, yesShares);
        } else if (resolvedOutcome == Outcome.No) {
            payout = noShares;
            if (noShares != 0) _burn(msg.sender, NO, noShares);
        } else {
            payout = (yesShares + noShares) / 2;
            if (yesShares != 0) _burn(msg.sender, YES, yesShares);
            if (noShares != 0) _burn(msg.sender, NO, noShares);
        }

        if (payout == 0) revert ZeroAmount();
        collateralToken.safeTransfer(msg.sender, payout);
        emit SharesRedeemed(msg.sender, yesShares, noShares, payout);
    }
}
