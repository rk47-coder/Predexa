// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet-only USDC-like token. Never deploy this token for production collateral.
contract MockUSDC is ERC20 {
    constructor(address recipient) ERC20("Mock USDC", "mUSDC") {
        _mint(recipient, 1_000_000_000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
