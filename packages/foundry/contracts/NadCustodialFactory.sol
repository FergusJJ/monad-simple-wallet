// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NadCustodial.sol";

contract NadCustodialFactory {
    mapping(address => address) public userContracts;
    event ContractDeployed(address indexed user, address contractAddress);

    error ContractAlreadyExists();
    error ZeroAddressNotAllowed();

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

    function getUserContract(address user) external view returns (address) {
        if (user == address(0)) revert ZeroAddressNotAllowed();
        return userContracts[user];
    }
}
