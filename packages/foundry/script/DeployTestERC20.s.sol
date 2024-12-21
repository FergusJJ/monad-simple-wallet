// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {console} from "forge-std/console.sol";
import {Script} from "forge-std/Script.sol";
import {TestERC20} from "../contracts/TestERC20.sol";

contract DeployTestERC20 is Script {
    function run() external {
        vm.startBroadcast();
        TestERC20 token = new TestERC20(
            "TestC20", // name
            "TEST", // symbol
            1_000_000_000 // initial supply
        );

        console.log("TestToken deployed at:", address(token));

        vm.stopBroadcast();
    }
}
