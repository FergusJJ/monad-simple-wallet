// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NadCustodial.sol";

/// @title NadCustodialFactory - A factory for NadCustodial smart contracts
/// @author Fergus
/// @notice This contract allows users to deploy their own custodial wallets and lookup existing ones
contract NadCustodialFactory {
    /// @notice Mapping of user addresses to their deployed contract addresses
    /// @dev Uses address(0) as default value for non-existent contracts
    mapping(address => address) public userContracts;

    /// @notice Emitted when a new contract is deployed
    /// @param user Address of the user who deployed the contract
    /// @param contractAddress Address of the deployed contract
    event ContractDeployed(address indexed user, address contractAddress);

    /// @notice Error thrown when user tries to deploy more than once
    error ContractAlreadyExists();

    /// @notice Error thrown when zero address is provided for lookup
    error ZeroAddressNotAllowed();

    /// @notice Deploys a new NadCustodial contract
    /// @return address The address of the newly deployed contract
    /// @custom:throws ContractAlreadyExists if caller already has a contract
    function deployContract() external returns (address) {
        if (userContracts[msg.sender] != address(0))
            revert ContractAlreadyExists();

        NadCustodial newContract = new NadCustodial{
            salt: bytes32(uint256(uint160(msg.sender)))
        }(msg.sender);

        address contractAddress = address(newContract);
        userContracts[msg.sender] = contractAddress;

        emit ContractDeployed(msg.sender, contractAddress);
        return contractAddress;
    }

    /// @notice Retrieves the custodial contract address for a given user
    /// @dev Returns address(0) if no contract exists for the user
    /// @param user Address of the user whose contract address you want to lookup
    /// @return address The address of the user's contract
    /// @custom:throws ZeroAddressNotAllowed if zero address is provided
    function getUserContract(address user) external view returns (address) {
        if (user == address(0)) revert ZeroAddressNotAllowed();
        return userContracts[user];
    }
}
