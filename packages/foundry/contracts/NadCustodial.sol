// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NadCustodial - A secure custodial contract for ETH and ERC20 tokens
/// @author You
/// @notice This contract allows users to deposit and withdraw ETH and ERC20 tokens
contract NadCustodial is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    /// @notice List of all registered token addresses
    address[] private tokens;
    /// @notice Tracks which tokens are blocked from being used
    mapping(address => bool) private blockedTokens;
    /// @notice Tracks which tokens are registered in the contract
    mapping(address => bool) private registeredTokens;
    /// @notice Tracks token balances
    mapping(address => uint256) private balances;

    /// @notice Emitted when ETH is deposited
    event EthDeposit(address indexed sender, uint256 amount);
    /// @notice Emitted when ETH is withdrawn
    event EthWithdrawal(address indexed recipient, uint256 amount);
    /// @notice Emitted when tokens are deposited
    event TokenDeposit(
        address indexed sender,
        address indexed token,
        uint256 amount
    );
    /// @notice Emitted when tokens are withdrawn
    event TokenWithdrawal(
        address indexed recipient,
        address indexed token,
        uint256 amount
    );
    /// @notice Emitted when contract is paused
    event ContractPaused(address indexed owner);
    /// @notice Emitted when contract is unpaused
    event ContractUnpaused(address indexed owner);
    /// @notice Emitted when a token's blocked status changes
    event TokenBlockStatusChanged(address indexed token, bool isBlocked);

    /// @notice Error for zero amount operations
    error AmountZero();
    /// @notice Error for blocked token operations
    error BlockedToken();
    /// @notice Error for insufficient balance operations
    error InsufficientBalance(uint256 requested, uint256 available);
    /// @notice Error for invalid recipient address
    error InvalidRecipient();
    /// @notice Error for failed transfers
    error TransferFailed();

    constructor(address factoryCaller) Ownable(factoryCaller) {}

    /// @notice Receives ETH deposits
    /// @custom:throws AmountZero if deposit amount is 0
    receive() external payable whenNotPaused {
        if (msg.value == 0) revert AmountZero();
        emit EthDeposit(msg.sender, msg.value);
    }

    /// @notice Withdraws ETH to owner
    /// @param amount Amount to withdraw
    /// @custom:throws AmountZero if amount is 0
    /// @custom:throws InsufficientBalance if contract balance is too low
    /// @custom:throws TransferFailed if ETH transfer fails
    function withdraw(
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        if (address(this).balance < amount) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit EthWithdrawal(msg.sender, amount);
    }

    /// @notice Sends ETH to specified address
    /// @param recipient Address to receive ETH
    /// @param amount Amount to send
    /// @custom:throws AmountZero if amount is 0
    /// @custom:throws InvalidRecipient if recipient is zero address
    /// @custom:throws InsufficientBalance if contract balance is too low
    /// @custom:throws TransferFailed if ETH transfer fails
    function send(
        address recipient,
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        if (recipient == address(0)) revert InvalidRecipient();
        if (address(this).balance < amount) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit EthWithdrawal(recipient, amount);
    }

    /// @notice Receives ERC20 tokens
    /// @param token_ Token contract address
    /// @param amount Amount to receive
    /// @custom:throws AmountZero if amount is 0
    /// @custom:throws BlockedToken if token is blocked
    function receiveToken(
        address token_,
        uint256 amount
    ) external whenNotPaused {
        if (amount == 0) revert AmountZero();
        if (blockedTokens[token_]) revert BlockedToken();
        if (!registeredTokens[token_]) {
            registeredTokens[token_] = true;
            tokens.push(token_);
        }
        IERC20(token_).safeTransferFrom(msg.sender, address(this), amount);
        unchecked {
            balances[token_] += amount;
        }
        emit TokenDeposit(msg.sender, token_, amount);
    }

    /// @notice Withdraws tokens to owner
    /// @param token_ Token contract address
    /// @param amount Amount to withdraw
    /// @custom:throws AmountZero if amount is 0
    /// @custom:throws InsufficientBalance if token balance is too low
    function withdrawToken(
        address token_,
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        if (balances[token_] < amount) {
            revert InsufficientBalance(amount, balances[token_]);
        }
        unchecked {
            balances[token_] -= amount;
        }
        IERC20(token_).safeTransfer(owner(), amount);
        emit TokenWithdrawal(msg.sender, token_, amount);
    }

    /// @notice Sends tokens to specified address
    /// @param recipient Address to receive tokens
    /// @param token_ Token contract address
    /// @param amount Amount to send
    /// @custom:throws AmountZero if amount is 0
    /// @custom:throws InvalidRecipient if recipient is zero address
    /// @custom:throws InsufficientBalance if token balance is too low
    function sendToken(
        address recipient,
        address token_,
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        if (recipient == address(0)) revert InvalidRecipient();
        if (balances[token_] < amount) {
            revert InsufficientBalance(amount, balances[token_]);
        }
        unchecked {
            balances[token_] -= amount;
        }
        IERC20(token_).safeTransfer(recipient, amount);
        emit TokenWithdrawal(recipient, token_, amount);
    }

    /// @notice Registers new token and syncs balance
    /// @param token_ Token contract address
    /// @custom:throws BlockedToken if token is blocked
    function registerToken(address token_) external whenNotPaused {
        if (blockedTokens[token_]) revert BlockedToken();
        if (!registeredTokens[token_]) {
            registeredTokens[token_] = true;
            tokens.push(token_);
        }

        uint256 currentBalance = IERC20(token_).balanceOf(address(this));
        balances[token_] = currentBalance;
    }

    /// @notice Sets token blocking status
    /// @param token_ Token contract address
    /// @param isBlock New blocking status
    function setTokenBlocked(address token_, bool isBlock) external onlyOwner {
        blockedTokens[token_] = isBlock;
        emit TokenBlockStatusChanged(token_, isBlock);
    }

    /// @notice Checks if a token is blocked
    /// @param token_ Token contract address
    /// @return Whether token is blocked
    function isBlockedToken(address token_) external view returns (bool) {
        return blockedTokens[token_];
    }

    /// @notice Gets token balance
    /// @param token_ Token contract address
    /// @return Current balance
    function getTokenBalance(address token_) external view returns (uint256) {
        return balances[token_];
    }

    /// @notice Gets list of registered tokens
    /// @return Array of token addresses
    function getTokens() external view returns (address[] memory) {
        return tokens;
    }

    /// @notice Pauses contract operations
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(owner());
    }

    /// @notice Unpauses contract operations
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(owner());
    }
}
