// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NadCustodial is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    address[] private tokens;
    mapping(address => bool) private blockedTokens;
    mapping(address => bool) private registeredTokens;
    mapping(address => uint256) private balances;

    event EthDeposit(address indexed sender, uint256 amount);
    event EthWithdrawal(address indexed recipient, uint256 amount);
    event TokenDeposit(
        address indexed sender,
        address indexed token,
        uint256 amount
    );
    event TokenWithdrawal(
        address indexed recipient,
        address indexed token,
        uint256 amount
    );
    event ContractPaused(address indexed owner);
    event ContractUnpaused(address indexed owner);
    event TokenBlockStatusChanged(address indexed token, bool isBlocked);

    error AmountZero();
    error BlockedToken();
    error InsufficientBalance(uint256 requested, uint256 available);
    error InvalidRecipient();
    error TransferFailed();

    constructor() Ownable(msg.sender) {}

    receive() external payable whenNotPaused {
        if (msg.value == 0) revert AmountZero();
        emit EthDeposit(msg.sender, msg.value);
    }

    function withdraw(
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        if (address(this).balance < amount) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit EthWithdrawal(owner(), amount);
    }

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
        emit TokenWithdrawal(owner(), token_, amount);
    }

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

    function setTokenBlocked(address token_, bool isBlock) external onlyOwner {
        blockedTokens[token_] = isBlock;
        emit TokenBlockStatusChanged(token_, isBlock);
    }

    function isBlockedToken(address token_) external view returns (bool) {
        return blockedTokens[token_];
    }

    function getTokenBalance(address token_) external view returns (uint256) {
        return balances[token_];
    }

    function getTokens() external view returns (address[] memory) {
        return tokens;
    }

    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(owner());
    }

    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(owner());
    }
}
