// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PredictionMarket} from "./PredictionMarket.sol";

/// @notice The only contract permitted to create Predexa markets.
/// @dev Ownership should be transferred to a multisig before any production deployment.
contract PredictionMarketFactory is Ownable2Step {
    using SafeERC20 for IERC20;

    struct CreateMarketParams {
        string question;
        string category;
        string description;
        string resolutionSource;
        string resolutionCriteria;
        uint64 tradingClosesAt;
        uint64 resolutionDeadline;
        uint256 initialLiquidity;
    }

    error EmptyQuestion();
    error EmptyResolutionRules();
    error InvalidTradingClose();
    error InvalidResolutionDeadline();

    IERC20 public immutable collateralToken;
    address[] private _markets;
    mapping(address market => bool) public isPredexaMarket;

    event MarketCreated(
        address indexed market,
        uint256 indexed marketId,
        string question,
        string category,
        uint64 tradingClosesAt,
        uint64 resolutionDeadline,
        uint256 initialLiquidity
    );

    constructor(address initialOwner, address collateralToken_) Ownable(initialOwner) {
        collateralToken = IERC20(collateralToken_);
    }

    function createMarket(CreateMarketParams calldata params) external onlyOwner returns (address marketAddress) {
        if (bytes(params.question).length == 0) revert EmptyQuestion();
        if (bytes(params.resolutionSource).length == 0 || bytes(params.resolutionCriteria).length == 0) {
            revert EmptyResolutionRules();
        }
        if (params.tradingClosesAt <= block.timestamp) revert InvalidTradingClose();
        if (params.resolutionDeadline < params.tradingClosesAt) revert InvalidResolutionDeadline();

        PredictionMarket market = new PredictionMarket(
            address(collateralToken),
            owner(),
            params.tradingClosesAt,
            params.resolutionDeadline,
            params.question,
            params.category,
            params.description,
            params.resolutionSource,
            params.resolutionCriteria
        );

        marketAddress = address(market);
        _markets.push(marketAddress);
        isPredexaMarket[marketAddress] = true;

        if (params.initialLiquidity != 0) {
            collateralToken.safeTransferFrom(msg.sender, marketAddress, params.initialLiquidity);
            market.seedInitialLiquidity(msg.sender, params.initialLiquidity);
        }

        emit MarketCreated(
            marketAddress,
            _markets.length - 1,
            params.question,
            params.category,
            params.tradingClosesAt,
            params.resolutionDeadline,
            params.initialLiquidity
        );
    }

    function marketCount() external view returns (uint256) {
        return _markets.length;
    }

    function marketAt(uint256 index) external view returns (address) {
        return _markets[index];
    }
}
